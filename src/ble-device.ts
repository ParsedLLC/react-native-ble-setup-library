import { Characteristic, Device } from 'react-native-ble-plx';
import { EventEmitter } from 'events';
import * as aesjs from 'aes-js';
import { uniqBy } from 'lodash';
import 'fastestsmallesttextencoderdecoder';
import { BleControlRequestChannel, Stream, Env, Aes128Cipher } from '@particle/ecjpake';
import { InvalidProtocolVersionError, MissingCharacteristicsError, UnreadableReceiveCharacteristicError, UnreadableVersionCharacteristicError, UnwritableTransmitCharacteristicError } from './errors';
import { UUIDs } from './types';
import { atoi } from './utils';
import DeviceRequests, { INetwork } from './requests';

export const maxPacketSize = 244;

class ReactNativeAes128Cipher implements Aes128Cipher {
	_ciph: aesjs.ModeOfOperation.ModeOfOperationECB;

	constructor(key: Uint8Array) {
		if (key.length !== 16) {
			throw new Error('Invalid key length');
		}
		this._ciph = new aesjs.ModeOfOperation.ecb(key);
	}

	async encryptBlock(block: Uint8Array): Promise<Uint8Array> {
		if (block.length !== 16) {
			throw new Error('Invalid block length');
		}
		return this._ciph.encrypt(block);
	}
}

class ReactNativeEnv implements Env {
	randomBytes;
	
	constructor() {
		// We need to require it on demand to easily mock it in the tests
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { randomBytes } = require('react-native-randombytes');
		this.randomBytes = randomBytes;
	}
	
	createAes128Cipher(key: Uint8Array) {
		return new ReactNativeAes128Cipher(key);
	}

	async getRandomBytes(size: number): Promise<Uint8Array> {
		return new Promise((resolve, reject) => {
			this.randomBytes(size, (err: Error, bytes: Buffer) => {
				if (err) {
					return reject(err);
				}
				resolve(bytes);
			});
		});
	}
}

class StreamWithCallback extends EventEmitter {
	callback: (data: Uint8Array) => void;
	constructor(callback: (data: Uint8Array) => void) {
		super();
		this.callback = callback;
	}
	write(data: Uint8Array): void {
		this.callback(data);
	}
}

export class BLEDevice {
	device: Device;
	versionCharacteristic?: Characteristic;
	txCharacteristic?: Characteristic;
	rxCharacteristic?: Characteristic;
	requestChannel?: BleControlRequestChannel;
	deviceRequests?: DeviceRequests;
	stream?: Stream;
	env: ReactNativeEnv;
	uuids: UUIDs;

	constructor(device: Device, uuids: UUIDs) {
		this.device = device;
		this.env = new ReactNativeEnv();
		this.uuids = uuids;
	}

	async connect(mobileSecret: string): Promise<void> {
		await this.device.connect();
		await this.findCharacteristics(this.uuids);
		await this.checkProtocolVersion();
		await this.openControlRequestChannel(mobileSecret);
	}

	async disconnect(): Promise<void> {
		await this.closeControlRequestChannel();
		this.versionCharacteristic = undefined;
		this.rxCharacteristic = undefined;
		this.txCharacteristic = undefined;
		await this.device.cancelConnection();
	}

	get name(): string|undefined {
		if (this.device.name) {
			return this.device.name;
		}
	}

	async findCharacteristics({
		serviceUUID, versionCharacteristicUUID, rxCharacteristicUUID, txCharacteristicUUID
	}: UUIDs): Promise<void> {
		await this.device.discoverAllServicesAndCharacteristics();
		const services = await this.device.services();
		console.log(`Found ${services?.length} services`);
		const characteristics = await this.device.characteristicsForService(serviceUUID);
		console.log(`Found ${characteristics?.length} characteristics`);

		this.versionCharacteristic = characteristics.find((c) => c.uuid === versionCharacteristicUUID);
		this.rxCharacteristic = characteristics.find((c) => c.uuid === rxCharacteristicUUID);
		this.txCharacteristic = characteristics.find((c) => c.uuid === txCharacteristicUUID);

		if (!this.versionCharacteristic || !this.rxCharacteristic || !this.txCharacteristic) {
			throw new MissingCharacteristicsError();
		}

		if (!this.versionCharacteristic.isReadable) {
			throw new UnreadableVersionCharacteristicError();
		}

		if (!this.rxCharacteristic.isNotifiable) {
			throw new UnreadableReceiveCharacteristicError();
		}

		if (!this.txCharacteristic.isWritableWithoutResponse && !this.txCharacteristic.isWritableWithoutResponse) {
			throw new UnwritableTransmitCharacteristicError();
		}
	}

	async getVersion(): Promise<number> {
		if (!this.versionCharacteristic) {
			throw new MissingCharacteristicsError();
		}
		const readCharacteristic = await this.versionCharacteristic.read();
		if (!readCharacteristic.value) {
			throw new InvalidProtocolVersionError();
		}
		return atoi(readCharacteristic.value);
	}

	async checkProtocolVersion(): Promise<void> {
		const protocolVersion = await this.getVersion();
		if (protocolVersion !== 2) {
			throw new InvalidProtocolVersionError();
		}
	}

	async openControlRequestChannel(mobileSecret: string): Promise<void> {
		this.stream = new StreamWithCallback(async (buffer: Uint8Array) => {
			while (buffer.length > maxPacketSize) {
				const slice = buffer.slice(0, maxPacketSize);
				await this.txCharacteristic?.writeWithoutResponse(Buffer.from(slice).toString('base64'));
				buffer = buffer.slice(maxPacketSize);
			}
			await this.txCharacteristic?.writeWithoutResponse(Buffer.from(buffer).toString('base64'));
		});

		this.rxCharacteristic?.monitor(async (error, characteristic) => {
			if (error) {
				console.warn('Error while monitoring characteristic', error);
			}
			if (!characteristic?.value) {
				return;
			}
			const data = Buffer.from(characteristic.value, 'base64');
			this.stream?.emit('data', data);
		});

		this.requestChannel = new BleControlRequestChannel({
			stream: this.stream,
			secret: mobileSecret,
			env: this.env
		});
		this.requestChannel?.on('error', (error: Error) => {
			console.warn(error);
		});
		await this.requestChannel?.open();
		this.deviceRequests = new DeviceRequests(this.requestChannel);
	}

	async closeControlRequestChannel(): Promise<void> {
		this.deviceRequests = undefined;
		this.requestChannel?.close();
		this.requestChannel = undefined;
	}

	async scanNetworks(): Promise<INetwork[]> {
		if (!this.deviceRequests) {
			return [];
		}
		let networks = await this.deviceRequests?.scanNetworks();
		// Filter invalid names
		networks = networks.filter((network) => network.ssid);
		// Dedupe
		networks = uniqBy(networks, (network) => network.ssid);
		return networks;
	}

	async joinNewNetwork(network: INetwork, password?: string): Promise<void> {
		if (!this.deviceRequests) {
			return;
		}
		await this.deviceRequests?.joinNewNetwork(network, password);
	}

	onDisconnect(listener: (error: Error | null) => void): void {
		this.device.onDisconnected(async (error) => {
			this.disconnect();
			listener(error);
		});
	}
}

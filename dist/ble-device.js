var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EventEmitter } from 'events';
import * as aesjs from 'aes-js';
import { uniqBy } from 'lodash';
import 'fastestsmallesttextencoderdecoder';
import { BleControlRequestChannel } from '@particle/ecjpake';
import { InvalidProtocolVersionError, MissingCharacteristicsError, UnreadableReceiveCharacteristicError, UnreadableVersionCharacteristicError, UnwritableTransmitCharacteristicError } from './errors';
import { atoi } from './utils';
import DeviceRequests from './requests';
export const maxPacketSize = 244;
class ReactNativeAes128Cipher {
    constructor(key) {
        if (key.length !== 16) {
            throw new Error('Invalid key length');
        }
        this._ciph = new aesjs.ModeOfOperation.ecb(key);
    }
    encryptBlock(block) {
        return __awaiter(this, void 0, void 0, function* () {
            if (block.length !== 16) {
                throw new Error('Invalid block length');
            }
            return this._ciph.encrypt(block);
        });
    }
}
class ReactNativeEnv {
    constructor() {
        // We need to require it on demand to easily mock it in the tests
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { randomBytes } = require('react-native-randombytes');
        this.randomBytes = randomBytes;
    }
    createAes128Cipher(key) {
        return new ReactNativeAes128Cipher(key);
    }
    getRandomBytes(size) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.randomBytes(size, (err, bytes) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(bytes);
                });
            });
        });
    }
}
class StreamWithCallback extends EventEmitter {
    constructor(callback) {
        super();
        this.callback = callback;
    }
    write(data) {
        this.callback(data);
    }
}
export class BLEDevice {
    constructor(device, uuids) {
        this.device = device;
        this.env = new ReactNativeEnv();
        this.uuids = uuids;
    }
    connect(mobileSecret) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.device.connect();
            yield this.findCharacteristics(this.uuids);
            yield this.checkProtocolVersion();
            yield this.openControlRequestChannel(mobileSecret);
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.closeControlRequestChannel();
            this.versionCharacteristic = undefined;
            this.rxCharacteristic = undefined;
            this.txCharacteristic = undefined;
            yield this.device.cancelConnection();
        });
    }
    get name() {
        if (this.device.name) {
            return this.device.name;
        }
    }
    findCharacteristics({ serviceUUID, versionCharacteristicUUID, rxCharacteristicUUID, txCharacteristicUUID }) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.device.discoverAllServicesAndCharacteristics();
            const services = yield this.device.services();
            console.log(`Found ${services === null || services === void 0 ? void 0 : services.length} services`);
            const characteristics = yield this.device.characteristicsForService(serviceUUID);
            console.log(`Found ${characteristics === null || characteristics === void 0 ? void 0 : characteristics.length} characteristics`);
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
        });
    }
    getVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.versionCharacteristic) {
                throw new MissingCharacteristicsError();
            }
            const readCharacteristic = yield this.versionCharacteristic.read();
            if (!readCharacteristic.value) {
                throw new InvalidProtocolVersionError();
            }
            return atoi(readCharacteristic.value);
        });
    }
    checkProtocolVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            const protocolVersion = yield this.getVersion();
            if (protocolVersion !== 2) {
                throw new InvalidProtocolVersionError();
            }
        });
    }
    openControlRequestChannel(mobileSecret) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            this.stream = new StreamWithCallback((buffer) => __awaiter(this, void 0, void 0, function* () {
                var _d, _e;
                while (buffer.length > maxPacketSize) {
                    const slice = buffer.slice(0, maxPacketSize);
                    yield ((_d = this.txCharacteristic) === null || _d === void 0 ? void 0 : _d.writeWithoutResponse(Buffer.from(slice).toString('base64')));
                    buffer = buffer.slice(maxPacketSize);
                }
                yield ((_e = this.txCharacteristic) === null || _e === void 0 ? void 0 : _e.writeWithoutResponse(Buffer.from(buffer).toString('base64')));
            }));
            (_a = this.rxCharacteristic) === null || _a === void 0 ? void 0 : _a.monitor((error, characteristic) => __awaiter(this, void 0, void 0, function* () {
                var _f;
                if (error) {
                    console.warn('Error while monitoring characteristic', error);
                }
                if (!(characteristic === null || characteristic === void 0 ? void 0 : characteristic.value)) {
                    return;
                }
                const data = Buffer.from(characteristic.value, 'base64');
                (_f = this.stream) === null || _f === void 0 ? void 0 : _f.emit('data', data);
            }));
            this.requestChannel = new BleControlRequestChannel({
                stream: this.stream,
                secret: mobileSecret,
                env: this.env
            });
            (_b = this.requestChannel) === null || _b === void 0 ? void 0 : _b.on('error', (error) => {
                console.warn(error);
            });
            yield ((_c = this.requestChannel) === null || _c === void 0 ? void 0 : _c.open());
            this.deviceRequests = new DeviceRequests(this.requestChannel);
        });
    }
    closeControlRequestChannel() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            this.deviceRequests = undefined;
            (_a = this.requestChannel) === null || _a === void 0 ? void 0 : _a.close();
            this.requestChannel = undefined;
        });
    }
    scanNetworks() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.deviceRequests) {
                return [];
            }
            let networks = yield ((_a = this.deviceRequests) === null || _a === void 0 ? void 0 : _a.scanNetworks());
            // Filter invalid names
            networks = networks.filter((network) => network.ssid);
            // Dedupe
            networks = uniqBy(networks, (network) => network.ssid);
            return networks;
        });
    }
    joinNewNetwork(network, password) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.deviceRequests) {
                return;
            }
            yield ((_a = this.deviceRequests) === null || _a === void 0 ? void 0 : _a.joinNewNetwork(network, password));
        });
    }
    onDisconnect(listener) {
        this.device.onDisconnected((error) => __awaiter(this, void 0, void 0, function* () {
            this.disconnect();
            listener(error);
        }));
    }
}

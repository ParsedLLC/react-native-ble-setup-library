import { Characteristic, Device } from 'react-native-ble-plx';
import * as aesjs from 'aes-js';
import 'fastestsmallesttextencoderdecoder';
import { BleControlRequestChannel, Stream, Env, Aes128Cipher } from '@particle/ecjpake';
import { UUIDs } from './types';
import DeviceRequests, { INetwork } from './requests';
export declare const maxPacketSize = 244;
declare class ReactNativeAes128Cipher implements Aes128Cipher {
    _ciph: aesjs.ModeOfOperation.ModeOfOperationECB;
    constructor(key: Uint8Array);
    encryptBlock(block: Uint8Array): Promise<Uint8Array>;
}
declare class ReactNativeEnv implements Env {
    randomBytes: any;
    constructor();
    createAes128Cipher(key: Uint8Array): ReactNativeAes128Cipher;
    getRandomBytes(size: number): Promise<Uint8Array>;
}
export declare class BLEDevice {
    device: Device;
    versionCharacteristic?: Characteristic;
    txCharacteristic?: Characteristic;
    rxCharacteristic?: Characteristic;
    requestChannel?: BleControlRequestChannel;
    deviceRequests?: DeviceRequests;
    stream?: Stream;
    env: ReactNativeEnv;
    uuids: UUIDs;
    constructor(device: Device, uuids: UUIDs);
    connect(mobileSecret: string): Promise<void>;
    disconnect(): Promise<void>;
    get name(): string | undefined;
    findCharacteristics({ serviceUUID, versionCharacteristicUUID, rxCharacteristicUUID, txCharacteristicUUID }: UUIDs): Promise<void>;
    getVersion(): Promise<number>;
    checkProtocolVersion(): Promise<void>;
    openControlRequestChannel(mobileSecret: string): Promise<void>;
    closeControlRequestChannel(): Promise<void>;
    scanNetworks(): Promise<INetwork[]>;
    joinNewNetwork(network: INetwork, password?: string): Promise<void>;
    onDisconnect(listener: (error: Error | null) => void): void;
}
export {};

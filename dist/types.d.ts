/// <reference types="react" />
import { BleManager } from 'react-native-ble-plx';
import { BLEDevice } from './ble-device';
import { INetwork } from './requests';
export declare enum BLEStatus {
    Unknown = 0,
    Resetting = 1,
    Unsupported = 2,
    Unauthorized = 3,
    PoweredOff = 4,
    PoweredOn = 5
}
export declare enum ConnectionStatus {
    Disconnected = 0,
    Connecting = 1,
    Connected = 2,
    Disconnecting = 3
}
export interface SearchDevicesArguments {
    setupCode: string;
    timeout?: number;
}
export interface SetupContextType {
    status: BLEStatus;
    device?: BLEDevice;
    connectionStatus: ConnectionStatus;
    searchDevices: ({ setupCode, timeout }: SearchDevicesArguments) => void;
    isSearchingDevices: boolean;
    connect: (mobileSecret: string) => Promise<void>;
    disconnect: () => Promise<void>;
    scanForWiFiNetworks: () => void;
    isScanningWiFiNetworks: boolean;
    foundWiFiNetworks: INetwork[];
    joinWiFiNetwork: (network: INetwork, password?: string) => void;
    isJoiningWiFiNetwork: boolean;
    error?: Error;
    clearLastError: () => void;
}
export interface UUIDs {
    serviceUUID: string;
    versionCharacteristicUUID: string;
    rxCharacteristicUUID: string;
    txCharacteristicUUID: string;
}
export interface SetupContextOptions extends UUIDs {
    children: React.ReactNode;
    manager: BleManager;
}

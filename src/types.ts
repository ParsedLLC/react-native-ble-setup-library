import { BleManager } from 'react-native-ble-plx';
import { BLEDevice } from './ble-device';
import { INetwork } from './requests';

export enum BLEStatus {
	Unknown,
	Resetting,
	Unsupported,
	Unauthorized,
	PoweredOff,
	PoweredOn
}

export enum ConnectionStatus {
	Disconnected,
	Connecting,
	Connected,
	Disconnecting
}

export interface SearchDevicesArguments {
    setupCode: string,
    timeout?: number
}

export interface SetupContextType {
	status: BLEStatus,
    device?: BLEDevice,
	connectionStatus: ConnectionStatus,
    searchDevices: ({ setupCode, timeout }: SearchDevicesArguments) => void,
    isSearchingDevices: boolean,
	connect: (mobileSecret: string) => Promise<void>,
	disconnect: () => Promise<void>,
	scanForWiFiNetworks: () => void,
	isScanningWiFiNetworks: boolean,
	foundWiFiNetworks: INetwork[],
	joinWiFiNetwork: (network: INetwork, password?: string) => void,
	isJoiningWiFiNetwork: boolean,
	error?: Error,
	clearLastError: () => void,
}

export interface UUIDs {
	serviceUUID: string,
	versionCharacteristicUUID: string,
	rxCharacteristicUUID: string,
	txCharacteristicUUID: string
}

export interface SetupContextOptions extends UUIDs {
	children: React.ReactNode,
	manager: BleManager
}

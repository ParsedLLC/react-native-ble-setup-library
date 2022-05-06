import React, { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { State, Device } from 'react-native-ble-plx';
import { upon } from '@particle/async-utils';
import { atob } from './utils';
import { BLEStatus, SetupContextType, SetupContextOptions, SearchDevicesArguments, ConnectionStatus } from './types';
import { BLEDevice } from './ble-device';
import { INetwork } from './requests';

const defaultState = {
	status: BLEStatus.Unknown,
	connectionStatus: ConnectionStatus.Disconnected,
	searchDevices: () => {}, // eslint-disable-line
	isSearchingDevices: false,
	connect: async () => {}, // eslint-disable-line
	disconnect: async () => {}, // eslint-disable-line
	scanForWiFiNetworks: () => {}, // eslint-disable-line
	isScanningWiFiNetworks: false,
	foundWiFiNetworks: [],
	joinWiFiNetwork: () => {}, // eslint-disable-line
	isJoiningWiFiNetwork: false,
	clearLastError: () => {}, // eslint-disable-line
};

const supportsBLE = Platform.select({ web: false, default: true });
/**
 * React Context containing the BLE setup process
 */
export const SetupContext = React.createContext<SetupContextType>(defaultState);

/**
 * Ensures that all OS permissions have been granted to the app. It will trigger
 * a dialog asking to allow precise location (this is required for the BLE) if the user
 * hasn't approve it before.
 *
 * @private
 * @returns {Promise<boolean>} `true` if the permissions were granted
 */
export const ensureAndroidPermissions = async (): Promise<boolean> => {
	if (Platform.OS !== 'android') {
		return true;
	}
	const granted = await PermissionsAndroid.request(
		PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
		{
			title: 'Location Permission',
			message: 'This app needs location information to search for BLE devices',
			buttonNeutral: 'Ask Me Later',
			buttonNegative: 'Cancel',
			buttonPositive: 'OK'
		}
	);
	return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const setBLEStatus = (setStatus: React.Dispatch<React.SetStateAction<BLEStatus>>) => {
	return async (state: State): Promise<void> => {
		switch (state) {
			case State.PoweredOff:
				setStatus(BLEStatus.PoweredOff);
				break;

			case State.PoweredOn:
				await ensureAndroidPermissions() ?
					setStatus(BLEStatus.PoweredOn) :
					setStatus(BLEStatus.Unauthorized);
				break;

			case State.Resetting:
				setStatus(BLEStatus.Resetting);
				break;

			case State.Unsupported:
				setStatus(BLEStatus.Unsupported);
				break;

			case State.Unauthorized:
				setStatus(BLEStatus.Unauthorized);
				break;

			default:
				setStatus(BLEStatus.Unknown);
				break;
		}
	};
};

export const isDeviceMatching = (device: Device, setupCode: string): boolean => {
	setupCode = setupCode.toUpperCase();
	const doesNameMatch = device.name && device.name.endsWith(setupCode);
	const manufacturerData = device.manufacturerData ? atob(device.manufacturerData) : '';
	const doesManufacturerDataMatch = manufacturerData.endsWith(setupCode);

	return doesNameMatch || doesManufacturerDataMatch;
};

export const SetupProvider: React.FC<SetupContextOptions> = ({
	children,
	serviceUUID,
	versionCharacteristicUUID,
	txCharacteristicUUID,
	rxCharacteristicUUID,
	manager
}) => {
	const uuids = {
		serviceUUID,
		versionCharacteristicUUID,
		txCharacteristicUUID,
		rxCharacteristicUUID
	};
	const [status, setStatus] = useState<BLEStatus>(defaultState.status);
	const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(defaultState.connectionStatus);
	const [device, setDevice] = useState<BLEDevice>();
	const [isSearchingDevices, setIsSearchingDevices] = useState<boolean>(false);
	const [isScanningWiFiNetworks, setIsScanningWiFiNetworks] = useState<boolean>(false);
	const [foundWiFiNetworks, setFoundWiFiNetworks] = useState<INetwork[]>([]);
	const [isJoiningWiFiNetwork, setIsJoiningWiFiNetwork] = useState<boolean>(false);
	const [error, setError] = useState<Error | undefined>();

	useEffect(() => {
		if (supportsBLE) {
			const subscription = manager.onStateChange(setBLEStatus(setStatus), true);
			return () => subscription.remove();
		} else {
			setStatus(BLEStatus.Unsupported);
		}
	}, [manager]);

	const stopDeviceSearch = () => {
		manager.stopDeviceScan();
		setIsSearchingDevices(false);
	};

	const resetState = () => {
		setConnectionStatus(ConnectionStatus.Disconnected);
		setDevice(undefined);
		setIsSearchingDevices(false);
		setIsScanningWiFiNetworks(false);
		setFoundWiFiNetworks([]);
		setIsJoiningWiFiNetwork(false);
	};

	const searchDevices = ({ setupCode, timeout = 5000 }: SearchDevicesArguments) => {
		setIsSearchingDevices(true);
		manager.startDeviceScan([serviceUUID], null, (error, device) => {
			if (error) {
				setError(error);
				setIsSearchingDevices(true);
			}
			if (device && null != device.name && isDeviceMatching(device, setupCode)) {
				const bleDevice = new BLEDevice(device, uuids);
				bleDevice.onDisconnect(resetState);
				setDevice(bleDevice);
				stopDeviceSearch();
			}
		});
		setTimeout(stopDeviceSearch, timeout);
	};

	const connect = async (mobileSecret: string) => {
		if (!device) {
			return;
		}
		setConnectionStatus(ConnectionStatus.Connecting);
		const [error] = await upon(device.connect(mobileSecret));
		if (error) {
			setError(error);
			setConnectionStatus(ConnectionStatus.Disconnected);
		} else {
			setConnectionStatus(ConnectionStatus.Connected);
		}
	};

	const disconnect = async () => {
		await device?.disconnect();
		setConnectionStatus(ConnectionStatus.Disconnected);
	};

	const scanForWiFiNetworks = async () => {
		if (!device) {
			return;
		}
		setIsScanningWiFiNetworks(true);
		const [error, networks] = await upon(device.scanNetworks());
		if (error) {
			setError(error);
		}
		if (networks) {
			setFoundWiFiNetworks(networks);
		}
		setIsScanningWiFiNetworks(false);
	};

	const joinWiFiNetwork = async (network: INetwork, password?: string) => {
		setIsJoiningWiFiNetwork(true);
		const [error] = await upon(device?.joinNewNetwork(network, password));
		if (error) {
			setError(error);
		}
		setIsJoiningWiFiNetwork(false);
	};

	const clearLastError = () => {
		setError(undefined);
	};

	return (
		<SetupContext.Provider
			value={{
				status,
				connectionStatus,
				device,
				searchDevices,
				isSearchingDevices,
				connect,
				disconnect,
				scanForWiFiNetworks,
				isScanningWiFiNetworks,
				foundWiFiNetworks,
				joinWiFiNetwork,
				isJoiningWiFiNetwork,
				error,
				clearLastError
			}}
		>
			{children}
		</SetupContext.Provider>
	);
};

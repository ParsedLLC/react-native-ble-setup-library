var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import React, { useState, useEffect } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import { State } from 'react-native-ble-plx';
import { upon } from '@particle/async-utils';
import { atob } from './utils';
import { BLEStatus, ConnectionStatus } from './types';
import { BLEDevice } from './ble-device';
const defaultState = {
    status: BLEStatus.Unknown,
    connectionStatus: ConnectionStatus.Disconnected,
    searchDevices: () => { },
    isSearchingDevices: false,
    connect: () => __awaiter(void 0, void 0, void 0, function* () { }),
    disconnect: () => __awaiter(void 0, void 0, void 0, function* () { }),
    scanForWiFiNetworks: () => { },
    isScanningWiFiNetworks: false,
    foundWiFiNetworks: [],
    joinWiFiNetwork: () => { },
    isJoiningWiFiNetwork: false,
    clearLastError: () => { }, // eslint-disable-line
};
const supportsBLE = Platform.select({ web: false, default: true });
/**
 * React Context containing the BLE setup process
 */
export const SetupContext = React.createContext(defaultState);
/**
 * Ensures that all OS permissions have been granted to the app. It will trigger
 * a dialog asking to allow precise location (this is required for the BLE) if the user
 * hasn't approve it before.
 *
 * @private
 * @returns {Promise<boolean>} `true` if the permissions were granted
 */
export const ensureAndroidPermissions = () => __awaiter(void 0, void 0, void 0, function* () {
    if (Platform.OS !== 'android') {
        return true;
    }
    const granted = yield PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
        title: 'Location Permission',
        message: 'This app needs location information to search for BLE devices',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK'
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
});
export const setBLEStatus = (setStatus) => {
    return (state) => __awaiter(void 0, void 0, void 0, function* () {
        switch (state) {
            case State.PoweredOff:
                setStatus(BLEStatus.PoweredOff);
                break;
            case State.PoweredOn:
                (yield ensureAndroidPermissions()) ?
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
    });
};
export const isDeviceMatching = (device, setupCode) => {
    setupCode = setupCode.toUpperCase();
    const doesNameMatch = device.name && device.name.endsWith(setupCode);
    const manufacturerData = device.manufacturerData ? atob(device.manufacturerData) : '';
    const doesManufacturerDataMatch = manufacturerData.endsWith(setupCode);
    return doesNameMatch || doesManufacturerDataMatch;
};
export const SetupProvider = ({ children, serviceUUID, versionCharacteristicUUID, txCharacteristicUUID, rxCharacteristicUUID, manager }) => {
    const uuids = {
        serviceUUID,
        versionCharacteristicUUID,
        txCharacteristicUUID,
        rxCharacteristicUUID
    };
    const [status, setStatus] = useState(defaultState.status);
    const [connectionStatus, setConnectionStatus] = useState(defaultState.connectionStatus);
    const [device, setDevice] = useState();
    const [isSearchingDevices, setIsSearchingDevices] = useState(false);
    const [isScanningWiFiNetworks, setIsScanningWiFiNetworks] = useState(false);
    const [foundWiFiNetworks, setFoundWiFiNetworks] = useState([]);
    const [isJoiningWiFiNetwork, setIsJoiningWiFiNetwork] = useState(false);
    const [error, setError] = useState();
    useEffect(() => {
        if (supportsBLE) {
            const subscription = manager.onStateChange(setBLEStatus(setStatus), true);
            return () => subscription.remove();
        }
        else {
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
    const searchDevices = ({ setupCode, timeout = 5000 }) => {
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
    const connect = (mobileSecret) => __awaiter(void 0, void 0, void 0, function* () {
        if (!device) {
            return;
        }
        setConnectionStatus(ConnectionStatus.Connecting);
        const [error] = yield upon(device.connect(mobileSecret));
        if (error) {
            setError(error);
            setConnectionStatus(ConnectionStatus.Disconnected);
        }
        else {
            setConnectionStatus(ConnectionStatus.Connected);
        }
    });
    const disconnect = () => __awaiter(void 0, void 0, void 0, function* () {
        yield (device === null || device === void 0 ? void 0 : device.disconnect());
        setConnectionStatus(ConnectionStatus.Disconnected);
    });
    const scanForWiFiNetworks = () => __awaiter(void 0, void 0, void 0, function* () {
        if (!device) {
            return;
        }
        setIsScanningWiFiNetworks(true);
        const [error, networks] = yield upon(device.scanNetworks());
        if (error) {
            setError(error);
        }
        if (networks) {
            setFoundWiFiNetworks(networks);
        }
        setIsScanningWiFiNetworks(false);
    });
    const joinWiFiNetwork = (network, password) => __awaiter(void 0, void 0, void 0, function* () {
        setIsJoiningWiFiNetwork(true);
        const [error] = yield upon(device === null || device === void 0 ? void 0 : device.joinNewNetwork(network, password));
        if (error) {
            setError(error);
        }
        setIsJoiningWiFiNetwork(false);
    });
    const clearLastError = () => {
        setError(undefined);
    };
    return (<SetupContext.Provider value={{
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
        }}>
			{children}
		</SetupContext.Provider>);
};

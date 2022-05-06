import React from 'react';
import { State, Device } from 'react-native-ble-plx';
import { BLEStatus, SetupContextType, SetupContextOptions } from './types';
/**
 * React Context containing the BLE setup process
 */
export declare const SetupContext: React.Context<SetupContextType>;
/**
 * Ensures that all OS permissions have been granted to the app. It will trigger
 * a dialog asking to allow precise location (this is required for the BLE) if the user
 * hasn't approve it before.
 *
 * @private
 * @returns {Promise<boolean>} `true` if the permissions were granted
 */
export declare const ensureAndroidPermissions: () => Promise<boolean>;
export declare const setBLEStatus: (setStatus: React.Dispatch<React.SetStateAction<BLEStatus>>) => (state: State) => Promise<void>;
export declare const isDeviceMatching: (device: Device, setupCode: string) => boolean;
export declare const SetupProvider: React.FC<SetupContextOptions>;

import { useContext } from 'react';
import { SetupContext } from './provider';
import { SetupContextType } from './types';

/**
 * Hook for using the SetupContext
 *
 * @returns {SetupContextType} Setup context
 */
export const useBLESetup = (): SetupContextType => useContext(SetupContext);

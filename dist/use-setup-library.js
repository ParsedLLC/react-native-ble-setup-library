import { useContext } from 'react';
import { SetupContext } from './provider';
/**
 * Hook for using the SetupContext
 *
 * @returns {SetupContextType} Setup context
 */
export const useBLESetup = () => useContext(SetupContext);

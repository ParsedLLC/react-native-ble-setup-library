import { Device } from 'react-native-ble-plx';
import { isDeviceMatching } from './provider';

describe('Context Provider', () => {
	describe('`isDeviceMatching` function', () => {
		it('matches the device name', () => {
			const device = {
				name: 'foobar123'
			} as Device;
			expect(isDeviceMatching(device, '123')).toBeTruthy();
		});
		it('matches the manufacturer data', () => {
			const device = {
				manufacturerData: 'Zm9vYmFyMTIz'
			} as Device;
			expect(isDeviceMatching(device, '123')).toBeTruthy();
		});
		it('does not match if neither is correct', () => {
			const device = {
				name: 'foobar321',
				manufacturerData: 'Zm9vYm'
			} as Device;
			expect(isDeviceMatching(device, '123')).toBeFalsy();
		});
	});
});

import { isDeviceMatching } from './provider';
describe('Context Provider', () => {
    describe('`isDeviceMatching` function', () => {
        it('matches the device name', () => {
            const device = {
                name: 'foobar123'
            };
            expect(isDeviceMatching(device, '123')).toBeTruthy();
        });
        it('matches the manufacturer data', () => {
            const device = {
                manufacturerData: 'Zm9vYmFyMTIz'
            };
            expect(isDeviceMatching(device, '123')).toBeTruthy();
        });
        it('does not match if neither is correct', () => {
            const device = {
                name: 'foobar321',
                manufacturerData: 'Zm9vYm'
            };
            expect(isDeviceMatching(device, '123')).toBeFalsy();
        });
    });
});

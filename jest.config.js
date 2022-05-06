const base = require('../../jest.config.base.js');
const pkgJSON = require('./package.json');

module.exports = {
	...base,
	preset: 'jest-expo',
	name: pkgJSON.name,
	displayName: pkgJSON.name,
	rootDir: __dirname,
	testEnvironment: 'jsdom',
	verbose: true,
	transformIgnorePatterns: [],
	globalSetup: '<rootDir>/jest.global-setup.js'
};

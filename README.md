# `@particle/react-native-ble-setup-library`

React Native library for setting up BLE devices.

## Usage

The best way to see how this library is used is to check out the [`react-native-ble-setup-example` package](../react-native-ble-setup-example).

## Installation

```shell
npm install @particle/react-native-ble-setup-library --save
```
<!-- private-module-note-start -->

<!-- private-module-note-end -->

## API
<!-- api-docs-start -->
<a name="SetupContext"></a>

### SetupContext
React Context containing the BLE setup process

**Kind**: global constant  

* * *

<a name="ensureAndroidPermissions"></a>

### ensureAndroidPermissions ⇒ <code>Promise.&lt;boolean&gt;</code>
Ensures that all OS permissions have been granted to the app. It will trigger
a dialog asking to allow precise location (this is required for the BLE) if the user
hasn't approve it before.

**Kind**: global constant  
**Returns**: <code>Promise.&lt;boolean&gt;</code> - `true` if the permissions were granted  

* * *

<a name="useBLESetup"></a>

### useBLESetup ⇒ <code>SetupContextType</code>
Hook for using the SetupContext

**Kind**: global constant  
**Returns**: <code>SetupContextType</code> - Setup context  

* * *

<a name="atob"></a>

### atob(input) ⇒ <code>string</code>
Decode base64 string into a string

**Kind**: global function  
**Returns**: <code>string</code> - Decoded string  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>string</code> | Base64 encoded input |


* * *

<a name="atoi"></a>

### atoi(input) ⇒ <code>number</code>
Decode base64 string into a number

**Kind**: global function  
**Returns**: <code>number</code> - Decoded number  

| Param | Type | Description |
| --- | --- | --- |
| input | <code>string</code> | Base64 encoded input |


* * *


<!-- api-docs-end -->

_NOTE: Unfortunately, docs have a nasty habit of falling out of date. When in doubt, check usage in [tests](./src/index.test.js)_

## License

Copyright &copy; 2022 Particle Industries, Inc. Released under the Apache 2.0 license. See [LICENSE](LICENSE) for details.

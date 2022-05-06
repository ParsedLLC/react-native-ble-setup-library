export var BLEStatus;
(function (BLEStatus) {
    BLEStatus[BLEStatus["Unknown"] = 0] = "Unknown";
    BLEStatus[BLEStatus["Resetting"] = 1] = "Resetting";
    BLEStatus[BLEStatus["Unsupported"] = 2] = "Unsupported";
    BLEStatus[BLEStatus["Unauthorized"] = 3] = "Unauthorized";
    BLEStatus[BLEStatus["PoweredOff"] = 4] = "PoweredOff";
    BLEStatus[BLEStatus["PoweredOn"] = 5] = "PoweredOn";
})(BLEStatus || (BLEStatus = {}));
export var ConnectionStatus;
(function (ConnectionStatus) {
    ConnectionStatus[ConnectionStatus["Disconnected"] = 0] = "Disconnected";
    ConnectionStatus[ConnectionStatus["Connecting"] = 1] = "Connecting";
    ConnectionStatus[ConnectionStatus["Connected"] = 2] = "Connected";
    ConnectionStatus[ConnectionStatus["Disconnecting"] = 3] = "Disconnecting";
})(ConnectionStatus || (ConnectionStatus = {}));

var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { particle } from '@particle/device-os-protobuf/src/pbjs-generated/definitions.js';
const { ScanNetworksRequest, ScanNetworksReply, JoinNewNetworkRequest, JoinNewNetworkReply, Credentials, CredentialsType } = particle.ctrl.wifi;
import { resultToError } from './errors';
export default class DeviceRequests {
    constructor(requestChannel) {
        this.requestChannel = requestChannel;
    }
    request(RequestClass, ReplyClass, type, requestData) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let encodedRequestData;
            if (requestData) {
                encodedRequestData = RequestClass.encode(requestData).finish();
            }
            const { result, data } = yield ((_a = this.requestChannel) === null || _a === void 0 ? void 0 : _a.sendRequest(type, encodedRequestData));
            resultToError(result);
            return ReplyClass.decode(Buffer.from(data));
        });
    }
    scanNetworks() {
        return __awaiter(this, void 0, void 0, function* () {
            const reply = yield this.request(ScanNetworksRequest, ScanNetworksReply, 506);
            if (!reply.networks) {
                return [];
            }
            return reply.networks;
        });
    }
    joinNewNetwork(network, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestData = new JoinNewNetworkRequest(network);
            if (password) {
                requestData.credentials = new Credentials({
                    type: CredentialsType.PASSWORD,
                    password
                });
            }
            yield this.request(JoinNewNetworkRequest, JoinNewNetworkReply, 500, requestData);
        });
    }
}

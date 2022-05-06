import { BleControlRequestChannel } from '@particle/ecjpake';
import { Reader, Writer } from 'protobufjs';
import { particle } from '@particle/device-os-protobuf/src/pbjs-generated/definitions.js';
export interface ProtobufMessage<Type> {
    create: (properties?: Type) => Type;
    encode: (message: Type, writer?: Writer) => Writer;
    decode: (reader: Reader) => Type;
}
export declare type INetwork = particle.ctrl.wifi.ScanNetworksReply.INetwork;
export declare type IScanNetworksRequest = particle.ctrl.wifi.IScanNetworksRequest;
export declare type IScanNetworksReply = particle.ctrl.wifi.IScanNetworksReply;
export declare type IJoinNewNetworkRequest = particle.ctrl.wifi.IJoinNewNetworkRequest;
export declare type IJoinNewNetworkReply = particle.ctrl.wifi.IJoinNewNetworkReply;
export default class DeviceRequests {
    requestChannel: BleControlRequestChannel;
    constructor(requestChannel: BleControlRequestChannel);
    request<RequestType, ReplyType>(RequestClass: ProtobufMessage<RequestType>, ReplyClass: ProtobufMessage<ReplyType>, type: number, requestData?: RequestType): Promise<ReplyType>;
    scanNetworks(): Promise<INetwork[]>;
    joinNewNetwork(network: INetwork, password?: string): Promise<void>;
}

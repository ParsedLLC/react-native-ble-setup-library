import { BleControlRequestChannel } from '@particle/ecjpake';
// TODO(suda): Once this code is moved to device-os-protobuf we won't have to do such bad imports
import { Reader, Writer } from 'protobufjs';
import { particle } from '@particle/device-os-protobuf/src/pbjs-generated/definitions.js';
const {
	ScanNetworksRequest,
	ScanNetworksReply,
	JoinNewNetworkRequest,
	JoinNewNetworkReply,
	Credentials,
	CredentialsType
} = particle.ctrl.wifi;
import { resultToError } from './errors';

export interface ProtobufMessage<Type> {
	create: (properties?: Type) => Type;
	encode: (message: Type, writer?: Writer) => Writer;
	decode: (reader: Reader) => Type;
}

export type INetwork = particle.ctrl.wifi.ScanNetworksReply.INetwork;
export type IScanNetworksRequest = particle.ctrl.wifi.IScanNetworksRequest;
export type IScanNetworksReply = particle.ctrl.wifi.IScanNetworksReply;
export type IJoinNewNetworkRequest = particle.ctrl.wifi.IJoinNewNetworkRequest;
export type IJoinNewNetworkReply = particle.ctrl.wifi.IJoinNewNetworkReply;

export default class DeviceRequests {
	requestChannel: BleControlRequestChannel;

	constructor(requestChannel: BleControlRequestChannel) {
		this.requestChannel = requestChannel;
	}

	async request<RequestType, ReplyType>(
		RequestClass: ProtobufMessage<RequestType>,
		ReplyClass: ProtobufMessage<ReplyType>,
		type: number,
		requestData?: RequestType
	): Promise<ReplyType> {
		let encodedRequestData;
		if (requestData) {
			encodedRequestData = RequestClass.encode(requestData).finish();
		}

		const { result, data } = await this.requestChannel?.sendRequest(type, encodedRequestData);
		resultToError(result);
		return ReplyClass.decode(Buffer.from(data) as unknown as Reader);
	}

	async scanNetworks(): Promise<INetwork[]> {
		const reply = await this.request<IScanNetworksRequest, IScanNetworksReply>(
			ScanNetworksRequest,
			ScanNetworksReply,
			506
		);
		if (!reply.networks) {
			return [];
		}
		return reply.networks;
	}

	async joinNewNetwork(network: INetwork, password?: string): Promise<void> {
		const requestData = new JoinNewNetworkRequest(network);
		if (password) {
			requestData.credentials = new Credentials({
				type: CredentialsType.PASSWORD,
				password
			});
		}
		await this.request<
			IJoinNewNetworkRequest,
			IJoinNewNetworkReply
		>(
			JoinNewNetworkRequest,
			JoinNewNetworkReply,
			500,
			requestData
		);
	}
}

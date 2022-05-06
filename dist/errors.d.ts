export declare class MissingCharacteristicsError extends Error {
    constructor();
}
export declare class UnreadableVersionCharacteristicError extends Error {
    constructor();
}
export declare class UnreadableReceiveCharacteristicError extends Error {
    constructor();
}
export declare class UnwritableTransmitCharacteristicError extends Error {
    constructor();
}
export declare class InvalidProtocolVersionError extends Error {
    constructor();
}
export declare class UnknownError extends Error {
    constructor();
}
export declare class ResourceIsBusyError extends Error {
}
export declare class NotSupportedError extends Error {
}
export declare class NotAllowedError extends Error {
}
export declare class OperationCancelledError extends Error {
}
export declare class OperationAbortedError extends Error {
}
export declare class TimeoutError extends Error {
}
export declare class NotFoundError extends Error {
}
export declare class AlreadyExistsError extends Error {
}
export declare class DataTooLargeError extends Error {
}
export declare class LimitExceededError extends Error {
}
export declare class InvalidStateError extends Error {
}
export declare class IOError extends Error {
}
export declare class FileError extends Error {
}
export declare class NetworkError extends Error {
}
export declare class ProtocolError extends Error {
}
export declare class InternalError extends Error {
}
export declare class MemoryAllocationError extends Error {
}
export declare class InvalidArgumentError extends Error {
}
export declare class InvalidDataFormatError extends Error {
}
export declare class OutOfRangeError extends Error {
}
export declare const resultToError: (result: number) => void;

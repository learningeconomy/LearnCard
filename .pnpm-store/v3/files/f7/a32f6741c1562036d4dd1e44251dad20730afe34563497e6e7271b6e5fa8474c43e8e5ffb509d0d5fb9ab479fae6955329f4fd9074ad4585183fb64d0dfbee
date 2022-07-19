export var ERROR_CODE;
(function(ERROR_CODE) {
    ERROR_CODE[ERROR_CODE["PARSE_ERROR"] = -32700] = "PARSE_ERROR";
    ERROR_CODE[ERROR_CODE["INVALID_REQUEST"] = -32600] = "INVALID_REQUEST";
    ERROR_CODE[ERROR_CODE["METHOD_NOT_FOUND"] = -32601] = "METHOD_NOT_FOUND";
    ERROR_CODE[ERROR_CODE["INVALID_PARAMS"] = -32602] = "INVALID_PARAMS";
    ERROR_CODE[ERROR_CODE["INTERNAL_ERROR"] = -32603] = "INTERNAL_ERROR";
})(ERROR_CODE || (ERROR_CODE = {}));
export const ERROR_MESSAGE = {
    [ERROR_CODE.PARSE_ERROR]: 'Parse error',
    [ERROR_CODE.INVALID_REQUEST]: 'Invalid request',
    [ERROR_CODE.METHOD_NOT_FOUND]: 'Method not found',
    [ERROR_CODE.INVALID_PARAMS]: 'Invalid params',
    [ERROR_CODE.INTERNAL_ERROR]: 'Internal error'
};
export function isServerError(code) {
    return -32000 >= code && code >= -32099;
}
export function getErrorMessage(code) {
    return ERROR_MESSAGE[code.toString()] ?? (isServerError(code) ? 'Server error' : 'Application error');
}
export class RPCError extends Error {
    static fromObject(err) {
        return new RPCError(err.code, err.message, err.data);
    }
    toObject() {
        return {
            code: this.code,
            data: this.data,
            message: this.message
        };
    }
    constructor(code, message, data){
        super();
        Object.setPrototypeOf(this, RPCError.prototype);
        this.code = code;
        this.data = data;
        this.message = message ?? getErrorMessage(code);
    }
}
function createErrorFactory(code) {
    const message = ERROR_MESSAGE[code];
    return function createError(data) {
        return new RPCError(code, message, data);
    };
}
export const createParseError = createErrorFactory(ERROR_CODE.PARSE_ERROR);
export const createInvalidRequest = createErrorFactory(ERROR_CODE.INVALID_REQUEST);
export const createMethodNotFound = createErrorFactory(ERROR_CODE.METHOD_NOT_FOUND);
export const createInvalidParams = createErrorFactory(ERROR_CODE.INVALID_PARAMS);
export const createInternalError = createErrorFactory(ERROR_CODE.INTERNAL_ERROR);

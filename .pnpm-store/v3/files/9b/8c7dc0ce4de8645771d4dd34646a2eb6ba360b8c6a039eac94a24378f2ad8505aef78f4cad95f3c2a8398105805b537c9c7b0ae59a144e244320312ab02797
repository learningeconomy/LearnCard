export declare type RPCID = string | number | null;
export declare type RPCParams = Record<string, unknown> | Array<unknown>;
export declare type RPCMethodTypes = {
    params?: RPCParams;
    result?: unknown;
    error?: undefined;
};
export declare type RPCMethods = Record<string, RPCMethodTypes>;
export declare type RPCRequest<Methods extends RPCMethods, MethodName extends keyof Methods> = Methods[MethodName]['params'] extends undefined ? {
    jsonrpc: string;
    method: MethodName;
    params?: undefined;
    id?: RPCID;
} : {
    jsonrpc: string;
    method: MethodName;
    params: Methods[MethodName]['params'];
    id?: RPCID;
};
export declare type RPCErrorObject<Data = undefined> = Data extends undefined ? {
    code: number;
    data?: undefined;
    message?: string;
} : {
    code: number;
    data: Data;
    message?: string;
};
export declare type RPCErrorResponse<ErrorData = undefined> = {
    jsonrpc: string;
    id: RPCID;
    result?: never;
    error: RPCErrorObject<ErrorData>;
};
export declare type RPCResultResponse<Result = undefined> = Result extends undefined ? {
    jsonrpc: string;
    id: RPCID;
    result?: undefined;
    error?: never;
} : {
    jsonrpc: string;
    id: RPCID;
    result: Result;
    error?: never;
};
export declare type RPCResponse<Methods extends RPCMethods, K extends keyof Methods> = RPCResultResponse<Methods[K]['result']> | RPCErrorResponse<Methods[K]['error']>;
export declare type SendRequestFunc<Methods extends RPCMethods, Args extends Array<any> = []> = <K extends keyof Methods>(request: RPCRequest<Methods, K>, ...args: Args) => Promise<RPCResponse<Methods, K> | null>;
export declare type RPCConnection<Methods extends RPCMethods, SendArgs extends Array<any> = []> = {
    send: SendRequestFunc<Methods, SendArgs>;
};

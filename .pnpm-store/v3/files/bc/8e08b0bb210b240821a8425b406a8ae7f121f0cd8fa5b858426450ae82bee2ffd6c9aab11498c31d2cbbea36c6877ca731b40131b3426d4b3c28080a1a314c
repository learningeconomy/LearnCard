import type { RPCConnection, RPCMethods } from './types.js';
export declare type RequestOptions = {
    signal?: AbortSignal;
};
export declare class RPCClient<Methods extends RPCMethods> {
    #private;
    constructor(connection: RPCConnection<Methods>);
    get connection(): RPCConnection<Methods>;
    createID(): string;
    request<MethodName extends keyof Methods>(method: MethodName, params?: Methods[MethodName]['params'], options?: RequestOptions): Promise<Methods[MethodName]['result']>;
    notify<MethodName extends keyof Methods>(method: MethodName, params?: Methods[MethodName]['params']): Promise<void>;
}

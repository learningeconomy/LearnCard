import { abortableHandlerSymbol } from './abortable.js';
import type { RPCErrorResponse, RPCMethods, RPCRequest, RPCResponse } from './types.js';
export declare type ErrorHandler<Context, Methods extends RPCMethods> = <K extends keyof Methods>(ctx: Context, req: RPCRequest<Methods, K>, error: Error) => void;
export declare type MethodHandlerOptions = {
    signal?: AbortSignal;
};
export declare type MethodHandler<Context, Params = undefined, Result = undefined> = ((ctx: Context, params: Params, options: MethodHandlerOptions) => Result | Promise<Result>) & {
    [abortableHandlerSymbol]?: boolean;
};
export declare function abortableHandler<Handler extends MethodHandler<any>>(handler: Handler): Handler;
export declare type NotificationHandler<Context, Methods extends RPCMethods> = <K extends keyof Methods>(ctx: Context, req: RPCRequest<Methods, K>) => void;
export declare type HandlerMethods<Context, Methods extends RPCMethods> = {
    [K in keyof Methods]: MethodHandler<Context, Methods[K]['params'], Methods[K]['result']>;
};
export declare type HandlerOptions<Context, Methods extends RPCMethods> = {
    onHandlerError?: ErrorHandler<Context, Methods>;
    onInvalidMessage?: NotificationHandler<Context, Methods>;
    onNotification?: NotificationHandler<Context, Methods>;
};
export declare function parseJSON<T = any>(input: string): T;
export declare function createErrorResponse(id: number | string, code: number): RPCErrorResponse;
export declare function createHandler<Context, Methods extends RPCMethods>(methods: HandlerMethods<Context, Methods>, options?: HandlerOptions<Context, Methods>): <K extends keyof Methods>(ctx: Context, msg: RPCRequest<Methods, K>) => Promise<RPCResponse<Methods, K> | null>;

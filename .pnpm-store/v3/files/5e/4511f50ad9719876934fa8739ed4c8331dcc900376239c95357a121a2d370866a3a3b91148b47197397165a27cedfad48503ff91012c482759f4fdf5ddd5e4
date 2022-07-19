import { abortableHandlerSymbol } from './abortable.js';
import { ABORT_REQUEST_METHOD } from './constants.js';
import { ERROR_CODE, RPCError, createParseError, getErrorMessage } from './error.js';
export function abortableHandler(handler) {
    handler[abortableHandlerSymbol] = true;
    return handler;
}
export function parseJSON(input) {
    try {
        return JSON.parse(input);
    } catch (err) {
        throw createParseError();
    }
}
export function createErrorResponse(id, code) {
    return {
        jsonrpc: '2.0',
        id,
        error: {
            code,
            message: getErrorMessage(code)
        }
    };
}
function fallbackOnHandlerError(_ctx, msg, error) {
    // eslint-disable-next-line no-console
    console.warn('Unhandled handler error', msg, error);
}
function fallbackOnInvalidMessage(_ctx, msg) {
    // eslint-disable-next-line no-console
    console.warn('Unhandled invalid message', msg);
}
function fallbackOnNotification(_ctx, msg) {
    // eslint-disable-next-line no-console
    console.warn('Unhandled notification', msg);
}
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createHandler(methods, options = {}) {
    const onHandlerError = options.onHandlerError ?? fallbackOnHandlerError;
    const onInvalidMessage = options.onInvalidMessage ?? fallbackOnInvalidMessage;
    const onNotification = options.onNotification ?? fallbackOnNotification;
    const inflight = {};
    function handleNotification(ctx, msg) {
        // If this is an abort notification, check if inflight and keep track of it
        // Also propagate the abortion to the handler if supported
        if (msg.method === ABORT_REQUEST_METHOD) {
            const requestID = msg.params?.id;
            if (requestID != null) {
                inflight[requestID]?.abort();
            }
        } else {
            onNotification(ctx, msg);
        }
    }
    return async function handleRequest(ctx, msg) {
        const id = msg.id;
        if (msg.jsonrpc !== '2.0' || msg.method == null) {
            if (id == null) {
                onInvalidMessage(ctx, msg);
                return null;
            }
            return createErrorResponse(id, ERROR_CODE.INVALID_REQUEST);
        }
        const handler = methods[msg.method];
        if (handler == null) {
            if (id == null) {
                handleNotification(ctx, msg);
                return null;
            }
            return createErrorResponse(id, ERROR_CODE.METHOD_NOT_FOUND);
        }
        try {
            let handled;
            if (id != null && handler[abortableHandlerSymbol]) {
                const controller = new AbortController();
                inflight[id] = controller;
                handled = handler(ctx, msg.params, {
                    signal: controller.signal
                });
            } else {
                handled = handler(ctx, msg.params, {});
            }
            const result = handled == null // Perform null check before checking existence of .then() method
             ? handled : typeof handled.then === 'function' ? await handled : handled;
            return id == null || inflight[id]?.signal.aborted // Don't send response if aborted
             ? null : {
                jsonrpc: '2.0',
                id,
                result
            };
        } catch (err) {
            // Don't send response if aborted
            if (id == null || inflight[id]?.signal.aborted) {
                onHandlerError(ctx, msg, err);
                return null;
            }
            let error;
            if (err instanceof RPCError) {
                error = err.toObject();
            } else {
                onHandlerError(ctx, msg, err);
                const code = err.code ?? -32000 // Server error
                ;
                error = {
                    code,
                    message: err.message || getErrorMessage(code)
                };
            }
            return {
                jsonrpc: '2.0',
                id,
                error
            };
        } finally{
            if (id != null) {
                delete inflight[id];
            }
        }
    };
}

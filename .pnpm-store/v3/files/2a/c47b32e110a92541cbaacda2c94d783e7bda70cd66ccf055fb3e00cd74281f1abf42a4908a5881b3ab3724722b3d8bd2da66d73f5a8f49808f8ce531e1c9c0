function _checkPrivateRedeclaration(obj, privateCollection) {
    if (privateCollection.has(obj)) {
        throw new TypeError("Cannot initialize the same private elements twice on an object");
    }
}
function _classApplyDescriptorGet(receiver, descriptor) {
    if (descriptor.get) {
        return descriptor.get.call(receiver);
    }
    return descriptor.value;
}
function _classApplyDescriptorSet(receiver, descriptor, value) {
    if (descriptor.set) {
        descriptor.set.call(receiver, value);
    } else {
        if (!descriptor.writable) {
            throw new TypeError("attempted to set read only private field");
        }
        descriptor.value = value;
    }
}
function _classExtractFieldDescriptor(receiver, privateMap, action) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to " + action + " private field on non-instance");
    }
    return privateMap.get(receiver);
}
function _classPrivateFieldGet(receiver, privateMap) {
    var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "get");
    return _classApplyDescriptorGet(receiver, descriptor);
}
function _classPrivateFieldInit(obj, privateMap, value) {
    _checkPrivateRedeclaration(obj, privateMap);
    privateMap.set(obj, value);
}
function _classPrivateFieldSet(receiver, privateMap, value) {
    var descriptor = _classExtractFieldDescriptor(receiver, privateMap, "set");
    _classApplyDescriptorSet(receiver, descriptor, value);
    return value;
}
import { nanoid } from 'nanoid';
import { abortable, abortedReasonSymbol } from './abortable.js';
import { ABORT_REQUEST_METHOD } from './constants.js';
import { RPCError } from './error.js';
var _connection = /*#__PURE__*/ new WeakMap();
export class RPCClient {
    get connection() {
        return _classPrivateFieldGet(this, _connection);
    }
    createID() {
        return nanoid();
    }
    request(method, params = undefined, options = {}) {
        const { signal  } = options;
        if (signal?.aborted) {
            return Promise.reject(abortedReasonSymbol);
        }
        const id = this.createID();
        const responsePromise = _classPrivateFieldGet(this, _connection).send({
            jsonrpc: '2.0',
            id,
            method,
            params
        }).then((res)=>{
            if (res == null) {
                throw new Error('Missing response');
            }
            if (res.error != null) {
                throw RPCError.fromObject(res.error);
            }
            return res.result;
        });
        if (signal == null) {
            return responsePromise;
        }
        signal.addEventListener('abort', ()=>{
            void this.notify(ABORT_REQUEST_METHOD, {
                id
            });
        });
        return abortable(responsePromise, signal);
    }
    async notify(method, params = undefined) {
        await _classPrivateFieldGet(this, _connection).send({
            jsonrpc: '2.0',
            method,
            params
        });
    }
    constructor(connection){
        _classPrivateFieldInit(this, _connection, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldSet(this, _connection, connection);
    }
}

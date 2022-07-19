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
var _getRemote = /*#__PURE__*/ new WeakMap(), _queue = /*#__PURE__*/ new WeakMap(), _promiseValue = /*#__PURE__*/ new WeakMap(), _deferValue = /*#__PURE__*/ new WeakMap();
export class TileProxy {
    /** @internal */ _createValuePromise() {
        _classPrivateFieldSet(this, _promiseValue, new Promise((resolve, reject)=>{
            _classPrivateFieldSet(this, _deferValue, {
                resolve,
                reject
            });
        }));
    }
    change(mutation) {
        return new Promise((resolve, reject)=>{
            const run = async (current)=>{
                try {
                    const next = await mutation(current);
                    resolve();
                    this._next(next);
                } catch (err) {
                    reject(err);
                    this._next(current);
                }
            };
            _classPrivateFieldGet(this, _queue).push({
                reject,
                run
            });
            if (_classPrivateFieldGet(this, _queue).length === 1) {
                void this._start();
            }
        });
    }
    async changeContent(change) {
        const mutation = async (doc)=>{
            await doc.update(change(doc.content), doc.metadata);
            return doc;
        };
        return await this.change(mutation);
    }
    async get() {
        return _classPrivateFieldGet(this, _queue).length === 0 ? await _classPrivateFieldGet(this, _getRemote).call(this) : await _classPrivateFieldGet(this, _promiseValue);
    }
    /** @internal */ async _start() {
        try {
            const value = await _classPrivateFieldGet(this, _getRemote).call(this);
            this._next(value);
        } catch (err) {
            _classPrivateFieldGet(this, _queue).forEach((item)=>{
                item.reject(err);
            });
            _classPrivateFieldSet(this, _queue, []);
            _classPrivateFieldGet(this, _deferValue).reject(err);
            this._createValuePromise();
        }
    }
    /** @internal */ _next(value) {
        const item = _classPrivateFieldGet(this, _queue).shift();
        if (item == null) {
            this._end(value);
        } else {
            void item.run(value);
        }
    }
    /** @internal */ _end(value) {
        _classPrivateFieldGet(this, _deferValue).resolve(value);
        this._createValuePromise();
    }
    constructor(getRemote){
        _classPrivateFieldInit(this, _getRemote, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _queue, {
            writable: true,
            value: []
        });
        _classPrivateFieldInit(this, _promiseValue, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _deferValue, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldSet(this, _getRemote, getRemote);
        this._createValuePromise();
    }
}

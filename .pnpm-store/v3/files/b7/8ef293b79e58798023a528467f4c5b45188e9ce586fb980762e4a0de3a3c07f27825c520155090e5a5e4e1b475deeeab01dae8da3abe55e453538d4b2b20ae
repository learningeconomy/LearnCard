(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.clear = exports.MemoizeExpiring = exports.Memoize = void 0;
    function Memoize(args) {
        var hashFunction;
        var duration;
        var tags;
        if (typeof args === 'object') {
            hashFunction = args.hashFunction;
            duration = args.expiring;
            tags = args.tags;
        }
        else {
            hashFunction = args;
        }
        return function (target, propertyKey, descriptor) {
            if (descriptor.value != null) {
                descriptor.value = getNewFunction(descriptor.value, hashFunction, duration, tags);
            }
            else if (descriptor.get != null) {
                descriptor.get = getNewFunction(descriptor.get, hashFunction, duration, tags);
            }
            else {
                throw 'Only put a Memoize() decorator on a method or get accessor.';
            }
        };
    }
    exports.Memoize = Memoize;
    function MemoizeExpiring(expiring, hashFunction) {
        return Memoize({
            expiring: expiring,
            hashFunction: hashFunction
        });
    }
    exports.MemoizeExpiring = MemoizeExpiring;
    var clearCacheTagsMap = new Map();
    function clear(tags) {
        var cleared = new Set();
        for (var _i = 0, tags_1 = tags; _i < tags_1.length; _i++) {
            var tag = tags_1[_i];
            var maps = clearCacheTagsMap.get(tag);
            if (maps) {
                for (var _a = 0, maps_1 = maps; _a < maps_1.length; _a++) {
                    var mp = maps_1[_a];
                    if (!cleared.has(mp)) {
                        mp.clear();
                        cleared.add(mp);
                    }
                }
            }
        }
        return cleared.size;
    }
    exports.clear = clear;
    function getNewFunction(originalMethod, hashFunction, duration, tags) {
        if (duration === void 0) { duration = 0; }
        var propMapName = Symbol("__memoized_map__");
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            var returnedValue;
            if (!this.hasOwnProperty(propMapName)) {
                Object.defineProperty(this, propMapName, {
                    configurable: false,
                    enumerable: false,
                    writable: false,
                    value: new Map()
                });
            }
            var myMap = this[propMapName];
            if (Array.isArray(tags)) {
                for (var _a = 0, tags_2 = tags; _a < tags_2.length; _a++) {
                    var tag = tags_2[_a];
                    if (clearCacheTagsMap.has(tag)) {
                        clearCacheTagsMap.get(tag).push(myMap);
                    }
                    else {
                        clearCacheTagsMap.set(tag, [myMap]);
                    }
                }
            }
            if (hashFunction || args.length > 0 || duration > 0) {
                var hashKey = void 0;
                if (hashFunction === true) {
                    hashKey = args.map(function (a) { return a.toString(); }).join('!');
                }
                else if (hashFunction) {
                    hashKey = hashFunction.apply(this, args);
                }
                else {
                    hashKey = args[0];
                }
                var timestampKey = hashKey + "__timestamp";
                var isExpired = false;
                if (duration > 0) {
                    if (!myMap.has(timestampKey)) {
                        isExpired = true;
                    }
                    else {
                        var timestamp = myMap.get(timestampKey);
                        isExpired = (Date.now() - timestamp) > duration;
                    }
                }
                if (myMap.has(hashKey) && !isExpired) {
                    returnedValue = myMap.get(hashKey);
                }
                else {
                    returnedValue = originalMethod.apply(this, args);
                    myMap.set(hashKey, returnedValue);
                    if (duration > 0) {
                        myMap.set(timestampKey, Date.now());
                    }
                }
            }
            else {
                var hashKey = this;
                if (myMap.has(hashKey)) {
                    returnedValue = myMap.get(hashKey);
                }
                else {
                    returnedValue = originalMethod.apply(this, args);
                    myMap.set(hashKey, returnedValue);
                }
            }
            return returnedValue;
        };
    }
});
//# sourceMappingURL=memoize-decorator.js.map
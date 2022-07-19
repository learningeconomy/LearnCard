export function Memoize(args) {
    let hashFunction;
    let duration;
    let tags;
    if (typeof args === 'object') {
        hashFunction = args.hashFunction;
        duration = args.expiring;
        tags = args.tags;
    }
    else {
        hashFunction = args;
    }
    return (target, propertyKey, descriptor) => {
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
export function MemoizeExpiring(expiring, hashFunction) {
    return Memoize({
        expiring,
        hashFunction
    });
}
const clearCacheTagsMap = new Map();
export function clear(tags) {
    const cleared = new Set();
    for (const tag of tags) {
        const maps = clearCacheTagsMap.get(tag);
        if (maps) {
            for (const mp of maps) {
                if (!cleared.has(mp)) {
                    mp.clear();
                    cleared.add(mp);
                }
            }
        }
    }
    return cleared.size;
}
function getNewFunction(originalMethod, hashFunction, duration = 0, tags) {
    const propMapName = Symbol(`__memoized_map__`);
    return function (...args) {
        let returnedValue;
        if (!this.hasOwnProperty(propMapName)) {
            Object.defineProperty(this, propMapName, {
                configurable: false,
                enumerable: false,
                writable: false,
                value: new Map()
            });
        }
        let myMap = this[propMapName];
        if (Array.isArray(tags)) {
            for (const tag of tags) {
                if (clearCacheTagsMap.has(tag)) {
                    clearCacheTagsMap.get(tag).push(myMap);
                }
                else {
                    clearCacheTagsMap.set(tag, [myMap]);
                }
            }
        }
        if (hashFunction || args.length > 0 || duration > 0) {
            let hashKey;
            if (hashFunction === true) {
                hashKey = args.map(a => a.toString()).join('!');
            }
            else if (hashFunction) {
                hashKey = hashFunction.apply(this, args);
            }
            else {
                hashKey = args[0];
            }
            const timestampKey = `${hashKey}__timestamp`;
            let isExpired = false;
            if (duration > 0) {
                if (!myMap.has(timestampKey)) {
                    isExpired = true;
                }
                else {
                    let timestamp = myMap.get(timestampKey);
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
            const hashKey = this;
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
//# sourceMappingURL=memoize-decorator.js.map
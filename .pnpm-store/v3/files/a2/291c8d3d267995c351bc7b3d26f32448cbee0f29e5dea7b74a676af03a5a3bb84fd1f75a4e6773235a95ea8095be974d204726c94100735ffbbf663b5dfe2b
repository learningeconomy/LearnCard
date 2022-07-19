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
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { CommitID, StreamID, StreamRef } from '@ceramicnetwork/streamid';
import DataLoader from 'dataloader';
/** @internal */ export function keyToQuery(key) {
    return typeof key === 'string' || CommitID.isInstance(key) || StreamID.isInstance(key) ? {
        streamId: key
    } : {
        streamId: key.streamId,
        genesis: key.genesis
    };
}
/** @internal */ export function keyToString(key) {
    if (typeof key === 'string') {
        // Convert possible URL input to string representation to match returned keys format
        return StreamRef.from(key).toString();
    }
    if (CommitID.isInstance(key) || StreamID.isInstance(key)) {
        return key.toString();
    }
    return key.streamId.toString();
}
/**
 * Create a {@linkcode TileQuery} for a determinitic TileDocument based on its metadata.
 */ export async function getDeterministicQuery(metadata) {
    const genesis = await TileDocument.makeGenesis({}, null, {
        ...metadata,
        deterministic: true
    });
    const streamId = await StreamID.fromGenesis('tile', genesis);
    return {
        genesis,
        streamId
    };
}
const tempBatchLoadFn = ()=>Promise.resolve([])
;
var _ceramic = /*#__PURE__*/ new WeakMap(), _useCache = /*#__PURE__*/ new WeakMap();
/**
 * A TileLoader extends {@link https://github.com/graphql/dataloader DataLoader} to provide
 * batching and caching functionalities for loading TileDocument streams.
 *
 * It is exported by the {@linkcode tile-loader} module.
 *
 * ```sh
 * import { TileLoader } from '@glazed/tile-loader'
 * ```
 */ export class TileLoader extends DataLoader {
    /**
   * Add a TileDocument to the local cache, if enabled.
   */ cache(stream) {
        if (!_classPrivateFieldGet(this, _useCache)) {
            return false;
        }
        const id = stream.id.toString();
        this.clear(id).prime(id, stream);
        return true;
    }
    /**
   * Create a new TileDocument and add it to the cache, if enabled.
   */ async create(content, metadata, options) {
        const stream = await TileDocument.create(_classPrivateFieldGet(this, _ceramic), content, metadata, options);
        this.cache(stream);
        return stream;
    }
    /**
   * Create or load a deterministic TileDocument based on its metadata.
   */ async deterministic(metadata, options) {
        const query = await getDeterministicQuery(metadata);
        try {
            return await super.load(query);
        } catch (err) {
            const stream = await TileDocument.createFromGenesis(_classPrivateFieldGet(this, _ceramic), query.genesis, options);
            this.cache(stream);
            return stream;
        }
    }
    /**
   * Load a TileDocument from the cache (if enabled) or remotely.
   */ async load(key) {
        return await super.load(key);
    }
    /**
   * Update a TileDocument after loading the stream remotely, bypassing the cache.
   */ async update(streamID, content, metadata, options) {
        const id = keyToString(streamID);
        this.clear(id);
        const stream = await this.load({
            streamId: id
        });
        await stream.update(content, metadata, options);
        return stream;
    }
    constructor(params){
        super(tempBatchLoadFn, {
            cache: true,
            cacheKeyFn: keyToString,
            cacheMap: params.cache != null && typeof params.cache !== 'boolean' ? params.cache : undefined
        });
        _classPrivateFieldInit(this, _ceramic, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _useCache, {
            writable: true,
            value: void 0
        });
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore internal method
        this._batchLoadFn = async (keys)=>{
            if (!params.cache) {
                // Disable cache but keep batching behavior - from https://github.com/graphql/dataloader#disabling-cache
                this.clearAll();
            }
            const results = await params.ceramic.multiQuery(keys.map(keyToQuery), params.multiqueryTimeout);
            return keys.map((key)=>{
                const id = keyToString(key);
                const doc = results[id];
                return doc ? doc : new Error(`Failed to load stream: ${id}`);
            });
        };
        _classPrivateFieldSet(this, _ceramic, params.ceramic);
        _classPrivateFieldSet(this, _useCache, !!params.cache);
    }
}

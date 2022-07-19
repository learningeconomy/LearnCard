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
import { TileLoader } from '@glazed/tile-loader';
var _aliases = /*#__PURE__*/ new WeakMap(), _loader = /*#__PURE__*/ new WeakMap();
/**
 * The DataModel runtime provides APIs for interacting with datamodel aliases in applications and
 * libraries. The {@linkcode devtools.ModelManager ModelManager} provides complementary APIs for
 * managing datamodels during development.
 *
 * It is exported by the {@linkcode datamodel} module.
 *
 * ```sh
 * import { DataModel } from '@glazed/datamodel'
 * ```
 */ export class DataModel {
    /**
   * {@linkcode types.ModelAliases Model aliases} provided in constructor.
   */ get aliases() {
        return _classPrivateFieldGet(this, _aliases);
    }
    /**
   * {@linkcode TileLoader} instance used internally.
   */ get loader() {
        return _classPrivateFieldGet(this, _loader);
    }
    /**
   * Returns the definition stream ID for a given alias, if present in local model aliases.
   */ getDefinitionID(alias) {
        return _classPrivateFieldGet(this, _aliases).definitions[alias] ?? null;
    }
    /**
   * Returns the schema stream URL for a given alias, if present in local model aliases.
   */ getSchemaURL(alias) {
        return _classPrivateFieldGet(this, _aliases).schemas[alias] ?? null;
    }
    /**
   * Returns the tile stream ID for a given alias, if present in local model aliases.
   */ getTileID(alias) {
        return _classPrivateFieldGet(this, _aliases).tiles[alias] ?? null;
    }
    /**
   * Load the TileDocument identified by the given `alias`.
   */ async loadTile(alias) {
        const id = this.getTileID(alias);
        if (id == null) {
            throw new Error(`Tile alias "${alias}" is not defined`);
        }
        return await _classPrivateFieldGet(this, _loader).load(id);
    }
    /**
   * Create a TileDocument using a schema identified by the given `schemaAlias`.
   */ async createTile(schemaAlias, content, options = {}) {
        const schema = this.getSchemaURL(schemaAlias);
        if (schema == null) {
            throw new Error(`Schema alias "${schemaAlias}" is not defined`);
        }
        const { controller , ...opts } = options;
        const metadata = {
            schema
        };
        if (controller != null) {
            metadata.controllers = [
                controller
            ];
        }
        return await _classPrivateFieldGet(this, _loader).create(content, metadata, opts);
    }
    constructor(params){
        _classPrivateFieldInit(this, _aliases, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _loader, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldSet(this, _aliases, params.aliases);
        if (params.loader != null) {
            _classPrivateFieldSet(this, _loader, params.loader);
        } else if (params.ceramic == null) {
            throw new Error('Invalid DataModel parameters: missing ceramic or loader');
        } else {
            _classPrivateFieldSet(this, _loader, new TileLoader({
                ceramic: params.ceramic,
                cache: params.cache
            }));
        }
    }
}

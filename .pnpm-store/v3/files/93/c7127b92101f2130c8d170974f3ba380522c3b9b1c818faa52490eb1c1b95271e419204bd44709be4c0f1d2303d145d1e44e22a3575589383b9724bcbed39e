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
import { StreamID } from '@ceramicnetwork/streamid';
import { CIP11_DEFINITION_SCHEMA_URL, CIP11_INDEX_SCHEMA_URL } from '@glazed/constants';
import { DataModel } from '@glazed/datamodel';
import { TileLoader, getDeterministicQuery } from '@glazed/tile-loader';
import { TileProxy } from './proxy.js';
import { getIDXMetadata } from './utils.js';
export { assertDIDstring, isDIDstring } from './utils.js';
var _ceramic = /*#__PURE__*/ new WeakMap(), _id = /*#__PURE__*/ new WeakMap(), _indexProxies = /*#__PURE__*/ new WeakMap(), _loader = /*#__PURE__*/ new WeakMap(), _model = /*#__PURE__*/ new WeakMap();
/**
 * The DIDDataStore class provides simple APIs to interact with data records associated to a DID.
 *
 * It is exported by the {@linkcode did-datastore} module.
 *
 * ```sh
 * import { DIDDataStore } from '@glazed/did-datastore'
 * ```
 */ export class DIDDataStore {
    /**
   * Returns whether a DID instance is attached to the Ceramic client instance used internally or
   * not.
   */ get authenticated() {
        return _classPrivateFieldGet(this, _ceramic).did != null;
    }
    /**
   * Ceramic client instance used internally.
   */ get ceramic() {
        return _classPrivateFieldGet(this, _ceramic);
    }
    /**
   * Returns the DID string currently authenticated on the Ceramic instance used internally, or
   * throws an error if not authenticated.
   */ get id() {
        if (_classPrivateFieldGet(this, _id) != null) {
            return _classPrivateFieldGet(this, _id);
        }
        if (_classPrivateFieldGet(this, _ceramic).did == null) {
            throw new Error('Ceramic instance is not authenticated');
        }
        return _classPrivateFieldGet(this, _ceramic).did.hasParent ? _classPrivateFieldGet(this, _ceramic).did.parent : _classPrivateFieldGet(this, _ceramic).did.id;
    }
    /**
   * {@linkcode TileLoader} instance used internally.
   */ get loader() {
        return _classPrivateFieldGet(this, _loader);
    }
    /**
   * {@linkcode DataModel} runtime instance used internally.
   */ get model() {
        return _classPrivateFieldGet(this, _model);
    }
    // High-level APIs
    /**
   * Returns whether a record exists in the index or not.
   */ async has(key, did) {
        const definitionID = this.getDefinitionID(key);
        const ref = await this.getRecordID(definitionID, did);
        return ref != null;
    }
    /**
   * Get the record contents.
   */ async get(key, did) {
        const definitionID = this.getDefinitionID(key);
        return await this.getRecord(definitionID, did);
    }
    /**
   * Get the record contents for multiple DIDs at once.
   */ async getMultiple(key, dids) {
        const definitionID = this.getDefinitionID(key);
        // Create determinitic queries for the IDX streams and add path of the definition
        const queries = await Promise.all(dids.map(async (did)=>{
            const { genesis , streamId  } = await getDeterministicQuery(getIDXMetadata(did));
            return {
                genesis,
                streamId: streamId.toString(),
                paths: [
                    definitionID
                ]
            };
        }));
        const streams = await _classPrivateFieldGet(this, _ceramic).multiQuery(queries);
        const results = [];
        for (const query of queries){
            // Lookup the record ID in the index to access the record contents
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            const recordURL = streams[query.streamId]?.content?.[definitionID];
            // Record IDs are set in URL format in the index, but string format in the streams object
            const record = recordURL ? streams[StreamID.fromString(recordURL).toString()] : null;
            results.push(record?.content ?? null);
        }
        return results;
    }
    /**
   * Set the record contents.
   *
   * **Warning**: calling this method replaces any existing contents in the record, use
   * {@linkcode merge} if you want to only change some fields.
   */ async set(key, content, options = {}) {
        const definitionID = this.getDefinitionID(key);
        const [created, id] = await this._setRecordOnly(definitionID, content, options);
        if (created) {
            await this._setReference(options.controller ?? this.id, definitionID, id);
        }
        return id;
    }
    /**
   * Perform a shallow (one level) merge of the record contents.
   */ async merge(key, content, options = {}) {
        const definitionID = this.getDefinitionID(key);
        const existing = await this.getRecord(definitionID);
        const newContent = existing ? {
            ...existing,
            ...content
        } : content;
        return await this.setRecord(definitionID, newContent, options);
    }
    /**
   * Set the contents of multiple records at once.
   * The index only gets updated after all wanted records have been written.
   *
   * **Warning**: calling this method replaces any existing contents in the records.
   */ async setAll(contents, options = {}) {
        const updates = Object.entries(contents).map(async ([alias, content])=>{
            const definitionID = this.getDefinitionID(alias);
            const [created, id] = await this._setRecordOnly(definitionID, content, options);
            return [
                created,
                definitionID,
                id
            ];
        });
        const changes = await Promise.all(updates);
        const newReferences = changes.reduce((acc, [created, key, id])=>{
            if (created) {
                acc[key] = id.toUrl();
            }
            return acc;
        }, {});
        await this._setReferences(options.controller ?? this.id, newReferences);
        return newReferences;
    }
    /**
   * Set the contents of multiple records if they are not already set in the index.
   */ async setDefaults(contents, options = {}) {
        const index = await this.getIndex() ?? {};
        const updates = Object.entries(contents).map(([alias, content])=>[
                this.getDefinitionID(alias),
                content, 
            ]
        ).filter((entry)=>index[entry[0]] == null
        ).map(async ([key, content])=>{
            const definition = await this.getDefinition(key);
            const id = await this._createRecord(definition, content, options);
            return {
                [key]: id.toUrl()
            };
        });
        const changes = await Promise.all(updates);
        const newReferences = changes.reduce((acc, keyToID)=>{
            return Object.assign(acc, keyToID);
        }, {});
        await this._setReferences(options.controller ?? this.id, newReferences);
        return newReferences;
    }
    /**
   * Remove a record from the index.
   *
   * **Notice**: this *does not* change the contents of the record itself, only the index.
   */ async remove(key, controller = this.id) {
        await this._getIndexProxy(controller).changeContent((index)=>{
            if (index != null) {
                delete index[this.getDefinitionID(key)];
            }
            return index;
        });
    }
    // Identity Index APIs
    /**
   * Load the full index contents.
   */ async getIndex(did = this.id) {
        const rootDoc = this.authenticated && did === this.id ? await this._getIndexProxy(did).get() : await this._getIDXDoc(did);
        return rootDoc ? rootDoc.content : null;
    }
    /**
   * Asynchronously iterate over the entries of the index, loading one record at a time.
   */ iterator(did) {
        let list;
        let cursor = 0;
        return {
            [Symbol.asyncIterator] () {
                return this;
            },
            next: async ()=>{
                if (list == null) {
                    const index = await this.getIndex(did);
                    list = Object.entries(index ?? {});
                }
                if (cursor === list.length) {
                    return {
                        done: true,
                        value: null
                    };
                }
                const [key, id] = list[cursor++];
                const doc = await _classPrivateFieldGet(this, _loader).load(id);
                return {
                    done: false,
                    value: {
                        key,
                        id,
                        record: doc.content
                    }
                };
            }
        };
    }
    /** @internal */ async _createIDXDoc(controller) {
        return await _classPrivateFieldGet(this, _loader).deterministic(getIDXMetadata(controller));
    }
    /** @internal */ async _getIDXDoc(did) {
        const doc = await this._createIDXDoc(did);
        if (doc.content == null || doc.metadata.schema == null) {
            return null;
        }
        if (doc.metadata.schema !== CIP11_INDEX_SCHEMA_URL) {
            throw new Error('Invalid document: schema is not IdentityIndex');
        }
        return doc;
    }
    /** @internal */ async _getOwnIDXDoc(did) {
        const doc = await this._createIDXDoc(did);
        if (doc.content == null || doc.metadata.schema == null) {
            // Doc just got created, set to empty object with schema
            await doc.update({}, {
                schema: CIP11_INDEX_SCHEMA_URL
            });
        } else if (doc.metadata.schema !== CIP11_INDEX_SCHEMA_URL) {
            throw new Error('Invalid document: schema is not IdentityIndex');
        }
        return doc;
    }
    /** @internal */ _getIndexProxy(controller) {
        let proxy = _classPrivateFieldGet(this, _indexProxies)[controller];
        if (proxy == null) {
            proxy = new TileProxy(async ()=>await this._getOwnIDXDoc(controller)
            );
            _classPrivateFieldGet(this, _indexProxies)[controller] = proxy;
        }
        return proxy;
    }
    // Definition APIs
    /**
   * Get the definition ID for the given alias.
   */ getDefinitionID(aliasOrID) {
        return _classPrivateFieldGet(this, _model).getDefinitionID(aliasOrID) ?? aliasOrID;
    }
    /**
   * Load and validate a definition by its ID.
   */ async getDefinition(id) {
        const doc = await _classPrivateFieldGet(this, _loader).load(id);
        if (doc.metadata.schema !== CIP11_DEFINITION_SCHEMA_URL) {
            throw new Error('Invalid document: schema is not Definition');
        }
        return {
            ...doc.content,
            id: doc.id
        };
    }
    // Record APIs
    /**
   * Load a record ID in the index for the given definition ID.
   */ async getRecordID(definitionID, did) {
        const index = await this.getIndex(did ?? this.id);
        return index?.[definitionID] ?? null;
    }
    /**
   * Load a record TileDocument for the given definition ID.
   */ async getRecordDocument(definitionID, did) {
        const id = await this.getRecordID(definitionID, did);
        return id ? await _classPrivateFieldGet(this, _loader).load(id) : null;
    }
    /**
   * Load a record contents for the given definition ID.
   */ async getRecord(definitionID, did) {
        const doc = await this.getRecordDocument(definitionID, did);
        return doc ? doc.content : null;
    }
    /**
   * Set the contents of a record for the given definition ID.
   */ async setRecord(definitionID, content, options = {}) {
        const [created, id] = await this._setRecordOnly(definitionID, content, options);
        if (created) {
            await this._setReference(options.controller ?? this.id, definitionID, id);
        }
        return id;
    }
    /** @internal */ async _setRecordOnly(definitionID, content, options) {
        const existing = await this.getRecordID(definitionID, options.controller ?? this.id);
        if (existing == null) {
            const definition = await this.getDefinition(definitionID);
            const ref = await this._createRecord(definition, content, options);
            return [
                true,
                ref
            ];
        } else {
            const doc = await _classPrivateFieldGet(this, _loader).update(existing, content);
            return [
                false,
                doc.id
            ];
        }
    }
    /** @internal */ async _createRecord(definition, content, { controller , pin  }) {
        // Doc must first be created in a deterministic way
        const doc = await _classPrivateFieldGet(this, _loader).deterministic({
            controllers: [
                controller ?? this.id
            ],
            family: definition.id.toString()
        }, {
            pin
        });
        // Then be updated with content and schema
        await doc.update(content, {
            schema: definition.schema
        });
        return doc.id;
    }
    // References APIs
    /** @internal */ async _setReference(controller, definitionID, id) {
        await this._getIndexProxy(controller).changeContent((index)=>{
            return {
                ...index,
                [definitionID]: id.toUrl()
            };
        });
    }
    /** @internal */ async _setReferences(controller, references) {
        if (Object.keys(references).length !== 0) {
            await this._getIndexProxy(controller).changeContent((index)=>{
                return {
                    ...index,
                    ...references
                };
            });
        }
    }
    constructor(params){
        _classPrivateFieldInit(this, _ceramic, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _id, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _indexProxies, {
            writable: true,
            value: {}
        });
        _classPrivateFieldInit(this, _loader, {
            writable: true,
            value: void 0
        });
        _classPrivateFieldInit(this, _model, {
            writable: true,
            value: void 0
        });
        const { cache , ceramic , id , loader , model  } = params;
        _classPrivateFieldSet(this, _ceramic, ceramic);
        _classPrivateFieldSet(this, _id, id);
        _classPrivateFieldSet(this, _loader, loader ?? new TileLoader({
            ceramic,
            cache
        }));
        _classPrivateFieldSet(this, _model, model instanceof DataModel ? model : new DataModel({
            loader: _classPrivateFieldGet(this, _loader),
            aliases: model
        }));
    }
}

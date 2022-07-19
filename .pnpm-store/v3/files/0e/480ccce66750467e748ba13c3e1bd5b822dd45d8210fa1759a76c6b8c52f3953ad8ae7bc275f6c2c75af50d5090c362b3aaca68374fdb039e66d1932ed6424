/**
 * Associate data records to a DID.
 *
 * ## Purpose
 *
 * The `did-datastore` module exports a `DIDDataStore` class allowing to associate Ceramic tiles to
 * a DID in a deterministic way by implementing the Identity Index (IDX) protocol described in the
 * {@link https://github.com/ceramicnetwork/CIP/blob/main/CIPs/CIP-11/CIP-11.md CIP-11 specification}.
 *
 * ## Installation
 *
 * ```sh
 * npm install @glazed/did-datastore
 * ```
 *
 * ## Common use-cases
 *
 * ### Read the contents of a record
 *
 * The {@linkcode DIDDataStore} instance uses a {@linkcode datamodel.DataModel DataModel} instance
 * to support aliases for definitions.
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { DataModel } from '@glazed/datamodel'
 * import { DIDDataStore } from '@glazed/did-datastore'
 *
 * const ceramic = new CeramicClient()
 * const aliases = {
 *  schemas: {
 *     MySchema: 'ceramic://k2...ab',
 *   },
 *   definitions: {
 *     myDefinition: 'k2...ef',
 *   },
 *   tiles: {},
 * }
 * const model = new DataModel({ ceramic, aliases })
 * const dataStore = new DIDDataStore({ ceramic, model })
 *
 * async function getMyDefinitionRecord(did) {
 *   return await dataStore.get('myDefinition', did)
 * }
 * ```
 *
 * ### Use a deployed model aliases object
 *
 * Instead of using a {@linkcode datamodel.DataModel DataModel} instance, it is possible to provide
 * a deployed model aliases object directly.
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { DIDDataStore } from '@glazed/did-datastore'
 *
 * const ceramic = new CeramicClient()
 * const aliases = {
 *  schemas: {
 *     MySchema: 'ceramic://k2...ab',
 *   },
 *   definitions: {
 *     myDefinition: 'k2...ef',
 *   },
 *   tiles: {},
 * }
 * const dataStore = new DIDDataStore({ ceramic, model: aliases })
 *
 * async function getMyDefinitionRecord(did) {
 *   return await dataStore.get('myDefinition', did)
 * }
 * ```
 *
 * ### Use a TileLoader instance
 *
 * The {@linkcode DIDDataStore} instance uses a {@linkcode tile-loader.TileLoader TileLoader}
 * instance internally to batch queries. It is possible to provide an instance to use instead, for
 * example to share it with other functions.
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { DIDDataStore } from '@glazed/did-datastore'
 * import { TileLoader } from '@glazed/tile-loader'
 *
 * const ceramic = new CeramicClient()
 * const loader = new TileLoader({ ceramic })
 * const aliases = {
 *  schemas: {
 *     MySchema: 'ceramic://k2...ab',
 *   },
 *   definitions: {
 *     myDefinition: 'k2...ef',
 *   },
 *   tiles: {},
 * }
 * const dataStore = new DIDDataStore({ ceramic, loader, model: aliases })
 *
 * async function getMyDefinitionRecord(did) {
 *   return await dataStore.get('myDefinition', did)
 * }
 * ```
 *
 * ### Set the contents of a record
 *
 * It is possible to set the contents of a record when the Ceramic instance is authenticated using
 * the {@linkcode DIDDataStore.set set} method.
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { DIDDataStore } from '@glazed/did-datastore'
 *
 * const ceramic = new CeramicClient()
 * const aliases = {
 *  schemas: {
 *     MySchema: 'ceramic://k2...ab',
 *   },
 *   definitions: {
 *     myDefinition: 'k2...ef',
 *   },
 *   tiles: {},
 * }
 * const dataStore = new DIDDataStore({ ceramic, model: aliases })
 *
 * async function setMyDefinitionRecord(content) {
 *   // This will throw an error if the Ceramic instance is not authenticated
 *   return await dataStore.set('myDefinition', content)
 * }
 * ```
 *
 * ### Merge the contents of a record
 *
 * Rather than completely replacing the contents of a record using the `set` method, the
 * {@linkcode DIDDataStore.merge merge} method can be used to only replace the specified fields.
 *
 * The `merge` method only applies a shallow (one level) replacement, if you need a deep merge or
 * more complex logic, you should implement it directly using the {@linkcode DIDDataStore.get get}
 * and {@linkcode DIDDataStore.set set} methods.
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { DIDDataStore } from '@glazed/did-datastore'
 *
 * const ceramic = new CeramicClient()
 * const aliases = {
 *  schemas: {
 *     MySchema: 'ceramic://k2...ab',
 *   },
 *   definitions: {
 *     myDefinition: 'k2...ef',
 *   },
 *   tiles: {},
 * }
 * const dataStore = new DIDDataStore({ ceramic, model: aliases })
 *
 * async function setMyDefinitionRecord(content) {
 *   // This will only replace the fields present in the input `content` object, other fields
 *   // already present in the record will not be affected
 *   return await dataStore.merge('myDefinition', content)
 * }
 * ```
 *
 * @module did-datastore
 */
import type { CeramicApi } from '@ceramicnetwork/common';
import { StreamID } from '@ceramicnetwork/streamid';
import { DataModel } from '@glazed/datamodel';
import type { Definition, IdentityIndex } from '@glazed/did-datastore-model';
import { type TileCache, TileLoader } from '@glazed/tile-loader';
import type { ModelTypeAliases, ModelTypesToAliases } from '@glazed/types';
import { TileProxy, type TileDoc } from './proxy.js';
export { assertDIDstring, isDIDstring } from './utils.js';
export declare type DefinitionContentType<ModelTypes extends ModelTypeAliases, Alias extends keyof ModelTypes['definitions']> = ModelTypes['schemas'][ModelTypes['definitions'][Alias]];
export declare type DefinitionsContentTypes<ModelTypes extends ModelTypeAliases, Fallback = Record<string, unknown>> = {
    [Key: string]: typeof Key extends keyof ModelTypes['definitions'] ? DefinitionContentType<ModelTypes, typeof Key> : Fallback;
};
export declare type DefinitionWithID<Config extends Record<string, unknown> = Record<string, unknown>> = Definition<Config> & {
    id: StreamID;
};
export declare type Entry = {
    /**
     * Key (definition ID) identifying the record ID in the index
     */
    key: string;
    /**
     * Record ID (Ceramic StreamID)
     */
    id: string;
    /**
     * Record contents
     */
    record: unknown;
};
export declare type CreateOptions = {
    /**
     * Optional controller for the record
     */
    controller?: string;
    /**
     * Pin the created record stream (default)
     */
    pin?: boolean;
};
export declare type DIDDataStoreParams<ModelTypes extends ModelTypeAliases = ModelTypeAliases> = {
    /**
     * {@linkcode TileLoader} cache parameter, only used if `loader` is not provided
     */
    cache?: TileCache | boolean;
    /**
     * A Ceramic client instance
     */
    ceramic: CeramicApi;
    /**
     * Fallback DID to use when not explicitly set in method calls
     */
    id?: string;
    /**
     * An optional {@linkcode TileLoader} instance to use
     */
    loader?: TileLoader;
    /**
     * A {@linkcode DataModel} instance or {@linkcode types.ModelAliases runtime model aliases} to use
     */
    model: DataModel<ModelTypes> | ModelTypesToAliases<ModelTypes>;
};
/**
 * The DIDDataStore class provides simple APIs to interact with data records associated to a DID.
 *
 * It is exported by the {@linkcode did-datastore} module.
 *
 * ```sh
 * import { DIDDataStore } from '@glazed/did-datastore'
 * ```
 */
export declare class DIDDataStore<ModelTypes extends ModelTypeAliases = ModelTypeAliases, Alias extends keyof ModelTypes['definitions'] = keyof ModelTypes['definitions']> {
    #private;
    constructor(params: DIDDataStoreParams<ModelTypes>);
    /**
     * Returns whether a DID instance is attached to the Ceramic client instance used internally or
     * not.
     */
    get authenticated(): boolean;
    /**
     * Ceramic client instance used internally.
     */
    get ceramic(): CeramicApi;
    /**
     * Returns the DID string currently authenticated on the Ceramic instance used internally, or
     * throws an error if not authenticated.
     */
    get id(): string;
    /**
     * {@linkcode TileLoader} instance used internally.
     */
    get loader(): TileLoader;
    /**
     * {@linkcode DataModel} runtime instance used internally.
     */
    get model(): DataModel<ModelTypes>;
    /**
     * Returns whether a record exists in the index or not.
     */
    has(key: Alias, did?: string): Promise<boolean>;
    /**
     * Get the record contents.
     */
    get<Key extends Alias, ContentType = DefinitionContentType<ModelTypes, Key>>(key: Key, did?: string): Promise<ContentType | null>;
    /**
     * Get the record contents for multiple DIDs at once.
     */
    getMultiple<Key extends Alias, ContentType = DefinitionContentType<ModelTypes, Key>>(key: Key, dids: Array<string>): Promise<Array<ContentType | null>>;
    /**
     * Set the record contents.
     *
     * **Warning**: calling this method replaces any existing contents in the record, use
     * {@linkcode merge} if you want to only change some fields.
     */
    set<Key extends Alias, ContentType = DefinitionContentType<ModelTypes, Key>>(key: Key, content: ContentType, options?: CreateOptions): Promise<StreamID>;
    /**
     * Perform a shallow (one level) merge of the record contents.
     */
    merge<Key extends Alias, ContentType = DefinitionContentType<ModelTypes, Key>>(key: Key, content: ContentType, options?: CreateOptions): Promise<StreamID>;
    /**
     * Set the contents of multiple records at once.
     * The index only gets updated after all wanted records have been written.
     *
     * **Warning**: calling this method replaces any existing contents in the records.
     */
    setAll<Contents extends DefinitionsContentTypes<ModelTypes>>(contents: Contents, options?: CreateOptions): Promise<IdentityIndex>;
    /**
     * Set the contents of multiple records if they are not already set in the index.
     */
    setDefaults<Contents extends DefinitionsContentTypes<ModelTypes>>(contents: Contents, options?: CreateOptions): Promise<IdentityIndex>;
    /**
     * Remove a record from the index.
     *
     * **Notice**: this *does not* change the contents of the record itself, only the index.
     */
    remove(key: Alias, controller?: string): Promise<void>;
    /**
     * Load the full index contents.
     */
    getIndex(did?: string): Promise<IdentityIndex | null>;
    /**
     * Asynchronously iterate over the entries of the index, loading one record at a time.
     */
    iterator(did?: string): AsyncIterableIterator<Entry>;
    /** @internal */
    _createIDXDoc(controller: string): Promise<TileDoc>;
    /** @internal */
    _getIDXDoc(did: string): Promise<TileDoc | null>;
    /** @internal */
    _getOwnIDXDoc(did: string): Promise<TileDoc>;
    /** @internal */
    _getIndexProxy(controller: string): TileProxy;
    /**
     * Get the definition ID for the given alias.
     */
    getDefinitionID(aliasOrID: string): string;
    /**
     * Load and validate a definition by its ID.
     */
    getDefinition(id: StreamID | string): Promise<DefinitionWithID>;
    /**
     * Load a record ID in the index for the given definition ID.
     */
    getRecordID(definitionID: string, did?: string): Promise<string | null>;
    /**
     * Load a record TileDocument for the given definition ID.
     */
    getRecordDocument(definitionID: string, did?: string): Promise<TileDoc | null>;
    /**
     * Load a record contents for the given definition ID.
     */
    getRecord<ContentType = unknown>(definitionID: string, did?: string): Promise<ContentType | null>;
    /**
     * Set the contents of a record for the given definition ID.
     */
    setRecord(definitionID: string, content: Record<string, any>, options?: CreateOptions): Promise<StreamID>;
    /** @internal */
    _setRecordOnly(definitionID: string, content: Record<string, any>, options: CreateOptions): Promise<[boolean, StreamID]>;
    /** @internal */
    _createRecord(definition: DefinitionWithID, content: Record<string, any>, { controller, pin }: CreateOptions): Promise<StreamID>;
    /** @internal */
    _setReference(controller: string, definitionID: string, id: StreamID): Promise<void>;
    /** @internal */
    _setReferences(controller: string, references: IdentityIndex): Promise<void>;
}

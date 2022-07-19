/**
 * Batching and caching for Ceramic streams.
 *
 * ## Purpose
 *
 * The `tile-loader` module exports a `TileLoader` class providing batching and caching for Tile
 * load and creation in order to improve client-side performance.
 *
 * ## Installation
 *
 * ```sh
 * npm install @glazed/tile-loader
 * ```
 *
 * ## Common use-cases
 *
 * ### Batch stream loads
 *
 * Batching consists in the process of combining multiple concurrent queries to a Ceramic node into
 * a single one.
 *
 * Using a loader instance in the following example, the two streams will be loaded with a single
 * request to the Ceramic node:
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { TileLoader } from '@glazed/tile-loader'
 *
 * const ceramic = new CeramicClient()
 * const loader = new TileLoader({ ceramic })
 *
 * async function loadStreams() {
 *   const [stream1, stream2] = await Promise.all([
 *     loader.load('k2...ab'),
 *     loader.load('k2...cd'),
 *   ])
 * }
 * ```
 *
 * ### Cache loaded streams
 *
 * Caching consists in keeping track of streams loaded from a Ceramic node.
 *
 * Caching is **disabled by default** and **may not be suited for your use-cases**, make sure you
 * carefully consider the trade-offs before enabling it. Streams loaded from the cache may be out
 * of date from the state on the Ceramic network, so applications should be designed accordingly.
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { TileLoader } from '@glazed/tile-loader'
 *
 * const ceramic = new CeramicClient()
 * const loader = new TileLoader({ ceramic, cache: true })
 *
 * async function loadStream() {
 *   // Load the stream at some point in your app
 *   const stream = await loader.load('k2...ab')
 * }
 *
 * async function alsoLoadStream() {
 *   // Maybe the same stream needs to be loaded at a different time or in another part of your app
 *   const streamAgain = await loader.load('k2...ab')
 * }
 * ```
 *
 * ### Use a custom cache
 *
 * When setting the `cache` option to `true` in the loader constructor, the cache will live as long
 * as the loader instance. This means any individual stream will only ever get loaded once, and
 * persist in memory until the loader instance is deleted.
 *
 * It is possible to provide a custom cache implementation in the loader constructor to customize
 * this behavior, for example in order to limit memory usage by restricting the number of streams
 * kept in the cache, or discarding loaded streams after a given period of time.
 *
 * A custom cache must implement a subset of the `Map` interface, defined by the
 * {@linkcode TileCache} interface.
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { TileLoader } from '@glazed/tile-loader'
 *
 * const ceramic = new CeramicClient()
 * // The cache must implement a subset of the Map interface
 * const cache = new Map()
 * const loader = new TileLoader({ ceramic, cache })
 *
 * async function load(id) {
 *   // The loader will cache the request as soon as the load() method is called, so the stored
 *   // value is a Promise of a TileDocument
 *   return await loader.load(id)
 * }
 *
 * function getFromCache(id) {
 *   return cache.get(id) // Promise<TileDocument>
 * }
 * ```
 *
 * ### Create and cache a stream
 *
 * The `create` method adds the created stream to the internal cache of the loader. This has no
 * effect if the cache is disabled.
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { TileLoader } from '@glazed/tile-loader'
 *
 * const ceramic = new CeramicClient()
 * const loader = new TileLoader({ ceramic, cache: true })
 *
 * async function createAndLoad() {
 *   const stream = await loader.create({ hello: world })
 *   // The following call will returne the stream from the cache
 *   await loader.load(stream.id)
 * }
 * ```
 *
 * ### Load a deterministic stream
 *
 * Using the `deterministic` method of a loader instance allows to load such streams while
 * benefiting from the batching and caching functionalities of the loader.
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { TileLoader } from '@glazed/tile-loader'
 *
 * const ceramic = new CeramicClient()
 * const loader = new TileLoader({ ceramic, cache: true })
 *
 * async function load() {
 *   // The following call will load the latest version of the stream based on its metadata
 *   const stream = await loader.deterministic({ controllers: ['did:key:...'], family: 'test' })
 * }
 * ```
 *
 * @module tile-loader
 */
import type { CeramicApi, CreateOpts, MultiQuery, UpdateOpts } from '@ceramicnetwork/common';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import type { TileMetadataArgs } from '@ceramicnetwork/stream-tile';
import { CommitID, StreamID } from '@ceramicnetwork/streamid';
import DataLoader from 'dataloader';
/**
 * Omit `path` and `atTime` from
 * {@link https://developers.ceramic.network/reference/typescript/interfaces/_ceramicnetwork_common.multiquery-1.html MultiQuery}
 * as the cache needs to be deterministic based on the ID.
 */
export declare type TileQuery = Omit<MultiQuery, 'paths' | 'atTime'>;
export declare type TileKey = CommitID | StreamID | TileQuery | string;
export declare type TileCache = {
    /**
     * Get a Promise of a TileDocument by its stream ID
     */
    get(id: string): Promise<TileDocument> | void;
    /**
     * Set a Promise of a TileDocument by its stream ID
     */
    set(id: string, value: Promise<TileDocument>): any;
    /**
     * Remove a specific entry from the cache
     */
    delete(id: string): any;
    /**
     * Remove all entries from the cache
     */
    clear(): any;
};
export declare type TileLoaderParams = {
    /**
     * A Ceramic client instance
     */
    ceramic: CeramicApi;
    /**
     * A supported cache implementation, `true` to use the default implementation or `false` to
     * disable the cache (default)
     */
    cache?: TileCache | boolean;
    /**
     * MultiQuery request timeout in milliseconds
     */
    multiqueryTimeout?: number;
};
/** @internal */
export declare function keyToQuery(key: TileKey): TileQuery;
/** @internal */
export declare function keyToString(key: TileKey): string;
/**
 * Create a {@linkcode TileQuery} for a determinitic TileDocument based on its metadata.
 */
export declare function getDeterministicQuery(metadata: TileMetadataArgs): Promise<TileQuery>;
/**
 * A TileLoader extends {@link https://github.com/graphql/dataloader DataLoader} to provide
 * batching and caching functionalities for loading TileDocument streams.
 *
 * It is exported by the {@linkcode tile-loader} module.
 *
 * ```sh
 * import { TileLoader } from '@glazed/tile-loader'
 * ```
 */
export declare class TileLoader extends DataLoader<TileKey, TileDocument> {
    #private;
    constructor(params: TileLoaderParams);
    /**
     * Add a TileDocument to the local cache, if enabled.
     */
    cache(stream: TileDocument): boolean;
    /**
     * Create a new TileDocument and add it to the cache, if enabled.
     */
    create<T extends Record<string, any> = Record<string, any>>(content: T, metadata?: TileMetadataArgs, options?: CreateOpts): Promise<TileDocument<T>>;
    /**
     * Create or load a deterministic TileDocument based on its metadata.
     */
    deterministic<T extends Record<string, any> = Record<string, any>>(metadata: TileMetadataArgs, options?: CreateOpts): Promise<TileDocument<T | null | undefined>>;
    /**
     * Load a TileDocument from the cache (if enabled) or remotely.
     */
    load<T extends Record<string, any> = Record<string, any>>(key: TileKey): Promise<TileDocument<T>>;
    /**
     * Update a TileDocument after loading the stream remotely, bypassing the cache.
     */
    update<T extends Record<string, any> = Record<string, any>>(streamID: string | StreamID, content?: T, metadata?: TileMetadataArgs, options?: UpdateOpts): Promise<TileDocument<T | null | undefined>>;
}

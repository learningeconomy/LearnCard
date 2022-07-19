/**
 * Aliases for Ceramic stream references.
 *
 * ## Purpose
 *
 * The `datamodel` module exports a `DataModel` class for **runtime** interactions with a published
 * data model, using aliases for Ceramic stream IDs.
 *
 * ## Installation
 *
 * ```sh
 * npm install @glazed/datamodel
 * ```
 *
 * ## Common use-cases
 *
 * ### Get the ID of a known alias
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { DataModel } from '@glazed/datamodel'
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
 *
 * function getMySchemaURL() {
 *   return model.getSchemaURL('MySchema') // 'ceramic://k2...ab'
 * }
 *
 * function getMyDefinitionID() {
 *   return model.getDefinitionID('myDefinition') // 'k2...ef'
 * }
 * ```
 *
 * ### Load a tile by alias
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { DataModel } from '@glazed/datamodel'
 *
 * const ceramic = new CeramicClient()
 * const aliases = {
 *  schemas: {
 *     MySchema: 'ceramic://k2...ab',
 *   },
 *   definitions: {},
 *   tiles: {
 *     myTile: 'k2...cd',
 *   },
 * }
 * const model = new DataModel({ ceramic, aliases })
 *
 * async function loadMyTile() {
 *   return await model.loadTile('myTile')
 * }
 * ```
 *
 * ### Create a tile with a schema alias
 *
 * ```ts
 * import { CeramicClient } from '@ceramicnetwork/http-client'
 * import { DataModel } from '@glazed/datamodel'
 *
 * const ceramic = new CeramicClient()
 * const aliases = {
 *  schemas: {
 *     MySchema: 'ceramic://k2...ab',
 *   },
 *   definitions: {},
 *   tiles: {},
 * }
 * const model = new DataModel({ ceramic, aliases })
 *
 * async function createTileWithMySchema(content) {
 *   return await model.createTile('MySchema', content)
 * }
 * ```
 *
 * @module datamodel
 */
import type { CeramicApi, CreateOpts } from '@ceramicnetwork/common';
import type { TileDocument } from '@ceramicnetwork/stream-tile';
import { TileLoader } from '@glazed/tile-loader';
import type { TileCache } from '@glazed/tile-loader';
import type { ModelTypeAliases, ModelTypesToAliases } from '@glazed/types';
export declare type CreateOptions = CreateOpts & {
    controller?: string;
};
export declare type DataModelParams<Aliases> = {
    /**
     * The runtime {@linkcode types.ModelAliases model aliases} to use
     */
    aliases: Aliases;
    /**
     * {@linkcode TileLoader} cache parameter, only used if `loader` is not provided
     */
    cache?: TileCache | boolean;
    /**
     * A Ceramic client instance, only used if `loader` is not provided
     */
    ceramic?: CeramicApi;
    /**
     * A {@linkcode TileLoader} instance to use, must be provided if `ceramic` is not provided
     */
    loader?: TileLoader;
};
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
 */
export declare class DataModel<ModelTypes extends ModelTypeAliases, ModelAliases extends ModelTypesToAliases<ModelTypes> = ModelTypesToAliases<ModelTypes>> {
    #private;
    constructor(params: DataModelParams<ModelAliases>);
    /**
     * {@linkcode types.ModelAliases Model aliases} provided in constructor.
     */
    get aliases(): ModelAliases;
    /**
     * {@linkcode TileLoader} instance used internally.
     */
    get loader(): TileLoader;
    /**
     * Returns the definition stream ID for a given alias, if present in local model aliases.
     */
    getDefinitionID<Alias extends keyof ModelAliases['definitions']>(alias: Alias): string | null;
    /**
     * Returns the schema stream URL for a given alias, if present in local model aliases.
     */
    getSchemaURL<Alias extends keyof ModelAliases['schemas']>(alias: Alias): string | null;
    /**
     * Returns the tile stream ID for a given alias, if present in local model aliases.
     */
    getTileID<Alias extends keyof ModelAliases['tiles']>(alias: Alias): string | null;
    /**
     * Load the TileDocument identified by the given `alias`.
     */
    loadTile<Alias extends keyof ModelAliases['tiles'], ContentType = ModelTypes['schemas'][ModelTypes['tiles'][Alias]]>(alias: Alias): Promise<TileDocument<ContentType> | null>;
    /**
     * Create a TileDocument using a schema identified by the given `schemaAlias`.
     */
    createTile<Alias extends keyof ModelAliases['schemas'], ContentType = ModelTypes['schemas'][Alias]>(schemaAlias: Alias, content: ContentType, options?: CreateOptions): Promise<TileDocument<ContentType>>;
}

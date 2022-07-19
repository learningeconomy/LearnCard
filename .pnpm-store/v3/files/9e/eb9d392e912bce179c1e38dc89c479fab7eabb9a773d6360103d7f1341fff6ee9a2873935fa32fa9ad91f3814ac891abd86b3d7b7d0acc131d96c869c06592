/**
 * Common types used by Glaze packages.
 *
 * @module types
 */
import type { JSONSchemaType } from 'ajv';
import type { DagJWSResult, JWSSignature } from 'dids';
/** JSON-encoded DAG-JWS. */
export declare type EncodedDagJWS = {
    payload: string;
    signatures: Array<JWSSignature>;
    link?: string;
};
/** JSON-encoded DAG-JWS result representing a Ceramic stream commit. */
export declare type EncodedDagJWSResult = {
    jws: EncodedDagJWS;
    linkedBlock: string;
};
/** JSON schema declaration, used for validating Ceramic streams. */
export declare type Schema<T = Record<string, any>> = JSONSchemaType<T> & {
    $comment?: string;
    title?: string;
};
/** Generic structure for storing model data. */
export declare type ModelData<T> = {
    definitions: Record<string, T>;
    schemas: Record<string, T>;
    tiles: Record<string, T>;
};
/** Utility type for mapping a model structure of a given type to another. */
export declare type MapModelTypes<Model extends ModelData<any>, ToType> = {
    schemas: Record<keyof Model['schemas'], ToType>;
    definitions: Record<keyof Model['definitions'], ToType>;
    tiles: Record<keyof Model['tiles'], ToType>;
};
/** Utility type for mapping a model structure to a given type. */
export declare type CastModelTo<Model extends ModelData<any> | void, ToType> = Model extends ModelData<any> ? MapModelTypes<Model, ToType> : ModelData<ToType>;
/**
 * Data model aliases created by {@linkcode devtools.ModelManager.deploy deploying a managed model}
 * and used at runtime by the {@linkcode datamodel.DataModel DataModel} class.
 */
export declare type ModelAliases<Model extends ModelData<any> | void = void> = CastModelTo<Model, string>;
/** Model aliases relations between schemas and the definitions and tiles using them. */
export declare type ModelTypeAliases<Schemas extends Record<string, any> = Record<string, any>, Definitions extends Record<string, keyof Schemas> = Record<string, string>, Tiles extends Record<string, keyof Schemas> = Record<string, string>> = {
    schemas: Schemas;
    definitions: Definitions;
    tiles: Tiles;
};
/** Utility type to cast {@linkcode ModelTypeAliases} to {@linkcode ModelAliases}. */
export declare type ModelTypesToAliases<TypeAliases extends ModelTypeAliases> = MapModelTypes<TypeAliases, string>;
/** ID of a stream used in a {@linkcode ManagedModel}. */
export declare type ManagedID = string;
/** Shared structure for representing streams used in a {@linkcode ManagedModel}. */
export declare type ManagedDoc<CommitType = DagJWSResult> = {
    alias: string;
    commits: Array<CommitType>;
    version: string;
};
/**
 * Structure for representing streams having a schema dependency, used in a
 * {@linkcode ManagedModel}.
 */
export declare type ManagedEntry<CommitType = DagJWSResult> = ManagedDoc<CommitType> & {
    schema: ManagedID;
};
/**
 * Structure for representing schema streams and their dependencies, used in a
 * {@linkcode ManagedModel}.
 */
export declare type ManagedSchema<CommitType = DagJWSResult> = ManagedDoc<CommitType> & {
    dependencies: Record<string, Array<ManagedID>>;
};
/**
 * Structure used internally by the {@linkcode devtools.ModelManager ModelManager} to represent a
 * data model.
 */
export declare type ManagedModel<CommitType = DagJWSResult> = {
    schemas: Record<ManagedID, ManagedSchema<CommitType>>;
    definitions: Record<ManagedID, ManagedEntry<CommitType>>;
    tiles: Record<ManagedID, ManagedEntry<CommitType>>;
};
/**
 * JSON-encoded version of the {@linkcode ManagedModel}, used by the
 * {@linkcode devtools.ModelManager ModelManager}.
 */
export declare type EncodedManagedModel = ManagedModel<EncodedDagJWSResult>;

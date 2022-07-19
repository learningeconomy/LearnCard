import { LoadOpts, Stream, CeramicApi } from '@ceramicnetwork/common';
import { CommitID, StreamID } from '@ceramicnetwork/streamid';
import type { JSONSchema } from 'json-schema-typed/draft-2020-12';
export interface ModelMetadataArgs {
    controller: string;
}
export interface ModelMetadata {
    controller: string;
    model: StreamID;
}
export declare enum ModelAccountRelation {
    LIST = "list",
    SINGLE = "single"
}
export declare type ModelViewDefinition = {
    type: 'documentAccount';
} | {
    type: 'documentVersion';
};
export declare type ModelViewsDefinition = Record<string, ModelViewDefinition>;
export interface ModelDefinition {
    name: string;
    description?: string;
    schema: JSONSchema.Object;
    accountRelation: ModelAccountRelation;
    views?: ModelViewsDefinition;
}
export declare class Model extends Stream {
    static STREAM_TYPE_NAME: string;
    static STREAM_TYPE_ID: number;
    static readonly MODEL: StreamID;
    private _isReadOnly;
    get content(): ModelDefinition;
    get metadata(): ModelMetadata;
    static create(ceramic: CeramicApi, content: ModelDefinition, metadata?: ModelMetadataArgs): Promise<Model>;
    static createPlaceholder(ceramic: CeramicApi, content: Partial<ModelDefinition>, metadata?: ModelMetadataArgs): Promise<Model>;
    replacePlaceholder(content: ModelDefinition): Promise<void>;
    static assertComplete(content: ModelDefinition, streamId?: StreamID | CommitID | string): void;
    static load(ceramic: CeramicApi, streamId: StreamID | CommitID | string, opts?: LoadOpts): Promise<Model>;
    private _makeCommit;
    private _makeRawCommit;
    private static _makeGenesis;
    private static _makeRawGenesis;
    makeReadOnly(): void;
    get isReadOnly(): boolean;
    private static _signDagJWS;
}
//# sourceMappingURL=model.d.ts.map
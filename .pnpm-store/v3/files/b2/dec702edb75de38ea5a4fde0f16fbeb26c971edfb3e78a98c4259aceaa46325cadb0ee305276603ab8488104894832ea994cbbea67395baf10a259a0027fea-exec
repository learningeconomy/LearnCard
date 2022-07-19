import type { Operation } from 'fast-json-patch';
import { CreateOpts, LoadOpts, UpdateOpts, Stream, CeramicApi } from '@ceramicnetwork/common';
import { CommitID, StreamID } from '@ceramicnetwork/streamid';
export interface ModelInstanceDocumentMetadataArgs {
    controller?: string;
    model: StreamID;
}
export interface ModelInstanceDocumentMetadata {
    controller: string;
    model: StreamID;
}
export declare class ModelInstanceDocument<T = Record<string, any>> extends Stream {
    static STREAM_TYPE_NAME: string;
    static STREAM_TYPE_ID: number;
    private _isReadOnly;
    get content(): T;
    get metadata(): ModelInstanceDocumentMetadata;
    static create<T>(ceramic: CeramicApi, content: T | null, metadata: ModelInstanceDocumentMetadataArgs, opts?: CreateOpts): Promise<ModelInstanceDocument<T>>;
    static load<T>(ceramic: CeramicApi, streamId: StreamID | CommitID | string, opts?: LoadOpts): Promise<ModelInstanceDocument<T>>;
    replace(content: T | null, opts?: UpdateOpts): Promise<void>;
    patch(jsonPatch: Operation[], opts?: UpdateOpts): Promise<void>;
    makeReadOnly(): void;
    get isReadOnly(): boolean;
    private _makeCommit;
    private _makeRawCommit;
    private static _makeGenesis;
    private static _makeRawGenesis;
    private static _signDagJWS;
}
//# sourceMappingURL=model-instance-document.d.ts.map
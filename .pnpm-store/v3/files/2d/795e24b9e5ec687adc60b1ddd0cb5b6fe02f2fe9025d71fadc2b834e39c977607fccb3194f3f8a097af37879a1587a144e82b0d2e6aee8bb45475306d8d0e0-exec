import type { Operation } from 'fast-json-patch';
import { CreateOpts, LoadOpts, UpdateOpts, Stream, CeramicCommit, GenesisCommit, CeramicApi, StreamMetadata, CeramicSigner } from '@ceramicnetwork/common';
import { CommitID, StreamID } from '@ceramicnetwork/streamid';
export interface TileMetadataArgs {
    controllers?: Array<string>;
    family?: string;
    tags?: Array<string>;
    schema?: CommitID | string;
    deterministic?: boolean;
    forbidControllerChange?: boolean;
}
export declare type TileMetadata = StreamMetadata;
export declare class TileDocument<T = Record<string, any>> extends Stream {
    static STREAM_TYPE_NAME: string;
    static STREAM_TYPE_ID: number;
    private _isReadOnly;
    get content(): T;
    get metadata(): TileMetadata;
    static create<T>(ceramic: CeramicApi, content: T | null | undefined, metadata?: TileMetadataArgs, opts?: CreateOpts): Promise<TileDocument<T>>;
    static createFromGenesis<T>(ceramic: CeramicApi, genesisCommit: GenesisCommit, opts?: CreateOpts): Promise<TileDocument<T>>;
    static deterministic<T>(ceramic: CeramicApi, metadata: TileMetadataArgs, opts?: CreateOpts): Promise<TileDocument<T>>;
    static load<T>(ceramic: CeramicApi, streamId: StreamID | CommitID | string, opts?: LoadOpts): Promise<TileDocument<T>>;
    update(content: T | null | undefined, metadata?: TileMetadataArgs, opts?: UpdateOpts): Promise<void>;
    patch(jsonPatch: Operation[], opts?: UpdateOpts): Promise<void>;
    makeReadOnly(): void;
    get isReadOnly(): boolean;
    makeCommit(signer: CeramicSigner, newContent: T | null | undefined, newMetadata?: TileMetadataArgs): Promise<CeramicCommit>;
    private _makeRawCommit;
    static makeGenesis<T>(signer: CeramicSigner, content: T | null | undefined, metadata?: TileMetadataArgs): Promise<CeramicCommit>;
    private static _signDagJWS;
}
//# sourceMappingURL=tile-document.d.ts.map
import type { DID } from 'dids';
import { CreateOpts, CeramicApi, CeramicCommit, Context, Stream, StreamConstructor, StreamHandler, LoadOpts, MultiQuery, PinApi, UpdateOpts, AnchorStatus, IndexApi, StreamState } from '@ceramicnetwork/common';
import { StreamID, CommitID } from '@ceramicnetwork/streamid';
export declare const DEFAULT_CLIENT_CONFIG: CeramicClientConfig;
export interface CeramicClientConfig {
    syncInterval: number;
}
export declare class CeramicClient implements CeramicApi {
    private readonly _apiUrl;
    private readonly _streamCache;
    private _supportedChains;
    readonly pin: PinApi;
    readonly index: IndexApi;
    readonly context: Context;
    private readonly _config;
    readonly _streamConstructors: Record<number, StreamConstructor<Stream>>;
    constructor(apiHost?: string, config?: Partial<CeramicClientConfig>);
    get did(): DID | undefined;
    set did(did: DID);
    createStreamFromGenesis<T extends Stream>(type: number, genesis: any, opts?: CreateOpts): Promise<T>;
    loadStream<T extends Stream>(streamId: StreamID | CommitID | string, opts?: LoadOpts): Promise<T>;
    multiQuery(queries: Array<MultiQuery>, timeout?: number): Promise<Record<string, Stream>>;
    loadStreamCommits(streamId: string | StreamID): Promise<Record<string, any>[]>;
    applyCommit<T extends Stream>(streamId: string | StreamID, commit: CeramicCommit, opts?: CreateOpts | UpdateOpts): Promise<T>;
    requestAnchor(streamId: string | StreamID, opts?: LoadOpts): Promise<AnchorStatus>;
    addStreamHandler<T extends Stream>(streamHandler: StreamHandler<T>): void;
    buildStreamFromState<T extends Stream = Stream>(state: StreamState): T;
    private buildStreamFromDocument;
    setDID(did: DID): Promise<void>;
    getSupportedChains(): Promise<Array<string>>;
    close(): Promise<void>;
}
//# sourceMappingURL=ceramic-http-client.d.ts.map
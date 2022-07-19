import type { DID } from 'dids';
import type { Stream, StreamHandler, CeramicCommit, AnchorStatus, StreamState } from './stream.js';
import type { CreateOpts, LoadOpts, PublishOpts, UpdateOpts } from './streamopts.js';
import type { StreamID, CommitID } from '@ceramicnetwork/streamid';
import type { LoggerProvider } from './logger-provider.js';
import type { GenesisCommit } from './index.js';
import type { IndexApi } from './index-api.js';
export interface PinApi {
    add(streamId: StreamID, force?: boolean): Promise<void>;
    rm(streamId: StreamID, opts?: PublishOpts): Promise<void>;
    ls(streamId?: StreamID): Promise<AsyncIterable<string>>;
}
export type { DIDProvider } from 'dids';
interface CeramicCommon {
    loggerProvider?: LoggerProvider;
}
export interface CeramicSigner extends CeramicCommon {
    did: DID | undefined;
    [index: string]: any;
}
export interface CeramicApi extends CeramicSigner {
    readonly pin: PinApi;
    readonly index: IndexApi;
    addStreamHandler<T extends Stream>(streamHandler: StreamHandler<T>): void;
    createStreamFromGenesis<T extends Stream>(type: number, genesis: any, opts?: CreateOpts): Promise<T>;
    loadStream<T extends Stream>(streamId: StreamID | CommitID | string, opts?: LoadOpts): Promise<T>;
    loadStreamCommits(streamId: StreamID | string): Promise<Array<Record<string, any>>>;
    multiQuery(queries: Array<MultiQuery>, timeout?: number): Promise<Record<string, Stream>>;
    applyCommit<T extends Stream>(streamId: StreamID | string, commit: CeramicCommit, opts?: CreateOpts | UpdateOpts): Promise<T>;
    requestAnchor(streamId: StreamID | string, opts?: LoadOpts): Promise<AnchorStatus>;
    setDID(did: DID): Promise<void>;
    getSupportedChains(): Promise<Array<string>>;
    buildStreamFromState<T extends Stream = Stream>(state: StreamState): T;
    close(): Promise<void>;
}
export interface MultiQuery {
    genesis?: GenesisCommit;
    streamId: CommitID | StreamID | string;
    paths?: Array<string>;
    atTime?: number;
}
//# sourceMappingURL=ceramic-api.d.ts.map
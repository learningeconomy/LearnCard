import type { CID } from 'multiformats/cid';
import type { Context } from './context.js';
import { StreamID } from '@ceramicnetwork/streamid';
import { CommitID } from '@ceramicnetwork/streamid';
import type { DagJWS, DagJWSResult } from 'dids';
import { Observable } from 'rxjs';
import type { RunningStateLike } from './running-state-like.js';
import type { CeramicApi } from './ceramic-api.js';
import { LoadOpts } from './streamopts.js';
import type { Cacao } from 'ceramic-cacao';
export declare enum SignatureStatus {
    GENESIS = 0,
    PARTIAL = 1,
    SIGNED = 2
}
export declare enum AnchorStatus {
    NOT_REQUESTED = 0,
    PENDING = 1,
    PROCESSING = 2,
    ANCHORED = 3,
    FAILED = 4
}
export interface CommitHeader {
    controllers: Array<string>;
    family?: string;
    model?: Uint8Array;
    schema?: string;
    tags?: Array<string>;
    [index: string]: any;
}
export interface GenesisHeader extends CommitHeader {
    unique?: Uint8Array | string;
    forbidControllerChange?: boolean;
}
export declare type GenesisCommit = {
    header: GenesisHeader;
    data?: any;
};
export interface RawCommit {
    id: CID;
    header?: CommitHeader;
    data: any;
    prev: CID;
}
export interface AnchorProof {
    chainId: string;
    blockNumber: number;
    blockTimestamp: number;
    txHash: CID;
    root: CID;
}
export interface AnchorCommit {
    id: CID;
    prev: CID;
    proof: CID;
    path: string;
}
export declare type SignedCommit = DagJWS;
export declare type SignedCommitContainer = DagJWSResult;
export declare type CeramicCommit = AnchorCommit | GenesisCommit | RawCommit | SignedCommit | SignedCommitContainer;
export interface StreamMetadata {
    controllers: Array<string>;
    model?: StreamID;
    family?: string;
    schema?: string;
    tags?: Array<string>;
    forbidControllerChange?: boolean;
    [index: string]: any;
}
export interface StreamNext {
    content?: any;
    controllers?: Array<string>;
    metadata?: StreamMetadata;
}
export declare enum CommitType {
    GENESIS = 0,
    SIGNED = 1,
    ANCHOR = 2
}
export interface LogEntry {
    cid: CID;
    type: CommitType;
    timestamp?: number;
}
export interface CommitData extends LogEntry {
    commit: any;
    envelope?: DagJWS;
    proof?: AnchorProof;
    capability?: Cacao;
    disableTimecheck?: boolean;
}
export interface StreamState {
    type: number;
    content: any;
    next?: StreamNext;
    metadata: StreamMetadata;
    signature: SignatureStatus;
    anchorStatus: AnchorStatus;
    anchorScheduledFor?: number;
    anchorProof?: AnchorProof;
    log: Array<LogEntry>;
}
export interface StreamStateHolder {
    id: StreamID;
    state: StreamState;
}
export declare abstract class Stream extends Observable<StreamState> implements StreamStateHolder {
    protected readonly state$: RunningStateLike;
    private _context;
    constructor(state$: RunningStateLike, _context: Context);
    get id(): StreamID;
    get api(): CeramicApi;
    abstract get metadata(): Record<string, any>;
    get content(): any;
    get controllers(): Array<string>;
    get tip(): CID;
    get commitId(): CommitID;
    get allCommitIds(): Array<CommitID>;
    get anchorCommitIds(): Array<CommitID>;
    get state(): StreamState;
    sync(opts?: LoadOpts): Promise<void>;
    requestAnchor(): Promise<AnchorStatus>;
    abstract makeReadOnly(): void;
    abstract isReadOnly: boolean;
}
export declare function StreamStatic<T>(): <U extends T>(constructor: U) => any;
export interface StreamConstructor<T extends Stream> {
    new (state$: RunningStateLike, context: Context): T;
}
export interface StreamHandler<T extends Stream> {
    type: number;
    name: string;
    stream_constructor: StreamConstructor<T>;
    applyCommit(commitData: CommitData, context: Context, state?: StreamState): Promise<StreamState>;
}
//# sourceMappingURL=stream.d.ts.map
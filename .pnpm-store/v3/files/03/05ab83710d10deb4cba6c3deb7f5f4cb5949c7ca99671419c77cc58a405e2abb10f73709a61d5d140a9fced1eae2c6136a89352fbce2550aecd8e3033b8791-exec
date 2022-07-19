import { AnchorCommit, CeramicCommit, CommitData, IpfsApi, RawCommit, SignedCommit } from '../index.js';
import { StreamState } from '../stream.js';
import { StreamID } from '@ceramicnetwork/streamid';
export declare class StreamUtils {
    static streamIdFromState(state: StreamState): StreamID;
    static serializeCommit(commit: any): any;
    static deserializeCommit(commit: any): any;
    static serializeState(state: StreamState): any;
    static deserializeState(state: any): StreamState;
    static statesEqual(state1: StreamState, state2: StreamState): boolean;
    static isStateSupersetOf(state: StreamState, base: StreamState): boolean;
    static assertCommitLinksToState(state: StreamState, commit: RawCommit | AnchorCommit): void;
    static convertCommitToSignedCommitContainer(commit: CeramicCommit, ipfs: IpfsApi): Promise<CeramicCommit>;
    static isSignedCommitContainer(commit: CeramicCommit): boolean;
    static isSignedCommit(commit: CeramicCommit): commit is SignedCommit;
    static isAnchorCommit(commit: CeramicCommit): commit is AnchorCommit;
    static isSignedCommitData(commitData: CommitData): boolean;
    static isAnchorCommitData(commitData: CommitData): boolean;
}
//# sourceMappingURL=stream-utils.d.ts.map
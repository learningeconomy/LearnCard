import { CeramicApi, CreateOpts, Stream, LoadOpts, UpdateOpts, RawCommit, GenesisCommit, StreamMetadata } from '@ceramicnetwork/common';
import type { AuthProvider, LinkProof } from '@ceramicnetwork/blockchain-utils-linking';
import { CommitID, StreamID } from '@ceramicnetwork/streamid';
import { AccountId } from 'caip';
import type { DID } from 'dids';
export declare type Caip10Metadata = StreamMetadata;
export declare class Caip10Link extends Stream {
    static STREAM_TYPE_NAME: string;
    static STREAM_TYPE_ID: number;
    private _isReadOnly;
    get did(): string | null;
    get metadata(): Caip10Metadata;
    static fromAccount(ceramic: CeramicApi, accountId: string | AccountId, opts?: CreateOpts | LoadOpts): Promise<Caip10Link>;
    static fromGenesis(ceramic: CeramicApi, genesisCommit: GenesisCommit, opts?: CreateOpts | LoadOpts): Promise<Caip10Link>;
    setDid(did: string | DID, authProvider: AuthProvider, opts?: UpdateOpts): Promise<void>;
    setDidProof(proof: LinkProof, opts?: UpdateOpts): Promise<void>;
    clearDid(authProvider: AuthProvider, opts?: UpdateOpts): Promise<void>;
    static load(ceramic: CeramicApi, streamId: StreamID | CommitID | string, opts?: LoadOpts): Promise<Caip10Link>;
    static makeGenesis(accountId: AccountId): GenesisCommit;
    makeCommit(proof: LinkProof): RawCommit;
    makeReadOnly(): void;
    get isReadOnly(): boolean;
}
//# sourceMappingURL=caip10-link.d.ts.map
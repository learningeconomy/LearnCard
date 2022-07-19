import { Observable } from 'rxjs';
import { CeramicCommit, CreateOpts, StreamState, RunningStateLike, LoadOpts, UpdateOpts } from '@ceramicnetwork/common';
import { StreamID, CommitID } from '@ceramicnetwork/streamid';
export declare class Document extends Observable<StreamState> implements RunningStateLike {
    private readonly state$;
    private periodicSubscription;
    private readonly _apiUrl;
    constructor(initial: StreamState, _apiUrl: URL | string, syncInterval: number);
    get value(): StreamState;
    get state(): StreamState;
    next(state: StreamState): void;
    _syncState(streamId: StreamID | CommitID, opts: LoadOpts): Promise<void>;
    get id(): StreamID;
    static createFromGenesis(apiUrl: URL | string, type: number, genesis: any, opts: CreateOpts, syncInterval: number): Promise<Document>;
    static applyCommit(apiUrl: URL | string, streamId: StreamID | string, commit: CeramicCommit, opts: UpdateOpts, syncInterval: number): Promise<Document>;
    private static _load;
    static load(streamId: StreamID | CommitID, apiUrl: URL | string, syncInterval: number, opts: LoadOpts): Promise<Document>;
    static loadStreamCommits(streamId: StreamID, apiUrl: URL | string): Promise<Array<Record<string, CeramicCommit>>>;
    complete(): void;
}
//# sourceMappingURL=document.d.ts.map
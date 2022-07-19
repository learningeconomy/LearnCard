import cloneDeep from 'lodash.clonedeep';
import { StreamID } from '@ceramicnetwork/streamid';
import { CommitID } from '@ceramicnetwork/streamid';
import { Observable } from 'rxjs';
import { SyncOptions } from './streamopts.js';
export var SignatureStatus;
(function (SignatureStatus) {
    SignatureStatus[SignatureStatus["GENESIS"] = 0] = "GENESIS";
    SignatureStatus[SignatureStatus["PARTIAL"] = 1] = "PARTIAL";
    SignatureStatus[SignatureStatus["SIGNED"] = 2] = "SIGNED";
})(SignatureStatus || (SignatureStatus = {}));
export var AnchorStatus;
(function (AnchorStatus) {
    AnchorStatus[AnchorStatus["NOT_REQUESTED"] = 0] = "NOT_REQUESTED";
    AnchorStatus[AnchorStatus["PENDING"] = 1] = "PENDING";
    AnchorStatus[AnchorStatus["PROCESSING"] = 2] = "PROCESSING";
    AnchorStatus[AnchorStatus["ANCHORED"] = 3] = "ANCHORED";
    AnchorStatus[AnchorStatus["FAILED"] = 4] = "FAILED";
})(AnchorStatus || (AnchorStatus = {}));
export var CommitType;
(function (CommitType) {
    CommitType[CommitType["GENESIS"] = 0] = "GENESIS";
    CommitType[CommitType["SIGNED"] = 1] = "SIGNED";
    CommitType[CommitType["ANCHOR"] = 2] = "ANCHOR";
})(CommitType || (CommitType = {}));
export class Stream extends Observable {
    constructor(state$, _context) {
        super((subscriber) => {
            state$.subscribe(subscriber);
        });
        this.state$ = state$;
        this._context = _context;
    }
    get id() {
        return new StreamID(this.state$.value.type, this.state$.value.log[0].cid);
    }
    get api() {
        return this._context.api;
    }
    get content() {
        const { next, content } = this.state$.value;
        return cloneDeep(next?.content ?? content);
    }
    get controllers() {
        return this.metadata.controllers;
    }
    get tip() {
        return this.state$.value.log[this.state$.value.log.length - 1].cid;
    }
    get commitId() {
        return CommitID.make(this.id, this.tip);
    }
    get allCommitIds() {
        return this.state$.value.log.map(({ cid }) => CommitID.make(this.id, cid));
    }
    get anchorCommitIds() {
        return this.state$.value.log
            .filter(({ type }) => type === CommitType.ANCHOR)
            .map(({ cid }) => CommitID.make(this.id, cid));
    }
    get state() {
        return cloneDeep(this.state$.value);
    }
    async sync(opts = {}) {
        opts = { sync: SyncOptions.PREFER_CACHE, ...opts };
        const stream = await this.api.loadStream(this.id, opts);
        this.state$.next(stream.state);
    }
    async requestAnchor() {
        return this.api.requestAnchor(this.id);
    }
}
export function StreamStatic() {
    return (constructor) => {
        constructor;
    };
}
//# sourceMappingURL=stream.js.map
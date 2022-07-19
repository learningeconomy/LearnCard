import { Observable, timer } from 'rxjs';
import { throttle } from 'rxjs/operators';
import { fetchJson, StreamUtils, SyncOptions, StreamStateSubject, } from '@ceramicnetwork/common';
import { StreamID } from '@ceramicnetwork/streamid';
export class Document extends Observable {
    constructor(initial, _apiUrl, syncInterval) {
        super((subscriber) => {
            const isFirstObserver = this.state$.observers.length === 0;
            if (isFirstObserver) {
                this.periodicSubscription = timer(0, syncInterval)
                    .pipe(throttle(() => this._syncState(this.id, { sync: SyncOptions.PREFER_CACHE })))
                    .subscribe();
            }
            this.state$.subscribe(subscriber).add(() => {
                const isNoObserversLeft = this.state$.observers.length === 0;
                if (isNoObserversLeft) {
                    this.periodicSubscription?.unsubscribe();
                }
            });
        });
        this.state$ = new StreamStateSubject(initial);
        this._apiUrl = new URL(_apiUrl);
    }
    get value() {
        return this.state$.value;
    }
    get state() {
        return this.state$.value;
    }
    next(state) {
        this.state$.next(state);
    }
    async _syncState(streamId, opts) {
        const state = await Document._load(streamId, this._apiUrl, opts);
        this.state$.next(StreamUtils.deserializeState(state));
    }
    get id() {
        return new StreamID(this.state$.value.type, this.state$.value.log[0].cid);
    }
    static async createFromGenesis(apiUrl, type, genesis, opts, syncInterval) {
        const url = new URL('./streams', apiUrl);
        const { state } = await fetchJson(url, {
            method: 'post',
            body: {
                type,
                genesis: StreamUtils.serializeCommit(genesis),
                opts,
            },
        });
        return new Document(StreamUtils.deserializeState(state), apiUrl, syncInterval);
    }
    static async applyCommit(apiUrl, streamId, commit, opts, syncInterval) {
        const url = new URL('./commits', apiUrl);
        const { state } = await fetchJson(url, {
            method: 'post',
            body: {
                streamId: streamId.toString(),
                commit: StreamUtils.serializeCommit(commit),
                opts,
            },
        });
        return new Document(StreamUtils.deserializeState(state), apiUrl, syncInterval);
    }
    static async _load(streamId, apiUrl, opts) {
        const url = new URL(`./streams/${streamId}`, apiUrl);
        for (const key in opts) {
            url.searchParams.set(key, opts[key]);
        }
        const { state } = await fetchJson(url);
        return state;
    }
    static async load(streamId, apiUrl, syncInterval, opts) {
        const state = await Document._load(streamId, apiUrl, opts);
        return new Document(StreamUtils.deserializeState(state), apiUrl, syncInterval);
    }
    static async loadStreamCommits(streamId, apiUrl) {
        const url = new URL(`./commits/${streamId}`, apiUrl);
        const { commits } = await fetchJson(url);
        return commits.map((r) => {
            return {
                cid: r.cid,
                value: StreamUtils.deserializeCommit(r.value),
            };
        });
    }
    complete() {
        this.state$.complete();
    }
}
//# sourceMappingURL=document.js.map
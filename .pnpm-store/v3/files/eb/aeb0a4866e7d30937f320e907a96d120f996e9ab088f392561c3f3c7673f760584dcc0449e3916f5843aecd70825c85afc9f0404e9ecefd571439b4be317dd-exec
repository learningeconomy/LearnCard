import { typeStreamID } from './utils.js';
import { Document } from './document.js';
import { fetchJson, StreamUtils, SyncOptions, } from '@ceramicnetwork/common';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { Caip10Link } from '@ceramicnetwork/stream-caip10-link';
import { Model } from '@ceramicnetwork/stream-model';
import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance';
import { StreamRef } from '@ceramicnetwork/streamid';
import { RemotePinApi } from './remote-pin-api.js';
import { RemoteIndexApi } from './remote-index-api.js';
const API_PATH = '/api/v0/';
const CERAMIC_HOST = 'http://localhost:7007';
export const DEFAULT_CLIENT_CONFIG = {
    syncInterval: 5000,
};
const DEFAULT_APPLY_COMMIT_OPTS = { anchor: true, publish: true, sync: SyncOptions.PREFER_CACHE };
const DEFAULT_CREATE_FROM_GENESIS_OPTS = {
    anchor: true,
    publish: true,
    sync: SyncOptions.PREFER_CACHE,
};
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE };
export class CeramicClient {
    constructor(apiHost = CERAMIC_HOST, config = {}) {
        this._config = { ...DEFAULT_CLIENT_CONFIG, ...config };
        this._apiUrl = new URL(API_PATH, apiHost);
        this._streamCache = new Map();
        this.context = { api: this };
        this.pin = new RemotePinApi(this._apiUrl);
        this.index = new RemoteIndexApi(this._apiUrl);
        this._streamConstructors = {
            [Caip10Link.STREAM_TYPE_ID]: Caip10Link,
            [Model.STREAM_TYPE_ID]: Model,
            [ModelInstanceDocument.STREAM_TYPE_ID]: ModelInstanceDocument,
            [TileDocument.STREAM_TYPE_ID]: TileDocument,
        };
    }
    get did() {
        return this.context.did;
    }
    set did(did) {
        this.context.did = did;
    }
    async createStreamFromGenesis(type, genesis, opts = {}) {
        opts = { ...DEFAULT_CREATE_FROM_GENESIS_OPTS, ...opts };
        const stream = await Document.createFromGenesis(this._apiUrl, type, genesis, opts, this._config.syncInterval);
        const found = this._streamCache.get(stream.id.toString());
        if (found) {
            if (!StreamUtils.statesEqual(stream.state, found.state))
                found.next(stream.state);
            return this.buildStreamFromDocument(found);
        }
        else {
            this._streamCache.set(stream.id.toString(), stream);
            return this.buildStreamFromDocument(stream);
        }
    }
    async loadStream(streamId, opts = {}) {
        opts = { ...DEFAULT_LOAD_OPTS, ...opts };
        const streamRef = StreamRef.from(streamId);
        let stream = this._streamCache.get(streamRef.baseID.toString());
        if (stream) {
            await stream._syncState(streamRef, opts);
        }
        else {
            stream = await Document.load(streamRef, this._apiUrl, this._config.syncInterval, opts);
            this._streamCache.set(stream.id.toString(), stream);
        }
        return this.buildStreamFromDocument(stream);
    }
    async multiQuery(queries, timeout) {
        const queriesJSON = queries.map((q) => {
            return {
                ...q,
                streamId: typeof q.streamId === 'string' ? q.streamId : q.streamId.toString(),
            };
        });
        const url = new URL('./multiqueries', this._apiUrl);
        const results = await fetchJson(url, {
            method: 'post',
            body: {
                queries: queriesJSON,
                ...{ timeout },
            },
        });
        return Object.entries(results).reduce((acc, e) => {
            const [k, v] = e;
            const state = StreamUtils.deserializeState(v);
            const stream = new Document(state, this._apiUrl, this._config.syncInterval);
            acc[k] = this.buildStreamFromDocument(stream);
            return acc;
        }, {});
    }
    loadStreamCommits(streamId) {
        const effectiveStreamId = typeStreamID(streamId);
        return Document.loadStreamCommits(effectiveStreamId, this._apiUrl);
    }
    async applyCommit(streamId, commit, opts = {}) {
        opts = { ...DEFAULT_APPLY_COMMIT_OPTS, ...opts };
        const effectiveStreamId = typeStreamID(streamId);
        const document = await Document.applyCommit(this._apiUrl, effectiveStreamId, commit, opts, this._config.syncInterval);
        const fromCache = this._streamCache.get(effectiveStreamId.toString());
        if (fromCache) {
            fromCache.next(document.state);
            return this.buildStreamFromDocument(document);
        }
        else {
            this._streamCache.set(effectiveStreamId.toString(), document);
            return this.buildStreamFromDocument(document);
        }
    }
    async requestAnchor(streamId, opts = {}) {
        opts = { ...DEFAULT_LOAD_OPTS, ...opts };
        const { anchorStatus } = await fetchJson(`${this._apiUrl}/streams/${streamId.toString()}/anchor`, {
            method: 'post',
            body: {
                opts,
            },
        });
        return anchorStatus;
    }
    addStreamHandler(streamHandler) {
        this._streamConstructors[streamHandler.name] = streamHandler.stream_constructor;
    }
    buildStreamFromState(state) {
        const stream$ = new Document(state, this._apiUrl, this._config.syncInterval);
        return this.buildStreamFromDocument(stream$);
    }
    buildStreamFromDocument(stream) {
        const type = stream.state.type;
        const streamConstructor = this._streamConstructors[type];
        if (!streamConstructor)
            throw new Error(`Failed to find constructor for stream ${type}`);
        return new streamConstructor(stream, this.context);
    }
    async setDID(did) {
        this.context.did = did;
    }
    async getSupportedChains() {
        if (this._supportedChains) {
            return this._supportedChains;
        }
        const { supportedChains } = await fetchJson(this._apiUrl + '/node/chains');
        this._supportedChains = supportedChains;
        return supportedChains;
    }
    async close() {
        Array.from(this._streamCache).map(([, stream]) => {
            stream.complete();
        });
        this._streamCache.clear();
    }
}
//# sourceMappingURL=ceramic-http-client.js.map
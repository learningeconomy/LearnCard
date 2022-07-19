var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Caip10Link_1;
import { Stream, StreamStatic, SyncOptions, } from '@ceramicnetwork/common';
import { StreamRef } from '@ceramicnetwork/streamid';
import { parse } from 'did-resolver';
import { normalizeAccountId } from '@ceramicnetwork/common';
import cloneDeep from 'lodash.clonedeep';
const throwReadOnlyError = () => {
    throw new Error('Historical stream commits cannot be modified. Load the stream without specifying a commit to make updates.');
};
const DEFAULT_CREATE_OPTS = {
    anchor: false,
    publish: true,
    pin: true,
    sync: SyncOptions.PREFER_CACHE,
};
const DEFAULT_UPDATE_OPTS = { anchor: true, publish: true, throwOnInvalidCommit: true };
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE };
let Caip10Link = Caip10Link_1 = class Caip10Link extends Stream {
    constructor() {
        super(...arguments);
        this._isReadOnly = false;
    }
    get did() {
        return this.content;
    }
    get metadata() {
        const { next, metadata } = this.state$.value;
        return cloneDeep(next?.metadata ?? metadata);
    }
    static async fromAccount(ceramic, accountId, opts = {}) {
        opts = { ...DEFAULT_CREATE_OPTS, ...opts };
        const normalizedAccountId = normalizeAccountId(accountId);
        const genesisCommit = Caip10Link_1.makeGenesis(normalizedAccountId);
        return Caip10Link_1.fromGenesis(ceramic, genesisCommit, opts);
    }
    static async fromGenesis(ceramic, genesisCommit, opts = {}) {
        opts = { ...DEFAULT_CREATE_OPTS, ...opts };
        return ceramic.createStreamFromGenesis(Caip10Link_1.STREAM_TYPE_ID, genesisCommit, opts);
    }
    async setDid(did, authProvider, opts = {}) {
        opts = { ...DEFAULT_UPDATE_OPTS, ...opts };
        const didStr = typeof did == 'string' ? did.trim() : did.id;
        const parsedDid = parse(didStr);
        if (parsedDid?.did !== didStr) {
            throw new Error(`DID is not valid: '${didStr}'`);
        }
        const linkProof = await authProvider.createLink(didStr);
        return this.setDidProof(linkProof, opts);
    }
    async setDidProof(proof, opts = {}) {
        opts = { ...DEFAULT_UPDATE_OPTS, ...opts };
        const commit = this.makeCommit(proof);
        const updated = await this.api.applyCommit(this.id, commit, opts);
        this.state$.next(updated.state);
    }
    async clearDid(authProvider, opts = {}) {
        opts = { ...DEFAULT_UPDATE_OPTS, ...opts };
        const linkProof = await authProvider.createLink('');
        return this.setDidProof(linkProof, opts);
    }
    static async load(ceramic, streamId, opts = {}) {
        opts = { ...DEFAULT_LOAD_OPTS, ...opts };
        const streamRef = StreamRef.from(streamId);
        if (streamRef.type != Caip10Link_1.STREAM_TYPE_ID) {
            throw new Error(`StreamID ${streamRef.toString()} does not refer to a '${Caip10Link_1.STREAM_TYPE_NAME}' stream, but to a ${streamRef.typeName}`);
        }
        return ceramic.loadStream(streamRef, opts);
    }
    static makeGenesis(accountId) {
        if (accountId.chainId.namespace === 'eip155') {
            accountId.address = accountId.address.toLowerCase();
        }
        const legacyAccountId = `${accountId.address}@${accountId.chainId.toString()}`;
        return {
            header: {
                controllers: [legacyAccountId],
                family: `caip10-${accountId.chainId.toString()}`,
            },
        };
    }
    makeCommit(proof) {
        return { data: proof, prev: this.tip, id: this.id.cid };
    }
    makeReadOnly() {
        this.setDidProof = throwReadOnlyError;
        this.setDid = throwReadOnlyError;
        this.sync = throwReadOnlyError;
        this._isReadOnly = true;
    }
    get isReadOnly() {
        return this._isReadOnly;
    }
};
Caip10Link.STREAM_TYPE_NAME = 'caip10-link';
Caip10Link.STREAM_TYPE_ID = 1;
Caip10Link = Caip10Link_1 = __decorate([
    StreamStatic()
], Caip10Link);
export { Caip10Link };
//# sourceMappingURL=caip10-link.js.map
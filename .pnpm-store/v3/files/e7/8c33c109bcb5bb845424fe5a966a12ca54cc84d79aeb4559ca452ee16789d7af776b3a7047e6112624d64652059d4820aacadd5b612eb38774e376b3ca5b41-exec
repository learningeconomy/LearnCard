var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ModelInstanceDocument_1;
import jsonpatch from 'fast-json-patch';
import { randomBytes } from '@stablelib/random';
import { Stream, StreamStatic, SyncOptions, } from '@ceramicnetwork/common';
import { StreamRef } from '@ceramicnetwork/streamid';
const DEFAULT_CREATE_OPTS = {
    anchor: true,
    publish: true,
    pin: true,
    sync: SyncOptions.NEVER_SYNC,
    syncTimeoutSeconds: 0,
};
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE };
const DEFAULT_UPDATE_OPTS = { anchor: true, publish: true, throwOnInvalidCommit: true };
async function _ensureAuthenticated(signer) {
    if (signer.did == null) {
        throw new Error('No DID provided');
    }
    if (!signer.did.authenticated) {
        await signer.did.authenticate();
        if (signer.loggerProvider) {
            signer.loggerProvider.getDiagnosticsLogger().imp(`Now authenticated as DID ${signer.did.id}`);
        }
    }
}
async function throwReadOnlyError() {
    throw new Error('Historical stream commits cannot be modified. Load the stream without specifying a commit to make updates.');
}
let ModelInstanceDocument = ModelInstanceDocument_1 = class ModelInstanceDocument extends Stream {
    constructor() {
        super(...arguments);
        this._isReadOnly = false;
    }
    get content() {
        return super.content;
    }
    get metadata() {
        const metadata = this.state$.value.metadata;
        return { controller: metadata.controllers[0], model: metadata.model };
    }
    static async create(ceramic, content, metadata, opts = {}) {
        opts = { ...DEFAULT_CREATE_OPTS, ...opts };
        const signer = opts.asDID ? { did: opts.asDID } : ceramic;
        const commit = await ModelInstanceDocument_1._makeGenesis(signer, content, metadata);
        return ceramic.createStreamFromGenesis(ModelInstanceDocument_1.STREAM_TYPE_ID, commit, opts);
    }
    static async load(ceramic, streamId, opts = {}) {
        opts = { ...DEFAULT_LOAD_OPTS, ...opts };
        const streamRef = StreamRef.from(streamId);
        if (streamRef.type != ModelInstanceDocument_1.STREAM_TYPE_ID) {
            throw new Error(`StreamID ${streamRef.toString()} does not refer to a '${ModelInstanceDocument_1.STREAM_TYPE_NAME}' stream, but to a ${streamRef.typeName}`);
        }
        return ceramic.loadStream(streamRef, opts);
    }
    async replace(content, opts = {}) {
        opts = { ...DEFAULT_UPDATE_OPTS, ...opts };
        const signer = opts.asDID ? { did: opts.asDID } : this.api;
        const updateCommit = await this._makeCommit(signer, content);
        const updated = await this.api.applyCommit(this.id, updateCommit, opts);
        this.state$.next(updated.state);
    }
    async patch(jsonPatch, opts = {}) {
        opts = { ...DEFAULT_UPDATE_OPTS, ...opts };
        const rawCommit = {
            data: jsonPatch,
            prev: this.tip,
            id: this.id.cid,
        };
        const commit = await ModelInstanceDocument_1._signDagJWS(this.api, rawCommit);
        const updated = await this.api.applyCommit(this.id, commit, opts);
        this.state$.next(updated.state);
    }
    makeReadOnly() {
        this.replace = throwReadOnlyError;
        this.patch = throwReadOnlyError;
        this.sync = throwReadOnlyError;
        this._isReadOnly = true;
    }
    get isReadOnly() {
        return this._isReadOnly;
    }
    _makeCommit(signer, newContent) {
        const commit = this._makeRawCommit(newContent);
        return ModelInstanceDocument_1._signDagJWS(signer, commit);
    }
    _makeRawCommit(newContent) {
        const patch = jsonpatch.compare(this.content, newContent || {});
        return {
            data: patch,
            prev: this.tip,
            id: this.state.log[0].cid,
        };
    }
    static async _makeGenesis(signer, content, metadata) {
        const commit = await this._makeRawGenesis(signer, content, metadata);
        return ModelInstanceDocument_1._signDagJWS(signer, commit);
    }
    static async _makeRawGenesis(signer, content, metadata) {
        if (!metadata.model) {
            throw new Error(`Must specify a 'model' when creating a ModelInstanceDocument`);
        }
        if (!metadata.controller) {
            if (signer.did) {
                await _ensureAuthenticated(signer);
                metadata.controller = signer.did.hasParent ? signer.did.parent : signer.did.id;
            }
            else {
                throw new Error('No controller specified');
            }
        }
        const header = {
            controllers: [metadata.controller],
            unique: randomBytes(12),
            model: metadata.model.bytes,
        };
        return { data: content, header };
    }
    static async _signDagJWS(signer, commit) {
        await _ensureAuthenticated(signer);
        return signer.did.createDagJWS(commit);
    }
};
ModelInstanceDocument.STREAM_TYPE_NAME = 'MID';
ModelInstanceDocument.STREAM_TYPE_ID = 3;
ModelInstanceDocument = ModelInstanceDocument_1 = __decorate([
    StreamStatic()
], ModelInstanceDocument);
export { ModelInstanceDocument };
//# sourceMappingURL=model-instance-document.js.map
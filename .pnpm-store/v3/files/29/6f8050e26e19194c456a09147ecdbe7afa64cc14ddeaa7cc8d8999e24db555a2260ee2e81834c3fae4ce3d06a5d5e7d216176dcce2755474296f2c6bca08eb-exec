var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var Model_1;
import jsonpatch from 'fast-json-patch';
import { randomBytes } from '@stablelib/random';
import { Stream, StreamStatic, SyncOptions, } from '@ceramicnetwork/common';
import { StreamID, StreamRef } from '@ceramicnetwork/streamid';
import { CID } from 'multiformats/cid';
import { create } from 'multiformats/hashes/digest';
import { code, encode } from '@ipld/dag-cbor';
import multihashes from 'multihashes';
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE };
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
export var ModelAccountRelation;
(function (ModelAccountRelation) {
    ModelAccountRelation["LIST"] = "list";
    ModelAccountRelation["SINGLE"] = "single";
})(ModelAccountRelation || (ModelAccountRelation = {}));
let Model = Model_1 = class Model extends Stream {
    constructor() {
        super(...arguments);
        this._isReadOnly = false;
    }
    get content() {
        return super.content;
    }
    get metadata() {
        return { controller: this.state$.value.metadata.controllers[0], model: Model_1.MODEL };
    }
    static async create(ceramic, content, metadata) {
        Model_1.assertComplete(content);
        const opts = {
            publish: true,
            anchor: true,
            pin: true,
            sync: SyncOptions.NEVER_SYNC,
            throwOnInvalidCommit: true,
        };
        const commit = await Model_1._makeGenesis(ceramic, content, metadata);
        const model = await ceramic.createStreamFromGenesis(Model_1.STREAM_TYPE_ID, commit, opts);
        return model;
    }
    static async createPlaceholder(ceramic, content, metadata) {
        const opts = {
            publish: false,
            anchor: false,
            pin: false,
            sync: SyncOptions.NEVER_SYNC,
            throwOnInvalidCommit: true,
        };
        const commit = await Model_1._makeGenesis(ceramic, content, metadata);
        return ceramic.createStreamFromGenesis(Model_1.STREAM_TYPE_ID, commit, opts);
    }
    async replacePlaceholder(content) {
        Model_1.assertComplete(content, this.id);
        const opts = { publish: true, anchor: true, pin: true, throwOnInvalidCommit: true };
        const updateCommit = await this._makeCommit(this.api, content);
        const updated = await this.api.applyCommit(this.id, updateCommit, opts);
        this.state$.next(updated.state);
    }
    static assertComplete(content, streamId) {
        if (!content.name) {
            if (streamId) {
                throw new Error(`Model with StreamID ${streamId.toString()} is missing a 'name' field`);
            }
            else {
                throw new Error(`Model is missing a 'name' field`);
            }
        }
        if (!content.schema) {
            if (streamId) {
                throw new Error(`Model ${content.name} (${streamId.toString()}) is missing a 'schema' field`);
            }
            else {
                throw new Error(`Model ${content.name} is missing a 'schema' field`);
            }
        }
        if (!content.accountRelation) {
            if (streamId) {
                throw new Error(`Model ${content.name} (${streamId.toString()}) is missing a 'accountRelation' field`);
            }
            else {
                throw new Error(`Model ${content.name} is missing a 'accountRelation' field`);
            }
        }
    }
    static async load(ceramic, streamId, opts = {}) {
        opts = { ...DEFAULT_LOAD_OPTS, ...opts };
        const streamRef = StreamRef.from(streamId);
        if (streamRef.type != Model_1.STREAM_TYPE_ID) {
            throw new Error(`StreamID ${streamRef.toString()} does not refer to a '${Model_1.STREAM_TYPE_NAME}' stream, but to a ${streamRef.typeName}`);
        }
        const model = await ceramic.loadStream(streamRef, opts);
        try {
            Model_1.assertComplete(model.content, streamId);
        }
        catch (err) {
            throw new Error(`Incomplete placeholder Models cannot be loaded: ${err.message}`);
        }
        return model;
    }
    async _makeCommit(signer, newContent) {
        const commit = this._makeRawCommit(newContent);
        return Model_1._signDagJWS(signer, commit);
    }
    _makeRawCommit(newContent) {
        if (newContent == null) {
            throw new Error(`Cannot set Model content to null`);
        }
        const patch = jsonpatch.compare(this.content, newContent);
        return {
            data: patch,
            prev: this.tip,
            id: this.state.log[0].cid,
        };
    }
    static async _makeGenesis(signer, content, metadata) {
        const commit = await this._makeRawGenesis(signer, content, metadata);
        return Model_1._signDagJWS(signer, commit);
    }
    static async _makeRawGenesis(signer, content, metadata) {
        if (content == null) {
            throw new Error(`Genesis content cannot be null`);
        }
        if (!metadata || !metadata.controller) {
            if (signer.did) {
                await _ensureAuthenticated(signer);
                metadata = { controller: signer.did.hasParent ? signer.did.parent : signer.did.id };
            }
            else {
                throw new Error('No controller specified');
            }
        }
        const header = {
            controllers: [metadata.controller],
            unique: randomBytes(12),
            model: Model_1.MODEL.bytes,
        };
        return { data: content, header };
    }
    makeReadOnly() {
        this.replacePlaceholder = throwReadOnlyError;
        this.sync = throwReadOnlyError;
        this._isReadOnly = true;
    }
    get isReadOnly() {
        return this._isReadOnly;
    }
    static async _signDagJWS(signer, commit) {
        await _ensureAuthenticated(signer);
        return signer.did.createDagJWS(commit);
    }
};
Model.STREAM_TYPE_NAME = 'model';
Model.STREAM_TYPE_ID = 2;
Model.MODEL = (function () {
    const data = encode('model-v1');
    const multihash = multihashes.encode(data, 'identity');
    const digest = create(code, multihash);
    const cid = CID.createV1(code, digest);
    return new StreamID(Model_1.STREAM_TYPE_ID, cid);
})();
Model = Model_1 = __decorate([
    StreamStatic()
], Model);
export { Model };
//# sourceMappingURL=model.js.map
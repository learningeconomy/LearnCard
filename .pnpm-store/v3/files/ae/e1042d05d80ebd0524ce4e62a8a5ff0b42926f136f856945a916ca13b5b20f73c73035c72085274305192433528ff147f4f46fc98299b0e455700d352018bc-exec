var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var TileDocument_1;
import jsonpatch from 'fast-json-patch';
import cloneDeep from 'lodash.clonedeep';
import * as dagCbor from '@ipld/dag-cbor';
import * as uint8arrays from 'uint8arrays';
import { randomBytes } from '@stablelib/random';
import { Stream, StreamStatic, SyncOptions, } from '@ceramicnetwork/common';
import { CommitID, StreamRef } from '@ceramicnetwork/streamid';
const DEFAULT_CREATE_OPTS = {
    anchor: true,
    publish: true,
    pin: true,
    sync: SyncOptions.PREFER_CACHE,
};
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE };
const DEFAULT_UPDATE_OPTS = { anchor: true, publish: true, throwOnInvalidCommit: true };
function headerFromMetadata(metadata, genesis) {
    if (typeof metadata?.schema === 'string') {
        try {
            CommitID.fromString(metadata.schema);
        }
        catch {
            throw new Error('Schema must be a CommitID');
        }
    }
    const header = {
        controllers: metadata?.controllers,
        family: metadata?.family,
        schema: metadata?.schema?.toString(),
        tags: metadata?.tags,
    };
    if (genesis) {
        if (!metadata?.deterministic) {
            header.unique = uint8arrays.toString(randomBytes(12), 'base64');
        }
        if (metadata?.forbidControllerChange) {
            header.forbidControllerChange = true;
        }
    }
    else {
        if (metadata?.deterministic !== undefined || metadata?.unique !== undefined) {
            throw new Error("Cannot change 'deterministic' or 'unique' properties on existing Streams");
        }
        if (metadata?.forbidControllerChange !== undefined) {
            throw new Error("Cannot change 'forbidControllerChange' property on existing Streams");
        }
    }
    Object.keys(header).forEach((key) => header[key] === undefined && delete header[key]);
    return header;
}
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
let TileDocument = TileDocument_1 = class TileDocument extends Stream {
    constructor() {
        super(...arguments);
        this._isReadOnly = false;
    }
    get content() {
        return super.content;
    }
    get metadata() {
        const { next, metadata } = this.state$.value;
        return cloneDeep(next?.metadata ?? metadata);
    }
    static async create(ceramic, content, metadata, opts = {}) {
        opts = { ...DEFAULT_CREATE_OPTS, ...opts };
        if (!metadata?.deterministic && opts.syncTimeoutSeconds == undefined) {
            opts.syncTimeoutSeconds = 0;
        }
        const signer = opts.asDID ? { did: opts.asDID } : ceramic;
        const commit = await TileDocument_1.makeGenesis(signer, content, metadata);
        return ceramic.createStreamFromGenesis(TileDocument_1.STREAM_TYPE_ID, commit, opts);
    }
    static async createFromGenesis(ceramic, genesisCommit, opts = {}) {
        opts = { ...DEFAULT_CREATE_OPTS, ...opts };
        if (genesisCommit.header?.unique && opts.syncTimeoutSeconds == undefined) {
            opts.syncTimeoutSeconds = 0;
        }
        const commit = genesisCommit.data
            ? await TileDocument_1._signDagJWS(ceramic, genesisCommit)
            : genesisCommit;
        return ceramic.createStreamFromGenesis(TileDocument_1.STREAM_TYPE_ID, commit, opts);
    }
    static async deterministic(ceramic, metadata, opts = {}) {
        opts = { ...DEFAULT_CREATE_OPTS, ...opts };
        metadata = { ...metadata, deterministic: true };
        if (metadata.family == null && metadata.tags == null) {
            throw new Error('Family and/or tags are required when creating a deterministic tile document');
        }
        const commit = await TileDocument_1.makeGenesis(ceramic, null, metadata);
        return ceramic.createStreamFromGenesis(TileDocument_1.STREAM_TYPE_ID, commit, opts);
    }
    static async load(ceramic, streamId, opts = {}) {
        opts = { ...DEFAULT_LOAD_OPTS, ...opts };
        const streamRef = StreamRef.from(streamId);
        if (streamRef.type != TileDocument_1.STREAM_TYPE_ID) {
            throw new Error(`StreamID ${streamRef.toString()} does not refer to a '${TileDocument_1.STREAM_TYPE_NAME}' stream, but to a ${streamRef.typeName}`);
        }
        return ceramic.loadStream(streamRef, opts);
    }
    async update(content, metadata, opts = {}) {
        opts = { ...DEFAULT_UPDATE_OPTS, ...opts };
        const signer = opts.asDID ? { did: opts.asDID } : this.api;
        const updateCommit = await this.makeCommit(signer, content, metadata);
        const updated = await this.api.applyCommit(this.id, updateCommit, opts);
        this.state$.next(updated.state);
    }
    async patch(jsonPatch, opts = {}) {
        opts = { ...DEFAULT_UPDATE_OPTS, ...opts };
        const header = headerFromMetadata(this.metadata, false);
        const rawCommit = {
            header,
            data: jsonPatch,
            prev: this.tip,
            id: this.id.cid,
        };
        const commit = await TileDocument_1._signDagJWS(this.api, rawCommit);
        const updated = await this.api.applyCommit(this.id, commit, opts);
        this.state$.next(updated.state);
    }
    makeReadOnly() {
        this.update = throwReadOnlyError;
        this.patch = throwReadOnlyError;
        this.sync = throwReadOnlyError;
        this._isReadOnly = true;
    }
    get isReadOnly() {
        return this._isReadOnly;
    }
    async makeCommit(signer, newContent, newMetadata) {
        const commit = await this._makeRawCommit(signer, newContent, newMetadata);
        return TileDocument_1._signDagJWS(signer, commit);
    }
    async _makeRawCommit(signer, newContent, newMetadata) {
        const header = headerFromMetadata(newMetadata, false);
        if (newContent == null) {
            newContent = this.content;
        }
        if (header.controllers) {
            if (header.controllers.length !== 1) {
                throw new Error('Exactly one controller must be specified');
            }
            if (!header.controllers[0]) {
                throw new Error('Controller cannot be updated to an undefined value.');
            }
        }
        const patch = jsonpatch.compare(this.content, newContent);
        const commit = {
            header,
            data: patch,
            prev: this.tip,
            id: this.state.log[0].cid,
        };
        return commit;
    }
    static async makeGenesis(signer, content, metadata) {
        if (!metadata) {
            metadata = {};
        }
        if (!metadata.controllers || metadata.controllers.length === 0) {
            if (signer.did) {
                await _ensureAuthenticated(signer);
                metadata.controllers = [signer.did.hasParent ? signer.did.parent : signer.did.id];
            }
            else {
                throw new Error('No controllers specified');
            }
        }
        if (metadata.controllers?.length !== 1) {
            throw new Error('Exactly one controller must be specified');
        }
        const header = headerFromMetadata(metadata, true);
        if (metadata?.deterministic && content) {
            throw new Error('Initial content must be null when creating a deterministic Tile document');
        }
        if (content == null) {
            const result = { header };
            dagCbor.encode(result);
            return result;
        }
        const commit = { data: content, header };
        return TileDocument_1._signDagJWS(signer, commit);
    }
    static async _signDagJWS(signer, commit) {
        await _ensureAuthenticated(signer);
        return signer.did.createDagJWS(commit);
    }
};
TileDocument.STREAM_TYPE_NAME = 'tile';
TileDocument.STREAM_TYPE_ID = 0;
TileDocument = TileDocument_1 = __decorate([
    StreamStatic()
], TileDocument);
export { TileDocument };
//# sourceMappingURL=tile-document.js.map
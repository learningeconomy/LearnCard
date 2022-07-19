var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _CommitID_type, _CommitID_cid, _CommitID_commit;
import { CID } from 'multiformats/cid';
import { base36 } from 'multiformats/bases/base36';
import { StreamType } from './stream-type.js';
import varint from 'varint';
import { concat as uint8ArrayConcat } from 'uint8arrays';
import { Memoize } from 'typescript-memoize';
import { STREAMID_CODEC } from './constants.js';
import { readCid, readVarint } from './reading-bytes.js';
import { StreamID } from './stream-id.js';
function fromBytes(bytes) {
    const result = fromBytesNoThrow(bytes);
    if (result instanceof Error) {
        throw result;
    }
    return result;
}
function fromBytesNoThrow(bytes) {
    const [streamCodec, streamCodecRemainder] = readVarint(bytes);
    if (streamCodec !== STREAMID_CODEC)
        return new Error('fromBytes: invalid streamid, does not include streamid codec');
    const [type, streamtypeRemainder] = readVarint(streamCodecRemainder);
    const cidResult = readCid(streamtypeRemainder);
    if (cidResult instanceof Error) {
        return cidResult;
    }
    const [base, baseRemainder] = cidResult;
    if (baseRemainder.length === 0) {
        return new Error(`No commit information provided`);
    }
    else if (baseRemainder.length === 1) {
        return new CommitID(type, base, baseRemainder[0]);
    }
    else {
        const [commit] = readCid(baseRemainder);
        return new CommitID(type, base, commit);
    }
}
function parseCID(input) {
    try {
        return typeof input === 'string' ? CID.parse(input) : CID.asCID(input);
    }
    catch {
        return undefined;
    }
}
function parseCommit(genesis, commit = null) {
    if (!commit)
        return null;
    const commitCID = parseCID(commit);
    if (commitCID) {
        if (genesis.equals(commitCID)) {
            return null;
        }
        else {
            return commitCID;
        }
    }
    else if (String(commit) === '0') {
        return null;
    }
    else {
        throw new Error('Cannot specify commit as a number except to request commit 0 (the genesis commit)');
    }
}
function fromString(input) {
    const result = fromStringNoThrow(input);
    if (result instanceof Error) {
        throw result;
    }
    return result;
}
function fromStringNoThrow(input) {
    const protocolFree = input.replace('ceramic://', '').replace('/ceramic/', '');
    if (protocolFree.includes('commit')) {
        const commit = protocolFree.split('?')[1].split('=')[1];
        const base = protocolFree.split('?')[0];
        return make(StreamID.fromString(base), commit);
    }
    else {
        return fromBytesNoThrow(base36.decode(protocolFree));
    }
}
const TAG = Symbol.for('@ceramicnetwork/streamid/CommitID');
function make(stream, commit) {
    return new CommitID(stream.type, stream.cid, commit);
}
export class CommitID {
    constructor(type, cid, commit = null) {
        this._tag = TAG;
        _CommitID_type.set(this, void 0);
        _CommitID_cid.set(this, void 0);
        _CommitID_commit.set(this, void 0);
        if (!type && type !== 0)
            throw new Error('constructor: type required');
        if (!cid)
            throw new Error('constructor: cid required');
        __classPrivateFieldSet(this, _CommitID_type, typeof type === 'string' ? StreamType.codeByName(type) : type, "f");
        __classPrivateFieldSet(this, _CommitID_cid, typeof cid === 'string' ? CID.parse(cid) : cid, "f");
        __classPrivateFieldSet(this, _CommitID_commit, parseCommit(__classPrivateFieldGet(this, _CommitID_cid, "f"), commit), "f");
    }
    static isInstance(instance) {
        return typeof instance === 'object' && '_tag' in instance && instance._tag === TAG;
    }
    get baseID() {
        return new StreamID(__classPrivateFieldGet(this, _CommitID_type, "f"), __classPrivateFieldGet(this, _CommitID_cid, "f"));
    }
    get type() {
        return __classPrivateFieldGet(this, _CommitID_type, "f");
    }
    get typeName() {
        return StreamType.nameByCode(__classPrivateFieldGet(this, _CommitID_type, "f"));
    }
    get cid() {
        return __classPrivateFieldGet(this, _CommitID_cid, "f");
    }
    get commit() {
        return __classPrivateFieldGet(this, _CommitID_commit, "f") || __classPrivateFieldGet(this, _CommitID_cid, "f");
    }
    get bytes() {
        const codec = varint.encode(STREAMID_CODEC);
        const type = varint.encode(this.type);
        const commitBytes = __classPrivateFieldGet(this, _CommitID_commit, "f")?.bytes || new Uint8Array([0]);
        return uint8ArrayConcat([codec, type, this.cid.bytes, commitBytes]);
    }
    equals(other) {
        return (this.type === other.type && this.cid.equals(other.cid) && this.commit.equals(other.commit));
    }
    toString() {
        return base36.encode(this.bytes);
    }
    toUrl() {
        return `ceramic://${this.toString()}`;
    }
    [(_CommitID_type = new WeakMap(), _CommitID_cid = new WeakMap(), _CommitID_commit = new WeakMap(), Symbol.for('nodejs.util.inspect.custom'))]() {
        return `CommitID(${this.toString()})`;
    }
    [Symbol.toPrimitive]() {
        return this.toString();
    }
}
CommitID.fromBytes = fromBytes;
CommitID.fromBytesNoThrow = fromBytesNoThrow;
CommitID.fromString = fromString;
CommitID.fromStringNoThrow = fromStringNoThrow;
CommitID.make = make;
__decorate([
    Memoize(),
    __metadata("design:type", StreamID),
    __metadata("design:paramtypes", [])
], CommitID.prototype, "baseID", null);
__decorate([
    Memoize(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], CommitID.prototype, "typeName", null);
__decorate([
    Memoize(),
    __metadata("design:type", CID),
    __metadata("design:paramtypes", [])
], CommitID.prototype, "commit", null);
__decorate([
    Memoize(),
    __metadata("design:type", Uint8Array),
    __metadata("design:paramtypes", [])
], CommitID.prototype, "bytes", null);
__decorate([
    Memoize(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], CommitID.prototype, "toString", null);
__decorate([
    Memoize(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], CommitID.prototype, "toUrl", null);
//# sourceMappingURL=commit-id.js.map
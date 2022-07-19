var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { CID } from 'multiformats/cid';
import * as Block from 'multiformats/block';
import { base36 } from 'multiformats/bases/base36';
import { sha256 as hasher } from 'multiformats/hashes/sha2';
import varint from 'varint';
import * as codec from '@ipld/dag-cbor';
import { concat as uint8ArrayConcat } from 'uint8arrays';
import { STREAMID_CODEC } from './constants.js';
import { readCidNoThrow, readVarint } from './reading-bytes.js';
import { Memoize } from 'typescript-memoize';
import { StreamType } from './stream-type.js';
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
    const [type, streamTypeRemainder] = readVarint(streamCodecRemainder);
    const cidResult = readCidNoThrow(streamTypeRemainder);
    if (cidResult instanceof Error) {
        return cidResult;
    }
    const [cid, cidRemainder] = cidResult;
    if (cidRemainder.length > 0) {
        return new Error(`Invalid StreamID: contains commit`);
    }
    return new StreamID(type, cid);
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
    const commitFree = protocolFree.includes('commit') ? protocolFree.split('?')[0] : protocolFree;
    const bytes = base36.decode(commitFree);
    return fromBytesNoThrow(bytes);
}
const TAG = Symbol.for('@ceramicnetwork/streamid/StreamID');
export class StreamID {
    constructor(type, cid) {
        this._tag = TAG;
        if (!(type || type === 0))
            throw new Error('constructor: type required');
        if (!cid)
            throw new Error('constructor: cid required');
        this._type = typeof type === 'string' ? StreamType.codeByName(type) : type;
        this._cid = typeof cid === 'string' ? CID.parse(cid) : cid;
    }
    static isInstance(instance) {
        return typeof instance === 'object' && '_tag' in instance && instance._tag === TAG;
    }
    static async fromGenesis(type, genesis) {
        const block = await Block.encode({ value: genesis, codec, hasher });
        return new StreamID(type, block.cid);
    }
    get type() {
        return this._type;
    }
    get typeName() {
        return StreamType.nameByCode(this._type);
    }
    get cid() {
        return this._cid;
    }
    get bytes() {
        const codec = varint.encode(STREAMID_CODEC);
        const type = varint.encode(this.type);
        return uint8ArrayConcat([codec, type, this.cid.bytes]);
    }
    get baseID() {
        return new StreamID(this._type, this._cid);
    }
    equals(other) {
        if (StreamID.isInstance(other)) {
            return this.type === other.type && this.cid.equals(other.cid);
        }
        else {
            return false;
        }
    }
    toString() {
        return base36.encode(this.bytes);
    }
    toUrl() {
        return `ceramic://${this.toString()}`;
    }
    [Symbol.for('nodejs.util.inspect.custom')]() {
        return `StreamID(${this.toString()})`;
    }
    [Symbol.toPrimitive]() {
        return this.toString();
    }
}
StreamID.fromBytes = fromBytes;
StreamID.fromBytesNoThrow = fromBytesNoThrow;
StreamID.fromString = fromString;
StreamID.fromStringNoThrow = fromStringNoThrow;
__decorate([
    Memoize(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], StreamID.prototype, "typeName", null);
__decorate([
    Memoize(),
    __metadata("design:type", Uint8Array),
    __metadata("design:paramtypes", [])
], StreamID.prototype, "bytes", null);
__decorate([
    Memoize(),
    __metadata("design:type", StreamID),
    __metadata("design:paramtypes", [])
], StreamID.prototype, "baseID", null);
__decorate([
    Memoize(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], StreamID.prototype, "toString", null);
__decorate([
    Memoize(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], StreamID.prototype, "toUrl", null);
//# sourceMappingURL=stream-id.js.map
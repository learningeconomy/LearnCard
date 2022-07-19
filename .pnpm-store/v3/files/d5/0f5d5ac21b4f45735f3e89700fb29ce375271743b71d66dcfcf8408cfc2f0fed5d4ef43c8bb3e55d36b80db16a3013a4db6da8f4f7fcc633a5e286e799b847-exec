import { CID } from 'multiformats/cid';
import { StreamID } from './stream-id.js';
import { StreamRef } from './stream-ref.js';
declare function fromBytes(bytes: Uint8Array): CommitID;
declare function fromBytesNoThrow(bytes: Uint8Array): CommitID | Error;
declare function fromString(input: string): CommitID;
declare function fromStringNoThrow(input: string): CommitID | Error;
declare function make(stream: StreamID, commit: CID | string | number): CommitID;
export declare class CommitID implements StreamRef {
    #private;
    protected readonly _tag: symbol;
    static fromBytes: typeof fromBytes;
    static fromBytesNoThrow: typeof fromBytesNoThrow;
    static fromString: typeof fromString;
    static fromStringNoThrow: typeof fromStringNoThrow;
    static make: typeof make;
    static isInstance(instance: any): instance is CommitID;
    constructor(type: string | number, cid: CID | string, commit?: CID | string | number);
    get baseID(): StreamID;
    get type(): number;
    get typeName(): string;
    get cid(): CID;
    get commit(): CID;
    get bytes(): Uint8Array;
    equals(other: CommitID): boolean;
    toString(): string;
    toUrl(): string;
    [Symbol.toPrimitive](): string | Uint8Array;
}
export {};
//# sourceMappingURL=commit-id.d.ts.map
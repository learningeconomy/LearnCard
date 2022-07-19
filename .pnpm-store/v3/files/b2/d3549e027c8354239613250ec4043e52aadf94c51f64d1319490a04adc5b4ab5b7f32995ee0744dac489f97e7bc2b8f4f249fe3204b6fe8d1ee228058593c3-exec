import { CID } from 'multiformats/cid';
import { StreamRef } from './stream-ref.js';
declare function fromBytes(bytes: Uint8Array): StreamID;
declare function fromBytesNoThrow(bytes: Uint8Array): StreamID | Error;
declare function fromString(input: string): StreamID;
declare function fromStringNoThrow(input: string): StreamID | Error;
export declare class StreamID implements StreamRef {
    protected readonly _tag: symbol;
    private readonly _type;
    private readonly _cid;
    static fromBytes: typeof fromBytes;
    static fromBytesNoThrow: typeof fromBytesNoThrow;
    static fromString: typeof fromString;
    static fromStringNoThrow: typeof fromStringNoThrow;
    static isInstance(instance: any): instance is StreamID;
    constructor(type: string | number, cid: CID | string);
    static fromGenesis(type: string | number, genesis: Record<string, any>): Promise<StreamID>;
    get type(): number;
    get typeName(): string;
    get cid(): CID;
    get bytes(): Uint8Array;
    get baseID(): StreamID;
    equals(other: StreamID): boolean;
    toString(): string;
    toUrl(): string;
    [Symbol.toPrimitive](): string;
}
export {};
//# sourceMappingURL=stream-id.d.ts.map
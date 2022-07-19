import type { CID } from 'multiformats/cid';
import { StreamID } from './stream-id.js';
import { CommitID } from './commit-id.js';
export interface StreamRef {
    readonly type: number;
    readonly typeName: string;
    readonly cid: CID;
    readonly bytes: Uint8Array;
    readonly baseID: StreamID;
    equals(other: this): boolean;
    toString(): string;
    toUrl(): string;
}
export declare namespace StreamRef {
    function from(input: StreamID | CommitID | string | Uint8Array): StreamID | CommitID;
}
//# sourceMappingURL=stream-ref.d.ts.map
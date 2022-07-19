import type { CID } from 'multiformats/cid';
import type { IpfsApi } from './index.js';
export interface PinningBackend {
    id: string;
    open(): void;
    close(): Promise<void>;
    pin(cid: CID): Promise<void>;
    unpin(cid: CID): Promise<void>;
    ls(): Promise<CidList>;
    info(): Promise<PinningInfo>;
}
export interface PinningBackendStatic {
    designator: string;
    new (connectionString: string, ipfs: IpfsApi): PinningBackend;
}
export declare type CidString = string;
export declare type Designator = string;
export declare type CidList = Record<CidString, Designator[]>;
export declare type PinningInfo = Record<string, any>;
//# sourceMappingURL=pinning.d.ts.map
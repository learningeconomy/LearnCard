import type { CID } from 'multiformats/cid';
import type { Observable } from 'rxjs';
import type { AnchorProof, AnchorStatus } from './stream.js';
import type { CeramicApi } from './ceramic-api.js';
import type { StreamID } from '@ceramicnetwork/streamid';
export interface AnchorServicePending {
    readonly status: AnchorStatus.PENDING;
    readonly streamId: StreamID;
    readonly cid: CID;
    readonly message: string;
    readonly anchorScheduledFor: number;
}
export interface AnchorServiceProcessing {
    readonly status: AnchorStatus.PROCESSING;
    readonly streamId: StreamID;
    readonly cid: CID;
    readonly message: string;
}
export interface AnchorServiceAnchored {
    readonly status: AnchorStatus.ANCHORED;
    readonly streamId: StreamID;
    readonly cid: CID;
    readonly message: string;
    readonly anchorCommit: CID;
}
export interface AnchorServiceFailed {
    readonly status: AnchorStatus.FAILED;
    readonly streamId: StreamID;
    readonly cid: CID;
    readonly message: string;
}
export declare type AnchorServiceResponse = AnchorServicePending | AnchorServiceProcessing | AnchorServiceAnchored | AnchorServiceFailed;
export interface AnchorService {
    init(): Promise<void>;
    ceramic: CeramicApi;
    url: string;
    requestAnchor(streamId: StreamID, tip: CID): Observable<AnchorServiceResponse>;
    pollForAnchorResponse(streamId: StreamID, tip: CID): Observable<AnchorServiceResponse>;
    getSupportedChains(): Promise<Array<string>>;
}
export interface AnchorValidator {
    init(chainId: string | null): Promise<void>;
    validateChainInclusion(anchorProof: AnchorProof): Promise<void>;
}
//# sourceMappingURL=anchor-service.d.ts.map
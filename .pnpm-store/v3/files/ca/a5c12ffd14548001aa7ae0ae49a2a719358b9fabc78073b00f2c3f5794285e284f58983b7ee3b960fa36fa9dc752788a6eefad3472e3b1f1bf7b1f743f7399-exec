import type { DID } from 'dids';
export interface PinningOpts {
    pin?: boolean;
}
export declare enum SyncOptions {
    PREFER_CACHE = 0,
    SYNC_ALWAYS = 1,
    NEVER_SYNC = 2
}
interface SyncOpts {
    sync?: SyncOptions;
    syncTimeoutSeconds?: number;
}
export interface InternalOpts {
    throwOnInvalidCommit?: boolean;
}
export interface LoadOpts extends SyncOpts, PinningOpts {
    atTime?: number;
}
export interface PublishOpts {
    publish?: boolean;
}
export interface AnchorOpts {
    anchor?: boolean;
}
export interface UpdateOpts extends PublishOpts, AnchorOpts, InternalOpts, PinningOpts {
    asDID?: DID;
}
export interface CreateOpts extends UpdateOpts, SyncOpts, PinningOpts {
}
export {};
//# sourceMappingURL=streamopts.d.ts.map
/**
 * Draft 3 §5.5 Core errors that v1 raises. The service throws these; the router
 * maps them to tRPC codes and the `data.hcp` Core error in one place (router.ts).
 */
export type HcpV1ErrorType =
    'malformed-request' | 'invalid-token' | 'scope-denied' | 'version-conflict';

export class HcpV1Error extends Error {
    readonly type: HcpV1ErrorType;

    constructor(type: HcpV1ErrorType, detail: string) {
        super(detail);
        this.name = 'HcpV1Error';
        this.type = type;
    }
}

/**
 * One message for every not-authorized outcome, so a response never discloses
 * whether the entry exists or which bound the request crossed (Draft 3 §5.5).
 */
export const SCOPE_DENIED_DETAIL =
    "The request is outside the caller's grant, or the entry does not exist.";

export const scopeDenied = (): HcpV1Error => new HcpV1Error('scope-denied', SCOPE_DENIED_DETAIL);

export const malformed = (detail: string): HcpV1Error =>
    new HcpV1Error('malformed-request', detail);

export const versionConflict = (): HcpV1Error =>
    new HcpV1Error('version-conflict', "expectedVersion is not the entry's current version.");

/** LC-2421: the contract moved on from the version the person reviewed. */
export const contractChanged = (): HcpV1Error =>
    new HcpV1Error(
        'version-conflict',
        'The contract changed since it was reviewed; review it again before allowing.'
    );

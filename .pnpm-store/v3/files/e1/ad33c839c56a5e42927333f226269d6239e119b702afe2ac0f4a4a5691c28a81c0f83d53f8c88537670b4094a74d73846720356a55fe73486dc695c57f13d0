const didRegex = /^did:([A-Za-z0-9]+):([A-Za-z0-9.\-:_]+)$/;
/** @internal */ export function isDIDstring(did) {
    return didRegex.test(did);
}
/** @internal */ export function assertDIDstring(did) {
    if (!isDIDstring(did)) {
        throw new Error(`Invalid DID: ${did}`);
    }
}
/** @internal */ export function getIDXMetadata(did) {
    assertDIDstring(did);
    return {
        controllers: [
            did
        ],
        family: 'IDX'
    };
}

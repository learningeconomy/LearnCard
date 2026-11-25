export type NitroAttestationReason =
    | 'cbor'
    | 'cose'
    | 'alg'
    | 'chain'
    | 'root'
    | 'signature'
    | 'pcr'
    | 'debug'
    | 'nonce'
    | 'freshness'
    | 'user-data';

/** A fail-closed attestation failure with a stable, non-sensitive reason. */
export class NitroAttestationError extends Error {
    constructor(public readonly reason: NitroAttestationReason) {
        super(`Nitro attestation rejected: ${reason}`);
        this.name = 'NitroAttestationError';
    }
}

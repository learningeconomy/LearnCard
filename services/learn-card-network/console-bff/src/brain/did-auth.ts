import type { KeyManagementService, ManagedKeyRef } from '@kms';

import { KmsJwtSigner } from './kms-jwt-signer';

export const DID_AUTH_VP_TTL_SECONDS = 300;

// brain-service's createContext reads the caller DID from `vp.holder` and the challenge from
// the top-level `nonce` claim, then DIDKit-verifies the JWS against the did:web document.
export function buildDidAuthVpPayload(
    did: string,
    challenge: string,
    now: number = Math.floor(Date.now() / 1000)
): Record<string, unknown> {
    return {
        iss: did,
        nonce: challenge,
        iat: now,
        exp: now + DID_AUTH_VP_TTL_SECONDS,
        vp: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: ['VerifiablePresentation'],
            holder: did,
        },
    };
}

export class DidAuthBearerFactory {
    private readonly signer: KmsJwtSigner;

    constructor(kms: KeyManagementService) {
        this.signer = new KmsJwtSigner(kms);
    }

    async createBearer(did: string, keyRef: ManagedKeyRef, challenge: string): Promise<string> {
        return this.signer.sign({ did, keyRef, payload: buildDidAuthVpPayload(did, challenge) });
    }
}

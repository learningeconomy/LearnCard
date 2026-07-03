import type { KeyManagementService, ManagedKeyRef } from '@kms';

import { KmsJwtSigner } from './kms-jwt-signer';

// brain-service's createContext reads the caller DID from `vp.holder` and the challenge from
// the top-level `nonce` claim, then DIDKit-verifies the JWS against the did:web document.
export function buildDidAuthVpPayload(did: string, challenge: string): Record<string, unknown> {
    return {
        iss: did,
        nonce: challenge,
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

import { parseSdJwtVc } from './parse';
import { verifySdJwtVc } from './verify';
import { categorizeSdJwt } from './categorize';
import { toSdJwtDisplayViewModel } from './display';
import { type SdJwtVcDependentLearnCard, type SdJwtVcPlugin } from './types';

const SD_JWT_PROOF_TYPE = 'SdJwtCompactProof';

interface ProofWithType {
    type?: unknown;
    jwt?: unknown;
}

const pickProof = (credential: unknown): ProofWithType | undefined => {
    if (!credential || typeof credential !== 'object') return undefined;
    const proof = (credential as { proof?: unknown }).proof;
    if (!proof) return undefined;
    if (Array.isArray(proof)) {
        return proof.find(p => typeof p === 'object' && p !== null) as ProofWithType | undefined;
    }
    if (typeof proof === 'object') return proof as ProofWithType;
    return undefined;
};

export const getSdJwtVcPlugin = (learnCard: SdJwtVcDependentLearnCard): SdJwtVcPlugin => ({
    name: 'SDJwtVc',
    displayName: 'SD-JWT-VC',
    description:
        'SD-JWT-VC holder + verifier support (RFC 9901 + draft-ietf-oauth-sd-jwt-vc). Selective-disclosure JWT credentials with DID-resolvable issuer verification. Extends `verifyCredential` so SD-JWT-VCs (proof.type "SdJwtCompactProof") are verified against the issuer signature instead of silently passing through DIDKit.',
    methods: {
        parseSdJwtVc: async (_lc, compact: string) => parseSdJwtVc(compact),

        verifySdJwtVc: async (_lc, compact: string, options = {}) =>
            verifySdJwtVc(learnCard, compact, options),

        decodeSdJwtClaims: async (_lc, compact: string) => {
            const parsed = await parseSdJwtVc(compact);
            return parsed.claims;
        },

        categorizeSdJwtVct: (_lc, vct: string) => categorizeSdJwt(vct),

        toSdJwtDisplayViewModel: (_lc, parsed) => toSdJwtDisplayViewModel(parsed),

        verifyCredential: async (_lc, credential, options) => {
            const proof = pickProof(credential);
            if (
                proof?.type === SD_JWT_PROOF_TYPE &&
                typeof proof.jwt === 'string' &&
                proof.jwt.length > 0
            ) {
                return verifySdJwtVc(learnCard, proof.jwt, {});
            }
            return learnCard.invoke.verifyCredential(credential, options);
        },
    },
});

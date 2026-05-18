import { parseSdJwtVc } from './parse';
import { verifySdJwtVc } from './verify';
import { type SdJwtVcDependentLearnCard, type SdJwtVcPlugin } from './types';

export const getSdJwtVcPlugin = (learnCard: SdJwtVcDependentLearnCard): SdJwtVcPlugin => ({
    name: 'SDJwtVc',
    displayName: 'SD-JWT-VC',
    description:
        'SD-JWT-VC holder + verifier support (RFC 9901 + draft-ietf-oauth-sd-jwt-vc). Selective-disclosure JWT credentials with DID-resolvable issuer verification.',
    methods: {
        parseSdJwtVc: async (_lc, compact: string) => parseSdJwtVc(compact),

        verifySdJwtVc: async (_lc, compact: string, options = {}) =>
            verifySdJwtVc(learnCard, compact, options),

        decodeSdJwtClaims: async (_lc, compact: string) => {
            const parsed = await parseSdJwtVc(compact);
            return parsed.claims;
        },
    },
});

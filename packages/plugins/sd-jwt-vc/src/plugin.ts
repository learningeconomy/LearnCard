import { parseSdJwtVc } from './parse';
import { verifySdJwtVc } from './verify';
import {
    SD_JWT_VC_FORMAT,
    type SdJwtVcDependentLearnCard,
    type SdJwtVcPlugin,
} from './types';

export const getSdJwtVcPlugin = (learnCard: SdJwtVcDependentLearnCard): SdJwtVcPlugin => ({
    name: 'SDJwtVc',
    displayName: 'SD-JWT-VC',
    description:
        'SD-JWT-VC holder + verifier support (RFC 9901 + draft-ietf-oauth-sd-jwt-vc). Selective-disclosure JWT credentials with DID-resolvable issuer verification.',
    methods: {
        parseSdJwtVc: async (_lc, compact: string) => parseSdJwtVc(compact, SD_JWT_VC_FORMAT),

        verifySdJwtVc: async (_lc, compact: string, options = {}) =>
            verifySdJwtVc(learnCard, compact, options, SD_JWT_VC_FORMAT),

        decodeSdJwtClaims: async (_lc, compact: string) => {
            const parsed = await parseSdJwtVc(compact, SD_JWT_VC_FORMAT);
            return parsed.claims;
        },
    },
});

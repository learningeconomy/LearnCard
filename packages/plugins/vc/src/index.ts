export { getVCPlugin } from './vc';
export { refreshCredential } from './refreshCredential';
export * from './types';
export {
    extractCompactJwt,
    getVerifiedCredentialTemporalStatus,
    verifyCredentialJwt,
} from './verifyCredentialJwt';
export type {
    VerifiedCredentialJwt,
    VerifiedCredentialJwtResult,
    VerifiedCredentialMetadata,
    VerifiedCredentialProfile,
    VerifiedCredentialTemporalStatus,
    VerifyCredentialJwtOptions,
} from './verifyCredentialJwt';

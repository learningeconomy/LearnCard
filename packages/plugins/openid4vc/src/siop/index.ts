/**
 * SIOPv2 (Self-Issued OpenID Provider v2) surface.
 *
 * Currently scoped to **holder-side ID token issuance** used by OID4VP
 * combined flows (`response_type=vp_token id_token`). SIOPv2-only
 * flows (no VP at all, just an id_token) reuse the same module — the
 * wallet just wouldn't call `buildPresentation` beforehand.
 */

export {
    signIdToken,
    SiopSignError,
    responseTypeSet,
    requiresIdToken,
} from './sign';

export type {
    SignIdTokenOptions,
    SignIdTokenHelpers,
    SignIdTokenResult,
    SiopSignErrorCode,
} from './sign';

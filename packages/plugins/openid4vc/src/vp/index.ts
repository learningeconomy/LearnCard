/**
 * OpenID4VP (Verifier-side → Wallet holder) surface.
 *
 * The verify / present half of OpenID4VC: parse Authorization Requests,
 * match the holder's credentials against DIF PEX v2 Presentation
 * Definitions, and build the DIF PEX Presentation Submission. Signing
 * the resulting vp_token and posting it to the verifier lives in Slice 7.
 */

export {
    parseAuthorizationRequestUri,
    resolvePresentationDefinitionByReference,
    resolveAuthorizationRequest,
} from './parse';

export type { ResolveAuthorizationRequestOptions } from './parse';

export {
    verifyAndDecodeRequestObject,
    RequestObjectError,
    builtInDidResolver,
} from './request-object';

export type {
    RequestObjectErrorCode,
    VerifyRequestObjectOptions,
    DidResolver,
    DidDocument,
    VerificationMethod,
} from './request-object';

export {
    selectCredentials,
    buildPresentationSubmission,
    inferCredentialFormat,
} from './select';

export {
    evaluateField,
    matchInputDescriptor,
    queryJsonPath,
    satisfiesFilter,
} from './pex';

export type {
    AuthorizationRequest,
    ParsedAuthorizationRequest,
    PresentationDefinition,
    InputDescriptor,
    Constraints,
    Field,
    SubmissionRequirement,
    ClaimFormatDesignation,
    VpErrorCode,
} from './types';

export { VpError } from './types';

export type {
    CandidateCredential,
    DescriptorCandidate,
    DescriptorSelection,
    SelectionResult,
    SelectedDescriptor,
    PresentationSubmission,
    PresentationSubmissionDescriptor,
} from './select';

export type { DescriptorMatch, FieldMatch } from './pex';

export { buildPresentation, BuildPresentationError } from './present';

export type {
    VpFormat,
    ChosenCredential,
    BuildPresentationOptions,
    PreparedPresentation,
    BuildPresentationErrorCode,
} from './present';

export { signPresentation, VpSignError } from './sign';

export type {
    VpToken,
    LdpVpSigner,
    SignPresentationOptions,
    SignPresentationHelpers,
    SignPresentationResult,
    VpSignErrorCode,
} from './sign';

export { submitPresentation, VpSubmitError } from './submit';

export type {
    SubmitPresentationOptions,
    SubmitPresentationResult,
    VpSubmitErrorCode,
} from './submit';

export {
    encryptResponseObject,
    JarmEncryptError,
    DEFAULT_JWE_ALG,
    DEFAULT_JWE_ENC,
} from './encrypt';

export type {
    EncryptResponseObjectOptions,
    JarmClientMetadata,
    JarmEncryptErrorCode,
    ResponseObjectPayload,
} from './encrypt';

// `checkCredentialStatus` and the bitstring status-list types live
// in `@learncard/status-list-plugin`. They were originally exported
// from this module while VP and status checking lived in the same
// package; that has since been split.
//
// `import { checkCredentialStatus } from '@learncard/status-list-plugin';`

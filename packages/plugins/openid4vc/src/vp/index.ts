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

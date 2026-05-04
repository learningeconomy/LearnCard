/**
 * Public DCQL surface — what the plugin exposes to the host LearnCard
 * (and, transitively, to apps consuming `@learncard/openid4vc-plugin`).
 *
 * Holder-side primitives are auto-wired into `presentCredentials` and
 * `prepareVerifiablePresentation` — most app code never imports from
 * here. The export surface exists for advanced callers building their
 * own UI flows or LearnCard apps acting as **verifiers** (in which
 * case `compose` is the entry point).
 */

// Type re-exports (no runtime cost — these come from `dcql`).
export type {
    DcqlQuery,
    DcqlQueryResult,
    DcqlCredential,
    DcqlW3cVcCredential,
    DcqlSdJwtVcCredential,
    DcqlMdocCredential,
    DcqlPresentation,
    DcqlPresentationResult,
    DcqlPresentationEntry,
} from './types';

// Holder-side: parse, adapt, select, build, sign, assemble.
export { parseDcqlQuery } from './parse';

export {
    adaptCredentialForDcql,
    adaptCredentialsForDcql,
    type AdaptableCredential,
} from './adapt';

export {
    selectCredentialsForDcql,
    type DcqlSelectionResult,
    type DcqlCredentialMatch,
} from './select';

export {
    buildDcqlPresentations,
    BuildDcqlPresentationError,
    type BuildDcqlPresentationsInput,
    type BuiltDcqlPresentation,
    type DcqlChosenCredential,
    type DcqlVpFormat,
    type BuildDcqlPresentationErrorCode,
} from './build';

export {
    signDcqlPresentations,
    buildDcqlResponse,
    assembleDcqlVpToken,
    type DcqlSignedPresentation,
    type DcqlInnerVpToken,
    type DcqlResponse,
    type SignDcqlPresentationsInput,
    type SignDcqlPresentationsHelpers,
} from './respond';

// Verifier-side: build queries from caller intent.
export {
    buildDcqlQuery,
    requestW3cVc,
    type RequestW3cVcSpec,
    type RequestW3cVcClaim,
} from './compose';

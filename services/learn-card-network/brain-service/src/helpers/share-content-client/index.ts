export * from './types';
export {
    canonicalizeShareContentRequestBody,
    computeShareContentRequestBodyHash,
    isSha256Hex,
    ShareContentCanonicalizationError,
} from './canonical';
export {
    DISABLED_SHARE_CONTENT_CLIENT_CONFIG,
    resolveShareContentClientConfig,
    validateShareContentOrigin,
} from './config';
export { createShareContentClient } from './client';
export {
    parseShareContentActiveSummary,
    parseShareContentContentProjection,
    parseShareContentDeleteValue,
    parseShareContentPutValue,
    parseShareContentRecoveryProjection,
    parseShareContentResponseEnvelope,
    parseShareContentStatValue,
    parseShareContentTombstoneSummary,
} from './responses';

// The runtime did:web signing adapter deliberately lives outside this barrel:
// import `@helpers/share-content-client/adapters` from the wiring layer so unit
// tests of the transport never load the LearnCard/environment graph.

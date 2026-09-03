// Types
export type {
    CredentialSpec,
    CredentialProfile,
    CredentialFeature,
    FixtureKind,
    FixtureSource,
    FixtureValidity,
    BaseCredentialFixture,
    CredentialFixture,
    SdJwtVcTemplate,
    SdJwtVcFixture,
    LibraryFixture,
    FixtureFilter,
    InvalidCredential,
} from './types';

export {
    CREDENTIAL_SPECS,
    CREDENTIAL_PROFILES,
    CREDENTIAL_FEATURES,
    FIXTURE_KINDS,
    FIXTURE_SOURCES,
    FIXTURE_VALIDITIES,
    isCredentialFixture,
    isSdJwtVcFixture,
} from './types';

// Registry (query API + mutation)
export {
    registerFixture,
    registerFixtures,
    resetRegistry,
    getAllFixtures,
    getFixture,
    findFixture,
    getFixtures,
    getUnsignedFixtures,
    getSignedFixtures,
    getValidFixtures,
    getInvalidFixtures,
    getStats,
} from './registry';

export type { RegistryStats } from './registry';

// Prepare — bridge fixtures to wallet issuance
export { prepareFixture, prepareFixtureById } from './prepare';

export type { PrepareOptions } from './prepare';

// SD-JWT VC materialization
export { materializeSdJwtVcFixture } from './materialize-sd-jwt-vc';

export type {
    SdJwtVcSigner,
    MaterializeSdJwtVcOptions,
    MaterializedSdJwtVcFixture,
} from './materialize-sd-jwt-vc';

// Fixtures — importing this module registers all fixtures in the registry
export * from './fixtures';

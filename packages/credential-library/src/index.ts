// Types
export type {
    CredentialSpec,
    CredentialProfile,
    CredentialFeature,
    FixtureSource,
    FixtureValidity,
    CredentialFixture,
    FixtureFilter,
    InvalidCredential,
} from './types';

export {
    CREDENTIAL_SPECS,
    CREDENTIAL_PROFILES,
    CREDENTIAL_FEATURES,
    FIXTURE_SOURCES,
    FIXTURE_VALIDITIES,
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

// Fixtures — importing this module registers all fixtures in the registry
export * from './fixtures';

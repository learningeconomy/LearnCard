import type { z } from 'zod';
import type { UnsignedVC, VC } from '@learncard/types';

// ---------------------------------------------------------------------------
// Credential Spec — which standard does this credential conform to?
// ---------------------------------------------------------------------------

export const CREDENTIAL_SPECS = [
    'vc-v1',
    'vc-v2',
    'obv3',
    'clr-v2',
    'europass',
    'sd-jwt-vc',
    'custom',
] as const;

export type CredentialSpec = (typeof CREDENTIAL_SPECS)[number];

// ---------------------------------------------------------------------------
// Credential Profile — what kind of credential is it?
// ---------------------------------------------------------------------------

export const CREDENTIAL_PROFILES = [
    'badge',
    'diploma',
    'certificate',
    'id',
    'membership',
    'license',
    'micro-credential',
    'course',
    'degree',
    'boost',
    'boost-id',
    'delegate',
    'endorsement',
    'learner-record',
    'generic',
] as const;

export type CredentialProfile = (typeof CREDENTIAL_PROFILES)[number];

// ---------------------------------------------------------------------------
// Credential Feature — what optional VC features does this fixture exercise?
// ---------------------------------------------------------------------------

export const CREDENTIAL_FEATURES = [
    'evidence',
    'alignment',
    'endorsement',
    'expiration',
    'status',
    'multiple-subjects',
    'multiple-proofs',
    'refresh-service',
    'terms-of-use',
    'credential-schema',
    'image',
    'results',
    'source',
    'skills',
    'display',
    'attachments',
    'associations',
    'nested-credentials',
    'selective-disclosure',
    'holder-binding',
] as const;

export type CredentialFeature = (typeof CREDENTIAL_FEATURES)[number];

// ---------------------------------------------------------------------------
// Fixture Source — where did this credential come from?
// ---------------------------------------------------------------------------

export const FIXTURE_SOURCES = ['spec-example', 'plugfest', 'real-world', 'synthetic'] as const;

export type FixtureSource = (typeof FIXTURE_SOURCES)[number];

// ---------------------------------------------------------------------------
// Fixture Validity — is this intentionally valid or invalid?
// ---------------------------------------------------------------------------

export const FIXTURE_VALIDITIES = ['valid', 'invalid', 'tampered'] as const;

export type FixtureValidity = (typeof FIXTURE_VALIDITIES)[number];

export const FIXTURE_KINDS = ['w3c-vc', 'sd-jwt-vc'] as const;

export type FixtureKind = (typeof FIXTURE_KINDS)[number];

// Used for intentionally malformed fixtures that violate the UnsignedVC type
export type InvalidCredential = Record<string, unknown>;

// ---------------------------------------------------------------------------
// BaseCredentialFixture — metadata shared by all fixture formats
// ---------------------------------------------------------------------------

export interface BaseCredentialFixture {
    /** Unique fixture ID, e.g. 'obv3/minimal-badge' */
    id: string;

    /** Human-readable name */
    name: string;

    /** What this fixture tests or demonstrates */
    description: string;

    /** Which spec it conforms to */
    spec: CredentialSpec;

    /** What kind of credential this represents */
    profile: CredentialProfile;

    /** Which optional VC features this fixture exercises */
    features: CredentialFeature[];

    /** Where this credential came from */
    source: FixtureSource;

    /** Whether this is a signed (VC with proof) or unsigned credential */
    signed: boolean;

    /** Whether this fixture is intentionally valid, invalid, or tampered */
    validity: FixtureValidity;

    /** Additional free-form tags for ad-hoc filtering */
    tags?: string[];
}

// ---------------------------------------------------------------------------
// CredentialFixture — a W3C Verifiable Credential fixture
// ---------------------------------------------------------------------------

export interface CredentialFixture<T extends UnsignedVC | VC = UnsignedVC>
    extends BaseCredentialFixture {
    /** Omitted for backwards compatibility; W3C VC is the default fixture kind */
    kind?: 'w3c-vc';

    /** SD-JWT VC uses a separate template fixture variant */
    spec: Exclude<CredentialSpec, 'sd-jwt-vc'>;

    /** The actual credential JSON */
    credential: T;

    /** Zod validator this credential should pass (if valid) or fail (if invalid) */
    validator?: z.ZodType;
}

export interface SdJwtVcTemplate {
    format: 'dc+sd-jwt';
    vct: string;
    claims: Record<string, unknown>;
    selectivelyDisclosable: string[];
}

export interface SdJwtVcFixture extends BaseCredentialFixture {
    kind: 'sd-jwt-vc';
    id: `sd-jwt-vc/${string}`;
    spec: 'sd-jwt-vc';
    signed: false;
    template: SdJwtVcTemplate;
}

export type LibraryFixture = CredentialFixture | SdJwtVcFixture;

export const isSdJwtVcFixture = (fixture: LibraryFixture): fixture is SdJwtVcFixture =>
    fixture.kind === 'sd-jwt-vc';

export const isCredentialFixture = (fixture: LibraryFixture): fixture is CredentialFixture =>
    !isSdJwtVcFixture(fixture);

// ---------------------------------------------------------------------------
// Filter — used to query the registry
// ---------------------------------------------------------------------------

export interface FixtureFilter {
    /** Match any of the given fixture kinds (omitted W3C kind is treated as w3c-vc) */
    kind?: FixtureKind | FixtureKind[];

    /** Match any of the given specs */
    spec?: CredentialSpec | CredentialSpec[];

    /** Match any of the given profiles */
    profile?: CredentialProfile | CredentialProfile[];

    /** Must have ALL of these features */
    features?: CredentialFeature[];

    /** Must have ANY of these features */
    featuresAny?: CredentialFeature[];

    /** Filter by signed status */
    signed?: boolean;

    /** Filter by validity */
    validity?: FixtureValidity | FixtureValidity[];

    /** Match any of the given sources */
    source?: FixtureSource | FixtureSource[];

    /** Must have ALL of these tags */
    tags?: string[];
}

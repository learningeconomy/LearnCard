import type { z } from 'zod';
import type { UnsignedVC, VC } from '@learncard/types';
export declare const CREDENTIAL_SPECS: readonly ["vc-v1", "vc-v2", "obv3", "clr-v2", "europass", "custom"];
export type CredentialSpec = (typeof CREDENTIAL_SPECS)[number];
export declare const CREDENTIAL_PROFILES: readonly ["badge", "diploma", "certificate", "id", "membership", "license", "micro-credential", "course", "degree", "boost", "boost-id", "delegate", "endorsement", "learner-record", "generic"];
export type CredentialProfile = (typeof CREDENTIAL_PROFILES)[number];
export declare const CREDENTIAL_FEATURES: readonly ["evidence", "alignment", "endorsement", "expiration", "status", "multiple-subjects", "multiple-proofs", "refresh-service", "terms-of-use", "credential-schema", "image", "results", "source", "skills", "display", "attachments", "associations", "nested-credentials"];
export type CredentialFeature = (typeof CREDENTIAL_FEATURES)[number];
export declare const FIXTURE_SOURCES: readonly ["spec-example", "plugfest", "real-world", "synthetic"];
export type FixtureSource = (typeof FIXTURE_SOURCES)[number];
export declare const FIXTURE_VALIDITIES: readonly ["valid", "invalid", "tampered"];
export type FixtureValidity = (typeof FIXTURE_VALIDITIES)[number];
export type InvalidCredential = Record<string, unknown>;
export interface CredentialFixture<T extends UnsignedVC | VC = UnsignedVC> {
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
    /** The actual credential JSON */
    credential: T;
    /** Zod validator this credential should pass (if valid) or fail (if invalid) */
    validator?: z.ZodType;
    /** Additional free-form tags for ad-hoc filtering */
    tags?: string[];
}
export interface FixtureFilter {
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
//# sourceMappingURL=types.d.ts.map
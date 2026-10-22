import { z } from 'zod/v4';

import { CapabilityEnum, ConsentTierEnum, type Capability, type ConsentTier } from './education-os';

const IdentifierValidator = z.string().min(1).max(256);
const BoundedNamesValidator = z.array(IdentifierValidator).max(100);
const ExplicitScopesValidator = z
    .array(
        IdentifierValidator.refine(value => !value.includes('*'), {
            message: 'Consent scopes cannot contain wildcards.',
        })
    )
    .min(1)
    .max(100);

/** Explicit selectors only: no wildcard or executable query expressions. */
export const EducationOsConsentSelectorsValidator = z
    .object({
        ecosystemIds: BoundedNamesValidator.min(1).optional(),
        groupIds: BoundedNamesValidator.min(1).optional(),
        profileIds: BoundedNamesValidator.min(1).optional(),
    })
    .strict()
    .refine(
        selectors =>
            Object.values(selectors).some(values => values !== undefined) &&
            Object.values(selectors).every(
                values => values === undefined || values.every(value => !/[*$]/.test(value))
            ),
        { message: 'Consent selectors must contain resolved identifiers without wildcards.' }
    );

export const EducationOsConsentGrantEntryValidator = z
    .object({
        capability: CapabilityEnum.exclude(['registry-adapter']),
        operation: z.enum(['read', 'write', 'issue', 'claim']),
        scopes: ExplicitScopesValidator,
        selectors: EducationOsConsentSelectorsValidator.optional(),
        fields: BoundedNamesValidator.min(1).optional(),
        tiers: z.array(ConsentTierEnum).min(1).max(5),
        purpose: z.string().min(1).max(2000),
        permissionRequirements: BoundedNamesValidator.optional(),
    })
    .strict();
export type EducationOsConsentGrantEntry = z.infer<typeof EducationOsConsentGrantEntryValidator>;

/** Governance mapping; accepting this document is NOT consent for any learner. */
export const EducationOsConsentGrantValidator = z
    .object({
        apiVersion: z.literal('lc.consent-grant/v1'),
        grants: z.array(EducationOsConsentGrantEntryValidator).min(1).max(100),
    })
    .strict();
export type EducationOsConsentGrant = z.infer<typeof EducationOsConsentGrantValidator>;

export const BindingConsentPreflightReasonCodeEnum = z.enum([
    'NO_GOVERNANCE_CONTRACT',
    'CONTRACT_NOT_LIVE',
    'ACCEPTANCE_MISSING',
    'ACCEPTOR_NOT_AUTHORIZED',
    'GRANT_DOES_NOT_COVER_CAPABILITY',
    'SCOPE_NOT_COVERED',
    'TIER_UNSUPPORTED',
    'COLLECTION_PATH_UNIMPLEMENTED',
    'CROSS_ECOSYSTEM',
    'INSTITUTION_PROFILE_MISSING',
    'REQUIREMENTS_UNRESOLVED',
    'SELECTOR_NOT_COVERED',
    'FIELD_NOT_COVERED',
    'PERMISSION_REQUIREMENT_UNSATISFIED',
]);
export type BindingConsentPreflightReasonCode = z.infer<
    typeof BindingConsentPreflightReasonCodeEnum
>;

export const BindingConsentCollectionPathKindEnum = z.enum([
    'none',
    'consentflow-terms',
    'wallet-claim-choice',
]);

/** Implemented collectors, independent of what an agreement declares (ADR-011 D4/D8).
 * Existing ConsentFlow personal/credential Terms collect education permissions.
 * Worker actor-policy and EducationOS wallet-choice wiring are not implemented.
 */
export const BINDING_CONSENT_COLLECTION_PATHS = {
    none: { implemented: true, supportedTiers: [] },
    'consentflow-terms': {
        implemented: true,
        supportedTiers: ['directory', 'roster', 'credential-metadata', 'credential-body'],
    },
    'wallet-claim-choice': { implemented: false, supportedTiers: [] },
} as const satisfies Record<
    z.infer<typeof BindingConsentCollectionPathKindEnum>,
    {
        implemented: boolean;
        supportedTiers: readonly ConsentTier[];
    }
>;

/**
 * ADR-011 D4/D5/D8, as amended by ARCHITECTURE §9 (2026-10-20).
 * This table describes readiness requirements, not subject authorization.
 * ADR-012 §3.3: provisioning is not issuance and ETL has no consent exemption.
 * ADR-013 §3.2/3.3: employment requires its own tier; academic tiers are
 * resolved from the approved plan, never guessed from the capability name.
 */
export interface BindingConsentRequirement {
    agreement: 'institutional-data-sharing' | 'issuance-authority' | 'wallet-policy' | 'none';
    authorizedRoles: readonly ('OWNER' | 'ADMIN')[];
    operation: EducationOsConsentGrantEntry['operation'] | null;
    collectionPath: z.infer<typeof BindingConsentCollectionPathKindEnum>;
    requiresInstitutionProfile: boolean;
    requiresRecordClass: boolean;
    minimumTiers: readonly ConsentTier[];
    resolvePlanTiers: boolean;
}

export const BINDING_CONSENT_REQUIREMENTS = {
    'roster-source': {
        agreement: 'institutional-data-sharing',
        authorizedRoles: ['OWNER', 'ADMIN'],
        operation: 'read',
        collectionPath: 'consentflow-terms',
        requiresInstitutionProfile: false,
        requiresRecordClass: false,
        minimumTiers: ['roster'],
        resolvePlanTiers: true,
    },
    'record-provisioning': {
        agreement: 'institutional-data-sharing',
        authorizedRoles: ['OWNER', 'ADMIN'],
        operation: 'read',
        collectionPath: 'consentflow-terms',
        requiresInstitutionProfile: false,
        requiresRecordClass: true,
        minimumTiers: [],
        resolvePlanTiers: true,
    },
    'insight-source': {
        agreement: 'institutional-data-sharing',
        authorizedRoles: ['OWNER', 'ADMIN'],
        operation: 'read',
        collectionPath: 'consentflow-terms',
        requiresInstitutionProfile: false,
        requiresRecordClass: true,
        minimumTiers: [],
        resolvePlanTiers: true,
    },
    'credential-issuer': {
        agreement: 'issuance-authority',
        authorizedRoles: ['OWNER', 'ADMIN'],
        operation: 'issue',
        collectionPath: 'consentflow-terms',
        requiresInstitutionProfile: true,
        requiresRecordClass: false,
        minimumTiers: [],
        resolvePlanTiers: true,
    },
    'wallet-claim': {
        agreement: 'wallet-policy',
        authorizedRoles: ['OWNER', 'ADMIN'],
        operation: 'claim',
        collectionPath: 'wallet-claim-choice',
        requiresInstitutionProfile: false,
        requiresRecordClass: false,
        minimumTiers: [],
        resolvePlanTiers: true,
    },
    // ADR-013 D4: reference data is governed by licensing, not subject consent.
    'registry-adapter': {
        agreement: 'none',
        authorizedRoles: [],
        operation: null,
        collectionPath: 'none',
        requiresInstitutionProfile: false,
        requiresRecordClass: false,
        minimumTiers: [],
        resolvePlanTiers: false,
    },
} as const satisfies Record<Capability, BindingConsentRequirement>;

/** Immutable readiness evidence wire shape; contains no subject-consent boolean. */
export const BindingConsentPreflightValidator = z
    .object({
        preflightId: IdentifierValidator,
        bindingId: IdentifierValidator,
        bindingRevision: z.number().int().nonnegative(),
        ecosystemId: IdentifierValidator,
        capability: CapabilityEnum,
        evaluatedAt: z.string().datetime(),
        requirements: z
            .object({
                scopes: BoundedNamesValidator,
                tiers: z.array(ConsentTierEnum).max(5),
                plans: z
                    .array(
                        z
                            .object({
                                intentId: IdentifierValidator,
                                planHash: IdentifierValidator,
                                planRevision: z.number().int().nonnegative(),
                            })
                            .strict()
                    )
                    .max(2),
            })
            .strict(),
        evidence: z
            .object({
                governanceContractId: IdentifierValidator.optional(),
                contractRevision: IdentifierValidator.optional(),
                termsId: IdentifierValidator.optional(),
                acceptedBy: z
                    .object({
                        profileId: IdentifierValidator,
                        role: z.enum(['OWNER', 'ADMIN', 'MEMBER']),
                    })
                    .strict()
                    .optional(),
                acceptedAt: z.string().datetime().optional(),
                grant: EducationOsConsentGrantEntryValidator.optional(),
                acceptedGrantHash: z
                    .string()
                    .regex(/^[a-f0-9]{64}$/)
                    .optional(),
            })
            .strict(),
        supportedTiers: z.array(ConsentTierEnum).max(5),
        collectionPath: z
            .object({
                kind: BindingConsentCollectionPathKindEnum,
                implemented: z.boolean(),
            })
            .strict(),
        satisfied: z.boolean(),
        missing: z.array(
            z
                .object({
                    code: BindingConsentPreflightReasonCodeEnum,
                    message: z.string().min(1),
                    howToSatisfy: z.string().min(1),
                })
                .strict()
        ),
        hash: z.string().regex(/^[a-f0-9]{64}$/),
    })
    .strict();
export type BindingConsentPreflight = z.infer<typeof BindingConsentPreflightValidator>;

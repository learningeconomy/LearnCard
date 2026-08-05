import type {} from 'zod-openapi';
import { z } from 'zod/v4';

import { AppStoreListingKindEnum } from './lcn';

export const CAPABILITY_TABLE_VERSION = 'v1' as const;

export const CapabilityEnum = z.enum([
    'roster-source',
    'credential-issuer',
    'wallet-claim',
    'registry-adapter',
    'insight-source',
]);
export type Capability = z.infer<typeof CapabilityEnum>;

export const InstallTargetTypeEnum = z.enum([
    'INTEGRATION_INSTALL',
    'APP_AVAILABILITY',
    'WALLET_ENABLEMENT',
    'WORKLOAD_DEPLOYMENT',
    'REGISTRY_SUBSCRIPTION',
]);
export type InstallTargetType = z.infer<typeof InstallTargetTypeEnum>;

export const BindingEndpointResourceTypeEnum = z.union([
    InstallTargetTypeEnum,
    z.literal('ECOSYSTEM'),
]);
export type BindingEndpointResourceType = z.infer<typeof BindingEndpointResourceTypeEnum>;

export const ConsentTierEnum = z.enum([
    'directory',
    'roster',
    'credential-metadata',
    'credential-body',
    'employment-record',
]);
export type ConsentTier = z.infer<typeof ConsentTierEnum>;

export const InstallIntentApprovalStateEnum = z.enum(['PENDING_ADOPTION', 'APPROVED', 'REJECTED']);
export type InstallIntentApprovalState = z.infer<typeof InstallIntentApprovalStateEnum>;

export const InstallIntentStatusPhaseEnum = z.enum([
    'PLANNED',
    'APPLYING',
    'READY',
    'DEGRADED',
    'FAILED',
    'SUSPENDED',
    'REMOVING',
    'REMOVED',
]);
export type InstallIntentStatusPhase = z.infer<typeof InstallIntentStatusPhaseEnum>;

export const InstallIntentStatusCauseEnum = z.enum([
    'POLICY',
    'OPERATOR',
    'HEALTH',
    'AUTH',
    'DEPENDENCY',
    'PREFLIGHT',
]);
export type InstallIntentStatusCause = z.infer<typeof InstallIntentStatusCauseEnum>;

export const EducationOsBindingStatusEnum = z.enum([
    'PROPOSED',
    'APPROVED',
    'ACTIVE',
    'REVOKED',
    'SUSPENDED',
]);
export type EducationOsBindingStatus = z.infer<typeof EducationOsBindingStatusEnum>;

export const WalletProtocolEnum = z.enum(['chapi', 'oid4vci', 'vc-api', 'deep-link']);
export type WalletProtocol = z.infer<typeof WalletProtocolEnum>;

export const WalletPlatformEnum = z.enum(['ios', 'android', 'web']);
export type WalletPlatform = z.infer<typeof WalletPlatformEnum>;

export const IsolationTierEnum = z.enum(['SHARED_LOGICAL', 'DEDICATED_DB', 'DEDICATED_STACK']);
export type IsolationTier = z.infer<typeof IsolationTierEnum>;

export const InstallIntentSourceValidator = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('CATALOG_LISTING'),
        listingId: z.string(),
        versionId: z.string(),
        listingKind: AppStoreListingKindEnum,
    }),
    z.object({
        type: z.literal('BUNDLE_EXPANSION'),
        bundleListingId: z.string(),
        bundleVersionId: z.string(),
        declarationId: z.string(),
        listingId: z.string(),
        versionId: z.string(),
        listingKind: z.enum([
            'APP',
            'INTEGRATION',
            'WALLET',
            'WORKLOAD',
            'BUNDLE',
            'REGISTRY_SUBSCRIPTION',
        ]),
    }),
]);
export type InstallIntentSource = z.infer<typeof InstallIntentSourceValidator>;

export const BindingEndpointValidator = z.object({
    resourceType: BindingEndpointResourceTypeEnum,
    resourceId: z.string(),
    ecosystemId: z.string(),
});
export type BindingEndpoint = z.infer<typeof BindingEndpointValidator>;

export const BindingRevisionsValidator = z.object({
    bindingRevision: z.number().int().nonnegative(),
    policyRevision: z.string().optional(),
});
export type BindingRevisions = z.infer<typeof BindingRevisionsValidator>;

export const BindingValidator = z.object({
    apiVersion: z.literal('lc.binding/v1'),
    bindingId: z.string(),
    ecosystemId: z.string(),
    capability: CapabilityEnum,
    provider: BindingEndpointValidator,
    consumer: BindingEndpointValidator,
    status: EducationOsBindingStatusEnum,
    approvedBy: z.string().optional(),
    approvedAt: z.string().datetime().optional(),
    revisions: BindingRevisionsValidator,
});
export type Binding = z.infer<typeof BindingValidator>;

export const BindingProposalValidator = z.object({
    capability: CapabilityEnum,
    provider: BindingEndpointValidator,
    consumer: BindingEndpointValidator,
    reason: z.string().max(280).optional(),
});
export type BindingProposal = z.infer<typeof BindingProposalValidator>;

export const ApprovalAuthorityChangesValidator = z.object({
    summary: z.string(),
    addedScopes: z.array(z.string()).default([]),
    removedScopes: z.array(z.string()).default([]),
    affectedCapabilities: z.array(CapabilityEnum).default([]),
});
export type ApprovalAuthorityChanges = z.infer<typeof ApprovalAuthorityChangesValidator>;

export const DispositionPolicyValidator = z.object({
    mode: z.enum(['RETAIN', 'DELETE', 'ANONYMIZE', 'REVOKE_ONLY']),
    notes: z.string().optional(),
});
export type DispositionPolicy = z.infer<typeof DispositionPolicyValidator>;

export const ApprovalArtifactValidator = z.object({
    apiVersion: z.literal('lc.approval-artifact/v1'),
    planHash: z.string(),
    planRevision: z.number().int().nonnegative(),
    approvedBy: z.string(),
    approvedAt: z.string().datetime(),
    authorityChanges: ApprovalAuthorityChangesValidator,
    consentTiers: z.array(ConsentTierEnum),
    proposedBindings: z.array(BindingProposalValidator),
    infrastructureEffects: z.array(z.string()),
    dispositionPolicy: DispositionPolicyValidator,
});
export type ApprovalArtifact = z.infer<typeof ApprovalArtifactValidator>;

export const InstallTargetSpecValidator = z.object({
    targetType: InstallTargetTypeEnum,
    listingId: z.string(),
    versionId: z.string(),
    scopes: z.array(z.string()).default([]),
    consentTiers: z.array(ConsentTierEnum).default([]),
    config: z.record(z.string(), z.unknown()).default({}),
    entitlementRequirements: z.array(z.string()).default([]),
});
export type InstallTargetSpec = z.infer<typeof InstallTargetSpecValidator>;

export const InstallIntentProposalValidator = z.object({
    apiVersion: z.literal('lc.install-intent-proposal/v1'),
    source: InstallIntentSourceValidator,
    requestedConfig: z.record(z.string(), z.unknown()).default({}),
    proposedBindings: z.array(BindingProposalValidator).default([]),
});
export type InstallIntentProposal = z.infer<typeof InstallIntentProposalValidator>;

export const InstallIntentPlanValidator = z.object({
    apiVersion: z.literal('lc.install-plan/v1'),
    renderedAt: z.string().datetime(),
    planHash: z.string(),
    planRevision: z.number().int().nonnegative(),
    scopesRequested: z.array(z.string()).default([]),
    consentTiers: z.array(ConsentTierEnum).default([]),
    infrastructureEffects: z.array(z.string()).default([]),
    authorityChanges: ApprovalAuthorityChangesValidator,
    dispositionPolicy: DispositionPolicyValidator,
});
export type InstallIntentPlan = z.infer<typeof InstallIntentPlanValidator>;

export const InstallIntentApprovalValidator = z.discriminatedUnion('state', [
    z.object({
        apiVersion: z.literal('lc.install-approval/v1'),
        state: z.literal('PENDING_ADOPTION'),
        requiredByEnablementId: z.string().optional(),
    }),
    z.object({
        apiVersion: z.literal('lc.install-approval/v1'),
        state: z.literal('APPROVED'),
        artifact: ApprovalArtifactValidator,
    }),
    z.object({
        apiVersion: z.literal('lc.install-approval/v1'),
        state: z.literal('REJECTED'),
        rejectedBy: z.string(),
        rejectedAt: z.string().datetime(),
        reason: z.string(),
    }),
]);
export type InstallIntentApproval = z.infer<typeof InstallIntentApprovalValidator>;

export const InstallIntentSpecValidator = z.object({
    apiVersion: z.literal('lc.install-spec/v1'),
    targets: z.array(InstallTargetSpecValidator),
    bindings: z.array(BindingProposalValidator).default([]),
    pinnedVersionIds: z.array(z.string()).default([]),
    scopes: z.array(z.string()).default([]),
    consentTiers: z.array(ConsentTierEnum).default([]),
    config: z.record(z.string(), z.unknown()).default({}),
    entitlementRequirements: z.array(z.string()).default([]),
});
export type InstallIntentSpec = z.infer<typeof InstallIntentSpecValidator>;

export const InstallIntentStatusValidator = z.object({
    apiVersion: z.literal('lc.install-status/v1'),
    phase: InstallIntentStatusPhaseEnum,
    cause: InstallIntentStatusCauseEnum.optional(),
    message: z.string().optional(),
    observedAt: z.string().datetime(),
    statusRevision: z.number().int().nonnegative(),
    retryCount: z.number().int().nonnegative().default(0),
    nextAttemptAt: z.string().datetime().optional(),
});
export type InstallIntentStatus = z.infer<typeof InstallIntentStatusValidator>;

export const InstallIntentValidator = z.object({
    apiVersion: z.literal('lc.install-intent/v1'),
    intentId: z.string(),
    ecosystemId: z.string(),
    proposal: InstallIntentProposalValidator,
    approval: InstallIntentApprovalValidator,
    plan: InstallIntentPlanValidator,
    spec: InstallIntentSpecValidator.optional(),
    status: InstallIntentStatusValidator.optional(),
});
export type InstallIntent = z.infer<typeof InstallIntentValidator>;

export const BundleManifestMemberValidator = z.object({
    declarationId: z.string(),
    targetType: InstallTargetTypeEnum,
    listingId: z.string(),
    versionId: z.string(),
    optional: z.boolean().default(false),
});
export type BundleManifestMember = z.infer<typeof BundleManifestMemberValidator>;

export const BundleManifestDefaultBindingValidator = z.object({
    capability: CapabilityEnum,
    providerDeclarationId: z.string(),
    consumerDeclarationId: z.string(),
    reason: z.string().max(280),
});
export type BundleManifestDefaultBinding = z.infer<typeof BundleManifestDefaultBindingValidator>;

export const BundleManifestPreflightRequirementValidator = z.object({
    entitlementKey: z.string().optional(),
    isolationTier: IsolationTierEnum.optional(),
});
export type BundleManifestPreflightRequirement = z.infer<
    typeof BundleManifestPreflightRequirementValidator
>;

export const BundleManifestValidator = z.object({
    apiVersion: z.literal('lc.bundle/v1'),
    id: z.string(),
    version: z.string(),
    contains: z.array(BundleManifestMemberValidator),
    defaultBindings: z.array(BundleManifestDefaultBindingValidator).default([]),
    preflight: z.array(BundleManifestPreflightRequirementValidator).default([]),
});
export type BundleManifest = z.infer<typeof BundleManifestValidator>;

export const WalletManifestValidator = z.object({
    apiVersion: z.literal('lc.wallet/v1'),
    id: z.string(),
    version: z.string(),
    listingKind: z.literal('WALLET'),
    walletName: z.string(),
    claimProtocols: z.array(WalletProtocolEnum).default([]),
    platforms: z.array(WalletPlatformEnum).default([]),
    endpoints: z
        .object({
            claimUrl: z.string().url().optional(),
            inviteUrl: z.string().url().optional(),
            healthUrl: z.string().url().optional(),
        })
        .default({}),
    provides: z.array(z.literal('wallet-claim')).default([]),
    supportsApps: z.boolean().default(false),
});
export type WalletManifest = z.infer<typeof WalletManifestValidator>;

export const ConsentDecisionActorValidator = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('SUBJECT'),
        profileId: z.string(),
    }),
    z.object({
        type: z.literal('GUARDIAN'),
        profileId: z.string(),
        authorityReference: z.string(),
        authorityRevision: z.string(),
    }),
    z.object({
        type: z.literal('INSTITUTIONAL_AUTHORITY'),
        profileId: z.string(),
        authorityReference: z.string(),
        authorityRevision: z.string(),
    }),
]);
export type ConsentDecisionActor = z.infer<typeof ConsentDecisionActorValidator>;

export const ConsentDecisionRecordValidator = z.object({
    id: z.string(),
    occurredAt: z.string().datetime(),
    ecosystemId: z.string(),
    subjectProfileId: z.string(),
    consentActor: ConsentDecisionActorValidator,
    consentFlowContractId: z.string(),
    consentTermsId: z.string(),
    consentRevision: z.string(),
    consentTiers: z.array(ConsentTierEnum),
    requestedScopes: z.array(z.string()),
    approvedScopes: z.array(z.string()),
    bindingId: z.string().optional(),
    resourceId: z.string(),
    releaseChannel: z.enum(['API', 'WEBHOOK', 'TRANSACTIONAL', 'ETL', 'PRESENTMENT']),
    decision: z.enum(['ALLOW', 'DENY']),
    reasonCodes: z.array(z.string()),
    consentActiveAtDecision: z.boolean(),
    policyRevision: z.string(),
});
export type ConsentDecisionRecord = z.infer<typeof ConsentDecisionRecordValidator>;

export const EntitlementPolicyValidator = z.object({
    apiVersion: z.literal('lc.entitlement-policy/v1'),
    key: z.string(),
    granted: z.boolean(),
    grantedBy: z.string(),
    scope: z.object({
        ecosystemId: z.string(),
        targetId: z.string().optional(),
        targetType: z.string().optional(),
    }),
});
export type EntitlementPolicy = z.infer<typeof EntitlementPolicyValidator>;

export const InstallTargetStatusEnum = InstallIntentStatusPhaseEnum;
export type InstallTargetStatus = z.infer<typeof InstallTargetStatusEnum>;

export const InstallTargetValidator = z.object({
    apiVersion: z.literal('lc.install-target/v1'),
    id: z.string(),
    intentId: z.string(),
    ecosystemId: z.string(),
    targetType: InstallTargetTypeEnum,
    status: InstallTargetStatusEnum,
    createdAt: z.string().datetime(),
});
export type InstallTarget = z.infer<typeof InstallTargetValidator>;

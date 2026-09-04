import type {} from 'zod-openapi';
import { z } from 'zod/v4';

import { AppStoreListingKindEnum } from './lcn';

export const CAPABILITY_TABLE_VERSION = 'v1.2' as const;

export const CapabilitySetVersionEnum = z.enum(['v1', 'v1.1', 'v1.2']);
export type CapabilitySetVersion = z.infer<typeof CapabilitySetVersionEnum>;

const CAPABILITY_SET_BY_VERSION = {
    v1: [
        'roster-source',
        'credential-issuer',
        'wallet-claim',
        'registry-adapter',
        'insight-source',
    ],
    'v1.1': [
        'roster-source',
        'credential-issuer',
        'wallet-claim',
        'registry-adapter',
        'insight-source',
        'record-provisioning',
    ],
    'v1.2': [
        'roster-source',
        'credential-issuer',
        'wallet-claim',
        'registry-adapter',
        'insight-source',
        'record-provisioning',
    ],
} as const;

export const getCapabilitiesForCapabilitySetVersion = (
    version: CapabilitySetVersion
): readonly string[] => CAPABILITY_SET_BY_VERSION[version];

export const getCapabilitySetVersionForManifestApiVersion = (
    apiVersion: string
): CapabilitySetVersion => {
    switch (apiVersion) {
        case 'lc.integration/v1':
        case 'lc.wallet/v1':
        case 'lc.bundle/v1':
            return 'v1';
        case 'lc.integration/v1.1':
            return 'v1.1';
        case 'lc.integration/v1.2':
        case 'lc.integration/v1.3':
            return 'v1.2';
        default:
            throw new Error(`Unsupported manifest apiVersion: ${apiVersion}`);
    }
};

export const isCapabilitySupportedByManifestApiVersion = (
    apiVersion: string,
    capability: string
): boolean =>
    getCapabilitiesForCapabilitySetVersion(
        getCapabilitySetVersionForManifestApiVersion(apiVersion)
    ).includes(capability);

const assertCapabilitiesWithinPinnedSet = (
    apiVersion: string,
    capabilities: string[],
    ctx: z.core.$RefinementCtx,
    path: Array<string | number>
): void => {
    const pinnedSetVersion = getCapabilitySetVersionForManifestApiVersion(apiVersion);
    const supported = new Set(getCapabilitiesForCapabilitySetVersion(pinnedSetVersion));

    for (const capability of capabilities) {
        if (!supported.has(capability)) {
            ctx.addIssue({
                code: 'custom',
                message: `Capability ${capability} is not available in pinned capability set ${pinnedSetVersion}.`,
                path: [...path, capability],
                input: capability,
            });
        }
    }
};

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export const ManifestSignatureValidator = z.object({
    alg: z.string().min(1),
    sig: z.string().min(1),
    verificationMethod: z.string().min(1),
});
export type ManifestSignature = z.infer<typeof ManifestSignatureValidator>;

export const CapabilityEnum = z.enum([
    'roster-source',
    'credential-issuer',
    'wallet-claim',
    'registry-adapter',
    'insight-source',
    'record-provisioning',
]);
export type Capability = z.infer<typeof CapabilityEnum>;

export const RecordClassEnum = z.enum(['academic', 'employment']);
export type RecordClass = z.infer<typeof RecordClassEnum>;

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

export const IntegrationScopeRequestValidator = z.object({
    resource: z
        .string()
        .min(1)
        .refine(resource => !resource.includes('*'), {
            message: 'Integration scopes may not use wildcard resources.',
        }),
    action: z
        .string()
        .min(1)
        .refine(action => !action.includes('*'), {
            message: 'Integration scopes may not use wildcard actions.',
        }),
    selectorKind: z.enum(['tree', 'id']),
    selectorValue: z.string().min(1),
    reason: z.string().max(280),
});
export type IntegrationScopeRequest = z.infer<typeof IntegrationScopeRequestValidator>;

export const IntegrationExtensionPointEnum = z.enum([
    'roster.import',
    'profile.sync',
    'group.sync',
    'completion.ingest',
    'issuance.request',
    'consent.observe',
    'registry.query',
    'dashboard.link',
]);
export type IntegrationExtensionPoint = z.infer<typeof IntegrationExtensionPointEnum>;

export const IntegrationExtensionPointDeclarationValidator = z.object({
    point: IntegrationExtensionPointEnum,
    annotations: z
        .object({
            readOnly: z.boolean().default(false),
            destructive: z.boolean().default(false),
            idempotent: z.boolean().default(true),
        })
        .default({ readOnly: false, destructive: false, idempotent: true }),
});
export type IntegrationExtensionPointDeclaration = z.infer<
    typeof IntegrationExtensionPointDeclarationValidator
>;

// ADR-015 D1/D3/D5/D6: a console surface is a manifest property on a signed Integration, not a
// resource. FIRST_PARTY surfaces are console-owned code activated by the signed manifest; the
// EMBEDDED_IFRAME renderer is entitlement-gated and reserved here for the D7-D9 bridge work.
// `slug` is a hint (the console allocates routes); `navIcon` is a console-owned token.
export const ConsoleSurfaceRendererEnum = z.enum(['FIRST_PARTY', 'EMBEDDED_IFRAME']);
export type ConsoleSurfaceRenderer = z.infer<typeof ConsoleSurfaceRendererEnum>;

export const ConsoleSurfaceSectionEnum = z.enum(['GOVERNANCE', 'OPERATIONS', 'DATA', 'INSIGHTS']);
export type ConsoleSurfaceSection = z.infer<typeof ConsoleSurfaceSectionEnum>;

export const ConsoleIconTokenEnum = z.enum([
    'search',
    'bar-chart',
    'graduation-cap',
    'hand-coins',
    'flask',
    'book',
    'globe',
    'shield',
]);
export type ConsoleIconToken = z.infer<typeof ConsoleIconTokenEnum>;

export const ConsoleSurfaceValidator = z.object({
    renderer: ConsoleSurfaceRendererEnum,
    surfaceId: z.string().regex(/^[a-z0-9]+(\.[a-z0-9-]+)+$/),
    slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    navLabel: z.string().min(1).max(32),
    navIcon: ConsoleIconTokenEnum,
    navSection: ConsoleSurfaceSectionEnum,
    minimumRole: z.enum(['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']),
    requiredCapabilities: z.array(CapabilityEnum).default([]),
    requiredScopes: z.array(z.string()).default([]),
    entryUrl: z.string().url().optional(),
});
export type ConsoleSurface = z.infer<typeof ConsoleSurfaceValidator>;

// ADR-015 D2: a registry-centric feature is declared on its registry-adapter Integration.
// Each entry is a REGISTRY_SUBSCRIPTION the adapter establishes when installed on its own,
// so the subscription always derives from a signed manifest rather than existing alone.
export const RegistrySubscriptionDeclarationValidator = z.object({
    declarationId: z.string().min(1),
    registryId: z.string().min(1),
    displayName: z.string().min(1),
    description: z.string().optional(),
    registryUrl: z.string().url().optional(),
});
export type RegistrySubscriptionDeclaration = z.infer<
    typeof RegistrySubscriptionDeclarationValidator
>;

export const IntegrationManifestValidator = z
    .object({
        apiVersion: z.enum([
            'lc.integration/v1',
            'lc.integration/v1.1',
            'lc.integration/v1.2',
            'lc.integration/v1.3',
        ]),
        id: z.string().min(1),
        version: z.string().regex(SEMVER_PATTERN, { message: 'Must be valid semver.' }),
        listingKind: z.literal('INTEGRATION'),
        publisherDid: z.string().startsWith('did:'),
        category: z.enum([
            'sis',
            'lms',
            'hris',
            'credential-source',
            'registry-adapter',
            'automation',
        ]),
        scopes: z.array(IntegrationScopeRequestValidator).default([]),
        consentRequirements: z.array(ConsentTierEnum).default([]),
        capabilities: z.object({
            provided: z.array(CapabilityEnum).default([]),
            consumed: z.array(CapabilityEnum).default([]),
        }),
        supportedRecordClasses: z.array(RecordClassEnum).default([]),
        extensionPoints: z.array(IntegrationExtensionPointDeclarationValidator).default([]),
        subscribes: z.array(RegistrySubscriptionDeclarationValidator).default([]),
        consoleSurfaces: z.array(ConsoleSurfaceValidator).default([]),
        endpoints: z
            .object({
                connectUrl: z.string().url().optional(),
                webhookUrl: z.string().url().optional(),
                healthUrl: z.string().url().optional(),
                syncUrl: z.string().url().optional(),
                dashboardUrl: z.string().url().optional(),
            })
            .default({}),
        signature: ManifestSignatureValidator,
    })
    .superRefine((manifest, ctx) => {
        assertCapabilitiesWithinPinnedSet(
            manifest.apiVersion,
            [...manifest.capabilities.provided, ...manifest.capabilities.consumed],
            ctx,
            ['capabilities']
        );

        if (manifest.consoleSurfaces.length > 0 && manifest.apiVersion !== 'lc.integration/v1.3') {
            ctx.addIssue({
                code: 'custom',
                message: 'consoleSurfaces is only available in lc.integration/v1.3.',
                path: ['consoleSurfaces'],
            });
        }

        if (
            manifest.subscribes.length > 0 &&
            !manifest.capabilities.provided.includes('registry-adapter')
        ) {
            ctx.addIssue({
                code: 'custom',
                message: 'subscribes requires the registry-adapter capability to be provided.',
                path: ['subscribes'],
            });
        }

        if (
            manifest.apiVersion !== 'lc.integration/v1.2' &&
            manifest.apiVersion !== 'lc.integration/v1.3' &&
            manifest.supportedRecordClasses.length > 0
        ) {
            ctx.addIssue({
                code: 'custom',
                message: 'supportedRecordClasses requires lc.integration/v1.2 or later.',
                path: ['supportedRecordClasses'],
                input: manifest.supportedRecordClasses,
            });
        }
    });
export type IntegrationManifest = z.infer<typeof IntegrationManifestValidator>;

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

export const BundleManifestValidator = z
    .object({
        apiVersion: z.literal('lc.bundle/v1'),
        id: z.string(),
        version: z.string(),
        contains: z.array(BundleManifestMemberValidator),
        defaultBindings: z.array(BundleManifestDefaultBindingValidator).default([]),
        preflight: z.array(BundleManifestPreflightRequirementValidator).default([]),
        publisherDid: z.string().startsWith('did:'),
        signature: ManifestSignatureValidator,
    })
    .superRefine((manifest, ctx) => {
        assertCapabilitiesWithinPinnedSet(
            manifest.apiVersion,
            manifest.defaultBindings.map(binding => binding.capability),
            ctx,
            ['defaultBindings']
        );
    });
export type BundleManifest = z.infer<typeof BundleManifestValidator>;

export const WalletManifestValidator = z
    .object({
        apiVersion: z.literal('lc.wallet/v1'),
        id: z.string(),
        version: z.string().regex(SEMVER_PATTERN, { message: 'Must be valid semver.' }),
        listingKind: z.literal('WALLET'),
        walletName: z.string(),
        publisherDid: z.string().startsWith('did:'),
        claimProtocols: z.array(WalletProtocolEnum).default([]),
        platforms: z.array(WalletPlatformEnum).default([]),
        endpoints: z
            .object({
                claimUrl: z.string().url().optional(),
                inviteUrl: z.string().url().optional(),
                healthUrl: z.string().url().optional(),
            })
            .default({}),
        provides: z.array(CapabilityEnum).default([]),
        supportsApps: z.boolean().default(false),
        signature: ManifestSignatureValidator,
    })
    .superRefine((manifest, ctx) => {
        assertCapabilitiesWithinPinnedSet(manifest.apiVersion, manifest.provides, ctx, [
            'provides',
        ]);
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

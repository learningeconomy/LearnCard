import { randomUUID } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    BindingProposalValidator,
    BindingValidator,
    BundleManifestValidator,
    ConsoleSurfaceValidator,
    InstallIntentSpecValidator,
    IntegrationManifestValidator,
} from '@learncard/types';

import { t, profileRoute } from '@routes';
import { getListedApps, readAppStoreListingById } from '@accesslayer/app-store-listing/read';
import {
    readListingVersionById,
    readListingVersionsForListing,
} from '@accesslayer/listing-version/read';
import {
    createInstallIntentProposal,
    updateInstallIntentProposal,
} from '@accesslayer/install-intent/intent-proposal';
import { approveInstallIntent } from '@accesslayer/install-intent/intent-approval';
import {
    listInstallIntentsByEcosystem,
    readInstallIntentById,
} from '@accesslayer/install-intent/intent-read';
import { getProfilesByProfileIds } from '@accesslayer/profile/read';
import { suspendInstallIntentForPolicy } from '@accesslayer/install-intent/intent-status';
import {
    createInstallIntentAuditEvent,
    getInstallIntentAuditEvents,
} from '@accesslayer/install-intent/audit';
import {
    activateBinding as activateBindingRecord,
    approveBinding as approveBindingRecord,
    createBinding,
    revokeBinding as revokeBindingRecord,
} from '@accesslayer/binding/write';
import { listBindingsByEcosystem, readBindingById } from '@accesslayer/binding/read';
import { getConsentDecisionRecordsForBinding } from '@accesslayer/consent-decision-record/store';
import {
    listInstallTargetsByEcosystemId,
    listRegistrySubscriptionsByEcosystemId,
    listWorkloadDeploymentsByEcosystemId,
} from '@accesslayer/install-target/internal';
import { BindingRecordValidator } from 'types/binding';
import {
    AppAvailabilityValidator,
    EnrichedRegistrySubscriptionValidator,
    EnrichedWorkloadDeploymentValidator,
    IntegrationInstallValidator,
    RegistrySubscriptionValidator,
    WalletEnablementValidator,
    WorkloadDeploymentValidator,
} from 'types/install-target';
import { InstallIntentAuditEventValidator } from 'types/install-intent-audit';
import { InstallIntentRecordValidator, type InstallIntentRecordType } from 'types/install-intent';
import { AppStoreListingValidator } from 'types/app-store-listing';
import {
    evaluateInstallIntentReconcilerAlertBreaches,
    getInstallIntentReconcilerAlertThresholds,
    getInstallIntentReconcilerMetricsSnapshot,
    getInstallIntentReconcilerOperatorControls,
    isInstallIntentReconcilerIntentStuck,
    reconcileInstallIntent,
} from '@reconciler';

type BindingProposal = z.infer<typeof BindingProposalValidator>;
type InstallIntentSpec = z.infer<typeof InstallIntentSpecValidator>;
import {
    assertBindingRefsExist,
    assertBindingCapabilityVersionsCompatible,
    assertBindingRefsInIntentSpec,
    assertEntitlementsSatisfied,
    assertSupportedConsentTiers,
    buildPlanFromMaterialization,
    evaluateConsentPreflight,
    expandBundle,
    getInstallTargetTypeForListing,
    materializeBundlePlan,
    requireEcosystemRole,
    requiresConsentPreflight,
} from '@helpers/install-intent.helpers';
import {
    assertListingAllowedByCatalogPolicy,
    filterListingsByCatalogPolicy,
} from '@helpers/catalog-policy.helpers';
import {
    assertSignedListingVersionOrThrow,
    listingKindRequiresSignedManifest,
} from '@helpers/manifest-signature.helpers';

const PlanInstallIntentInputValidator = z.object({
    intentId: z.string().optional(),
    ecosystemId: z.string(),
    listingId: z.string(),
    versionId: z.string(),
    requestedConfig: z.record(z.string(), z.unknown()).default({}),
    proposedBindings: z.array(BindingProposalValidator).default([]),
});

const ApprovalConsentPreflightInputValidator = z.object({
    subjectProfileId: z.string(),
    consentActor: z.object({
        type: z.enum(['SUBJECT', 'GUARDIAN', 'INSTITUTIONAL_AUTHORITY']),
        profileId: z.string(),
        authorityReference: z.string().optional(),
        authorityRevision: z.string().optional(),
    }),
    consentFlowContractId: z.string(),
    consentTermsId: z.string(),
    consentRevision: z.string(),
    requestedScopes: z.array(z.string()).default([]),
    ecosystemAuthorityScopes: z.array(z.string()).default([]),
    consentApprovedScopes: z.array(z.string()).default([]),
    requiredConsentTiers: z.array(z.string()).default([]),
    activeConsentTiers: z.array(z.string()).default([]),
    consentActive: z.boolean(),
    policyRevision: z.string(),
});

const ApproveInstallIntentInputValidator = z.object({
    intentId: z.string(),
    planHash: z.string(),
    planRevision: z.number().int().nonnegative(),
    consentTiers: z.array(z.string()).default([]),
});

const RejectInstallIntentInputValidator = z.object({
    intentId: z.string(),
    reason: z.string().min(1),
});
const ApplyInstallIntentInputValidator = z.object({
    intentId: z.string(),
    expectedStatusRevision: z.number().int().nonnegative(),
});
const RevokeInstallIntentInputValidator = z.object({
    intentId: z.string(),
    expectedStatusRevision: z.number().int().nonnegative(),
    phase: z.enum(['REMOVING', 'REMOVED']).default('REMOVED'),
});
const GetInstallIntentInputValidator = z.object({ intentId: z.string() });
const ListInstallIntentsInputValidator = z.object({ ecosystemId: z.string() });
const ListEcosystemInstallTargetsInputValidator = z.object({ ecosystemId: z.string() });
const ListInstallableListingsInputValidator = z.object({
    ecosystemId: z.string(),
    limit: z.number().int().positive().max(100).default(50),
});
const SuspendForPolicyInputValidator = z.object({
    intentId: z.string(),
    message: z.string().optional(),
});
const InstallIntentReconcilerHealthInputValidator = z.object({ ecosystemId: z.string() });

const InstallIntentHealthBucketValidator = z.object({
    count: z.number().int().nonnegative(),
    intentIds: z.array(z.string()),
});

const InstallIntentReconcilerAlertThresholdsValidator = z.object({
    maxStuckIntents: z.number().int().nonnegative(),
    maxDegradedIntents: z.number().int().nonnegative(),
    maxFailedIntents: z.number().int().nonnegative(),
});

const InstallIntentReconcilerAlertBreachValidator = z.object({
    alert: z.enum(['STUCK_INTENTS', 'DEGRADED_INTENTS', 'FAILED_INTENTS']),
    threshold: z.number().int().nonnegative(),
    observedValue: z.number().int().nonnegative(),
    severity: z.enum(['warning', 'critical']),
    firing: z.literal(true),
});

const InstallIntentReconcilerHealthOutputValidator = z.object({
    metrics: z.object({
        reconcileLatencyMs: z.number().nonnegative(),
        reconcileCount: z.number().int().nonnegative(),
        retries: z.number().int().nonnegative(),
        failures: z.number().int().nonnegative(),
        drift: z.number().int().nonnegative(),
        stuck: z.number().int().nonnegative(),
        averageReconcileLatencyMs: z.number().nonnegative(),
    }),
    unhealthyIntents: z.object({
        STUCK: InstallIntentHealthBucketValidator,
        DEGRADED: InstallIntentHealthBucketValidator,
        FAILED: InstallIntentHealthBucketValidator,
        SUSPENDED: InstallIntentHealthBucketValidator,
    }),
    operatorControls: z.object({
        globalKillSwitchEnabled: z.boolean(),
        ecosystemKillSwitchEnabled: z.boolean(),
        effectiveKillSwitchEnabled: z.boolean(),
        tenantConcurrencyLimit: z.number().int().positive(),
    }),
    alertState: z.object({
        thresholds: InstallIntentReconcilerAlertThresholdsValidator,
        breaches: z.array(InstallIntentReconcilerAlertBreachValidator),
        firing: z.boolean(),
    }),
});

const ProposeBindingInputValidator = z.object({
    ecosystemId: z.string(),
    capability: BindingValidator.shape.capability,
    provider: BindingValidator.shape.provider,
    consumer: BindingValidator.shape.consumer,
});
const ApproveBindingInputValidator = z.object({
    bindingId: z.string(),
    expectedRevision: z.number().int().nonnegative(),
    consentPreflight: ApprovalConsentPreflightInputValidator.optional(),
});
const RevokeBindingInputValidator = z.object({
    bindingId: z.string(),
    expectedRevision: z.number().int().nonnegative(),
});
const GetBindingInputValidator = z.object({ bindingId: z.string() });

// ADR-015 D2: a registry-adapter Integration's signed manifest is the trust root for
// the REGISTRY_SUBSCRIPTION(s) it establishes, so a singleton install of the adapter
// fans out into one subscription target per `subscribes` entry. Only read after the
// caller has run assertSignedListingVersionOrThrow on the version.
const registrySubscriptionTargetsFromSignedManifest = (
    listingId: string,
    versionId: string,
    manifestJson: string | null | undefined
): InstallIntentSpec['targets'] => {
    if (!manifestJson) return [];

    const parsed = IntegrationManifestValidator.safeParse(JSON.parse(manifestJson));
    if (!parsed.success || !parsed.data.capabilities.provided.includes('registry-adapter')) {
        return [];
    }

    return parsed.data.subscribes.map(subscription => ({
        targetType: 'REGISTRY_SUBSCRIPTION' as const,
        listingId,
        versionId,
        scopes: [],
        consentTiers: [],
        config: {
            declarationId: subscription.declarationId,
            registryId: subscription.registryId,
            displayName: subscription.displayName,
            ...(subscription.description ? { description: subscription.description } : {}),
            ...(subscription.registryUrl ? { registryUrl: subscription.registryUrl } : {}),
        },
        entitlementRequirements: [],
    }));
};

const buildSingletonSpec = (
    listingId: string,
    versionId: string,
    targetType: ReturnType<typeof getInstallTargetTypeForListing>,
    requestedConfig: Record<string, unknown>,
    proposedBindings: BindingProposal[],
    additionalTargets: InstallIntentSpec['targets'] = []
): InstallIntentSpec => ({
    apiVersion: 'lc.install-spec/v1',
    targets: [
        {
            targetType,
            listingId,
            versionId,
            scopes: [],
            consentTiers: [],
            config: { declarationId: 'root', ...requestedConfig },
            entitlementRequirements: [],
        },
        ...additionalTargets,
    ],
    bindings: proposedBindings,
    pinnedVersionIds: [versionId],
    scopes: [],
    consentTiers: [],
    config: requestedConfig,
    entitlementRequirements: [],
});

// Re-planning feeds the previous proposal's bindings back in as `proposedBindings`, so the
// bundle's own defaultBindings would otherwise be appended once per plan revision.
const dedupeBindingProposals = (bindings: BindingProposal[]): BindingProposal[] => {
    const seen = new Set<string>();

    return bindings.filter(binding => {
        const key = [
            binding.capability,
            binding.provider.resourceType,
            binding.provider.resourceId,
            binding.consumer.resourceType,
            binding.consumer.resourceId,
        ].join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const bindEcosystem = (ecosystemId: string, bindings: BindingProposal[]): BindingProposal[] => {
    return bindings.map(binding => ({
        ...binding,
        provider: { ...binding.provider, ecosystemId },
        consumer: { ...binding.consumer, ecosystemId },
    }));
};

const enrichInstallTargetsWithListingMetadata = async <T extends { listingId?: string }>(
    targets: T[]
): Promise<(T & { displayName?: string; tagline?: string })[]> => {
    const listingIds = [
        ...new Set(
            targets
                .map(target => target.listingId)
                .filter((listingId): listingId is string => Boolean(listingId))
        ),
    ];
    const listings = await Promise.all(listingIds.map(readAppStoreListingById));
    const listingById = new Map(
        listings
            .filter((listing): listing is NonNullable<(typeof listings)[number]> =>
                Boolean(listing)
            )
            .map(listing => [listing.listing_id, listing])
    );

    return targets.map(target => {
        const listing = target.listingId ? listingById.get(target.listingId) : undefined;

        return {
            ...target,
            displayName: listing?.display_name,
            tagline: listing?.tagline ?? undefined,
        };
    });
};

const buildSpecForIntent = async (input: {
    intentId: string;
    ecosystemId: string;
    listingId: string;
    versionId: string;
    requestedConfig: Record<string, unknown>;
    proposedBindings: BindingProposal[];
}): Promise<{
    spec: InstallIntentSpec;
    listingKind: 'APP' | 'INTEGRATION' | 'WALLET' | 'BUNDLE';
    infrastructureEffects: string[];
}> => {
    const listing = await readAppStoreListingById(input.listingId);
    const version = await readListingVersionById(input.versionId);

    if (!listing || !version) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing or version not found.' });
    }

    if (listing.app_listing_status !== 'LISTED' || version.status !== 'LISTED') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Listing and version must both be LISTED.',
        });
    }

    if (listingKindRequiresSignedManifest(listing.kind)) {
        await assertSignedListingVersionOrThrow(
            listing.kind,
            version,
            `Listing ${listing.listing_id} version ${version.version_id} has an invalid signature`
        );
    }

    if (listing.kind === 'BUNDLE') {
        const manifestResult = BundleManifestValidator.safeParse(
            version.manifest_json ? JSON.parse(version.manifest_json) : {}
        );

        if (!manifestResult.success) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid bundle manifest.' });
        }

        const expanded = expandBundle(manifestResult.data);
        const listingById: Record<string, NonNullable<typeof listing>> = {};
        const listingVersionsById: Record<string, NonNullable<typeof version>> = {};

        for (const member of expanded.members) {
            const memberListing = await readAppStoreListingById(member.listingId);
            const memberVersion = await readListingVersionById(member.versionId);

            if (!memberListing || memberListing.app_listing_status !== 'LISTED') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Bundle member ${member.declarationId} must resolve to a LISTED listing.`,
                });
            }

            if (!memberVersion || memberVersion.status !== 'LISTED') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: `Bundle member ${member.declarationId} must resolve to a LISTED version.`,
                });
            }

            if (listingKindRequiresSignedManifest(memberListing.kind)) {
                await assertSignedListingVersionOrThrow(
                    memberListing.kind,
                    memberVersion,
                    `Bundle member ${member.declarationId} has an invalid signature`
                );
            }

            listingById[member.listingId] = memberListing;
            listingVersionsById[member.versionId] = memberVersion;
        }

        const materialized = materializeBundlePlan({
            intentId: input.intentId,
            ecosystemId: input.ecosystemId,
            expandedBundle: expanded,
            listingById,
            listingVersionsById,
            requestedConfig: input.requestedConfig,
        });
        const adapterSubscriptionTargets = materialized.targets
            .filter(target => target.targetType === 'INTEGRATION_INSTALL')
            .flatMap(target =>
                registrySubscriptionTargetsFromSignedManifest(
                    target.listingId,
                    target.versionId,
                    listingVersionsById[target.versionId]?.manifest_json
                ).map(subscription => ({
                    ...subscription,
                    config: {
                        ...subscription.config,
                        declarationId: `${String(target.config.declarationId)}:${String(
                            subscription.config.declarationId
                        )}`,
                    },
                }))
            );
        materialized.targets.push(...adapterSubscriptionTargets);
        const scopes = Array.from(
            new Set(materialized.targets.flatMap(target => target.scopes))
        ).sort();
        const consentTiers = Array.from(
            new Set(materialized.targets.flatMap(target => target.consentTiers))
        ).sort();

        return {
            listingKind: listing.kind,
            spec: {
                apiVersion: 'lc.install-spec/v1',
                targets: materialized.targets,
                bindings: dedupeBindingProposals(
                    bindEcosystem(input.ecosystemId, [
                        ...materialized.bindings,
                        ...input.proposedBindings,
                    ])
                ),
                pinnedVersionIds: materialized.pinnedVersionIds,
                scopes,
                consentTiers,
                config: input.requestedConfig,
                entitlementRequirements: materialized.entitlementRequirements,
            },
            infrastructureEffects: materialized.infrastructureEffects,
        };
    }

    const subscriptionTargets =
        listing.kind === 'INTEGRATION'
            ? registrySubscriptionTargetsFromSignedManifest(
                  input.listingId,
                  input.versionId,
                  version.manifest_json
              )
            : [];

    return {
        listingKind: listing.kind,
        spec: buildSingletonSpec(
            input.listingId,
            input.versionId,
            getInstallTargetTypeForListing(listing),
            input.requestedConfig,
            bindEcosystem(input.ecosystemId, input.proposedBindings),
            subscriptionTargets
        ),
        infrastructureEffects: [
            `Materialize ${listing.kind} target for ${listing.listing_id}`,
            ...subscriptionTargets.map(
                target => `Subscribe to registry ${String(target.config.displayName)}`
            ),
        ],
    };
};

const createOrUpdateIntentPlan = async (
    input: z.infer<typeof PlanInstallIntentInputValidator>
): Promise<InstallIntentRecordType> => {
    const existing = input.intentId ? await readInstallIntentById(input.intentId) : null;
    if (existing && existing.ecosystemId !== input.ecosystemId) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Install intent ecosystem cannot change.',
        });
    }

    const intentId = input.intentId ?? `int_${randomUUID()}`;
    const materialized = await buildSpecForIntent({
        intentId,
        ecosystemId: input.ecosystemId,
        listingId: input.listingId,
        versionId: input.versionId,
        requestedConfig: input.requestedConfig,
        proposedBindings: input.proposedBindings,
    });
    const planRevision = (existing?.plan.planRevision ?? 0) + 1;
    const plan = buildPlanFromMaterialization({
        scopeSummary: `Install plan for ${input.listingId}`,
        planRevision,
        targets: materialized.spec.targets,
        bindings: materialized.spec.bindings,
        infrastructureEffects: materialized.infrastructureEffects,
    });

    const proposal = {
        apiVersion: 'lc.install-intent-proposal/v1' as const,
        source: {
            type: 'CATALOG_LISTING' as const,
            listingId: input.listingId,
            versionId: input.versionId,
            listingKind: materialized.listingKind,
        },
        requestedConfig: input.requestedConfig,
        proposedBindings: materialized.spec.bindings,
    };

    return existing
        ? updateInstallIntentProposal(intentId, { proposal, plan })
        : createInstallIntentProposal({ intentId, ecosystemId: input.ecosystemId, proposal, plan });
};

const buildApprovedSpec = async (intent: InstallIntentRecordType): Promise<InstallIntentSpec> => {
    const materialized = await buildSpecForIntent({
        intentId: intent.intentId,
        ecosystemId: intent.ecosystemId,
        listingId: intent.proposal.source.listingId,
        versionId: intent.proposal.source.versionId,
        requestedConfig: intent.proposal.requestedConfig,
        proposedBindings: intent.proposal.proposedBindings,
    });

    return materialized.spec;
};

export const installIntentsRouter = t.router({
    planInstallIntent: profileRoute
        .meta({ requiredScope: 'app-store:write' })
        .input(PlanInstallIntentInputValidator)
        .output(InstallIntentRecordValidator)
        .mutation(async ({ ctx, input }) => {
            await requireEcosystemRole(input.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
            ]);

            const record = await createOrUpdateIntentPlan(input);
            await createInstallIntentAuditEvent({
                action: record.plan.planRevision === 1 ? 'PLAN_CREATED' : 'PLAN_UPDATED',
                actorProfileId: ctx.user.profile.profileId,
                actorDid: ctx.user.did,
                ecosystemId: record.ecosystemId,
                intentId: record.intentId,
                authorityChangesSummary: record.plan.authorityChanges.summary,
                afterSummary: { status: record.approval.state },
            });

            return record;
        }),

    approveInstallIntent: profileRoute
        .meta({ requiredScope: 'app-store:write' })
        .input(ApproveInstallIntentInputValidator)
        .output(InstallIntentRecordValidator)
        .mutation(async ({ ctx, input }) => {
            const intent = await readInstallIntentById(input.intentId);
            if (!intent)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Install intent not found.' });

            await requireEcosystemRole(intent.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
            ]);

            if (
                intent.plan.planHash !== input.planHash ||
                intent.plan.planRevision !== input.planRevision
            ) {
                throw new TRPCError({ code: 'CONFLICT', message: 'Install plan hash is stale.' });
            }

            const consentTiers = assertSupportedConsentTiers(input.consentTiers);
            const spec = await buildApprovedSpec(intent);

            for (const target of spec.targets) {
                const targetListing = await readAppStoreListingById(target.listingId);
                if (!targetListing)
                    throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found.' });
                await assertListingAllowedByCatalogPolicy(intent.ecosystemId, targetListing);
            }

            const rootListing = await readAppStoreListingById(intent.proposal.source.listingId);
            if (!rootListing)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found.' });
            await assertListingAllowedByCatalogPolicy(intent.ecosystemId, rootListing);
            await assertEntitlementsSatisfied(intent.ecosystemId, spec.entitlementRequirements);
            await assertBindingRefsInIntentSpec(intent.intentId, intent.ecosystemId, spec);

            const approved = await approveInstallIntent({
                intentId: intent.intentId,
                artifact: {
                    apiVersion: 'lc.approval-artifact/v1',
                    planHash: input.planHash,
                    planRevision: input.planRevision,
                    approvedBy: ctx.user.profile.profileId,
                    approvedAt: new Date().toISOString(),
                    authorityChanges: intent.plan.authorityChanges,
                    consentTiers,
                    proposedBindings: spec.bindings,
                    infrastructureEffects: intent.plan.infrastructureEffects,
                    dispositionPolicy: intent.plan.dispositionPolicy,
                },
                spec,
            });

            await createInstallIntentAuditEvent({
                action: 'APPROVED',
                actorProfileId: ctx.user.profile.profileId,
                actorDid: ctx.user.did,
                ecosystemId: approved.ecosystemId,
                intentId: approved.intentId,
                authorityChangesSummary:
                    approved.approval.state === 'APPROVED'
                        ? approved.approval.artifact.authorityChanges.summary
                        : approved.plan.authorityChanges.summary,
                beforeSummary: { status: intent.status?.phase ?? null },
                afterSummary: { status: approved.status?.phase ?? null },
            });

            return approved;
        }),

    rejectInstallIntent: profileRoute
        .meta({ requiredScope: 'app-store:write' })
        .input(RejectInstallIntentInputValidator)
        .output(InstallIntentRecordValidator)
        .mutation(async ({ ctx, input }) => {
            const intent = await readInstallIntentById(input.intentId);
            if (!intent)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Install intent not found.' });

            await requireEcosystemRole(intent.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
            ]);

            const rejected = await updateInstallIntentProposal(intent.intentId, {
                approval: {
                    apiVersion: 'lc.install-approval/v1',
                    state: 'REJECTED',
                    rejectedBy: ctx.user.profile.profileId,
                    rejectedAt: new Date().toISOString(),
                    reason: input.reason,
                },
            });

            await createInstallIntentAuditEvent({
                action: 'REJECTED',
                actorProfileId: ctx.user.profile.profileId,
                actorDid: ctx.user.did,
                ecosystemId: rejected.ecosystemId,
                intentId: rejected.intentId,
                authorityChangesSummary: input.reason,
                afterSummary: { status: rejected.approval.state },
            });

            return rejected;
        }),

    applyInstallIntent: profileRoute
        .meta({ requiredScope: 'app-store:write' })
        .input(ApplyInstallIntentInputValidator)
        .output(InstallIntentRecordValidator)
        .mutation(async ({ ctx, input }) => {
            const intent = await readInstallIntentById(input.intentId);
            if (!intent?.spec || intent.approval.state !== 'APPROVED') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Install intent is not approved.',
                });
            }

            await requireEcosystemRole(intent.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
            ]);

            if (intent.statusRevision !== input.expectedStatusRevision) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Install intent status revision is stale.',
                });
            }

            const applying = await reconcileInstallIntent(intent.intentId, {
                operation: 'apply',
                actorProfileId: ctx.user.profile.profileId,
                actorDid: ctx.user.did,
                expectedStatusRevision: input.expectedStatusRevision,
            });

            await createInstallIntentAuditEvent({
                action: 'APPLIED',
                actorProfileId: ctx.user.profile.profileId,
                actorDid: ctx.user.did,
                ecosystemId: applying.ecosystemId,
                intentId: applying.intentId,
                authorityChangesSummary:
                    applying.approval.state === 'APPROVED'
                        ? applying.approval.artifact.authorityChanges.summary
                        : 'Intent applied.',
                beforeSummary: { status: intent.status?.phase ?? null },
                afterSummary: { status: applying.status?.phase ?? null },
            });

            return applying;
        }),

    revokeInstallIntent: profileRoute
        .meta({ requiredScope: 'app-store:write' })
        .input(RevokeInstallIntentInputValidator)
        .output(InstallIntentRecordValidator)
        .mutation(async ({ ctx, input }) => {
            const intent = await readInstallIntentById(input.intentId);
            if (!intent?.status)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Install intent not found.' });

            await requireEcosystemRole(intent.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
            ]);

            if (intent.statusRevision !== input.expectedStatusRevision) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: 'Install intent status revision is stale.',
                });
            }

            const removed = await reconcileInstallIntent(intent.intentId, {
                operation: 'remove',
                actorProfileId: ctx.user.profile.profileId,
                actorDid: ctx.user.did,
                expectedStatusRevision: input.expectedStatusRevision,
            });
            await createInstallIntentAuditEvent({
                action: 'REVOKED',
                actorProfileId: ctx.user.profile.profileId,
                actorDid: ctx.user.did,
                ecosystemId: removed.ecosystemId,
                intentId: removed.intentId,
                authorityChangesSummary:
                    intent.approval.state === 'APPROVED'
                        ? intent.approval.artifact.dispositionPolicy.mode
                        : 'Intent revoked.',
                beforeSummary: { status: intent.status?.phase ?? null },
                afterSummary: { status: removed.status?.phase ?? null },
            });

            return removed;
        }),

    getInstallIntent: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(GetInstallIntentInputValidator)
        .output(InstallIntentRecordValidator.optional())
        .query(async ({ ctx, input }) => {
            const intent = await readInstallIntentById(input.intentId);
            if (!intent) return undefined;

            await requireEcosystemRole(intent.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
                'MEMBER',
                'VIEWER',
            ]);

            return intent;
        }),

    listInstallIntents: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(ListInstallIntentsInputValidator)
        .output(z.array(InstallIntentRecordValidator))
        .query(async ({ ctx, input }) => {
            await requireEcosystemRole(input.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
                'MEMBER',
                'VIEWER',
            ]);

            return listInstallIntentsByEcosystem(input.ecosystemId);
        }),

    // ADR-009 install targets are only reachable through their parent intent; these two
    // routes give the console an ecosystem-scoped read without exposing a browse catalog.
    listWorkloadDeployments: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(ListEcosystemInstallTargetsInputValidator)
        .output(z.array(EnrichedWorkloadDeploymentValidator))
        .query(async ({ ctx, input }) => {
            await requireEcosystemRole(input.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
                'MEMBER',
                'VIEWER',
            ]);

            return enrichInstallTargetsWithListingMetadata(
                await listWorkloadDeploymentsByEcosystemId(input.ecosystemId)
            );
        }),

    listRegistrySubscriptions: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(ListEcosystemInstallTargetsInputValidator)
        .output(z.array(EnrichedRegistrySubscriptionValidator))
        .query(async ({ ctx, input }) => {
            await requireEcosystemRole(input.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
                'MEMBER',
                'VIEWER',
            ]);

            return enrichInstallTargetsWithListingMetadata(
                await listRegistrySubscriptionsByEcosystemId(input.ecosystemId)
            );
        }),

    listInstallTargets: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(ListEcosystemInstallTargetsInputValidator)
        .output(
            z.array(
                z
                    .union([
                        IntegrationInstallValidator,
                        AppAvailabilityValidator,
                        WalletEnablementValidator,
                        WorkloadDeploymentValidator,
                        RegistrySubscriptionValidator,
                    ])
                    .and(
                        z.object({
                            displayName: z.string().optional(),
                            tagline: z.string().optional(),
                        })
                    )
            )
        )
        .query(async ({ ctx, input }) => {
            await requireEcosystemRole(input.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
                'MEMBER',
                'VIEWER',
            ]);

            return enrichInstallTargetsWithListingMetadata(
                await listInstallTargetsByEcosystemId(input.ecosystemId)
            );
        }),

    listBindings: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(ListEcosystemInstallTargetsInputValidator)
        .output(z.array(BindingRecordValidator))
        .query(async ({ ctx, input }) => {
            await requireEcosystemRole(input.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
                'MEMBER',
                'VIEWER',
            ]);

            return listBindingsByEcosystem(input.ecosystemId);
        }),

    // ADR-011 §4: operators query decisions by actor, object, decision and time. Events are
    // returned newest-first with the actor and object resolved to names so the console never
    // has to show a bare profileId / intentId / bindingId.
    listEcosystemAuditEvents: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(
            ListEcosystemInstallTargetsInputValidator.extend({
                limit: z.number().int().positive().max(500).default(200),
            })
        )
        .output(
            z.array(
                InstallIntentAuditEventValidator.extend({
                    actorDisplayName: z.string().optional(),
                    object: z
                        .object({
                            kind: z.enum(['INSTALL', 'BINDING']),
                            title: z.string(),
                            subtitle: z.string().optional(),
                            listingId: z.string().optional(),
                            listingKind: z.string().optional(),
                            capability: z.string().optional(),
                            memberCount: z.number().int().optional(),
                        })
                        .optional(),
                })
            )
        )
        .query(async ({ ctx, input }) => {
            await requireEcosystemRole(input.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
                'MEMBER',
                'VIEWER',
            ]);

            const [events, intents, bindings, targets] = await Promise.all([
                getInstallIntentAuditEvents({ ecosystemId: input.ecosystemId }),
                listInstallIntentsByEcosystem(input.ecosystemId),
                listBindingsByEcosystem(input.ecosystemId),
                listInstallTargetsByEcosystemId(input.ecosystemId),
            ]);
            const recent = events.slice(-input.limit).reverse();

            const intentById = new Map(intents.map(intent => [intent.intentId, intent]));
            const bindingById = new Map(bindings.map(binding => [binding.bindingId, binding]));
            const targetById = new Map(targets.map(target => [target.id, target]));

            const listingIds = new Set<string>();
            intents.forEach(intent => listingIds.add(intent.proposal.source.listingId));
            targets.forEach(target => target.listingId && listingIds.add(target.listingId));
            const listings = await Promise.all([...listingIds].map(readAppStoreListingById));
            const listingById = new Map(
                listings
                    .filter((listing): listing is NonNullable<typeof listing> => Boolean(listing))
                    .map(listing => [listing.listing_id, listing])
            );

            const actorIds = [
                ...new Set(
                    recent
                        .map(event => event.actorProfileId)
                        .filter((id): id is string => Boolean(id))
                ),
            ];
            const actors = await getProfilesByProfileIds(actorIds);
            const actorNameById = new Map(
                actors.map(profile => [profile.profileId, profile.displayName || profile.profileId])
            );

            const endpointName = (endpoint: { resourceType: string; resourceId: string }) => {
                if (endpoint.resourceType === 'ECOSYSTEM') return 'This ecosystem';
                const target = targetById.get(endpoint.resourceId);
                const listing = target?.listingId ? listingById.get(target.listingId) : undefined;
                return listing?.display_name ?? endpoint.resourceId;
            };

            type AuditObject = {
                kind: 'INSTALL' | 'BINDING';
                title: string;
                subtitle?: string;
                listingId?: string;
                listingKind?: string;
                capability?: string;
                memberCount?: number;
            };

            return recent.map(event => {
                const binding = event.bindingId ? bindingById.get(event.bindingId) : undefined;
                const intent = event.intentId ? intentById.get(event.intentId) : undefined;

                let object: AuditObject | undefined;

                if (binding) {
                    object = {
                        kind: 'BINDING',
                        title: `${endpointName(binding.provider)} → ${endpointName(binding.consumer)}`,
                        capability: binding.capability,
                    };
                } else if (intent) {
                    const listing = listingById.get(intent.proposal.source.listingId);
                    const targetCount = intent.spec?.targets.length ?? 0;
                    object = {
                        kind: 'INSTALL',
                        title: listing?.display_name ?? intent.proposal.source.listingId,
                        subtitle: listing?.tagline ?? undefined,
                        listingId: intent.proposal.source.listingId,
                        listingKind: listing?.kind ?? undefined,
                        memberCount: targetCount > 1 ? targetCount : undefined,
                    };
                }

                return {
                    ...event,
                    actorDisplayName: event.actorProfileId
                        ? actorNameById.get(event.actorProfileId)
                        : undefined,
                    object,
                };
            });
        }),

    // ADR-015 D4: surface visibility is a derived projection, never persisted state. A surface
    // renders iff its Integration has a READY install target in the ecosystem, every
    // requiredCapability has an ACTIVE binding, and the caller's role >= minimumRole.
    // Only FIRST_PARTY surfaces project here; EMBEDDED_IFRAME needs the D7-D9 bridge.
    listConsoleSurfaces: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(ListEcosystemInstallTargetsInputValidator)
        .output(
            z.array(
                ConsoleSurfaceValidator.extend({
                    listingId: z.string(),
                    listingDisplayName: z.string(),
                    installTargetId: z.string(),
                })
            )
        )
        .query(async ({ ctx, input }) => {
            const callerRole = await requireEcosystemRole(
                input.ecosystemId,
                ctx.user.profile.profileId,
                ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER']
            );
            const roleRank = { VIEWER: 0, MEMBER: 1, ADMIN: 2, OWNER: 3 } as const;

            const [targets, bindings] = await Promise.all([
                listInstallTargetsByEcosystemId(input.ecosystemId),
                listBindingsByEcosystem(input.ecosystemId),
            ]);
            const activeCapabilities = new Set(
                bindings
                    .filter(binding => binding.status === 'ACTIVE' || binding.status === 'APPROVED')
                    .map(binding => binding.capability)
            );

            const readyIntegrationTargets = targets.filter(
                target =>
                    target.targetType === 'INTEGRATION_INSTALL' &&
                    target.status === 'READY' &&
                    target.listingId
            );

            const surfaces: Array<
                z.infer<typeof ConsoleSurfaceValidator> & {
                    listingId: string;
                    listingDisplayName: string;
                    installTargetId: string;
                }
            > = [];
            const seenSurfaceIds = new Set<string>();

            for (const target of readyIntegrationTargets) {
                const listing = await readAppStoreListingById(target.listingId!);
                if (!listing || listing.kind !== 'INTEGRATION') continue;

                const version = (await readListingVersionsForListing(listing.listing_id)).find(
                    candidate => candidate.status === 'LISTED'
                );
                if (!version) continue;

                let manifest;
                try {
                    manifest = IntegrationManifestValidator.parse(
                        await assertSignedListingVersionOrThrow(listing.kind, version)
                    );
                } catch {
                    continue;
                }

                for (const surface of manifest.consoleSurfaces) {
                    if (surface.renderer !== 'FIRST_PARTY') continue;
                    if (seenSurfaceIds.has(surface.surfaceId)) continue;
                    if (roleRank[callerRole] < roleRank[surface.minimumRole]) continue;
                    if (!surface.requiredCapabilities.every(cap => activeCapabilities.has(cap)))
                        continue;

                    seenSurfaceIds.add(surface.surfaceId);
                    surfaces.push({
                        ...surface,
                        listingId: listing.listing_id,
                        listingDisplayName: listing.display_name,
                        installTargetId: target.id,
                    });
                }
            }

            return surfaces;
        }),

    getInstallIntentReconcilerHealth: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(InstallIntentReconcilerHealthInputValidator)
        .output(InstallIntentReconcilerHealthOutputValidator)
        .query(async ({ ctx, input }) => {
            await requireEcosystemRole(input.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
            ]);

            const intents = await listInstallIntentsByEcosystem(input.ecosystemId);
            const now = new Date();
            const unhealthyIntents = {
                STUCK: [] as string[],
                DEGRADED: [] as string[],
                FAILED: [] as string[],
                SUSPENDED: [] as string[],
            };

            for (const intent of intents) {
                if (isInstallIntentReconcilerIntentStuck(intent, now)) {
                    unhealthyIntents.STUCK.push(intent.intentId);
                }

                if (intent.status?.phase === 'DEGRADED') {
                    unhealthyIntents.DEGRADED.push(intent.intentId);
                }

                if (intent.status?.phase === 'FAILED') {
                    unhealthyIntents.FAILED.push(intent.intentId);
                }

                if (intent.status?.phase === 'SUSPENDED') {
                    unhealthyIntents.SUSPENDED.push(intent.intentId);
                }
            }

            const snapshot = getInstallIntentReconcilerMetricsSnapshot();
            const thresholds = getInstallIntentReconcilerAlertThresholds();
            const breaches = evaluateInstallIntentReconcilerAlertBreaches(
                {
                    stuck: unhealthyIntents.STUCK.length,
                    degraded: unhealthyIntents.DEGRADED.length,
                    failed: unhealthyIntents.FAILED.length,
                },
                thresholds
            );
            const operatorControls = await getInstallIntentReconcilerOperatorControls(
                input.ecosystemId
            );

            return {
                metrics: {
                    ...snapshot,
                    averageReconcileLatencyMs:
                        snapshot.reconcileCount > 0
                            ? snapshot.reconcileLatencyMs / snapshot.reconcileCount
                            : 0,
                },
                unhealthyIntents: {
                    STUCK: {
                        count: unhealthyIntents.STUCK.length,
                        intentIds: unhealthyIntents.STUCK,
                    },
                    DEGRADED: {
                        count: unhealthyIntents.DEGRADED.length,
                        intentIds: unhealthyIntents.DEGRADED,
                    },
                    FAILED: {
                        count: unhealthyIntents.FAILED.length,
                        intentIds: unhealthyIntents.FAILED,
                    },
                    SUSPENDED: {
                        count: unhealthyIntents.SUSPENDED.length,
                        intentIds: unhealthyIntents.SUSPENDED,
                    },
                },
                operatorControls,
                alertState: {
                    thresholds,
                    breaches,
                    firing: breaches.length > 0,
                },
            };
        }),

    listInstallableCatalogListings: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(ListInstallableListingsInputValidator)
        .output(z.array(AppStoreListingValidator))
        .query(async ({ ctx, input }) => {
            await requireEcosystemRole(input.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
                'MEMBER',
                'VIEWER',
            ]);

            const listings = await getListedApps({
                limit: input.limit,
                includeAllStatuses: false,
                excludeDemoted: true,
            });

            return filterListingsByCatalogPolicy(input.ecosystemId, listings);
        }),

    suspendForPolicy: profileRoute
        .meta({ requiredScope: 'app-store:write' })
        .input(SuspendForPolicyInputValidator)
        .output(InstallIntentRecordValidator)
        .mutation(async ({ ctx, input }) => {
            const intent = await readInstallIntentById(input.intentId);
            if (!intent)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Install intent not found.' });

            await requireEcosystemRole(intent.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
            ]);

            const suspended = await suspendInstallIntentForPolicy(
                intent.intentId,
                intent.statusRevision,
                input.message
            );

            await createInstallIntentAuditEvent({
                action: 'POLICY_SUSPENDED',
                actorProfileId: ctx.user.profile.profileId,
                actorDid: ctx.user.did,
                ecosystemId: suspended.ecosystemId,
                intentId: suspended.intentId,
                authorityChangesSummary: input.message,
                beforeSummary: { status: intent.status?.phase ?? null },
                afterSummary: { status: suspended.status?.phase ?? null },
            });

            return suspended;
        }),

    proposeBinding: profileRoute
        .meta({ requiredScope: 'app-store:write' })
        .input(ProposeBindingInputValidator)
        .output(BindingRecordValidator)
        .mutation(async ({ ctx, input }) => {
            await requireEcosystemRole(input.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
            ]);

            if (input.consumer.ecosystemId !== input.ecosystemId) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Binding ownership belongs to the consuming ecosystem.',
                });
            }

            if (input.provider.ecosystemId !== input.ecosystemId) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Cross-ecosystem bindings are not supported in Phase B.',
                });
            }

            const proposal = BindingProposalValidator.parse(input);
            await assertBindingRefsExist([proposal]);
            await assertBindingCapabilityVersionsCompatible(proposal);

            const created = await createBinding({
                apiVersion: 'lc.binding/v1',
                ecosystemId: input.ecosystemId,
                capability: input.capability,
                provider: input.provider,
                consumer: input.consumer,
                status: 'PROPOSED',
            });

            await createInstallIntentAuditEvent({
                action: 'BINDING_PROPOSED',
                actorProfileId: ctx.user.profile.profileId,
                actorDid: ctx.user.did,
                ecosystemId: created.ecosystemId,
                bindingId: created.bindingId,
                afterSummary: { status: created.status, capability: created.capability },
            });

            return created;
        }),

    approveBinding: profileRoute
        .meta({ requiredScope: 'app-store:write' })
        .input(ApproveBindingInputValidator)
        .output(BindingRecordValidator)
        .mutation(async ({ ctx, input }) => {
            const binding = await readBindingById(input.bindingId);
            if (!binding) throw new TRPCError({ code: 'NOT_FOUND', message: 'Binding not found.' });

            await requireEcosystemRole(binding.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
            ]);

            if (requiresConsentPreflight(binding.capability)) {
                if (!input.consentPreflight) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'Subject-data bindings require consent preflight.',
                    });
                }

                const result = await evaluateConsentPreflight({
                    ecosystemId: binding.ecosystemId,
                    bindingId: binding.bindingId,
                    resourceId: binding.consumer.resourceId,
                    ...input.consentPreflight,
                });

                if (!result.allowed) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'Consent preflight rejected this binding approval.',
                    });
                }
            }

            await assertBindingCapabilityVersionsCompatible(binding);

            const approved = await approveBindingRecord(
                binding.bindingId,
                input.expectedRevision,
                ctx.user.profile.profileId
            );
            const activated = await activateBindingRecord(approved.bindingId, approved.revision);

            await createInstallIntentAuditEvent({
                action: 'BINDING_APPROVED',
                actorProfileId: ctx.user.profile.profileId,
                actorDid: ctx.user.did,
                ecosystemId: approved.ecosystemId,
                bindingId: approved.bindingId,
                beforeSummary: { status: binding.status, revision: binding.revision },
                afterSummary: { status: approved.status, revision: approved.revision },
            });

            await createInstallIntentAuditEvent({
                action: 'BINDING_ACTIVATED',
                actorProfileId: ctx.user.profile.profileId,
                actorDid: ctx.user.did,
                ecosystemId: activated.ecosystemId,
                bindingId: activated.bindingId,
                beforeSummary: { status: approved.status, revision: approved.revision },
                afterSummary: { status: activated.status, revision: activated.revision },
            });

            return activated;
        }),

    revokeBinding: profileRoute
        .meta({ requiredScope: 'app-store:write' })
        .input(RevokeBindingInputValidator)
        .output(BindingRecordValidator)
        .mutation(async ({ ctx, input }) => {
            const binding = await readBindingById(input.bindingId);
            if (!binding) throw new TRPCError({ code: 'NOT_FOUND', message: 'Binding not found.' });

            await requireEcosystemRole(binding.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
            ]);

            const revoked = await revokeBindingRecord(binding.bindingId, input.expectedRevision);

            await createInstallIntentAuditEvent({
                action: 'BINDING_REVOKED',
                actorProfileId: ctx.user.profile.profileId,
                actorDid: ctx.user.did,
                ecosystemId: revoked.ecosystemId,
                bindingId: revoked.bindingId,
                beforeSummary: { status: binding.status, revision: binding.revision },
                afterSummary: { status: revoked.status, revision: revoked.revision },
            });

            return revoked;
        }),

    getBinding: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(GetBindingInputValidator)
        .output(BindingRecordValidator.optional())
        .query(async ({ ctx, input }) => {
            const binding = await readBindingById(input.bindingId);
            if (!binding) return undefined;

            await requireEcosystemRole(binding.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
                'MEMBER',
                'VIEWER',
            ]);

            return binding;
        }),

    getInstallIntentAuditEvents: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(GetInstallIntentInputValidator)
        .output(z.array(z.any()))
        .query(async ({ ctx, input }) => {
            const intent = await readInstallIntentById(input.intentId);
            if (!intent)
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Install intent not found.' });

            await requireEcosystemRole(intent.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
                'MEMBER',
                'VIEWER',
            ]);

            return getInstallIntentAuditEvents({ intentId: input.intentId });
        }),

    getBindingConsentDecisionRecords: profileRoute
        .meta({ requiredScope: 'app-store:read' })
        .input(GetBindingInputValidator)
        .output(z.array(z.any()))
        .query(async ({ ctx, input }) => {
            const binding = await readBindingById(input.bindingId);
            if (!binding) throw new TRPCError({ code: 'NOT_FOUND', message: 'Binding not found.' });

            await requireEcosystemRole(binding.ecosystemId, ctx.user.profile.profileId, [
                'OWNER',
                'ADMIN',
                'MEMBER',
                'VIEWER',
            ]);

            return getConsentDecisionRecordsForBinding(input.bindingId);
        }),
});

export type InstallIntentsRouter = typeof installIntentsRouter;

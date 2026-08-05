import { createHash } from 'node:crypto';

import { TRPCError } from '@trpc/server';
import {
    BindingProposalValidator,
    CapabilityEnum,
    ConsentDecisionActorValidator,
    ConsentTierEnum,
} from '@learncard/types';
import type { AppStoreListingType } from 'types/app-store-listing';
import type { ListingVersionType } from 'types/listing-version';
import { neogma } from '@instance';
import { getEcosystemById } from '@accesslayer/ecosystem/read';
import { getEcosystemMembershipRole } from '@accesslayer/ecosystem/membership';
import { appendConsentDecisionRecord } from '@accesslayer/consent-decision-record/store';

type ConsentDecisionRecord = Awaited<ReturnType<typeof appendConsentDecisionRecord>>;

type InstallTargetType =
    | 'INTEGRATION_INSTALL'
    | 'APP_AVAILABILITY'
    | 'WALLET_ENABLEMENT'
    | 'WORKLOAD_DEPLOYMENT'
    | 'REGISTRY_SUBSCRIPTION';

type BindingEndpoint = {
    resourceType: InstallTargetType | 'ECOSYSTEM';
    resourceId: string;
    ecosystemId: string;
};

type BindingProposal = {
    capability: (typeof CapabilityEnum)['options'][number];
    provider: BindingEndpoint;
    consumer: BindingEndpoint;
    reason?: string;
};

type BundleManifest = {
    contains: Array<{
        declarationId: string;
        targetType: InstallTargetType;
        listingId: string;
        versionId: string;
        optional?: boolean;
    }>;
    defaultBindings: Array<{
        capability: (typeof CapabilityEnum)['options'][number];
        providerDeclarationId: string;
        consumerDeclarationId: string;
        reason: string;
    }>;
    preflight: Array<{ entitlementKey?: string; isolationTier?: string }>;
};

type ApprovalAuthorityChanges = {
    summary: string;
    addedScopes: string[];
    removedScopes: string[];
    affectedCapabilities: Array<(typeof CapabilityEnum)['options'][number]>;
};

type InstallIntentPlan = {
    apiVersion: 'lc.install-plan/v1';
    renderedAt: string;
    planHash: string;
    planRevision: number;
    scopesRequested: string[];
    consentTiers: SupportedConsentTier[];
    infrastructureEffects: string[];
    authorityChanges: ApprovalAuthorityChanges;
    dispositionPolicy: { mode: 'RETAIN' | 'DELETE' | 'ANONYMIZE' | 'REVOKE_ONLY'; notes?: string };
};

type InstallTargetSpec = {
    targetType: InstallTargetType;
    listingId: string;
    versionId: string;
    scopes: string[];
    consentTiers: SupportedConsentTier[];
    config: Record<string, unknown>;
    entitlementRequirements: string[];
};

type InstallIntentSpec = {
    apiVersion: 'lc.install-spec/v1';
    targets: InstallTargetSpec[];
    bindings: BindingProposal[];
    pinnedVersionIds: string[];
    scopes: string[];
    consentTiers: SupportedConsentTier[];
    config: Record<string, unknown>;
    entitlementRequirements: string[];
};

export type BundleExpansionMember = {
    declarationId: string;
    targetType: InstallTargetType;
    listingId: string;
    versionId: string;
    optional: boolean;
};

export type BundleExpansion = {
    members: BundleExpansionMember[];
    proposedBindings: Array<{
        capability: (typeof CapabilityEnum)['options'][number];
        providerDeclarationId: string;
        consumerDeclarationId: string;
        reason: string;
    }>;
    entitlementRequirements: string[];
    infrastructureEffects: string[];
};

export type SupportedConsentTier = (typeof ConsentTierEnum)['options'][number];

export type PlanBundleMaterialization = {
    targets: InstallTargetSpec[];
    bindings: BindingProposal[];
    pinnedVersionIds: string[];
    entitlementRequirements: string[];
    infrastructureEffects: string[];
};

const BUNDLE_ECOSYSTEM_PROVIDER_SENTINEL = '$ecosystem';

export type EvaluateConsentPreflightInput = {
    ecosystemId: string;
    bindingId?: string;
    resourceId: string;
    subjectProfileId: string;
    consentActor: {
        type: 'SUBJECT' | 'GUARDIAN' | 'INSTITUTIONAL_AUTHORITY';
        profileId: string;
        authorityReference?: string;
        authorityRevision?: string;
    };
    consentFlowContractId: string;
    consentTermsId: string;
    consentRevision: string;
    requestedScopes: string[];
    ecosystemAuthorityScopes: string[];
    consentApprovedScopes: string[];
    requiredConsentTiers: string[];
    activeConsentTiers: string[];
    consentActive: boolean;
    policyRevision: string;
    releaseChannel?: ConsentDecisionRecord['releaseChannel'];
};

export type ConsentPreflightResult = {
    allowed: boolean;
    approvedScopes: string[];
    matchedConsentTiers: SupportedConsentTier[];
    record: ConsentDecisionRecord;
};

const SUBJECT_DATA_CAPABILITIES = new Set<string>([
    'roster-source',
    'credential-issuer',
    'wallet-claim',
    'insight-source',
]);

const stableSortObject = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(stableSortObject);
    }

    if (value && typeof value === 'object') {
        return Object.keys(value)
            .sort()
            .reduce<Record<string, unknown>>((acc, key) => {
                acc[key] = stableSortObject((value as Record<string, unknown>)[key]);
                return acc;
            }, {});
    }

    return value;
};

export const computeStableHash = (value: unknown): string => {
    return createHash('sha256')
        .update(JSON.stringify(stableSortObject(value)))
        .digest('hex');
};

export const getIntentTargetId = (intentId: string, declarationId: string): string => {
    return `target_${intentId}_${declarationId}`;
};

export const getInstallTargetTypeForListing = (listing: AppStoreListingType): InstallTargetType => {
    switch (listing.kind) {
        case 'INTEGRATION':
            return 'INTEGRATION_INSTALL';
        case 'APP':
            return 'APP_AVAILABILITY';
        case 'WALLET':
            return 'WALLET_ENABLEMENT';
        case 'BUNDLE':
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message:
                    'Bundle listings expand into member resources and never become runtime targets.',
            });
    }
};

export const expandBundle = (manifest: BundleManifest): BundleExpansion => {
    const seenDeclarationIds = new Set<string>();
    const memberDeclarations = manifest.contains
        .map(member => ({
            declarationId: member.declarationId,
            targetType: member.targetType,
            listingId: member.listingId,
            versionId: member.versionId,
            optional: member.optional ?? false,
        }))
        .sort((left, right) => left.declarationId.localeCompare(right.declarationId));

    for (const member of memberDeclarations) {
        if (seenDeclarationIds.has(member.declarationId)) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Bundle member declaration ${member.declarationId} is duplicated.`,
            });
        }

        seenDeclarationIds.add(member.declarationId);
    }

    const proposedBindings = manifest.defaultBindings
        .map(binding => ({
            capability: binding.capability,
            providerDeclarationId: binding.providerDeclarationId,
            consumerDeclarationId: binding.consumerDeclarationId,
            reason: binding.reason,
        }))
        .sort((left, right) => {
            const capabilityComparison = left.capability.localeCompare(right.capability);
            if (capabilityComparison !== 0) return capabilityComparison;

            const providerComparison = left.providerDeclarationId.localeCompare(
                right.providerDeclarationId
            );
            if (providerComparison !== 0) return providerComparison;

            return left.consumerDeclarationId.localeCompare(right.consumerDeclarationId);
        });

    for (const binding of proposedBindings) {
        if (
            binding.providerDeclarationId !== BUNDLE_ECOSYSTEM_PROVIDER_SENTINEL &&
            !seenDeclarationIds.has(binding.providerDeclarationId)
        ) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Bundle binding provider ${binding.providerDeclarationId} is unknown.`,
            });
        }

        if (!seenDeclarationIds.has(binding.consumerDeclarationId)) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Bundle binding consumer ${binding.consumerDeclarationId} is unknown.`,
            });
        }
    }

    const entitlementRequirements = Array.from(
        new Set(
            manifest.preflight
                .map(requirement => requirement.entitlementKey)
                .filter((value): value is string => Boolean(value))
        )
    ).sort();
    const infrastructureEffects = manifest.preflight
        .map(requirement => {
            const effects: string[] = [];

            if (requirement.entitlementKey) {
                effects.push(`Requires entitlement ${requirement.entitlementKey}`);
            }

            if (requirement.isolationTier) {
                effects.push(`Requires isolation tier ${requirement.isolationTier}`);
            }

            return effects.join(' · ');
        })
        .filter(effect => effect.length > 0);

    return {
        members: memberDeclarations,
        proposedBindings,
        entitlementRequirements,
        infrastructureEffects,
    };
};

const uniqueSortedStrings = (values: string[]): string[] => Array.from(new Set(values)).sort();

const safeParseJsonRecord = (value?: string): Record<string, unknown> | undefined => {
    if (!value) return undefined;

    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : undefined;
    } catch {
        return undefined;
    }
};

const collectStringArrayValues = (
    value: unknown,
    keys: Set<string>,
    path: string[] = []
): string[] => {
    if (Array.isArray(value)) {
        if (path.length > 0 && keys.has(path[path.length - 1]!)) {
            return value.filter((entry): entry is string => typeof entry === 'string');
        }

        return value.flatMap(entry => collectStringArrayValues(entry, keys, path));
    }

    if (!value || typeof value !== 'object') {
        return [];
    }

    return Object.entries(value).flatMap(([key, nested]) =>
        collectStringArrayValues(nested, keys, [...path, key])
    );
};

const getListingVersionAuthoritySummary = (version: ListingVersionType) => {
    const sources = [
        safeParseJsonRecord(version.manifest_json),
        safeParseJsonRecord(version.review_snapshot_json),
    ].filter((source): source is Record<string, unknown> => Boolean(source));
    const scopes = uniqueSortedStrings(
        sources.flatMap(source =>
            collectStringArrayValues(
                source,
                new Set([
                    'scopes',
                    'scopesRequested',
                    'requestedScopes',
                    'requiredScopes',
                    'addedScopes',
                ])
            )
        )
    );
    const consentTierCandidates = uniqueSortedStrings(
        sources.flatMap(source =>
            collectStringArrayValues(source, new Set(['consentTiers', 'requiredConsentTiers']))
        )
    );

    return {
        scopes,
        consentTiers: assertSupportedConsentTiers(consentTierCandidates),
    };
};

export const buildPlanFromMaterialization = (input: {
    scopeSummary: string;
    planRevision: number;
    targets: InstallTargetSpec[];
    bindings: BindingProposal[];
    infrastructureEffects: string[];
    dispositionPolicy?: InstallIntentPlan['dispositionPolicy'];
}): InstallIntentPlan => {
    const scopesRequested = uniqueSortedStrings(input.targets.flatMap(target => target.scopes));
    const consentTiers = uniqueSortedStrings(
        input.targets.flatMap(target => target.consentTiers)
    ) as SupportedConsentTier[];
    const authorityChanges: ApprovalAuthorityChanges = {
        summary: input.scopeSummary,
        addedScopes: scopesRequested,
        removedScopes: [],
        affectedCapabilities: uniqueSortedStrings(
            input.bindings.map(binding => binding.capability)
        ) as Array<(typeof CapabilityEnum)['options'][number]>,
    };
    const planPayload = {
        targets: input.targets,
        bindings: input.bindings,
        scopesRequested,
        consentTiers,
        infrastructureEffects: uniqueSortedStrings(input.infrastructureEffects),
        authorityChanges,
        dispositionPolicy: input.dispositionPolicy ?? { mode: 'RETAIN' },
    };

    return {
        apiVersion: 'lc.install-plan/v1',
        renderedAt: new Date().toISOString(),
        planHash: computeStableHash(planPayload),
        planRevision: input.planRevision,
        scopesRequested,
        consentTiers,
        infrastructureEffects: uniqueSortedStrings(input.infrastructureEffects),
        authorityChanges,
        dispositionPolicy: input.dispositionPolicy ?? { mode: 'RETAIN' },
    };
};

export const materializeBundlePlan = (input: {
    intentId: string;
    ecosystemId: string;
    expandedBundle: BundleExpansion;
    listingVersionsById: Record<string, ListingVersionType>;
    listingById: Record<string, AppStoreListingType>;
    requestedConfig: Record<string, unknown>;
}): PlanBundleMaterialization => {
    const targets = input.expandedBundle.members.map(member => {
        const listing = input.listingById[member.listingId];
        const version = input.listingVersionsById[member.versionId];

        if (!listing || !version) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: `Bundle member ${member.declarationId} could not be resolved.`,
            });
        }

        const authoritySummary = getListingVersionAuthoritySummary(version);

        return {
            targetType: member.targetType,
            listingId: member.listingId,
            versionId: member.versionId,
            scopes: authoritySummary.scopes,
            consentTiers: authoritySummary.consentTiers,
            config: {
                declarationId: member.declarationId,
                optional: member.optional,
                listingKind: listing.kind,
                ...(input.requestedConfig[member.declarationId] &&
                typeof input.requestedConfig[member.declarationId] === 'object'
                    ? (input.requestedConfig[member.declarationId] as Record<string, unknown>)
                    : {}),
            },
            entitlementRequirements: input.expandedBundle.entitlementRequirements,
        } satisfies InstallTargetSpec;
    });
    const targetIdByDeclarationId = Object.fromEntries(
        input.expandedBundle.members.map(member => [
            member.declarationId,
            getIntentTargetId(input.intentId, member.declarationId),
        ])
    ) as Record<string, string>;
    const resolveBindingEndpoint = (
        declarationId: string,
        endpoint: 'provider' | 'consumer'
    ): BindingEndpoint => {
        if (declarationId === BUNDLE_ECOSYSTEM_PROVIDER_SENTINEL) {
            if (endpoint !== 'provider') {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: 'Only bundle binding providers may reference $ecosystem.',
                });
            }

            return {
                resourceType: 'ECOSYSTEM',
                resourceId: input.ecosystemId,
                ecosystemId: '',
            };
        }

        const member = input.expandedBundle.members.find(
            member => member.declarationId === declarationId
        );
        const resourceId = targetIdByDeclarationId[declarationId];
        if (!member || !resourceId) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Bundle binding ${endpoint} ${declarationId} is unknown.`,
            });
        }

        return {
            resourceType: member.targetType,
            resourceId,
            ecosystemId: '',
        };
    };
    const bindings = input.expandedBundle.proposedBindings.map(binding =>
        BindingProposalValidator.parse({
            capability: binding.capability,
            provider: resolveBindingEndpoint(binding.providerDeclarationId, 'provider'),
            consumer: resolveBindingEndpoint(binding.consumerDeclarationId, 'consumer'),
            reason: binding.reason,
        })
    );

    return {
        targets,
        bindings,
        pinnedVersionIds: uniqueSortedStrings(
            input.expandedBundle.members.map(member => member.versionId)
        ),
        entitlementRequirements: input.expandedBundle.entitlementRequirements,
        infrastructureEffects: input.expandedBundle.infrastructureEffects,
    };
};

export const requireEcosystemRole = async (
    ecosystemId: string,
    actorProfileId: string,
    allowedRoles: Array<'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'>
): Promise<'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'> => {
    const ecosystem = await getEcosystemById(ecosystemId);

    if (!ecosystem) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ecosystem not found' });
    }

    const role =
        ecosystem.ownerProfileId === actorProfileId
            ? 'OWNER'
            : (await getEcosystemMembershipRole(actorProfileId, ecosystemId)) ?? undefined;

    if (!role || !allowedRoles.includes(role)) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Caller lacks the required ecosystem authority.',
        });
    }

    return role;
};

export const assertSupportedConsentTiers = (tiers: string[]): SupportedConsentTier[] => {
    const supported = new Set<string>(ConsentTierEnum.options);

    for (const tier of tiers) {
        if (!supported.has(tier)) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Unsupported consent tier ${tier}.`,
            });
        }
    }

    return tiers.slice().sort() as SupportedConsentTier[];
};

export const requiresConsentPreflight = (capability: string): boolean => {
    return SUBJECT_DATA_CAPABILITIES.has(capability);
};

const endpointLabelMap: Record<BindingEndpoint['resourceType'], string> = {
    INTEGRATION_INSTALL: 'IntegrationInstall',
    APP_AVAILABILITY: 'AppAvailability',
    WALLET_ENABLEMENT: 'WalletEnablement',
    WORKLOAD_DEPLOYMENT: 'WorkloadDeployment',
    REGISTRY_SUBSCRIPTION: 'RegistrySubscription',
    ECOSYSTEM: 'Ecosystem',
};

export const bindingEndpointExists = async (endpoint: BindingEndpoint): Promise<boolean> => {
    const label = endpointLabelMap[endpoint.resourceType];
    const key = endpoint.resourceType === 'ECOSYSTEM' ? 'id' : 'id';
    const result = await neogma.queryRunner.run(
        `MATCH (resource:${label} { ${key}: $resourceId }) RETURN COUNT(resource) > 0 AS exists`,
        { resourceId: endpoint.resourceId }
    );

    return Boolean(result.records[0]?.get('exists'));
};

export const assertBindingRefsExist = async (bindings: BindingProposal[]): Promise<void> => {
    for (const binding of bindings) {
        const [providerExists, consumerExists] = await Promise.all([
            bindingEndpointExists(binding.provider),
            bindingEndpointExists(binding.consumer),
        ]);

        if (!providerExists || !consumerExists) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Binding contains an invalid resource reference.',
            });
        }
    }
};

export const assertBindingRefsInIntentSpec = async (
    intentId: string,
    ecosystemId: string,
    spec: InstallIntentSpec
): Promise<void> => {
    const expectedTargetIds = new Set(
        spec.targets.map(target => {
            const declarationId =
                typeof target.config.declarationId === 'string'
                    ? target.config.declarationId
                    : `${target.targetType}_${target.listingId}`;

            return getIntentTargetId(intentId, declarationId);
        })
    );

    for (const binding of spec.bindings) {
        if (
            binding.provider.ecosystemId !== ecosystemId ||
            binding.consumer.ecosystemId !== ecosystemId
        ) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Binding references must stay inside the owning ecosystem.',
            });
        }

        if (
            binding.provider.resourceType !== 'ECOSYSTEM' &&
            !expectedTargetIds.has(binding.provider.resourceId)
        ) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Binding provider does not reference a materialized intent target.',
            });
        }

        if (
            binding.consumer.resourceType !== 'ECOSYSTEM' &&
            !expectedTargetIds.has(binding.consumer.resourceId)
        ) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Binding consumer does not reference a materialized intent target.',
            });
        }
    }
};

export const getGrantedEntitlementKeys = async (ecosystemId: string): Promise<string[]> => {
    const ecosystem = await getEcosystemById(ecosystemId);

    if (!ecosystem) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ecosystem not found' });
    }

    const settings = ecosystem.settings as {
        entitlementPolicies?: Array<{ key?: string; granted?: boolean }>;
        entitlements?: Record<string, boolean>;
    };
    const policyKeys = (settings.entitlementPolicies ?? [])
        .filter(policy => policy.granted && typeof policy.key === 'string')
        .map(policy => policy.key as string);
    const recordKeys = Object.entries(settings.entitlements ?? {})
        .filter(([, granted]) => granted)
        .map(([key]) => key);

    return uniqueSortedStrings([...policyKeys, ...recordKeys]);
};

export const assertEntitlementsSatisfied = async (
    ecosystemId: string,
    entitlementRequirements: string[]
): Promise<void> => {
    const required = uniqueSortedStrings(entitlementRequirements);
    const granted = new Set(await getGrantedEntitlementKeys(ecosystemId));

    const missing = required.filter(entitlement => !granted.has(entitlement));

    if (missing.length > 0) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: `Missing required entitlement(s): ${missing.join(', ')}.`,
        });
    }
};

export const evaluateConsentPreflight = async (
    input: EvaluateConsentPreflightInput
): Promise<ConsentPreflightResult> => {
    const requestedScopes = uniqueSortedStrings(input.requestedScopes);
    const ecosystemAuthorityScopes = new Set(uniqueSortedStrings(input.ecosystemAuthorityScopes));
    const consentApprovedScopes = new Set(uniqueSortedStrings(input.consentApprovedScopes));
    const requiredConsentTiers = assertSupportedConsentTiers(input.requiredConsentTiers);
    const activeConsentTiers = new Set(assertSupportedConsentTiers(input.activeConsentTiers));
    const approvedScopes = requestedScopes.filter(
        scope => ecosystemAuthorityScopes.has(scope) && consentApprovedScopes.has(scope)
    );
    const missingTiers = requiredConsentTiers.filter(tier => !activeConsentTiers.has(tier));
    const reasonCodes: string[] = [];

    if (!input.consentActive) {
        reasonCodes.push('CONSENT_INACTIVE');
    }

    if (approvedScopes.length === 0) {
        reasonCodes.push('NO_EFFECTIVE_SCOPE_INTERSECTION');
    }

    if (missingTiers.length > 0) {
        reasonCodes.push(`MISSING_TIERS:${missingTiers.join(',')}`);
    }

    const actor = ConsentDecisionActorValidator.parse(input.consentActor);
    const record = await appendConsentDecisionRecord({
        ecosystemId: input.ecosystemId,
        subjectProfileId: input.subjectProfileId,
        consentActor: actor,
        consentFlowContractId: input.consentFlowContractId,
        consentTermsId: input.consentTermsId,
        consentRevision: input.consentRevision,
        consentTiers: requiredConsentTiers,
        requestedScopes,
        approvedScopes,
        bindingId: input.bindingId,
        resourceId: input.resourceId,
        releaseChannel: input.releaseChannel ?? 'API',
        decision: reasonCodes.length === 0 ? 'ALLOW' : 'DENY',
        reasonCodes,
        consentActiveAtDecision: input.consentActive,
        policyRevision: input.policyRevision,
    });

    return {
        allowed: reasonCodes.length === 0,
        approvedScopes,
        matchedConsentTiers: requiredConsentTiers,
        record,
    };
};

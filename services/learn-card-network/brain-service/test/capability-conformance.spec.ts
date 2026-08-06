import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { neogma } from '@instance';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { createProfile } from '@accesslayer/profile/create';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { grantEcosystemMembership } from '@accesslayer/ecosystem/membership';
import { createInstallTargetInternal } from '@accesslayer/install-target/internal';
import {
    AppAvailability,
    AppStoreListing,
    Binding,
    Ecosystem,
    Group,
    InstallIntent,
    IntegrationInstall,
    ListingVersion,
    Profile,
    RegistrySubscription,
    WalletEnablement,
    WorkloadDeployment,
} from '@models';
import {
    BindingValidator,
    CAPABILITY_TABLE_VERSION,
    CapabilityEnum,
    ConsentTierEnum,
} from '@learncard/types';
import {
    requiresConsentPreflight,
    assertSupportedConsentTiers,
    getIntentTargetId,
} from '../src/helpers/install-intent.helpers';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';

import { getClient } from './helpers/getClient';
import { createSignedListingVersionForKind } from './helpers/manifest.helpers';

const OWNER_DID = 'did:key:z6MkCapabilityOwner';
const ADMIN_DID = 'did:key:z6MkCapabilityAdmin';
const STRANGER_DID = 'did:key:z6MkCapabilityStranger';

const ownerClient = getClient({
    did: OWNER_DID,
    isChallengeValid: true,
    scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
});

const seedProfile = async (profileId: string, did: string): Promise<void> => {
    await createProfile({ profileId, did, displayName: profileId } as Parameters<
        typeof createProfile
    >[0]);
};

const createOperatorEcosystem = async (settings: Record<string, unknown> = {}) => {
    await seedProfile('owner', OWNER_DID);
    await seedProfile('admin', ADMIN_DID);
    await seedProfile('stranger', STRANGER_DID);

    const ecosystem = await createEcosystem({
        name: `EducationOS ${randomUUID()}`,
        slug: `eco-${randomUUID().slice(0, 8)}`,
        description: undefined,
        parentEcosystemId: null,
        ownerProfileId: 'owner',
        settings,
        status: 'ACTIVE',
    });

    await grantEcosystemMembership({
        profileId: 'admin',
        ecosystemId: ecosystem.id,
        role: 'ADMIN',
    });

    return ecosystem;
};

const createBindingEndpoints = async (
    ecosystemId: string
): Promise<{
    providerId: string;
    consumerId: string;
}> => {
    const providerId = `provider_${randomUUID()}`;
    const consumerId = `consumer_${randomUUID()}`;

    await createInstallTargetInternal({
        apiVersion: 'lc.install-target/v1',
        id: providerId,
        intentId: `intent_provider_${randomUUID()}`,
        ecosystemId,
        targetType: 'WALLET_ENABLEMENT',
        status: 'READY',
        createdAt: new Date().toISOString(),
    });
    await createInstallTargetInternal({
        apiVersion: 'lc.install-target/v1',
        id: consumerId,
        intentId: `intent_consumer_${randomUUID()}`,
        ecosystemId,
        targetType: 'APP_AVAILABILITY',
        status: 'READY',
        createdAt: new Date().toISOString(),
    });

    return { providerId, consumerId };
};

const EXPECTED_CAPABILITIES = [
    'roster-source',
    'credential-issuer',
    'wallet-claim',
    'registry-adapter',
    'insight-source',
    'record-provisioning',
] as const;

const EXPECTED_SUBJECT_DATA_CAPABILITIES = [
    'roster-source',
    'credential-issuer',
    'wallet-claim',
    'insight-source',
    'record-provisioning',
] as const;

const EXPECTED_NON_SUBJECT_DATA_CAPABILITIES = ['registry-adapter'] as const;

// Each parameterized case provisions a fresh ecosystem, profiles and install targets
// against Neo4j, which exceeds vitest's 5s default under load.
const CAPABILITY_CASE_TIMEOUT_MS = 30_000;

const capabilities = [...CapabilityEnum.options];
const subjectDataCapabilities = capabilities.filter(requiresConsentPreflight);
const nonSubjectDataCapabilities = capabilities.filter(
    capability => !requiresConsentPreflight(capability)
);
const supportedConsentTier = assertSupportedConsentTiers([ConsentTierEnum.options[0]])[0];

const proposeBindingForCapability = async (capability: (typeof CapabilityEnum.options)[number]) => {
    const ecosystem = await createOperatorEcosystem();
    const { providerId, consumerId } = await createBindingEndpoints(ecosystem.id);

    const proposed = await ownerClient.installIntent.proposeBinding({
        ecosystemId: ecosystem.id,
        capability,
        provider: {
            resourceType: 'WALLET_ENABLEMENT',
            resourceId: providerId,
            ecosystemId: ecosystem.id,
        },
        consumer: {
            resourceType: 'APP_AVAILABILITY',
            resourceId: consumerId,
            ecosystemId: ecosystem.id,
        },
    });

    expect(BindingValidator.parse(proposed)).toMatchObject({
        capability,
        ecosystemId: ecosystem.id,
        status: 'PROPOSED',
    });

    return { ecosystem, proposed };
};

const buildConsentPreflight = () => ({
    subjectProfileId: `subject_${randomUUID()}`,
    consentActor: { type: 'SUBJECT' as const, profileId: `subject_${randomUUID()}` },
    consentFlowContractId: `contract_${randomUUID()}`,
    consentTermsId: `terms_${randomUUID()}`,
    consentRevision: '1',
    requestedScopes: ['scope:read'],
    ecosystemAuthorityScopes: ['scope:read'],
    consentApprovedScopes: ['scope:read'],
    requiredConsentTiers: [supportedConsentTier],
    activeConsentTiers: [supportedConsentTier],
    consentActive: true,
    policyRevision: `policy_${randomUUID()}`,
});

const createAppliedIntegrationTarget = async (input: {
    ecosystemId: string;
    listingId: string;
    apiVersion: 'lc.integration/v1' | 'lc.integration/v1.1' | 'lc.integration/v1.2';
    providedCapabilities: Array<(typeof CapabilityEnum.options)[number]>;
}): Promise<{
    targetId: string;
    targetType: 'INTEGRATION_INSTALL';
}> => {
    const versionId = `version_${randomUUID()}`;

    await createAppStoreListing({
        listing_id: input.listingId,
        slug: input.listingId,
        kind: 'INTEGRATION',
        display_name: input.listingId,
        tagline: 'tagline',
        full_description: 'description',
        icon_url: 'https://example.com/icon.png',
        app_listing_status: 'LISTED',
        launch_type: 'SERVER_HEADLESS',
        launch_config_json: JSON.stringify({ url: 'https://example.com' }),
    });

    await createSignedListingVersionForKind({
        listingId: input.listingId,
        kind: 'INTEGRATION',
        versionId,
        version: '1.0.0',
        status: 'LISTED',
        manifestOverrides: {
            apiVersion: input.apiVersion,
            capabilities: {
                provided: input.providedCapabilities,
                consumed: [],
            },
            supportedRecordClasses: input.apiVersion === 'lc.integration/v1.2' ? ['academic'] : [],
        },
    });

    const planned = await ownerClient.installIntent.planInstallIntent({
        ecosystemId: input.ecosystemId,
        listingId: input.listingId,
        versionId,
        requestedConfig: {},
        proposedBindings: [],
    });
    const approved = await ownerClient.installIntent.approveInstallIntent({
        intentId: planned.intentId,
        planHash: planned.plan.planHash,
        planRevision: planned.plan.planRevision,
        consentTiers: [],
    });
    await ownerClient.installIntent.applyInstallIntent({
        intentId: planned.intentId,
        expectedStatusRevision: approved.statusRevision,
    });

    return {
        targetId: getIntentTargetId(planned.intentId, 'root'),
        targetType: 'INTEGRATION_INSTALL',
    };
};

describe('Capability conformance harness', () => {
    beforeEach(async () => {
        await neogma.queryRunner.run(
            'MATCH (record:ConsentDecisionRecord) DETACH DELETE record',
            {}
        );
        await neogma.queryRunner.run(
            'MATCH (event:InstallIntentAuditEvent) DETACH DELETE event',
            {}
        );
        await Binding.delete({ detach: true, where: {} });
        await InstallIntent.delete({ detach: true, where: {} });
        await RegistrySubscription.delete({ detach: true, where: {} });
        await WorkloadDeployment.delete({ detach: true, where: {} });
        await WalletEnablement.delete({ detach: true, where: {} });
        await AppAvailability.delete({ detach: true, where: {} });
        await IntegrationInstall.delete({ detach: true, where: {} });
        await Group.delete({ detach: true, where: {} });
        await Ecosystem.delete({ detach: true, where: {} });
        await AppStoreListing.delete({ detach: true, where: {} });
        await ListingVersion.delete({ detach: true, where: {} });
        await Profile.delete({ detach: true, where: {} });
    });

    it('locks the closed v1 capability table to the expected capability set', () => {
        expect(CAPABILITY_TABLE_VERSION).toBe('v1.2');
        expect(new Set(capabilities)).toEqual(new Set(EXPECTED_CAPABILITIES));
        expect(new Set(EXPECTED_CAPABILITIES)).toEqual(new Set(capabilities));
    });

    it.each(capabilities)(
        'proposes %s bindings that satisfy the Binding contract and reach PROPOSED',
        async capability => {
            const { proposed } = await proposeBindingForCapability(capability);

            expect(proposed.capability).toBe(capability);
            expect(proposed.status).toBe('PROPOSED');
        },
        CAPABILITY_CASE_TIMEOUT_MS
    );

    it('classifies every capability into complete subject-data and non-subject-data partitions', () => {
        const classifications = capabilities.map(capability => ({
            capability,
            requiresConsent: requiresConsentPreflight(capability),
        }));

        expect(classifications).toHaveLength(capabilities.length);
        expect(
            classifications.every(({ requiresConsent }) => typeof requiresConsent === 'boolean')
        ).toBe(true);
        expect(new Set(subjectDataCapabilities)).toEqual(
            new Set(EXPECTED_SUBJECT_DATA_CAPABILITIES)
        );
        expect(new Set(EXPECTED_SUBJECT_DATA_CAPABILITIES)).toEqual(
            new Set(subjectDataCapabilities)
        );
        expect(new Set(nonSubjectDataCapabilities)).toEqual(
            new Set(EXPECTED_NON_SUBJECT_DATA_CAPABILITIES)
        );
        expect(new Set(EXPECTED_NON_SUBJECT_DATA_CAPABILITIES)).toEqual(
            new Set(nonSubjectDataCapabilities)
        );
    });

    it.each(subjectDataCapabilities)(
        'rejects approval without consent preflight for subject-data capability %s',
        async capability => {
            const { proposed } = await proposeBindingForCapability(capability);

            await expect(
                ownerClient.installIntent.approveBinding({
                    bindingId: proposed.bindingId,
                    expectedRevision: proposed.revision,
                })
            ).rejects.toThrow(/Subject-data bindings require consent preflight/i);
        },
        CAPABILITY_CASE_TIMEOUT_MS
    );

    it.each(nonSubjectDataCapabilities)(
        'approves non-subject-data capability %s without consent preflight',
        async capability => {
            const { proposed } = await proposeBindingForCapability(capability);
            const approved = await ownerClient.installIntent.approveBinding({
                bindingId: proposed.bindingId,
                expectedRevision: proposed.revision,
            });

            expect(BindingValidator.parse(approved)).toMatchObject({
                capability,
                status: 'ACTIVE',
                approvedBy: 'owner',
            });
            expect(approved.revision).toBe(proposed.revision + 2);
        },
        CAPABILITY_CASE_TIMEOUT_MS
    );

    it.each(subjectDataCapabilities)(
        'approves subject-data capability %s with satisfying consent preflight',
        async capability => {
            const { proposed } = await proposeBindingForCapability(capability);
            const approved = await ownerClient.installIntent.approveBinding({
                bindingId: proposed.bindingId,
                expectedRevision: proposed.revision,
                consentPreflight: buildConsentPreflight(),
            });
            const decisionRecords =
                await ownerClient.installIntent.getBindingConsentDecisionRecords({
                    bindingId: proposed.bindingId,
                });

            expect(BindingValidator.parse(approved)).toMatchObject({
                capability,
                status: 'ACTIVE',
                approvedBy: 'owner',
            });
            expect(decisionRecords).toHaveLength(1);
            expect(decisionRecords[0]).toMatchObject({
                bindingId: proposed.bindingId,
                decision: 'ALLOW',
                consentTiers: [supportedConsentTier],
            });
        },
        CAPABILITY_CASE_TIMEOUT_MS
    );

    it(
        'rejects proposing bindings whose capability is outside the closed table',
        async () => {
            const ecosystem = await createOperatorEcosystem();
            const { providerId, consumerId } = await createBindingEndpoints(ecosystem.id);

            await expect(
                Reflect.apply(ownerClient.installIntent.proposeBinding, ownerClient.installIntent, [
                    JSON.parse(
                        JSON.stringify({
                            ecosystemId: ecosystem.id,
                            capability: 'capability-not-in-v1-table',
                            provider: {
                                resourceType: 'WALLET_ENABLEMENT',
                                resourceId: providerId,
                                ecosystemId: ecosystem.id,
                            },
                            consumer: {
                                resourceType: 'APP_AVAILABILITY',
                                resourceId: consumerId,
                                ecosystemId: ecosystem.id,
                            },
                        })
                    ),
                ])
            ).rejects.toThrow(/Invalid enum value|Invalid input|capability/i);
        },
        CAPABILITY_CASE_TIMEOUT_MS
    );

    it(
        'rejects bindings when one endpoint manifest pins a capability set that excludes the capability',
        async () => {
            const ecosystem = await createOperatorEcosystem();
            const provider = await createAppliedIntegrationTarget({
                ecosystemId: ecosystem.id,
                listingId: `provider_${randomUUID()}`,
                apiVersion: 'lc.integration/v1.2',
                providedCapabilities: ['record-provisioning'],
            });
            const consumer = await createAppliedIntegrationTarget({
                ecosystemId: ecosystem.id,
                listingId: `consumer_${randomUUID()}`,
                apiVersion: 'lc.integration/v1',
                providedCapabilities: ['roster-source'],
            });

            await expect(
                ownerClient.installIntent.proposeBinding({
                    ecosystemId: ecosystem.id,
                    capability: 'record-provisioning',
                    provider: {
                        resourceType: provider.targetType,
                        resourceId: provider.targetId,
                        ecosystemId: ecosystem.id,
                    },
                    consumer: {
                        resourceType: consumer.targetType,
                        resourceId: consumer.targetId,
                        ecosystemId: ecosystem.id,
                    },
                })
            ).rejects.toThrow(/does not include record-provisioning/i);
        },
        CAPABILITY_CASE_TIMEOUT_MS
    );
});

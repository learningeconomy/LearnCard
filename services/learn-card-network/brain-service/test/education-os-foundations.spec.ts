import { beforeEach, describe, expect, it } from 'vitest';

import { createEcosystem } from '@accesslayer/ecosystem/create';
import { approveBinding, createBinding, revokeBinding } from '@accesslayer/binding/write';
import { readBindingById } from '@accesslayer/binding/read';
import { approveInstallIntent } from '@accesslayer/install-intent/intent-approval';
import {
    createInstallIntentProposal,
    updateInstallIntentProposal,
} from '@accesslayer/install-intent/intent-proposal';
import { readInstallIntentById } from '@accesslayer/install-intent/intent-read';
import {
    suspendInstallIntentForPolicy,
    writeInstallIntentStatus,
} from '@accesslayer/install-intent/intent-status';
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
    RegistrySubscription,
    WalletEnablement,
    WorkloadDeployment,
} from '@models';

const createListing = async (listingId: string): Promise<void> => {
    await AppStoreListing.createOne({
        listing_id: listingId,
        kind: 'INTEGRATION',
        display_name: `Listing ${listingId}`,
        tagline: 'tagline',
        full_description: 'description',
        icon_url: 'https://example.com/icon.png',
        app_listing_status: 'LISTED',
        launch_type: 'SERVER_HEADLESS',
        launch_config_json: JSON.stringify({ url: 'https://example.com' }),
    });
};

const createVersion = async (versionId: string): Promise<void> => {
    await ListingVersion.createOne({
        version_id: versionId,
        version: '1.0.0',
        status: 'LISTED',
        manifest_json: JSON.stringify({ manifest: true }),
        created_at: new Date().toISOString(),
    });
};

const createIntentFixture = async () => {
    const ecosystem = await createEcosystem({
        name: 'EducationOS',
        slug: `ecosystem-${Math.random().toString(36).slice(2, 8)}`,
        description: undefined,
        parentEcosystemId: null,
        ownerProfileId: 'owner-1',
        settings: {},
        status: 'ACTIVE',
    });

    const listingId = `listing_${Math.random().toString(36).slice(2, 8)}`;
    const versionId = `version_${Math.random().toString(36).slice(2, 8)}`;

    await createListing(listingId);
    await createVersion(versionId);

    const intent = await createInstallIntentProposal({
        ecosystemId: ecosystem.id,
        proposal: {
            apiVersion: 'lc.install-intent-proposal/v1',
            source: {
                type: 'CATALOG_LISTING',
                listingId,
                versionId,
                listingKind: 'INTEGRATION',
            },
            requestedConfig: { district: 'ca' },
            proposedBindings: [],
        },
        plan: {
            apiVersion: 'lc.install-plan/v1',
            renderedAt: '2026-07-29T12:00:00.000Z',
            planHash: 'plan-hash-1',
            planRevision: 1,
            scopesRequested: ['roster:read'],
            consentTiers: ['roster'],
            infrastructureEffects: ['Create tenant secret'],
            authorityChanges: {
                summary: 'Adds roster scope',
                addedScopes: ['roster:read'],
                removedScopes: [],
                affectedCapabilities: ['roster-source'],
            },
            dispositionPolicy: { mode: 'RETAIN' },
        },
    });

    return { ecosystem, listingId, versionId, intent };
};

describe('EducationOS Phase B foundations', () => {
    beforeEach(async () => {
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
    });

    it('rejects proposal updates after approval and materializes spec/artifact once', async () => {
        const { intent, versionId } = await createIntentFixture();

        const approved = await approveInstallIntent({
            intentId: intent.intentId,
            artifact: {
                apiVersion: 'lc.approval-artifact/v1',
                planHash: 'plan-hash-1',
                planRevision: 1,
                approvedBy: 'profile_approver',
                approvedAt: '2026-07-29T12:01:00.000Z',
                authorityChanges: {
                    summary: 'Adds roster scope',
                    addedScopes: ['roster:read'],
                    removedScopes: [],
                    affectedCapabilities: ['roster-source'],
                },
                consentTiers: ['roster'],
                proposedBindings: [],
                infrastructureEffects: ['Create tenant secret'],
                dispositionPolicy: { mode: 'RETAIN' },
            },
            spec: {
                apiVersion: 'lc.install-spec/v1',
                targets: [
                    {
                        targetType: 'INTEGRATION_INSTALL',
                        listingId: intent.proposal.source.listingId,
                        versionId,
                        scopes: ['roster:read'],
                        consentTiers: ['roster'],
                        config: { district: 'ca' },
                        entitlementRequirements: ['issuance'],
                    },
                ],
                bindings: [],
                pinnedVersionIds: [versionId],
                scopes: ['roster:read'],
                consentTiers: ['roster'],
                config: { district: 'ca' },
                entitlementRequirements: ['issuance'],
            },
        });

        expect(approved.specRevision).toBe(1);
        expect(approved.status?.phase).toBe('PLANNED');
        expect(approved.approval.state).toBe('APPROVED');

        await expect(
            updateInstallIntentProposal(intent.intentId, {
                proposal: {
                    ...intent.proposal,
                    requestedConfig: { district: 'ny' },
                },
            })
        ).rejects.toThrow(/immutable after approval/i);

        await expect(
            approveInstallIntent({
                intentId: intent.intentId,
                artifact: approved.approval.artifact,
                spec: approved.spec!,
            })
        ).rejects.toThrow(/single-use/i);
    });

    it('enforces status writer separation with CAS and preserves spec', async () => {
        const { intent, versionId } = await createIntentFixture();
        await approveInstallIntent({
            intentId: intent.intentId,
            artifact: {
                apiVersion: 'lc.approval-artifact/v1',
                planHash: 'plan-hash-1',
                planRevision: 1,
                approvedBy: 'profile_approver',
                approvedAt: '2026-07-29T12:01:00.000Z',
                authorityChanges: {
                    summary: 'Adds roster scope',
                    addedScopes: ['roster:read'],
                    removedScopes: [],
                    affectedCapabilities: ['roster-source'],
                },
                consentTiers: ['roster'],
                proposedBindings: [],
                infrastructureEffects: ['Create tenant secret'],
                dispositionPolicy: { mode: 'RETAIN' },
            },
            spec: {
                apiVersion: 'lc.install-spec/v1',
                targets: [
                    {
                        targetType: 'INTEGRATION_INSTALL',
                        listingId: intent.proposal.source.listingId,
                        versionId,
                        scopes: ['roster:read'],
                        consentTiers: ['roster'],
                        config: { district: 'ca' },
                        entitlementRequirements: ['issuance'],
                    },
                ],
                bindings: [],
                pinnedVersionIds: [versionId],
                scopes: ['roster:read'],
                consentTiers: ['roster'],
                config: { district: 'ca' },
                entitlementRequirements: ['issuance'],
            },
        });

        const before = await readInstallIntentById(intent.intentId);
        expect(before?.statusRevision).toBe(1);

        await expect(
            writeInstallIntentStatus({
                intentId: intent.intentId,
                expectedStatusRevision: 0,
                phase: 'READY',
            })
        ).rejects.toThrow(/stale/i);

        const updated = await writeInstallIntentStatus({
            intentId: intent.intentId,
            expectedStatusRevision: 1,
            phase: 'READY',
            message: 'Healthy',
            observedAt: '2026-07-29T12:02:00.000Z',
        });

        expect(updated.status?.phase).toBe('READY');
        expect(updated.spec).toEqual(before?.spec);
        expect(updated.statusRevision).toBe(2);
    });

    it('suspends intents for policy from READY and APPLYING', async () => {
        for (const phase of ['READY', 'APPLYING'] as const) {
            const { intent, versionId } = await createIntentFixture();
            await approveInstallIntent({
                intentId: intent.intentId,
                artifact: {
                    apiVersion: 'lc.approval-artifact/v1',
                    planHash: 'plan-hash-1',
                    planRevision: 1,
                    approvedBy: 'profile_approver',
                    approvedAt: '2026-07-29T12:01:00.000Z',
                    authorityChanges: {
                        summary: 'Adds roster scope',
                        addedScopes: ['roster:read'],
                        removedScopes: [],
                        affectedCapabilities: ['roster-source'],
                    },
                    consentTiers: ['roster'],
                    proposedBindings: [],
                    infrastructureEffects: ['Create tenant secret'],
                    dispositionPolicy: { mode: 'RETAIN' },
                },
                spec: {
                    apiVersion: 'lc.install-spec/v1',
                    targets: [
                        {
                            targetType: 'INTEGRATION_INSTALL',
                            listingId: intent.proposal.source.listingId,
                            versionId,
                            scopes: ['roster:read'],
                            consentTiers: ['roster'],
                            config: { district: 'ca' },
                            entitlementRequirements: ['issuance'],
                        },
                    ],
                    bindings: [],
                    pinnedVersionIds: [versionId],
                    scopes: ['roster:read'],
                    consentTiers: ['roster'],
                    config: { district: 'ca' },
                    entitlementRequirements: ['issuance'],
                },
            });

            const transitioned = await writeInstallIntentStatus({
                intentId: intent.intentId,
                expectedStatusRevision: 1,
                phase,
                observedAt: '2026-07-29T12:02:00.000Z',
            });

            const suspended = await suspendInstallIntentForPolicy(
                intent.intentId,
                transitioned.statusRevision,
                'Catalog policy withdrawn'
            );

            expect(suspended.status?.phase).toBe('SUSPENDED');
            expect(suspended.status?.cause).toBe('POLICY');
        }
    });

    it('creates, approves, and revokes bindings with revision guards', async () => {
        const ecosystem = await createEcosystem({
            name: 'Binding Ecosystem',
            slug: `binding-${Math.random().toString(36).slice(2, 8)}`,
            description: undefined,
            parentEcosystemId: null,
            ownerProfileId: 'owner-1',
            settings: {},
            status: 'ACTIVE',
        });

        const provider = await createInstallTargetInternal({
            apiVersion: 'lc.install-target/v1',
            id: 'provider_1',
            intentId: 'intent_provider',
            ecosystemId: ecosystem.id,
            targetType: 'WALLET_ENABLEMENT',
            status: 'READY',
            createdAt: new Date().toISOString(),
        });
        const consumer = await createInstallTargetInternal({
            apiVersion: 'lc.install-target/v1',
            id: 'consumer_1',
            intentId: 'intent_consumer',
            ecosystemId: ecosystem.id,
            targetType: 'APP_AVAILABILITY',
            status: 'READY',
            createdAt: new Date().toISOString(),
        });

        const binding = await createBinding({
            apiVersion: 'lc.binding/v1',
            ecosystemId: ecosystem.id,
            capability: 'wallet-claim',
            provider: {
                resourceType: provider.targetType,
                resourceId: provider.id,
                ecosystemId: ecosystem.id,
            },
            consumer: {
                resourceType: consumer.targetType,
                resourceId: consumer.id,
                ecosystemId: ecosystem.id,
            },
            status: 'PROPOSED',
        });

        expect(binding.revision).toBe(0);

        const approved = await approveBinding(binding.bindingId, 0, 'profile_approver');
        expect(approved.status).toBe('APPROVED');
        expect(approved.revision).toBe(1);

        await expect(revokeBinding(binding.bindingId, 0)).rejects.toThrow(/stale/i);

        const revoked = await revokeBinding(binding.bindingId, 1);
        expect(revoked.status).toBe('REVOKED');
        expect(revoked.revision).toBe(2);

        const reread = await readBindingById(binding.bindingId);
        expect(reread?.status).toBe('REVOKED');
    });
});

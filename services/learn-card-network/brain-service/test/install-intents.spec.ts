import { randomUUID } from 'node:crypto';

import { beforeEach, describe, expect, it } from 'vitest';

import { neogma } from '@instance';
import { createProfile } from '@accesslayer/profile/create';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { grantEcosystemMembership } from '@accesslayer/ecosystem/membership';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { createInstallTargetInternal } from '@accesslayer/install-target/internal';
import { getInstallIntentAuditEvents } from '@accesslayer/install-intent/audit';
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
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';

import { getClient } from './helpers/getClient';
import { makeListingInput } from './helpers/app-store.helpers';

const OWNER_DID = 'did:key:z6MkInstallOwner';
const ADMIN_DID = 'did:key:z6MkInstallAdmin';
const STRANGER_DID = 'did:key:z6MkInstallStranger';

const ownerClient = getClient({
    did: OWNER_DID,
    isChallengeValid: true,
    scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
});
const adminClient = getClient({
    did: ADMIN_DID,
    isChallengeValid: true,
    scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
});
const strangerClient = getClient({
    did: STRANGER_DID,
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

const createListingWithVersion = async (overrides?: {
    kind?: 'APP' | 'INTEGRATION' | 'WALLET' | 'BUNDLE';
    listingId?: string;
    listingStatus?: 'LISTED' | 'ARCHIVED' | 'DRAFT' | 'PENDING_REVIEW';
    versionStatus?: 'LISTED' | 'DRAFT';
    manifest?: Record<string, unknown>;
}): Promise<{ listingId: string; versionId: string }> => {
    const listingId = overrides?.listingId ?? `listing_${randomUUID()}`;
    const versionId = `version_${randomUUID()}`;

    await createAppStoreListing(
        makeListingInput({
            listing_id: listingId,
            kind: overrides?.kind ?? 'INTEGRATION',
            app_listing_status: overrides?.listingStatus ?? 'LISTED',
        })
    );
    await ListingVersion.createOne({
        version_id: versionId,
        version: '1.0.0',
        status: overrides?.versionStatus ?? 'LISTED',
        manifest_json: JSON.stringify(overrides?.manifest ?? { ok: true }),
        created_at: new Date().toISOString(),
    });

    return { listingId, versionId };
};

const createPlannedIntent = async (ecosystemId: string, listingId: string, versionId: string) => {
    return ownerClient.installIntent.planInstallIntent({
        ecosystemId,
        listingId,
        versionId,
        requestedConfig: { district: 'ca' },
        proposedBindings: [],
    });
};

const setCatalogPolicy = async (
    ecosystemId: string,
    catalogPolicy: { allowedListings?: string[]; requireEndorsement?: boolean }
): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (ecosystem:Ecosystem { id: $ecosystemId })
         SET ecosystem.settings = $settings,
             ecosystem.updatedAt = $updatedAt`,
        {
            ecosystemId,
            settings: JSON.stringify({ catalogPolicy }),
            updatedAt: new Date().toISOString(),
        }
    );
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

describe('Install intents', () => {
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

    it('runs the happy path plan -> approve -> apply -> observe -> revoke with audits', async () => {
        const ecosystem = await createOperatorEcosystem();
        const { listingId, versionId } = await createListingWithVersion({ kind: 'INTEGRATION' });

        const planned = await createPlannedIntent(ecosystem.id, listingId, versionId);
        const approved = await ownerClient.installIntent.approveInstallIntent({
            intentId: planned.intentId,
            planHash: planned.plan.planHash,
            planRevision: planned.plan.planRevision,
            consentTiers: ['roster'],
        });
        const applied = await ownerClient.installIntent.applyInstallIntent({
            intentId: planned.intentId,
            expectedStatusRevision: approved.statusRevision,
        });
        const observed = await ownerClient.installIntent.getInstallIntent({
            intentId: planned.intentId,
        });
        const revoked = await ownerClient.installIntent.revokeInstallIntent({
            intentId: planned.intentId,
            expectedStatusRevision: applied.statusRevision,
            phase: 'REMOVED',
        });
        const audits = await getInstallIntentAuditEvents({ intentId: planned.intentId });

        expect(approved.approval.state).toBe('APPROVED');
        expect(applied.status?.phase).toBe('READY');
        expect(observed?.status?.phase).toBe('READY');
        expect(revoked.status?.phase).toBe('REMOVED');
        expect(audits.map(event => event.action)).toEqual([
            'PLAN_CREATED',
            'APPROVED',
            'STATUS_APPLYING',
            'STATUS_READY',
            'APPLIED',
            'STATUS_REMOVING',
            'STATUS_REMOVED',
            'REVOKED',
        ]);
    });

    it('rejects approval for stale plan hashes', async () => {
        const ecosystem = await createOperatorEcosystem();
        const { listingId, versionId } = await createListingWithVersion({ kind: 'INTEGRATION' });
        const planned = await createPlannedIntent(ecosystem.id, listingId, versionId);

        await expect(
            ownerClient.installIntent.approveInstallIntent({
                intentId: planned.intentId,
                planHash: 'stale-plan-hash',
                planRevision: planned.plan.planRevision,
                consentTiers: ['roster'],
            })
        ).rejects.toThrow(/stale/i);
    });

    it('rejects approval when catalog policy changed after planning even if the listing remains allowed', async () => {
        const listing = await createListingWithVersion({ kind: 'INTEGRATION' });
        const unrelated = await createListingWithVersion({ kind: 'INTEGRATION' });
        const ecosystem = await createOperatorEcosystem({
            catalogPolicy: { allowedListings: [listing.listingId] },
        });
        const planned = await createPlannedIntent(
            ecosystem.id,
            listing.listingId,
            listing.versionId
        );

        expect(typeof planned.policyRevision).toBe('string');

        await setCatalogPolicy(ecosystem.id, {
            allowedListings: [listing.listingId, unrelated.listingId],
            requireEndorsement: false,
        });

        await expect(
            ownerClient.installIntent.approveInstallIntent({
                intentId: planned.intentId,
                planHash: planned.plan.planHash,
                planRevision: planned.plan.planRevision,
                consentTiers: [],
            })
        ).rejects.toThrow(/catalog policy changed since the install plan was rendered/i);
    });

    it('does not treat allowedListings reorder as a stale catalog policy change', async () => {
        const primary = await createListingWithVersion({ kind: 'INTEGRATION' });
        const secondary = await createListingWithVersion({ kind: 'INTEGRATION' });
        const ecosystem = await createOperatorEcosystem({
            catalogPolicy: { allowedListings: [primary.listingId, secondary.listingId] },
        });
        const planned = await createPlannedIntent(
            ecosystem.id,
            primary.listingId,
            primary.versionId
        );

        await setCatalogPolicy(ecosystem.id, {
            allowedListings: [secondary.listingId, primary.listingId],
            requireEndorsement: false,
        });

        const approved = await ownerClient.installIntent.approveInstallIntent({
            intentId: planned.intentId,
            planHash: planned.plan.planHash,
            planRevision: planned.plan.planRevision,
            consentTiers: [],
        });

        expect(approved.approval.state).toBe('APPROVED');
    });

    it('rejects approval for unauthorized principals', async () => {
        const ecosystem = await createOperatorEcosystem();
        const { listingId, versionId } = await createListingWithVersion({ kind: 'INTEGRATION' });
        const planned = await createPlannedIntent(ecosystem.id, listingId, versionId);

        const localStrangerClient = getClient({
            did: STRANGER_DID,
            isChallengeValid: true,
            scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
        });

        await expect(
            localStrangerClient.installIntent.approveInstallIntent({
                intentId: planned.intentId,
                planHash: planned.plan.planHash,
                planRevision: planned.plan.planRevision,
                consentTiers: ['roster'],
            })
        ).rejects.toThrow(/authority/i);
    });

    it('rejects approval for missing entitlements', async () => {
        const ecosystem = await createOperatorEcosystem();
        const member = await createListingWithVersion({ kind: 'INTEGRATION' });
        const bundle = await createListingWithVersion({
            kind: 'BUNDLE',
            manifest: {
                apiVersion: 'lc.bundle/v1',
                id: `bundle_${randomUUID()}`,
                version: '1.0.0',
                contains: [
                    {
                        declarationId: 'adapter',
                        targetType: 'INTEGRATION_INSTALL',
                        listingId: member.listingId,
                        versionId: member.versionId,
                    },
                ],
                defaultBindings: [],
                preflight: [{ entitlementKey: 'issuance' }],
            },
        });
        const planned = await createPlannedIntent(ecosystem.id, bundle.listingId, bundle.versionId);

        await expect(
            ownerClient.installIntent.approveInstallIntent({
                intentId: planned.intentId,
                planHash: planned.plan.planHash,
                planRevision: planned.plan.planRevision,
                consentTiers: [],
            })
        ).rejects.toThrow(/Missing required entitlement/i);
    });

    it('rejects approval for disallowed listings', async () => {
        const allowed = await createListingWithVersion({ kind: 'INTEGRATION' });
        const blocked = await createListingWithVersion({ kind: 'INTEGRATION' });
        const ecosystem = await createOperatorEcosystem({
            catalogPolicy: { allowedListings: [allowed.listingId] },
        });
        const planned = await createPlannedIntent(
            ecosystem.id,
            blocked.listingId,
            blocked.versionId
        );

        await expect(
            ownerClient.installIntent.approveInstallIntent({
                intentId: planned.intentId,
                planHash: planned.plan.planHash,
                planRevision: planned.plan.planRevision,
                consentTiers: [],
            })
        ).rejects.toThrow(/catalog policy/i);
    });

    it('rejects approval for unsupported consent tiers and invalid binding references', async () => {
        const ecosystem = await createOperatorEcosystem();
        const { listingId, versionId } = await createListingWithVersion({ kind: 'INTEGRATION' });
        const planned = await ownerClient.installIntent.planInstallIntent({
            ecosystemId: ecosystem.id,
            listingId,
            versionId,
            requestedConfig: {},
            proposedBindings: [
                {
                    capability: 'wallet-claim',
                    provider: {
                        resourceType: 'APP_AVAILABILITY',
                        resourceId: 'missing-provider',
                        ecosystemId: ecosystem.id,
                    },
                    consumer: {
                        resourceType: 'APP_AVAILABILITY',
                        resourceId: 'missing-consumer',
                        ecosystemId: ecosystem.id,
                    },
                    reason: 'broken refs',
                },
            ],
        });

        await expect(
            ownerClient.installIntent.approveInstallIntent({
                intentId: planned.intentId,
                planHash: planned.plan.planHash,
                planRevision: planned.plan.planRevision,
                consentTiers: ['unsupported-tier'],
            })
        ).rejects.toThrow(/Unsupported consent tier/i);

        await expect(
            ownerClient.installIntent.approveInstallIntent({
                intentId: planned.intentId,
                planHash: planned.plan.planHash,
                planRevision: planned.plan.planRevision,
                consentTiers: [],
            })
        ).rejects.toThrow(/materialized intent target/i);
    });

    it('proposes, approves, and revokes bindings; rejects failing consent preflight and stale revisions', async () => {
        const ecosystem = await createOperatorEcosystem();
        const { providerId, consumerId } = await createBindingEndpoints(ecosystem.id);
        const proposed = await ownerClient.installIntent.proposeBinding({
            ecosystemId: ecosystem.id,
            capability: 'wallet-claim',
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

        await expect(
            ownerClient.installIntent.approveBinding({
                bindingId: proposed.bindingId,
                expectedRevision: proposed.revision,
                consentPreflight: {
                    subjectProfileId: 'subject-1',
                    consentActor: { type: 'SUBJECT', profileId: 'subject-1' },
                    consentFlowContractId: 'contract-1',
                    consentTermsId: 'terms-1',
                    consentRevision: '1',
                    requestedScopes: ['wallet:claim'],
                    ecosystemAuthorityScopes: ['wallet:claim'],
                    consentApprovedScopes: [],
                    requiredConsentTiers: ['credential-body'],
                    activeConsentTiers: [],
                    consentActive: false,
                    policyRevision: 'policy-1',
                },
            })
        ).rejects.toThrow(/Consent preflight rejected/i);

        const deniedRecords = await ownerClient.installIntent.getBindingConsentDecisionRecords({
            bindingId: proposed.bindingId,
        });
        expect(deniedRecords).toHaveLength(1);
        expect(deniedRecords[0]?.decision).toBe('DENY');

        const approved = await ownerClient.installIntent.approveBinding({
            bindingId: proposed.bindingId,
            expectedRevision: proposed.revision,
            consentPreflight: {
                subjectProfileId: 'subject-1',
                consentActor: { type: 'SUBJECT', profileId: 'subject-1' },
                consentFlowContractId: 'contract-1',
                consentTermsId: 'terms-1',
                consentRevision: '2',
                requestedScopes: ['wallet:claim'],
                ecosystemAuthorityScopes: ['wallet:claim'],
                consentApprovedScopes: ['wallet:claim'],
                requiredConsentTiers: ['credential-body'],
                activeConsentTiers: ['credential-body'],
                consentActive: true,
                policyRevision: 'policy-2',
            },
        });
        const revoked = await ownerClient.installIntent.revokeBinding({
            bindingId: approved.bindingId,
            expectedRevision: approved.revision,
        });

        expect(approved.status).toBe('ACTIVE');
        expect(revoked.status).toBe('REVOKED');

        await expect(
            ownerClient.installIntent.revokeBinding({
                bindingId: approved.bindingId,
                expectedRevision: approved.revision,
            })
        ).rejects.toThrow(/stale/i);
    });

    it('expands bundles deterministically, aggregates authority from members, resolves $ecosystem bindings, and rejects unreviewed members', async () => {
        const memberA = await createListingWithVersion({ kind: 'INTEGRATION' });
        const memberB = await createListingWithVersion({ kind: 'WALLET' });
        await neogma.queryRunner.run(
            `MATCH (version:ListingVersion { version_id: $versionId })
             SET version.manifest_json = $manifest`,
            {
                versionId: memberA.versionId,
                manifest: JSON.stringify({
                    apiVersion: 'lc.integration/v1',
                    id: memberA.listingId,
                    version: '1.0.0',
                    requestedScopes: ['issuer:write', 'issuer:read'],
                    consentTiers: ['credential-body'],
                }),
            }
        );
        await neogma.queryRunner.run(
            `MATCH (version:ListingVersion { version_id: $versionId })
             SET version.manifest_json = $manifest`,
            {
                versionId: memberB.versionId,
                manifest: JSON.stringify({
                    apiVersion: 'lc.wallet/v1',
                    id: memberB.listingId,
                    version: '1.0.0',
                    listingKind: 'WALLET',
                    walletName: 'LearnCard',
                    claimProtocols: ['oid4vci'],
                    platforms: ['ios', 'web'],
                    endpoints: {
                        claimUrl: 'https://wallet.example/claim',
                        healthUrl: 'https://wallet.example/health',
                    },
                    provides: ['wallet-claim'],
                    supportsApps: true,
                    scopes: ['wallet:claim'],
                }),
            }
        );
        const manifest = {
            apiVersion: 'lc.bundle/v1' as const,
            id: `bundle_${randomUUID()}`,
            version: '1.0.0',
            contains: [
                {
                    declarationId: 'wallet',
                    targetType: 'WALLET_ENABLEMENT' as const,
                    listingId: memberB.listingId,
                    versionId: memberB.versionId,
                },
                {
                    declarationId: 'integration',
                    targetType: 'INTEGRATION_INSTALL' as const,
                    listingId: memberA.listingId,
                    versionId: memberA.versionId,
                },
            ],
            defaultBindings: [
                {
                    capability: 'credential-issuer' as const,
                    providerDeclarationId: '$ecosystem',
                    consumerDeclarationId: 'wallet',
                    reason: 'Default ecosystem issuance routing',
                },
            ],
            preflight: [],
        };
        const bundle = await createListingWithVersion({ kind: 'BUNDLE', manifest });
        const ecosystem = await createOperatorEcosystem();
        const firstPlan = await ownerClient.installIntent.planInstallIntent({
            ecosystemId: ecosystem.id,
            listingId: bundle.listingId,
            versionId: bundle.versionId,
            requestedConfig: {},
            proposedBindings: [],
        });
        const secondPlan = await ownerClient.installIntent.planInstallIntent({
            intentId: firstPlan.intentId,
            ecosystemId: ecosystem.id,
            listingId: bundle.listingId,
            versionId: bundle.versionId,
            requestedConfig: {},
            proposedBindings: [],
        });

        expect(firstPlan.plan.planHash).toBe(secondPlan.plan.planHash);
        expect(firstPlan.plan.scopesRequested).toEqual([
            'issuer:read',
            'issuer:write',
            'wallet:claim',
        ]);
        expect(firstPlan.plan.consentTiers).toEqual(['credential-body']);
        expect(firstPlan.proposal.proposedBindings[0]?.provider).toEqual({
            resourceType: 'ECOSYSTEM',
            resourceId: ecosystem.id,
            ecosystemId: ecosystem.id,
        });
        expect(firstPlan.proposal.proposedBindings[0]?.consumer.resourceType).toBe(
            'WALLET_ENABLEMENT'
        );

        const unreviewed = await createListingWithVersion({
            kind: 'INTEGRATION',
            listingStatus: 'PENDING_REVIEW',
        });
        const unreviewedBundle = await createListingWithVersion({
            kind: 'BUNDLE',
            manifest: {
                ...manifest,
                contains: [
                    {
                        declarationId: 'unreviewed',
                        targetType: 'INTEGRATION_INSTALL',
                        listingId: unreviewed.listingId,
                        versionId: unreviewed.versionId,
                    },
                ],
                defaultBindings: [],
            },
        });

        await expect(
            ownerClient.installIntent.planInstallIntent({
                ecosystemId: ecosystem.id,
                listingId: unreviewedBundle.listingId,
                versionId: unreviewedBundle.versionId,
                requestedConfig: {},
                proposedBindings: [],
            })
        ).rejects.toThrow(/must resolve to a LISTED listing/i);
    });

    it('filters operator catalog listings by catalog policy and endorsement requirements', async () => {
        const visible = await createListingWithVersion({ kind: 'INTEGRATION' });
        const hidden = await createListingWithVersion({ kind: 'INTEGRATION' });
        const ecosystem = await createOperatorEcosystem({
            catalogPolicy: {
                allowedListings: [visible.listingId, hidden.listingId],
                requireEndorsement: true,
            },
        });

        await neogma.queryRunner.run(
            `MATCH (e:Ecosystem { id: $ecosystemId })
             MATCH (l:AppStoreListing { listing_id: $listingId })
             MERGE (e)-[:ENDORSES]->(l)`,
            { ecosystemId: ecosystem.id, listingId: visible.listingId }
        );

        const listings = await adminClient.installIntent.listInstallableCatalogListings({
            ecosystemId: ecosystem.id,
            limit: 20,
        });

        expect(listings.map(listing => listing.listing_id)).toEqual([visible.listingId]);
    });
});

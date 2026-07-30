import { randomUUID } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import cache from '@cache';
import { neogma } from '@instance';
import { createProfile } from '@accesslayer/profile/create';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { grantEcosystemMembership } from '@accesslayer/ecosystem/membership';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { readInstallIntentById } from '@accesslayer/install-intent/intent-read';
import { writeInstallIntentStatus } from '@accesslayer/install-intent/intent-status';
import {
    deleteInstallTargetInternal,
    ensureInstallTargetInternal,
    listInstallTargetsByIntentId,
} from '@accesslayer/install-target/internal';
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
    evaluateInstallIntentReconcilerAlertBreaches,
    getInstallIntentReconcilerMetricsSnapshot,
    injectInstallIntentReconcilerFailure,
    reconcileInstallIntent,
    resetInstallIntentReconcilerTestState,
    setInstallIntentReconcilerKillSwitch,
    setInstallIntentTenantConcurrencyLimit,
} from '@reconciler';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';

import { getClient } from './helpers/getClient';
import { makeListingInput } from './helpers/app-store.helpers';

const OWNER_DID = 'did:key:z6MkInstallReconcilerOwner';
const ADMIN_DID = 'did:key:z6MkInstallReconcilerAdmin';
const INSTALL_INTENT_RECONCILER_CASE_TIMEOUT_MS = 30_000;

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

const createOperatorEcosystem = async () => {
    await seedProfile('owner', OWNER_DID);
    await seedProfile('admin', ADMIN_DID);

    const ecosystem = await createEcosystem({
        name: `EducationOS ${randomUUID()}`,
        slug: `eco-${randomUUID().slice(0, 8)}`,
        description: undefined,
        parentEcosystemId: null,
        ownerProfileId: 'owner',
        settings: {},
        status: 'ACTIVE',
    });

    await grantEcosystemMembership({
        profileId: 'admin',
        ecosystemId: ecosystem.id,
        role: 'ADMIN',
    });
    return ecosystem;
};

const createListingWithVersion = async (kind: 'APP' | 'INTEGRATION' | 'WALLET' = 'INTEGRATION') => {
    const listingId = `listing_${randomUUID()}`;
    const versionId = `version_${randomUUID()}`;

    await createAppStoreListing(
        makeListingInput({ listing_id: listingId, kind, app_listing_status: 'LISTED' })
    );
    await ListingVersion.createOne({
        version_id: versionId,
        version: '1.0.0',
        status: 'LISTED',
        manifest_json: JSON.stringify({ ok: true }),
        created_at: new Date().toISOString(),
    });

    return { listingId, versionId };
};

const createApprovedIntent = async (
    ecosystemId: string,
    kind: 'APP' | 'INTEGRATION' | 'WALLET' = 'INTEGRATION'
) => {
    const { listingId, versionId } = await createListingWithVersion(kind);
    const planned = await ownerClient.installIntent.planInstallIntent({
        ecosystemId,
        listingId,
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

    return approved;
};

describe('Install intent reconciler', () => {
    beforeEach(async () => {
        process.env.INSTALL_INTENT_RECONCILER_BACKOFF_MS = '0';
        await resetInstallIntentReconcilerTestState();
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

    afterEach(async () => {
        delete process.env.INSTALL_INTENT_RECONCILER_BACKOFF_MS;
        delete process.env.INSTALL_INTENT_RECONCILER_MAX_RETRIES;
        delete process.env.INSTALL_INTENT_RECONCILER_DISABLED;
        delete process.env.INSTALL_INTENT_RECONCILER_STUCK_THRESHOLD_MS;
        delete process.env.INSTALL_INTENT_RECONCILER_ALERT_MAX_STUCK_INTENTS;
        delete process.env.INSTALL_INTENT_RECONCILER_ALERT_MAX_DEGRADED_INTENTS;
        delete process.env.INSTALL_INTENT_RECONCILER_ALERT_MAX_FAILED_INTENTS;
        await resetInstallIntentReconcilerTestState();
    });

    it('evaluates alert breaches only when counts exceed thresholds', () => {
        expect(
            evaluateInstallIntentReconcilerAlertBreaches(
                { stuck: 1, degraded: 2, failed: 0 },
                { maxStuckIntents: 0, maxDegradedIntents: 1, maxFailedIntents: 0 }
            )
        ).toEqual([
            {
                alert: 'STUCK_INTENTS',
                threshold: 0,
                observedValue: 1,
                severity: 'critical',
                firing: true,
            },
            {
                alert: 'DEGRADED_INTENTS',
                threshold: 1,
                observedValue: 2,
                severity: 'warning',
                firing: true,
            },
        ]);

        expect(
            evaluateInstallIntentReconcilerAlertBreaches(
                { stuck: 0, degraded: 1, failed: 0 },
                { maxStuckIntents: 0, maxDegradedIntents: 1, maxFailedIntents: 0 }
            )
        ).toEqual([]);
    });

    it('reconciles approved intent to READY and creates install targets', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);

        const reconciled = await ownerClient.installIntent.applyInstallIntent({
            intentId: approved.intentId,
            expectedStatusRevision: approved.statusRevision,
        });
        const targets = await listInstallTargetsByIntentId(approved.intentId);

        expect(reconciled.status?.phase).toBe('READY');
        expect(targets).toHaveLength(1);
        expect(targets[0]?.status).toBe('READY');
    });

    it('is a no-op when replayed after convergence', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);

        const first = await ownerClient.installIntent.applyInstallIntent({
            intentId: approved.intentId,
            expectedStatusRevision: approved.statusRevision,
        });
        const second = await ownerClient.installIntent.applyInstallIntent({
            intentId: approved.intentId,
            expectedStatusRevision: first.statusRevision,
        });

        expect(second.status?.phase).toBe('READY');
        expect(second.statusRevision).toBe(first.statusRevision);
    });

    it('retries after injected failure and resumes safely', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);
        await injectInstallIntentReconcilerFailure(approved.intentId, 'install');

        const first = await reconcileInstallIntent(approved.intentId, { operation: 'apply' });
        const second = await reconcileInstallIntent(approved.intentId, { operation: 'apply' });
        const metrics = getInstallIntentReconcilerMetricsSnapshot();

        expect(first.status?.phase).toBe('APPLYING');
        expect(first.status?.retryCount).toBe(1);
        expect(second.status?.phase).toBe('READY');
        expect(metrics.retries).toBeGreaterThan(0);
    });

    it('rejects stale status revisions', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);

        const reconciled = await ownerClient.installIntent.applyInstallIntent({
            intentId: approved.intentId,
            expectedStatusRevision: approved.statusRevision,
        });

        await expect(
            writeInstallIntentStatus({
                intentId: reconciled.intentId,
                expectedStatusRevision: reconciled.statusRevision - 1,
                phase: 'READY',
            })
        ).rejects.toThrow(/stale/i);
    });

    it('revokes to REMOVED and cleans up install targets', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);
        const applied = await ownerClient.installIntent.applyInstallIntent({
            intentId: approved.intentId,
            expectedStatusRevision: approved.statusRevision,
        });

        const revoked = await ownerClient.installIntent.revokeInstallIntent({
            intentId: approved.intentId,
            expectedStatusRevision: applied.statusRevision,
        });
        const targets = await listInstallTargetsByIntentId(approved.intentId);

        expect(revoked.status?.phase).toBe('REMOVED');
        expect(targets).toHaveLength(0);
    });

    it('halts reconciliation when kill switch is enabled', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);
        await setInstallIntentReconcilerKillSwitch(true);

        const reconciled = await reconcileInstallIntent(approved.intentId, { operation: 'apply' });

        expect(reconciled.status?.phase).toBe('PLANNED');
    });

    it('halts reconciliation when tenant kill switch is enabled', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);
        await setInstallIntentReconcilerKillSwitch(true, ecosystem.id);

        const reconciled = await reconcileInstallIntent(approved.intentId, { operation: 'apply' });

        expect(reconciled.status?.phase).toBe('PLANNED');
    });

    it('flags drift as DEGRADED without auto-correcting it', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);
        await ownerClient.installIntent.applyInstallIntent({
            intentId: approved.intentId,
            expectedStatusRevision: approved.statusRevision,
        });

        const [target] = await listInstallTargetsByIntentId(approved.intentId);
        if (!target) throw new Error('Expected target to exist.');

        await deleteInstallTargetInternal({ id: target.id, targetType: target.targetType });

        const degraded = await reconcileInstallIntent(approved.intentId, { operation: 'health' });
        const stillMissing = await listInstallTargetsByIntentId(approved.intentId);

        expect(degraded.status?.phase).toBe('DEGRADED');
        expect(degraded.status?.message).toMatch(/drift detected/i);
        expect(stillMissing).toHaveLength(0);
    });

    it('recovers from DEGRADED back to READY once drift is resolved', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);
        await ownerClient.installIntent.applyInstallIntent({
            intentId: approved.intentId,
            expectedStatusRevision: approved.statusRevision,
        });

        const [target] = await listInstallTargetsByIntentId(approved.intentId);
        if (!target) throw new Error('Expected target to exist.');

        await deleteInstallTargetInternal({ id: target.id, targetType: target.targetType });
        await reconcileInstallIntent(approved.intentId, { operation: 'health' });
        await ensureInstallTargetInternal({ ...target, status: 'READY' });

        const recovered = await reconcileInstallIntent(approved.intentId, { operation: 'health' });

        expect(recovered.status?.phase).toBe('READY');
    });

    it('fails after retry budget exhaustion', async () => {
        process.env.INSTALL_INTENT_RECONCILER_MAX_RETRIES = '1';

        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);
        await injectInstallIntentReconcilerFailure(approved.intentId, 'install', 2);

        const first = await reconcileInstallIntent(approved.intentId, { operation: 'apply' });
        const second = await reconcileInstallIntent(approved.intentId, { operation: 'apply' });

        expect(first.status?.phase).toBe('APPLYING');
        expect(second.status?.phase).toBe('FAILED');
        expect(second.status?.message).toMatch(/Injected install failure/i);
    });

    it('rejects stale CAS apply and revoke attempts', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);

        await expect(
            reconcileInstallIntent(approved.intentId, {
                operation: 'apply',
                expectedStatusRevision: approved.statusRevision + 1,
            })
        ).rejects.toThrow(/stale/i);

        const applied = await ownerClient.installIntent.applyInstallIntent({
            intentId: approved.intentId,
            expectedStatusRevision: approved.statusRevision,
        });

        await expect(
            ownerClient.installIntent.revokeInstallIntent({
                intentId: approved.intentId,
                expectedStatusRevision: applied.statusRevision - 1,
            })
        ).rejects.toThrow(/stale/i);
    });

    it('serializes concurrent reconciles for the same intent', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);
        await injectInstallIntentReconcilerFailure(approved.intentId, 'install', 1);

        const [first, second] = await Promise.all([
            reconcileInstallIntent(approved.intentId, { operation: 'apply' }),
            reconcileInstallIntent(approved.intentId, { operation: 'apply' }),
        ]);

        expect(first.status?.phase).toBe('APPLYING');
        expect(second.status?.phase).toBe('READY');
        expect((await listInstallTargetsByIntentId(approved.intentId)).length).toBe(1);
    });

    it('enforces tenant-scoped concurrency limits', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);
        await setInstallIntentTenantConcurrencyLimit(ecosystem.id, 1);
        await cache.set(`install-intent-reconciler:tenant:${ecosystem.id}:active`, '1', false);

        const blocked = await reconcileInstallIntent(approved.intentId, { operation: 'apply' });
        const metrics = getInstallIntentReconcilerMetricsSnapshot();

        expect(blocked.status?.phase).toBe('PLANNED');
        expect(metrics.stuck).toBeGreaterThan(0);
    });

    it('honors disposition policy during remove flow', async () => {
        const ecosystem = await createOperatorEcosystem();
        const approved = await createApprovedIntent(ecosystem.id);
        const applied = await ownerClient.installIntent.applyInstallIntent({
            intentId: approved.intentId,
            expectedStatusRevision: approved.statusRevision,
        });

        const removed = await ownerClient.installIntent.revokeInstallIntent({
            intentId: approved.intentId,
            expectedStatusRevision: applied.statusRevision,
            phase: 'REMOVED',
        });

        expect(removed.status?.phase).toBe('REMOVED');
        expect(removed.status?.message).toBe('RETAIN');
    });

    it(
        'exposes reconciler health buckets, controls, metrics, and alert breaches for operators',
        async () => {
            process.env.INSTALL_INTENT_RECONCILER_MAX_RETRIES = '1';
            process.env.INSTALL_INTENT_RECONCILER_STUCK_THRESHOLD_MS = '1';
            process.env.INSTALL_INTENT_RECONCILER_ALERT_MAX_STUCK_INTENTS = '0';
            process.env.INSTALL_INTENT_RECONCILER_ALERT_MAX_DEGRADED_INTENTS = '0';
            process.env.INSTALL_INTENT_RECONCILER_ALERT_MAX_FAILED_INTENTS = '0';

            const ecosystem = await createOperatorEcosystem();

            const degradedIntent = await createApprovedIntent(ecosystem.id);
            await ownerClient.installIntent.applyInstallIntent({
                intentId: degradedIntent.intentId,
                expectedStatusRevision: degradedIntent.statusRevision,
            });
            const [degradedTarget] = await listInstallTargetsByIntentId(degradedIntent.intentId);
            if (!degradedTarget) throw new Error('Expected degraded target to exist.');
            await deleteInstallTargetInternal({
                id: degradedTarget.id,
                targetType: degradedTarget.targetType,
            });
            await reconcileInstallIntent(degradedIntent.intentId, { operation: 'health' });

            const failedIntent = await createApprovedIntent(ecosystem.id);
            await injectInstallIntentReconcilerFailure(failedIntent.intentId, 'install', 2);
            await reconcileInstallIntent(failedIntent.intentId, { operation: 'apply' });
            await reconcileInstallIntent(failedIntent.intentId, { operation: 'apply' });

            const stuckIntent = await createApprovedIntent(ecosystem.id);
            const staleObservedAt = new Date(Date.now() - 10_000).toISOString();
            await writeInstallIntentStatus({
                intentId: stuckIntent.intentId,
                expectedStatusRevision: stuckIntent.statusRevision,
                phase: 'APPLYING',
                observedAt: staleObservedAt,
                retryCount: 0,
            });

            const suspendedIntent = await createApprovedIntent(ecosystem.id);
            await ownerClient.installIntent.applyInstallIntent({
                intentId: suspendedIntent.intentId,
                expectedStatusRevision: suspendedIntent.statusRevision,
            });
            await ownerClient.installIntent.suspendForPolicy({
                intentId: suspendedIntent.intentId,
                message: 'Operator paused rollout.',
            });

            await setInstallIntentTenantConcurrencyLimit(ecosystem.id, 7);
            await setInstallIntentReconcilerKillSwitch(true);
            await setInstallIntentReconcilerKillSwitch(true, ecosystem.id);

            const health = await ownerClient.installIntent.getInstallIntentReconcilerHealth({
                ecosystemId: ecosystem.id,
            });

            expect(health.unhealthyIntents.DEGRADED.intentIds).toContain(degradedIntent.intentId);
            expect(health.unhealthyIntents.FAILED.intentIds).toContain(failedIntent.intentId);
            expect(health.unhealthyIntents.STUCK.intentIds).toContain(stuckIntent.intentId);
            expect(health.unhealthyIntents.SUSPENDED.intentIds).toContain(suspendedIntent.intentId);
            expect(health.operatorControls).toEqual({
                globalKillSwitchEnabled: true,
                ecosystemKillSwitchEnabled: true,
                effectiveKillSwitchEnabled: true,
                tenantConcurrencyLimit: 7,
            });
            expect(health.metrics.reconcileCount).toBeGreaterThan(0);
            expect(health.metrics.averageReconcileLatencyMs).toBe(
                health.metrics.reconcileLatencyMs / health.metrics.reconcileCount
            );
            expect(health.alertState.firing).toBe(true);
            expect(health.alertState.thresholds).toEqual({
                maxStuckIntents: 0,
                maxDegradedIntents: 0,
                maxFailedIntents: 0,
            });
            expect(health.alertState.breaches).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        alert: 'STUCK_INTENTS',
                        threshold: 0,
                        observedValue: 1,
                        firing: true,
                    }),
                    expect.objectContaining({
                        alert: 'DEGRADED_INTENTS',
                        threshold: 0,
                        observedValue: 1,
                        firing: true,
                    }),
                    expect.objectContaining({
                        alert: 'FAILED_INTENTS',
                        threshold: 0,
                        observedValue: 1,
                        firing: true,
                    }),
                ])
            );
        },
        INSTALL_INTENT_RECONCILER_CASE_TIMEOUT_MS
    );
});

import { randomUUID } from 'node:crypto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { neogma } from '@instance';
import { createProfile } from '@accesslayer/profile/create';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { grantEcosystemMembership } from '@accesslayer/ecosystem/membership';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { readInstallIntentById } from '@accesslayer/install-intent/intent-read';
import {
    deleteInstallTargetInternal,
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
    classifyReconcileWork,
    injectInstallIntentReconcilerFailure,
    resetInstallIntentReconcilerTestState,
    runInstallIntentReconcilerPass,
    setInstallIntentReconcilerKillSwitch,
    startInstallIntentReconciler,
} from '@reconciler';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';

import { getClient } from './helpers/getClient';
import { makeListingInput } from './helpers/app-store.helpers';

const OWNER_DID = 'did:key:z6MkSchedulerOwner';
const CASE_TIMEOUT_MS = 30_000;

const ownerClient = getClient({
    did: OWNER_DID,
    isChallengeValid: true,
    scope: AUTH_GRANT_FULL_ACCESS_SCOPE,
});

const createOperatorEcosystem = async () => {
    await createProfile({
        profileId: 'owner',
        did: OWNER_DID,
        displayName: 'owner',
    } as Parameters<typeof createProfile>[0]);

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
        profileId: 'owner',
        ecosystemId: ecosystem.id,
        role: 'OWNER',
    });

    return ecosystem;
};

const createApprovedIntent = async (ecosystemId: string) => {
    const listingId = `listing_${randomUUID()}`;
    const versionId = `version_${randomUUID()}`;

    await createAppStoreListing(
        makeListingInput({
            listing_id: listingId,
            kind: 'INTEGRATION',
            app_listing_status: 'LISTED',
        })
    );
    await ListingVersion.createOne({
        version_id: versionId,
        version: '1.0.0',
        status: 'LISTED',
        manifest_json: JSON.stringify({ ok: true }),
        created_at: new Date().toISOString(),
    } as Parameters<typeof ListingVersion.createOne>[0]);

    const planned = await ownerClient.installIntent.planInstallIntent({
        ecosystemId,
        listingId,
        versionId,
        requestedConfig: {},
        proposedBindings: [],
    });

    return ownerClient.installIntent.approveInstallIntent({
        intentId: planned.intentId,
        planHash: planned.plan.planHash,
        planRevision: planned.plan.planRevision,
        consentTiers: [],
    });
};

describe('Install intent reconciler scheduler', () => {
    beforeEach(async () => {
        process.env.INSTALL_INTENT_RECONCILER_BACKOFF_MS = '0';
        process.env.INSTALL_INTENT_RECONCILER_HEALTH_INTERVAL_MS = '1';
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
        delete process.env.INSTALL_INTENT_RECONCILER_HEALTH_INTERVAL_MS;
        delete process.env.INSTALL_INTENT_RECONCILER_ALLOW_LOCAL_COORDINATION;
        await resetInstallIntentReconcilerTestState();
    });

    it(
        'resumes a retrying intent with no operator involvement',
        async () => {
            const ecosystem = await createOperatorEcosystem();
            const approved = await createApprovedIntent(ecosystem.id);

            await injectInstallIntentReconcilerFailure(approved.intentId, 'install');

            const applying = await ownerClient.installIntent.applyInstallIntent({
                intentId: approved.intentId,
                expectedStatusRevision: approved.statusRevision,
            });

            expect(applying.status?.phase).toBe('APPLYING');
            expect(applying.status?.retryCount).toBeGreaterThan(0);

            const summary = await runInstallIntentReconcilerPass();

            expect(summary.resumed).toBe(1);

            const resumed = await readInstallIntentById(approved.intentId);

            expect(resumed?.status?.phase).toBe('READY');
        },
        CASE_TIMEOUT_MS
    );

    it(
        'observes drift and marks DEGRADED with no operator involvement',
        async () => {
            const ecosystem = await createOperatorEcosystem();
            const approved = await createApprovedIntent(ecosystem.id);

            const applied = await ownerClient.installIntent.applyInstallIntent({
                intentId: approved.intentId,
                expectedStatusRevision: approved.statusRevision,
            });

            expect(applied.status?.phase).toBe('READY');

            const targets = await listInstallTargetsByIntentId(approved.intentId);

            expect(targets.length).toBeGreaterThan(0);

            for (const target of targets) {
                await deleteInstallTargetInternal({
                    id: target.id,
                    targetType: target.targetType,
                });
            }

            const summary = await runInstallIntentReconcilerPass();

            expect(summary.healthChecked).toBe(1);

            const degraded = await readInstallIntentById(approved.intentId);

            expect(degraded?.status?.phase).toBe('DEGRADED');
        },
        CASE_TIMEOUT_MS
    );

    it(
        'never auto-applies an approved-but-unapplied intent, preserving the approval gate',
        async () => {
            const ecosystem = await createOperatorEcosystem();
            const approved = await createApprovedIntent(ecosystem.id);

            expect(approved.status?.phase).toBe('PLANNED');
            expect(classifyReconcileWork(approved)).toBeNull();

            const summary = await runInstallIntentReconcilerPass();

            expect(summary.considered).toBe(0);

            const untouched = await readInstallIntentById(approved.intentId);

            expect(untouched?.status?.phase).toBe('PLANNED');
            expect(await listInstallTargetsByIntentId(approved.intentId)).toHaveLength(0);
        },
        CASE_TIMEOUT_MS
    );

    it(
        'halts the pass for an ecosystem whose kill switch is engaged',
        async () => {
            const ecosystem = await createOperatorEcosystem();
            const approved = await createApprovedIntent(ecosystem.id);

            await injectInstallIntentReconcilerFailure(approved.intentId, 'install');
            await ownerClient.installIntent.applyInstallIntent({
                intentId: approved.intentId,
                expectedStatusRevision: approved.statusRevision,
            });

            await setInstallIntentReconcilerKillSwitch(true, ecosystem.id);

            const summary = await runInstallIntentReconcilerPass();

            expect(summary.halted).toBe(1);
            expect(summary.resumed).toBe(0);

            const stillApplying = await readInstallIntentById(approved.intentId);

            expect(stillApplying?.status?.phase).toBe('APPLYING');

            await setInstallIntentReconcilerKillSwitch(false, ecosystem.id);
        },
        CASE_TIMEOUT_MS
    );

    it('does not resume before the backoff deadline', () => {
        const future = new Date(Date.now() + 60_000).toISOString();

        expect(
            classifyReconcileWork({
                status: { phase: 'APPLYING', nextAttemptAt: future },
            } as Parameters<typeof classifyReconcileWork>[0])
        ).toBeNull();

        expect(
            classifyReconcileWork({
                status: { phase: 'APPLYING' },
            } as Parameters<typeof classifyReconcileWork>[0])
        ).toBe('resume');
    });

    it('refuses to reconcile without shared Redis when local coordination is disallowed', async () => {
        process.env.INSTALL_INTENT_RECONCILER_ALLOW_LOCAL_COORDINATION = 'false';

        await expect(runInstallIntentReconcilerPass()).rejects.toThrow(/requires a shared Redis/i);
    });

    it('start returns a stop handle that clears the timer', () => {
        const stop = startInstallIntentReconciler({ intervalMs: 60_000 });

        expect(typeof stop).toBe('function');

        stop();
    });
});

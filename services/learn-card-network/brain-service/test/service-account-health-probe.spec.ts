import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { IntegrationScopeRequest } from '@learncard/types';
import { ServiceAccount } from '@models';
import { createProfile } from '@accesslayer/profile/create';
import { createEcosystem } from '@accesslayer/ecosystem/create';
import { createAppStoreListing } from '@accesslayer/app-store-listing/create';
import { emergencyRevokeServiceAccount } from '@accesslayer/service-account/auth';
import { readInstallIntentById } from '@accesslayer/install-intent/intent-read';
import { writeInstallIntentStatus } from '@accesslayer/install-intent/intent-status';
import {
    reconcileInstallIntent,
    resetInstallIntentReconcilerTestState,
    setInstallIntentReconcilerKillSwitch,
} from '@reconciler';
import { probeServiceAccountHealthNow } from '../src/dev/service-account-health-probe';
import { getClient } from './helpers/getClient';
import { AUTH_GRANT_FULL_ACCESS_SCOPE } from 'src/constants/auth-grant';
import { makeListingInput } from './helpers/app-store.helpers';
import { createSignedListingVersionForKind } from './helpers/manifest.helpers';
import { withHealthServer } from './helpers/health-server';

const treeScope: IntegrationScopeRequest = {
    resource: 'group',
    action: 'sync',
    selectorKind: 'tree',
    selectorValue: '$installEcosystemId',
    reason: 'Sync approved groups',
};

/** An approved, applied integration install whose account is ENABLED behind `healthUrl`. */
const enabledInstall = async (healthUrl: string) => {
    const suffix = randomUUID();
    const did = `did:key:health-probe-${suffix}`;
    const profileId = `health-probe-${suffix}`;
    await createProfile({ profileId, did, displayName: profileId } as Parameters<
        typeof createProfile
    >[0]);
    const ecosystem = await createEcosystem({
        name: 'Health probe test',
        slug: `hp-${suffix}`,
        ownerProfileId: profileId,
        parentEcosystemId: null,
        description: undefined,
        settings: {},
        status: 'ACTIVE',
    });
    const listingId = `listing_${suffix}`;
    const versionId = `version_${suffix}`;
    await createAppStoreListing(
        makeListingInput({
            listing_id: listingId,
            kind: 'INTEGRATION',
            app_listing_status: 'LISTED',
        })
    );
    await createSignedListingVersionForKind({
        listingId,
        versionId,
        kind: 'INTEGRATION',
        manifestOverrides: { scopes: [treeScope], endpoints: { healthUrl } },
    });
    const client = getClient({ did, isChallengeValid: true, scope: AUTH_GRANT_FULL_ACCESS_SCOPE });
    const planned = await client.installIntent.planInstallIntent({
        ecosystemId: ecosystem.id,
        listingId,
        versionId,
        requestedConfig: {},
        proposedBindings: [],
    });
    await client.installIntent.approveInstallIntent({
        intentId: planned.intentId,
        planHash: planned.plan.planHash,
        planRevision: planned.plan.planRevision,
        consentTiers: [],
    });
    await reconcileInstallIntent(planned.intentId);
    const account = await ServiceAccount.findOne({
        where: { ecosystemId: ecosystem.id },
        plain: true,
    });
    if (!account) throw new Error('Missing account');
    await client.installIntent.issueServiceAccountCredential({ serviceAccountId: account.id });
    return { intentId: planned.intentId, ecosystemId: ecosystem.id, account, profileId };
};

afterEach(async () => {
    vi.unstubAllEnvs();
    await resetInstallIntentReconcilerTestState();
});

describe('probeServiceAccountHealthNow (dev-only, no route)', () => {
    it('enables after a passing probe and recovers DISABLED(HEALTH) with one probe', async () => {
        await withHealthServer(async (healthUrl, control) => {
            const fixture = await enabledInstall(healthUrl);
            const enabled = await probeServiceAccountHealthNow({
                serviceAccountId: fixture.account.id,
            });
            expect(enabled).toMatchObject({
                serviceAccountId: fixture.account.id,
                intentId: fixture.intentId,
                status: 'ENABLED',
                healthFailures: 0,
            });
            expect(enabled.blockedBy).toBeUndefined();

            control.healthy = false;
            for (let n = 1; n <= 3; n++) {
                await probeServiceAccountHealthNow({ intentId: fixture.intentId });
            }
            const disabled = await probeServiceAccountHealthNow({
                serviceAccountId: fixture.account.id,
            });
            expect(disabled).toMatchObject({ status: 'DISABLED', disabledCause: 'HEALTH' });
            expect(disabled.blockedBy).toBeUndefined();

            control.healthy = true;
            const probesBefore = control.probes;
            const recovered = await probeServiceAccountHealthNow({
                serviceAccountId: fixture.account.id,
            });
            expect(control.probes).toBe(probesBefore + 1);
            expect(recovered).toMatchObject({ status: 'ENABLED', healthFailures: 0 });
            expect(recovered.disabledCause).toBeUndefined();
        });
    });

    it('names the guard instead of silently not probing', async () => {
        await withHealthServer(async (healthUrl, control) => {
            const fixture = await enabledInstall(healthUrl);
            await setInstallIntentReconcilerKillSwitch(true, fixture.ecosystemId);
            const probesBefore = control.probes;
            const killed = await probeServiceAccountHealthNow({ intentId: fixture.intentId });
            expect(killed.blockedBy).toBe('KILL_SWITCH');
            expect(control.probes).toBe(probesBefore);
            await setInstallIntentReconcilerKillSwitch(false, fixture.ecosystemId);

            await emergencyRevokeServiceAccount(fixture.account.id, fixture.profileId);
            const revoked = await probeServiceAccountHealthNow({
                serviceAccountId: fixture.account.id,
            });
            expect(revoked).toMatchObject({
                status: 'DISABLED',
                disabledCause: 'OPERATOR',
                blockedBy: 'OPERATOR_DISABLED',
            });
            expect(control.probes).toBe(probesBefore);
        });
    });

    it('refuses to probe a REMOVING intent instead of advancing the removal', async () => {
        await withHealthServer(async (healthUrl, control) => {
            const fixture = await enabledInstall(healthUrl);
            const intent = await readInstallIntentById(fixture.intentId);
            if (!intent) throw new Error('Missing intent');
            await writeInstallIntentStatus({
                intentId: fixture.intentId,
                expectedStatusRevision: intent.statusRevision,
                phase: 'REMOVING',
                cause: 'OPERATOR',
                observedAt: new Date().toISOString(),
                retryCount: 0,
            });
            const probesBefore = control.probes;
            const removing = await probeServiceAccountHealthNow({ intentId: fixture.intentId });
            expect(removing.blockedBy).toBe('REMOVING');
            expect(removing.status).not.toBe('REVOKED');
            expect(control.probes).toBe(probesBefore);
            const account = await ServiceAccount.findOne({
                where: { id: fixture.account.id },
                plain: true,
            });
            expect(account?.status).not.toBe('REVOKED');
        });
    });

    it('refuses to run in production', async () => {
        vi.stubEnv('NODE_ENV', 'production');
        await expect(
            probeServiceAccountHealthNow({ serviceAccountId: 'sa_unused' })
        ).rejects.toThrow(/dev-only/);
    });
});

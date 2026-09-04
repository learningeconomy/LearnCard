/* eslint-disable @typescript-eslint/no-explicit-any -- cross-package E2E assertions inspect dynamic credential and index payloads */
import { describe, test, expect, beforeAll, beforeEach } from 'vitest';

import { prepareFixtureById, buildFinalTranscriptVariant } from '@learncard/credential-library';
import type { UnsignedVC, VC } from '@learncard/types';

import { getLearnCardForUser, USERS, type LearnCard } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

/**
 * Cross-service managed credential refresh E2E (LC-2117 / LC-2135 / LC-2136).
 *
 * Proves the full provisional-to-final lifecycle against the real dockerized services
 * (brain-service, learn-cloud, lca-api):
 *
 *   allocate -> issue provisional CLR -> claim -> publish final CLR
 *            -> holder authenticated refresh -> in-place LearnCloud replacement
 *            -> collapsed CREDENTIAL_REFRESHED notifications per delivery window
 *            -> revocation stops managed serving (410) while local history remains
 *
 * The holder-side storage update mirrors the production `refreshLearnCloudCredential`
 * helper semantics (same index record, URI replaced, previous URI retained in
 * encrypted history) using the wallet primitives directly; the helper itself is
 * unit-tested in learn-card-base.
 */

const BRAIN_BASE_URL = 'http://localhost:4000';
const LCA_API_BASE_URL = 'http://localhost:5200';

/**
 * The notification collapse window configured for the e2e brain container
 * (CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS=0.005 in tests/e2e/compose.yaml).
 * The delivery-window key buckets by floor(now / window), so waiting for the next
 * bucket boundary deterministically produces a new window.
 */
const DELIVERY_WINDOW_MS = 0.005 * 3_600_000; // 18 seconds

/**
 * SSRF guard opt-ins for the local docker endpoint: it is plain HTTP on a loopback
 * host, so the holder primitive needs the explicit local-development opt-in, plus a
 * private-address opt-in. Both exceptions are deliberately scoped to this local test.
 */
const LOCAL_REFRESH_OPTIONS = {
    allowInsecureHttp: true,
    allowPrivateAddresses: true,
    resolveHost: async () => ['127.0.0.1'],
} as const;

const waitForFreshDeliveryWindow = async (): Promise<void> => {
    const now = Date.now();
    const nextWindowStart = (Math.floor(now / DELIVERY_WINDOW_MS) + 1) * DELIVERY_WINDOW_MS;

    await new Promise(resolve => setTimeout(resolve, nextWindowStart - now + 250));
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const waitFor = async <T>(
    fn: () => Promise<T>,
    predicate: (value: T) => boolean,
    { attempts = 15, intervalMs = 1_000 }: { attempts?: number; intervalMs?: number } = {}
): Promise<T> => {
    let last = await fn();

    for (let attempt = 0; attempt < attempts && !predicate(last); attempt += 1) {
        await delay(intervalMs);
        last = await fn();
    }

    return last;
};

/** Holder DID-auth GET against the managed refresh endpoint (challenge + retry). */
const authenticatedRefreshGet = async (wallet: LearnCard, path: string): Promise<Response> => {
    const challengeResponse = await fetch(`${BRAIN_BASE_URL}${path}`);

    expect(challengeResponse.status).toBe(401);

    const challengeBody = (await challengeResponse.json()) as {
        challenge: string;
        domain?: string;
    };

    const vp = (await wallet.invoke.getDidAuthVp({
        proofFormat: 'jwt',
        challenge: challengeBody.challenge,
        domain: challengeBody.domain,
    })) as string;

    return fetch(`${BRAIN_BASE_URL}${path}`, {
        headers: { authorization: `Bearer ${vp}` },
    });
};

type RefreshNotification = { type: string; data?: { metadata?: Record<string, unknown> } };

const getRefreshNotifications = async (wallet: LearnCard): Promise<RefreshNotification[]> => {
    const result = await wallet.invoke.getNotifications({ limit: 50 });

    return (result?.notifications ?? []).filter(
        (notification: RefreshNotification) => notification.type === 'CREDENTIAL_REFRESHED'
    );
};

type PushAttempt = {
    type: string;
    toDid: string;
    at: string;
    refreshId?: string;
    routeKey?: string;
    deliveryKey?: string;
    version?: number;
};

const getPushAttempts = async (): Promise<PushAttempt[]> => {
    const response = await fetch(`${LCA_API_BASE_URL}/api/test/push-attempts`);

    expect(response.status).toBe(200);

    return (await response.json()) as PushAttempt[];
};

describe('Credential Refresh (managed)', () => {
    let issuer: LearnCard;
    let holder: LearnCard;

    beforeAll(async () => {
        // The global setup only waits for brain-service; make sure lca-api is up too.
        await waitFor(
            async () =>
                fetch(`${LCA_API_BASE_URL}/api/health-check`)
                    .then(res => res.status)
                    .catch(() => 0),
            status => status === 200,
            { attempts: 60, intervalMs: 1_000 }
        );
    }, 120_000);

    // The shared E2E harness clears profile data after every test, so recreate the
    // wallets' network profiles for each independent scenario.
    beforeEach(async () => {
        issuer = await getLearnCardForUser('a');
        holder = await getLearnCardForUser('b');
    }, 120_000);

    test('issues a provisional CLR and refreshes it in place to the final CLR', async () => {
        const holderDid = holder.id.did();

        // 1. Prepare the provisional CLR (unsigned) so its stable credential ID is
        //    known, then allocate the managed refresh service BEFORE signing.
        const unsigned = prepareFixtureById('clr/provisional-transcript', {
            issuerDid: issuer.id.did(),
            subjectDid: holderDid,
        });

        const credentialId = unsigned.id as string;

        expect(credentialId).toMatch(/^urn:uuid:/);

        const allocation = await issuer.invoke.allocateCredentialRefresh({
            holder: { profileId: USERS.b.profileId, did: holderDid },
            credentialId,
        });

        expect(allocation.refreshId).toBeTruthy();
        expect(allocation.refreshService.type).toBe('1EdTechCredentialRefresh');
        expect(allocation.refreshService.authorization.type).toBe('LearnCardDIDAuth');

        unsigned.refreshService = allocation.refreshService as any;

        // 2. Issue + send the provisional transcript through the managed path.
        const provisional = await issuer.invoke.issueCredential(unsigned);

        const sentUri = await issuer.invoke.sendRefreshableCredential(
            allocation.refreshId,
            provisional
        );

        expect(sentUri).toBeTruthy();

        // 3. Holder claims the provisional transcript.
        const incoming = await holder.invoke.getIncomingCredentials();

        expect(incoming.map(credential => credential.uri)).toContain(sentUri);

        await expect(holder.invoke.acceptCredential(sentUri)).resolves.toBe(true);

        const heldProvisional = (await holder.read.get(sentUri)) as VC;

        expect(heldProvisional.name).toContain('Provisional');

        // 4. Holder stores it in their encrypted LearnCloud wallet index.
        const recordId = 'e2e-managed-refresh-transcript';
        const provisionalLearnCloudUri =
            await holder.store.LearnCloud.uploadEncrypted!(heldProvisional);

        await holder.index.LearnCloud.add({ id: recordId, uri: provisionalLearnCloudUri });

        // 5. Issuer publishes the final CLR: same credential ID, later effective
        //    date, materially changed content.
        const finalUnsigned = buildFinalTranscriptVariant(unsigned, {
            validFrom: new Date().toISOString(),
        });

        expect(finalUnsigned.id).toBe(credentialId);

        const finalCredential = await issuer.invoke.issueCredential(finalUnsigned);

        const publication = await issuer.invoke.publishCredentialRefresh({
            mode: 'issuer-signed',
            refreshId: allocation.refreshId,
            signedCredential: finalCredential,
        });

        expect(publication.version).toBe(2);
        expect(publication.notification).toBe('queued');

        // 6. Holder refreshes against the managed endpoint (DID-auth + holder JWE).
        const refreshed = await holder.invoke.refreshCredential(
            heldProvisional,
            LOCAL_REFRESH_OPTIONS
        );

        expect(refreshed.status, JSON.stringify(refreshed)).toBe('updated');

        if (refreshed.status !== 'updated') throw new Error('Expected updated result');

        expect(refreshed.managedVersion).toBe(2);
        expect(refreshed.etag).toBeTruthy();
        expect((refreshed.credential as VC).name).toContain('Final');
        expect((refreshed.credential as VC).id).toBe(credentialId);

        // 7. In-place LearnCloud replacement: same index record, new current URI,
        //    previous URI retained in encrypted history.
        const finalLearnCloudUri = await holder.store.LearnCloud.uploadEncrypted!(
            refreshed.credential
        );

        const [recordBeforeUpdate] = await holder.index.LearnCloud.get({ id: recordId });

        expect(recordBeforeUpdate?.uri).toBe(provisionalLearnCloudUri);

        const now = new Date().toISOString();

        await expect(
            holder.index.LearnCloud.update(recordId, {
                uri: finalLearnCloudUri,
                refresh: {
                    serviceId: allocation.refreshService.id,
                    serviceType: '1EdTechCredentialRefresh',
                    credentialId,
                    etag: refreshed.etag,
                    managedVersion: refreshed.managedVersion,
                    lastCheckedAt: now,
                    lastUpdatedAt: now,
                    unreadUpdate: true,
                    history: [
                        {
                            uri: provisionalLearnCloudUri,
                            managedVersion: 1,
                            effectiveAt: heldProvisional.validFrom,
                            capturedAt: now,
                        },
                    ],
                },
            } as any)
        ).resolves.toBe(true);

        const [recordAfterUpdate] = await holder.index.LearnCloud.get({ id: recordId });

        // Same wallet record — no duplicate was created.
        expect(recordAfterUpdate?.id).toBe(recordId);
        expect(recordAfterUpdate?.uri).toBe(finalLearnCloudUri);

        const refreshMetadata = (recordAfterUpdate as any)?.refresh;

        expect(refreshMetadata?.managedVersion).toBe(2);
        expect(refreshMetadata?.unreadUpdate).toBe(true);
        expect(refreshMetadata?.history?.map((entry: any) => entry.uri)).toContain(
            provisionalLearnCloudUri
        );

        // The latest claims are final…
        const latestCredential = (await holder.read.get(finalLearnCloudUri)) as VC;

        expect(latestCredential.name).toContain('Final');

        const nested = (latestCredential.credentialSubject as any)?.verifiableCredential?.[0];

        expect(nested?.credentialSubject?.result?.[0]?.status).toBe('Completed');

        // …and the retained provisional version still renders from history.
        const historicalCredential = (await holder.read.get(provisionalLearnCloudUri)) as VC;

        expect(historicalCredential.name).toContain('Provisional');

        // 8. A conditional re-check with the stored ETag short-circuits (304).
        const recheck = await holder.invoke.refreshCredential(refreshed.credential, {
            ...LOCAL_REFRESH_OPTIONS,
            etag: refreshed.etag,
        });

        expect(recheck.status).toBe('unchanged');

        // 9. Issuer audit history is metadata-only.
        const issuerHistory = await issuer.invoke.getCredentialRefreshHistory({
            refreshId: allocation.refreshId,
        });

        expect(issuerHistory.records.map(record => record.version)).toEqual([2, 1]);
        expect(issuerHistory.records[0]).not.toHaveProperty('credential');
        expect(issuerHistory.records[0]).not.toHaveProperty('jwe');
        expect(issuerHistory.records[0]?.signingMode).toBe('issuer-signed');
    }, 180_000);

    test('collapses repeat refresh notifications per delivery window with one push each', async () => {
        const holderDid = holder.id.did();

        // Fresh provisional credential for this scenario (databases are reset
        // between tests).
        const unsigned = prepareFixtureById('clr/provisional-transcript', {
            issuerDid: issuer.id.did(),
            subjectDid: holderDid,
        });

        const allocation = await issuer.invoke.allocateCredentialRefresh({
            holder: { profileId: USERS.b.profileId, did: holderDid },
            credentialId: unsigned.id as string,
        });

        unsigned.refreshService = allocation.refreshService as any;

        const provisional = await issuer.invoke.issueCredential(unsigned);
        const sentUri = await issuer.invoke.sendRefreshableCredential(
            allocation.refreshId,
            provisional
        );

        await holder.invoke.acceptCredential(sentUri);

        // Start in a fresh delivery window so every publication below shares it.
        await waitForFreshDeliveryWindow();

        const publishMaterialUpdate = async (summary: string) => {
            const update = buildFinalTranscriptVariant(unsigned, {
                validFrom: new Date().toISOString(),
            }) as Record<string, any>;

            // Each publication changes user-visible content (material).
            update.description = `Final transcript — ${summary}`;

            const signedUpdate = await issuer.invoke.issueCredential(update as UnsignedVC);

            return issuer.invoke.publishCredentialRefresh({
                mode: 'issuer-signed',
                refreshId: allocation.refreshId,
                signedCredential: signedUpdate,
            });
        };

        // Two material publications inside one delivery window.
        const first = await publishMaterialUpdate('registrar certified');
        const second = await publishMaterialUpdate('honors notation added');

        expect(first.notification).toBe('queued');
        expect(second.notification).toBe('queued');

        // Collapse: exactly one in-app notification and exactly one push attempt.
        const inAppAfterCollapse = await waitFor(
            async () =>
                (await getRefreshNotifications(holder)).filter(
                    notification => notification.data?.metadata?.refreshId === allocation.refreshId
                ),
            notifications => notifications.length === 1
        );

        expect(inAppAfterCollapse).toHaveLength(1);

        const attemptsAfterCollapse = await waitFor(
            async () =>
                (await getPushAttempts()).filter(
                    attempt => attempt.refreshId === allocation.refreshId
                ),
            attempts => attempts.length === 1
        );

        expect(attemptsAfterCollapse).toHaveLength(1);
        const collapsedAttempt = attemptsAfterCollapse[0];

        expect(collapsedAttempt).toMatchObject({
            refreshId: allocation.refreshId,
            toDid: holderDid,
            type: 'CREDENTIAL_REFRESHED',
        });

        // A publication in a new delivery window creates a second notification and
        // a second push attempt.
        await waitForFreshDeliveryWindow();

        await publishMaterialUpdate('final grades posted');

        const inAppAfterNewWindow = await waitFor(
            async () =>
                (await getRefreshNotifications(holder)).filter(
                    notification => notification.data?.metadata?.refreshId === allocation.refreshId
                ),
            notifications => notifications.length === 2
        );

        expect(inAppAfterNewWindow).toHaveLength(2);

        const attemptsAfterNewWindow = await waitFor(
            async () =>
                (await getPushAttempts()).filter(
                    attempt => attempt.refreshId === allocation.refreshId
                ),
            attempts => attempts.length === 2
        );

        expect(attemptsAfterNewWindow).toHaveLength(2);
        expect(new Set(attemptsAfterNewWindow.map(attempt => attempt.deliveryKey)).size).toBe(2);
    }, 240_000);

    test('stops serving after revocation while local history remains available', async () => {
        // Boost-issued refreshable credential: revocation moves through the
        // canonical boost revocation path.
        const boostUri = await issuer.invoke.createBoost(testUnsignedBoost);

        const sentUri = await issuer.invoke.sendBoost(USERS.b.profileId, boostUri, {
            enableRefresh: true,
        });

        const incoming = await holder.invoke.getIncomingCredentials();

        expect(incoming.map(credential => credential.uri)).toContain(sentUri);

        await holder.invoke.acceptCredential(sentUri);

        const held = (await holder.read.get(sentUri)) as VC;
        const refreshService = (held as any).refreshService;

        expect(refreshService?.type).toBe('1EdTechCredentialRefresh');

        // Holder keeps a local encrypted copy.
        const recordId = 'e2e-managed-refresh-revoked';
        const learnCloudUri = await holder.store.LearnCloud.uploadEncrypted!(held);

        await holder.index.LearnCloud.add({ id: recordId, uri: learnCloudUri });

        // Active aggregate: authenticated refresh succeeds and reports no changes.
        const beforeRevoke = await holder.invoke.refreshCredential(held, LOCAL_REFRESH_OPTIONS);

        expect(beforeRevoke.status, JSON.stringify(beforeRevoke)).toBe('unchanged');

        // Issuer revokes through the canonical boost revocation path.
        await expect(issuer.invoke.revokeBoostRecipient(boostUri, USERS.b.profileId)).resolves.toBe(
            true
        );

        // The SDK surfaces the revocation as a safe, non-retryable failure…
        const afterRevoke = await holder.invoke.refreshCredential(held, LOCAL_REFRESH_OPTIONS);

        expect(afterRevoke.status).toBe('failed');

        if (afterRevoke.status !== 'failed') throw new Error('Expected failed result');

        expect(afterRevoke.code).toBe('REVOKED');
        expect(afterRevoke.retryable).toBe(false);

        // …and the managed current and history endpoints both return 410.
        const refreshPath = new URL(refreshService.id).pathname;

        const current = await authenticatedRefreshGet(holder, refreshPath);

        expect(current.status).toBe(410);
        expect((await current.json()).code).toBe('CREDENTIAL_REVOKED');

        const history = await authenticatedRefreshGet(holder, `${refreshPath}/history`);

        expect(history.status).toBe(410);

        // The holder's local record and retained encrypted copy are unaffected.
        const [record] = await holder.index.LearnCloud.get({ id: recordId });

        expect(record?.uri).toBe(learnCloudUri);

        const localCopy = (await holder.read.get(learnCloudUri)) as VC;

        expect(localCopy.id).toBe(held.id);
    }, 180_000);
});

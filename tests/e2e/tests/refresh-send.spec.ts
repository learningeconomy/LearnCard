/* eslint-disable @typescript-eslint/no-explicit-any -- cross-package E2E assertions inspect dynamic credential payloads */
import { describe, test, expect, beforeAll, beforeEach } from 'vitest';
import { randomUUID, randomBytes } from 'node:crypto';
import type { ManagedCredentialRefreshReceipt, VC } from '@learncard/types';

import {
    createApiTokenForUser,
    getLearnCardForUser,
    USERS,
    type LearnCard,
} from './helpers/learncard.helpers';

/**
 * LC-2198: refreshable sends through the unified paths.
 *
 * Every refreshable issuance path below is exercised against the real dockerized
 * services with real signing:
 *
 *   SDK send({ refresh: true })  — templateUri, inline template, DID recipient,
 *                                  and the pre-signed handoff (decision 6)
 *   sendBoost({ enableRefresh: true }) — opt-in result shape { credentialUri, refresh }
 *   HTTP POST /api/send          — authenticated API token, signing-authority signed
 *
 * Each lifecycle publishes version 2 using ONLY the returned receipt plus the
 * issuer's own record of the claims — never holder-side state — and the holder
 * refreshes successfully afterwards. Holder-only storage is asserted behaviorally:
 * the issuer cannot resolve the stored plaintext, the holder can.
 */

const BRAIN_BASE_URL = 'http://localhost:4000';

/** SSRF-guard opt-ins for the local docker endpoint (plain HTTP on loopback). */
const LOCAL_REFRESH_OPTIONS = {
    allowInsecureHttp: true,
    allowPrivateAddresses: true,
    resolveHost: async () => ['127.0.0.1'],
} as const;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

type Receipt = ManagedCredentialRefreshReceipt;

const expectValidReceipt = (
    receipt: Receipt | undefined,
    { expectStatus = true }: { expectStatus?: boolean } = {}
): Receipt => {
    expect(receipt, 'refresh-enabled sends must return a receipt').toBeDefined();
    expect(receipt!.refreshId).toBeTruthy();
    expect(receipt!.refreshService?.type).toBe('LearnCardCredentialRefresh2026');
    expect(receipt!.refreshService?.id).toContain('/refresh/');
    expect(receipt!.refreshService?.authorization?.type).toBe('LearnCardDIDAuth');
    expect(receipt!.credentialId).toMatch(/^urn:uuid:/);
    expect(receipt!.issuerDid).toMatch(/^did:/);
    expect(receipt!.holderDid).toMatch(/^did:/);
    // Status allocation is automatic for VCDM 2.0 shapes; the receipt preserves the
    // exact descriptor. VC 1.1 credentials carry no network status entry, and a
    // pre-signed credential is never allocated one.
    if (expectStatus) expect(receipt!.credentialStatus).toBeDefined();

    return receipt!;
};

const setupSigningAuthority = async (lc: LearnCard, prefix: string) => {
    // SA names must be unique per run and at most 15 characters: the signing
    // authority's key is added to the issuer's cached did:web document, and a
    // reused name after a database reset resolves to a stale key ("Key mismatch").
    const name = `${prefix}${randomBytes(4).toString('hex')}`.slice(0, 15);
    const sa = await lc.invoke.createSigningAuthority(name);
    if (!sa) throw new Error(`Failed to create signing authority: ${name}`);

    await lc.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
    await lc.invoke.setPrimaryRegisteredSigningAuthority(sa.endpoint!, sa.name);

    return sa;
};

/** The managed inline JSON-LD context fragment injected at signing time. */
const managedContextFragments = (vc: unknown): any[] => {
    const contexts = (vc as any)?.['@context'];

    if (!Array.isArray(contexts)) return [];

    return contexts.filter(
        entry =>
            typeof entry === 'object' && entry !== null && 'LearnCardCredentialRefresh2026' in entry
    );
};

/**
 * Rebuilds a complete next version from the issuer's own template plus the receipt:
 * same id, issuer, subject, refreshService, and status descriptor; newer timestamp.
 * This mirrors the documented publication flow — no network state is consulted.
 */
const rebuildFromReceipt = (
    template: Record<string, any>,
    receipt: Receipt,
    changes: Record<string, any> = {}
): Record<string, any> => {
    const base = JSON.parse(JSON.stringify(template));
    const isVC2 = JSON.stringify(base['@context']).includes('ns/credentials/v2');

    return {
        ...base,
        ...changes,
        id: receipt.credentialId,
        issuer: receipt.issuerDid,
        ...(isVC2
            ? { validFrom: new Date().toISOString() }
            : { issuanceDate: new Date().toISOString() }),
        ...(receipt.credentialStatus ? { credentialStatus: receipt.credentialStatus } : {}),
        refreshService: receipt.refreshService,
        credentialSubject: { ...base.credentialSubject, id: receipt.holderDid },
    };
};

const claimCredential = async (holder: LearnCard, credentialUri: string) => {
    const incoming = await holder.invoke.getIncomingCredentials();

    expect(incoming.map(credential => credential.uri)).toContain(credentialUri);

    await expect(holder.invoke.acceptCredential(credentialUri)).resolves.toBe(true);
};

/** Ordinary VC 2.0 boost template used by the lifecycle tests. */
const ordinaryTemplate = (name: string, issuerDid: string): Record<string, any> => ({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
        'https://ctx.learncard.com/boosts/1.0.1.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential', 'BoostCredential'],
    issuer: issuerDid,
    name,
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            id: 'urn:uuid:123',
            type: ['Achievement'],
            achievementType: 'Influencer',
            name: 'Awesome Badge',
            description: 'Awesome People Earn Awesome Badge',
            criteria: { narrative: 'Earned by being awesome.' },
        },
    },
});

/** Ordinary credential template without boost vocabulary (like the guide snippets). */
const plainTemplate = (name: string, issuerDid: string): Record<string, any> => ({
    '@context': [
        'https://www.w3.org/ns/credentials/v2',
        'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
    ],
    type: ['VerifiableCredential', 'OpenBadgeCredential'],
    issuer: issuerDid,
    name,
    credentialSubject: {
        type: ['AchievementSubject'],
        achievement: {
            id: 'urn:uuid:5b2d6c4e-1f57-4b9a-9d0f-3a8c2e7f1b10',
            type: ['Achievement'],
            name: 'Introduction to Biology',
            description: 'Grade pending final exam.',
            criteria: { narrative: 'Complete all coursework and the final exam.' },
        },
    },
});

/**
 * Representative credential shapes for the automatic-context proof. All four are
 * signed for real on both initial issuance and update. The Open Badges 3.0.3 context
 * carries the shared subject vocabulary (name, achievement, criteria) so no term is
 * left undefined for the signer; the VCDM version (1.1 vs 2.0) and the credential
 * type (plain VC, OBv3, CLR 2.0) are the dimensions under test. Older/unversioned
 * OB contexts are avoided deliberately: they conflict with VCDM 2.0 protected terms
 * in the native stack.
 */
const CONTEXT_SHAPES: { label: string; template: Record<string, any> }[] = [
    {
        label: 'VC 1.1',
        template: {
            '@context': [
                'https://www.w3.org/2018/credentials/v1',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            type: ['VerifiableCredential'],
            name: 'VC11 Refreshable',
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: { type: ['Achievement'], name: 'VC11 Achievement' },
            },
        },
    },
    {
        label: 'VC 2.0',
        template: {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            type: ['VerifiableCredential'],
            name: 'VC20 Refreshable',
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: { type: ['Achievement'], name: 'VC20 Achievement' },
            },
        },
    },
    {
        label: 'OBv3',
        template: {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
            ],
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            name: 'OBv3 Refreshable',
            credentialSubject: {
                type: ['AchievementSubject'],
                achievement: {
                    id: 'urn:uuid:5b2d6c4e-1f57-4b9a-9d0f-3a8c2e7f1b10',
                    type: ['Achievement'],
                    name: 'Biology',
                    criteria: { narrative: 'Complete the course.' },
                },
            },
        },
    },
    {
        label: 'CLR 2.0',
        template: {
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json',
                'https://purl.imsglobal.org/spec/clr/v2p0/context.json',
            ],
            type: ['VerifiableCredential', 'ClrCredential'],
            name: 'CLR Refreshable',
            credentialSubject: { type: ['ClrSubject'] },
        },
    },
];

describe('Refreshable Sends E2E (LC-2198)', () => {
    let a: LearnCard;
    let b: LearnCard;

    beforeAll(async () => {
        // Recipient profiles must exist before refresh sends can resolve them.
        await getLearnCardForUser('a');
        await getLearnCardForUser('b');
    }, 120_000);

    beforeEach(async () => {
        a = await getLearnCardForUser('a');
        b = await getLearnCardForUser('b');
    }, 120_000);

    test('SDK send with templateUri: full lifecycle from receipt only', async () => {
        const boostUri = await a.invoke.createBoost(
            ordinaryTemplate('TemplateUri Refresh Boost', a.id.did()) as any
        );

        const result = await a.invoke.send({
            type: 'boost',
            recipient: USERS.b.profileId,
            templateUri: boostUri,
            refresh: true,
        } as any);

        // Unified send keeps its normal result shape…
        expect(result.type).toBe('boost');
        expect(result.uri).toBe(boostUri); // `uri` remains the boost URI
        expect(result.credentialUri).toMatch(/^lc:network:/);
        expect(result.activityId).toBeTruthy();
        expect(result.inbox).toBeUndefined();
        // …and adds the issuance receipt.
        const receipt = expectValidReceipt(result.refresh);

        // Holder-only storage: the issuer cannot resolve the stored plaintext; the holder can.
        expect(await a.read.get(result.credentialUri)).toBeUndefined();
        const held = (await b.read.get(result.credentialUri)) as VC;
        expect(held).toBeDefined();

        // Boost membership is preserved.
        await claimCredential(b, result.credentialUri);
        const recipients = await a.invoke.getBoostRecipients(boostUri);
        expect(recipients.map((r: any) => r.to.profileId)).toContain(USERS.b.profileId);

        // Activity correlation: the send's real activityId tracks DELIVERED → CLAIMED
        // (direct profile sends log DELIVERED at send time; CREATED is inbox-only).
        const chain = await a.invoke.getActivityChain({ activityId: result.activityId });
        const eventTypes = chain.map((event: any) => event.eventType);
        expect(eventTypes).toContain('DELIVERED');
        expect(eventTypes).toContain('CLAIMED');

        // The signed v1 carries the managed service and exactly one context fragment,
        // and verifies.
        expect((held as any).refreshService?.id).toBe(receipt.refreshService.id);
        expect(managedContextFragments(held)).toHaveLength(1);
        const verification = await b.invoke.verifyCredential(held);
        expect(verification.errors).toEqual([]);
        expect(verification.checks).toContain('proof');

        // Publish version 2 from the receipt plus the issuer's own template knowledge.
        // The boost URI is part of the issuer's record: keep boostId on the update so
        // boost-authenticity verification stays warning-free.
        const update = rebuildFromReceipt(
            ordinaryTemplate('TemplateUri Refresh Boost', a.id.did()),
            receipt,
            { name: 'TemplateUri Refresh Boost — v2', boostId: boostUri }
        );
        const signedUpdate = await a.invoke.issueCredential(update as any);

        // The update's context was prepared automatically before signing.
        expect(managedContextFragments(signedUpdate)).toHaveLength(1);

        const publication = await a.invoke.publishCredentialRefresh({
            mode: 'issuer-signed',
            refreshId: receipt.refreshId,
            signedCredential: signedUpdate,
            updateSummary: 'lifecycle v2',
        });

        expect(publication.version).toBe(2);

        // Stable identity/service/status across versions.
        const refreshed = await b.invoke.refreshCredential(held, LOCAL_REFRESH_OPTIONS);
        expect(refreshed.status, JSON.stringify(refreshed)).toBe('updated');
        if (refreshed.status !== 'updated') throw new Error('expected updated');

        expect(refreshed.managedVersion).toBe(2);
        expect((refreshed.credential as any).id).toBe(receipt.credentialId);
        expect((refreshed.credential as any).issuer).toBe(receipt.issuerDid);
        expect((refreshed.credential as any).refreshService.id).toBe(receipt.refreshService.id);
        expect((refreshed.credential as any).credentialStatus).toEqual(receipt.credentialStatus);

        // A recheck against the new current version reports no further change.
        const recheck = await b.invoke.refreshCredential(
            refreshed.credential as VC,
            LOCAL_REFRESH_OPTIONS
        );
        expect(recheck.status).toBe('unchanged');
    }, 180_000);

    test('SDK send with inline template: one boost created, full lifecycle', async () => {
        // Boost authenticity must remain verifiable after inline issuance and refresh.
        const template = ordinaryTemplate('Inline Refresh Boost', a.id.did());
        const boostsBefore = await a.invoke.countBoosts();

        const result = await a.invoke.send({
            type: 'boost',
            recipient: USERS.b.profileId,
            template: {
                credential: template,
                name: 'Inline Refresh Boost',
                category: 'Achievement',
            },
            refresh: true,
        } as any);

        const receipt = expectValidReceipt(result.refresh);

        // The boost was created from the same template — exactly one source of truth.
        const boost = await a.invoke.getBoost(result.uri);
        expect(boost.name).toBe('Inline Refresh Boost');
        expect(await a.invoke.countBoosts()).toBe(boostsBefore + 1);

        await claimCredential(b, result.credentialUri);

        const held = (await b.read.get(result.credentialUri)) as VC;
        expect(managedContextFragments(held)).toHaveLength(1);

        expect((held as any).boostId).toBe(result.uri);
        const verification = await b.invoke.verifyCredential(held);
        expect(verification.warnings).toEqual([]);
        expect(verification.errors).toEqual([]);

        const update = rebuildFromReceipt(template, receipt, {
            name: 'Inline Refresh Boost — v2',
            boostId: result.uri,
        });
        const publication = await a.invoke.publishCredentialRefresh({
            mode: 'issuer-signed',
            refreshId: receipt.refreshId,
            signedCredential: await a.invoke.issueCredential(update as any),
        });

        expect(publication.version).toBe(2);

        const refreshed = await b.invoke.refreshCredential(held, LOCAL_REFRESH_OPTIONS);
        expect(refreshed.status).toBe('updated');
        if (refreshed.status === 'updated') {
            expect(refreshed.managedVersion).toBe(2);
        }
    }, 180_000);

    test('SDK send to a local DID recipient: receipt holder is the recipient DID', async () => {
        const bProfile = await b.invoke.getProfile();
        const boostUri = await a.invoke.createBoost(
            ordinaryTemplate('DID Recipient Boost', a.id.did()) as any
        );

        const result = await a.invoke.send({
            type: 'boost',
            recipient: bProfile!.did,
            templateUri: boostUri,
            refresh: true,
        } as any);

        const receipt = expectValidReceipt(result.refresh);
        expect(receipt.holderDid).toBe(bProfile!.did);

        await claimCredential(b, result.credentialUri);

        const held = (await b.read.get(result.credentialUri)) as VC;
        expect(held.credentialSubject as any).toMatchObject({ id: bProfile!.did });
    }, 120_000);

    test('email, phone, and remote DID refresh requests fail clearly', async () => {
        const boostUri = await a.invoke.createBoost(
            ordinaryTemplate('Rejection Boost', a.id.did()) as any
        );
        const sentBefore = (await a.invoke.getSentCredentials()).length;

        // Email and phone are rejected client-side before any request is made.
        await expect(
            a.invoke.send({
                type: 'boost',
                recipient: 'refresh-reject@example.com',
                templateUri: boostUri,
                refresh: true,
            } as any)
        ).rejects.toThrow(/refresh/i);

        await expect(
            a.invoke.send({
                type: 'boost',
                recipient: '+15550000000',
                templateUri: boostUri,
                refresh: true,
            } as any)
        ).rejects.toThrow(/refresh/i);

        // A remote DID is rejected by the server's authoritative guard.
        await expect(
            a.invoke.send({
                type: 'boost',
                recipient: 'did:web:example.com',
                templateUri: boostUri,
                refresh: true,
            } as any)
        ).rejects.toThrow(/profile not found|resolvable to a local profile/i);

        // No delivery, activity, or sent-credential writes happened for the issuer.
        expect((await a.invoke.getSentCredentials()).length).toBe(sentBefore);
        expect((await a.invoke.getBoostRecipients(boostUri)).length).toBe(0);
    }, 120_000);

    test('pre-signed handoff: accepted via SDK, replay idempotent over HTTP, rejected without allocation', async () => {
        const boostUri = await a.invoke.createBoost(
            ordinaryTemplate('Handoff Refresh Boost', a.id.did()) as any
        );
        const bDid = (await b.invoke.getProfile())!.did;

        // Decision 6, SDK layer: allocate first, sign with the allocated service, then
        // hand the signed credential to send() — forwarded untouched, no re-sign.
        const buildRefreshable = async () => {
            const credentialId = `urn:uuid:${randomUUID()}`;
            const template = ordinaryTemplate('Handoff Refresh Boost', a.id.did());

            const allocation = await a.invoke.allocateCredentialRefresh({
                holder: { profileId: USERS.b.profileId, did: bDid },
                credentialId,
            });

            return a.invoke.issueCredential({
                ...template,
                id: credentialId,
                issuer: a.id.did(),
                validFrom: new Date().toISOString(),
                refreshService: allocation.refreshService,
                credentialSubject: {
                    ...template.credentialSubject,
                    id: bDid,
                },
            } as any);
        };

        const signed = await buildRefreshable();

        // The context was injected automatically before signing.
        expect(managedContextFragments(signed)).toHaveLength(1);

        const first = await a.invoke.send({
            type: 'boost',
            recipient: USERS.b.profileId,
            templateUri: boostUri,
            signedCredential: signed,
            refresh: true,
        } as any);
        expect(first.uri).toBe(boostUri);
        // A pre-signed credential carries no network status allocation (only the
        // send/sendBoost signing paths allocate one), so the receipt has no status.
        const receipt = expectValidReceipt(first.refresh, { expectStatus: false });
        expect(receipt.credentialId).toBe((signed as any).id);

        // Exactly one incoming offer before claiming; claiming consumes it.
        const incomingBefore = await b.invoke.getIncomingCredentials();
        expect(
            incomingBefore.filter((credential: any) => credential.uri === first.credentialUri)
        ).toHaveLength(1);
        await expect(b.invoke.acceptCredential(first.credentialUri)).resolves.toBe(true);
        expect(await b.read.get(first.credentialUri)).toEqual(signed);

        // Decision 6, HTTP layer: the exact same pre-signed request is idempotent —
        // the server resumes the original delivery instead of duplicating it.
        const httpSigned = await buildRefreshable();
        const body = {
            type: 'boost',
            recipient: USERS.b.profileId,
            templateUri: boostUri,
            signedCredential: httpSigned,
            refresh: true,
        };

        const { token } = await createApiTokenForUser('a', 'boosts:write credentials:write');
        const postHandoff = () =>
            fetch(`${BRAIN_BASE_URL}/api/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

        const firstResponse = await postHandoff();
        expect(firstResponse.status).toBe(200);
        const firstHandoff = await firstResponse.json();
        expectValidReceipt(firstHandoff.refresh, { expectStatus: false });
        expect(firstHandoff.credentialUri).toMatch(/^lc:network:/);

        const replayResponse = await postHandoff();
        expect(replayResponse.status).toBe(200);
        const replay = await replayResponse.json();
        expect(replay.credentialUri).toBe(firstHandoff.credentialUri);
        expect(replay.activityId).toBe(firstHandoff.activityId);

        // A signed credential WITHOUT an allocated managed service is rejected —
        // no unsigned fallback, no boost auto-creation for refresh sends.
        const unmanaged = await a.invoke.issueCredential({
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiableCredential'],
            issuer: a.id.did(),
            validFrom: new Date().toISOString(),
            name: 'No Service',
            credentialSubject: { id: bDid },
        } as any);

        await expect(
            a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                signedCredential: unmanaged,
                refresh: true,
            } as any)
        ).rejects.toThrow(/managed refresh service/i);
    }, 240_000);

    test('self-send works and suppresses the initial credential notification', async () => {
        const boostUri = await a.invoke.createBoost(
            ordinaryTemplate('Self Send Boost', a.id.did()) as any
        );

        const result = await a.invoke.send({
            type: 'boost',
            recipient: USERS.a.profileId,
            templateUri: boostUri,
            refresh: true,
        } as any);

        expectValidReceipt(result.refresh);
        expect(result.activityId).toBeTruthy();

        // Give any (suppressed) notification a fair chance to show up, then assert none.
        await delay(6_000);

        const notifications = await a.invoke.getNotifications({ limit: 50 });
        const initial = (notifications?.notifications ?? []).filter(
            (notification: any) =>
                notification.type === 'CREDENTIAL_RECEIVED' &&
                (notification.data?.vcUris ?? []).includes(result.credentialUri)
        );
        expect(initial).toHaveLength(0);
    }, 120_000);

    test('sendBoost with enableRefresh: opt-in result shape and full lifecycle', async () => {
        const boostUri = await a.invoke.createBoost(
            ordinaryTemplate('SendBoost Refresh Boost', a.id.did()) as any
        );

        const sent = await a.invoke.sendBoost(USERS.b.profileId, boostUri, {
            enableRefresh: true,
        } as any);

        // Opt-in shape: object with the issued credential and the receipt.
        expect(typeof sent).toBe('object');
        const { credentialUri, refresh } = sent as any;
        expect(credentialUri).toMatch(/^lc:network:/);
        const receipt = expectValidReceipt(refresh);

        await claimCredential(b, credentialUri);

        const held = (await b.read.get(credentialUri)) as VC;
        expect(managedContextFragments(held)).toHaveLength(1);

        // Publish version 2 from the receipt only; the holder refreshes in place.
        const update = rebuildFromReceipt(
            ordinaryTemplate('SendBoost Refresh Boost', a.id.did()),
            receipt,
            { name: 'SendBoost Refresh Boost — v2', boostId: boostUri }
        );
        await expect(
            a.invoke.publishCredentialRefresh({
                mode: 'issuer-signed',
                refreshId: receipt.refreshId,
                signedCredential: await a.invoke.issueCredential(update as any),
            })
        ).resolves.toMatchObject({ version: 2 });

        const refreshed = await b.invoke.refreshCredential(held, LOCAL_REFRESH_OPTIONS);
        expect(refreshed.status).toBe('updated');
        if (refreshed.status === 'updated') {
            expect((refreshed.credential as any).name).toContain('v2');
        }

        // Legacy callers still get the plain URI string.
        const anotherBoost = await a.invoke.createBoost(
            ordinaryTemplate('SendBoost Legacy Boost', a.id.did()) as any
        );
        expect(await a.invoke.sendBoost(USERS.b.profileId, anotherBoost)).toBeTypeOf('string');
    }, 180_000);

    test('authenticated HTTP /api/send: signing-authority lifecycle from receipt only', async () => {
        const sa = await setupSigningAuthority(a, 'rs');
        const { token } = await createApiTokenForUser('a', 'boosts:write credentials:write');
        // SA registration adds its key to the issuer's did:web document. The module
        // level DID resolver cache may still hold the pre-registration copy (earlier
        // tests resolve the same document), which would make every SA-signed proof
        // unverifiable ("No applicable proof"). Force one authoritative refresh.
        await (b.invoke as any).resolveDid((await a.invoke.getProfile())!.did, { noCache: true });
        const boostUri = await a.invoke.createBoost(
            ordinaryTemplate('HTTP SA Refresh Boost', a.id.did()) as any
        );

        const response = await fetch(`${BRAIN_BASE_URL}/api/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                refresh: true,
            }),
        });

        expect(response.status).toBe(200);
        const result = await response.json();

        expect(result.type).toBe('boost');
        expect(result.uri).toBe(boostUri);
        expect(result.credentialUri).toMatch(/^lc:network:/);
        expect(result.activityId).toBeTruthy();
        const receipt = expectValidReceipt(result.refresh);
        // The signing authority signed as the issuer's delegate: the signed identity
        // is the issuer profile's network DID.
        expect(receipt.issuerDid).toBe((await a.invoke.getProfile())!.did);

        await claimCredential(b, result.credentialUri);

        // The issuer cannot read the stored plaintext; the holder can.
        expect(await a.read.get(result.credentialUri)).toBeUndefined();
        const held = (await b.read.get(result.credentialUri)) as VC;
        // Proof verification method is the issuer's network DID delegated to the SA.
        expect(String((held.proof as any).verificationMethod)).toContain(receipt.issuerDid);

        // Publish version 2 through the same signing authority: an UNSIGNED body —
        // the network injects the managed context before the SA signs.
        const update = rebuildFromReceipt(
            ordinaryTemplate('HTTP SA Refresh Boost', a.id.did()),
            receipt,
            { name: 'HTTP SA Refresh Boost — v2', boostId: boostUri }
        );

        const publication = await a.invoke.publishCredentialRefresh({
            mode: 'signing-authority',
            refreshId: receipt.refreshId,
            credential: update as any,
            signingAuthority: { type: 'http', endpoint: sa.endpoint!, name: sa.name! },
        });

        expect(publication.version).toBe(2);

        const refreshed = await b.invoke.refreshCredential(held, LOCAL_REFRESH_OPTIONS);
        expect(refreshed.status, JSON.stringify(refreshed)).toBe('updated');
        if (refreshed.status !== 'updated') throw new Error('expected updated');

        expect(refreshed.managedVersion).toBe(2);
        expect((refreshed.credential as any).issuer).toBe(receipt.issuerDid);
        expect((refreshed.credential as any).credentialStatus).toEqual(receipt.credentialStatus);
        expect(managedContextFragments(refreshed.credential)).toHaveLength(1);
        const v2Verification = await b.invoke.verifyCredential(refreshed.credential as VC);
        expect(v2Verification.errors).toEqual([]);
        expect(v2Verification.checks).toContain('proof');
    }, 240_000);

    test('HTTP /api/send: refresh requires credentials:write; email always rejected', async () => {
        await setupSigningAuthority(a, 'rss');
        const boostUri = await a.invoke.createBoost(
            ordinaryTemplate('HTTP Scope Boost', a.id.did()) as any
        );
        const { token: restrictedToken } = await createApiTokenForUser('a', 'boosts:write');

        // boosts:write alone is not enough for a refresh send.
        const restricted = await fetch(`${BRAIN_BASE_URL}/api/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${restrictedToken}`,
            },
            body: JSON.stringify({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
                refresh: true,
            }),
        });
        expect(restricted.status).toBe(401);
        expect(await restricted.text()).toMatch(/credentials:write/);

        // The same token still sends non-refreshable credentials (compatibility).
        const ordinary = await fetch(`${BRAIN_BASE_URL}/api/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${restrictedToken}`,
            },
            body: JSON.stringify({
                type: 'boost',
                recipient: USERS.b.profileId,
                templateUri: boostUri,
            }),
        });
        expect(ordinary.status).toBe(200);
        const ordinaryResult = await ordinary.json();
        expect(ordinaryResult.refresh).toBeUndefined();

        // Email recipients are rejected at the REST boundary before anything is created.
        const { token: scopedToken } = await createApiTokenForUser(
            'a',
            'boosts:write credentials:write'
        );
        const email = await fetch(`${BRAIN_BASE_URL}/api/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${scopedToken}`,
            },
            body: JSON.stringify({
                type: 'boost',
                recipient: 'refresh-http-reject@example.com',
                templateUri: boostUri,
                refresh: true,
            }),
        });
        expect(email.status).toBe(400);
        expect(await email.text()).toMatch(/refresh/i);
    }, 180_000);

    test.each(CONTEXT_SHAPES)(
        '$label: managed context injected on issuance and update',
        async ({ label, template }) => {
            const result = await a.invoke.send({
                type: 'boost',
                recipient: USERS.b.profileId,
                template: {
                    credential: { ...template, issuer: a.id.did() },
                    name: `${label} Context Boost`,
                    category: 'Achievement',
                },
                refresh: true,
            } as any);

            const receipt = expectValidReceipt(result.refresh, {
                expectStatus: label !== 'VC 1.1',
            });

            await claimCredential(b, result.credentialUri);

            // Initial issuance: exactly one managed fragment next to the standard ones.
            const held = (await b.read.get(result.credentialUri)) as VC;
            expect(managedContextFragments(held)).toHaveLength(1);
            const issuanceVerification = await b.invoke.verifyCredential(held);
            expect(issuanceVerification.errors).toEqual([]);
            expect(issuanceVerification.checks).toContain('proof');

            // Update: the rebuild + signing path injects the same fragment exactly once.
            const update = rebuildFromReceipt(template, receipt, {
                name: `${label} Refreshable — v2`,
            });
            const signedUpdate = await a.invoke.issueCredential(update as any);
            expect(managedContextFragments(signedUpdate)).toHaveLength(1);

            await expect(
                a.invoke.publishCredentialRefresh({
                    mode: 'issuer-signed',
                    refreshId: receipt.refreshId,
                    signedCredential: signedUpdate,
                })
            ).resolves.toMatchObject({ version: 2 });
        },
        240_000
    );
});

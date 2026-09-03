import { vi } from 'vitest';
import { VC, UnsignedVC, LCNNotification } from '@learncard/types';

import { neogma } from '@instance';

import { getClient, getUser } from './helpers/getClient';
import { addNotificationToQueueSpy } from './helpers/spies';
import * as Notifications from '@helpers/notifications.helpers';
import {
    computeCredentialMaterialDigest,
    computeCredentialRefreshDeliveryKey,
    computeCredentialRefreshRouteKey,
    decideCredentialRefreshNotification,
    getCredentialRefreshNotificationWindowHours,
} from '@helpers/credential-refresh-materiality.helpers';
import { getCredentialRefresh, setCredentialRefreshState } from '@accesslayer/credential-refresh';

/**
 * Task 12 (LC-2136): materiality classification and privacy-safe refresh events.
 *
 * - Materiality: canonical user-visible projection decides; issuer overrides win.
 * - Events: opaque metadata only (refreshId, version, route key, delivery-window
 *   key). No credential subject/body/title/summary content may leave brain-service.
 * - Collapse: repeats inside the configured delivery window reuse the same delivery
 *   key; a new configured window produces a new key.
 */

const runQuery = async (cypher: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(cypher, params);

// ---------------------------------------------------------------------------
// Unit: materiality projection + digest + decision
// ---------------------------------------------------------------------------

const BASE_CREDENTIAL: Record<string, unknown> = {
    '@context': ['https://www.w3.org/ns/credentials/v2'],
    id: 'urn:uuid:materiality-credential',
    type: ['VerifiableCredential'],
    issuer: 'did:key:z6Mkissuer',
    issuanceDate: '2026-01-01T00:00:00Z',
    validFrom: '2026-01-01T00:00:00Z',
    validUntil: '2027-01-01T00:00:00Z',
    name: 'Transcript',
    description: 'Annual transcript',
    credentialSubject: {
        id: 'did:key:z6Mkholder',
        achievement: { name: 'Algebra I', result: 'Pass' },
    },
    evidence: [{ type: 'Evidence', name: 'Report card' }],
    refreshService: { id: 'https://example.com/refresh/abc', type: '1EdTechCredentialRefresh' },
    credentialStatus: {
        id: 'https://status.example.com/lists/42#7',
        type: 'BitstringStatusListEntry',
        statusPurpose: 'revocation',
        statusListIndex: '7',
        statusListCredential: 'https://status.example.com/lists/42',
    },
    proof: { type: 'DataIntegrityProof', proofValue: 'z3FXQjecWufY46yg5abdJjZsM' },
};

const digestOf = (overrides: Record<string, unknown>): string =>
    computeCredentialMaterialDigest({ ...BASE_CREDENTIAL, ...overrides });

describe('credential refresh materiality (unit)', () => {
    it('treats user-visible content changes as material', () => {
        const baseDigest = digestOf({});

        // Claim change
        expect(
            digestOf({
                credentialSubject: {
                    id: 'did:key:z6Mkholder',
                    achievement: { name: 'Algebra I', result: 'Distinction' },
                },
            })
        ).not.toEqual(baseDigest);

        // Title / name change
        expect(digestOf({ name: 'Final Transcript' })).not.toEqual(baseDigest);

        // Description change
        expect(digestOf({ description: 'Amended annual transcript' })).not.toEqual(baseDigest);

        // Evidence change
        expect(
            digestOf({ evidence: [{ type: 'Evidence', name: 'Updated report card' }] })
        ).not.toEqual(baseDigest);

        // Attachment-style content change
        expect(
            digestOf({ attachment: { type: 'Document', name: 'Transcript PDF', hash: 'abc' } })
        ).not.toEqual(baseDigest);

        // User-visible expiration change
        expect(digestOf({ validUntil: '2028-01-01T00:00:00Z' })).not.toEqual(baseDigest);
        expect(digestOf({ expirationDate: '2028-01-01T00:00:00Z' })).not.toEqual(baseDigest);
    });

    it('treats mechanism and identity fields as non-material', () => {
        const baseDigest = digestOf({});

        // Proof changes on every re-issue
        expect(
            digestOf({ proof: { type: 'DataIntegrityProof', proofValue: 'zDifferent' } })
        ).toEqual(baseDigest);

        // Identifiers are identity invariants, not content
        expect(digestOf({ id: 'urn:uuid:other-id' })).toEqual(baseDigest);
        expect(digestOf({ issuer: 'did:key:z6Mkother' })).toEqual(baseDigest);

        // Issuance-only timestamp changes
        expect(digestOf({ issuanceDate: '2026-02-01T00:00:00Z' })).toEqual(baseDigest);
        expect(digestOf({ validFrom: '2026-02-01T00:00:00Z' })).toEqual(baseDigest);

        // refreshService mechanism descriptor
        expect(
            digestOf({
                refreshService: {
                    id: 'https://example.com/refresh/rotated',
                    type: '1EdTechCredentialRefresh',
                },
            })
        ).toEqual(baseDigest);

        // credentialStatus mechanism descriptors (revocation moves through its own
        // lifecycle notifications)
        expect(
            digestOf({
                credentialStatus: {
                    id: 'https://status.example.com/lists/99#3',
                    type: 'BitstringStatusListEntry',
                    statusPurpose: 'revocation',
                    statusListIndex: '3',
                    statusListCredential: 'https://status.example.com/lists/99',
                },
            })
        ).toEqual(baseDigest);
    });

    it('canonicalizes key order so semantically identical content hashes identically', () => {
        const reordered: Record<string, unknown> = {};
        for (const key of Object.keys(BASE_CREDENTIAL).reverse()) {
            reordered[key] = BASE_CREDENTIAL[key];
        }

        expect(computeCredentialMaterialDigest(reordered)).toEqual(digestOf({}));
    });

    it('lets issuer overrides force or suppress regardless of classification', () => {
        // Same digest = automatically non-material, but true forces
        expect(
            decideCredentialRefreshNotification({
                state: 'active',
                notifyHolder: true,
                previousDigest: 'same',
                nextDigest: 'same',
            })
        ).toEqual('queued');

        // Different digest = automatically material, but false suppresses
        expect(
            decideCredentialRefreshNotification({
                state: 'active',
                notifyHolder: false,
                previousDigest: 'before',
                nextDigest: 'after',
            })
        ).toEqual('suppressed');

        // Unset defers to the material comparison
        expect(
            decideCredentialRefreshNotification({
                state: 'active',
                previousDigest: 'before',
                nextDigest: 'after',
            })
        ).toEqual('queued');
        expect(
            decideCredentialRefreshNotification({
                state: 'active',
                previousDigest: 'same',
                nextDigest: 'same',
            })
        ).toEqual('suppressed');

        // Non-active aggregates never notify at publish time
        expect(
            decideCredentialRefreshNotification({
                state: 'awaiting_claim',
                notifyHolder: true,
                previousDigest: 'before',
                nextDigest: 'after',
            })
        ).toEqual('not-applicable');
    });

    it('derives opaque route and delivery-window keys from a server-keyed HMAC', () => {
        const at = new Date('2026-09-02T12:00:00Z');

        const routeKey = computeCredentialRefreshRouteKey('refresh-abc');
        const deliveryKey = computeCredentialRefreshDeliveryKey('refresh-abc', at, 24);

        // Stable for the same inputs
        expect(computeCredentialRefreshRouteKey('refresh-abc')).toEqual(routeKey);
        expect(computeCredentialRefreshDeliveryKey('refresh-abc', at, 24)).toEqual(deliveryKey);

        // Same window bucket = same delivery key; different bucket = different key
        const sameWindow = new Date('2026-09-02T18:30:00Z');
        const nextWindow = new Date('2026-09-03T12:00:00Z');
        expect(computeCredentialRefreshDeliveryKey('refresh-abc', sameWindow, 24)).toEqual(
            deliveryKey
        );
        expect(computeCredentialRefreshDeliveryKey('refresh-abc', nextWindow, 24)).not.toEqual(
            deliveryKey
        );

        // A new configured window creates a new key
        expect(computeCredentialRefreshDeliveryKey('refresh-abc', at, 1)).not.toEqual(deliveryKey);

        // Route key is window-independent and per-refresh
        expect(computeCredentialRefreshRouteKey('refresh-xyz')).not.toEqual(routeKey);
        expect(computeCredentialRefreshDeliveryKey('refresh-xyz', at, 24)).not.toEqual(deliveryKey);

        // Opaque: base64url digests that never embed the raw refreshId
        for (const key of [routeKey, deliveryKey]) {
            expect(key).toMatch(/^[A-Za-z0-9_-]+$/);
            expect(key).not.toContain('refresh-abc');
        }
    });

    it('reads the delivery window from configuration with a 24-hour default', () => {
        const previous = process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;

        try {
            delete process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;
            expect(getCredentialRefreshNotificationWindowHours()).toEqual(24);

            process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS = '12';
            expect(getCredentialRefreshNotificationWindowHours()).toEqual(12);

            process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS = 'not-a-number';
            expect(getCredentialRefreshNotificationWindowHours()).toEqual(24);
        } finally {
            if (previous === undefined) {
                delete process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;
            } else {
                process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS = previous;
            }
        }
    });
});

// ---------------------------------------------------------------------------
// Integration: privacy-safe event emission on publication
// ---------------------------------------------------------------------------

const ISSUER_PROFILE_ID = 'refresh-notify-issuer';
const HOLDER_PROFILE_ID = 'refresh-notify-holder';
const CREDENTIAL_ID = 'urn:uuid:refreshable-credential-notify';

// Marker strings that must never appear in a notification payload
const SECRET_TITLE_MARKER = 'SECRET-TITLE-MARKER-9f8e7d';
const SECRET_CLAIM_MARKER = 'SECRET-CLAIM-MARKER-1a2b3c';
const SECRET_SUMMARY_MARKER = 'SECRET-SUMMARY-MARKER-4d5e6f';

type AllocationResult = {
    refreshId: string;
    refreshService: { id: string; type: string; authorization?: { type: string } };
};

type PublishResult = {
    refreshId: string;
    version: number;
    publishedAt: string;
    notification: 'queued' | 'suppressed' | 'not-applicable';
};

let issuer: Awaited<ReturnType<typeof getUser>>;
let holder: Awaited<ReturnType<typeof getUser>>;

const allocate = async (): Promise<AllocationResult> =>
    issuer.clients.fullAuth.credentialRefresh.allocateCredentialRefresh({
        holder: { profileId: HOLDER_PROFILE_ID, did: holder.learnCard.id.did() },
        credentialId: CREDENTIAL_ID,
    });

const buildUnsignedCredential = (
    allocation: AllocationResult,
    overrides: Record<string, unknown> = {}
): UnsignedVC =>
    ({
        // Inline context defines the 1EdTech refresh + LearnCard auth extension terms
        // (JSON-LD data-loss detection otherwise refuses to sign).
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            {
                '1EdTechCredentialRefresh':
                    'https://purl.imsglobal.org/spec/ob/v3p0#1EdTechCredentialRefresh',
                authorization: {
                    '@id': 'https://purl.imsglobal.org/spec/ob/v3p0#authorization',
                    '@context': {
                        LearnCardDIDAuth: 'https://docs.learncard.com/definitions#LearnCardDIDAuth',
                    },
                },
            },
        ],
        id: CREDENTIAL_ID,
        type: ['VerifiableCredential'],
        issuer: issuer.learnCard.id.did(),
        validFrom: '2026-01-01T00:00:00Z',
        name: 'Original Transcript',
        credentialSubject: { id: holder.learnCard.id.did() },
        refreshService: allocation.refreshService,
        ...overrides,
    } as UnsignedVC);

const signAs = async (
    user: Awaited<ReturnType<typeof getUser>>,
    unsigned: UnsignedVC
): Promise<VC> => user.learnCard.invoke.issueCredential(unsigned);

const sendOriginal = async (): Promise<{ allocation: AllocationResult; credential: VC }> => {
    const allocation = await allocate();
    const credential = await signAs(issuer, buildUnsignedCredential(allocation));

    await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
        refreshId: allocation.refreshId,
        credential,
    });

    return { allocation, credential };
};

const publishIssuerSigned = async (
    refreshId: string,
    credential: VC,
    extras: Record<string, unknown> = {}
): Promise<PublishResult> =>
    issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
        mode: 'issuer-signed',
        refreshId,
        signedCredential: credential,
        ...extras,
    } as Parameters<typeof issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh>[0]);

/** All CREDENTIAL_REFRESHED events observed by the queue spy */
const getRefreshEvents = (): LCNNotification[] =>
    addNotificationToQueueSpy.mock.calls
        .map(call => call[0] as LCNNotification)
        .filter(notification => notification.type === 'CREDENTIAL_REFRESHED');

describe('credential refresh notification events', () => {
    beforeAll(async () => {
        issuer = await getUser('d'.repeat(64));
        holder = await getUser('b'.repeat(64));

        vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
            addNotificationToQueueSpy
        );

        await runQuery(
            'CREATE CONSTRAINT credential_refresh_id_unique IF NOT EXISTS FOR (r:CredentialRefresh) REQUIRE (r.refreshId) IS UNIQUE'
        );
        await runQuery(
            'CREATE CONSTRAINT credential_refresh_version_key_unique IF NOT EXISTS FOR (c:Credential) REQUIRE (c.refreshVersionKey) IS UNIQUE'
        );
    });

    beforeEach(async () => {
        await runQuery('MATCH (r:CredentialRefresh) DETACH DELETE r');
        await runQuery('MATCH (c:Credential) DETACH DELETE c');
        await runQuery('MATCH (p:Profile) DETACH DELETE p');

        await issuer.clients.fullAuth.profile.createProfile({ profileId: ISSUER_PROFILE_ID });
        await holder.clients.fullAuth.profile.createProfile({ profileId: HOLDER_PROFILE_ID });

        addNotificationToQueueSpy.mockReset();
    });

    afterEach(() => {
        delete process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS;
    });

    it('enqueues an opaque event for the first material update in a window', async () => {
        const { allocation } = await sendOriginal();
        await setCredentialRefreshState(allocation.refreshId, 'active');

        // The published credential is full of marker content that must stay private.
        // (`achievement` is not defined by the VCDM 2.0 context, so it is mapped
        // inline alongside the refresh terms — data-loss detection otherwise
        // refuses to sign.)
        const updated = await signAs(
            issuer,
            buildUnsignedCredential(allocation, {
                '@context': [
                    'https://www.w3.org/ns/credentials/v2',
                    {
                        '1EdTechCredentialRefresh':
                            'https://purl.imsglobal.org/spec/ob/v3p0#1EdTechCredentialRefresh',
                        authorization: {
                            '@id': 'https://purl.imsglobal.org/spec/ob/v3p0#authorization',
                            '@context': {
                                LearnCardDIDAuth:
                                    'https://docs.learncard.com/definitions#LearnCardDIDAuth',
                            },
                        },
                        achievement: 'https://purl.imsglobal.org/spec/ob/v3p0#Achievement',
                    },
                ],
                validFrom: '2026-02-01T00:00:00Z',
                name: SECRET_TITLE_MARKER,
                credentialSubject: {
                    id: holder.learnCard.id.did(),
                    achievement: { name: SECRET_CLAIM_MARKER },
                },
            })
        );

        const result = await publishIssuerSigned(allocation.refreshId, updated, {
            updateSummary: SECRET_SUMMARY_MARKER,
        });

        expect(result.version).toEqual(2);
        expect(result.notification).toEqual('queued');

        const events = getRefreshEvents();
        expect(events).toHaveLength(1);

        const event = events[0]!;
        expect(event.type).toEqual('CREDENTIAL_REFRESHED');

        // Opaque routing metadata only: refreshId, version, route key, delivery key.
        const metadata = event.data?.metadata as Record<string, unknown> | undefined;
        expect(metadata).toBeTruthy();
        expect(Object.keys(metadata!).sort()).toEqual([
            'deliveryKey',
            'refreshId',
            'routeKey',
            'version',
        ]);
        expect(metadata!.refreshId).toEqual(allocation.refreshId);
        expect(metadata!.version).toEqual(2);
        expect(typeof metadata!.routeKey).toEqual('string');
        expect(typeof metadata!.deliveryKey).toEqual('string');

        // Addressed to the holder, from the issuer
        expect(typeof event.to).not.toEqual('string');
        expect((event.to as { did?: string }).did).toEqual(holder.learnCard.id.did());

        // No credential subject/body/title/summary content leaves brain-service.
        const serialized = JSON.stringify(event);
        expect(serialized).not.toContain(SECRET_TITLE_MARKER);
        expect(serialized).not.toContain(SECRET_CLAIM_MARKER);
        expect(serialized).not.toContain(SECRET_SUMMARY_MARKER);
        expect(serialized).not.toContain(CREDENTIAL_ID);
        expect(serialized).not.toContain('credentialSubject');
        expect(event.data?.vcUris).toBeUndefined();

        // Generic translated copy only — no implementation jargon.
        expect(event.message?.title).toBeTruthy();
        const copy = `${event.message?.title ?? ''} ${event.message?.body ?? ''}`.toLowerCase();
        expect(copy).not.toContain('refresh');
        expect(copy).not.toContain('sync');
        expect(copy).not.toContain('managed version');

        // The emission is recorded on the aggregate for retry/observability.
        const aggregate = await getCredentialRefresh(allocation.refreshId);
        expect(aggregate?.notificationWindowKey).toEqual(metadata!.deliveryKey);
        expect(aggregate?.lastNotificationId).toBeTruthy();
        expect(aggregate?.lastNotificationAt).toBeTruthy();
    });

    it('reuses the same delivery key for repeat material updates inside the window', async () => {
        const { allocation } = await sendOriginal();
        await setCredentialRefreshState(allocation.refreshId, 'active');

        const v2 = await signAs(
            issuer,
            buildUnsignedCredential(allocation, {
                validFrom: '2026-02-01T00:00:00Z',
                name: 'Second Transcript',
            })
        );
        await publishIssuerSigned(allocation.refreshId, v2);

        const v3 = await signAs(
            issuer,
            buildUnsignedCredential(allocation, {
                validFrom: '2026-03-01T00:00:00Z',
                name: 'Third Transcript',
            })
        );
        await publishIssuerSigned(allocation.refreshId, v3);

        const events = getRefreshEvents();
        expect(events).toHaveLength(2);

        const first = events[0]!.data?.metadata as Record<string, unknown>;
        const second = events[1]!.data?.metadata as Record<string, unknown>;

        expect(first.version).toEqual(2);
        expect(second.version).toEqual(3);
        expect(second.deliveryKey).toEqual(first.deliveryKey);
        expect(second.routeKey).toEqual(first.routeKey);
    });

    it('creates a new delivery key when the configured window changes', async () => {
        const { allocation } = await sendOriginal();
        await setCredentialRefreshState(allocation.refreshId, 'active');

        process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS = '24';

        const v2 = await signAs(
            issuer,
            buildUnsignedCredential(allocation, {
                validFrom: '2026-02-01T00:00:00Z',
                name: 'Window 24 Version',
            })
        );
        await publishIssuerSigned(allocation.refreshId, v2);

        process.env.CREDENTIAL_REFRESH_NOTIFICATION_WINDOW_HOURS = '1';

        const v3 = await signAs(
            issuer,
            buildUnsignedCredential(allocation, {
                validFrom: '2026-03-01T00:00:00Z',
                name: 'Window 1 Version',
            })
        );
        await publishIssuerSigned(allocation.refreshId, v3);

        const events = getRefreshEvents();
        expect(events).toHaveLength(2);

        const first = events[0]!.data?.metadata as Record<string, unknown>;
        const second = events[1]!.data?.metadata as Record<string, unknown>;

        expect(second.deliveryKey).not.toEqual(first.deliveryKey);
        expect(second.routeKey).toEqual(first.routeKey);
    });

    it('enqueues nothing for non-material updates', async () => {
        const { allocation } = await sendOriginal();
        await setCredentialRefreshState(allocation.refreshId, 'active');

        // First material publish establishes the digest (and one event).
        const v2 = await signAs(
            issuer,
            buildUnsignedCredential(allocation, {
                validFrom: '2026-02-01T00:00:00Z',
                name: 'Final Transcript',
            })
        );
        await publishIssuerSigned(allocation.refreshId, v2);
        expect(getRefreshEvents()).toHaveLength(1);

        // Only an issuance timestamp changes — no user-visible difference.
        const v3 = await signAs(
            issuer,
            buildUnsignedCredential(allocation, {
                validFrom: '2026-03-01T00:00:00Z',
                name: 'Final Transcript',
            })
        );
        const result = await publishIssuerSigned(allocation.refreshId, v3);

        expect(result.notification).toEqual('suppressed');
        expect(getRefreshEvents()).toHaveLength(1);
    });

    it('honors issuer overrides regardless of materiality', async () => {
        const { allocation } = await sendOriginal();
        await setCredentialRefreshState(allocation.refreshId, 'active');

        // notifyHolder: false suppresses even a material change.
        const v2 = await signAs(
            issuer,
            buildUnsignedCredential(allocation, {
                validFrom: '2026-02-01T00:00:00Z',
                name: 'Suppressed Material Update',
            })
        );
        const suppressed = await publishIssuerSigned(allocation.refreshId, v2, {
            notifyHolder: false,
        });
        expect(suppressed.notification).toEqual('suppressed');
        expect(getRefreshEvents()).toHaveLength(0);

        // notifyHolder: true forces an event even for a non-material change.
        const v3 = await signAs(
            issuer,
            buildUnsignedCredential(allocation, {
                validFrom: '2026-03-01T00:00:00Z',
                name: 'Suppressed Material Update',
            })
        );
        const forced = await publishIssuerSigned(allocation.refreshId, v3, {
            notifyHolder: true,
        });
        expect(forced.notification).toEqual('queued');
        expect(getRefreshEvents()).toHaveLength(1);
    });

    it('enqueues nothing while the credential is awaiting claim', async () => {
        const { allocation } = await sendOriginal();

        const updated = await signAs(
            issuer,
            buildUnsignedCredential(allocation, {
                validFrom: '2026-02-01T00:00:00Z',
                name: 'Pre-Claim Update',
            })
        );
        const result = await publishIssuerSigned(allocation.refreshId, updated);

        expect(result.notification).toEqual('not-applicable');
        expect(getRefreshEvents()).toHaveLength(0);

        const aggregate = await getCredentialRefresh(allocation.refreshId);
        expect(aggregate?.lastNotificationAt).toBeUndefined();
    });
});

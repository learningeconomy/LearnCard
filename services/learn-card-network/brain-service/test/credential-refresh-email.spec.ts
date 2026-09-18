import { vi } from 'vitest';
import { VC, UnsignedVC, LCNNotification } from '@learncard/types';

import { neogma } from '@instance';

import { getUser } from './helpers/getClient';
import { addNotificationToQueueSpy } from './helpers/spies';
import * as Notifications from '@helpers/notifications.helpers';
import {
    getCredentialRefresh,
    getCredentialRefreshEmailDelivery,
    getCredentialRefreshHead,
    setCredentialRefreshState,
} from '@accesslayer/credential-refresh';
import { getProfileByProfileId } from '@accesslayer/profile/read';
import { isProfileManaged } from '@accesslayer/profile/relationships/read';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { createProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/create';
import { setPrimaryContactMethod, verifyContactMethod } from '@accesslayer/contact-method/update';
import { createProfileManager } from '@accesslayer/profile-manager/create';
import { createManagesRelationship } from '@accesslayer/profile-manager/relationships/create';
import { LogAdapter } from '@services/delivery/adapters/log.adapter';
import type { Notification } from '@services/delivery/delivery.service';
import { computeCredentialRefreshDeliveryKey } from '@helpers/credential-refresh-materiality.helpers';
import { ensureCredentialRefreshConstraints } from '../src/models/credential-refresh-constraints';

/**
 * LC-2198 — production update emails for managed credential refresh.
 *
 * Covers the privacy-minimal recipient/title decisions end-to-end:
 * - verified contact methods of the bound holder only (never the original inbox
 *   address, never caller-supplied)
 * - managed children route to a verified guardian or are skipped entirely
 * - notifyHolder:false / non-material / pre-claim paths emit no email
 * - delivery windows collapse retries and concurrent races to one email
 * - email failure never changes the publication outcome or duplicates the push
 *
 * The delivery adapter stays log-only; Postmark is never contacted.
 */

const runQuery = async (cypher: string, params: Record<string, unknown> = {}) =>
    neogma.queryRunner.run(cypher, params);

const ISSUER_PROFILE_ID = 'refresh-email-issuer';
const HOLDER_PROFILE_ID = 'refresh-email-holder';
const GUARDIAN_PROFILE_ID = 'refresh-email-guardian';
const CREDENTIAL_ID = 'urn:uuid:refreshable-credential-email';

const HOLDER_VERIFIED_EMAIL = 'holder-verified@example.com';
const HOLDER_UNVERIFIED_EMAIL = 'holder-unverified@example.com';
const GUARDIAN_VERIFIED_EMAIL = 'guardian-verified@example.com';

const SECRET_TITLE = 'Introduction to Biology';
const SECRET_GRADE_MARKER = 'SECRET-GRADE-MARKER-1111';
const SECRET_SUMMARY_MARKER = 'SECRET-SUMMARY-MARKER-2222';
const SECRET_SUBJECT_MARKER = 'SECRET-SUBJECT-MARKER-3333';

type AllocationResult = {
    refreshId: string;
    refreshService: { id: string; type: string; authorization?: { type: string } };
};

let issuer: Awaited<ReturnType<typeof getUser>>;
let holder: Awaited<ReturnType<typeof getUser>>;
let emailSendSpy: ReturnType<typeof vi.spyOn>;

const emailDeliveries = (): Notification[] =>
    emailSendSpy.mock.calls
        .map(call => call[0] as Notification)
        .filter(notification => notification.templateId === 'credential-updated');

const addEmail = async (
    profileId: string,
    value: string,
    { verified = true, primary = false }: { verified?: boolean; primary?: boolean } = {}
) => {
    const contactMethod = await createContactMethod({
        type: 'email',
        value,
        isVerified: false,
        isPrimary: false,
    });

    await createProfileContactMethodRelationship(profileId, contactMethod.id);

    if (verified) await verifyContactMethod(contactMethod.id);

    if (primary) {
        const profile = await getProfileByProfileId(profileId);
        await setPrimaryContactMethod(profile!.did, contactMethod.id);
    }

    return contactMethod;
};

const linkGuardian = async (profileId: string, childProfileId: string) => {
    const manager = await createProfileManager({
        displayName: 'Guardian',
        managerType: 'guardian',
    });

    await createManagesRelationship(manager.id, childProfileId);
    await manager.relateTo({ alias: 'administratedBy', where: { profileId } });
};

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
        '@context': [
            'https://www.w3.org/ns/credentials/v2',
            {
                'LearnCardCredentialRefresh2026':
                    'https://learncard.com/refresh#LearnCardCredentialRefresh2026',
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
    }) as UnsignedVC;

const signAs = async (
    user: Awaited<ReturnType<typeof getUser>>,
    unsigned: UnsignedVC
): Promise<VC> => user.learnCard.invoke.issueCredential(unsigned);

const publishIssuerSigned = async (
    refreshId: string,
    credential: VC,
    extras: Record<string, unknown> = {}
) =>
    issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh({
        mode: 'issuer-signed',
        refreshId,
        signedCredential: credential,
        ...extras,
    } as Parameters<typeof issuer.clients.fullAuth.credentialRefresh.publishCredentialRefresh>[0]);

const sendOriginal = async (): Promise<{ allocation: AllocationResult; uri: string }> => {
    const allocation = await allocate();
    const credential = await signAs(issuer, buildUnsignedCredential(allocation));

    const uri = await issuer.clients.fullAuth.credentialRefresh.sendRefreshableCredential({
        refreshId: allocation.refreshId,
        credential,
    });

    return { allocation, uri };
};

const activate = async (refreshId: string): Promise<void> => {
    await setCredentialRefreshState(refreshId, 'active');
};

const updatedCredential = async (
    allocation: AllocationResult,
    overrides: Record<string, unknown> = {}
): Promise<VC> =>
    signAs(
        issuer,
        buildUnsignedCredential(allocation, {
            validFrom: '2026-02-01T00:00:00Z',
            name: SECRET_TITLE,
            ...overrides,
        })
    );

describe('credential refresh update emails', () => {
    beforeAll(async () => {
        issuer = await getUser('d'.repeat(64));
        holder = await getUser('b'.repeat(64));

        vi.spyOn(Notifications, 'addNotificationToQueue').mockImplementation(
            addNotificationToQueueSpy
        );

        emailSendSpy = vi.spyOn(LogAdapter.prototype, 'send').mockResolvedValue(undefined);

        await ensureCredentialRefreshConstraints();
    });

    beforeEach(async () => {
        await runQuery('MATCH (d:CredentialRefreshEmailDelivery) DETACH DELETE d');
        await runQuery('MATCH (r:CredentialRefresh) DETACH DELETE r');
        await runQuery('MATCH (c:Credential) DETACH DELETE c');
        await runQuery('MATCH (cm:ContactMethod) DETACH DELETE cm');
        await runQuery('MATCH (pm:ProfileManager) DETACH DELETE pm');
        await runQuery('MATCH (p:Profile) DETACH DELETE p');

        await issuer.clients.fullAuth.profile.createProfile({
            profileId: ISSUER_PROFILE_ID,
            displayName: 'Email Test School',
        });
        await holder.clients.fullAuth.profile.createProfile({
            profileId: HOLDER_PROFILE_ID,
            displayName: 'Email Test Holder',
        });

        addNotificationToQueueSpy.mockReset();
        emailSendSpy.mockReset();
        emailSendSpy.mockResolvedValue(undefined);
    });

    afterAll(() => {
        emailSendSpy.mockRestore();
    });

    it('emails the holder verified email with only issuer name and title', async () => {
        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL, { primary: true });
        await addEmail(HOLDER_PROFILE_ID, HOLDER_UNVERIFIED_EMAIL, { verified: false });

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        const updated = await updatedCredential(allocation, {
            // `achievement` is not defined by the VCDM 2.0 context, so it must be
            // mapped inline or data-loss detection refuses to sign.
            '@context': [
                'https://www.w3.org/ns/credentials/v2',
                {
                    'LearnCardCredentialRefresh2026':
                        'https://learncard.com/refresh#LearnCardCredentialRefresh2026',
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
            credentialSubject: {
                id: holder.learnCard.id.did(),
                achievement: { name: SECRET_GRADE_MARKER },
            },
            description: SECRET_SUBJECT_MARKER,
        });

        await publishIssuerSigned(allocation.refreshId, updated, {
            updateSummary: SECRET_SUMMARY_MARKER,
        });

        const deliveries = emailDeliveries();
        expect(deliveries).toHaveLength(1);

        const delivery = deliveries[0]!;
        expect(delivery.contactMethod).toEqual({
            type: 'email',
            value: HOLDER_VERIFIED_EMAIL,
        });
        expect(delivery.templateId).toEqual('credential-updated');
        expect(delivery.templateModel).toEqual({
            issuer: { name: expect.any(String) },
            credential: { name: SECRET_TITLE },
        });

        // No grades, description/body content, or issuer summary may reach the template.
        const serialized = JSON.stringify(delivery);
        expect(serialized).not.toContain(SECRET_GRADE_MARKER);
        expect(serialized).not.toContain(SECRET_SUBJECT_MARKER);
        expect(serialized).not.toContain(SECRET_SUMMARY_MARKER);
        expect(serialized).not.toContain(HOLDER_UNVERIFIED_EMAIL);
        expect(serialized).not.toContain('credentialSubject');
    });

    it('does not email when the holder has no verified email', async () => {
        await addEmail(HOLDER_PROFILE_ID, HOLDER_UNVERIFIED_EMAIL, { verified: false });

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        const result = await publishIssuerSigned(
            allocation.refreshId,
            await updatedCredential(allocation)
        );

        // In-app remains queued; only the email channel skips.
        expect(result.notification).toEqual('queued');
        expect(emailDeliveries()).toHaveLength(0);
    });

    it('honors notifyHolder:false and does not email', async () => {
        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL);

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        const result = await publishIssuerSigned(
            allocation.refreshId,
            await updatedCredential(allocation),
            { notifyHolder: false }
        );

        expect(result.notification).toEqual('suppressed');
        expect(emailDeliveries()).toHaveLength(0);
    });

    it('does not email for a non-material update', async () => {
        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL);

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        // Same user-visible content as version 1; only the proof differs.
        const unchanged = await signAs(
            issuer,
            buildUnsignedCredential(allocation, {
                validFrom: '2026-02-01T00:00:00Z',
                name: 'Original Transcript',
            })
        );
        const result = await publishIssuerSigned(allocation.refreshId, unchanged);

        expect(result.notification).toEqual('suppressed');
        expect(emailDeliveries()).toHaveLength(0);
    });

    it('does not email pre-claim, then emails once after the holder accepts', async () => {
        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL);

        const { allocation, uri } = await sendOriginal();

        await publishIssuerSigned(allocation.refreshId, await updatedCredential(allocation));
        expect(emailDeliveries()).toHaveLength(0);

        await holder.clients.fullAuth.credential.acceptCredential({ uri });

        expect(emailDeliveries()).toHaveLength(1);
        expect(emailDeliveries()[0]!.templateModel).toMatchObject({
            credential: { name: SECRET_TITLE },
        });

        // A replayed accept does not email twice.
        await holder.clients.fullAuth.credential.acceptCredential({ uri });
        expect(emailDeliveries()).toHaveLength(1);
    });

    it('collapses repeat material updates in one delivery window to one email', async () => {
        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL);

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        await publishIssuerSigned(allocation.refreshId, await updatedCredential(allocation));
        await publishIssuerSigned(
            allocation.refreshId,
            await updatedCredential(allocation, {
                validFrom: '2026-03-01T00:00:00Z',
                name: 'Final Biology',
            })
        );

        expect(emailDeliveries()).toHaveLength(1);
    });

    it('does not email twice when the same publication is replayed', async () => {
        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL);

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        const updated = await updatedCredential(allocation);

        await publishIssuerSigned(allocation.refreshId, updated, {
            idempotencyKey: 'email-replay',
        });
        await publishIssuerSigned(allocation.refreshId, updated, {
            idempotencyKey: 'email-replay',
        });

        expect(emailDeliveries()).toHaveLength(1);
    });

    it('claims the window exactly once when concurrent publications race', async () => {
        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL);

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        const updated = await updatedCredential(allocation);

        const [first, second] = await Promise.all([
            publishIssuerSigned(allocation.refreshId, updated, {
                idempotencyKey: 'email-concurrent',
                notifyHolder: true,
            }),
            publishIssuerSigned(allocation.refreshId, updated, {
                idempotencyKey: 'email-concurrent',
                notifyHolder: true,
            }),
        ]);

        expect(first.version).toEqual(2);
        expect(second.version).toEqual(2);
        expect(emailDeliveries()).toHaveLength(1);

        const windowKey = computeCredentialRefreshDeliveryKey(allocation.refreshId);
        const record = await getCredentialRefreshEmailDelivery(allocation.refreshId, windowKey);
        expect(record?.state).toEqual('delivered');
        expect(record?.attempts).toEqual(1);
    });

    it('records email failure without changing the in-app outcome or retrying the window', async () => {
        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL);

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        emailSendSpy.mockRejectedValueOnce(new Error('smtp unavailable'));

        const updated = await updatedCredential(allocation);

        const first = await publishIssuerSigned(allocation.refreshId, updated, {
            idempotencyKey: 'email-failure',
        });

        // Publication + in-app notification are unaffected by the email failure.
        const refreshEvents = addNotificationToQueueSpy.mock.calls
            .map(call => call[0] as LCNNotification)
            .filter(notification => notification.type === 'CREDENTIAL_REFRESHED');
        expect(first.notification).toEqual('queued');
        expect(refreshEvents).toHaveLength(1);
        expect(emailSendSpy).toHaveBeenCalledTimes(1);

        const windowKey = computeCredentialRefreshDeliveryKey(allocation.refreshId);
        const record = await getCredentialRefreshEmailDelivery(allocation.refreshId, windowKey);
        expect(record?.state).toEqual('failed');

        // A retry in the same window must not attempt a second send.
        const retry = await publishIssuerSigned(allocation.refreshId, updated, {
            idempotencyKey: 'email-failure',
        });
        expect(retry.notification).toEqual('queued');
        expect(emailSendSpy).toHaveBeenCalledTimes(1);
    });

    it('routes a managed child update to the verified guardian, not the child', async () => {
        const guardian = await getUser('e'.repeat(64));
        await guardian.clients.fullAuth.profile.createProfile({
            profileId: GUARDIAN_PROFILE_ID,
            displayName: 'Email Test Guardian',
        });

        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL, { primary: true });
        await addEmail(GUARDIAN_PROFILE_ID, GUARDIAN_VERIFIED_EMAIL, { primary: true });

        await linkGuardian(GUARDIAN_PROFILE_ID, HOLDER_PROFILE_ID);
        expect(await isProfileManaged(HOLDER_PROFILE_ID)).toBe(true);

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        const result = await publishIssuerSigned(
            allocation.refreshId,
            await updatedCredential(allocation)
        );

        // In-app remains addressed to the child (unchanged); email goes to the guardian.
        expect(result.notification).toEqual('queued');

        const deliveries = emailDeliveries();
        expect(deliveries).toHaveLength(1);
        expect(deliveries[0]!.contactMethod.value).toEqual(GUARDIAN_VERIFIED_EMAIL);
        expect(JSON.stringify(deliveries[0])).not.toContain(HOLDER_VERIFIED_EMAIL);
    });

    it('skips a managed child when no guardian has a verified email', async () => {
        const guardian = await getUser('e'.repeat(64));
        await guardian.clients.fullAuth.profile.createProfile({
            profileId: GUARDIAN_PROFILE_ID,
            displayName: 'Email Test Guardian',
        });

        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL, { primary: true });

        await linkGuardian(GUARDIAN_PROFILE_ID, HOLDER_PROFILE_ID);

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        const result = await publishIssuerSigned(
            allocation.refreshId,
            await updatedCredential(allocation)
        );

        expect(result.notification).toEqual('queued');
        expect(emailDeliveries()).toHaveLength(0);
    });

    it('keeps in-app payloads free of the email title', async () => {
        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL);

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        await publishIssuerSigned(allocation.refreshId, await updatedCredential(allocation));

        const refreshEvents = addNotificationToQueueSpy.mock.calls
            .map(call => call[0] as LCNNotification)
            .filter(notification => notification.type === 'CREDENTIAL_REFRESHED');

        expect(refreshEvents).toHaveLength(1);
        expect(JSON.stringify(refreshEvents[0])).not.toContain(SECRET_TITLE);

        // Email still carries the title.
        expect(emailDeliveries()[0]!.templateModel).toMatchObject({
            credential: { name: SECRET_TITLE },
        });
    });

    it('renders generic copy and persists no title when the publication has none', async () => {
        // An issuer-signed update that omits `name` must not fail delivery: the
        // aggregate keeps no display title and the email falls back to generic copy.
        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL);

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        const titleless = await signAs(
            issuer,
            buildUnsignedCredential(allocation, {
                validFrom: '2026-02-01T00:00:00Z',
                name: undefined,
            })
        );
        await publishIssuerSigned(allocation.refreshId, titleless);

        const deliveries = emailDeliveries();
        expect(deliveries).toHaveLength(1);
        expect(deliveries[0]!.templateModel).toEqual({ issuer: { name: expect.any(String) } });

        const aggregate = await getCredentialRefresh(allocation.refreshId);
        expect(aggregate?.credentialDisplayName ?? undefined).toBeUndefined();
    });

    it('persists the bounded display title on the aggregate and head version', async () => {
        await addEmail(HOLDER_PROFILE_ID, HOLDER_VERIFIED_EMAIL);

        const { allocation } = await sendOriginal();
        await activate(allocation.refreshId);

        await publishIssuerSigned(allocation.refreshId, await updatedCredential(allocation));

        const aggregate = await getCredentialRefresh(allocation.refreshId);
        const head = await getCredentialRefreshHead(allocation.refreshId);

        expect(aggregate?.credentialDisplayName).toEqual(SECRET_TITLE);
        expect(head?.credentialDisplayName).toEqual(SECRET_TITLE);
    });
});

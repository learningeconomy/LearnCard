import { vi, describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { getClient, getUser } from './helpers/getClient';
import { testUnsignedBoost } from './helpers/send';
import {
    Profile,
    InboxCredential,
    ContactMethod,
    SigningAuthority,
    Boost,
    ProfileManager,
} from '@models';
import { createContactMethod } from '@accesslayer/contact-method/create';
import { createProfileContactMethodRelationship } from '@accesslayer/contact-method/relationships/create';
import { sendSpy } from './helpers/spies';

vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: sendSpy }),
}));

type SentNotification = {
    contactMethod: { value: string };
    templateId: string;
    templateModel?: { claimUrl?: string };
};

let userA: Awaited<ReturnType<typeof getUser>>;

const clearDb = async (): Promise<void> => {
    await ProfileManager.delete({ detach: true, where: {} });
    await Profile.delete({ detach: true, where: {} });
    await InboxCredential.delete({ detach: true, where: {} });
    await ContactMethod.delete({ detach: true, where: {} });
    await SigningAuthority.delete({ detach: true, where: {} });
    await Boost.delete({ detach: true, where: {} });
};

const createManagedRecipient = async (
    profileId: string,
    email: string,
    isServiceProfile: boolean
): Promise<void> => {
    const boostUri = await userA.clients.fullAuth.boost.createBoost({
        credential: testUnsignedBoost,
    });
    const managerDid = await userA.clients.fullAuth.profileManager.createChildProfileManager({
        parentUri: boostUri,
        profile: {},
    });
    const managerClient = getClient({ did: managerDid, isChallengeValid: true });
    await managerClient.profileManager.createManagedProfile({
        profileId,
        displayName: profileId,
        isServiceProfile,
    });

    const contactMethod = await createContactMethod({
        type: 'email',
        value: email,
        isVerified: true,
        isPrimary: true,
    });
    await createProfileContactMethodRelationship(profileId, contactMethod.id);
};

const sendTo = async (recipient: string) => {
    const signedVc = await userA.learnCard.invoke.issueCredential({
        ...testUnsignedBoost,
        issuer: userA.learnCard.id.did(),
    });

    return userA.clients.fullAuth.boost.send({
        type: 'boost',
        recipient,
        template: { credential: testUnsignedBoost },
        signedCredential: signedVc,
    });
};

describe('Inbox send to managed recipients', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
    });

    beforeEach(async () => {
        sendSpy.mockClear();
        await clearDb();
        await userA.clients.fullAuth.profile.createProfile({
            profileId: 'usera',
            displayName: 'User A',
        });
    });

    afterAll(async () => {
        sendSpy.mockClear();
        await clearDb();
    });

    it('delivers directly to a managed service profile without a guardian gate', async () => {
        await createManagedRecipient('managed-org', 'org@example.com', true);

        const result = await sendTo('org@example.com');

        expect(result.inbox?.status).toBe('ISSUED');
        expect(result.inbox?.guardianStatus).toBeUndefined();

        const credentials = await InboxCredential.findMany({ where: {} });
        expect(credentials).toHaveLength(1);
        expect(credentials[0]!.guardianStatus).toBeFalsy();
    });

    it('gates a managed child and sends the claim email with a valid template', async () => {
        await createManagedRecipient('managed-child', 'child@example.com', false);

        const result = await sendTo('child@example.com');

        expect(result.inbox?.status).toBe('PENDING');
        expect(result.inbox?.guardianStatus).toBe('AWAITING_GUARDIAN');

        const credentials = await InboxCredential.findMany({ where: {} });
        expect(credentials).toHaveLength(1);
        expect(credentials[0]!.guardianStatus).toBe('AWAITING_GUARDIAN');

        const childEmail = sendSpy.mock.calls
            .map(call => call[0] as SentNotification)
            .find(notification => notification.contactMethod.value === 'child@example.com');

        expect(childEmail?.templateId).toBe('universal-inbox-claim');
        expect(childEmail?.templateModel?.claimUrl).toBeTruthy();
    });
});

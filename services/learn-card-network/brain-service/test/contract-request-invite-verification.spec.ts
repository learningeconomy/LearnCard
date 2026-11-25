import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { randomBytes } from 'node:crypto';

const mocks = vi.hoisted(() => ({ send: vi.fn(), verifyAuthToken: vi.fn() }));
vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: mocks.send }),
}));
vi.mock('@helpers/oidc-jwt.helpers', async importOriginal => ({
    ...(await importOriginal<Record<string, unknown>>()),
    verifyAuthToken: mocks.verifyAuthToken,
}));

import { getUser } from './helpers/getClient';
import { normalContract } from './helpers/contract';
import * as notifications from '@helpers/notifications.helpers';
import type { VP } from '@learncard/types';

const actor = async (role: string) => {
    const user = await getUser(randomBytes(32).toString('hex'));
    const profileId = `invite-verify-${role}-${randomBytes(5).toString('hex')}`;
    await user.clients.fullAuth.profile.createProfile({ profileId });
    return { ...user, profileId };
};
type Actor = Awaited<ReturnType<typeof actor>>;
const randomEmail = (): string => `${randomBytes(6).toString('hex')}@example.com`;
/** Same address with different letter case, to prove the comparison ignores case. */
const recase = (email: string): string =>
    email.toUpperCase().replace('@EXAMPLE.COM', '@Example.com');

describe('contract request invites attach when an email is verified', () => {
    let owner: Actor;
    let recipient: Actor;
    let contractUri: string;
    /** The login provider named by LOGIN_PROVIDER_DID in vitest.integration.config.ts. */
    let loginProvider: Awaited<ReturnType<typeof getUser>>;

    beforeAll(async () => {
        loginProvider = await getUser('e'.repeat(64));
    });

    beforeEach(async () => {
        [owner, recipient] = await Promise.all([actor('owner'), actor('recipient')]);
        contractUri = await owner.clients.fullAuth.contracts.createConsentFlowContract({
            name: 'Synthetic referral',
            contract: normalContract,
            recipients: [recipient.profileId],
        });
        mocks.send.mockReset();
        mocks.send.mockResolvedValue(undefined);
        mocks.verifyAuthToken.mockReset();
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(async () => undefined);
    });
    afterEach(() => vi.restoreAllMocks());

    const invite = async (email: string): Promise<string> =>
        (
            await recipient.clients.fullAuth.contracts.sendContractRequest({
                contractUri,
                targetEmail: email,
                externalReferenceId: 'synthetic-ref-1',
            })
        ).requestId;
    const requestOf = (user: Actor) =>
        user.clients.fullAuth.contracts.getRequestStatusForProfile({
            contractUri,
            targetProfileId: user.profileId,
        });

    it('attaches at sign-up with a verified auth token email', async () => {
        const email = randomEmail();
        const requestId = await invite(email);
        mocks.verifyAuthToken.mockResolvedValue({ email: recase(email), emailVerified: true });

        const user = await getUser(randomBytes(32).toString('hex'));
        const profileId = `invite-verify-new-${randomBytes(5).toString('hex')}`;
        await user.clients.fullAuth.profile.createProfile({ profileId, authToken: 'synthetic' });

        expect(await requestOf({ ...user, profileId })).toMatchObject({
            requestId,
            status: 'pending',
            externalReferenceId: 'synthetic-ref-1',
        });
    });

    it('attaches when a login provider credential verifies the email', async () => {
        const email = randomEmail();
        const requestId = await invite(email);
        const learner = await actor('learner');
        expect(await requestOf(learner)).toBeNull();

        const proofOfLoginJwt = (await loginProvider.learnCard.invoke.getDidAuthVp({
            proofFormat: 'jwt',
            challenge: `proof-of-login:email:${recase(email)}`,
        })) as unknown as string;
        await learner.clients.fullAuth.contactMethods.verifyWithCredential({ proofOfLoginJwt });

        expect(await requestOf(learner)).toMatchObject({ requestId, status: 'pending' });
    });

    it('attaches when the emailed verification token is used', async () => {
        const email = randomEmail();
        const requestId = await invite(email);
        const learner = await actor('learner');

        await learner.clients.fullAuth.contactMethods.addContactMethod({
            type: 'email',
            value: recase(email),
        });
        const verification = mocks.send.mock.calls
            .map(call => call[0])
            .find(notification => notification.templateId === 'contact-method-verification');
        expect(await requestOf(learner)).toBeNull();
        await learner.clients.fullAuth.contactMethods.verifyContactMethod({
            token: verification.templateModel.verificationToken,
        });

        expect(await requestOf(learner)).toMatchObject({ requestId, status: 'pending' });
    });

    it('attaches when an inbox claim link verifies the email', async () => {
        const email = randomEmail();
        const requestId = await invite(email);
        const learner = await actor('learner');

        await owner.clients.fullAuth.inbox.issue({
            recipient: { type: 'email', value: recase(email) },
            credential: await owner.learnCard.invoke.issueCredential(
                await owner.learnCard.invoke.getTestVc()
            ),
        });
        const claimUrl: string = mocks.send.mock.calls
            .map(call => call[0])
            .find(notification => notification.templateModel?.claimUrl)?.templateModel.claimUrl;
        expect(claimUrl).toBeTruthy();
        expect(await requestOf(learner)).toBeNull();

        const localExchangeId = new URL(claimUrl).pathname.split('/').pop()!;
        const start = await learner.clients.fullAuth.workflows.participateInExchange({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
        });
        const vp = (await learner.learnCard.invoke.getDidAuthVp({
            challenge: start.verifiablePresentationRequest?.challenge,
            domain: start.verifiablePresentationRequest?.domain,
        })) as VP;
        await learner.clients.fullAuth.workflows.participateInExchange({
            localWorkflowId: 'inbox-claim',
            localExchangeId,
            verifiablePresentation: vp,
        });

        expect(await requestOf(learner)).toMatchObject({ requestId, status: 'pending' });
    });
});

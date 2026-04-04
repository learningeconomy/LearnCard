import { vi, describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { getUser } from './helpers/getClient';
import { testUnsignedBoost } from './helpers/send';
import { Profile, InboxCredential, ContactMethod, SigningAuthority, Boost } from '@models';
import { sendSpy } from './helpers/spies';

vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: sendSpy }),
}));

let userA: Awaited<ReturnType<typeof getUser>>;

describe('Guardian-Gated Credential Issuance', () => {
    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
    });

    beforeEach(async () => {
        sendSpy.mockClear();
        await Profile.delete({ detach: true, where: {} });
        await InboxCredential.delete({ detach: true, where: {} });
        await ContactMethod.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({
            profileId: 'usera',
            displayName: 'User A',
        });
    });

    afterAll(async () => {
        sendSpy.mockClear();
        await Profile.delete({ detach: true, where: {} });
        await InboxCredential.delete({ detach: true, where: {} });
        await ContactMethod.delete({ detach: true, where: {} });
        await SigningAuthority.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
    });

    describe('send with guardianEmail', () => {
        it('should create inbox credential with AWAITING_GUARDIAN status', async () => {
            let result: any;
            try {
                const signedVc = await userA.learnCard.invoke.issueCredential(testUnsignedBoost);

                result = await userA.clients.fullAuth.boost.send({
                    type: 'boost',
                    recipient: 'student@school.edu',
                    template: { credential: testUnsignedBoost },
                    signedCredential: signedVc,
                    options: {
                        guardianEmail: 'parent@home.com',
                        branding: { issuerName: 'Springfield Elementary' },
                    },
                });
            } catch (e: any) {
                console.log('SEND ERROR type:', typeof e, Object.prototype.toString.call(e));
                console.log('SEND ERROR keys:', Object.getOwnPropertyNames(e));
                console.log('SEND ERROR str:', String(e));
                console.log('SEND ERROR message:', e?.message);
                console.log('SEND ERROR code:', e?.code);
                throw e;
            }

            expect(result.inbox?.guardianStatus).toBe('AWAITING_GUARDIAN');

            const credentials = await InboxCredential.findMany({ where: {} });
            expect(credentials).toHaveLength(1);
            const inboxCred = credentials[0]!;
            expect(inboxCred.guardianEmail).toBe('parent@home.com');
            expect(inboxCred.guardianStatus).toBe('AWAITING_GUARDIAN');
        });

        it('should send exactly 2 emails: one to student, one to guardian', async () => {
            const signedVc = await userA.learnCard.invoke.issueCredential(testUnsignedBoost);

            await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'student@school.edu',
                template: { credential: testUnsignedBoost },
                signedCredential: signedVc,
                options: { guardianEmail: 'parent@home.com' },
            });

            expect(sendSpy).toHaveBeenCalledTimes(2);

            const calls = sendSpy.mock.calls.map((c: any) => c[0]);
            const studentEmail = calls.find((c: any) => c.contactMethod.value === 'student@school.edu');
            const guardianEmail = calls.find((c: any) => c.contactMethod.value === 'parent@home.com');

            expect(studentEmail?.templateId).toBe('credential-awaiting-guardian');
            expect(guardianEmail?.templateId).toBe('guardian-credential-approval');
            expect(guardianEmail?.templateModel?.approvalUrl).toContain('guardian-credential-approval');
        });
    });
});

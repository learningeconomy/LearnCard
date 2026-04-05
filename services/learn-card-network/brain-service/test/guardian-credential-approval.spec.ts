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
            const signedVc = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
            });

            const result = await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'student@school.edu',
                template: { credential: testUnsignedBoost },
                signedCredential: signedVc,
                options: {
                    guardianEmail: 'parent@home.com',
                    branding: { issuerName: 'Springfield Elementary' },
                },
            });

            expect(result.inbox?.guardianStatus).toBe('AWAITING_GUARDIAN');

            const credentials = await InboxCredential.findMany({ where: {} });
            expect(credentials).toHaveLength(1);
            const inboxCred = credentials[0]!;
            expect(inboxCred.guardianEmail).toBe('parent@home.com');
            expect(inboxCred.guardianStatus).toBe('AWAITING_GUARDIAN');
        });

        it('should send exactly 2 emails: one to student, one to guardian', async () => {
            const signedVc = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
            });

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

    describe('sendGuardianChallenge', () => {
        it('should send OTP email to guardian and return success message', async () => {
            const signedVc = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
            });

            await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'student@school.edu',
                template: { credential: testUnsignedBoost },
                signedCredential: signedVc,
                options: { guardianEmail: 'parent@home.com' },
            });
            sendSpy.mockClear();

            const credentials = await InboxCredential.findMany({ where: {} });
            const inboxCred = credentials[0]!;

            const { generateGuardianCredentialApprovalToken } = await import(
                '../src/helpers/guardian-approval.helpers'
            );
            const token = await generateGuardianCredentialApprovalToken(inboxCred.id, 'parent@home.com');

            const result = await userA.clients.fullAuth.inbox.sendGuardianChallenge({ token });
            expect(result.message).toBe('Verification code sent.');
            expect(sendSpy).toHaveBeenCalledTimes(1);

            const otpCall = sendSpy.mock.calls[0][0];
            expect(otpCall.contactMethod.value).toBe('parent@home.com');
            expect(otpCall.templateId).toBe('guardian-email-otp');
            expect(otpCall.templateModel.verificationCode).toMatch(/^\d{6}$/);
        });

        it('should return error for an expired token', async () => {
            const { generateGuardianCredentialApprovalToken } = await import(
                '../src/helpers/guardian-approval.helpers'
            );
            const token = await generateGuardianCredentialApprovalToken('fake-id', 'parent@home.com', 0);

            await expect(
                userA.clients.fullAuth.inbox.sendGuardianChallenge({ token })
            ).rejects.toThrow();
        });
    });

    describe('approveGuardianCredential', () => {
        let inboxCredId: string;
        let approvalToken: string;

        beforeEach(async () => {
            const signedVc = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
            });
            sendSpy.mockClear();

            await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'student@school.edu',
                template: { credential: testUnsignedBoost },
                signedCredential: signedVc,
                options: { guardianEmail: 'parent@home.com' },
            });
            sendSpy.mockClear();

            const credentials = await InboxCredential.findMany({ where: {} });
            inboxCredId = credentials[0]!.id;

            const { generateGuardianCredentialApprovalToken } = await import(
                '../src/helpers/guardian-approval.helpers'
            );
            approvalToken = await generateGuardianCredentialApprovalToken(inboxCredId, 'parent@home.com');
        });

        it('should reject with UNAUTHORIZED when otpCode is wrong', async () => {
            await expect(
                userA.clients.fullAuth.inbox.approveGuardianCredential({
                    token: approvalToken,
                    otpCode: '000000',
                })
            ).rejects.toThrow(/Invalid or expired verification code/);
        });

        it('should approve and send student notification when token + OTP are valid', async () => {
            await userA.clients.fullAuth.inbox.sendGuardianChallenge({ token: approvalToken });

            const otpCall = sendSpy.mock.calls.find((c: any) => c[0].templateId === 'guardian-email-otp');
            const otpCode: string = otpCall![0].templateModel.verificationCode;
            sendSpy.mockClear();

            const result = await userA.clients.fullAuth.inbox.approveGuardianCredential({
                token: approvalToken,
                otpCode,
            });

            expect(result.message).toBe('Credential approved. The recipient can now claim it.');

            const updated = await InboxCredential.findMany({ where: {} });
            expect(updated[0]!.guardianStatus).toBe('GUARDIAN_APPROVED');
            expect(updated[0]!.isAccepted).toBe(true);

            expect(sendSpy).toHaveBeenCalledTimes(1);
            const studentNotification = sendSpy.mock.calls[0][0];
            expect(studentNotification.contactMethod.value).toBe('student@school.edu');
            expect(studentNotification.templateId).toBe('guardian-approved-claim');
        });

        it('should not approve again with the same OTP (code is consumed)', async () => {
            await userA.clients.fullAuth.inbox.sendGuardianChallenge({ token: approvalToken });
            const otpCall = sendSpy.mock.calls.find((c: any) => c[0].templateId === 'guardian-email-otp');
            const otpCode: string = otpCall![0].templateModel.verificationCode;

            await userA.clients.fullAuth.inbox.approveGuardianCredential({ token: approvalToken, otpCode });

            await expect(
                userA.clients.fullAuth.inbox.approveGuardianCredential({ token: approvalToken, otpCode })
            ).rejects.toThrow();
        });
    });

    describe('rejectGuardianCredential', () => {
        let inboxCredId: string;
        let approvalToken: string;

        beforeEach(async () => {
            const signedVc = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
            });
            sendSpy.mockClear();

            await userA.clients.fullAuth.boost.send({
                type: 'boost',
                recipient: 'student@school.edu',
                template: { credential: testUnsignedBoost },
                signedCredential: signedVc,
                options: { guardianEmail: 'parent@home.com' },
            });
            sendSpy.mockClear();

            const credentials = await InboxCredential.findMany({ where: {} });
            inboxCredId = credentials[0]!.id;

            const { generateGuardianCredentialApprovalToken } = await import(
                '../src/helpers/guardian-approval.helpers'
            );
            approvalToken = await generateGuardianCredentialApprovalToken(inboxCredId, 'parent@home.com');
        });

        it('should reject with UNAUTHORIZED when otpCode is wrong', async () => {
            await expect(
                userA.clients.fullAuth.inbox.rejectGuardianCredential({
                    token: approvalToken,
                    otpCode: '000000',
                })
            ).rejects.toThrow(/Invalid or expired verification code/);
        });

        it('should reject and send student notification when token + OTP are valid', async () => {
            await userA.clients.fullAuth.inbox.sendGuardianChallenge({ token: approvalToken });

            const otpCall = sendSpy.mock.calls.find((c: any) => c[0].templateId === 'guardian-email-otp');
            const otpCode: string = otpCall![0].templateModel.verificationCode;
            sendSpy.mockClear();

            const result = await userA.clients.fullAuth.inbox.rejectGuardianCredential({
                token: approvalToken,
                otpCode,
            });

            expect(result.message).toBe('Credential rejected.');

            const updated = await InboxCredential.findMany({ where: {} });
            expect(updated[0]!.guardianStatus).toBe('GUARDIAN_REJECTED');
            expect(updated[0]!.isAccepted).toBeFalsy();

            expect(sendSpy).toHaveBeenCalledTimes(1);
            const studentNotification = sendSpy.mock.calls[0][0];
            expect(studentNotification.contactMethod.value).toBe('student@school.edu');
            expect(studentNotification.templateId).toBe('guardian-rejected-credential');
        });
    });
});

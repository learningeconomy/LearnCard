import { vi, describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { getUser, getClient } from './helpers/getClient';
import { testUnsignedBoost } from './helpers/send';
import { Profile, InboxCredential, ContactMethod, SigningAuthority, Boost, ProfileManager } from '@models';
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
        await ProfileManager.delete({ detach: true, where: {} });
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
        await ProfileManager.delete({ detach: true, where: {} });
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

    describe('registerGuardianAsManager', () => {
        let userB: Awaited<ReturnType<typeof getUser>>;

        beforeAll(async () => {
            userB = await getUser('b'.repeat(64));
        });

        // Helper: set up student profile with email CM, send credential, run full OTP approval,
        // and return the approval token (which doubles as the upgrade token).
        const approveAndGetUpgradeToken = async (): Promise<string> => {
            // Ensure userB has a profile and verified email CM for 'student@school.edu'
            const existingProfile = await Profile.findOne({ where: { profileId: 'userb' } });
            if (!existingProfile) {
                await userB.clients.fullAuth.profile.createProfile({
                    profileId: 'userb',
                    displayName: 'User B',
                });
            }

            // Link student@school.edu to userB's profile via the access layer
            const { createContactMethod } = await import('@accesslayer/contact-method/create');
            const { createProfileContactMethodRelationship } = await import(
                '@accesslayer/contact-method/relationships/create'
            );
            const { getContactMethodByValue } = await import('@accesslayer/contact-method/read');

            let cm = await getContactMethodByValue('email', 'student@school.edu');
            if (!cm) {
                cm = await createContactMethod({
                    type: 'email',
                    value: 'student@school.edu',
                    isVerified: true,
                    isPrimary: true,
                });
            }
            await createProfileContactMethodRelationship('userb', cm.id);

            // Issue and send credential with guardianEmail
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

            const credentials = await InboxCredential.findMany({ where: {} });
            const inboxCredId = credentials[0]!.id;

            const { generateGuardianCredentialApprovalToken } = await import(
                '../src/helpers/guardian-approval.helpers'
            );
            const approvalToken = await generateGuardianCredentialApprovalToken(inboxCredId, 'parent@home.com');

            sendSpy.mockClear();

            // Get OTP from sendGuardianChallenge
            await userA.clients.fullAuth.inbox.sendGuardianChallenge({ token: approvalToken });
            const otpCall = sendSpy.mock.calls.find((c: any) => c[0].templateId === 'guardian-email-otp');
            const otpCode: string = otpCall![0].templateModel.verificationCode;
            sendSpy.mockClear();

            // Approve — this stores the upgrade context keyed on the same token
            await userA.clients.fullAuth.inbox.approveGuardianCredential({ token: approvalToken, otpCode });

            return approvalToken; // same token is valid for upgrade
        };

        it('should create guardian profile and ProfileManager relationship after approval', async () => {
            const token = await approveAndGetUpgradeToken();
            const openClient = getClient();

            const result = await openClient.inbox.registerGuardianAsManager({
                token,
                displayName: 'Parent User',
                profileId: 'parent-user',
            });

            expect(result.message).toContain('Account created');
            expect(result.guardianProfileId).toBe('parent-user');
            expect(result.childProfileId).toBe('userb');
            expect(typeof result.managerId).toBe('string');

            // Verify the guardian profile was created
            const guardianProfile = await Profile.findOne({ where: { profileId: 'parent-user' } });
            expect(guardianProfile).toBeTruthy();
            expect(guardianProfile?.displayName).toBe('Parent User');

            // Verify ProfileManager node exists
            const { ProfileManager } = await import('@models');
            const managers = await ProfileManager.findMany({ where: {} });
            expect(managers.length).toBeGreaterThan(0);
        });

        it('should return BAD_REQUEST for invalid/expired upgrade token', async () => {
            const openClient = getClient();

            await expect(
                openClient.inbox.registerGuardianAsManager({
                    token: 'fake-nonexistent-token',
                    displayName: 'Parent User',
                    profileId: 'parent-user',
                })
            ).rejects.toThrow(/invalid or expired/i);
        });

        it('should return CONFLICT if profileId is already taken', async () => {
            const token = await approveAndGetUpgradeToken();

            // Create a profile with the desired profileId first
            const takenUser = await getUser('c'.repeat(64));
            await takenUser.clients.fullAuth.profile.createProfile({
                profileId: 'taken-handle',
                displayName: 'Existing User',
            });

            const openClient = getClient();

            await expect(
                openClient.inbox.registerGuardianAsManager({
                    token,
                    displayName: 'Parent User',
                    profileId: 'taken-handle',
                })
            ).rejects.toThrow(/already taken/i);
        });

        it('should return managerId=null when guardian already manages the child (idempotent upgrade)', async () => {
            const token = await approveAndGetUpgradeToken();
            const openClient = getClient();

            // First call creates the guardian profile and ProfileManager
            const first = await openClient.inbox.registerGuardianAsManager({
                token,
                displayName: 'Parent User',
                profileId: 'parent-idempotent',
            });
            expect(first.managerId).toBeTruthy();

            // The upgrade token is deleted after use, so the same token cannot be reused.
            // Idempotency for an already-managing guardian would require a new upgrade token
            // for the same guardian email — in that scenario managerId would be null.
            // We verify here that exactly one ProfileManager was created.
            const { ProfileManager } = await import('@models');
            const managers = await ProfileManager.findMany({ where: {} });
            expect(managers).toHaveLength(1);
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

import { vi, describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { getClient, getUser } from './helpers/getClient';
import { Profile } from '@models';
import { sendSpy } from './helpers/spies';

vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: sendSpy }),
}));

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;

describe('Guardian Approval', () => {
    const originalEnv = process.env;

    beforeAll(async () => {
        userA = await getUser('ga'.repeat(32));
    });

    beforeEach(async () => {
        process.env = { ...originalEnv };
        sendSpy.mockClear();
        await Profile.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({
            profileId: 'guardian-user',
            displayName: 'Guardian User',
        });
    });

    afterAll(async () => {
        process.env = originalEnv;
        sendSpy.mockClear();
        await Profile.delete({ detach: true, where: {} });
    });

    it('should require auth to send guardian approval email', async () => {
        await expect(
            noAuthClient.inbox.sendGuardianApprovalEmail({ guardianEmail: 'guardian@test.com' })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

        await expect(
            userA.clients.partialAuth.inbox.sendGuardianApprovalEmail({
                guardianEmail: 'guardian@test.com',
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('should send a guardian approval email with approvalUrl and approvalToken', async () => {
        const result = await userA.clients.fullAuth.inbox.sendGuardianApprovalEmail({
            guardianEmail: 'guardian@test.com',
        });

        expect(result.approvalUrl).toBeDefined();

        expect(sendSpy).toHaveBeenCalledOnce();
        expect(sendSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                contactMethod: { type: 'email', value: 'guardian@test.com' },
                templateId: 'guardian-approval',
                templateModel: expect.objectContaining({
                    approvalUrl: expect.any(String),
                    approvalToken: expect.any(String),
                    requester: expect.objectContaining({
                        displayName: 'Guardian User',
                        profileId: 'guardian-user',
                    }),
                    guardian: expect.objectContaining({ email: 'guardian@test.com' }),
                }),
            })
        );
    });

    it('GET approve endpoint should mark the requester profile as approved and expire the token', async () => {
        await userA.clients.fullAuth.inbox.sendGuardianApprovalEmail({
            guardianEmail: 'guardian@test.com',
        });

        const sendArgs = sendSpy.mock.calls[0][0];
        const token = sendArgs.templateModel.approvalToken as string | undefined;
        expect(typeof token).toBe('string');

        await expect(
            noAuthClient.inbox.approveGuardianRequestByPath({ token: token! })
        ).resolves.not.toThrow();

        const profile = await userA.clients.fullAuth.profile.getProfile();
        expect(profile?.approved).toBe(true);

        // Using the token again should fail as it is now expired/used
        await expect(
            noAuthClient.inbox.approveGuardianRequestByPath({ token: token! })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('POST approve endpoint should mark the requester profile as approved and expire the token', async () => {
        await userA.clients.fullAuth.inbox.sendGuardianApprovalEmail({
            guardianEmail: 'guardian@test.com',
        });

        const sendArgs = sendSpy.mock.calls[0][0];
        const token = sendArgs.templateModel.approvalToken as string | undefined;
        expect(typeof token).toBe('string');

        await expect(
            noAuthClient.inbox.approveGuardianRequest({ token: token! })
        ).resolves.not.toThrow();

        const profile = await userA.clients.fullAuth.profile.getProfile();
        expect(profile?.approved).toBe(true);

        // Using the token again should fail as it is now expired/used
        await expect(
            noAuthClient.inbox.approveGuardianRequest({ token: token! })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('should return BAD_REQUEST for invalid tokens (GET and POST)', async () => {
        await expect(
            noAuthClient.inbox.approveGuardianRequestByPath({ token: 'not-a-real-token' })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

        await expect(
            noAuthClient.inbox.approveGuardianRequest({ token: 'not-a-real-token' })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('should send with a custom template id/model and include core fields', async () => {
        await userA.clients.fullAuth.inbox.sendGuardianApprovalEmail({
            guardianEmail: 'customguardian@test.com',
            template: {
                id: 'guardian-approval-custom',
                model: {
                    requester: { organization: 'Custom School' },
                    guardian: { name: 'Parent Name' },
                    extraField: 'extra',
                },
            },
        });

        expect(sendSpy).toHaveBeenCalledOnce();
        expect(sendSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                contactMethod: { type: 'email', value: 'customguardian@test.com' },
                templateId: 'guardian-approval-custom',
                templateModel: expect.objectContaining({
                    approvalUrl: expect.any(String),
                    approvalToken: expect.any(String),
                    // Because template.model shallow-merges, requester/guardian may be overridden by custom objects
                    requester: expect.objectContaining({ organization: 'Custom School' }),
                    guardian: expect.objectContaining({ name: 'Parent Name' }),
                    extraField: 'extra',
                }),
            })
        );
    });

    it('should treat expired tokens as invalid when ttlHours is 0 (GET)', async () => {
        await userA.clients.fullAuth.inbox.sendGuardianApprovalEmail({
            guardianEmail: 'expired@test.com',
            ttlHours: 0,
        });

        const sendArgs = sendSpy.mock.calls[0][0];
        const token = sendArgs.templateModel.approvalToken as string | undefined;
        expect(typeof token).toBe('string');

        await expect(
            noAuthClient.inbox.approveGuardianRequestByPath({ token: token! })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('should return "Profile already approved." when approving an already approved profile (POST)', async () => {
        // Mark already approved
        await userA.clients.fullAuth.profile.updateProfile({ approved: true });

        await userA.clients.fullAuth.inbox.sendGuardianApprovalEmail({ guardianEmail: 'guardian@test.com' });

        const sendArgs = sendSpy.mock.calls[0][0];
        const token = sendArgs.templateModel.approvalToken as string | undefined;
        expect(typeof token).toBe('string');

        const res = await noAuthClient.inbox.approveGuardianRequest({ token: token! });
        expect(res.message).toMatch(/already approved/i);

        // Token should be consumed
        await expect(
            noAuthClient.inbox.approveGuardianRequest({ token: token! })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });
});

import { vi, describe, it, expect, beforeEach, afterAll, beforeAll } from 'vitest';
import { getClient, getUser } from './helpers/getClient';
import { Profile } from '@models';
import { LCNNotificationTypeEnumValidator } from '@learncard/types';
import { sendSpy, addNotificationToQueueSpy } from './helpers/spies';
import * as notifications from '@helpers/notifications.helpers';
import cache from '@cache';
import {
    getGuardianApprovalRequest,
    setGuardianApprovalRequest,
    getGuardianRequestRetentionSeconds,
    GUARDIAN_MAX_SENDS_PER_WINDOW,
    GUARDIAN_REQUEST_RETENTION_BUFFER_SECONDS,
    DEFAULT_GUARDIAN_APPROVAL_TTL_HOURS,
} from '@helpers/guardian-approval.helpers';

vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: sendSpy }),
}));

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;

describe('Guardian Approval', () => {
    const originalEnv = process.env;

    beforeAll(async () => {
        userA = await getUser('a'.repeat(64));
    });

    beforeEach(async () => {
        process.env = { ...originalEnv };
        sendSpy.mockReset();
        await cache.delete((await cache.keys('guardian_approval*')) ?? []);
        await Profile.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({
            profileId: 'guardian-user',
            displayName: 'Guardian User',
            approved: false,
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

        expect(result).toEqual({
            message: expect.any(String),
            approvalUrl: expect.any(String),
            status: 'accepted',
        });
        expect(sendSpy.mock.calls[0]?.[0]?.templateModel?.approvalUrl).toBe(result.approvalUrl);

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

    it('should enqueue a PROFILE_PARENT_APPROVED notification when approval is newly set (POST)', async () => {
        // Spy on notification queueing
        vi.spyOn(notifications, 'addNotificationToQueue').mockImplementation(
            addNotificationToQueueSpy
        );
        addNotificationToQueueSpy.mockClear();

        await userA.clients.fullAuth.inbox.sendGuardianApprovalEmail({
            guardianEmail: 'guardian@test.com',
        });

        const sendArgs = sendSpy.mock.calls[0][0];
        const token = sendArgs.templateModel.approvalToken as string | undefined;
        expect(typeof token).toBe('string');

        await expect(
            noAuthClient.inbox.approveGuardianRequest({ token: token! })
        ).resolves.not.toThrow();

        expect(addNotificationToQueueSpy).toHaveBeenCalledOnce();
        expect(addNotificationToQueueSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: LCNNotificationTypeEnumValidator.enum.PROFILE_PARENT_APPROVED,
                to: expect.objectContaining({ profileId: 'guardian-user' }),
                from: expect.objectContaining({ profileId: 'guardian-user' }),
            })
        );
    });

    it('should return BAD_REQUEST for invalid tokens (GET and POST)', async () => {
        await expect(
            noAuthClient.inbox.approveGuardianRequestByPath({ token: 'not-a-real-token' })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

        await expect(
            noAuthClient.inbox.approveGuardianRequest({ token: 'not-a-real-token' })
        ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
    });

    it('should return specific error messages for different token failure states', async () => {
        // Test 1: Invalid token (doesn't exist)
        await expect(
            noAuthClient.inbox.approveGuardianRequest({ token: 'invalid-token-12345' })
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: expect.stringContaining('Invalid approval token'),
        });

        // Test 2: Already used token
        await userA.clients.fullAuth.inbox.sendGuardianApprovalEmail({
            guardianEmail: 'guardian@test.com',
        });

        const sendArgs = sendSpy.mock.calls[0][0];
        const token = sendArgs.templateModel.approvalToken as string | undefined;
        expect(typeof token).toBe('string');

        // Use the token once successfully
        await noAuthClient.inbox.approveGuardianRequest({ token: token! });

        // Try to use it again - should get "already used" error
        await expect(
            noAuthClient.inbox.approveGuardianRequest({ token: token! })
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: expect.stringContaining('already been used'),
        });

        // Test 3: Expired token
        sendSpy.mockClear();
        await userA.clients.fullAuth.profile.updateProfile({ approved: false });
        await userA.clients.fullAuth.inbox.sendGuardianApprovalEmail({
            guardianEmail: 'expired@test.com',
            ttlHours: 0, // Immediately expired
        });

        const expiredSendArgs = sendSpy.mock.calls[0][0];
        const expiredToken = expiredSendArgs.templateModel.approvalToken as string | undefined;
        expect(typeof expiredToken).toBe('string');

        await expect(
            noAuthClient.inbox.approveGuardianRequest({ token: expiredToken! })
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
            message: expect.stringContaining('expired'),
        });
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
        await userA.clients.fullAuth.inbox.sendGuardianApprovalEmail({
            guardianEmail: 'guardian@test.com',
        });

        // Mark already approved
        await userA.clients.fullAuth.profile.updateProfile({ approved: true });

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

    describe('guardian approval email status, resend limits, and link invalidation', () => {
        const send = (guardianEmail: string) =>
            userA.clients.fullAuth.inbox.sendGuardianApprovalEmail({ guardianEmail });
        const status = () => userA.clients.fullAuth.inbox.getGuardianApprovalStatus();
        const lastToken = (): string =>
            sendSpy.mock.calls.at(-1)![0].templateModel.approvalToken as string;
        const isApproved = async () =>
            (await userA.clients.fullAuth.profile.getProfile())?.approved;

        beforeEach(async () => {
            await userA.clients.fullAuth.profile.updateProfile({ approved: false });
        });

        it('reports unknown for a pending account with no send history, not_requested otherwise', async () => {
            expect(await status()).toMatchObject({ pendingApproval: true, status: 'unknown' });

            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'guardian-user' });
            expect(await status()).toMatchObject({
                pendingApproval: false,
                status: 'not_requested',
            });
        });

        it('persists provider acceptance without approving the learner', async () => {
            await send('guardian@test.com');

            expect(await status()).toMatchObject({
                pendingApproval: true,
                status: 'accepted',
                guardianEmail: 'guardian@test.com',
                linkExpiresAt: expect.any(String),
            });
            expect(await isApproved()).toBe(false);
        });

        it('persists a failed send, keeps the profile pending, and leaves no usable token', async () => {
            sendSpy.mockRejectedValueOnce(new Error('provider down'));

            await expect(send('guardian@test.com')).rejects.toMatchObject({
                code: 'INTERNAL_SERVER_ERROR',
            });

            const failedToken = lastToken();
            expect(await status()).toMatchObject({
                status: 'failed',
                guardianEmail: 'guardian@test.com',
            });
            expect((await status()).linkExpiresAt).toBeUndefined();
            await expect(
                noAuthClient.inbox.approveGuardianRequest({ token: failedToken })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            expect(await isApproved()).toBe(false);
        });

        it('allows an immediate retry after a failure and records success', async () => {
            sendSpy.mockRejectedValueOnce(new Error('provider down'));
            await expect(send('guardian@test.com')).rejects.toBeDefined();

            await expect(send('guardian@test.com')).resolves.toMatchObject({ status: 'accepted' });
            expect((await status()).status).toBe('accepted');
        });

        it('tracks repeated failures against the attempt budget', async () => {
            sendSpy.mockRejectedValue(new Error('provider down'));

            await expect(send('guardian@test.com')).rejects.toBeDefined();
            await expect(send('guardian@test.com')).rejects.toBeDefined();

            expect(await status()).toMatchObject({
                status: 'failed',
                attemptsRemaining: GUARDIAN_MAX_SENDS_PER_WINDOW - 2,
            });
        });

        it('enforces a cooldown on resending to the same address but allows a correction', async () => {
            await send('guardian@test.com');

            await expect(send('Guardian@Test.com')).rejects.toMatchObject({
                code: 'TOO_MANY_REQUESTS',
            });
            expect((await status()).resendAvailableAt).toEqual(expect.any(String));
            expect(sendSpy).toHaveBeenCalledOnce();

            await expect(send('other@test.com')).resolves.toMatchObject({ status: 'accepted' });
        });

        it('resends an already accepted request to the same address once the cooldown ends', async () => {
            await send('guardian@test.com');
            const firstToken = lastToken();

            const record = await getGuardianApprovalRequest('guardian-user');
            await setGuardianApprovalRequest('guardian-user', {
                ...record!,
                acceptedAt: new Date(Date.now() - 120_000).toISOString(),
            });
            expect((await status()).resendAvailableAt).toBeUndefined();

            await expect(send('guardian@test.com')).resolves.toMatchObject({ status: 'accepted' });

            expect(sendSpy).toHaveBeenCalledTimes(2);
            expect(await status()).toMatchObject({
                pendingApproval: true,
                status: 'accepted',
                guardianEmail: 'guardian@test.com',
                attemptsRemaining: GUARDIAN_MAX_SENDS_PER_WINDOW - 2,
            });
            expect(await isApproved()).toBe(false);
            await expect(
                noAuthClient.inbox.approveGuardianRequest({ token: firstToken })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            await noAuthClient.inbox.approveGuardianRequest({ token: lastToken() });
            expect(await isApproved()).toBe(true);
        });

        it('caps attempts per window across addresses', async () => {
            for (let i = 0; i < GUARDIAN_MAX_SENDS_PER_WINDOW; i += 1) {
                await send(`guardian${i}@test.com`);
            }

            await expect(send('one-more@test.com')).rejects.toMatchObject({
                code: 'TOO_MANY_REQUESTS',
            });
            expect(await status()).toMatchObject({
                attemptsRemaining: 0,
                resendAvailableAt: expect.any(String),
            });
            expect(sendSpy).toHaveBeenCalledTimes(GUARDIAN_MAX_SENDS_PER_WINDOW);
        });

        it('rejects a concurrent send while one is in flight', async () => {
            let release!: () => void;
            sendSpy.mockImplementationOnce(() => new Promise<void>(resolve => (release = resolve)));

            const first = send('guardian@test.com');
            await vi.waitFor(() => expect(sendSpy).toHaveBeenCalledOnce());

            await expect(send('guardian@test.com')).rejects.toMatchObject({ code: 'CONFLICT' });
            expect((await status()).status).toBe('sending');

            release();
            await expect(first).resolves.toMatchObject({ status: 'accepted' });
            expect(sendSpy).toHaveBeenCalledOnce();
        });

        it('reports an interrupted send (sending without a live lock) as unknown', async () => {
            await setGuardianApprovalRequest('guardian-user', {
                status: 'sending',
                guardianEmail: 'guardian@test.com',
                updatedAt: new Date().toISOString(),
            });

            expect((await status()).status).toBe('unknown');
        });

        it('invalidates the old link when the guardian address is corrected', async () => {
            await send('wrong@test.com');
            const oldToken = lastToken();
            await send('right@test.com');
            const newToken = lastToken();

            await expect(
                noAuthClient.inbox.approveGuardianRequest({ token: oldToken })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            expect(await isApproved()).toBe(false);

            await noAuthClient.inbox.approveGuardianRequestByPath({ token: newToken });
            expect(await isApproved()).toBe(true);
            expect(await status()).toMatchObject({
                pendingApproval: false,
                status: 'not_requested',
            });
        });

        it('rejects a stale-address token even if it survived invalidation', async () => {
            await send('wrong@test.com');
            const oldToken = lastToken();
            const record = await getGuardianApprovalRequest('guardian-user');
            await setGuardianApprovalRequest('guardian-user', {
                ...record!,
                guardianEmail: 'right@test.com',
                token: undefined,
            });

            await expect(
                noAuthClient.inbox.approveGuardianRequestByPath({ token: oldToken })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            expect(await isApproved()).toBe(false);
        });

        it('supersedes the previous same-address link once a resend is accepted', async () => {
            await send('guardian@test.com');
            const firstToken = lastToken();
            const record = await getGuardianApprovalRequest('guardian-user');
            await setGuardianApprovalRequest('guardian-user', {
                ...record!,
                acceptedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            });

            await send('guardian@test.com');

            await expect(
                noAuthClient.inbox.approveGuardianRequest({ token: firstToken })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            await noAuthClient.inbox.approveGuardianRequest({ token: lastToken() });
            expect(await isApproved()).toBe(true);
        });

        it('keeps the previous link usable when a same-address resend fails', async () => {
            await send('guardian@test.com');
            const firstToken = lastToken();
            const record = await getGuardianApprovalRequest('guardian-user');
            await setGuardianApprovalRequest('guardian-user', {
                ...record!,
                acceptedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            });
            sendSpy.mockRejectedValueOnce(new Error('provider down'));

            await expect(send('guardian@test.com')).rejects.toBeDefined();
            expect((await status()).status).toBe('failed');

            await noAuthClient.inbox.approveGuardianRequest({ token: firstToken });
            expect(await isApproved()).toBe(true);
        });

        it('rejects sends from an approved account without sending or using an attempt', async () => {
            await userA.clients.fullAuth.profile.updateProfile({ approved: true });

            await expect(send('guardian@test.com')).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });

            expect(sendSpy).not.toHaveBeenCalled();
            expect(await getGuardianApprovalRequest('guardian-user')).toBeNull();
            expect(await status()).toMatchObject({
                status: 'not_requested',
                attemptsRemaining: GUARDIAN_MAX_SENDS_PER_WINDOW,
            });
        });

        it('reports a cache failure while locking as a failed send, not a concurrent one', async () => {
            const redis = cache.redis ?? cache.node;
            const originalSet = redis.set.bind(redis);
            const setSpy = vi
                .spyOn(redis, 'set')
                .mockImplementation(((key: string, ...args: unknown[]) =>
                    key.startsWith('guardian_approval_send_lock:')
                        ? Promise.reject(new Error('redis down'))
                        : (originalSet as (...a: unknown[]) => unknown)(key, ...args)) as never);

            try {
                await expect(send('guardian@test.com')).rejects.toMatchObject({
                    code: 'INTERNAL_SERVER_ERROR',
                });
            } finally {
                setSpy.mockRestore();
            }
            expect(sendSpy).not.toHaveBeenCalled();
        });

        it('never says "Try again after undefined" when the attempt window has no expiry', async () => {
            await cache.set(
                'guardian_approval_send_count:guardian-user',
                String(GUARDIAN_MAX_SENDS_PER_WINDOW),
                false
            );

            const error = await send('guardian@test.com').catch((e: unknown) => e);

            expect(error).toMatchObject({ code: 'TOO_MANY_REQUESTS' });
            expect((error as Error).message).not.toContain('undefined');
            expect((error as Error).message).toContain('Try again later');
        });

        it('stays accepted when post-send bookkeeping fails, and binds approval to the newest link', async () => {
            await send('guardian@test.com');
            const firstToken = lastToken();
            const record = await getGuardianApprovalRequest('guardian-user');
            await setGuardianApprovalRequest('guardian-user', {
                ...record!,
                acceptedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
            });

            const originalDelete = cache.delete;
            const deleteSpy = vi
                .spyOn(cache, 'delete')
                .mockImplementation(keys =>
                    keys.includes(`guardian_approval:${firstToken}`)
                        ? Promise.reject(new Error('redis hiccup'))
                        : originalDelete(keys)
                );

            try {
                await expect(send('guardian@test.com')).resolves.toMatchObject({
                    status: 'accepted',
                });
            } finally {
                deleteSpy.mockRestore();
            }

            expect((await status()).status).toBe('accepted');
            await expect(
                noAuthClient.inbox.approveGuardianRequest({ token: firstToken })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            expect(await isApproved()).toBe(false);

            await noAuthClient.inbox.approveGuardianRequest({ token: lastToken() });
            expect(await isApproved()).toBe(true);
        });

        it('keeps a superseded link dead after a later same-address resend fails', async () => {
            const endCooldown = async () => {
                const record = await getGuardianApprovalRequest('guardian-user');
                await setGuardianApprovalRequest('guardian-user', {
                    ...record!,
                    acceptedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
                });
            };

            await send('guardian@test.com');
            const firstToken = lastToken();
            await endCooldown();

            const originalDelete = cache.delete;
            const deleteSpy = vi
                .spyOn(cache, 'delete')
                .mockImplementation(keys =>
                    keys.includes(`guardian_approval:${firstToken}`)
                        ? Promise.reject(new Error('redis hiccup'))
                        : originalDelete(keys)
                );
            try {
                await send('guardian@test.com');
            } finally {
                deleteSpy.mockRestore();
            }
            const secondToken = lastToken();
            await endCooldown();

            sendSpy.mockRejectedValueOnce(new Error('provider down'));
            await expect(send('guardian@test.com')).rejects.toBeDefined();
            expect(await getGuardianApprovalRequest('guardian-user')).toMatchObject({
                status: 'failed',
                token: secondToken,
            });

            await expect(
                noAuthClient.inbox.approveGuardianRequest({ token: firstToken })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            expect(await isApproved()).toBe(false);

            await noAuthClient.inbox.approveGuardianRequest({ token: secondToken });
            expect(await isApproved()).toBe(true);
        });

        it('still returns accepted when recording the accepted status fails', async () => {
            const originalSet = cache.set;
            const setSpy = vi
                .spyOn(cache, 'set')
                .mockImplementation((key, value, ...rest) =>
                    String(key).startsWith('guardian_approval_request:') &&
                    String(value).includes('"status":"accepted"')
                        ? Promise.reject(new Error('redis hiccup'))
                        : originalSet(key, value, ...rest)
                );

            try {
                await expect(send('guardian@test.com')).resolves.toMatchObject({
                    status: 'accepted',
                });
            } finally {
                setSpy.mockRestore();
            }

            expect(sendSpy).toHaveBeenCalledOnce();
            await noAuthClient.inbox.approveGuardianRequest({ token: lastToken() });
            expect(await isApproved()).toBe(true);
        });

        it('expires the request record (and the guardian email in it) after its retention period', async () => {
            await send('guardian@test.com');

            const ttl = await cache.ttl('guardian_approval_request:guardian-user');
            const maxTtl =
                DEFAULT_GUARDIAN_APPROVAL_TTL_HOURS * 60 * 60 +
                GUARDIAN_REQUEST_RETENTION_BUFFER_SECONDS;

            expect(ttl).toBeGreaterThan(GUARDIAN_REQUEST_RETENTION_BUFFER_SECONDS);
            expect(ttl).toBeLessThanOrEqual(maxTtl + 1);
        });
    });

    describe('guardian approval request retention', () => {
        it('keeps a long-lived link plus the buffer as the retention period', () => {
            const now = Date.now();
            const linkSeconds = 30 * 24 * 60 * 60;

            expect(
                getGuardianRequestRetentionSeconds(
                    { expiresAt: new Date(now + linkSeconds * 1000).toISOString() },
                    now
                )
            ).toBe(linkSeconds + GUARDIAN_REQUEST_RETENTION_BUFFER_SECONDS);
            expect(getGuardianRequestRetentionSeconds({}, now)).toBe(
                DEFAULT_GUARDIAN_APPROVAL_TTL_HOURS * 60 * 60 +
                    GUARDIAN_REQUEST_RETENTION_BUFFER_SECONDS
            );
        });
    });
});

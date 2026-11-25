import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: mocks.send }),
}));

import { sendContractRequestInviteEmail } from '@helpers/contract-request-invites.helpers';

describe('sendContractRequestInviteEmail', () => {
    beforeEach(() => {
        mocks.send.mockReset();
        mocks.send.mockResolvedValue(undefined);
    });
    afterEach(() => vi.restoreAllMocks());

    it('sends the invite template with tenant branding', async () => {
        const branding = { brandName: 'VetPass', appUrl: 'https://vetpass.app/' };
        await expect(
            sendContractRequestInviteEmail({
                email: 'invitee@example.com',
                referrerName: 'Referrer',
                contractOwnerName: 'Owner',
                branding,
            })
        ).resolves.toBe(true);
        expect(mocks.send).toHaveBeenCalledTimes(1);
        expect(mocks.send).toHaveBeenCalledWith({
            contactMethod: { type: 'email', value: 'invitee@example.com' },
            templateId: 'contract-request-invite',
            templateModel: {
                inviteUrl: 'https://vetpass.app',
                referrer: { name: 'Referrer' },
                contractOwner: { name: 'Owner' },
            },
            branding,
        });
    });

    it('uses the default app URL without branding', async () => {
        await sendContractRequestInviteEmail({ email: 'invitee@example.com' });
        expect(mocks.send.mock.calls[0]![0].templateModel.inviteUrl).toBe('https://learncard.app');
    });

    it('returns false and logs no address when delivery fails', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        mocks.send.mockRejectedValueOnce(new Error('Illegal address invitee@example.com'));
        await expect(
            sendContractRequestInviteEmail({ email: 'invitee@example.com' })
        ).resolves.toBe(false);
        expect(warn).toHaveBeenCalledWith('contract_request_invite: email_failed');
        expect(JSON.stringify([...warn.mock.calls, ...error.mock.calls])).not.toContain(
            'invitee@example.com'
        );
    });
});

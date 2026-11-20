import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    send: vi.fn(),
    authorize: vi.fn(),
    createInvite: vi.fn(),
}));
vi.mock('@services/delivery/delivery.factory', () => ({
    getDeliveryService: () => ({ send: mocks.send }),
}));
vi.mock('@accesslayer/contract-request-invite/create', () => ({
    createContractRequestInvite: mocks.createInvite,
}));
vi.mock('@helpers/contract-requests.helpers', () => ({
    authorizeContractRequestSend: mocks.authorize,
    createRequestForProfile: vi.fn(),
}));

import {
    sendContractRequestInviteEmail,
    sendContractRequestToEmail,
} from '@helpers/contract-request-invites.helpers';
import { environment } from '@environment';

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
                tenantId: 'vetpass',
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
            branding: { ...branding, appUrl: 'https://vetpass.app' },
        });
    });

    it('uses the deployment app URL without stored branding', async () => {
        await sendContractRequestInviteEmail({
            email: 'invitee@example.com',
            tenantId: 'learncard',
        });
        expect(mocks.send.mock.calls[0]![0].templateModel.inviteUrl).toBe('https://learncard.app');
    });

    it('overrides an older queued production branding snapshot when delivering on staging', async () => {
        const previous = environment.EMAIL_APP_ORIGINS;
        environment.EMAIL_APP_ORIGINS = JSON.stringify({
            learncard: 'https://staging.learncard.ai',
        });
        try {
            await expect(
                sendContractRequestInviteEmail({
                    email: 'invitee@example.com',
                    tenantId: 'learncard',
                    branding: { appUrl: 'https://learncard.app', brandName: 'LearnCard' },
                })
            ).resolves.toBe(true);
            expect(mocks.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    branding: { appUrl: 'https://staging.learncard.ai', brandName: 'LearnCard' },
                    templateModel: expect.objectContaining({
                        inviteUrl: 'https://staging.learncard.ai',
                    }),
                })
            );
        } finally {
            environment.EMAIL_APP_ORIGINS = previous;
        }
    });

    it('never sends an old queued invite when its tenant identity is missing', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        await expect(
            sendContractRequestInviteEmail({
                email: 'invitee@example.com',
                branding: { appUrl: 'https://learncard.app' },
            })
        ).resolves.toBe(false);
        expect(mocks.send).not.toHaveBeenCalled();
        expect(warn).toHaveBeenCalledWith('contract_request_invite: email_failed');
    });

    it('returns false and logs no address when delivery fails', async () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        mocks.send.mockRejectedValueOnce(new Error('Illegal address invitee@example.com'));
        await expect(
            sendContractRequestInviteEmail({ email: 'invitee@example.com', tenantId: 'learncard' })
        ).resolves.toBe(false);
        expect(warn).toHaveBeenCalledWith('contract_request_invite: email_failed');
        expect(JSON.stringify([...warn.mock.calls, ...error.mock.calls])).not.toContain(
            'invitee@example.com'
        );
    });
});

describe('email invite creation with deployment origin configuration', () => {
    const original = environment.EMAIL_APP_ORIGINS;
    const profile = { profileId: 'sender' } as never;
    const tenant = { id: 'learncard', emailBranding: {} };

    beforeEach(() => {
        vi.clearAllMocks();
        mocks.authorize.mockResolvedValue({ id: 'contract-1' });
        mocks.createInvite.mockResolvedValue({ created: false, invite: { id: 'request-1' } });
        environment.EMAIL_APP_ORIGINS = JSON.stringify({
            learncard: 'https://staging.learncard.ai',
        });
    });
    afterEach(() => {
        environment.EMAIL_APP_ORIGINS = original;
    });

    it('creates a pending invite for a configured tenant', async () => {
        await expect(
            sendContractRequestToEmail(
                { contractUri: 'lc:network:contract:1', targetEmail: 'synthetic@example.com' },
                profile,
                'network.example.com',
                tenant
            )
        ).resolves.toEqual({ requestId: 'request-1', status: 'pending' });
        expect(mocks.createInvite).toHaveBeenCalledOnce();
    });

    it.each([undefined, '{}', '{"learncard":"http://learncard.app"}'])(
        'rejects missing or unsafe config %s before either email can be enqueued',
        async config => {
            environment.EMAIL_APP_ORIGINS = config;
            for (const targetEmail of ['first@example.com', 'second@example.com']) {
                await expect(
                    sendContractRequestToEmail(
                        { contractUri: 'lc:network:contract:1', targetEmail },
                        profile,
                        'network.example.com',
                        tenant
                    )
                ).rejects.toThrow('Email app origin is not configured');
            }
            expect(mocks.authorize).toHaveBeenCalledTimes(2);
            expect(mocks.createInvite).not.toHaveBeenCalled();
            expect(mocks.send).not.toHaveBeenCalled();
        }
    );
});

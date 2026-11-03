import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Campaign } from '@learncard/types';
const mocks = vi.hoisted(() => ({
    claim: vi.fn(),
    acknowledge: vi.fn(),
    send: vi.fn(),
    prepare: vi.fn(),
    stream: vi.fn(),
    recipient: undefined as unknown,
    update: vi.fn(),
    environment: {
        POSTMARK_API_KEY: 'test-only',
        DOMAIN_NAME: 'brain.example',
        POSTMARK_BROADCAST_STREAM: 'broadcast',
        CAMPAIGN_UNSUBSCRIBE_SECRET: 'test-only-secret-at-least-32-bytes-long',
    },
}));
vi.mock('@environment', () => ({ environment: mocks.environment }));
vi.mock('@accesslayer/campaign/email', () => ({
    claimCampaignEmail: mocks.claim,
    acknowledgeCampaignEmail: mocks.acknowledge,
}));
vi.mock('@accesslayer/campaign/preferences', () => ({
    updateAnnouncementPreferences: mocks.update,
}));
vi.mock('../src/services/delivery/adapters/postmark.adapter', () => ({
    PostmarkAdapter: class {
        assertBroadcastStream = mocks.stream;
        prepareCampaignEmail = mocks.prepare;
    },
}));
import { campaignEmailLinks, sendCampaignEmail } from '../src/helpers/campaign-email.helpers';
import {
    signCampaignUnsubscribeToken,
    verifyCampaignUnsubscribeToken,
    unsubscribeFromCampaignEmails,
} from '../src/helpers/campaign-unsubscribe.helpers';
const campaign = {
    id: 'new-programs',
    createdAt: '2026-01-01T00:00:00.000Z',
    tenantId: 'vetpass',
    channels: ['inApp', 'email'],
    message: { id: 'new-programs', enabled: true },
    email: {
        subject: 'New programs',
        title: 'Explore',
        body: 'New opportunities',
        ctaLabel: 'View',
    },
} as Campaign;
beforeEach(() => {
    vi.clearAllMocks();
    mocks.environment.POSTMARK_BROADCAST_STREAM = 'broadcast';
    mocks.environment.POSTMARK_API_KEY = 'test-only';
    mocks.recipient = { campaign, email: 'adult@example.com' };
    mocks.claim.mockImplementation(async (_id, _createdAt, _profileId, _test, prepare) => {
        if (!mocks.recipient) return undefined;
        await prepare(mocks.recipient);
        return mocks.recipient;
    });
    mocks.prepare.mockResolvedValue(mocks.send);
    mocks.stream.mockResolvedValue(undefined);
    mocks.send.mockResolvedValue(undefined);
});
describe('campaign email', () => {
    it('uses stored tenant, broadcast stream, authored subject and RFC 8058 headers', async () => {
        await sendCampaignEmail(campaign, 'adult');
        expect(mocks.claim).toHaveBeenCalledWith(
            campaign.id,
            campaign.createdAt,
            'adult',
            false,
            expect.any(Function)
        );
        expect(mocks.prepare).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: 'New programs',
                messageStream: 'broadcast',
                contactMethod: { type: 'email', value: 'adult@example.com' },
                branding: expect.objectContaining({ brandName: 'VetPass' }),
                headers: [
                    {
                        Name: 'List-Unsubscribe',
                        Value: expect.stringContaining(
                            'https://brain.example/campaigns/unsubscribe?token='
                        ),
                    },
                    { Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' },
                ],
            })
        );
        expect(mocks.acknowledge).toHaveBeenCalledOnce();
        const links = campaignEmailLinks(campaign, 'adult');
        expect(links.ctaUrl).toBe(
            'https://vetpass.app/m/new-programs?utm_source=email&utm_campaign=new-programs'
        );
        expect(links.unsubscribeUrl).toMatch(/^https:\/\/vetpass.app\/unsubscribe\?token=/);
    });
    it.each([
        { channels: ['email'], message: campaign.message },
        { channels: ['inApp', 'email'], message: { ...campaign.message!, enabled: false } },
        { channels: ['inApp', 'email'], message: undefined },
    ])('omits the campaign destination without enabled in-app content: %j', async variant => {
        const stored = { ...campaign, ...variant } as Campaign;
        mocks.recipient = { campaign: stored, email: 'adult@example.com' };
        await sendCampaignEmail(stored, 'adult', true);
        expect(campaignEmailLinks(stored, 'adult').ctaUrl).toBeUndefined();
        const model = mocks.prepare.mock.calls[0][0].templateModel;
        expect(model.ctaUrl).toBeUndefined();
        expect(model.body).toBe(campaign.email!.body);
        expect(model.unsubscribeUrl).toMatch(/^https:\/\/vetpass.app\/unsubscribe\?token=/);
    });
    it('fails stream preflight before attempting a claim', async () => {
        mocks.stream.mockRejectedValueOnce(new Error('Invalid stream'));
        await expect(sendCampaignEmail(campaign, 'adult')).rejects.toThrow('Invalid stream');
        expect(mocks.claim).not.toHaveBeenCalled();
        expect(mocks.send).not.toHaveBeenCalled();
    });
    it('prepares the actual recipient before sending and never sends on render failure', async () => {
        mocks.prepare.mockRejectedValueOnce(new Error('Private render detail'));
        await expect(sendCampaignEmail(campaign, 'adult')).rejects.toThrow(
            'Campaign email preparation failed'
        );
        expect(mocks.send).not.toHaveBeenCalled();
        expect(mocks.acknowledge).not.toHaveBeenCalled();
    });
    it('skips recipients rejected by the durable eligibility/claim boundary', async () => {
        mocks.recipient = undefined;
        expect(await sendCampaignEmail(campaign, 'adult')).toBe(false);
        expect(mocks.send).not.toHaveBeenCalled();
        expect(mocks.acknowledge).not.toHaveBeenCalled();
    });
    it('never acknowledges an uncertain provider send or sends twice in one call', async () => {
        mocks.send.mockRejectedValue(new Error('lost acknowledgement'));
        await expect(sendCampaignEmail(campaign, 'adult')).rejects.toThrow();
        expect(mocks.send).toHaveBeenCalledOnce();
        expect(mocks.acknowledge).not.toHaveBeenCalled();
    });
    it('test sends do not write production emailed stats', async () => {
        await sendCampaignEmail(campaign, 'adult', true);
        expect(mocks.claim).toHaveBeenCalledWith(
            campaign.id,
            campaign.createdAt,
            'adult',
            true,
            expect.any(Function)
        );
        expect(mocks.acknowledge).not.toHaveBeenCalled();
    });
    it('does not claim a retained reservation or expose provider details for a failed self-test', async () => {
        mocks.send.mockRejectedValue(new Error('provider detail with private recipient and token'));
        await expect(sendCampaignEmail(campaign, 'adult', true)).rejects.toThrow(
            /^Campaign test email delivery failed$/
        );
        expect(mocks.send).toHaveBeenCalledOnce();
        expect(mocks.acknowledge).not.toHaveBeenCalled();
    });
    it.each(['', 'outbound', 'OUTBOUND'])(
        'rejects unsafe stream %s before claiming',
        async stream => {
            mocks.environment.POSTMARK_BROADCAST_STREAM = stream;
            await expect(sendCampaignEmail(campaign, 'adult')).rejects.toThrow();
            expect(mocks.claim).not.toHaveBeenCalled();
        }
    );
    it('fails closed without provider configuration', async () => {
        mocks.environment.POSTMARK_API_KEY = '';
        await expect(sendCampaignEmail(campaign, 'adult')).rejects.toThrow();
        expect(mocks.claim).not.toHaveBeenCalled();
    });
});
describe('unsubscribe tokens', () => {
    it('round-trips dotted profile IDs and rejects tampering and malformed tokens', () => {
        const token = signCampaignUnsubscribeToken('adult.name', campaign.id);
        expect(verifyCampaignUnsubscribeToken(token)).toEqual({
            profileId: 'adult.name',
            campaignId: campaign.id,
        });
        const altered = Buffer.from(
            Buffer.from(token, 'base64url').toString().replace('adult', 'other')
        ).toString('base64url');
        for (const invalid of ['', '%%%', altered, token + '.', 'a'.repeat(2049)])
            expect(() => verifyCampaignUnsubscribeToken(invalid)).toThrow();
    });
    it('repeated unsubscribe requests only set the email choice to true', async () => {
        const token = signCampaignUnsubscribeToken('adult', campaign.id);
        await unsubscribeFromCampaignEmails(token);
        await unsubscribeFromCampaignEmails(token);
        expect(mocks.update).toHaveBeenCalledTimes(2);
        expect(mocks.update).toHaveBeenLastCalledWith('adult', { announcementEmailOptOut: true });
    });
});

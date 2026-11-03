import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Campaign } from '@learncard/types';
const mocks = vi.hoisted(() => ({
    claim: vi.fn(),
    acknowledge: vi.fn(),
    send: vi.fn(),
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
        send = mocks.send;
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
    mocks.claim.mockResolvedValue({ campaign, email: 'adult@example.com' });
    mocks.send.mockResolvedValue(undefined);
});
describe('campaign email', () => {
    it('uses stored tenant, broadcast stream, authored subject and RFC 8058 headers', async () => {
        await sendCampaignEmail(campaign, 'adult');
        expect(mocks.claim).toHaveBeenCalledWith(campaign.id, campaign.createdAt, 'adult', false);
        expect(mocks.send).toHaveBeenCalledWith(
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
    it('skips recipients rejected by the durable eligibility/claim boundary', async () => {
        mocks.claim.mockResolvedValue(undefined);
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
        expect(mocks.claim).toHaveBeenCalledWith(campaign.id, campaign.createdAt, 'adult', true);
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

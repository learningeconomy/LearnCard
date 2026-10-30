import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getClient } from '@learncard/network-brain-client';

import { getLearnCardNetworkPlugin } from '../plugin';
import type { LearnCardNetworkPlugin } from '../types';

vi.mock('@learncard/network-brain-client', () => ({
    getClient: vi.fn(),
    getApiTokenClient: vi.fn(),
}));

const profile = { profileId: 'learner', did: 'did:key:learner' };
const wallet = {
    id: { did: () => profile.did },
    invoke: { getDidAuthVp: vi.fn() },
} as unknown as Parameters<LearnCardNetworkPlugin['methods']['getMyCampaigns']>[0];
const query = () => ({ query: vi.fn().mockResolvedValue('result') });
const mutation = () => ({ mutate: vi.fn().mockResolvedValue('result') });
const mockClient = () => ({
    profile: {
        getProfile: {
            query: vi.fn<() => Promise<typeof profile | undefined>>().mockResolvedValue(profile),
        },
    },
    campaigns: {
        isAdmin: query(),
        dispatch: mutation(),
        sendTestToMe: mutation(),
        create: mutation(),
        update: mutation(),
        get: query(),
        list: query(),
        delete: mutation(),
        setStatus: mutation(),
        previewAudience: query(),
        addAudience: mutation(),
        pageAudience: query(),
        getStats: query(),
        getMyCampaigns: query(),
        recordEvent: mutation(),
        enroll: mutation(),
    },
});

beforeEach(() => vi.clearAllMocks());

describe('campaign network plugin methods', () => {
    it('forwards every campaign operation to the correct typed procedure', async () => {
        const client = mockClient();
        vi.mocked(getClient).mockResolvedValue(client as never);
        const { methods } = await getLearnCardNetworkPlugin(wallet, 'https://network.example/trpc');
        const campaign = {
            id: 'pilot-clr',
            name: 'Pilot',
            channels: ['inApp' as const],
            message: { title: 'Welcome' },
        };
        const source = {
            campaignId: campaign.id,
            source: { type: 'dids' as const, dids: [profile.did] },
        };
        const update = { campaignId: campaign.id, updates: { name: 'Renamed' } };

        await expect(methods.campaignsIsAdmin(wallet)).resolves.toBe('result');
        await methods.campaignsCreate(wallet, campaign);
        await methods.campaignsUpdate(wallet, update);
        await methods.campaignsGet(wallet, campaign.id);
        await methods.campaignsList(wallet);
        await methods.campaignsDelete(wallet, campaign.id);
        await methods.campaignsSetStatus(wallet, campaign.id, 'paused');
        await methods.campaignsPreviewAudience(wallet, source);
        await methods.campaignsAddAudience(wallet, source);
        await methods.campaignsPageAudience(wallet, { campaignId: campaign.id, limit: 20 });
        await methods.campaignsGetStats(wallet, campaign.id);
        await methods.campaignsSendTestToMe(wallet, campaign.id);
        await methods.campaignsDispatch(wallet, campaign.id);
        await methods.getMyCampaigns(wallet);
        await methods.recordCampaignEvent(wallet, campaign.id, 'shown');
        await methods.enrollInCampaign(wallet, campaign.id);

        expect(client.campaigns.isAdmin.query).toHaveBeenCalledWith();
        expect(client.campaigns.create.mutate).toHaveBeenCalledWith(campaign);
        expect(client.campaigns.update.mutate).toHaveBeenCalledWith(update);
        expect(client.campaigns.get.query).toHaveBeenCalledWith({ campaignId: campaign.id });
        expect(client.campaigns.list.query).toHaveBeenCalledWith({});
        expect(client.campaigns.delete.mutate).toHaveBeenCalledWith({ campaignId: campaign.id });
        expect(client.campaigns.setStatus.mutate).toHaveBeenCalledWith({
            campaignId: campaign.id,
            status: 'paused',
        });
        expect(client.campaigns.previewAudience.query).toHaveBeenCalledWith(source);
        expect(client.campaigns.addAudience.mutate).toHaveBeenCalledWith(source);
        expect(client.campaigns.pageAudience.query).toHaveBeenCalledWith({
            campaignId: campaign.id,
            limit: 20,
        });
        expect(client.campaigns.getStats.query).toHaveBeenCalledWith({ campaignId: campaign.id });
        expect(client.campaigns.sendTestToMe.mutate).toHaveBeenCalledWith({
            campaignId: campaign.id,
        });
        expect(client.campaigns.dispatch.mutate).toHaveBeenCalledWith({ campaignId: campaign.id });
        expect(client.campaigns.getMyCampaigns.query).toHaveBeenCalledWith();
        expect(client.campaigns.recordEvent.mutate).toHaveBeenCalledWith({
            campaignId: campaign.id,
            event: 'shown',
        });
        expect(client.campaigns.enroll.mutate).toHaveBeenCalledWith({ campaignId: campaign.id });
    });

    it('requires an existing profile and propagates server authorization failures', async () => {
        const client = mockClient();
        client.profile.getProfile.query.mockResolvedValue(undefined);
        vi.mocked(getClient).mockResolvedValue(client as never);
        const { methods } = await getLearnCardNetworkPlugin(wallet, 'https://network.example/trpc');
        await expect(methods.getMyCampaigns(wallet)).rejects.toThrow(
            'Please make an account first'
        );
        expect(client.campaigns.getMyCampaigns.query).not.toHaveBeenCalled();
        client.profile.getProfile.query.mockResolvedValue(profile);
        client.campaigns.enroll.mutate.mockRejectedValue(new Error('Profile is not eligible'));
        await expect(methods.enrollInCampaign(wallet, 'pilot-clr')).rejects.toThrow(
            'Profile is not eligible'
        );
    });
});

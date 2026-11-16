import { inAppMessageValidator, type MyCampaign } from '@learncard/types';
import {
    mergeCampaignMessages,
    isCampaignFrequencySuppressed,
    isCampaignInWindow,
} from '../campaignMessages';

const now = Date.parse('2026-11-02T12:00:00Z');
const campaign = (
    frequency: MyCampaign['campaign']['message']['frequency'] = 'once'
): MyCampaign => ({
    campaign: {
        id: 'pilot',
        selfEnroll: true,
        message: inAppMessageValidator.parse({ id: 'ignored', title: 'Campaign', frequency }),
    },
    state: { shownCount: 0 },
});

it('merges both sources and makes campaign identity authoritative on collisions', () => {
    const flags = ['legacy', 'pilot'].map(id => inAppMessageValidator.parse({ id, title: 'Flag' }));
    const messages = mergeCampaignMessages(flags, [campaign()]);
    expect(messages.map(m => m.id)).toEqual(['legacy', 'pilot']);
    expect(messages[1].title).toBe('Campaign');
    expect(flags[1].title).toBe('Flag');
    expect(mergeCampaignMessages(flags, []).map(m => m.title)).toEqual(['Flag', 'Flag']);
});
it('honors another device’s first shown state for once without local storage', () => {
    const item = campaign();
    expect(isCampaignFrequencySuppressed(item, now)).toBe(false);
    item.state.firstShownAt = '2026-10-01T00:00:00Z';
    expect(isCampaignFrequencySuppressed(item, now)).toBe(true);
});
it('honors the latest server timestamp and exact everyDays boundary', () => {
    const item = campaign({ everyDays: 2 });
    item.state.lastShownAt = '2026-10-31T12:00:00Z';
    expect(isCampaignFrequencySuppressed(item, now - 1)).toBe(true);
    expect(isCampaignFrequencySuppressed(item, now)).toBe(false);
    item.state.lastShownAt = '2026-11-02T12:01:00Z';
    expect(isCampaignFrequencySuppressed(item, now)).toBe(true);
});
it.each(['always', 'session'] as const)('keeps %s frequency device-local', frequency => {
    const item = campaign(frequency);
    item.state.firstShownAt = item.state.lastShownAt = new Date(now).toISOString();
    expect(isCampaignFrequencySuppressed(item, now)).toBe(false);
});
it('fails closed outside the campaign window, including the end boundary', () => {
    const item = campaign();
    item.campaign.startsAt = new Date(now).toISOString();
    item.campaign.endsAt = new Date(now + 1000).toISOString();
    expect(isCampaignInWindow(item, now - 1)).toBe(false);
    expect(isCampaignInWindow(item, now)).toBe(true);
    expect(isCampaignInWindow(item, now + 1000)).toBe(false);
});

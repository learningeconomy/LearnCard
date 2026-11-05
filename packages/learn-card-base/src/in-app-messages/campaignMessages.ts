import type { InAppMessage, MyCampaign } from '@learncard/types';

export const EMPTY_CAMPAIGNS: MyCampaign[] = [];

/** Campaign IDs are authoritative when a flag uses the same ID. */
export const mergeCampaignMessages = (
    flags: InAppMessage[],
    campaigns: MyCampaign[]
): InAppMessage[] => {
    const messages = new Map(flags.map(message => [message.id, message]));
    for (const { campaign } of campaigns) {
        messages.set(campaign.id, { ...campaign.message, id: campaign.id });
    }
    return [...messages.values()];
};

export const isCampaignInWindow = ({ campaign }: MyCampaign, now: number): boolean =>
    (!campaign.startsAt || Date.parse(campaign.startsAt) <= now) &&
    (!campaign.endsAt || Date.parse(campaign.endsAt) > now);

export const isCampaignFrequencySuppressed = (
    { campaign, state }: MyCampaign,
    now: number
): boolean => {
    const frequency = campaign.message.frequency;
    if (frequency === 'once') return Boolean(state.firstShownAt);
    if (typeof frequency === 'object' && state.lastShownAt) {
        return now - Date.parse(state.lastShownAt) < frequency.everyDays * 86_400_000;
    }
    return false;
};

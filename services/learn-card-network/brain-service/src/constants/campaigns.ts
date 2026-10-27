import { environment } from '@environment';

export const CAMPAIGN_ADMIN_PROFILE_IDS = (environment.CAMPAIGN_ADMIN_PROFILE_IDS ?? '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

export const isCampaignAdmin = (profileId: string): boolean =>
    CAMPAIGN_ADMIN_PROFILE_IDS.includes(profileId);

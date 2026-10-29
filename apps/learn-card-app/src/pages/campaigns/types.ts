import type {
    Campaign,
    CampaignAudienceInput,
    CampaignStats,
    CampaignStatus,
    CreateCampaignInput,
    ListCampaignsInput,
    PageCampaignAudienceInput,
    PaginatedCampaignAudience,
    PaginatedCampaigns,
    UpdateCampaignInput,
} from '@learncard/types';

/** Only the supported composer operations; deliberately no full-audience dispatch. */
export interface CampaignApi {
    campaignsIsAdmin(): Promise<boolean>;
    campaignsCreate(input: CreateCampaignInput): Promise<Campaign>;
    campaignsUpdate(input: UpdateCampaignInput): Promise<Campaign>;
    campaignsGet(id: string): Promise<Campaign>;
    campaignsList(input?: ListCampaignsInput): Promise<PaginatedCampaigns>;
    campaignsSetStatus(id: string, status: CampaignStatus): Promise<Campaign>;
    campaignsSendTestToMe(id: string): Promise<boolean>;
    campaignsPreviewAudience(input: CampaignAudienceInput): Promise<{ count: number }>;
    campaignsAddAudience(input: CampaignAudienceInput): Promise<{ count: number }>;
    campaignsPageAudience(input: PageCampaignAudienceInput): Promise<PaginatedCampaignAudience>;
    campaignsGetStats(id: string): Promise<CampaignStats>;
}

export interface CampaignForm {
    id: string;
    name: string;
    inApp: boolean;
    notify: boolean;
    messageJson: string;
    title: string;
    body: string;
    startsAt: string;
    endsAt: string;
    excludeMinors: boolean;
    selfEnroll: boolean;
}

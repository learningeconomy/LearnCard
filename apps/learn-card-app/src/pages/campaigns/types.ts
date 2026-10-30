import type {
    Campaign,
    LCNVisibleProfile,
    CampaignAudienceInput,
    CampaignStats,
    CampaignDispatchPreview,
    CampaignDispatchOptions,
    CampaignStatus,
    CreateCampaignInput,
    ListCampaignsInput,
    PageCampaignAudienceInput,
    PaginatedCampaignAudience,
    PaginatedCampaigns,
    UpdateCampaignInput,
} from '@learncard/types';

/** Supported admin composer operations. */
export interface CampaignApi {
    getProfile(): Promise<LCNVisibleProfile | undefined>;
    searchProfiles(
        query?: string,
        options?: {
            limit?: number;
            includeSelf?: boolean;
            includeServiceProfiles?: boolean;
            includeConnectionStatus?: boolean;
        }
    ): Promise<LCNVisibleProfile[]>;
    campaignsPreviewDispatch(campaignId: string): Promise<CampaignDispatchPreview>;
    campaignsDispatch(
        campaignId: string,
        options?: CampaignDispatchOptions
    ): Promise<{ dispatchId: string }>;
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

export interface CampaignSectionProps {
    step?: string;
    title: string;
    description?: string;
}

export interface CampaignToggleProps {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export interface CampaignDispatchConfirmationProps {
    campaignName: string;
    preview: CampaignDispatchPreview;
    blockedReason?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

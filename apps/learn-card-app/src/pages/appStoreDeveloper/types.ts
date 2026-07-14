import type { AppStoreListing, LaunchType as LCLaunchType } from '@learncard/types';

export type AppListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'LISTED' | 'ARCHIVED';
export type LaunchType = LCLaunchType;
export type PromotionLevel = 'FEATURED_CAROUSEL' | 'CURATED_LIST' | 'STANDARD' | 'DEMOTED';
export type AgeRating = '4+' | '9+' | '12+' | '17+';

export interface AppStoreListingSubmitter {
    profileId: string;
    displayName: string;
    email?: string;
}

// Extended listing type until types package is rebuilt
export interface ExtendedAppStoreListing extends AppStoreListing {
    slug?: string;
    highlights?: string[];
    screenshots?: string[];
    hero_background_color?: string;
    min_age?: number;
    age_rating?: AgeRating;
    submitted_at?: string;
    submitter?: AppStoreListingSubmitter;
    contact_email?: string;
}

export interface AppStoreListingCreate {
    slug?: string;
    display_name: string;
    tagline: string;
    full_description: string;
    icon_url: string;
    launch_type: LaunchType;
    launch_config_json: string;
    category?: string;
    promo_video_url?: string;
    ios_app_store_id?: string;
    android_app_store_id?: string;
    privacy_policy_url?: string;
    terms_url?: string;
    highlights?: string[];
    screenshots?: string[];
    hero_background_color?: string;
    min_age?: number;
    age_rating?: AgeRating;
    contact_email?: string;
}

export const AGE_RATING_OPTIONS: { value: AgeRating; label: string; minAge: number }[] = [
    { value: '4+', label: '4+', minAge: 4 },
    { value: '9+', label: '9+', minAge: 9 },
    { value: '12+', label: '12+', minAge: 12 },
    { value: '17+', label: '17+', minAge: 17 },
];

// Permission types for app capabilities
export type AppPermission =
    | 'request_identity'
    | 'send_credential'
    | 'launch_feature'
    | 'credential_search'
    | 'credential_by_id'
    | 'request_consent'
    | 'template_issuance';

export const PERMISSION_OPTIONS: {
    value: AppPermission;
    label: string;
    description: string;
    labelKey: string;
    descriptionKey: string;
}[] = [
    {
        value: 'request_identity',
        label: 'Request Identity',
        description: 'Request user identity and DID',
        labelKey: 'developerPortal.permissions.requestIdentity.label',
        descriptionKey: 'developerPortal.permissions.requestIdentity.description',
    },
    {
        value: 'send_credential',
        label: 'Send Credential',
        description: 'Send credentials to user wallet',
        labelKey: 'developerPortal.permissions.sendCredential.label',
        descriptionKey: 'developerPortal.permissions.sendCredential.description',
    },
    {
        value: 'launch_feature',
        label: 'Launch Feature',
        description: 'Launch wallet features programmatically',
        labelKey: 'developerPortal.permissions.launchFeature.label',
        descriptionKey: 'developerPortal.permissions.launchFeature.description',
    },
    {
        value: 'credential_search',
        label: 'Credential Search',
        description: 'Search user credentials',
        labelKey: 'developerPortal.permissions.credentialSearch.label',
        descriptionKey: 'developerPortal.permissions.credentialSearch.description',
    },
    {
        value: 'credential_by_id',
        label: 'Credential by ID',
        description: 'Retrieve specific credentials by ID',
        labelKey: 'developerPortal.permissions.credentialById.label',
        descriptionKey: 'developerPortal.permissions.credentialById.description',
    },
    {
        value: 'request_consent',
        label: 'Request Consent',
        description: 'Request consent for data sharing',
        labelKey: 'developerPortal.permissions.requestConsent.label',
        descriptionKey: 'developerPortal.permissions.requestConsent.description',
    },
    {
        value: 'template_issuance',
        label: 'Template Issuance',
        description: 'Issue credentials from templates',
        labelKey: 'developerPortal.permissions.templateIssuance.label',
        descriptionKey: 'developerPortal.permissions.templateIssuance.description',
    },
];

export interface LaunchConfig {
    url?: string;
    permissions?: AppPermission[];
    contractUri?: string;
    redirectUri?: string;
    scopes?: string[];
    webhookUrl?: string;
    apiKey?: string;
    aiTutorUrl?: string;
    skipInstallation?: boolean;
}

export const LAUNCH_TYPE_INFO: Record<
    LaunchType,
    {
        label: string;
        description: string;
        icon: string;
        comingSoon?: boolean;
        labelKey: string;
        descriptionKey: string;
    }
> = {
    EMBEDDED_IFRAME: {
        label: 'Embedded Iframe',
        description: 'Your app runs inside an iframe within the LearnCard wallet',
        icon: 'layout',
        labelKey: 'developerPortal.launchTypeInfo.embeddedIframe.label',
        descriptionKey: 'developerPortal.launchTypeInfo.embeddedIframe.description',
    },
    SECOND_SCREEN: {
        label: 'Second Screen',
        description: 'Opens your app in a new window or tab alongside the wallet',
        icon: 'external-link',
        comingSoon: true,
        labelKey: 'developerPortal.launchTypeInfo.secondScreen.label',
        descriptionKey: 'developerPortal.launchTypeInfo.secondScreen.description',
    },
    DIRECT_LINK: {
        label: 'Direct Link',
        description: 'Simple redirect to your application URL',
        icon: 'link',
        labelKey: 'developerPortal.launchTypeInfo.directLink.label',
        descriptionKey: 'developerPortal.launchTypeInfo.directLink.description',
    },
    CONSENT_REDIRECT: {
        label: 'Consent Flow',
        description: 'OAuth-style consent flow with credential sharing permissions',
        icon: 'shield-check',
        labelKey: 'developerPortal.launchTypeInfo.consentRedirect.label',
        descriptionKey: 'developerPortal.launchTypeInfo.consentRedirect.description',
    },
    SERVER_HEADLESS: {
        label: 'Server Headless',
        description: 'Backend integration with webhook notifications',
        icon: 'server',
        labelKey: 'developerPortal.launchTypeInfo.serverHeadless.label',
        descriptionKey: 'developerPortal.launchTypeInfo.serverHeadless.description',
    },
    AI_TUTOR: {
        label: 'AI Tutor',
        description: 'AI tutoring app with topic selection and session tracking',
        icon: 'sparkles',
        labelKey: 'developerPortal.launchTypeInfo.aiTutor.label',
        descriptionKey: 'developerPortal.launchTypeInfo.aiTutor.description',
    },
};

export const CATEGORY_OPTIONS = [
    { value: 'ai', label: 'AI', labelKey: 'developerPortal.categories.ai' },
    { value: 'learning', label: 'Learning', labelKey: 'developerPortal.categories.learning' },
    { value: 'games', label: 'Games', labelKey: 'developerPortal.categories.games' },
    { value: 'tools', label: 'Tools', labelKey: 'developerPortal.categories.tools' },
    { value: 'employment', label: 'Employment', labelKey: 'developerPortal.categories.employment' },
    {
        value: 'credentials',
        label: 'Credentials',
        labelKey: 'developerPortal.categories.credentials',
    },
    { value: 'plugin', label: 'Plugin', labelKey: 'developerPortal.categories.plugin' },
    { value: 'other', label: 'Other', labelKey: 'developerPortal.categories.other' },
];

export const STATUS_INFO: Record<
    AppListingStatus,
    { label: string; color: string; bgColor: string; labelKey: string }
> = {
    DRAFT: {
        label: 'Draft',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
        labelKey: 'developerPortal.status.draft',
    },
    PENDING_REVIEW: {
        label: 'Pending',
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
        labelKey: 'developerPortal.status.pending',
    },
    LISTED: {
        label: 'Listed',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-100',
        labelKey: 'developerPortal.status.listed',
    },
    ARCHIVED: {
        label: 'Archived',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        labelKey: 'developerPortal.status.archived',
    },
};

export const PROMOTION_LEVEL_INFO: Record<
    PromotionLevel,
    { label: string; description: string; labelKey: string; descriptionKey: string }
> = {
    FEATURED_CAROUSEL: {
        label: 'Featured Carousel',
        description: 'Prominently displayed in the featured section',
        labelKey: 'developerPortal.promotion.featuredCarousel.label',
        descriptionKey: 'developerPortal.promotion.featuredCarousel.description',
    },
    CURATED_LIST: {
        label: 'Curated List',
        description: 'Included in curated collections',
        labelKey: 'developerPortal.promotion.curatedList.label',
        descriptionKey: 'developerPortal.promotion.curatedList.description',
    },
    STANDARD: {
        label: 'Standard',
        description: 'Normal visibility in search and browse',
        labelKey: 'developerPortal.promotion.standard.label',
        descriptionKey: 'developerPortal.promotion.standard.description',
    },
    DEMOTED: {
        label: 'Demoted',
        description: 'Reduced visibility in listings',
        labelKey: 'developerPortal.promotion.demoted.label',
        descriptionKey: 'developerPortal.promotion.demoted.description',
    },
};

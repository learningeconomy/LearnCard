import type { AppStoreListing, LaunchType as LCLaunchType } from '@learncard/types';

export type AppListingStatus = 'DRAFT' | 'PENDING_REVIEW' | 'LISTED' | 'ARCHIVED';
export type LaunchType = LCLaunchType;
export type PromotionLevel = 'FEATURED_CAROUSEL' | 'CURATED_LIST' | 'STANDARD' | 'DEMOTED';

// Extended listing type until types package is rebuilt
export interface ExtendedAppStoreListing extends AppStoreListing {
    highlights?: string[];
    screenshots?: string[];
}

export interface AppStoreListingCreate {
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
}

// Permission types for app capabilities
export type AppPermission =
    | 'request_identity'
    | 'send_credential'
    | 'launch_feature'
    | 'credential_search'
    | 'credential_by_id'
    | 'request_consent'
    | 'template_issuance';

export const PERMISSION_OPTIONS: { value: AppPermission; label: string; description: string }[] = [
    { value: 'request_identity', label: 'Request Identity', description: 'Request user identity and DID' },
    { value: 'send_credential', label: 'Send Credential', description: 'Send credentials to user wallet' },
    { value: 'launch_feature', label: 'Launch Feature', description: 'Launch wallet features programmatically' },
    { value: 'credential_search', label: 'Credential Search', description: 'Search user credentials' },
    { value: 'credential_by_id', label: 'Credential by ID', description: 'Retrieve specific credentials by ID' },
    { value: 'request_consent', label: 'Request Consent', description: 'Request consent for data sharing' },
    { value: 'template_issuance', label: 'Template Issuance', description: 'Issue credentials from templates' },
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
}

export const LAUNCH_TYPE_INFO: Record<
    LaunchType,
    { label: string; description: string; icon: string }
> = {
    EMBEDDED_IFRAME: {
        label: 'Embedded Iframe',
        description: 'Your app runs inside an iframe within the LearnCard wallet',
        icon: 'layout',
    },
    SECOND_SCREEN: {
        label: 'Second Screen',
        description: 'Opens your app in a new window or tab alongside the wallet',
        icon: 'external-link',
    },
    DIRECT_LINK: {
        label: 'Direct Link',
        description: 'Simple redirect to your application URL',
        icon: 'link',
    },
    CONSENT_REDIRECT: {
        label: 'Consent Flow',
        description: 'OAuth-style consent flow with credential sharing permissions',
        icon: 'shield-check',
    },
    SERVER_HEADLESS: {
        label: 'Server Headless',
        description: 'Backend integration with webhook notifications',
        icon: 'server',
    },
    AI_TUTOR: {
        label: 'AI Tutor',
        description: 'AI tutoring app with topic selection and session tracking',
        icon: 'sparkles',
    },
};

export const CATEGORY_OPTIONS = [
    { value: 'education', label: 'Education' },
    { value: 'credentials', label: 'Credentials & Verification' },
    { value: 'employment', label: 'Employment' },
    { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'government', label: 'Government' },
    { value: 'social', label: 'Social' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'developer', label: 'Developer Tools' },
    { value: 'ai', label: 'AI & Machine Learning' },
    { value: 'games', label: 'Games' },
    { value: 'other', label: 'Other' },
];

export const STATUS_INFO: Record<
    AppListingStatus,
    { label: string; color: string; bgColor: string }
> = {
    DRAFT: {
        label: 'Draft',
        color: 'text-gray-600',
        bgColor: 'bg-gray-100',
    },
    PENDING_REVIEW: {
        label: 'Pending',
        color: 'text-amber-700',
        bgColor: 'bg-amber-100',
    },
    LISTED: {
        label: 'Listed',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-100',
    },
    ARCHIVED: {
        label: 'Archived',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
    },
};

export const PROMOTION_LEVEL_INFO: Record<
    PromotionLevel,
    { label: string; description: string }
> = {
    FEATURED_CAROUSEL: {
        label: 'Featured Carousel',
        description: 'Prominently displayed in the featured section',
    },
    CURATED_LIST: {
        label: 'Curated List',
        description: 'Included in curated collections',
    },
    STANDARD: {
        label: 'Standard',
        description: 'Normal visibility in search and browse',
    },
    DEMOTED: {
        label: 'Demoted',
        description: 'Reduced visibility in listings',
    },
};

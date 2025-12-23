export interface OrganizationProfile {
    did: string;
    profileId: string;
    displayName: string;
    image?: string;
    isServiceProfile: boolean;
}

export interface PartnerProject {
    id: string;
    name: string;
    did?: string;
    apiKey?: string;
    createdAt: string;
}

export interface ProfileDisplay {
    backgroundColor?: string;
    backgroundImage?: string;
    fadeBackgroundImage?: boolean;
    repeatBackgroundImage?: boolean;
    fontColor?: string;
    accentColor?: string;
    accentFontColor?: string;
    idBackgroundImage?: string;
    fadeIdBackgroundImage?: boolean;
    idBackgroundColor?: string;
    repeatIdBackgroundImage?: boolean;
}

export interface BrandingConfig {
    displayName: string;
    image: string;
    shortBio: string;
    bio: string;
    display: ProfileDisplay;
}

export interface CredentialField {
    id: string;
    name: string;
    type: 'text' | 'date' | 'number' | 'url' | 'email';
    required: boolean;
    description?: string;
}

export interface CredentialTemplate {
    id: string;
    name: string;
    description: string;
    achievementType: string;
    fields: CredentialField[];
    imageUrl?: string;
}

export interface FieldMapping {
    sourceField: string;
    targetField: string;
}

export interface DataMappingConfig {
    webhookUrl?: string;
    samplePayload?: Record<string, unknown>;
    mappings: FieldMapping[];
}

export type IntegrationMethod = 'webhook' | 'api' | 'csv';

export interface PartnerOnboardingState {
    currentStep: number;
    organization: OrganizationProfile | null;
    project: PartnerProject | null;
    branding: BrandingConfig | null;
    templates: CredentialTemplate[];
    integrationMethod: IntegrationMethod | null;
    dataMapping: DataMappingConfig | null;
    isTestMode: boolean;
    isLive: boolean;
}

export const ONBOARDING_STEPS = [
    { id: 'organization', title: 'Organization', description: 'Select or create your organization account' },
    { id: 'project-setup', title: 'Project Setup', description: 'Create your project and get credentials' },
    { id: 'branding', title: 'Branding', description: 'Customize your credential appearance' },
    { id: 'templates', title: 'Templates', description: 'Define your credential schemas' },
    { id: 'integration', title: 'Integration', description: 'Choose how to connect' },
    { id: 'mapping', title: 'Data Mapping', description: 'Map your data to credentials' },
    { id: 'testing', title: 'Testing', description: 'Test your integration' },
    { id: 'production', title: 'Go Live', description: 'Launch and monitor' },
] as const;

export type OnboardingStepId = typeof ONBOARDING_STEPS[number]['id'];

export const DEFAULT_ONBOARDING_STATE: PartnerOnboardingState = {
    currentStep: 0,
    organization: null,
    project: null,
    branding: null,
    templates: [],
    integrationMethod: null,
    dataMapping: null,
    isTestMode: false,
    isLive: false,
};

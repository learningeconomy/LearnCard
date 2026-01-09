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
    sourceMapping?: string;
    /** The Mustache variable name used in the credential template (e.g., "recipient_name") */
    variableName?: string;
}

/** Convert a field name to a valid Mustache variable name */
export const fieldNameToVariable = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
};

export interface TemplateConfig {
    fields: CredentialField[];
    achievementType: string;
    version: string;
}

export interface TemplateBoostMeta {
    integrationId: string;
    templateConfig: TemplateConfig;
    /** If true, this is a master template with child boosts */
    isMasterTemplate?: boolean;
}

export interface CredentialTemplate {
    id: string;
    name: string;
    description: string;
    achievementType: string;
    fields: CredentialField[];
    imageUrl?: string;
    boostUri?: string;
    isNew?: boolean;
    isDirty?: boolean;
    /** OBv3 template data for the new credential builder */
    obv3Template?: unknown;
    /** If true, this is a master template that should not be issued directly */
    isMasterTemplate?: boolean;
    /** Child templates linked to this master template */
    childTemplates?: CredentialTemplate[];
    /** Parent template ID if this is a child template */
    parentTemplateId?: string;
}

export interface FieldMapping {
    sourceField: string;
    targetField: string;
}

export interface DataMappingConfig {
    webhookUrl?: string;
    samplePayload?: Record<string, unknown>;
    mappings: FieldMapping[];
    /** For master templates: source field that identifies which child boost to use */
    boostSelectorField?: string;
    /** Match type for boost selector: 'id' for exact match, 'name' for name-based fallback */
    boostSelectorMatchType?: 'id' | 'name';
}

export type IntegrationMethod = 'webhook' | 'api' | 'csv';

export type IntegrationStatus = 'setup' | 'active' | 'paused';

/** Extended integration config stored in integration metadata */
export interface IntegrationConfig {
    status: IntegrationStatus;
    setupCompletedAt?: string;
    setupStep?: number;

    integrationMethod?: IntegrationMethod;
    webhookUrl?: string;
    dataMapping?: DataMappingConfig;

    // Stats (computed, not stored)
    totalCredentialsIssued?: number;
    totalTemplates?: number;
    lastIssuedAt?: string;
}

/** Integration with extended config for dashboard display */
export interface IntegrationWithConfig {
    id: string;
    name: string;
    createdAt?: string;
    config?: IntegrationConfig;
}

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

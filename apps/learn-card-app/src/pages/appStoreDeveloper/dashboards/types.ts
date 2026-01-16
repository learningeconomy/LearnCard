import type { LCNIntegration } from '@learncard/types';

export interface DashboardConfig {
    showTemplates: boolean;
    showApiTokens: boolean;
    showEmbedCode: boolean;
    showContracts: boolean;
    showBranding: boolean;
    showSigningAuthority: boolean;
    showConnections: boolean;
    showAppListings: boolean;
    showPartnerConnect: boolean;
    showAppConfig: boolean;
}

export interface DashboardStats {
    totalIssued: number;
    totalClaimed: number;
    pendingClaims: number;
    claimRate: number;
    activeTokens: number;
    templateCount: number;
    activeContracts: number;
    totalConnections: number;
}

export interface DashboardTabConfig {
    id: string;
    label: string;
    icon: React.ElementType;
}

export type AuthGrant = {
    id: string;
    name: string;
    challenge: string;
    createdAt: string;
    status: 'revoked' | 'active';
    scope: string;
    description?: string;
};

export interface CredentialField {
    id?: string;
    key?: string;
    label?: string;
    name?: string;
    type: string;
    required?: boolean;
    variableName?: string;
    sourceMapping?: string;
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
    obv3Template?: unknown;
    isMasterTemplate?: boolean;
    childTemplates?: CredentialTemplate[];
    parentTemplateId?: string;
}

export interface BrandingConfig {
    displayName: string;
    image: string;
    shortBio: string;
    bio: string;
    display: Record<string, unknown>;
}

export function getConfigForGuideType(guideType?: string): DashboardConfig {
    const baseConfig: DashboardConfig = {
        showTemplates: false,
        showApiTokens: false,
        showEmbedCode: false,
        showContracts: false,
        showBranding: true,
        showSigningAuthority: false,
        showConnections: false,
        showAppListings: false,
        showPartnerConnect: false,
        showAppConfig: false,
    };

    switch (guideType) {
        case 'issue-credentials':
            return {
                ...baseConfig,
                showApiTokens: true,
                showSigningAuthority: true,
                showTemplates: true,
            };

        case 'embed-claim':
            return {
                ...baseConfig,
                showApiTokens: true,
                showEmbedCode: true,
                showTemplates: true,
            };

        case 'embed-app':
            return {
                ...baseConfig,
                showApiTokens: true,
                showAppListings: true,
                showPartnerConnect: true,
                // Re-enable app config when polished
                showAppConfig: false,
                showTemplates: false,
                showContracts: true,
            };

        case 'consent-flow':
            return {
                ...baseConfig,
                showContracts: true,
                showConnections: true,
                showApiTokens: true,
            };

        case 'course-catalog':
        default:
            return {
                ...baseConfig,
                showApiTokens: true,
                showTemplates: true,
            };
    }
}

// Note: getTabsForConfig is now in UnifiedIntegrationDashboard to avoid require() issues

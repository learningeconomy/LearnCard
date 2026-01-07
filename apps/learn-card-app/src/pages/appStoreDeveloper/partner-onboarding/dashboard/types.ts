import { CredentialTemplate, BrandingConfig, IntegrationMethod, DataMappingConfig, PartnerProject } from '../types';

export type DashboardTab = 'overview' | 'templates' | 'branding' | 'integration' | 'analytics';

export interface IntegrationStats {
    totalIssued: number;
    totalClaimed: number;
    pendingClaims: number;
    claimRate: number;
    lastIssuedAt?: string;
}

export interface DashboardState {
    project: PartnerProject;
    branding: BrandingConfig | null;
    templates: CredentialTemplate[];
    integrationMethod: IntegrationMethod | null;
    dataMapping: DataMappingConfig | null;
    stats: IntegrationStats;
    isLoading: boolean;
    isSandbox: boolean;
}

export interface TemplateStats {
    templateId: string;
    boostUri: string;
    issued: number;
    claimed: number;
    pending: number;
}

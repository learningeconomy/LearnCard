import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
    Zap,
    CheckCircle2,
    AlertCircle,
    Key,
    BarChart3,
    Loader2,
    LayoutDashboard,
    Award,
    Code,
    FileText,
    Users,
    Shield,
    Palette,
    TestTube2,
    FileCode,
    Layout,
    Link as LinkIcon,
    Settings,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { DashboardLayout, QuickStats, StatItem } from './shared';
import {
    OverviewTab,
    TemplatesTab,
    ApiTokensTab,
    EmbedCodeTab,
    ContractsTab,
    ConnectionsTab,
    SigningTab,
    BrandingTab,
    AnalyticsTab,
    IntegrationCodeTab,
    TestingTab,
    AppListingsTab,
    PartnerConnectTab,
    AppConfigTab,
} from './tabs';
import {
    DashboardConfig,
    DashboardStats,
    DashboardTabConfig,
    AuthGrant,
    CredentialTemplate,
    BrandingConfig,
    getConfigForGuideType,
} from './types';

function getTabsForConfig(config: DashboardConfig): DashboardTabConfig[] {
    const tabs: DashboardTabConfig[] = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    ];

    if (config.showTemplates) {
        tabs.push({ id: 'templates', label: 'Templates', icon: Award });
    }

    if (config.showApiTokens) {
        tabs.push({ id: 'tokens', label: 'API Tokens', icon: Key });
    }

    if (config.showEmbedCode) {
        tabs.push({ id: 'embed-code', label: 'Embed Code', icon: Code });
    }

    if (config.showContracts) {
        tabs.push({ id: 'contracts', label: 'Contracts', icon: FileText });
    }

    if (config.showConnections) {
        tabs.push({ id: 'connections', label: 'Connections', icon: Users });
    }

    if (config.showSigningAuthority) {
        tabs.push({ id: 'signing', label: 'Signing', icon: Shield });
    }

    if (config.showBranding) {
        tabs.push({ id: 'branding', label: 'Branding', icon: Palette });
    }

    // embed-app specific tabs
    if (config.showAppListings) {
        tabs.push({ id: 'app-listings', label: 'App Listings', icon: Layout });
    }

    if (config.showPartnerConnect) {
        tabs.push({ id: 'partner-connect', label: 'Partner Connect', icon: LinkIcon });
    }

    if (config.showAppConfig) {
        tabs.push({ id: 'app-config', label: 'App Config', icon: Settings });
    }

    // course-catalog specific tabs (API code + testing)
    if (config.showTemplates && !config.showAppListings) {
        tabs.push({ id: 'code', label: 'Code', icon: FileCode });
        tabs.push({ id: 'testing', label: 'Testing', icon: TestTube2 });
    }

    tabs.push({ id: 'analytics', label: 'Analytics', icon: BarChart3 });

    return tabs;
}

interface UnifiedIntegrationDashboardProps {
    integration: LCNIntegration;
    onBack?: () => void;
}

export const UnifiedIntegrationDashboard: React.FC<UnifiedIntegrationDashboardProps> = ({
    integration,
    onBack,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const config = useMemo(() => getConfigForGuideType(integration.guideType), [integration.guideType]);
    const tabs = useMemo(() => getTabsForConfig(config), [config]);

    const [activeTab, setActiveTab] = useState<string>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [authGrants, setAuthGrants] = useState<AuthGrant[]>([]);
    const [templates, setTemplates] = useState<CredentialTemplate[]>([]);
    const [branding, setBranding] = useState<BrandingConfig | null>(null);
    const [contracts, setContracts] = useState<any[]>([]);

    const [stats, setStats] = useState<DashboardStats>({
        totalIssued: 0,
        totalClaimed: 0,
        pendingClaims: 0,
        claimRate: 0,
        activeTokens: 0,
        templateCount: 0,
        activeContracts: 0,
        totalConnections: 0,
    });

    const loadDashboardData = useCallback(async (showRefresh = false) => {
        if (showRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const wallet = await initWalletRef.current();

            // Fetch auth grants (API tokens)
            let activeTokenCount = 0;
            if (config.showApiTokens) {
                try {
                    const grants = await wallet.invoke.getAuthGrants();
                    const validGrants = (grants || []).filter((g): g is AuthGrant =>
                        !!g.id && !!g.name && !!g.challenge && !!g.status && !!g.createdAt
                    );
                    setAuthGrants(validGrants);
                    activeTokenCount = validGrants.filter(g => g.status === 'active').length;
                } catch (err) {
                    console.warn('Could not load auth grants:', err);
                }
            }

            // Fetch templates (boosts) for this integration
            let integrationBoostUris = new Set<string>();
            const boostsResult = await wallet.invoke.getPaginatedBoosts({
                limit: 50,
                query: { meta: { integrationId: integration.id } },
            });

            if (boostsResult?.records) {
                const boostUris = boostsResult.records.map((boost: any) => boost.uri).filter(Boolean);
                integrationBoostUris = new Set(boostUris);

                // Fetch full boost data to get proper names (paginated response is summarized)
                const loadedTemplates: CredentialTemplate[] = [];

                for (const boostUri of boostUris) {
                    try {
                        const fullBoost = await wallet.invoke.getBoost(boostUri);
                        const meta = fullBoost?.meta as Record<string, unknown> | undefined;
                        const templateConfig = meta?.templateConfig as Record<string, unknown> | undefined;
                        const credential = fullBoost?.boost as Record<string, unknown> | undefined;

                        const template: CredentialTemplate = {
                            id: boostUri,
                            name: fullBoost?.name || (credential?.name as string) || 'Untitled Template',
                            description: (credential?.description as string) || '',
                            achievementType: (templateConfig?.achievementType as string) || fullBoost?.type || 'Achievement',
                            fields: (templateConfig?.fields as CredentialTemplate['fields']) || [],
                            imageUrl: (fullBoost as Record<string, unknown>)?.image as string | undefined,
                            boostUri,
                            isNew: false,
                            isDirty: false,
                            obv3Template: credential,
                            isMasterTemplate: meta?.isMasterTemplate as boolean | undefined,
                        };

                        // If master template, fetch children
                        if (template.isMasterTemplate) {
                            try {
                                const childrenResult = await wallet.invoke.getBoostChildren(boostUri, { limit: 100 });
                                const childRecords = childrenResult?.records || [];
                                const children: CredentialTemplate[] = [];

                                for (const childRecord of childRecords) {
                                    const childUri = (childRecord as Record<string, unknown>).uri as string;
                                    if (!childUri) continue;

                                    integrationBoostUris.add(childUri);

                                    try {
                                        const fullChild = await wallet.invoke.getBoost(childUri);
                                        const childMeta = fullChild?.meta as Record<string, unknown> | undefined;
                                        const childConfig = childMeta?.templateConfig as Record<string, unknown> | undefined;
                                        const childCredential = fullChild?.boost as Record<string, unknown> | undefined;

                                        children.push({
                                            id: childUri,
                                            name: fullChild?.name || (childCredential?.name as string) || 'Untitled Template',
                                            description: (childCredential?.description as string) || '',
                                            achievementType: (childConfig?.achievementType as string) || 'Course Completion',
                                            fields: (childConfig?.fields as CredentialTemplate['fields']) || [],
                                            imageUrl: (fullChild as Record<string, unknown>)?.image as string | undefined,
                                            boostUri: childUri,
                                            isNew: false,
                                            isDirty: false,
                                            obv3Template: childCredential,
                                            parentTemplateId: boostUri,
                                        });
                                    } catch (e) {
                                        console.warn('Failed to fetch child boost:', childUri, e);
                                    }
                                }

                                template.childTemplates = children;
                            } catch (e) {
                                console.warn('Failed to fetch boost children:', boostUri, e);
                            }
                        }

                        loadedTemplates.push(template);
                    } catch (e) {
                        console.warn('Failed to fetch boost:', boostUri, e);
                    }
                }

                setTemplates(loadedTemplates);
            }

            // Fetch consent contracts if needed
            let activeContractsCount = 0;
            if (config.showContracts) {
                try {
                    const contractsResult = await wallet.invoke.getConsentedContracts?.({ limit: 50 });
                    const contractList = contractsResult?.records || [];
                    setContracts(contractList);
                    activeContractsCount = contractList.length;
                } catch (err) {
                    console.warn('Could not load contracts:', err);
                }
            }

            // Fetch credential stats using getPaginatedBoostRecipients for complete analytics
            // This captures ALL sends (profileId, DID, email, phone) not just inbox sends
            let totalIssued = 0;
            let totalAccepted = 0;
            try {
                for (const boostUri of integrationBoostUris) {
                    try {
                        // getPaginatedBoostRecipients(uri, limit, cursor, includeUnacceptedBoosts)
                        const recipients = await wallet.invoke.getPaginatedBoostRecipients?.(
                            boostUri,
                            500,        // limit
                            undefined,  // cursor
                            true        // includeUnacceptedBoosts
                        );

                        const records = recipients?.records || [];
                        totalIssued += records.length;
                        // Count accepted = has a 'received' date (credential was accepted)
                        totalAccepted += records.filter((r: any) => r.received).length;
                    } catch (e) {
                        console.warn('Could not load recipients for boost:', boostUri, e);
                    }
                }
            } catch (err) {
                console.warn('Could not load credential stats:', err);
            }

            const totalClaimed = totalAccepted;

            // Load branding from profile
            if (config.showBranding && !branding) {
                try {
                    const profile = await wallet.invoke.getProfile();
                    if (profile) {
                        setBranding({
                            displayName: profile.displayName || '',
                            image: profile.image || '',
                            shortBio: profile.shortBio || '',
                            bio: profile.bio || '',
                            display: profile.display || {},
                        });
                    }
                } catch (err) {
                    console.warn('Could not load profile:', err);
                }
            }

            const pendingClaims = totalIssued - totalClaimed;
            const claimRate = totalIssued > 0 ? (totalClaimed / totalIssued) * 100 : 0;

            setStats({
                totalIssued,
                totalClaimed,
                pendingClaims,
                claimRate,
                activeTokens: activeTokenCount,
                templateCount: templates.length || boostsResult?.records?.length || 0,
                activeContracts: activeContractsCount,
                totalConnections: 0,
            });
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            presentToast('Failed to load dashboard data', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [integration.id, config, branding, presentToast]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleRefresh = () => loadDashboardData(true);

    const quickStats: StatItem[] = [
        { label: 'Credentials Issued', value: stats.totalIssued, icon: Zap, iconBgColor: 'bg-cyan-100', iconColor: 'text-cyan-600' },
        { label: 'Claimed', value: stats.totalClaimed, icon: CheckCircle2, iconBgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
        { label: 'Pending', value: stats.pendingClaims, icon: AlertCircle, iconBgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
        config.showApiTokens
            ? { label: 'Active Tokens', value: stats.activeTokens, icon: Key, iconBgColor: 'bg-violet-100', iconColor: 'text-violet-600' }
            : { label: 'Claim Rate', value: `${stats.claimRate.toFixed(1)}%`, icon: BarChart3, iconBgColor: 'bg-violet-100', iconColor: 'text-violet-600' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-cyan-500 mx-auto animate-spin" />
                    <p className="text-sm text-gray-500 mt-3">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const getSubtitle = () => {
        switch (integration.guideType) {
            case 'issue-credentials':
                return 'Issue Credentials Dashboard';
            case 'embed-claim':
            case 'embed-app':
                return 'Embed Integration Dashboard';
            case 'consent-flow':
                return 'Consent Flow Dashboard';
            case 'course-catalog':
                return 'Course Catalog Dashboard';
            default:
                return 'Integration Dashboard';
        }
    };

    return (
        <DashboardLayout
            integration={integration}
            title={integration.name}
            subtitle={getSubtitle()}
            // onBack={onBack}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            statsBar={<QuickStats stats={quickStats} />}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
        >
            {activeTab === 'overview' && (
                <OverviewTab
                    integration={integration}
                    config={config}
                    stats={stats}
                    templates={templates}
                    onNavigate={setActiveTab}
                />
            )}

            {activeTab === 'templates' && (
                <TemplatesTab
                    templates={templates}
                    integrationId={integration.id}
                    branding={branding}
                    onRefresh={handleRefresh}
                />
            )}

            {activeTab === 'tokens' && (
                <ApiTokensTab
                    authGrants={authGrants}
                    onRefresh={handleRefresh}
                    guideType={integration.guideType}
                />
            )}

            {activeTab === 'embed-code' && (
                <EmbedCodeTab integration={integration} />
            )}

            {activeTab === 'contracts' && (
                <ContractsTab
                    integration={integration}
                />
            )}

            {activeTab === 'connections' && (
                <ConnectionsTab />
            )}

            {activeTab === 'signing' && (
                <SigningTab integration={integration} />
            )}

            {activeTab === 'branding' && (
                <BrandingTab branding={branding} onUpdate={setBranding} />
            )}

            {activeTab === 'app-listings' && (
                <AppListingsTab integration={integration} />
            )}

            {activeTab === 'partner-connect' && (
                <PartnerConnectTab integration={integration} />
            )}

            {activeTab === 'app-config' && (
                <AppConfigTab integration={integration} />
            )}

            {activeTab === 'code' && (
                <IntegrationCodeTab
                    integration={integration}
                    templates={templates}
                />
            )}

            {activeTab === 'testing' && (
                <TestingTab
                    integration={integration}
                    templates={templates}
                    branding={branding}
                />
            )}

            {activeTab === 'analytics' && (
                <AnalyticsTab stats={stats} />
            )}
        </DashboardLayout>
    );
};

export default UnifiedIntegrationDashboard;

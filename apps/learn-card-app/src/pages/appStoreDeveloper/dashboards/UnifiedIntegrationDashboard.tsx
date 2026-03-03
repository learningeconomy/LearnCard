import React, { useState, useEffect, useCallback, useRef, useMemo, Suspense, lazy } from 'react';
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
    FileSpreadsheet,
} from 'lucide-react';
import type { LCNIntegration, AppStoreListing } from '@learncard/types';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { DashboardLayout, QuickStats, StatItem } from './shared';
import { AppDidUpgradeDialog } from '../components/AppDidUpgradeDialog';
import { useDeveloperPortal } from '../useDeveloperPortal';

// Lazy load tab components for better code splitting
// Only the active tab is loaded, reducing initial bundle by ~250KB
const OverviewTab = lazy(() =>
    import('./tabs/OverviewTab').then(m => ({ default: m.OverviewTab }))
);
const TemplatesTab = lazy(() =>
    import('./tabs/TemplatesTab').then(m => ({ default: m.TemplatesTab }))
);
const ApiTokensTab = lazy(() =>
    import('./tabs/ApiTokensTab').then(m => ({ default: m.ApiTokensTab }))
);
const EmbedCodeTab = lazy(() =>
    import('./tabs/EmbedCodeTab').then(m => ({ default: m.EmbedCodeTab }))
);
const ContractsTab = lazy(() =>
    import('./tabs/ContractsTab').then(m => ({ default: m.ContractsTab }))
);
const ConnectionsTab = lazy(() =>
    import('./tabs/ConnectionsTab').then(m => ({ default: m.ConnectionsTab }))
);
const SigningTab = lazy(() => import('./tabs/SigningTab').then(m => ({ default: m.SigningTab })));
const BrandingTab = lazy(() =>
    import('./tabs/BrandingTab').then(m => ({ default: m.BrandingTab }))
);
const AnalyticsTab = lazy(() =>
    import('./tabs/AnalyticsTab').then(m => ({ default: m.AnalyticsTab }))
);
const IntegrationCodeTab = lazy(() =>
    import('./tabs/IntegrationCodeTab').then(m => ({ default: m.IntegrationCodeTab }))
);
const TestingTab = lazy(() => import('./tabs/TestingTab').then(m => ({ default: m.TestingTab })));
const AppListingsTab = lazy(() =>
    import('./tabs/AppListingsTab').then(m => ({ default: m.AppListingsTab }))
);
const PartnerConnectTab = lazy(() =>
    import('./tabs/PartnerConnectTab').then(m => ({ default: m.PartnerConnectTab }))
);
const AppConfigTab = lazy(() =>
    import('./tabs/AppConfigTab').then(m => ({ default: m.AppConfigTab }))
);
const CsvUploadTab = lazy(() =>
    import('./tabs/CsvUploadTab').then(m => ({ default: m.CsvUploadTab }))
);
import {
    DashboardConfig,
    DashboardStats,
    DashboardTabConfig,
    AuthGrant,
    CredentialTemplate,
    BrandingConfig,
    getConfigForGuideType,
} from './types';
import { useIntegrationActivity } from './hooks/useIntegrationActivity';

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

    // course-catalog specific tabs (API code + CSV upload + testing)
    if (config.showTemplates && !config.showAppListings) {
        tabs.push({ id: 'code', label: 'Code', icon: FileCode });
        tabs.push({ id: 'csv-upload', label: 'CSV Upload', icon: FileSpreadsheet });
        tabs.push({ id: 'testing', label: 'Testing', icon: TestTube2 });
    }

    // Analytics tab hidden for now - will add back when we have time-series data
    // tabs.push({ id: 'analytics', label: 'Analytics', icon: BarChart3 });

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

    const config = useMemo(
        () => getConfigForGuideType(integration.guideType),
        [integration.guideType]
    );
    const tabs = useMemo(() => getTabsForConfig(config), [config]);

    const [activeTab, setActiveTab] = useState<string>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

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

    // App DID upgrade state
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [hasDeclinedUpgrade, setHasDeclinedUpgrade] = useState(false);
    const [listingToUpgrade, setListingToUpgrade] = useState<AppStoreListing | null>(null);

    // Hooks for app DID upgrade detection
    const { useListingsForIntegration, useUpgradeAppToAppDid, checkAppNeedsUpgrade } =
        useDeveloperPortal();

    const { data: appListings } = useListingsForIntegration(integration.id);
    const upgradeAppMutation = useUpgradeAppToAppDid();

    // Check if any app listing needs upgrade
    useEffect(() => {
        if (!appListings?.length || hasDeclinedUpgrade) return;

        let isActive = true;

        const checkListings = async () => {
            try {
                const wallet = await initWalletRef.current();

                for (const listing of appListings) {
                    const signingAuthority = await wallet.invoke.getListingSigningAuthority(
                        listing.listing_id
                    );

                    if (checkAppNeedsUpgrade(listing, signingAuthority ?? null)) {
                        if (!isActive) return;
                        setListingToUpgrade(listing);
                        setShowUpgradeDialog(true);
                        return;
                    }
                }
            } catch (error) {
                console.warn('Failed to check listing signing authorities:', error);
            }
        };

        checkListings();

        return () => {
            isActive = false;
        };
    }, [appListings, hasDeclinedUpgrade, checkAppNeedsUpgrade]);

    const handleUpgrade = async (): Promise<boolean> => {
        if (!listingToUpgrade) return false;

        try {
            await upgradeAppMutation.mutateAsync({
                listingId: listingToUpgrade.listing_id,
            });
            presentToast('App upgraded successfully!', {
                type: ToastTypeEnum.Success,
                hasDismissButton: true,
            });
            return true;
        } catch (error) {
            console.error('Upgrade failed:', error);
            presentToast('Failed to upgrade app', {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
            return false;
        }
    };

    const handleDismissUpgrade = () => {
        setShowUpgradeDialog(false);
        setHasDeclinedUpgrade(true);
    };

    const loadDashboardData = useCallback(
        async (showRefresh = false) => {
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
                        const validGrants = (grants || []).filter(
                            (g): g is AuthGrant =>
                                !!g.id && !!g.name && !!g.challenge && !!g.status && !!g.createdAt
                        );
                        setAuthGrants(validGrants);
                        activeTokenCount = validGrants.filter(g => g.status === 'active').length;
                    } catch (err) {
                        console.warn('Could not load auth grants:', err);
                    }
                }

                // Fetch templates (boosts) for this integration - LIGHTWEIGHT
                // Only get basic info from paginated response for dashboard overview
                // Full template details are loaded on-demand by individual tabs (TemplatesTab, TestingTab, etc.)
                const boostsResult = await wallet.invoke.getPaginatedBoosts({
                    limit: 50,
                    query: { meta: { integrationId: integration.id } },
                });

                // Extract basic template info from paginated response (no additional API calls needed)
                const basicTemplates: CredentialTemplate[] = (boostsResult?.records || []).map(
                    (boost: any) => ({
                        id: boost.uri,
                        boostUri: boost.uri,
                        name: boost.name || 'Untitled Template',
                        description: '',
                        achievementType: boost.type || 'Achievement',
                        fields: [],
                        isNew: false,
                        isDirty: false,
                    })
                );

                setTemplates(basicTemplates);

                // Fetch consent contracts if needed
                let activeContractsCount = 0;
                if (config.showContracts) {
                    try {
                        const contractsResult = await wallet.invoke.getConsentedContracts?.({
                            limit: 50,
                        });
                        const contractList = contractsResult?.records || [];
                        setContracts(contractList);
                        activeContractsCount = contractList.length;
                    } catch (err) {
                        console.warn('Could not load contracts:', err);
                    }
                }

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

                // Stats for credential activity are fetched via useIntegrationActivity hook
                // Only set non-activity stats here
                setStats(prev => ({
                    ...prev,
                    activeTokens: activeTokenCount,
                    templateCount: templates.length || boostsResult?.records?.length || 0,
                    activeContracts: activeContractsCount,
                    totalConnections: 0,
                }));
            } catch (err) {
                console.error('Failed to load dashboard data:', err);
                presentToast('Failed to load dashboard data', {
                    type: ToastTypeEnum.Error,
                    hasDismissButton: true,
                });
            } finally {
                setIsLoading(false);
                setIsRefreshing(false);
            }
        },
        [integration.id, config, branding, presentToast]
    );

    // Reset state and reload when integration changes
    useEffect(() => {
        // Reset all state when integration changes
        setActiveTab('overview');
        setAuthGrants([]);
        setTemplates([]);
        setContracts([]);
        setStats({
            totalIssued: 0,
            totalClaimed: 0,
            pendingClaims: 0,
            claimRate: 0,
            activeTokens: 0,
            templateCount: 0,
            activeContracts: 0,
            totalConnections: 0,
        });

        // Load fresh data for the new integration
        loadDashboardData();
    }, [integration.id]);

    // Fetch credential activity stats using the unified API
    // Stats are filtered by integrationId for accurate per-integration metrics
    const { stats: activityStats, refetch: refetchActivity } = useIntegrationActivity(templates, {
        integrationId: integration.id,
    });

    const handleRefresh = () => {
        loadDashboardData(true);
        refetchActivity();
        setRefreshKey(k => k + 1);
    };

    // Combine activity stats (credential metrics) with loaded stats (tokens, contracts, etc.)
    const mergedStats: DashboardStats = {
        ...stats,
        totalIssued: activityStats.totalSent,
        totalClaimed: activityStats.totalClaimed,
        pendingClaims: activityStats.pendingClaims,
        claimRate: activityStats.claimRate,
    };

    // Stats use event type terminology: Created + Delivered = Sent, then Claimed, Pending (unclaimed), Claim Rate
    const quickStats: StatItem[] = [
        {
            label: 'Credentials Sent',
            value: mergedStats.totalIssued,
            icon: Zap,
            iconBgColor: 'bg-cyan-100',
            iconColor: 'text-cyan-600',
        },
        {
            label: 'Claimed',
            value: mergedStats.totalClaimed,
            icon: CheckCircle2,
            iconBgColor: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
        },
        {
            label: 'Pending',
            value: mergedStats.pendingClaims,
            icon: AlertCircle,
            iconBgColor: 'bg-amber-100',
            iconColor: 'text-amber-600',
        },
        {
            label: 'Claim Rate',
            value: `${mergedStats.claimRate.toFixed(1)}%`,
            icon: BarChart3,
            iconBgColor: 'bg-violet-100',
            iconColor: 'text-violet-600',
        },
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
            {/* Suspense wrapper for lazy-loaded tab components */}
            <Suspense
                fallback={
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                    </div>
                }
            >
                {activeTab === 'overview' && (
                    <OverviewTab
                        integration={integration}
                        config={config}
                        stats={stats}
                        templates={templates}
                        onNavigate={setActiveTab}
                        refreshKey={refreshKey}
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

                {activeTab === 'embed-code' && <EmbedCodeTab integration={integration} />}

                {activeTab === 'contracts' && <ContractsTab integration={integration} />}

                {activeTab === 'connections' && <ConnectionsTab />}

                {activeTab === 'signing' && <SigningTab integration={integration} />}

                {activeTab === 'branding' && (
                    <BrandingTab branding={branding} onUpdate={setBranding} />
                )}

                {activeTab === 'app-listings' && <AppListingsTab integration={integration} />}

                {activeTab === 'partner-connect' && <PartnerConnectTab integration={integration} />}

                {activeTab === 'app-config' && <AppConfigTab integration={integration} />}

                {activeTab === 'code' && (
                    <IntegrationCodeTab integration={integration} templates={templates} />
                )}

                {activeTab === 'csv-upload' && (
                    <CsvUploadTab integration={integration} templates={templates} />
                )}

                {activeTab === 'testing' && (
                    <TestingTab
                        integration={integration}
                        templates={templates}
                        branding={branding}
                    />
                )}

                {/* Analytics tab hidden for now
                {activeTab === 'analytics' && (
                    <AnalyticsTab stats={mergedStats} templates={templates} />
                )}
                */}
            </Suspense>

            {/* App DID Upgrade Dialog */}
            {showUpgradeDialog && listingToUpgrade && (
                <AppDidUpgradeDialog
                    isOpen={showUpgradeDialog}
                    listing={listingToUpgrade}
                    integrationId={integration.id}
                    onUpgrade={handleUpgrade}
                    onDismiss={handleDismissUpgrade}
                />
            )}
        </DashboardLayout>
    );
};

export default UnifiedIntegrationDashboard;

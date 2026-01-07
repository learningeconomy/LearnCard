import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    LayoutDashboard,
    Award,
    Palette,
    Plug,
    BarChart3,
    RefreshCw,
    Settings,
    ArrowLeft,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Zap,
} from 'lucide-react';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { CredentialTemplate, BrandingConfig, IntegrationMethod, DataMappingConfig, PartnerProject, TemplateBoostMeta } from '../types';
import { DashboardTab, IntegrationStats, DashboardState } from './types';
import { DashboardOverview } from './DashboardOverview';
import { TemplatesSection } from './TemplatesSection';
import { BrandingSection } from './BrandingSection';
import { IntegrationSection } from './IntegrationSection';
import { AnalyticsSection } from './AnalyticsSection';

interface IntegrationDashboardProps {
    project: PartnerProject;
    initialBranding?: BrandingConfig | null;
    initialTemplates?: CredentialTemplate[];
    initialIntegrationMethod?: IntegrationMethod | null;
    initialDataMapping?: DataMappingConfig | null;
    onBack?: () => void;
}

const TABS: { id: DashboardTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'templates', label: 'Templates', icon: Award },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'integration', label: 'Integration', icon: Plug },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const IntegrationDashboard: React.FC<IntegrationDashboardProps> = ({
    project,
    initialBranding = null,
    initialTemplates = [],
    initialIntegrationMethod = null,
    initialDataMapping = null,
    onBack,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [branding, setBranding] = useState<BrandingConfig | null>(initialBranding);
    const [templates, setTemplates] = useState<CredentialTemplate[]>(initialTemplates);
    const [integrationMethod, setIntegrationMethod] = useState<IntegrationMethod | null>(initialIntegrationMethod);
    const [dataMapping, setDataMapping] = useState<DataMappingConfig | null>(initialDataMapping);

    const [stats, setStats] = useState<IntegrationStats>({
        totalIssued: 0,
        totalClaimed: 0,
        pendingClaims: 0,
        claimRate: 0,
    });

    const integrationId = project.id;

    const loadDashboardData = useCallback(async (showRefresh = false) => {
        if (showRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const wallet = await initWalletRef.current();

            // Fetch templates (boosts) for this integration
            const boostsResult = await wallet.invoke.getPaginatedBoosts({
                limit: 50,
                query: { meta: { integrationId } },
            });

            if (boostsResult?.records) {
                const loadedTemplates: CredentialTemplate[] = boostsResult.records.map((boost: any) => {
                    const meta = boost.boost?.meta as TemplateBoostMeta | undefined;
                    const credential = boost.boost?.credential;

                    return {
                        id: boost.uri || boost.boost?.id || crypto.randomUUID(),
                        name: boost.boost?.name || credential?.name || 'Untitled Template',
                        description: credential?.credentialSubject?.achievement?.description || '',
                        achievementType: meta?.templateConfig?.achievementType || boost.boost?.type || 'Achievement',
                        fields: meta?.templateConfig?.fields || [],
                        imageUrl: boost.boost?.image || credential?.credentialSubject?.achievement?.image?.id,
                        boostUri: boost.uri,
                        isNew: false,
                        isDirty: false,
                    };
                });

                setTemplates(loadedTemplates);
            }

            // Fetch stats from sent inbox credentials
            try {
                const sentCredentials = await wallet.invoke.getMySentInboxCredentials?.({ limit: 100 });
                const records = sentCredentials?.records || [];

                // Filter by integration-related credentials (this is a simplified version)
                const totalIssued = records.length;
                const totalClaimed = records.filter((r: any) => r.status === 'CLAIMED').length;
                const pendingClaims = totalIssued - totalClaimed;
                const claimRate = totalIssued > 0 ? (totalClaimed / totalIssued) * 100 : 0;

                setStats({
                    totalIssued,
                    totalClaimed,
                    pendingClaims,
                    claimRate,
                    lastIssuedAt: records[0]?.createdAt,
                });
            } catch (err) {
                console.warn('Could not load stats:', err);
            }

            // Load branding from profile if not provided
            if (!branding) {
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

        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            presentToast('Failed to load dashboard data', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [integrationId, branding, presentToast]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleRefresh = () => {
        loadDashboardData(true);
    };

    const handleTemplatesUpdate = (updatedTemplates: CredentialTemplate[]) => {
        setTemplates(updatedTemplates);
    };

    const handleBrandingUpdate = (updatedBranding: BrandingConfig) => {
        setBranding(updatedBranding);
    };

    const handleIntegrationUpdate = (method: IntegrationMethod, mapping: DataMappingConfig) => {
        setIntegrationMethod(method);
        setDataMapping(mapping);
    };

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold text-gray-800">{project.name}</h1>

                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                Active
                            </span>
                        </div>

                        <p className="text-sm text-gray-500">Integration Dashboard</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>

                    <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-cyan-600" />
                        </div>

                        <div>
                            <p className="text-2xl font-semibold text-gray-800">{stats.totalIssued}</p>
                            <p className="text-xs text-gray-500">Credentials Issued</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>

                        <div>
                            <p className="text-2xl font-semibold text-gray-800">{stats.totalClaimed}</p>
                            <p className="text-xs text-gray-500">Claimed</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>

                        <div>
                            <p className="text-2xl font-semibold text-gray-800">{stats.pendingClaims}</p>
                            <p className="text-xs text-gray-500">Pending</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-5 h-5 text-violet-600" />
                        </div>

                        <div>
                            <p className="text-2xl font-semibold text-gray-800">{stats.claimRate.toFixed(1)}%</p>
                            <p className="text-xs text-gray-500">Claim Rate</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-gray-200 pb-px overflow-x-auto">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeTab === tab.id
                                ? 'border-cyan-500 text-cyan-600'
                                : 'border-transparent text-gray-500 hover:text-gray-600'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                {activeTab === 'overview' && (
                    <DashboardOverview
                        project={project}
                        branding={branding}
                        templates={templates}
                        integrationMethod={integrationMethod}
                        stats={stats}
                        onNavigate={setActiveTab}
                    />
                )}

                {activeTab === 'templates' && (
                    <TemplatesSection
                        templates={templates}
                        branding={branding}
                        integrationId={integrationId}
                        onUpdate={handleTemplatesUpdate}
                    />
                )}

                {activeTab === 'branding' && (
                    <BrandingSection
                        branding={branding}
                        onUpdate={handleBrandingUpdate}
                    />
                )}

                {activeTab === 'integration' && (
                    <IntegrationSection
                        project={project}
                        templates={templates}
                        integrationMethod={integrationMethod}
                        dataMapping={dataMapping}
                        onUpdate={handleIntegrationUpdate}
                    />
                )}

                {activeTab === 'analytics' && (
                    <AnalyticsSection
                        stats={stats}
                        templates={templates}
                    />
                )}
            </div>
        </div>
    );
};

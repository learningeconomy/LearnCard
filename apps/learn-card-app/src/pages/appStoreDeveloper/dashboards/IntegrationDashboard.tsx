import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    LayoutDashboard,
    Award,
    Palette,
    Plug,
    BarChart3,
    Zap,
    CheckCircle2,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';

import { DashboardLayout, QuickStats, StatItem } from './shared';
import { CredentialTemplate, BrandingConfig, IntegrationMethod, DataMappingConfig, TemplateBoostMeta } from '../partner-onboarding/types';

interface IntegrationDashboardProps {
    integration: LCNIntegration;
    onBack?: () => void;
}

type TabId = 'overview' | 'templates' | 'branding' | 'integration' | 'analytics';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'templates', label: 'Templates', icon: Award },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'integration', label: 'Integration', icon: Plug },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const IntegrationDashboard: React.FC<IntegrationDashboardProps> = ({
    integration,
    onBack,
}) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const [templates, setTemplates] = useState<CredentialTemplate[]>([]);
    const [branding, setBranding] = useState<BrandingConfig | null>(null);
    const [stats, setStats] = useState({
        totalIssued: 0,
        totalClaimed: 0,
        pendingClaims: 0,
        claimRate: 0,
    });

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
                query: { meta: { integrationId: integration.id } },
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

            // Fetch stats
            try {
                const sentCredentials = await wallet.invoke.getMySentInboxCredentials?.({ limit: 100 });
                const records = sentCredentials?.records || [];

                const totalIssued = records.length;
                const totalClaimed = records.filter((r: any) => r.status === 'CLAIMED').length;
                const pendingClaims = totalIssued - totalClaimed;
                const claimRate = totalIssued > 0 ? (totalClaimed / totalIssued) * 100 : 0;

                setStats({ totalIssued, totalClaimed, pendingClaims, claimRate });
            } catch (err) {
                console.warn('Could not load stats:', err);
            }

            // Load branding from profile
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
    }, [integration.id, branding, presentToast]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleRefresh = () => loadDashboardData(true);

    const quickStats: StatItem[] = [
        { label: 'Credentials Issued', value: stats.totalIssued, icon: Zap, iconBgColor: 'bg-cyan-100', iconColor: 'text-cyan-600' },
        { label: 'Claimed', value: stats.totalClaimed, icon: CheckCircle2, iconBgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
        { label: 'Pending', value: stats.pendingClaims, icon: AlertCircle, iconBgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
        { label: 'Claim Rate', value: `${stats.claimRate.toFixed(1)}%`, icon: BarChart3, iconBgColor: 'bg-violet-100', iconColor: 'text-violet-600' },
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

    return (
        <DashboardLayout
            integration={integration}
            title={integration.name}
            subtitle="Partner Integration Dashboard"
            onBack={onBack}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            statsBar={<QuickStats stats={quickStats} />}
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as TabId)}
        >
            {activeTab === 'overview' && (
                <OverviewTab
                    integration={integration}
                    templates={templates}
                    branding={branding}
                    stats={stats}
                    onNavigate={setActiveTab}
                />
            )}

            {activeTab === 'templates' && (
                <TemplatesTab templates={templates} integrationId={integration.id} />
            )}

            {activeTab === 'branding' && (
                <BrandingTab branding={branding} />
            )}

            {activeTab === 'integration' && (
                <IntegrationTab integration={integration} />
            )}

            {activeTab === 'analytics' && (
                <AnalyticsTab stats={stats} />
            )}
        </DashboardLayout>
    );
};

// Overview Tab
const OverviewTab: React.FC<{
    integration: LCNIntegration;
    templates: CredentialTemplate[];
    branding: BrandingConfig | null;
    stats: { totalIssued: number; totalClaimed: number; pendingClaims: number; claimRate: number };
    onNavigate: (tab: TabId) => void;
}> = ({ integration, templates, branding, stats, onNavigate }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Actions</h2>
                <p className="text-sm text-gray-500 mb-4">Manage your partner integration</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => onNavigate('templates')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-left group"
                    >
                        <Award className="w-8 h-8 text-violet-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-cyan-700">Manage Templates</h3>
                        <p className="text-sm text-gray-500 mt-1">{templates.length} credential templates</p>
                    </button>

                    <button
                        onClick={() => onNavigate('branding')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-left group"
                    >
                        <Palette className="w-8 h-8 text-pink-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-cyan-700">Update Branding</h3>
                        <p className="text-sm text-gray-500 mt-1">{branding?.displayName || 'Not configured'}</p>
                    </button>

                    <button
                        onClick={() => onNavigate('integration')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-left group"
                    >
                        <Plug className="w-8 h-8 text-cyan-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-cyan-700">Integration Settings</h3>
                        <p className="text-sm text-gray-500 mt-1">API keys and configuration</p>
                    </button>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>

                {stats.totalIssued === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No credentials issued yet</p>
                        <p className="text-sm mt-1">Start issuing credentials to see activity here</p>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>Activity feed coming soon</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Templates Tab
const TemplatesTab: React.FC<{
    templates: CredentialTemplate[];
    integrationId: string;
}> = ({ templates, integrationId }) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Credential Templates</h2>
                    <p className="text-sm text-gray-500">Templates for issuing credentials</p>
                </div>
            </div>

            {templates.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No templates yet</p>
                    <p className="text-sm text-gray-400 mt-1">Templates created during setup will appear here</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(template => (
                        <div key={template.id} className="p-4 border border-gray-200 rounded-xl">
                            <div className="flex items-start gap-4">
                                {template.imageUrl ? (
                                    <img
                                        src={template.imageUrl}
                                        alt={template.name}
                                        className="w-16 h-16 rounded-lg object-cover"
                                    />
                                ) : (
                                    <div className="w-16 h-16 bg-violet-100 rounded-lg flex items-center justify-center">
                                        <Award className="w-8 h-8 text-violet-600" />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-800 truncate">{template.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{template.achievementType}</p>
                                    {template.description && (
                                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{template.description}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Branding Tab
const BrandingTab: React.FC<{ branding: BrandingConfig | null }> = ({ branding }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Branding</h2>
                <p className="text-sm text-gray-500">Your organization's branding on credentials</p>
            </div>

            {branding ? (
                <div className="p-6 border border-gray-200 rounded-xl">
                    <div className="flex items-start gap-4">
                        {branding.image ? (
                            <img
                                src={branding.image}
                                alt={branding.displayName}
                                className="w-20 h-20 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                                <Palette className="w-10 h-10 text-gray-400" />
                            </div>
                        )}

                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">{branding.displayName || 'No name set'}</h3>
                            <p className="text-gray-500 mt-1">{branding.shortBio || 'No bio set'}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                    <Palette className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No branding configured</p>
                </div>
            )}
        </div>
    );
};

// Integration Tab
const IntegrationTab: React.FC<{ integration: LCNIntegration }> = ({ integration }) => {
    const { presentToast } = useToast();
    const [copied, setCopied] = useState(false);

    const copyKey = async () => {
        await navigator.clipboard.writeText(integration.publishableKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        presentToast('Key copied!', { hasDismissButton: true });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Integration Settings</h2>
                <p className="text-sm text-gray-500">API keys and configuration for your integration</p>
            </div>

            <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-cyan-800">Publishable Key</label>

                    <button
                        onClick={copyKey}
                        className="text-xs text-cyan-700 hover:text-cyan-800"
                    >
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <div className="px-3 py-2 bg-white border border-cyan-200 rounded-lg font-mono text-sm text-gray-700 break-all">
                    {integration.publishableKey}
                </div>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h3 className="font-medium text-gray-800 mb-2">Integration ID</h3>
                <p className="font-mono text-sm text-gray-600">{integration.id}</p>
            </div>
        </div>
    );
};

// Analytics Tab
const AnalyticsTab: React.FC<{
    stats: { totalIssued: number; totalClaimed: number; pendingClaims: number; claimRate: number };
}> = ({ stats }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Analytics</h2>
                <p className="text-sm text-gray-500">Track your integration performance</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="p-6 border border-gray-200 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Claim Rate</h3>
                    <p className="text-4xl font-bold text-gray-800">{stats.claimRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500 mt-1">of issued credentials claimed</p>
                </div>

                <div className="p-6 border border-gray-200 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Total Issued</h3>
                    <p className="text-4xl font-bold text-gray-800">{stats.totalIssued}</p>
                    <p className="text-sm text-gray-500 mt-1">credentials all time</p>
                </div>
            </div>

            <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Detailed analytics coming soon</p>
            </div>
        </div>
    );
};

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Key,
    Code,
    Zap,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    LayoutDashboard,
    Loader2,
    Copy,
    Check,
    Award,
    ExternalLink,
    MousePointerClick,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';
import { Clipboard } from '@capacitor/clipboard';

import { DashboardLayout, QuickStats, StatItem } from './shared';

interface EmbedClaimDashboardProps {
    integration: LCNIntegration;
    onBack?: () => void;
}

type TabId = 'overview' | 'embed-code' | 'credentials' | 'analytics';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'embed-code', label: 'Embed Code', icon: Code },
    { id: 'credentials', label: 'Credentials', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const EmbedClaimDashboard: React.FC<EmbedClaimDashboardProps> = ({
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

    const [stats, setStats] = useState({
        totalClaims: 0,
        successfulClaims: 0,
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

            // Fetch claim stats
            try {
                const sentCredentials = await wallet.invoke.getMySentInboxCredentials?.({ limit: 100 });
                const records = sentCredentials?.records || [];

                const totalClaims = records.length;
                const successfulClaims = records.filter((r: any) => r.status === 'CLAIMED').length;

                setStats({
                    totalClaims,
                    successfulClaims,
                    pendingClaims: totalClaims - successfulClaims,
                    claimRate: totalClaims > 0 ? (successfulClaims / totalClaims) * 100 : 0,
                });
            } catch (err) {
                console.warn('Could not load claim stats:', err);
            }
        } catch (err) {
            console.error('Failed to load dashboard data:', err);
            presentToast('Failed to load dashboard data', { type: ToastTypeEnum.Error, hasDismissButton: true });
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [presentToast]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const handleRefresh = () => loadDashboardData(true);

    const quickStats: StatItem[] = [
        { label: 'Total Claims', value: stats.totalClaims, icon: MousePointerClick, iconBgColor: 'bg-pink-100', iconColor: 'text-pink-600' },
        { label: 'Successful', value: stats.successfulClaims, icon: CheckCircle2, iconBgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
        { label: 'Pending', value: stats.pendingClaims, icon: AlertCircle, iconBgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
        { label: 'Claim Rate', value: `${stats.claimRate.toFixed(1)}%`, icon: BarChart3, iconBgColor: 'bg-violet-100', iconColor: 'text-violet-600' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-pink-500 mx-auto animate-spin" />
                    <p className="text-sm text-gray-500 mt-3">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            integration={integration}
            title={integration.name}
            subtitle="Embed Claim Dashboard"
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
                    stats={stats}
                    onNavigate={setActiveTab}
                />
            )}

            {activeTab === 'embed-code' && (
                <EmbedCodeTab integration={integration} />
            )}

            {activeTab === 'credentials' && (
                <CredentialsTab integration={integration} />
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
    stats: { totalClaims: number; successfulClaims: number; pendingClaims: number; claimRate: number };
    onNavigate: (tab: TabId) => void;
}> = ({ integration, stats, onNavigate }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Actions</h2>
                <p className="text-sm text-gray-500 mb-4">Common tasks for managing your embed integration</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => onNavigate('embed-code')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-pink-300 hover:bg-pink-50 transition-colors text-left group"
                    >
                        <Code className="w-8 h-8 text-pink-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-pink-700">Get Embed Code</h3>
                        <p className="text-sm text-gray-500 mt-1">Copy code for your website</p>
                    </button>

                    <button
                        onClick={() => onNavigate('credentials')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-pink-300 hover:bg-pink-50 transition-colors text-left group"
                    >
                        <Award className="w-8 h-8 text-violet-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-pink-700">Manage Credentials</h3>
                        <p className="text-sm text-gray-500 mt-1">Configure claimable credentials</p>
                    </button>

                    <a
                        href="https://docs.learncard.com/embed-sdk"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 border border-gray-200 rounded-xl hover:border-pink-300 hover:bg-pink-50 transition-colors text-left group"
                    >
                        <ExternalLink className="w-8 h-8 text-cyan-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-pink-700">Documentation</h3>
                        <p className="text-sm text-gray-500 mt-1">Learn about the Embed SDK</p>
                    </a>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Claims</h2>

                {stats.totalClaims === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <MousePointerClick className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No claims yet</p>
                        <p className="text-sm mt-1">Add the embed code to your site to start receiving claims</p>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p>Claim activity feed coming soon</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Embed Code Tab
const EmbedCodeTab: React.FC<{ integration: LCNIntegration }> = ({ integration }) => {
    const { presentToast } = useToast();
    const [copied, setCopied] = useState<string | null>(null);

    const publishableKey = integration.publishableKey;

    const htmlCode = `<!-- LearnCard Claim Button -->
<div id="learncard-claim"></div>
<script src="https://cdn.learncard.com/embed-sdk.js"></script>
<script>
  LearnCard.init({
    target: '#learncard-claim',
    publishableKey: '${publishableKey}',
    // Configure your credential here
  });
</script>`;

    const npmCode = `npm install @learncard/embed-sdk`;

    const reactCode = `import { LearnCardEmbed } from '@learncard/embed-sdk';

function ClaimButton() {
  return (
    <LearnCardEmbed
      publishableKey="${publishableKey}"
      // Configure your credential here
    />
  );
}`;

    const copyCode = async (code: string, id: string) => {
        await Clipboard.write({ string: code });
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
        presentToast('Code copied!', { hasDismissButton: true });
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Embed Code</h2>
                <p className="text-sm text-gray-500">Add a claim button to your website</p>
            </div>

            {/* Publishable Key */}
            <div className="p-4 bg-pink-50 border border-pink-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-pink-800">Your Publishable Key</label>

                    <button
                        onClick={() => copyCode(publishableKey, 'key')}
                        className="text-xs text-pink-700 hover:text-pink-800 flex items-center gap-1"
                    >
                        {copied === 'key' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === 'key' ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <div className="px-3 py-2 bg-white border border-pink-200 rounded-lg font-mono text-sm text-gray-700 break-all">
                    {publishableKey}
                </div>
            </div>

            {/* HTML Snippet */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">HTML Snippet</h3>

                    <button
                        onClick={() => copyCode(htmlCode, 'html')}
                        className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                        {copied === 'html' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === 'html' ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-sm overflow-x-auto">
                    <code>{htmlCode}</code>
                </pre>
            </div>

            {/* React/npm */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">React / npm</h3>

                    <button
                        onClick={() => copyCode(reactCode, 'react')}
                        className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                    >
                        {copied === 'react' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied === 'react' ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <div className="mb-2">
                    <code className="px-2 py-1 bg-gray-100 rounded text-sm">{npmCode}</code>
                </div>

                <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-sm overflow-x-auto">
                    <code>{reactCode}</code>
                </pre>
            </div>
        </div>
    );
};

// Credentials Tab
const CredentialsTab: React.FC<{ integration: LCNIntegration }> = ({ integration }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Claimable Credentials</h2>
                <p className="text-sm text-gray-500">Configure credentials that users can claim through your embed</p>
            </div>

            <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Credential configuration coming soon</p>
                <p className="text-sm text-gray-400 mt-1">You'll be able to set default credentials here</p>
            </div>
        </div>
    );
};

// Analytics Tab
const AnalyticsTab: React.FC<{
    stats: { totalClaims: number; successfulClaims: number; pendingClaims: number; claimRate: number };
}> = ({ stats }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Analytics</h2>
                <p className="text-sm text-gray-500">Track your embed performance</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="p-6 border border-gray-200 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Claim Success Rate</h3>
                    <p className="text-4xl font-bold text-gray-800">{stats.claimRate.toFixed(1)}%</p>
                    <p className="text-sm text-gray-500 mt-1">of claims completed</p>
                </div>

                <div className="p-6 border border-gray-200 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Total Claims</h3>
                    <p className="text-4xl font-bold text-gray-800">{stats.totalClaims}</p>
                    <p className="text-sm text-gray-500 mt-1">all time</p>
                </div>
            </div>

            <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Detailed analytics coming soon</p>
            </div>
        </div>
    );
};

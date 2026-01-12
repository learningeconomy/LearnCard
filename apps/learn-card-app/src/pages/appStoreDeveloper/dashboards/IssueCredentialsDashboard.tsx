import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Key,
    Shield,
    Zap,
    CheckCircle2,
    AlertCircle,
    BarChart3,
    LayoutDashboard,
    Loader2,
    Copy,
    Check,
    Trash2,
    Plus,
    Send,
    ExternalLink,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';
import { Clipboard } from '@capacitor/clipboard';

import { DashboardLayout, QuickStats, StatItem } from './shared';

type AuthGrant = {
    id: string;
    name: string;
    challenge: string;
    createdAt: string;
    status: 'revoked' | 'active';
    scope: string;
    description?: string;
};

interface IssueCredentialsDashboardProps {
    integration: LCNIntegration;
    onBack?: () => void;
}

type TabId = 'overview' | 'tokens' | 'signing' | 'analytics';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'tokens', label: 'API Tokens', icon: Key },
    { id: 'signing', label: 'Signing Authority', icon: Shield },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const IssueCredentialsDashboard: React.FC<IssueCredentialsDashboardProps> = ({
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

    const [authGrants, setAuthGrants] = useState<AuthGrant[]>([]);
    const [stats, setStats] = useState({
        totalIssued: 0,
        totalClaimed: 0,
        pendingClaims: 0,
        activeTokens: 0,
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
            const grants = await wallet.invoke.getAuthGrants();
            const validGrants = (grants || []).filter((g): g is AuthGrant => 
                !!g.id && !!g.name && !!g.challenge && !!g.status && !!g.createdAt
            );
            const activeGrants = validGrants.filter(g => g.status === 'active');
            setAuthGrants(validGrants);

            // Fetch boosts for this integration to get boost URIs
            const boostsResult = await wallet.invoke.getPaginatedBoosts({
                limit: 50,
                query: { meta: { integrationId: integration.id } },
            });

            const integrationBoostUris = new Set(
                boostsResult?.records?.map((boost: any) => boost.uri).filter(Boolean) || []
            );

            // Fetch credential stats - filter by this integration's boost URIs
            try {
                const sentCredentials = await wallet.invoke.getMySentInboxCredentials?.({ limit: 500 });
                const records = sentCredentials?.records || [];

                // Filter to only credentials from this integration's boosts
                const integrationRecords = records.filter((r: any) => 
                    r.boostUri && integrationBoostUris.has(r.boostUri)
                );

                const totalIssued = integrationRecords.length;
                const totalClaimed = integrationRecords.filter((r: any) => r.currentStatus === 'CLAIMED').length;

                setStats({
                    totalIssued,
                    totalClaimed,
                    pendingClaims: totalIssued - totalClaimed,
                    activeTokens: activeGrants.length,
                });
            } catch (err) {
                console.warn('Could not load credential stats:', err);
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
        { label: 'Credentials Issued', value: stats.totalIssued, icon: Zap, iconBgColor: 'bg-cyan-100', iconColor: 'text-cyan-600' },
        { label: 'Claimed', value: stats.totalClaimed, icon: CheckCircle2, iconBgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
        { label: 'Pending', value: stats.pendingClaims, icon: AlertCircle, iconBgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
        { label: 'Active Tokens', value: stats.activeTokens, icon: Key, iconBgColor: 'bg-violet-100', iconColor: 'text-violet-600' },
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
            subtitle="Issue Credentials Dashboard"
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
                    authGrants={authGrants}
                    onNavigate={setActiveTab}
                />
            )}

            {activeTab === 'tokens' && (
                <TokensTab
                    authGrants={authGrants}
                    onRefresh={handleRefresh}
                />
            )}

            {activeTab === 'signing' && (
                <SigningTab integration={integration} />
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
    stats: { totalIssued: number; totalClaimed: number; pendingClaims: number; activeTokens: number };
    authGrants: AuthGrant[];
    onNavigate: (tab: TabId) => void;
}> = ({ integration, stats, authGrants, onNavigate }) => {
    const activeTokens = authGrants.filter(g => g.status === 'active');

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Actions</h2>
                <p className="text-sm text-gray-500 mb-4">Common tasks for managing your credential issuance</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => onNavigate('tokens')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-left group"
                    >
                        <Key className="w-8 h-8 text-cyan-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-cyan-700">Manage API Tokens</h3>
                        <p className="text-sm text-gray-500 mt-1">{activeTokens.length} active tokens</p>
                    </button>

                    <button
                        onClick={() => onNavigate('signing')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-left group"
                    >
                        <Shield className="w-8 h-8 text-emerald-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-cyan-700">Signing Authority</h3>
                        <p className="text-sm text-gray-500 mt-1">Configure credential signing</p>
                    </button>

                    <a
                        href="https://docs.learncard.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-left group"
                    >
                        <ExternalLink className="w-8 h-8 text-violet-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-cyan-700">API Documentation</h3>
                        <p className="text-sm text-gray-500 mt-1">Learn how to issue credentials</p>
                    </a>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>

                {stats.totalIssued === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Send className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No credentials issued yet</p>
                        <p className="text-sm mt-1">Use the API to start issuing credentials</p>
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

// Tokens Tab
const TokensTab: React.FC<{
    authGrants: AuthGrant[];
    onRefresh: () => void;
}> = ({ authGrants, onRefresh }) => {
    const { initWallet } = useWallet();
    const { presentToast } = useToast();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyChallenge = async (challenge: string, id: string) => {
        await Clipboard.write({ string: challenge });
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        presentToast('Token copied!', { hasDismissButton: true });
    };

    const revokeToken = async (grantId: string) => {
        try {
            const wallet = await initWallet();
            await wallet.invoke.revokeAuthGrant(grantId);
            presentToast('Token revoked', { hasDismissButton: true });
            onRefresh();
        } catch (err) {
            console.error('Failed to revoke token:', err);
            presentToast('Failed to revoke token', { type: ToastTypeEnum.Error, hasDismissButton: true });
        }
    };

    const activeGrants = authGrants.filter(g => g.status === 'active');
    const revokedGrants = authGrants.filter(g => g.status === 'revoked');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">API Tokens</h2>
                    <p className="text-sm text-gray-500">Manage tokens for server-side credential issuance</p>
                </div>

                <a
                    href="/app-store/developer/guides/issue-credentials"
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Token
                </a>
            </div>

            {activeGrants.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                    <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No active API tokens</p>
                    <p className="text-sm text-gray-400 mt-1">Create a token to start issuing credentials via API</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {activeGrants.map(grant => (
                        <div key={grant.id} className="p-4 border border-gray-200 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <Key className="w-5 h-5 text-emerald-600" />
                                    </div>

                                    <div>
                                        <h3 className="font-medium text-gray-800">{grant.name}</h3>
                                        <p className="text-xs text-gray-500">
                                            Created {new Date(grant.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => copyChallenge(grant.challenge, grant.id)}
                                        className="p-2 text-gray-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                    >
                                        {copiedId === grant.id ? (
                                            <Check className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                            <Copy className="w-4 h-4" />
                                        )}
                                    </button>

                                    <button
                                        onClick={() => revokeToken(grant.id)}
                                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {revokedGrants.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Revoked Tokens</h3>

                    <div className="space-y-2 opacity-60">
                        {revokedGrants.map(grant => (
                            <div key={grant.id} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-2">
                                    <Key className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">{grant.name}</span>
                                    <span className="text-xs text-red-500 ml-auto">Revoked</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Signing Tab
const SigningTab: React.FC<{ integration: LCNIntegration }> = ({ integration }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Signing Authority</h2>
                <p className="text-sm text-gray-500">Configure how your credentials are signed</p>
            </div>

            <div className="p-6 border border-gray-200 rounded-xl bg-gray-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Shield className="w-6 h-6 text-emerald-600" />
                    </div>

                    <div>
                        <h3 className="font-medium text-gray-800">LearnCard Network Signing</h3>
                        <p className="text-sm text-gray-500">Your credentials are signed using your LearnCard DID</p>
                    </div>

                    <span className="ml-auto px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                        Active
                    </span>
                </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-700">
                    <strong>Tip:</strong> All credentials issued through the API are automatically signed with your 
                    organization's DID. Recipients can verify the authenticity of credentials using standard 
                    Verifiable Credential verification.
                </p>
            </div>
        </div>
    );
};

// Analytics Tab
const AnalyticsTab: React.FC<{
    stats: { totalIssued: number; totalClaimed: number; pendingClaims: number; activeTokens: number };
}> = ({ stats }) => {
    const claimRate = stats.totalIssued > 0 ? ((stats.totalClaimed / stats.totalIssued) * 100).toFixed(1) : '0';

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Analytics</h2>
                <p className="text-sm text-gray-500">Track your credential issuance performance</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="p-6 border border-gray-200 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Claim Rate</h3>
                    <p className="text-4xl font-bold text-gray-800">{claimRate}%</p>
                    <p className="text-sm text-gray-500 mt-1">of issued credentials claimed</p>
                </div>

                <div className="p-6 border border-gray-200 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Total Issued</h3>
                    <p className="text-4xl font-bold text-gray-800">{stats.totalIssued}</p>
                    <p className="text-sm text-gray-500 mt-1">credentials issued all time</p>
                </div>
            </div>

            <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Detailed analytics coming soon</p>
                <p className="text-sm text-gray-400 mt-1">Charts and trends will appear here</p>
            </div>
        </div>
    );
};

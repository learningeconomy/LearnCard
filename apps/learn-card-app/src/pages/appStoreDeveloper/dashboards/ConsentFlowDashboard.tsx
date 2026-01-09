import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    FileText,
    Link2,
    Users,
    BarChart3,
    LayoutDashboard,
    Loader2,
    Copy,
    Check,
    Plus,
    ExternalLink,
    ShieldCheck,
    Database,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useWallet } from 'learn-card-base';
import { useToast, ToastTypeEnum } from 'learn-card-base/hooks/useToast';
import { Clipboard } from '@capacitor/clipboard';

import { DashboardLayout, QuickStats, StatItem } from './shared';

interface ConsentFlowDashboardProps {
    integration: LCNIntegration;
    onBack?: () => void;
}

type TabId = 'overview' | 'contracts' | 'connections' | 'analytics';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'contracts', label: 'Contracts', icon: FileText },
    { id: 'connections', label: 'Connections', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export const ConsentFlowDashboard: React.FC<ConsentFlowDashboardProps> = ({
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

    const [contracts, setContracts] = useState<any[]>([]);
    const [stats, setStats] = useState({
        activeContracts: 0,
        totalConnections: 0,
        dataRequests: 0,
        credentialsSent: 0,
    });

    const loadDashboardData = useCallback(async (showRefresh = false) => {
        if (showRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }

        try {
            const wallet = await initWalletRef.current();

            // Fetch consent flow contracts
            try {
                const contractsResult = await wallet.invoke.getConsentedContracts?.({ limit: 50 });
                const contractList = contractsResult?.records || [];
                setContracts(contractList);

                setStats({
                    activeContracts: contractList.length,
                    totalConnections: 0, // Would need to aggregate from contracts
                    dataRequests: 0,
                    credentialsSent: 0,
                });
            } catch (err) {
                console.warn('Could not load contracts:', err);
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
        { label: 'Active Contracts', value: stats.activeContracts, icon: FileText, iconBgColor: 'bg-emerald-100', iconColor: 'text-emerald-600' },
        { label: 'Connections', value: stats.totalConnections, icon: Users, iconBgColor: 'bg-cyan-100', iconColor: 'text-cyan-600' },
        { label: 'Data Requests', value: stats.dataRequests, icon: Database, iconBgColor: 'bg-violet-100', iconColor: 'text-violet-600' },
        { label: 'Credentials Sent', value: stats.credentialsSent, icon: ShieldCheck, iconBgColor: 'bg-amber-100', iconColor: 'text-amber-600' },
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-emerald-500 mx-auto animate-spin" />
                    <p className="text-sm text-gray-500 mt-3">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            integration={integration}
            title={integration.name}
            subtitle="Consent Flow Dashboard"
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
                    contracts={contracts}
                    onNavigate={setActiveTab}
                />
            )}

            {activeTab === 'contracts' && (
                <ContractsTab contracts={contracts} onRefresh={handleRefresh} />
            )}

            {activeTab === 'connections' && (
                <ConnectionsTab />
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
    stats: { activeContracts: number; totalConnections: number; dataRequests: number; credentialsSent: number };
    contracts: any[];
    onNavigate: (tab: TabId) => void;
}> = ({ integration, stats, contracts, onNavigate }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Actions</h2>
                <p className="text-sm text-gray-500 mb-4">Common tasks for managing your consent flows</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => onNavigate('contracts')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left group"
                    >
                        <FileText className="w-8 h-8 text-emerald-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-emerald-700">Manage Contracts</h3>
                        <p className="text-sm text-gray-500 mt-1">{stats.activeContracts} active contracts</p>
                    </button>

                    <button
                        onClick={() => onNavigate('connections')}
                        className="p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left group"
                    >
                        <Users className="w-8 h-8 text-cyan-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-emerald-700">View Connections</h3>
                        <p className="text-sm text-gray-500 mt-1">See connected users</p>
                    </button>

                    <a
                        href="https://docs.learncard.com/consent-flow"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-colors text-left group"
                    >
                        <ExternalLink className="w-8 h-8 text-violet-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-emerald-700">Documentation</h3>
                        <p className="text-sm text-gray-500 mt-1">Learn about Consent Flow</p>
                    </a>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>

                {contracts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No consent contracts yet</p>
                        <p className="text-sm mt-1">Create a contract to start collecting user data with consent</p>
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

// Contracts Tab
const ContractsTab: React.FC<{
    contracts: any[];
    onRefresh: () => void;
}> = ({ contracts, onRefresh }) => {
    const { presentToast } = useToast();
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyContractUri = async (uri: string, id: string) => {
        await Clipboard.write({ string: uri });
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
        presentToast('Contract URI copied!', { hasDismissButton: true });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-800">Consent Contracts</h2>
                    <p className="text-sm text-gray-500">Manage your data sharing agreements</p>
                </div>

                <a
                    href="/app-store/developer/guides/consent-flow"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Create Contract
                </a>
            </div>

            {contracts.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-gray-500">No consent contracts</p>
                    <p className="text-sm text-gray-400 mt-1">Create a contract to define what data you're requesting</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {contracts.map((contract: any) => (
                        <div key={contract.uri || contract.id} className="p-4 border border-gray-200 rounded-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-emerald-600" />
                                    </div>

                                    <div>
                                        <h3 className="font-medium text-gray-800">{contract.name || 'Consent Contract'}</h3>
                                        <p className="text-xs text-gray-500 font-mono truncate max-w-xs">
                                            {contract.uri}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => copyContractUri(contract.uri, contract.uri)}
                                    className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                >
                                    {copiedId === contract.uri ? (
                                        <Check className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Connections Tab
const ConnectionsTab: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Connected Users</h2>
                <p className="text-sm text-gray-500">Users who have consented to share data with you</p>
            </div>

            <div className="text-center py-12 border border-dashed border-gray-300 rounded-xl">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Connection management coming soon</p>
                <p className="text-sm text-gray-400 mt-1">You'll be able to view and manage user connections here</p>
            </div>
        </div>
    );
};

// Analytics Tab
const AnalyticsTab: React.FC<{
    stats: { activeContracts: number; totalConnections: number; dataRequests: number; credentialsSent: number };
}> = ({ stats }) => {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800">Analytics</h2>
                <p className="text-sm text-gray-500">Track your consent flow performance</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="p-6 border border-gray-200 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Active Contracts</h3>
                    <p className="text-4xl font-bold text-gray-800">{stats.activeContracts}</p>
                    <p className="text-sm text-gray-500 mt-1">consent contracts</p>
                </div>

                <div className="p-6 border border-gray-200 rounded-xl">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Total Connections</h3>
                    <p className="text-4xl font-bold text-gray-800">{stats.totalConnections}</p>
                    <p className="text-sm text-gray-500 mt-1">users connected</p>
                </div>
            </div>

            <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">Detailed analytics coming soon</p>
            </div>
        </div>
    );
};

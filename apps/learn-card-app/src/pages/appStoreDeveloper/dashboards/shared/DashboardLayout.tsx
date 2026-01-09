import React from 'react';
import { ArrowLeft, RefreshCw, Settings } from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

interface DashboardLayoutProps {
    integration: LCNIntegration;
    title: string;
    subtitle?: string;
    statusBadge?: React.ReactNode;
    onBack?: () => void;
    onRefresh?: () => void;
    isRefreshing?: boolean;
    headerActions?: React.ReactNode;
    statsBar?: React.ReactNode;
    tabs?: { id: string; label: string; icon: React.ElementType }[];
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
    children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    integration,
    title,
    subtitle = 'Integration Dashboard',
    statusBadge,
    onBack,
    onRefresh,
    isRefreshing = false,
    headerActions,
    statsBar,
    tabs,
    activeTab,
    onTabChange,
    children,
}) => {
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
                            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

                            {statusBadge || (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                    Active
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-gray-500">{subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    )}

                    {headerActions}

                    <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                        <Settings className="w-4 h-4" />
                        Settings
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            {statsBar}

            {/* Tab Navigation */}
            {tabs && tabs.length > 0 && (
                <div className="flex gap-1 border-b border-gray-200 pb-px overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange?.(tab.id)}
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
            )}

            {/* Content */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
                {children}
            </div>
        </div>
    );
};

import React from 'react';
import { 
    ArrowLeft, 
    RefreshCw, 
    Award,
    MousePointerClick,
    Layout,
    ShieldCheck,
    CheckCircle,
    Webhook,
    Rocket,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

const GUIDE_TYPE_ICONS: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    'issue-credentials': { icon: Award, color: 'text-violet-600', bgColor: 'bg-violet-100' },
    'embed-claim': { icon: MousePointerClick, color: 'text-pink-600', bgColor: 'bg-pink-100' },
    'embed-app': { icon: Layout, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
    'consent-flow': { icon: ShieldCheck, color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    'verify-credentials': { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    'server-webhooks': { icon: Webhook, color: 'text-orange-600', bgColor: 'bg-orange-100' },
    'course-catalog': { icon: Rocket, color: 'text-violet-600', bgColor: 'bg-violet-100' },
};

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

                    {/* Guide Type Icon */}
                    {integration.guideType && GUIDE_TYPE_ICONS[integration.guideType] && (() => {
                        const { icon: Icon, color, bgColor } = GUIDE_TYPE_ICONS[integration.guideType!];
                        return (
                            <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center`}>
                                <Icon className={`w-5 h-5 ${color}`} />
                            </div>
                        );
                    })()}

                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

                            {statusBadge || (() => {
                                const status = (integration.status as string) || 'setup';
                                if (status === 'active') {
                                    return (
                                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                                            Active
                                        </span>
                                    );
                                }
                                return (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs font-medium capitalize">
                                        {status === 'setup' ? 'In Setup' : status}
                                    </span>
                                );
                            })()}
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

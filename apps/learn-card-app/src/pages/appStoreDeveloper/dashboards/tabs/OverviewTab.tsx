import React from 'react';
import {
    Key,
    Code,
    Award,
    FileText,
    Shield,
    ExternalLink,
    Send,
    Zap,
    CheckCircle2,
    Clock,
    Loader2,
    Mail,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import type { DashboardConfig, DashboardStats, CredentialTemplate } from '../types';
import { useIntegrationActivity, formatRelativeTime } from '../hooks/useIntegrationActivity';

interface OverviewTabProps {
    integration: LCNIntegration;
    config: DashboardConfig;
    stats: DashboardStats;
    templates: CredentialTemplate[];
    onNavigate: (tabId: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    integration,
    config,
    stats,
    templates,
    onNavigate,
}) => {
    const { activity, isLoading: activityLoading } = useIntegrationActivity(templates, { limit: 10 });

    const quickActions = [];

    if (config.showApiTokens) {
        quickActions.push({
            id: 'tokens',
            icon: Key,
            iconColor: 'text-cyan-600',
            title: 'Manage API Tokens',
            description: `${stats.activeTokens} active tokens`,
            hoverColor: 'hover:border-cyan-300 hover:bg-cyan-50',
        });
    }

    if (config.showTemplates) {
        quickActions.push({
            id: 'templates',
            icon: Award,
            iconColor: 'text-violet-600',
            title: 'Manage Templates',
            description: `${stats.templateCount || 0} credential templates`,
            hoverColor: 'hover:border-violet-300 hover:bg-violet-50',
        });
    }

    if (config.showEmbedCode) {
        quickActions.push({
            id: 'embed-code',
            icon: Code,
            iconColor: 'text-pink-600',
            title: 'Get Embed Code',
            description: 'Copy code for your website',
            hoverColor: 'hover:border-pink-300 hover:bg-pink-50',
        });
    }

    if (config.showContracts) {
        quickActions.push({
            id: 'contracts',
            icon: FileText,
            iconColor: 'text-emerald-600',
            title: 'Manage Contracts',
            description: `${stats.activeContracts || 0} active contracts`,
            hoverColor: 'hover:border-emerald-300 hover:bg-emerald-50',
        });
    }

    if (config.showSigningAuthority) {
        quickActions.push({
            id: 'signing',
            icon: Shield,
            iconColor: 'text-emerald-600',
            title: 'Signing Authority',
            description: 'Configure credential signing',
            hoverColor: 'hover:border-emerald-300 hover:bg-emerald-50',
        });
    }

    // Always add documentation link
    const docsUrl = getDocsUrl(integration.guideType);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Actions</h2>
                <p className="text-sm text-gray-500 mb-4">Common tasks for managing your integration</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.slice(0, 2).map(action => (
                        <button
                            key={action.id}
                            onClick={() => onNavigate(action.id)}
                            className={`p-4 border border-gray-200 rounded-xl ${action.hoverColor} transition-colors text-left group`}
                        >
                            <action.icon className={`w-8 h-8 ${action.iconColor} mb-3`} />
                            <h3 className="font-medium text-gray-800 group-hover:text-gray-900">{action.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                        </button>
                    ))}

                    <a
                        href={docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-left group"
                    >
                        <ExternalLink className="w-8 h-8 text-cyan-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-cyan-700">Documentation</h3>
                        <p className="text-sm text-gray-500 mt-1">Learn how to integrate</p>
                    </a>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>

                {activityLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    </div>
                ) : activity.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No activity yet</p>
                        <p className="text-sm mt-1">Credentials will appear here as they're issued</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activity.map(item => {
                            const isClaimed = item.status === 'claimed';
                            const isPending = item.status === 'pending';
                            const isExpired = item.status === 'expired';
                            const isInbox = item.type === 'inbox';

                            // Determine icon and colors based on status
                            let bgColor = 'bg-cyan-100';
                            let textColor = 'text-cyan-600';
                            let badgeBg = 'bg-cyan-100';
                            let badgeText = 'text-cyan-700';
                            let statusLabel = 'Sent';
                            let Icon = Send;

                            if (isClaimed) {
                                bgColor = 'bg-emerald-100';
                                textColor = 'text-emerald-600';
                                badgeBg = 'bg-emerald-100';
                                badgeText = 'text-emerald-700';
                                statusLabel = 'Claimed';
                                Icon = CheckCircle2;
                            } else if (isPending && isInbox) {
                                bgColor = 'bg-amber-100';
                                textColor = 'text-amber-600';
                                badgeBg = 'bg-amber-100';
                                badgeText = 'text-amber-700';
                                statusLabel = 'Pending';
                                Icon = Mail;
                            } else if (isExpired) {
                                bgColor = 'bg-gray-100';
                                textColor = 'text-gray-500';
                                badgeBg = 'bg-gray-100';
                                badgeText = 'text-gray-600';
                                statusLabel = 'Expired';
                                Icon = Clock;
                            } else if (isInbox) {
                                Icon = Mail;
                            }

                            return (
                                <div
                                    key={item.id}
                                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl"
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColor}`}>
                                        <Icon className={`w-4 h-4 ${textColor}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-800 truncate">
                                                {item.templateName}
                                            </span>

                                            <span className={`text-xs px-1.5 py-0.5 rounded ${badgeBg} ${badgeText}`}>
                                                {statusLabel}
                                            </span>

                                            {isInbox && (
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
                                                    Email
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-500 truncate">
                                            To: {item.recipientName}
                                        </p>
                                    </div>

                                    <div className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                                        <Clock className="w-3 h-3" />
                                        {formatRelativeTime(item.sentAt)}
                                    </div>
                                </div>
                            );
                        })}

                        {stats.totalIssued > activity.length && (
                            <p className="text-center text-sm text-gray-500 pt-2">
                                Showing {activity.length} of {stats.totalIssued} credentials
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

function getDocsUrl(guideType?: string): string {
    switch (guideType) {
        case 'issue-credentials':
            return 'https://docs.learncard.com/send-credentials';
        case 'embed-claim':
            return 'https://github.com/learningeconomy/LearnCard/tree/main/packages/learn-card-embed-sdk';
        case 'embed-app':
            return 'https://docs.learncard.com/sdks/partner-connect'
        case 'consent-flow':
            return 'https://docs.learncard.com/consent-flow';
        default:
            return 'https://docs.learncard.com';
    }
}

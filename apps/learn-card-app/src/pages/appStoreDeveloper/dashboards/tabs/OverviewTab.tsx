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
    User,
    Calendar,
    Link as LinkIcon,
    X,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useModal, ModalTypes } from 'learn-card-base';

import type { DashboardConfig, DashboardStats, CredentialTemplate } from '../types';
import { useIntegrationActivity, formatRelativeTime, ActivityItem } from '../hooks/useIntegrationActivity';

interface OverviewTabProps {
    integration: LCNIntegration;
    config: DashboardConfig;
    stats: DashboardStats;
    templates: CredentialTemplate[];
    onNavigate: (tabId: string) => void;
}

interface IssuanceDetailModalProps {
    item: ActivityItem;
}

const IssuanceDetailModal: React.FC<IssuanceDetailModalProps> = ({ item }) => {
    const isClaimed = item.status === 'claimed';
    const isPending = item.status === 'pending';
    const isExpired = item.status === 'expired';
    const isInbox = item.type === 'inbox';

    let statusColor = 'text-cyan-600';
    let statusBg = 'bg-cyan-100';
    let statusLabel = 'Sent';

    if (isClaimed) {
        statusColor = 'text-emerald-600';
        statusBg = 'bg-emerald-100';
        statusLabel = 'Claimed';
    } else if (isPending && isInbox) {
        statusColor = 'text-amber-600';
        statusBg = 'bg-amber-100';
        statusLabel = 'Pending Claim';
    } else if (isExpired) {
        statusColor = 'text-gray-500';
        statusBg = 'bg-gray-100';
        statusLabel = 'Expired';
    }

    const sentDate = new Date(item.sentAt);
    const claimedDate = item.claimedAt ? new Date(item.claimedAt) : null;

    // Calculate time to claim if claimed
    const timeToClaimMs = claimedDate ? claimedDate.getTime() - sentDate.getTime() : null;
    const timeToClaimText = timeToClaimMs ? formatDuration(timeToClaimMs) : null;

    // Calculate time since sent
    const timeSinceSentMs = Date.now() - sentDate.getTime();
    const timeSinceSentText = formatDuration(timeSinceSentMs);

    return (
        <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md">
            <div className="p-6 overflow-x-hidden">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Issuance Details</h2>

                <div className="space-y-5">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusBg}`}>
                            {isClaimed ? (
                                <CheckCircle2 className={`w-6 h-6 ${statusColor}`} />
                            ) : isInbox ? (
                                <Mail className={`w-6 h-6 ${statusColor}`} />
                            ) : (
                                <Send className={`w-6 h-6 ${statusColor}`} />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-lg truncate">{item.templateName}</h3>

                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBg} ${statusColor}`}>
                                    {statusLabel}
                                </span>

                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${isInbox ? 'bg-violet-100 text-violet-700' : 'bg-cyan-100 text-cyan-700'}`}>
                                    {isInbox ? 'Email Delivery' : 'Direct Send'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <User className="w-4 h-4 text-gray-600" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-500">Recipient</p>
                                <p className="font-medium text-gray-900 truncate">{item.recipientName}</p>
                                {item.recipientId && (
                                    <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">{item.recipientId}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-gray-600" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-500">Sent</p>
                                <p className="font-medium text-gray-900">
                                    {sentDate.toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                    {' at '}
                                    {sentDate.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {timeSinceSentText} ago
                                </p>
                            </div>
                        </div>

                        {claimedDate && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-500">Claimed</p>
                                    <p className="font-medium text-gray-900">
                                        {claimedDate.toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                        {' at '}
                                        {claimedDate.toLocaleTimeString('en-US', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                    {timeToClaimText && (
                                        <p className="text-xs text-emerald-600">
                                            Claimed in {timeToClaimText}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {!isClaimed && !isExpired && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-500">Awaiting Claim</p>
                                    <p className="font-medium text-amber-700">
                                        Waiting for {timeSinceSentText}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Recipient has not claimed this credential yet
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Technical Details</p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Zap className="w-4 h-4 text-gray-600" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-500">Delivery Method</p>
                                        <p className="font-medium text-gray-900">
                                            {isInbox ? 'Universal Inbox (Email)' : 'Direct to Profile'}
                                        </p>
                                    </div>
                                </div>

                                {item.boostUri && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <LinkIcon className="w-4 h-4 text-gray-600" />
                                        </div>

                                        <div className="min-w-0 flex-1 overflow-hidden">
                                            <p className="text-sm text-gray-500">Template URI</p>
                                            <p className="font-mono text-xs text-gray-600 break-all">
                                                {item.boostUri}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {item.credentialUri && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <Award className="w-4 h-4 text-gray-600" />
                                        </div>

                                        <div className="min-w-0 flex-1 overflow-hidden">
                                            <p className="text-sm text-gray-500">Credential URI</p>
                                            <p className="font-mono text-xs text-gray-600 break-all">
                                                {item.credentialUri}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-4 h-4 text-gray-600" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-500">Activity ID</p>
                                        <p className="font-mono text-xs text-gray-600 break-all">
                                            {item.id}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper to format duration
function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    return 'less than a minute';
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    integration,
    config,
    stats,
    templates,
    onNavigate,
}) => {
    const { activity, isLoading: activityLoading } = useIntegrationActivity(templates, { limit: 10 });
    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });

    const handleActivityItemClick = (item: ActivityItem) => {
        newModal(
            <IssuanceDetailModal item={item} />,
            { sectionClassName: '!max-w-[450px]' }
        );
    };

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
                                <button
                                    key={item.id}
                                    onClick={() => handleActivityItemClick(item)}
                                    className="w-full flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer text-left"
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
                                </button>
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

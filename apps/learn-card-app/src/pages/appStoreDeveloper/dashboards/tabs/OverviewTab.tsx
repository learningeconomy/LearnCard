import React, { useEffect, useState } from 'react';
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
    AlertTriangle,
    Activity,
    Hash,
    Filter,
    ChevronDown,
    Download,
} from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { useModal, ModalTypes } from 'learn-card-base';

import type { DashboardConfig, DashboardStats, CredentialTemplate } from '../types';
import {
    useIntegrationActivity,
    formatRelativeTime,
    CredentialActivityRecord,
    CredentialEventType,
    getEventTypeLabel,
    getActivityLabel,
    isInboxActivity,
    isAutoDelivery,
    getRecipientDisplayName,
    getActivityName,
    getActivityError,
    formatActivitySource,
    EVENT_TYPE_FILTER_OPTIONS,
} from '../hooks/useIntegrationActivity';
import { ExportDialog } from '../components/ExportDialog';

import { useWallet } from 'learn-card-base';
import { openExternalLink } from 'src/helpers/externalLinkHelpers';

interface OverviewTabProps {
    integration: LCNIntegration;
    config: DashboardConfig;
    stats: DashboardStats;
    templates: CredentialTemplate[];
    onNavigate: (tabId: string) => void;
    refreshKey?: number;
}

interface IssuanceDetailModalProps {
    item: CredentialActivityRecord;
}

// Helper to get styling for an event type
function getEventStyling(eventType: string) {
    switch (eventType) {
        case 'CLAIMED':
            return { color: 'text-emerald-600', bg: 'bg-emerald-100', Icon: CheckCircle2 };
        case 'FAILED':
            return { color: 'text-red-600', bg: 'bg-red-100', Icon: AlertTriangle };
        case 'EXPIRED':
            return { color: 'text-gray-500', bg: 'bg-gray-100', Icon: Clock };
        default:
            return { color: 'text-cyan-600', bg: 'bg-cyan-100', Icon: Send };
    }
}

// Maximum events to show before collapsing
const ACTIVITY_CHAIN_DISPLAY_LIMIT = 5;

const IssuanceDetailModal: React.FC<IssuanceDetailModalProps> = ({ item }) => {
    const { initWallet } = useWallet();
    const [activityChain, setActivityChain] = useState<CredentialActivityRecord[]>([]);
    const [isLoadingChain, setIsLoadingChain] = useState(true);
    const [chainError, setChainError] = useState<string | null>(null);
    const [showAllEvents, setShowAllEvents] = useState(false);

    // Fetch the full activity chain
    useEffect(() => {
        const fetchChain = async () => {
            if (!item.activityId) {
                setActivityChain([item]);
                setIsLoadingChain(false);
                return;
            }

            try {
                setChainError(null);
                const wallet = await initWallet();
                const chain = await wallet.invoke.getActivityChain({ activityId: item.activityId });
                setActivityChain(chain?.length > 0 ? chain : [item]);
            } catch (err) {
                console.error('Failed to fetch activity chain:', err);
                setChainError('Unable to load full activity timeline');
                setActivityChain([item]);
            } finally {
                setIsLoadingChain(false);
            }
        };

        fetchChain();
    }, [item.activityId, initWallet]);

    // Determine which events to display
    const hasMoreEvents = activityChain.length > ACTIVITY_CHAIN_DISPLAY_LIMIT;
    const displayedEvents = showAllEvents
        ? activityChain
        : activityChain.slice(0, ACTIVITY_CHAIN_DISPLAY_LIMIT);

    // Determine current status from the chain (latest event)
    const latestEvent = activityChain.length > 0 ? activityChain[activityChain.length - 1] : item;
    const currentEventType = latestEvent?.eventType || item.eventType;
    const isInbox = isInboxActivity(item);
    const { color: statusColor, bg: statusBg } = getEventStyling(currentEventType);
    const statusLabel = getEventTypeLabel(currentEventType);

    // Check if credential has been claimed
    const isClaimed = activityChain.some(e => e.eventType === 'CLAIMED');
    const isFailed = activityChain.some(e => e.eventType === 'FAILED');
    const isExpired = activityChain.some(e => e.eventType === 'EXPIRED');
    const isPending = !isClaimed && !isFailed && !isExpired;

    const firstEvent = activityChain[0] || item;
    const timestamp = new Date(firstEvent.timestamp);
    const errorMessage = getActivityError(latestEvent || item);
    const sourceLabel = formatActivitySource(item.source);
    const recipientName = getRecipientDisplayName(item);
    const templateName = getActivityName(item);

    // Calculate time since event
    const timeSinceEventMs = Date.now() - timestamp.getTime();
    const timeSinceEventText = formatDuration(timeSinceEventMs);

    return (
        <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md">
            <div className="p-6 overflow-x-hidden">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Issuance Details</h2>

                <div className="space-y-5">
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                        <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusBg}`}
                        >
                            {currentEventType === 'CLAIMED' ? (
                                <CheckCircle2 className={`w-6 h-6 ${statusColor}`} />
                            ) : currentEventType === 'FAILED' ? (
                                <AlertTriangle className={`w-6 h-6 ${statusColor}`} />
                            ) : currentEventType === 'EXPIRED' ? (
                                <Clock className={`w-6 h-6 ${statusColor}`} />
                            ) : isInbox ? (
                                <Mail className={`w-6 h-6 ${statusColor}`} />
                            ) : (
                                <Send className={`w-6 h-6 ${statusColor}`} />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-lg truncate">
                                {templateName}
                            </h3>

                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span
                                    className={`text-xs px-2 py-1 rounded-full font-medium ${statusBg} ${statusColor}`}
                                >
                                    {statusLabel}
                                </span>

                                <span
                                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                                        isInbox
                                            ? 'bg-violet-100 text-violet-700'
                                            : 'bg-cyan-100 text-cyan-700'
                                    }`}
                                >
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
                                <p className="font-medium text-gray-900 truncate">
                                    {recipientName}
                                </p>
                                {item.recipientType === 'profile' && (
                                    <p className="text-xs text-gray-400 mt-0.5 font-mono truncate">
                                        {item.recipientIdentifier}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-4 h-4 text-gray-600" />
                            </div>

                            <div className="min-w-0 flex-1">
                                <p className="text-sm text-gray-500">Event Time</p>
                                <p className="font-medium text-gray-900">
                                    {timestamp.toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                    {' at '}
                                    {timestamp.toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                                <p className="text-xs text-gray-400">{timeSinceEventText} ago</p>
                            </div>
                        </div>

                        {isFailed && errorMessage && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-500">Error</p>
                                    <p className="text-sm text-red-600">{errorMessage}</p>
                                </div>
                            </div>
                        )}

                        {isPending && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                    <Clock className="w-4 h-4 text-amber-600" />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-gray-500">Awaiting Claim</p>
                                    <p className="font-medium text-amber-700">
                                        Waiting for {timeSinceEventText}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Recipient has not claimed this credential yet
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Activity Timeline */}
                        {activityChain.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                                    Activity Timeline
                                    {activityChain.length > 1 && (
                                        <span className="ml-2 text-gray-400 font-normal">
                                            ({activityChain.length} events)
                                        </span>
                                    )}
                                </p>

                                <div className="space-y-2">
                                    {isLoadingChain ? (
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading timeline...
                                        </div>
                                    ) : chainError ? (
                                        <div className="flex items-center gap-2 text-sm text-amber-600">
                                            <AlertTriangle className="w-4 h-4" />
                                            {chainError}
                                        </div>
                                    ) : (
                                        <>
                                            {displayedEvents.map((event, index) => {
                                                const isAutoDeliver = isAutoDelivery(event);
                                                let { color, bg, Icon } = getEventStyling(
                                                    event.eventType
                                                );

                                                // Override styling for auto-delivery
                                                if (isAutoDeliver) {
                                                    color = 'text-emerald-600';
                                                    bg = 'bg-emerald-100';
                                                    Icon = User;
                                                }

                                                const eventTime = new Date(event.timestamp);

                                                return (
                                                    <div
                                                        key={event.id}
                                                        className="flex items-center gap-3"
                                                    >
                                                        <div
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}
                                                        >
                                                            <Icon className={`w-3 h-3 ${color}`} />
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <span
                                                                className={`text-sm font-medium ${color}`}
                                                            >
                                                                {getActivityLabel(event)}
                                                            </span>
                                                        </div>

                                                        <span className="text-xs text-gray-400">
                                                            {eventTime.toLocaleTimeString('en-US', {
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                            })}
                                                        </span>
                                                    </div>
                                                );
                                            })}

                                            {hasMoreEvents && (
                                                <button
                                                    onClick={() => setShowAllEvents(!showAllEvents)}
                                                    className="text-xs text-cyan-600 hover:text-cyan-700 font-medium mt-1"
                                                >
                                                    {showAllEvents
                                                        ? 'Show less'
                                                        : `Show ${
                                                              activityChain.length -
                                                              ACTIVITY_CHAIN_DISPLAY_LIMIT
                                                          } more events`}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                                Technical Details
                            </p>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Zap className="w-4 h-4 text-gray-600" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-500">Delivery Method</p>
                                        <p className="font-medium text-gray-900">
                                            {isInbox
                                                ? 'Universal Inbox (Email)'
                                                : 'Direct to Profile'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                        <Activity className="w-4 h-4 text-gray-600" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-500">Source</p>
                                        <p className="font-medium text-gray-900">{sourceLabel}</p>
                                    </div>
                                </div>
                                {item?.metadata && (
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <Hash className="w-4 h-4 text-gray-600" />
                                        </div>

                                        <div className="min-w-0 flex-1 overflow-hidden">
                                            <p className="text-sm text-gray-500">Template Alias</p>
                                            <p className="font-mono text-xs text-gray-600 break-all">
                                                {item?.metadata?.templateAlias}
                                            </p>
                                        </div>
                                    </div>
                                )}
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
                                            {item.activityId}
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
    refreshKey,
}) => {
    const [eventTypeFilter, setEventTypeFilter] = useState<CredentialEventType | 'ALL'>('ALL');

    const {
        activity,
        isLoading: activityLoading,
        isLoadingMore,
        hasMore,
        refetch,
        loadMore,
        stats: activityStats,
    } = useIntegrationActivity(templates, {
        limit: 25,
        integrationId: integration.id,
        eventType: eventTypeFilter === 'ALL' ? undefined : eventTypeFilter,
    });

    // Refetch when refreshKey changes
    useEffect(() => {
        if (refreshKey && refreshKey > 0) {
            refetch();
        }
    }, [refreshKey, refetch]);

    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });
    const [showExportDialog, setShowExportDialog] = useState(false);

    const handleActivityItemClick = (item: CredentialActivityRecord) => {
        newModal(<IssuanceDetailModal item={item} />, { sectionClassName: '!max-w-[450px]' });
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

    const getActivityStat = (eventTypeFilter: string, activityStats: any) => {
        const statMap = {
            DELIVERED: activityStats.totalSent,
            CLAIMED: activityStats.totalClaimed,
            ALL: activityStats.totalEvents,
            FAILED: activityStats.failed,
            EXPIRED: activityStats.expired,
        };

        const total = statMap[eventTypeFilter as keyof typeof statMap];

        return total ? `Load More (showing ${activity.length} of ${total})` : 'Load More';
    };

    // Always add documentation link
    const docsUrl = getDocsUrl(integration.guideType);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Actions</h2>
                <p className="text-sm text-gray-500 mb-4">
                    Common tasks for managing your integration
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {quickActions.slice(0, 2).map(action => (
                        <button
                            key={action.id}
                            onClick={() => onNavigate(action.id)}
                            className={`p-4 border border-gray-200 rounded-xl ${action.hoverColor} transition-colors text-left group`}
                        >
                            <action.icon className={`w-8 h-8 ${action.iconColor} mb-3`} />
                            <h3 className="font-medium text-gray-800 group-hover:text-gray-900">
                                {action.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{action.description}</p>
                        </button>
                    ))}

                    <button
                        onClick={() => openExternalLink(docsUrl)}
                        className="p-4 border border-gray-200 rounded-xl hover:border-cyan-300 hover:bg-cyan-50 transition-colors text-left group"
                    >
                        <ExternalLink className="w-8 h-8 text-cyan-600 mb-3" />
                        <h3 className="font-medium text-gray-800 group-hover:text-cyan-700">
                            Documentation
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Learn how to integrate</p>
                    </button>
                </div>
            </div>

            <div>
                <div className="flex items-center justify-between mb-3 xs:flex-col xs:items-start">
                    <div className="flex xs:flex-col">
                        <h2 className="text-lg font-semibold text-gray-800 mb-1 mr-4">
                            Recent Activity
                        </h2>
                        <button
                            onClick={() => setShowExportDialog(true)}
                            className="flex items-center text-sm font-medium text-gray-600 p-[5px] border !border-solid border-gray-200 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors xs:mb-[5px]"
                        >
                            <Download className="w-4 h-4 mr-[5px]" />
                            Download CSV
                        </button>
                    </div>
                    <div className="relative">
                        <select
                            value={eventTypeFilter}
                            onChange={e =>
                                setEventTypeFilter(e.target.value as CredentialEventType | 'ALL')
                            }
                            className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-8 py-[5px] text-sm
                                       text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500
                                       focus:border-transparent cursor-pointer transition-colors"
                        >
                            {EVENT_TYPE_FILTER_OPTIONS.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
                {showExportDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <ExportDialog
                            integrationId={integration.id}
                            integrationName={integration.name}
                            initialEventType={eventTypeFilter === 'ALL' ? '' : eventTypeFilter}
                            onClose={() => setShowExportDialog(false)}
                        />
                    </div>
                )}

                <div className="min-h-[300px]">
                    {activityLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                        </div>
                    ) : activity.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p>No activity yet</p>
                            <p className="text-sm mt-1">
                                Credentials will appear here as they're issued
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activity.map(item => {
                                const { eventType } = item;
                                const isInbox = isInboxActivity(item);
                                const isAutoDeliver = isAutoDelivery(item);
                                const templateName = getActivityName(item);
                                const recipientName = getRecipientDisplayName(item);
                                const statusLabel = getActivityLabel(item);

                                // Determine icon and colors based on event type
                                let bgColor = 'bg-cyan-100';
                                let textColor = 'text-cyan-600';
                                let badgeBg = 'bg-cyan-100';
                                let badgeText = 'text-cyan-700';
                                let Icon = Send;

                                if (eventType === 'CLAIMED') {
                                    bgColor = 'bg-emerald-100';
                                    textColor = 'text-emerald-600';
                                    badgeBg = 'bg-emerald-100';
                                    badgeText = 'text-emerald-700';
                                    Icon = CheckCircle2;
                                } else if (eventType === 'FAILED') {
                                    bgColor = 'bg-red-100';
                                    textColor = 'text-red-600';
                                    badgeBg = 'bg-red-100';
                                    badgeText = 'text-red-700';
                                    Icon = AlertTriangle;
                                } else if (eventType === 'EXPIRED') {
                                    bgColor = 'bg-gray-100';
                                    textColor = 'text-gray-500';
                                    badgeBg = 'bg-gray-100';
                                    badgeText = 'text-gray-600';
                                    Icon = Clock;
                                } else if (isAutoDeliver) {
                                    // Auto-delivered to verified user - use User icon, emerald color
                                    bgColor = 'bg-emerald-50';
                                    textColor = 'text-emerald-600';
                                    badgeBg = 'bg-emerald-100';
                                    badgeText = 'text-emerald-700';
                                    Icon = User;
                                } else if (isInbox) {
                                    // CREATED to inbox - use Mail icon, cyan color
                                    Icon = Mail;
                                }
                                // Regular DELIVERED to profile uses cyan (default)

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => handleActivityItemClick(item)}
                                        className="w-full flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer text-left"
                                    >
                                        <div
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bgColor}`}
                                        >
                                            <Icon className={`w-4 h-4 ${textColor}`} />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-800 truncate">
                                                    {templateName}
                                                </span>

                                                <span
                                                    className={`text-xs px-1.5 py-0.5 rounded ${badgeBg} ${badgeText}`}
                                                >
                                                    {statusLabel}
                                                </span>

                                                {isInbox && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">
                                                        Email
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-gray-500 truncate">
                                                To: {recipientName}
                                            </p>
                                        </div>

                                        <div className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                                            <Clock className="w-3 h-3" />
                                            {formatRelativeTime(item.timestamp)}
                                        </div>
                                    </button>
                                );
                            })}

                            {hasMore && (
                                <button
                                    onClick={loadMore}
                                    disabled={isLoadingMore}
                                    className="w-full py-3 text-sm font-medium text-cyan-600 hover:text-cyan-700 
                                           hover:bg-cyan-50 rounded-xl transition-colors flex items-center 
                                           justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoadingMore ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        getActivityStat(eventTypeFilter, activityStats)
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

function getDocsUrl(guideType?: string): string {
    switch (guideType) {
        case 'issue-credentials':
            return 'https://docs.learncard.com/how-to-guides/send-credentials';
        case 'embed-claim':
            return 'https://github.com/learningeconomy/LearnCard/tree/main/packages/learn-card-embed-sdk';
        case 'embed-app':
            return 'https://docs.learncard.com/sdks/partner-connect';
        case 'consent-flow':
            return 'https://docs.learncard.com/core-concepts/consent-and-permissions/consentflow-overview';
        default:
            return 'https://docs.learncard.com';
    }
}

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
    AlertTriangle,
    Filter,
    ChevronDown,
    Download,
    Layout,
} from 'lucide-react';
import type { LCNIntegration, AppStoreListing } from '@learncard/types';

import { useModal, ModalTypes } from 'learn-card-base';

import type { DashboardConfig, DashboardStats, CredentialTemplate } from '../types';
import {
    useIntegrationActivity,
    formatRelativeTime,
    CredentialActivityRecord,
    CredentialEventType,
    getActivityLabel,
    isInboxActivity,
    isAutoDelivery,
    getRecipientDisplayName,
    getActivityName,
    EVENT_TYPE_FILTER_OPTIONS,
} from '../hooks/useIntegrationActivity';
import { ExportDialog } from '../components/ExportDialog';
import { IssuanceDetailModal } from 'src/components/issuances/IssuanceDetailModal';

import { useWallet } from 'learn-card-base';
import { useQueries } from '@tanstack/react-query';
import { openExternalLink } from 'src/helpers/externalLinkHelpers';

interface OverviewTabProps {
    integration: LCNIntegration;
    config: DashboardConfig;
    stats: DashboardStats;
    templates: CredentialTemplate[];
    appListings?: AppStoreListing[];
    selectedListingId?: string;
    onListingFilterChange?: (listingId: string | undefined) => void;
    onNavigate: (tabId: string) => void;
    refreshKey?: number;
}


export const OverviewTab: React.FC<OverviewTabProps> = ({
    integration,
    config,
    stats,
    templates,
    appListings,
    selectedListingId,
    onListingFilterChange,
    onNavigate,
    refreshKey,
}) => {
    const [eventTypeFilter, setEventTypeFilter] = useState<CredentialEventType | 'ALL'>('ALL');

    // Use the dashboard-level filter if provided, otherwise use local state
    const listingFilter = selectedListingId === undefined ? 'ALL' : selectedListingId || 'ALL';
    const setListingFilter = (value: string) => {
        if (onListingFilterChange) {
            onListingFilterChange(value === 'ALL' ? undefined : value);
        }
    };

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
        listingId: selectedListingId,
        eventType: eventTypeFilter === 'ALL' ? undefined : eventTypeFilter,
    });

    const { initWallet } = useWallet();

    // Best-effort recipient-status overlay for the activity list: fetch recipients
    // once per unique boost (cache-shared with the detail modal's useGetBoostRecipients),
    // capped at 25/boost, so rows can badge revoked/suspended without an N+1-per-row fetch.
    const uniqueActivityBoostUris = Array.from(
        new Set(activity.map(a => a.boostUri).filter((u): u is string => Boolean(u)))
    );
    const activityRecipientQueries = useQueries({
        queries: uniqueActivityBoostUris.map(uri => ({
            queryKey: ['boostRecipients', uri, true],
            queryFn: async () => {
                const wallet = await initWallet();
                const data = await wallet.invoke.getBoostRecipients(uri, 25, undefined, true);
                return Array.isArray(data) ? data : [];
            },
            enabled: Boolean(uri),
            staleTime: 30_000,
        })),
    });
    const recipientStatusMap = new Map<string, string>();
    uniqueActivityBoostUris.forEach((uri, i) => {
        const recips = activityRecipientQueries[i]?.data as Array<any> | undefined;
        recips?.forEach(r => {
            const status = r?.status;
            if (r?.to?.profileId && status && status !== 'active') {
                recipientStatusMap.set(`${uri}|${r.to.profileId}`, status);
            }
        });
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
                    <div className="flex items-center gap-2">
                        {/* App Listing Filter - only show if multiple apps exist */}
                        {appListings && appListings.length > 1 && (
                            <div className="relative">
                                <select
                                    value={listingFilter}
                                    onChange={e => setListingFilter(e.target.value)}
                                    className="appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-8 py-[5px] text-sm
                                               text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-cyan-500
                                               focus:border-transparent cursor-pointer transition-colors max-w-[180px]"
                                >
                                    <option value="ALL">All Apps</option>
                                    {appListings.map(listing => (
                                        <option key={listing.listing_id} value={listing.listing_id}>
                                            {listing.display_name}
                                        </option>
                                    ))}
                                </select>
                                <Layout className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        )}

                        {/* Event Type Filter */}
                        <div className="relative">
                            <select
                                value={eventTypeFilter}
                                onChange={e =>
                                    setEventTypeFilter(
                                        e.target.value as CredentialEventType | 'ALL'
                                    )
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
                </div>
                {showExportDialog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <ExportDialog
                            integrationId={integration.id}
                            integrationName={integration.name}
                            initialEventType={eventTypeFilter === 'ALL' ? '' : eventTypeFilter}
                            initialListingId={listingFilter === 'ALL' ? '' : listingFilter}
                            appListings={appListings}
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
                                Consent and credential activity will appear here as users connect
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
                                const rowStatus =
                                    item.boostUri && item.recipientProfile?.profileId
                                        ? recipientStatusMap.get(
                                              `${item.boostUri}|${item.recipientProfile.profileId}`
                                          )
                                        : undefined;

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

                                                {(rowStatus === 'revoked' ||
                                                    rowStatus === 'suspended') && (
                                                    <span
                                                        className={`text-xs px-1.5 py-0.5 rounded ${
                                                            rowStatus === 'revoked'
                                                                ? 'bg-red-100 text-red-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}
                                                    >
                                                        {rowStatus === 'revoked'
                                                            ? 'Revoked'
                                                            : 'Suspended'}
                                                    </span>
                                                )}

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

import React, { useEffect, useState } from 'react';
import {
    Send,
    CheckCircle2,
    Clock,
    Loader2,
    Mail,
    User,
    AlertTriangle,
    Filter,
    ChevronDown,
    Download,
    Zap,
} from 'lucide-react';
import type { AppStoreListing } from '@learncard/types';

import { useModal, ModalTypes } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

import type { CredentialTemplate } from 'src/pages/appStoreDeveloper/dashboards/types';
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
    getEventTypeFilterOptions,
} from 'src/pages/appStoreDeveloper/dashboards/hooks/useIntegrationActivity';
import { ExportDialog } from 'src/pages/appStoreDeveloper/dashboards/components/ExportDialog';
import { IssuanceDetailModal } from 'src/components/issuances/IssuanceDetailModal';

export interface IssuanceListProps {
    // scoping (pass what you have; all optional)
    boostUri?: string;
    integrationId?: string;
    listingId?: string;
    templates?: CredentialTemplate[];
    // needed for ExportDialog when showExport is true
    integrationName?: string;
    appListings?: AppStoreListing[];
    // UI toggles
    title?: string;
    showFilter?: boolean;
    showExport?: boolean;
    refreshKey?: number;
    /** Which issuer surface this list lives on — forwarded to the detail modal for analytics. */
    surface?: 'managed-boosts' | 'issuer-dashboard';
}

export const IssuanceList: React.FC<IssuanceListProps> = ({
    boostUri,
    integrationId,
    listingId,
    templates = [],
    integrationName,
    appListings,
    title,
    showFilter,
    showExport,
    refreshKey,
    surface = 'issuer-dashboard',
}) => {
    const [eventTypeFilter, setEventTypeFilter] = useState<CredentialEventType | 'ALL'>('ALL');
    const [showExportDialog, setShowExportDialog] = useState(false);

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
        integrationId,
        listingId,
        boostUri,
        eventType: eventTypeFilter === 'ALL' ? undefined : eventTypeFilter,
    });

    // Refetch when refreshKey changes
    useEffect(() => {
        if (refreshKey && refreshKey > 0) {
            refetch();
        }
    }, [refreshKey, refetch]);

    const { newModal } = useModal({ desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel });

    const handleActivityItemClick = (item: CredentialActivityRecord) => {
        newModal(<IssuanceDetailModal item={item} surface={surface} onActionComplete={refetch} />, {
            sectionClassName: '!max-w-[450px]',
        });
    };

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

    // Derive a safe listing filter value for ExportDialog
    const listingFilter = listingId || '';

    return (
        <div>
            <div className="flex items-center justify-between mb-3 xs:flex-col xs:items-start">
                <div className="flex xs:flex-col">
                    {title && (
                        <h2 className="text-lg font-semibold text-gray-800 mb-1 mr-4">{title}</h2>
                    )}
                    {showExport && (
                        <button
                            onClick={() => setShowExportDialog(true)}
                            className="flex items-center text-sm font-medium text-gray-600 p-[5px] border !border-solid border-gray-200 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors xs:mb-[5px]"
                        >
                            <Download className="w-4 h-4 mr-[5px]" />
                            Download CSV
                        </button>
                    )}
                </div>
                {showFilter && (
                    <div className="flex items-center gap-2">
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
                                {getEventTypeFilterOptions().map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                )}
            </div>

            {showExport && showExportDialog && integrationId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <ExportDialog
                        integrationId={integrationId}
                        integrationName={integrationName ?? integrationId}
                        initialEventType={eventTypeFilter === 'ALL' ? '' : eventTypeFilter}
                        initialListingId={listingFilter === '' ? '' : listingFilter}
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
                            const rowStatus = item.status;

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
                                                        ? m['issue.revoked']()
                                                        : m['issue.suspended']()}
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
                                        {m['common.loading']()}
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
    );
};

import React, { useMemo } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline, closeCircleOutline, syncOutline } from 'ionicons/icons';

import { ErrorBoundary } from '@sentry/react';
import { UserProfilePicture, useGetProfile, useModal } from 'learn-card-base';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import {
    bucketNotifications,
    formatActionsText,
    getConsentActivityStats,
    parseContractName,
} from './consentFlowGrouping';

type ConsentActivityDetailModalProps = {
    notifications: NotificationType[];
    onArchiveGroup?: (event: React.MouseEvent) => void | Promise<void>;
};

const getActionIconAndColor = (actions: string[]) => {
    if (actions.some(action => action === 'Stopped sharing')) {
        return { icon: closeCircleOutline, colorClass: 'text-red-500' };
    }
    if (actions.some(action => action === 'Connected' || action === 'Reconnected')) {
        return { icon: checkmarkCircleOutline, colorClass: 'text-emerald-500' };
    }
    return { icon: syncOutline, colorClass: 'text-grayscale-500' };
};

const StatTile: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="flex flex-col gap-1 rounded-[16px] border border-grayscale-200 bg-grayscale-10 p-3">
        <span className="text-lg font-semibold text-grayscale-900 leading-none truncate">
            {value}
        </span>
        <span className="text-[11px] font-medium text-grayscale-500 uppercase tracking-wide">
            {label}
        </span>
    </div>
);

const ConsentActivityDetailModal: React.FC<ConsentActivityDetailModalProps> = ({
    notifications,
    onArchiveGroup,
}) => {
    const { closeModal } = useModal();

    const primary = notifications[0];
    const { data: profile } = useGetProfile(primary?.from?.profileId);

    const actorName = profile?.displayName || primary?.from?.displayName || 'Someone';
    const contractName = parseContractName(primary?.message?.body) || 'your contract';

    const stats = useMemo(() => getConsentActivityStats(notifications), [notifications]);
    const buckets = useMemo(() => bucketNotifications(notifications), [notifications]);
    const distinctActions = Object.keys(stats.actionCounts);

    const handleArchive = async (event: React.MouseEvent) => {
        await onArchiveGroup?.(event);
        closeModal();
    };

    return (
        <ErrorBoundary
            fallback={
                <section className="w-full px-6 py-7 text-grayscale-900">
                    Unable to load activity
                </section>
            }
        >
            <section className="w-full px-6 py-7 space-y-5 text-grayscale-900">
                <div className="flex items-center gap-3 min-w-0 pr-8">
                    <div className="w-[56px] h-[56px] shrink-0 overflow-hidden rounded-full">
                        <UserProfilePicture
                            user={profile ?? primary?.from}
                            customImageClass="w-full h-full object-cover"
                            customContainerClass="flex items-center justify-center h-full text-white font-medium text-lg"
                        />
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-poppins text-lg font-semibold text-grayscale-900 truncate">
                            {actorName}
                        </h1>
                        <p className="text-sm text-grayscale-500 truncate">
                            Shared with {contractName}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <StatTile value={`${stats.totalUpdates}`} label="Updates" />
                    <StatTile
                        value={`${stats.totalCredentialsShared}`}
                        label="Credentials shared"
                    />
                    <StatTile value={stats.firstDate || '—'} label="First activity" />
                </div>

                {distinctActions.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                        {distinctActions.map(action => (
                            <span
                                key={action}
                                className="rounded-full bg-grayscale-100 px-2.5 py-1 text-xs font-medium text-grayscale-700"
                            >
                                {action}
                                {stats.actionCounts[action] > 1
                                    ? ` ×${stats.actionCounts[action]}`
                                    : ''}
                            </span>
                        ))}
                    </div>
                )}

                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-grayscale-900">Activity</h2>
                    <div className="max-h-[300px] overflow-y-auto pr-2 relative">
                        <div className="absolute left-[11px] top-2 bottom-2 w-px bg-grayscale-200" />
                        <div className="flex flex-col gap-4">
                            {buckets.map(bucket => {
                                const { icon, colorClass } = getActionIconAndColor(
                                    Object.keys(bucket.actions)
                                );
                                return (
                                    <div
                                        key={bucket.dateStr}
                                        className="flex items-start gap-3 relative z-10"
                                    >
                                        <div className="shrink-0 w-[22px] h-[22px] rounded-full bg-white border border-grayscale-200 flex items-center justify-center mt-0.5">
                                            <IonIcon
                                                icon={icon}
                                                className={`text-[12px] ${colorClass}`}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 flex justify-between items-start gap-2">
                                            <span className="text-sm text-grayscale-700 leading-snug">
                                                {formatActionsText(bucket.actions)}
                                            </span>
                                            <span className="text-xs text-grayscale-400 shrink-0 mt-0.5">
                                                {bucket.dateStr}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {onArchiveGroup && (
                    <button
                        onClick={handleArchive}
                        className="w-full py-3 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors"
                    >
                        Archive
                    </button>
                )}
            </section>
        </ErrorBoundary>
    );
};

export default ConsentActivityDetailModal;

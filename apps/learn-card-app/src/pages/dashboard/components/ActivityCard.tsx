import React, { useMemo } from 'react';
import moment from 'moment';
import { useHistory } from 'react-router-dom';

import {
    BoostPageViewMode,
    CredentialCategoryEnum,
    categoryMetadata,
    type CredentialCategory,
} from 'learn-card-base';
import type { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';

import BoostEarnedCard from '../../../components/boost/boost-earned-card/BoostEarnedCard';

type ActivityRecord = {
    id: string;
    uri: string;
    title?: string;
    from?: string;
    date?: string;
    category?: string;
};

type LcnVisibleProfile = { profileId?: string; displayName?: string; image?: string };

type EmptyTip = {
    key: string;
    title: string;
    subtitle: string;
    Icon?: React.FC<{ className?: string; shadeColor?: string }>;
    onClick: () => void;
};

type ActivityCardProps = {
    notifications: NotificationType[];
    pendingContractRequests: {
        profile?: LcnVisibleProfile;
        contract?: { name?: string };
    }[];
    pendingConnections: LcnVisibleProfile[];
    records: ActivityRecord[];
    isLoading?: boolean;
    emptyTips?: EmptyTip[];
};

const ACTIONABLE_NOTIFICATION_TYPES = new Set([
    'CONNECTION_REQUEST',
    'CREDENTIAL_RECEIVED',
    'BOOST_RECEIVED',
    'PRESENTATION_REQUEST',
    'DEVICE_LINK_REQUEST',
    'GUARDIAN_APPROVAL_PENDING',
]);

const MAX_ACTIONABLE = 2;
const MAX_PASSIVE = 3;

type ActionableItem = {
    key: string;
    title: string;
    subtitle?: string;
    imageUrl?: string;
    timestamp: number;
    onClick: () => void;
};

const titleForNotificationType = (type: string): string => {
    switch (type) {
        case 'CONNECTION_REQUEST':
            return 'New connection request';
        case 'CREDENTIAL_RECEIVED':
            return 'Credential received';
        case 'BOOST_RECEIVED':
            return 'New credential available';
        case 'PRESENTATION_REQUEST':
            return 'Presentation requested';
        case 'DEVICE_LINK_REQUEST':
            return 'Device link request';
        case 'GUARDIAN_APPROVAL_PENDING':
            return 'Guardian approval needed';
        default:
            return 'New notification';
    }
};

const resolveCategory = (raw?: string): CredentialCategory => {
    if (raw && Object.values(CredentialCategoryEnum).includes(raw as CredentialCategoryEnum)) {
        return raw as CredentialCategory;
    }
    return CredentialCategoryEnum.achievement;
};

const SkeletonRow: React.FC<{ index: number }> = ({ index }) => (
    <div
        className="w-full flex items-center gap-3 py-2.5 animate-pulse"
        style={{ animationDelay: `${index * 60}ms` }}
    >
        <span className="shrink-0 w-9 h-9 rounded-full bg-grayscale-100" />
        <div className="flex-1 min-w-0 space-y-1.5">
            <div className="h-3 bg-grayscale-100 rounded w-2/3" />
            <div className="h-2.5 bg-grayscale-100 rounded w-1/2" />
        </div>
    </div>
);

const MeanwhileTips: React.FC<{ tips: EmptyTip[] }> = ({ tips }) => (
    <div className="mt-auto pt-3 border-t border-grayscale-100 flex flex-col gap-1">
        <p className="text-[11px] font-medium tracking-wider text-grayscale-400 uppercase px-1 mb-1">
            Meanwhile
        </p>
        {tips.map(tip => {
            const TipIcon = tip.Icon;
            return (
                <button
                    key={tip.key}
                    type="button"
                    onClick={tip.onClick}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-grayscale-10 transition-colors text-left"
                >
                    <span className="shrink-0 w-9 h-9 rounded-full bg-grayscale-100 flex items-center justify-center text-grayscale-700">
                        {TipIcon ? (
                            <TipIcon className="w-5 h-5" />
                        ) : (
                            <span className="text-sm leading-none">›</span>
                        )}
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-grayscale-900 truncate">
                            {tip.title}
                        </span>
                        <span className="block text-[11px] text-grayscale-500 truncate">
                            {tip.subtitle}
                        </span>
                    </span>
                </button>
            );
        })}
    </div>
);

const ActionableRow: React.FC<{
    item: ActionableItem;
    animationDelayMs: number;
}> = ({ item, animationDelayMs }) => {
    const [imageFailed, setImageFailed] = React.useState(false);
    const showImage = Boolean(item.imageUrl) && !imageFailed;

    return (
        <button
            type="button"
            onClick={item.onClick}
            className="w-full flex items-center gap-2.5 py-2 pl-2 pr-2.5 rounded-xl border-l-2 border-amber-300 bg-amber-50/40 hover:bg-amber-50 active:scale-[0.99] transition-all text-left animate-fade-in-up"
            style={{ animationDelay: `${animationDelayMs}ms` }}
        >
            <span className="shrink-0 relative w-7 h-7">
                {showImage ? (
                    <img
                        src={item.imageUrl}
                        alt=""
                        className="w-full h-full rounded-full object-cover border border-grayscale-200"
                        onError={() => setImageFailed(true)}
                    />
                ) : (
                    <span className="w-full h-full rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold">
                        !
                    </span>
                )}
                {showImage && (
                    <span
                        className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white"
                        aria-hidden
                    />
                )}
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-grayscale-900 truncate leading-tight">
                    {item.title}
                </p>
                {item.subtitle && (
                    <p className="text-[11px] text-grayscale-600 truncate leading-tight mt-0.5">
                        {item.subtitle}
                    </p>
                )}
            </div>
            <span className="shrink-0 text-grayscale-400 text-base leading-none">›</span>
        </button>
    );
};

const ActivityCard: React.FC<ActivityCardProps> = ({
    notifications,
    pendingContractRequests,
    pendingConnections,
    records,
    isLoading = false,
    emptyTips = [],
}) => {
    const history = useHistory();

    const actionableItems = useMemo<ActionableItem[]>(() => {
        const out: ActionableItem[] = [];

        for (const conn of pendingConnections) {
            const name = conn.displayName?.trim() || 'Someone';
            out.push({
                key: `conn-${conn.profileId ?? name}`,
                title: `${name} wants to connect`,
                imageUrl: conn.image?.trim() || undefined,
                timestamp: Date.now(),
                onClick: () => history.push('/contacts/requests'),
            });
        }

        for (const req of pendingContractRequests) {
            const name = req.profile?.displayName?.trim() || 'An app';
            out.push({
                key: `contract-${req.profile?.profileId ?? name}`,
                title: `${name} requested data access`,
                subtitle: req.contract?.name,
                imageUrl: req.profile?.image?.trim() || undefined,
                timestamp: Date.now(),
                onClick: () => history.push('/notifications'),
            });
        }

        const actionableNotifications = notifications
            .filter(n => ACTIONABLE_NOTIFICATION_TYPES.has(n.type) && !n.read && !n.archived)
            .sort((a, b) => {
                const aMs = a.sent ? new Date(a.sent).getTime() : 0;
                const bMs = b.sent ? new Date(b.sent).getTime() : 0;
                return bMs - aMs;
            });

        for (const n of actionableNotifications) {
            const sortMs = n.sent ? new Date(n.sent).getTime() : 0;
            const senderImage =
                typeof n.from === 'object'
                    ? (n.from as { image?: string } | null)?.image?.trim()
                    : undefined;
            out.push({
                key: `notif-${n._id ?? sortMs}-${n.type}`,
                title: n.message?.title?.trim() || titleForNotificationType(n.type),
                subtitle: n.sent ? moment(n.sent).fromNow() : undefined,
                imageUrl: senderImage || undefined,
                timestamp: sortMs,
                onClick: () => history.push('/notifications'),
            });
        }

        return out;
    }, [pendingConnections, pendingContractRequests, notifications, history]);

    const actionableTotal = actionableItems.length;
    const visibleActionable = actionableItems.slice(0, MAX_ACTIONABLE);
    const visiblePassive = records.slice(0, MAX_PASSIVE);
    const showSkeleton = isLoading && visiblePassive.length === 0;

    const hasActionable = visibleActionable.length > 0;
    const hasPassive = visiblePassive.length > 0 || showSkeleton;
    const totalVisibleItems = visibleActionable.length + visiblePassive.length;
    const showPopulatedMeanwhile =
        !showSkeleton && totalVisibleItems > 0 && totalVisibleItems <= 2 && emptyTips.length > 0;

    if (!hasActionable && !hasPassive) {
        return (
            <section className="bg-white rounded-[20px] p-5 desktop:p-6 shadow-soft-bottom border border-grayscale-200 animate-fade-in-up flex flex-col desktop:min-h-[420px]">
                <h2 className="text-xs font-medium tracking-wider text-grayscale-500 uppercase mb-3">
                    Activity
                </h2>
                <div className="flex flex-col items-center text-center py-6 desktop:py-8">
                    <span
                        aria-hidden
                        className="w-12 h-12 rounded-full bg-grayscale-100 text-grayscale-500 flex items-center justify-center mb-3"
                    >
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                            <path d="M10 21a2 2 0 0 0 4 0" />
                        </svg>
                    </span>
                    <p className="text-sm font-semibold text-grayscale-900">No alerts right now</p>
                    <p className="mt-1 text-xs text-grayscale-500 leading-relaxed max-w-[260px]">
                        We&apos;ll let you know here when someone wants to connect or send you a
                        credential.
                    </p>
                </div>
                {emptyTips.length > 0 && <MeanwhileTips tips={emptyTips} />}
            </section>
        );
    }

    return (
        <section className="bg-white rounded-[20px] p-4 shadow-soft-bottom border border-grayscale-200 animate-fade-in-up flex flex-col">
            <h2 className="text-xs font-medium tracking-wider text-grayscale-500 uppercase mb-2">
                Activity
            </h2>

            {hasActionable && (
                <div className="flex flex-col gap-1.5">
                    {visibleActionable.map((item, i) => (
                        <ActionableRow key={item.key} item={item} animationDelayMs={i * 60} />
                    ))}
                    <button
                        type="button"
                        onClick={() => history.push('/notifications')}
                        className="self-start text-xs font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors mt-0.5"
                    >
                        {actionableTotal > MAX_ACTIONABLE
                            ? `View ${actionableTotal - MAX_ACTIONABLE} more →`
                            : 'View all pending →'}
                    </button>
                </div>
            )}

            {hasActionable && hasPassive && (
                <div className="my-3 h-px bg-grayscale-200" aria-hidden />
            )}

            {hasPassive && (
                <div className="flex flex-col gap-1.5">
                    {showSkeleton
                        ? Array.from({ length: MAX_PASSIVE }).map((_, i) => (
                              <SkeletonRow key={`skeleton-${i}`} index={i} />
                          ))
                        : visiblePassive.map((record, i) => {
                              const category = resolveCategory(record.category);
                              return (
                                  <div
                                      key={record.id ?? record.uri}
                                      className="animate-fade-in-up"
                                      style={{
                                          animationDelay: `${
                                              (visibleActionable.length + i) * 60
                                          }ms`,
                                      }}
                                  >
                                      <BoostEarnedCard
                                          record={record}
                                          categoryType={category}
                                          defaultImg={
                                              categoryMetadata[category as CredentialCategoryEnum]
                                                  ?.defaultImageSrc
                                          }
                                          boostPageViewMode={BoostPageViewMode.List}
                                          useWrapper={false}
                                          hideOptionsMenu
                                          relativeDate
                                          compact
                                      />
                                  </div>
                              );
                          })}
                    <button
                        type="button"
                        onClick={() => history.push('/wallet')}
                        className="self-start text-xs font-medium text-grayscale-600 hover:text-grayscale-900 transition-colors mt-1"
                    >
                        View all in passport →
                    </button>
                </div>
            )}

            {showPopulatedMeanwhile && <MeanwhileTips tips={emptyTips} />}
        </section>
    );
};

export default ActivityCard;

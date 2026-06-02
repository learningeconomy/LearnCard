import React, { useEffect, useState } from 'react';
import {
    CheckCircle2,
    AlertTriangle,
    Clock,
    Mail,
    Send,
    User,
    Calendar,
    Link as LinkIcon,
    Ban,
    Trash2,
    RotateCcw,
    Loader2,
    Hash,
    Zap,
    Activity,
    Award,
    FileText,
} from 'lucide-react';

import {
    useWallet,
    useRevokeBoostRecipient,
    useSuspendBoostRecipient,
    useUnsuspendBoostRecipient,
    useConfirmation,
    useToast,
    ToastTypeEnum,
    useGetBoostRecipients,
    useGetBoostPermissions,
} from 'learn-card-base';

import { useQueryClient } from '@tanstack/react-query';

import { useAnalytics, AnalyticsEvents } from '@analytics';

import {
    CredentialActivityRecord,
    getEventTypeLabel,
    getActivityName,
    getActivityError,
    formatActivitySource,
    getRecipientDisplayName,
    isInboxActivity,
    isAutoDelivery,
    getActivityLabel,
} from 'src/pages/appStoreDeveloper/dashboards/hooks/useIntegrationActivity';

export interface IssuanceDetailModalProps {
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

export const IssuanceDetailModal: React.FC<IssuanceDetailModalProps> = ({ item }) => {
    const { initWallet } = useWallet();
    const [activityChain, setActivityChain] = useState<CredentialActivityRecord[]>([]);
    const [isLoadingChain, setIsLoadingChain] = useState(true);
    const [chainError, setChainError] = useState<string | null>(null);
    const [showAllEvents, setShowAllEvents] = useState(false);

    const revokeRecipient = useRevokeBoostRecipient();
    const suspendRecipient = useSuspendBoostRecipient();
    const unsuspendRecipient = useUnsuspendBoostRecipient();
    const confirm = useConfirmation();
    const { presentToast } = useToast();
    const { track } = useAnalytics();
    const queryClient = useQueryClient();

    // Lookup recipient status for this boost+recipient combo
    const hasBoostAndRecipient = !!(item.boostUri && item.recipientProfile?.profileId);
    const { data: boostRecipients } = useGetBoostRecipients(
        hasBoostAndRecipient ? item.boostUri! : null,
        hasBoostAndRecipient,
        true
    );
    const recipientStatus = hasBoostAndRecipient
        ? (boostRecipients?.find(r => r.to?.profileId === item.recipientProfile?.profileId) as any)
              ?.status || 'active'
        : undefined;

    // Only fetch permissions when we have a boost to act on
    const { data: boostPermissions } = useGetBoostPermissions(
        hasBoostAndRecipient ? item.boostUri! : undefined
    );

    // Whether we can show credential management actions (gated on revoke permission)
    const canManage =
        hasBoostAndRecipient &&
        !!boostPermissions?.canRevoke &&
        recipientStatus !== undefined &&
        recipientStatus !== 'revoked';

    const handleCredentialAction = async (action: 'revoke' | 'suspend' | 'unsuspend') => {
        if (!item.boostUri || !item.recipientProfile?.profileId) return;
        const recipientName = item.recipientProfile.displayName || item.recipientProfile.profileId;
        const actionLabels = {
            revoke: { verb: 'revoke', noun: 'revoked' },
            suspend: { verb: 'suspend', noun: 'suspended' },
            unsuspend: { verb: 'reactivate', noun: 'reactivated' },
        };
        const { verb, noun } = actionLabels[action];

        await confirm({
            text: `Are you sure you want to ${verb} the credential for ${recipientName}?`,
            onConfirm: async () => {
                try {
                    const mutation =
                        action === 'revoke'
                            ? revokeRecipient
                            : action === 'suspend'
                              ? suspendRecipient
                              : unsuspendRecipient;
                    await mutation.mutateAsync({
                        boostUri: item.boostUri!,
                        recipientProfileId: item.recipientProfile!.profileId,
                    });
                    // Fire analytics event
                    const eventMap = {
                        revoke: AnalyticsEvents.CREDENTIAL_REVOKED,
                        suspend: AnalyticsEvents.CREDENTIAL_SUSPENDED,
                        unsuspend: AnalyticsEvents.CREDENTIAL_UNSUSPENDED,
                    };
                    track(eventMap[action], { boostUri: item.boostUri!, surface: 'issuer-dashboard' });
                    // Invalidate activity queries so the view refreshes
                    queryClient.invalidateQueries({ queryKey: ['getMyActivities'] });
                    queryClient.invalidateQueries({ queryKey: ['getActivityChain'] });
                    queryClient.invalidateQueries({ queryKey: ['getActivityStats'] });
                    presentToast(
                        `${recipientName}'s credential has been ${noun}.`,
                        { type: ToastTypeEnum.Success }
                    );
                } catch (error) {
                    presentToast(
                        `Failed to ${verb} credential for ${recipientName}. Please try again.`,
                        { type: ToastTypeEnum.Error }
                    );
                }
            },
            cancelButtonClassName:
                'cancel-btn text-grayscale-900 bg-grayscale-200 py-2 rounded-[40px] font-bold px-2 w-[100px]',
            confirmButtonClassName:
                'confirm-btn bg-grayscale-900 text-white py-2 rounded-[40px] font-bold px-2 w-[100px]',
        });
    };

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

                                {(recipientStatus === 'revoked' ||
                                    recipientStatus === 'suspended') && (
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            recipientStatus === 'revoked'
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        {recipientStatus === 'revoked' ? 'Revoked' : 'Suspended'}
                                    </span>
                                )}
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
                {canManage && (
                    <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
                        {recipientStatus === 'active' && (
                            <>
                                <button
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                                    onClick={() => handleCredentialAction('suspend')}
                                    disabled={suspendRecipient.isPending}
                                >
                                    {suspendRecipient.isPending ? (
                                        <span className="w-3 h-3 border border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                                    ) : (
                                        <Ban className="w-3 h-3" />
                                    )}
                                    Suspend
                                </button>
                                <button
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                    onClick={() => handleCredentialAction('revoke')}
                                    disabled={revokeRecipient.isPending}
                                >
                                    {revokeRecipient.isPending ? (
                                        <span className="w-3 h-3 border border-red-300 border-t-red-600 rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3 h-3" />
                                    )}
                                    Revoke
                                </button>
                            </>
                        )}
                        {recipientStatus === 'suspended' && (
                            <>
                                <button
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                    onClick={() => handleCredentialAction('unsuspend')}
                                    disabled={unsuspendRecipient.isPending}
                                >
                                    {unsuspendRecipient.isPending ? (
                                        <span className="w-3 h-3 border border-emerald-300 border-t-emerald-600 rounded-full animate-spin" />
                                    ) : (
                                        <RotateCcw className="w-3 h-3" />
                                    )}
                                    Unsuspend
                                </button>
                                <button
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                    onClick={() => handleCredentialAction('revoke')}
                                    disabled={revokeRecipient.isPending}
                                >
                                    {revokeRecipient.isPending ? (
                                        <span className="w-3 h-3 border border-red-300 border-t-red-600 rounded-full animate-spin" />
                                    ) : (
                                        <Trash2 className="w-3 h-3" />
                                    )}
                                    Revoke
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

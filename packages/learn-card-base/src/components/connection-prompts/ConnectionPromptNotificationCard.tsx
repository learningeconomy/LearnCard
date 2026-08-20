import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import type {
    LCNConnectionPromptActionResult,
    LCNConnectionPromptActionStatus,
    LCNConnectionPromptMetadata,
    LCNPublicProfile,
} from '@learncard/types';
import { alertCircleOutline } from 'ionicons/icons';

import { getLogger } from '../../logging/logger';
import {
    useConnectionPromptStatus,
    useConnectWithConnectionPromptMutation,
    useSkipConnectionPromptMutation,
} from '../../react-query/connectionPrompts';
import { useUpdateNotification } from '../../react-query/mutations/notifications';
import { UserProfilePicture } from '../profilePicture/ProfilePicture';
import type { ConnectionPromptCopy } from './ConnectionPromptModal';

const log = getLogger('connection-prompt-notification-card');

export type ConnectionPromptNotificationCopy = ConnectionPromptCopy & {
    connected: string;
    skipped: string;
    claimedType: string;
};

export type ConnectionPromptNotificationCardProps = {
    notificationId: string;
    promptMetadata: LCNConnectionPromptMetadata;
    counterpart: Partial<LCNPublicProfile>;
    title: string;
    issueDate?: string;
    copy: ConnectionPromptNotificationCopy;
};

type PendingAction = 'connect' | 'skip' | null;

const notificationActionStatusForPrompt = (
    status: LCNConnectionPromptActionStatus
): 'COMPLETED' | 'REJECTED' | null => {
    if (status === 'CONNECTED') return 'COMPLETED';
    if (status === 'SKIPPED' || status === 'STALE') return 'REJECTED';

    return null;
};

export const ConnectionPromptNotificationCard: React.FC<ConnectionPromptNotificationCardProps> = ({
    notificationId,
    promptMetadata,
    counterpart,
    title,
    issueDate,
    copy,
}) => {
    const {
        data: serverStatus,
        isLoading,
        isError,
    } = useConnectionPromptStatus(promptMetadata.promptId);
    const connectPrompt = useConnectWithConnectionPromptMutation();
    const skipPrompt = useSkipConnectionPromptMutation();
    const updateNotification = useUpdateNotification();
    const [resolvedStatus, setResolvedStatus] = useState<
        LCNConnectionPromptActionStatus | undefined
    >(serverStatus?.status);
    const [pendingAction, setPendingAction] = useState<PendingAction>(null);
    const [hasActionError, setHasActionError] = useState(false);
    const actionInFlightRef = useRef(false);

    useEffect(() => {
        if (serverStatus?.status) setResolvedStatus(serverStatus.status);
    }, [serverStatus?.status]);

    const runAction = async (
        action: Exclude<PendingAction, null>,
        handler: (promptId: string) => Promise<LCNConnectionPromptActionResult>
    ): Promise<void> => {
        if (actionInFlightRef.current || resolvedStatus !== 'PENDING') return;

        actionInFlightRef.current = true;
        setPendingAction(action);
        setHasActionError(false);

        try {
            const result = await handler(promptMetadata.promptId);
            setResolvedStatus(result.status);

            const actionStatus = notificationActionStatusForPrompt(result.status);
            if (actionStatus) {
                try {
                    await updateNotification.mutateAsync({
                        notificationId,
                        payload: { actionStatus, read: true },
                    });
                } catch (error) {
                    log.warn('Failed to persist resolved connection prompt notification', error);
                }
            }
        } catch {
            setHasActionError(true);
        } finally {
            actionInFlightRef.current = false;
            setPendingAction(null);
        }
    };

    const busy = pendingAction !== null;
    const canAct = !isLoading && !isError && resolvedStatus === 'PENDING';
    const resolvedLabel =
        resolvedStatus === 'CONNECTED'
            ? copy.connected
            : resolvedStatus === 'SKIPPED' || resolvedStatus === 'STALE'
            ? copy.skipped
            : null;

    return (
        <article className="font-poppins flex justify-start items-start relative w-full max-w-[600px] rounded-[20px] border border-grayscale-200 bg-white p-4 my-3 shadow-sm">
            <div className="shrink-0 w-16 h-16">
                <UserProfilePicture
                    user={counterpart}
                    customContainerClass="flex justify-center items-center w-16 h-16 rounded-full overflow-hidden text-xl"
                    customImageClass="w-16 h-16 rounded-full object-cover"
                    customSize={128}
                />
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-start ps-4 text-start">
                <h3 className="text-sm font-semibold leading-snug text-grayscale-900">{title}</h3>
                <p className="mt-2 text-xs font-medium text-grayscale-700">
                    {copy.claimedType}
                    {issueDate && (
                        <span className="font-normal text-grayscale-600"> · {issueDate}</span>
                    )}
                </p>

                {(hasActionError || isError) && (
                    <div
                        role="alert"
                        className="mt-3 w-full p-3 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-start"
                    >
                        <IonIcon
                            icon={alertCircleOutline}
                            className="text-red-400 text-lg mt-0.5 shrink-0"
                        />
                        <span className="text-sm text-red-700 leading-relaxed">{copy.error}</span>
                    </div>
                )}

                {canAct && (
                    <div className="mt-4 flex w-full flex-wrap gap-3">
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void runAction('connect', connectPrompt.mutateAsync)}
                            className="py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {pendingAction === 'connect' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {copy.connecting}
                                </span>
                            ) : (
                                copy.connect
                            )}
                        </button>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => void runAction('skip', skipPrompt.mutateAsync)}
                            className="py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {pendingAction === 'skip' ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-grayscale-300 border-t-grayscale-700 rounded-full animate-spin" />
                                    {copy.skipping}
                                </span>
                            ) : (
                                copy.skipForNow
                            )}
                        </button>
                    </div>
                )}

                {resolvedLabel && (
                    <span className="mt-4 inline-flex rounded-[20px] bg-grayscale-100 px-4 py-2 text-sm font-medium text-grayscale-700">
                        {resolvedLabel}
                    </span>
                )}
            </div>
        </article>
    );
};

export default ConnectionPromptNotificationCard;

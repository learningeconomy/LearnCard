import React, { useState } from 'react';
import moment from 'moment';
import { ErrorBoundary } from '@sentry/react';
import { UserProfilePicture, useWallet, useUpdateNotification } from 'learn-card-base';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import X from 'learn-card-base/svgs/X';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';

type NotificationGuardianApprovalCardProps = {
    notification: NotificationType;
    onRead?: () => void;
};

type ActionState = 'pending' | 'approving' | 'rejecting' | 'approved' | 'rejected';

const NotificationGuardianApprovalCard: React.FC<NotificationGuardianApprovalCardProps> = ({
    notification,
    onRead,
}) => {
    const { getWallet } = useWallet();
    const { mutate: updateNotification } = useUpdateNotification();

    // Derive initial state from actionStatus
    const initialState: ActionState =
        notification?.actionStatus === 'COMPLETED'
            ? 'approved'
            : notification?.actionStatus === 'REJECTED'
            ? 'rejected'
            : 'pending';

    const [actionState, setActionState] = useState<ActionState>(initialState);

    const transactionDate = notification.sent;
    const formattedDate = moment(transactionDate).format('MMM D, YYYY h:mma');

    const inboxCredentialId = notification?.data?.inboxCredentialId as string | undefined;
    const credentialName = (notification?.data?.credentialName as string) || 'a credential';
    const childDisplayName = (notification?.data?.childDisplayName as string) || 'your student';
    const issuerDisplayName = (notification?.data?.issuerDisplayName as string) || 'an issuer';

    const handleApprove = async () => {
        if (!inboxCredentialId || actionState !== 'pending') return;
        setActionState('approving');
        try {
            const wallet = await getWallet();
            await wallet?.invoke?.approveGuardianCredentialInApp(inboxCredentialId);
            setActionState('approved');
            updateNotification({
                notificationId: notification?._id,
                payload: { actionStatus: 'COMPLETED', read: true },
            });
        } catch (err) {
            console.error('[NotificationGuardianApprovalCard] Approve failed:', err);
            setActionState('pending');
        }
    };

    const handleReject = async () => {
        if (!inboxCredentialId || actionState !== 'pending') return;
        setActionState('rejecting');
        try {
            const wallet = await getWallet();
            await wallet?.invoke?.rejectGuardianCredentialInApp(inboxCredentialId);
            setActionState('rejected');
            updateNotification({
                notificationId: notification?._id,
                payload: { actionStatus: 'REJECTED', read: true },
            });
        } catch (err) {
            console.error('[NotificationGuardianApprovalCard] Reject failed:', err);
            setActionState('pending');
        }
    };

    const handleMarkRead = async () => {
        await onRead?.();
    };

    const isProcessing = actionState === 'approving' || actionState === 'rejecting';
    const isResolved = actionState === 'approved' || actionState === 'rejected';

    return (
        <ErrorBoundary
            fallback={
                <div className="flex min-h-[120px] justify-start max-w-[600px] items-start relative w-full rounded-3xl py-[10px] px-[10px] bg-blue-50 my-[15px]">
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleMarkRead}
                className="flex gap-3 min-h-[120px] justify-start items-start max-w-[600px] relative w-full rounded-3xl py-[10px] px-[10px] bg-amber-50 my-[15px]"
            >
                <div className="notification-card-left-side px-[0px] flex cursor-pointer shrink-0">
                    <UserProfilePicture
                        user={notification.from}
                        customContainerClass="h-[60px] w-[60px] rounded-full text-white"
                        customImageClass="h-[60px] w-[60px]"
                        customSize={120}
                    />
                </div>

                <div className="text-left flex flex-col gap-[10px] items-start justify-start w-full">
                    <h4
                        className="cursor-pointer font-bold tracking-wide line-clamp-2 text-black text-[14px] pr-[20px] notification-card-title"
                        data-testid="notification-title"
                    >
                        Credential Approval Request
                    </h4>
                    <p
                        className="font-semibold p-0 leading-none tracking-wide text-[12px] text-grayscale-500"
                        data-testid="notification-type"
                    >
                        Guardian Approval{' '}
                        {transactionDate && (
                            <span className="text-grayscale-600 normal-case font-normal text-[12px]">
                                • {formattedDate}
                            </span>
                        )}
                    </p>
                    <p className="text-[13px] text-grayscale-700 leading-snug">
                        <strong>{credentialName}</strong> for <strong>{childDisplayName}</strong> from{' '}
                        {issuerDisplayName}
                    </p>

                    {!isResolved && (
                        <div className="flex items-center gap-2 mt-1 w-full">
                            <button
                                className={`flex items-center justify-center flex-1 rounded-[24px] border-2 border-solid font-semibold py-2 px-3 tracking-wide text-[13px] transition-colors ${
                                    isProcessing
                                        ? 'border-grayscale-300 text-grayscale-400 bg-grayscale-100 cursor-not-allowed'
                                        : 'border-emerald-600 text-white bg-emerald-600 hover:bg-emerald-700'
                                }`}
                                onClick={handleApprove}
                                disabled={isProcessing}
                            >
                                {actionState === 'approving' ? 'Approving...' : 'Approve'}
                            </button>
                            <button
                                className={`flex items-center justify-center flex-1 rounded-[24px] border-2 border-solid font-semibold py-2 px-3 tracking-wide text-[13px] transition-colors ${
                                    isProcessing
                                        ? 'border-grayscale-300 text-grayscale-400 bg-white cursor-not-allowed'
                                        : 'border-red-500 text-red-500 bg-white hover:bg-red-50'
                                }`}
                                onClick={handleReject}
                                disabled={isProcessing}
                            >
                                {actionState === 'rejecting' ? 'Rejecting...' : 'Reject'}
                            </button>
                        </div>
                    )}

                    {actionState === 'approved' && (
                        <div className="flex items-center gap-1 mt-1 text-emerald-600 font-semibold text-[13px]">
                            <Checkmark className="h-[18px]" />
                            Approved
                        </div>
                    )}

                    {actionState === 'rejected' && (
                        <div className="flex items-center gap-1 mt-1 text-red-500 font-semibold text-[13px]">
                            <X className="h-[14px] w-[14px]" />
                            Rejected
                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default NotificationGuardianApprovalCard;

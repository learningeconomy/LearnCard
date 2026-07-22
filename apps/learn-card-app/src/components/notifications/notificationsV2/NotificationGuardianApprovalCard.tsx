import React, { useState } from 'react';
import moment from 'moment';
import { ErrorBoundary } from '@sentry/react';
import { UserProfilePicture, useWallet, useUpdateNotification } from 'learn-card-base';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import X from 'learn-card-base/svgs/X';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';
import { notificationCardStyles } from './types';
import { getLogger } from 'learn-card-base';
import * as m from '../../../paraglide/messages.js';
const log = getLogger('notification-guardian-approval-card');

type NotificationGuardianApprovalCardProps = {
    notification: NotificationType;
    onRead?: () => void;
};

type ActionState = 'pending' | 'approving' | 'rejecting' | 'approved' | 'rejected';

const NotificationGuardianApprovalCard: React.FC<NotificationGuardianApprovalCardProps> = ({
    notification,
    onRead,
}) => {
    const { initWallet: getWallet } = useWallet();
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
            if (!wallet?.invoke?.approveGuardianCredentialInApp) {
                throw new Error('Wallet not initialized');
            }
            await wallet.invoke.approveGuardianCredentialInApp(inboxCredentialId);
            setActionState('approved');
            updateNotification({
                notificationId: notification?._id,
                payload: { actionStatus: 'COMPLETED', read: true },
            });
        } catch (err) {
            log.error('Approve failed', err);
            setActionState('pending');
        }
    };

    const handleReject = async () => {
        if (!inboxCredentialId || actionState !== 'pending') return;
        setActionState('rejecting');
        try {
            const wallet = await getWallet();
            if (!wallet?.invoke?.rejectGuardianCredentialInApp) {
                throw new Error('Wallet not initialized');
            }
            await wallet.invoke.rejectGuardianCredentialInApp(inboxCredentialId);
            setActionState('rejected');
            updateNotification({
                notificationId: notification?._id,
                payload: { actionStatus: 'REJECTED', read: true },
            });
        } catch (err) {
            log.error('Reject failed', err);
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
                <div className={notificationCardStyles.fallbackShell}>
                    Unable to load notification
                </div>
            }
        >
            <div
                onClick={handleMarkRead}
                className={`${notificationCardStyles.shell} min-h-[120px]`}
            >
                <div className="notification-card-left-side px-[0px] flex cursor-pointer shrink-0">
                    <div className="overflow-hidden cursor-pointer w-[90px] h-[90px] flex items-start notification-card-thumbnail">
                        <UserProfilePicture
                            user={notification.from}
                            customContainerClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden text-white font-medium text-4xl p-[6px]"
                            customImageClass="flex justify-center items-center w-full h-full rounded-full overflow-hidden object-cover"
                            customSize={90}
                        />
                    </div>
                </div>

                <div className="flex flex-col justify-center items-start relative w-full">
                    <div className="text-left ml-3 flex flex-col items-start justify-start w-full">
                        <h4
                            className={`cursor-pointer ${notificationCardStyles.title}`}
                            data-testid="notification-title"
                        >
                            {credentialName} for {childDisplayName} from {issuerDisplayName}
                        </h4>
                        <p
                            className={`${notificationCardStyles.meta} mt-[10px] text-indigo-600`}
                            data-testid="notification-type"
                        >
                            Guardian Approval{' '}
                            {transactionDate && (
                                <span className={notificationCardStyles.date}>
                                    • {formattedDate}
                                </span>
                            )}
                        </p>

                        {!isResolved && (
                            <div className="relative flex items-center justify-between mt-3 w-full">
                                <button
                                    className={`${notificationCardStyles.primaryButton} mr-[10px] ${
                                        isProcessing
                                            ? 'border-grayscale-300 text-grayscale-400 bg-grayscale-100 cursor-not-allowed'
                                            : 'border-emerald-600 text-white bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                                    onClick={handleApprove}
                                    disabled={isProcessing}
                                >
                                    {actionState === 'approving'
                                        ? m['alerts.approving']()
                                        : m['alerts.approve']()}
                                </button>
                                <button
                                    className={`${notificationCardStyles.primaryButton} ${
                                        isProcessing
                                            ? 'border-grayscale-300 text-grayscale-400 bg-white cursor-not-allowed'
                                            : 'border-grayscale-300 text-grayscale-600 bg-white hover:bg-grayscale-50'
                                    }`}
                                    onClick={handleReject}
                                    disabled={isProcessing}
                                >
                                    {actionState === 'rejecting'
                                        ? m['alerts.rejecting']()
                                        : m['alerts.reject']()}
                                </button>
                            </div>
                        )}

                        {actionState === 'approved' && (
                            <div className="relative flex items-center mt-3 w-full">
                                <div
                                    className={`${notificationCardStyles.primaryButton} border-emerald-600 text-emerald-600 bg-white`}
                                >
                                    {m['alerts.approved']()}{' '}
                                    <Checkmark className="h-[24px] p-0 m-0" />
                                </div>
                            </div>
                        )}

                        {actionState === 'rejected' && (
                            <div className="relative flex items-center mt-3 w-full">
                                <div
                                    className={`${notificationCardStyles.primaryButton} border-grayscale-300 text-grayscale-500 bg-white`}
                                >
                                    {m['alerts.rejected']()}{' '}
                                    <X className="h-[14px] w-[14px] ml-1" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ErrorBoundary>
    );
};

export default NotificationGuardianApprovalCard;

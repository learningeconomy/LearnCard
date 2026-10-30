import React, { useState } from 'react';
import type { NotificationType } from '@learncard/lca-api-plugin';
import { useHistory } from 'react-router-dom';
import type { ConsentFlowContractChangeKind, ConsentFlowContractDiff } from '@learncard/types';
import { buildContractUpdatePreview } from '@learncard/helpers';
import { getLogger, useModal, useUpdateNotification } from 'learn-card-base';
import { notificationCardStyles } from './types';
import * as m from '../../../paraglide/messages.js';
import { mDynamic } from '../../../i18n/mDynamic';
import { useLocale } from '../../../i18n';
const log = getLogger('notification-contract-update-card');
type Props = { notification: NotificationType; handleArchive?: () => void | Promise<void> };

const NotificationContractUpdateCard: React.FC<Props> = ({ notification, handleArchive }) => {
    const history = useHistory();
    const { closeAllModals } = useModal();
    const locale = useLocale();
    const { mutateAsync: updateNotification } = useUpdateNotification();
    const [dismissing, setDismissing] = useState(false);
    const [archiveError, setArchiveError] = useState(false);
    const data = notification.data as
        | {
              contractUri?: string;
              contractName?: string;
              reviewUrl?: string;
              kind?: ConsentFlowContractChangeKind;
              preview?: { headline?: string; rows?: { change: string; label: string }[] };
              diff?: ConsentFlowContractDiff;
          }
        | undefined;
    const sender =
        typeof notification.from === 'object' && notification.from
            ? notification.from.displayName
            : undefined;
    const appName = data?.contractName ?? sender ?? m['dataSharing.unknownApp']();
    const quietChange = data?.kind === 'relaxed' || data?.kind === 'expanded_optional';
    const removed =
        data?.preview?.rows?.find(row => row.change === 'removed')?.label ??
        data?.diff?.removed?.[0]?.key?.replace(/[_-]+/g, ' ').toLowerCase();
    const generatedPreview =
        data?.kind && data.diff
            ? buildContractUpdatePreview({
                  name: appName,
                  kind: data.kind,
                  diff: data.diff,
                  translate: (key, values) => mDynamic(key, values),
              })
            : undefined;
    const message =
        generatedPreview?.headline ??
        (data?.kind === 'relaxed'
            ? removed
                ? m['consentUpdate.notification.relaxedWithItem']({ appName, removed })
                : m['consentUpdate.notification.changed']({ appName })
            : data?.kind === 'requires_consent'
              ? m['consentUpdate.notification.review']({ appName })
              : m['consentUpdate.notification.option']({ appName }));
    const date = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(
        new Date(notification.sent)
    );
    const read = quietChange || notification.read;

    const openReview = async () => {
        if (!data?.contractUri) return;
        closeAllModals();
        history.push(`/consent-flow/review?uri=${encodeURIComponent(data.contractUri)}`);
        if (notification._id) {
            try {
                await updateNotification({
                    notificationId: notification._id,
                    payload: { read: true },
                });
            } catch (error) {
                log.error('Unable to mark contract update notification as read', error);
            }
        }
    };

    return (
        <article
            className={`${notificationCardStyles.shell} flex-col ${quietChange ? 'opacity-75' : ''}`}
        >
            <div className="flex w-full min-w-0 items-start gap-3">
                {!read && (
                    <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                )}
                <button
                    type="button"
                    onClick={openReview}
                    className="min-w-0 flex-1 text-start"
                    aria-label={m['consentUpdate.review']()}
                >
                    <p className="break-words text-sm text-grayscale-700">
                        {date} · {message}
                    </p>
                </button>
                {handleArchive && (
                    <button
                        type="button"
                        disabled={dismissing}
                        onClick={async event => {
                            event.stopPropagation();
                            setDismissing(true);
                            setArchiveError(false);
                            try {
                                await handleArchive();
                            } catch (error) {
                                log.error('Unable to dismiss contract update notification', error);
                                setArchiveError(true);
                            } finally {
                                setDismissing(false);
                            }
                        }}
                        aria-label={m['consentUpdate.dismiss']()}
                        className="flex shrink-0 items-center gap-2 rounded-[20px] border border-grayscale-200 bg-white px-3 py-2 text-sm font-medium hover:bg-grayscale-10 disabled:opacity-40"
                    >
                        {dismissing && (
                            <span
                                aria-hidden
                                className="h-3 w-3 animate-spin rounded-full border-2 border-grayscale-300 border-t-grayscale-900"
                            />
                        )}
                        {dismissing
                            ? m['consentUpdate.dismissing']()
                            : m['consentUpdate.dismiss']()}
                    </button>
                )}
            </div>
            {archiveError && (
                <p role="alert" className="mt-2 text-xs text-red-700">
                    {m['consentUpdate.dismissError']()}
                </p>
            )}
        </article>
    );
};

export default NotificationContractUpdateCard;

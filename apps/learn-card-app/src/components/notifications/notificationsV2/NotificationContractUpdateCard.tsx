import React from 'react';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import type { NotificationType } from '@learncard/lca-api-plugin';
import { useUpdateNotification } from 'learn-card-base';
import { notificationCardStyles } from './types';

type Props = { notification: NotificationType; handleArchive?: () => void };

const NotificationContractUpdateCard: React.FC<Props> = ({ notification, handleArchive }) => {
    const history = useHistory();
    const { mutateAsync: updateNotification } = useUpdateNotification();
    const data = notification.data as
        | {
              contractUri?: string;
              contractName?: string;
              reviewUrl?: string;
              kind?: string;
              preview?: { headline?: string; rows?: { change: string; label: string }[] };
              diff?: { removed?: { key?: string }[] };
          }
        | undefined;
    const sender =
        typeof notification.from === 'object' && notification.from
            ? notification.from.displayName
            : undefined;
    const appName = data?.contractName ?? sender ?? 'The app';
    const quietChange = data?.kind === 'relaxed' || data?.kind === 'expanded_optional';
    const removed =
        data?.preview?.rows?.find(row => row.change === 'removed')?.label ??
        data?.diff?.removed?.[0]?.key?.replace(/[_-]+/g, ' ').toLowerCase();
    const message =
        data?.kind === 'relaxed'
            ? `${appName} stopped asking for ${removed ? `your ${removed}` : 'some information'}`
            : (data?.preview?.headline ??
              (data?.kind === 'requires_consent'
                  ? `${appName} needs your review`
                  : `${appName} has a new option`));
    const date = moment(notification.sent).format('MMM D');
    const read = quietChange || notification.read;

    const openReview = async () => {
        if (!data?.contractUri) return;
        if (notification._id) {
            await updateNotification({ notificationId: notification._id, payload: { read: true } });
        }
        history.push(`/consent-flow/review?uri=${encodeURIComponent(data.contractUri)}`);
    };

    return (
        <article className={`${notificationCardStyles.shell} ${quietChange ? 'opacity-75' : ''}`}>
            {!read && (
                <span aria-hidden className="notification-count-mobile unread-indicator-dot" />
            )}
            <button
                type="button"
                onClick={openReview}
                className="w-full text-start"
                aria-label="Review this update"
            >
                <p className="text-sm text-grayscale-700">
                    {date} · {message}
                </p>
            </button>
            {handleArchive && (
                <button
                    type="button"
                    onClick={handleArchive}
                    aria-label="Dismiss notification"
                    className="sr-only"
                >
                    Dismiss
                </button>
            )}
        </article>
    );
};

export default NotificationContractUpdateCard;

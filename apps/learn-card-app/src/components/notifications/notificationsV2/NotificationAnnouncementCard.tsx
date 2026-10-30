import React, { useId, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import {
    archiveOutline,
    arrowUndoOutline,
    checkmarkOutline,
    megaphoneOutline,
} from 'ionicons/icons';
import { ToastTypeEnum, useToast, useUpdateNotification } from 'learn-card-base';
import type { NotificationType } from '@learncard/lca-api-plugin';
import * as m from '../../../paraglide/messages.js';
import { getLocale } from '../../../paraglide/runtime.js';
import { notificationCardStyles } from './types';

type Props = { notification: NotificationType; className?: string };
type Action = 'read' | 'archive' | 'restore';

/** Render announcement copy as sent; campaign senders need not have a public profile. */
export const NotificationAnnouncementCard: React.FC<Props> = ({ notification, className }) => {
    const titleId = useId();
    const { mutateAsync: updateNotification } = useUpdateNotification();
    const { presentToast } = useToast();
    const inFlight = useRef(false);
    const [action, setAction] = useState<Action | null>(null);
    const [readId, setReadId] = useState<string>();
    const isRead = notification.read || Boolean(notification._id && readId === notification._id);
    const date = notification.sent ? new Date(notification.sent) : undefined;
    const validDate = date && Number.isFinite(date.getTime()) ? date : undefined;

    const update = async (nextAction: Action): Promise<void> => {
        if (!notification._id || inFlight.current) return;
        inFlight.current = true;
        setAction(nextAction);
        try {
            const updated = await updateNotification({
                notificationId: notification._id,
                payload: {
                    read: true,
                    ...(nextAction !== 'read' ? { archived: nextAction === 'archive' } : {}),
                },
            });
            if (!updated) throw new Error('Notification update was not acknowledged');
            setReadId(notification._id);
        } catch {
            // Archiving optimistically removes the card, so feedback belongs to the toast host.
            presentToast(m['alerts.updateFailed'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        } finally {
            inFlight.current = false;
            setAction(null);
        }
    };

    const archiveAction = notification.archived ? 'restore' : 'archive';
    const buttonStyle =
        'inline-flex items-center justify-center gap-2 rounded-[20px] px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed';
    const spinner = (
        <span
            aria-hidden="true"
            className="h-4 w-4 rounded-full border-2 border-grayscale-300 border-t-grayscale-900 animate-spin"
        />
    );

    return (
        <article
            aria-labelledby={titleId}
            className={`${notificationCardStyles.shell} gap-3 font-poppins ${className ?? ''}`}
            data-testid="notification-announcement"
        >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <IonIcon icon={megaphoneOutline} aria-hidden="true" className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1 text-start">
                <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <span className="font-medium text-grayscale-600">
                        {m['alerts.announcement']()}
                    </span>
                    {!isRead && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                            <span
                                aria-hidden="true"
                                className="h-1.5 w-1.5 rounded-full bg-emerald-600"
                            />
                            {m['alerts.newAlert']()}
                        </span>
                    )}
                </div>
                <h3
                    id={titleId}
                    className="text-base font-semibold leading-snug text-grayscale-900 [overflow-wrap:anywhere]"
                >
                    {notification.message?.title?.trim() || m['alerts.announcement']()}
                </h3>
                {notification.message?.body && (
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-grayscale-600 [overflow-wrap:anywhere]">
                        {notification.message.body}
                    </p>
                )}
                {validDate && (
                    <time
                        dateTime={validDate.toISOString()}
                        className="mt-3 block text-xs text-grayscale-500"
                    >
                        {new Intl.DateTimeFormat(getLocale(), {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                        }).format(validDate)}
                    </time>
                )}
                {notification._id && (
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {!isRead || action === 'read' ? (
                            <button
                                type="button"
                                disabled={Boolean(action)}
                                aria-busy={action === 'read'}
                                onClick={() => void update('read')}
                                className={`${buttonStyle} border border-grayscale-300 bg-white text-grayscale-700 hover:bg-grayscale-100`}
                            >
                                {action === 'read' ? (
                                    spinner
                                ) : (
                                    <IonIcon
                                        icon={checkmarkOutline}
                                        aria-hidden="true"
                                        className="h-4 w-4"
                                    />
                                )}
                                {action === 'read'
                                    ? m['alerts.markingRead']()
                                    : m['alerts.markRead']()}
                            </button>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 py-2 pe-2 text-xs text-grayscale-500">
                                <IonIcon
                                    icon={checkmarkOutline}
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                />
                                {m['alerts.read']()}
                            </span>
                        )}
                        <button
                            type="button"
                            disabled={Boolean(action)}
                            aria-busy={action === archiveAction}
                            onClick={() => void update(archiveAction)}
                            className={`${buttonStyle} text-grayscale-700 hover:bg-grayscale-100`}
                        >
                            {action === archiveAction ? (
                                spinner
                            ) : (
                                <IonIcon
                                    icon={notification.archived ? arrowUndoOutline : archiveOutline}
                                    aria-hidden="true"
                                    className="h-4 w-4"
                                />
                            )}
                            {action === archiveAction
                                ? notification.archived
                                    ? m['alerts.restoring']()
                                    : m['alerts.archiving']()
                                : notification.archived
                                  ? m['alerts.restore']()
                                  : m['alerts.archive']()}
                        </button>
                    </div>
                )}
            </div>
        </article>
    );
};

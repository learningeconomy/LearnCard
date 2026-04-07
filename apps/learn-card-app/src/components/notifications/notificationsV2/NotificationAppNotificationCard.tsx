import React, { useState, useRef } from 'react';
import moment from 'moment';
import { useHistory } from 'react-router-dom';
import { ErrorBoundary } from '@sentry/react';
import { Bell, ExternalLink } from 'lucide-react';

import useOnScreen from 'learn-card-base/hooks/useOnScreen';
import { NotificationType } from 'packages/plugins/lca-api-plugin/src/types';

import useAppStore from '../../../pages/launchPad/useAppStore';

type NotificationAppNotificationCardProps = {
    notification: NotificationType;
    onRead?: () => void;
    onArchive?: () => void;
    className?: string;
};

/**
 * Notification card for APP_NOTIFICATION type.
 *
 * Displays the app name, title/body from the notification, and a button to open the app.
 * If actionPath is provided in metadata, it will be passed as a query param so the app
 * can deep link to the right page.
 */
const NotificationAppNotificationCard: React.FC<NotificationAppNotificationCardProps> = ({
    notification,
    onRead,
    onArchive,
    className,
}) => {
    const history = useHistory();
    const [isRead, setIsRead] = useState<boolean>(notification?.read ?? false);
    const [iconFailed, setIconFailed] = useState(false);

    const ref = useRef<HTMLDivElement>(null);
    useOnScreen<HTMLDivElement>(ref as React.RefObject<HTMLDivElement>, '-130px');

    const metadata = notification.data?.metadata as Record<string, unknown> | undefined;
    const listingId = metadata?.listingId as string | undefined;
    const listingSlug = metadata?.listingSlug as string | undefined;
    const actionPath = metadata?.actionPath as string | undefined;
    const category = metadata?.category as string | undefined;
    const priority = metadata?.priority as string | undefined;

    const appName = notification.from?.displayName ?? listingSlug ?? 'App';
    const title = notification.message?.title;
    const body = notification.message?.body;

    const formattedDate = notification.sent
        ? moment(notification.sent).format('MMM D, YYYY h:mma')
        : undefined;

    const { usePublicListing } = useAppStore();
    const { data: listing } = usePublicListing(listingId ?? '');

    const appIcon = listing?.icon_url;
    const launchConfig = listing?.launch_config_json
        ? (() => {
              try {
                  return JSON.parse(listing.launch_config_json);
              } catch {
                  return {};
              }
          })()
        : {};

    const handleMarkRead = () => {
        if (!isRead) {
            setIsRead(true);
            onRead?.();
        }
    };

    const handleOpenApp = () => {
        handleMarkRead();

        if (!listing) {
            // Fallback: navigate to the app listing page
            if (listingId) {
                history.push(`/app/${listingId}`);
            }
            return;
        }

        // If the app is an embedded iframe, launch it in full-screen mode.
        // When actionPath is provided, append it to the embed URL for deep linking.
        if (listing.launch_type === 'EMBEDDED_IFRAME' && launchConfig?.url) {
            let embedUrl = launchConfig.url as string;

            if (actionPath) {
                try {
                    const url = new URL(embedUrl);
                    url.pathname = url.pathname.replace(/\/$/, '') + actionPath;
                    embedUrl = url.toString();
                } catch {
                    embedUrl = embedUrl.replace(/\/$/, '') + actionPath;
                }
            }

            const appSlug = (listing as Record<string, unknown>).slug as string | undefined;

            history.push(`/apps/${appSlug || listingId}`, {
                embedUrl,
                appName: listing.display_name,
                launchConfig,
                isInstalled: true, // User received a notification, so they have the app
            });

            return;
        }

        // Not embeddable — open the listing page
        history.push(`/app/${listingId}`);
    };

    const isHighPriority = priority === 'high';

    const bgColor = isHighPriority ? 'bg-orange-50' : 'bg-sky-50';
    const showFallbackIcon = !appIcon || iconFailed;
    const iconBgColor = showFallbackIcon ? (isHighPriority ? 'bg-orange-100' : 'bg-sky-100') : '';
    const iconTextColor = isHighPriority ? 'text-orange-600' : 'text-sky-600';

    return (
        <ErrorBoundary
            fallback={
                <div className="flex min-h-[100px] justify-start max-w-[600px] items-start relative w-full rounded-3xl py-[10px] px-[10px] bg-gray-50 my-[15px]">
                    Unable to load notification
                </div>
            }
        >
            <div
                ref={ref}
                onClick={handleMarkRead}
                className={`flex gap-3 min-h-[100px] justify-start items-center max-w-[600px] relative w-full rounded-3xl py-[15px] px-[15px] ${bgColor} my-[15px] cursor-pointer hover:opacity-90 transition-opacity ${className ?? ''}`}
            >
                {!isRead && (
                    <div className="notification-count-mobile unread-indicator-dot" />
                )}

                {/* App icon or fallback */}
                <div
                    className={`flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center ${iconBgColor} ${showFallbackIcon ? iconTextColor : ''}`}
                >
                    {appIcon && !iconFailed ? (
                        <img
                            src={appIcon}
                            alt={appName}
                            className="w-full h-full object-cover"
                            onError={() => setIconFailed(true)}
                        />
                    ) : (
                        <Bell className="w-7 h-7" />
                    )}
                </div>

                {/* Content */}
                <div className="text-left flex flex-col gap-[4px] items-start justify-start flex-1 min-w-0">
                    {title && (
                        <h4
                            className="font-bold tracking-wide line-clamp-2 text-gray-900 text-[14px] pr-[20px]"
                            data-testid="notification-title"
                        >
                            {title}
                        </h4>
                    )}

                    {body && (
                        <p className="text-gray-600 text-[13px] line-clamp-2">
                            {body}
                        </p>
                    )}

                    <div className="flex items-center gap-2 mt-1">
                        <p className="font-semibold p-0 leading-none tracking-wide line-clamp-1 text-[12px] text-gray-500">
                            {appName}

                            {category && (
                                <span className="ml-1 text-gray-400 font-normal">
                                    &middot; {category}
                                </span>
                            )}

                            {formattedDate && (
                                <span className="text-gray-400 normal-case font-normal text-[12px] ml-1">
                                    &middot; {formattedDate}
                                </span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Open app button */}
                {listingId && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleOpenApp();
                        }}
                        className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-gray-700 font-semibold text-[13px] border border-gray-200 transition-colors"
                    >
                        Open
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </ErrorBoundary>
    );
};

export default NotificationAppNotificationCard;

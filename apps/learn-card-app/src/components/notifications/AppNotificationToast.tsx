import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

export interface AppNotificationToastData {
    title?: string;
    body?: string;
    appName?: string;
    appIcon?: string;
    actionPath?: string;
    category?: string;
    priority?: string;
}

interface AppNotificationToastProps {
    notification: AppNotificationToastData | null;
    onDismiss: () => void;
    onTapAction?: (actionPath: string) => void;
    duration?: number;
}

/**
 * Beautiful toast overlay that slides in from the top when an embedded app
 * sends a notification via the Partner Connect SDK. Provides immediate
 * visual feedback to the user while the notification is also queued
 * to their inbox.
 */
const AppNotificationToast: React.FC<AppNotificationToastProps> = ({
    notification,
    onDismiss,
    onTapAction,
    duration = 5000,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [iconFailed, setIconFailed] = useState(false);

    useEffect(() => {
        if (notification) {
            setIsVisible(true);
            setIsLeaving(false);
            setIconFailed(false);

            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleDismiss = () => {
        setIsLeaving(true);

        setTimeout(() => {
            setIsVisible(false);
            setIsLeaving(false);
            onDismiss();
        }, 300);
    };

    if (!notification || !isVisible) return null;

    const isHighPriority = notification.priority === 'high';
    const isTappable = !!notification.actionPath && !!onTapAction;

    const handleTap = () => {
        if (isTappable) {
            onTapAction(notification.actionPath!);
            handleDismiss();
        }
    };

    const bgGradient = isHighPriority
        ? 'from-orange-500 to-amber-500'
        : 'from-indigo-500 to-blue-500';

    const ringColor = isHighPriority ? 'ring-orange-200' : 'ring-indigo-200';

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-[99999] flex justify-center pointer-events-none px-4 pt-3 transition-all duration-300 ease-out ${
                isLeaving ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
            }`}
            style={{ animation: isLeaving ? undefined : 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
        >
            <div
                onClick={handleTap}
                className={`pointer-events-auto max-w-[420px] w-full rounded-2xl bg-gradient-to-r ${bgGradient} p-[1px] shadow-2xl ring-1 ${ringColor} ${isTappable ? 'cursor-pointer' : ''}`}
            >
                <div className="flex items-start gap-3 rounded-2xl bg-white/95 backdrop-blur-xl px-4 py-3">
                    {/* App icon or bell */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br ${bgGradient} shadow-sm`}>
                        {notification.appIcon && !iconFailed ? (
                            <img
                                src={notification.appIcon}
                                alt={notification.appName ?? 'App'}
                                className="w-full h-full object-cover"
                                onError={() => setIconFailed(true)}
                            />
                        ) : (
                            <Bell className="w-5 h-5 text-white" />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-1.5">
                            {notification.appName && (
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                    {notification.appName}
                                </span>
                            )}

                            {notification.category && (
                                <span className="text-[10px] text-gray-300 font-normal">
                                    &middot; {notification.category}
                                </span>
                            )}
                        </div>

                        {notification.title && (
                            <p className="text-[14px] font-bold text-gray-900 leading-snug line-clamp-1 mt-0.5">
                                {notification.title}
                            </p>
                        )}

                        {notification.body && (
                            <p className="text-[13px] text-gray-600 leading-snug line-clamp-2 mt-0.5">
                                {notification.body}
                            </p>
                        )}
                    </div>

                    {/* Dismiss */}
                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 mt-0.5 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-16px) scale(0.96);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </div>
    );
};

export default AppNotificationToast;

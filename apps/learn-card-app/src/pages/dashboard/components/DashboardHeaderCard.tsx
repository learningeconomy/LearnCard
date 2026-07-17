import React from 'react';
import { User } from 'lucide-react';

import { getTimeOfDayGreeting } from '../helpers/greeting';

type DashboardHeaderCardProps = {
    brandName: string;
    displayName: string;
    profileImage: string;
    heroImage?: string;
    profileRole?: string;
    shortBio?: string;
    professionalTitle?: string;
    onAvatarClick?: () => void;
    onNotificationsClick?: () => void;
    unreadCount?: number;
    topRightAction?: React.ReactNode;
    roleSwitcher?: React.ReactNode;
};

const getInitials = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) return '?';
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const capitalize = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    return trimmed[0].toUpperCase() + trimmed.slice(1);
};

type Descriptor = { text: string; emphasis: boolean } | null;

const resolveDescriptor = (professionalTitle?: string, shortBio?: string): Descriptor => {
    const title = professionalTitle?.trim();
    if (title) return { text: title, emphasis: true };
    const bio = shortBio?.trim();
    if (bio) return { text: bio, emphasis: false };
    return null;
};

const DashboardHeaderCard: React.FC<DashboardHeaderCardProps> = ({
    brandName,
    displayName,
    profileImage,
    heroImage,
    profileRole,
    shortBio,
    professionalTitle,
    onAvatarClick,
    onNotificationsClick,
    unreadCount = 0,
    topRightAction,
    roleSwitcher,
}) => {
    const initials = getInitials(displayName);
    const greeting = getTimeOfDayGreeting();
    const hasUnread = (unreadCount ?? 0) > 0 && Boolean(onNotificationsClick);
    const descriptor = resolveDescriptor(professionalTitle, shortBio);
    const roleFallback = profileRole?.trim() ? capitalize(profileRole) : null;

    const [imageFailed, setImageFailed] = React.useState(false);

    React.useEffect(() => {
        setImageFailed(false);
    }, [profileImage]);

    const hasName = displayName.trim().length > 0;

    const initialsAvatar = (
        <div className="w-16 h-16 rounded-full bg-grayscale-100 border-2 border-white shadow-soft-bottom flex items-center justify-center text-grayscale-700 font-semibold text-lg">
            {hasName ? (
                initials
            ) : (
                <User className="w-7 h-7 text-grayscale-400" strokeWidth={1.75} />
            )}
        </div>
    );

    const avatar =
        profileImage && !imageFailed ? (
            <img
                src={profileImage}
                alt={displayName || 'Profile'}
                onError={() => setImageFailed(true)}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-soft-bottom bg-grayscale-100"
            />
        ) : (
            initialsAvatar
        );

    return (
        <section className="relative bg-white rounded-[20px] shadow-soft-bottom border border-grayscale-200 animate-fade-in-up overflow-hidden">
            {heroImage && (
                <div
                    className="absolute inset-x-0 top-0 h-[100px] pointer-events-none"
                    style={{
                        backgroundImage: `url(${heroImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/70 to-white" />
                </div>
            )}

            <div className="relative p-5">
                <div className="flex items-center gap-4">
                    <div className="shrink-0 relative">
                        {onAvatarClick ? (
                            <button
                                type="button"
                                onClick={onAvatarClick}
                                aria-label={`Open your ${brandName}`}
                                className="rounded-full active:scale-[0.97] transition-transform"
                            >
                                {avatar}
                            </button>
                        ) : (
                            avatar
                        )}

                        {hasUnread && (
                            <button
                                type="button"
                                onClick={onNotificationsClick}
                                aria-label={`You have ${
                                    unreadCount > 99 ? '99+' : unreadCount
                                } unread ${unreadCount === 1 ? 'alert' : 'alerts'}. Open alerts`}
                                className="absolute top-0 right-0 flex items-center justify-center active:scale-90 transition-transform"
                            >
                                <span className="absolute inline-flex h-3.5 w-3.5 rounded-full bg-red-500 opacity-60 animate-ping" />
                                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white shadow-soft-bottom" />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-sm text-grayscale-500 leading-tight">{greeting},</p>
                        <h1 className="text-xl font-semibold text-grayscale-900 leading-tight truncate">
                            {displayName || 'Welcome'}
                        </h1>
                        {(descriptor || roleSwitcher || roleFallback) && (
                            <div className="mt-1 flex items-center gap-2 min-w-0">
                                {descriptor && (
                                    <p
                                        className={`min-w-0 truncate text-sm leading-snug ${
                                            descriptor.emphasis
                                                ? 'font-medium text-grayscale-700'
                                                : 'text-grayscale-600'
                                        }`}
                                    >
                                        {descriptor.text}
                                    </p>
                                )}
                                {(roleSwitcher || roleFallback) && (
                                    <div className="shrink-0">
                                        {roleSwitcher ??
                                            (roleFallback && (
                                                <span className="inline-flex px-2 py-0.5 rounded-full bg-grayscale-100 text-grayscale-700 text-xs font-medium">
                                                    {roleFallback}
                                                </span>
                                            ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {topRightAction && <div className="shrink-0 self-start">{topRightAction}</div>}
                </div>
            </div>
        </section>
    );
};

export default DashboardHeaderCard;

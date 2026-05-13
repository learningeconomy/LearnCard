import React from 'react';

const PersonSilhouette: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg viewBox="0 0 31 31" fill="none" className={className} aria-hidden="true">
        <path
            d="M15.5 19.25C19.6421 19.25 23 15.8921 23 11.75C23 7.60786 19.6421 4.25 15.5 4.25C11.3579 4.25 8 7.60786 8 11.75C8 15.8921 11.3579 19.25 15.5 19.25Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M4.13159 25.8114C5.2842 23.8164 6.94153 22.1598 8.93708 21.008C10.9326 19.8563 13.1961 19.25 15.5002 19.25C17.8043 19.25 20.0678 19.8564 22.0633 21.0082C24.0588 22.1599 25.7161 23.8166 26.8687 25.8116"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Copied / Adapted from learn-card-base
export const UserProfilePicture: React.FC<{
    customContainerClass?: string;
    customImageClass?: string;
    user?: any;
    alt?: string;
    children?: React.ReactNode | null;
    avatarColor?: string;
    avatarTextClassName?: string;
    avatarIconClassName?: string;
}> = ({
    customContainerClass,
    customImageClass,
    user,
    alt,
    children,
    avatarColor,
    avatarTextClassName,
    avatarIconClassName,
}) => {
    const baseColor = avatarColor || 'bg-grayscale-700';
    const src = user?.image || user?.profileImage;
    const letterToDisplay =
        user?.displayName?.substring(0, 1) ||
        user?.profileId?.substring(0, 1) ||
        user?.name?.substring(0, 1) ||
        user?.email?.substring(0, 1) ||
        '';

    if (!src) {
        return (
            <div
                className={`rounded-full flex items-center justify-center font-poppins font-semibold uppercase select-none text-white text-2xl ${customContainerClass} ${baseColor}`}
            >
                {letterToDisplay ? (
                    <span className={avatarTextClassName || ''}>{letterToDisplay}</span>
                ) : (
                    <PersonSilhouette
                        className={avatarIconClassName || 'w-[58%] h-[58%] text-white/80'}
                    />
                )}
                {children}
            </div>
        );
    }

    return (
        <div className={`relative select-none ${customContainerClass}`}>
            <img
                className={`rounded-full ${customImageClass}`}
                alt={alt || 'user'}
                src={src}
                referrerPolicy="no-referrer"
            />
            {children}
        </div>
    );
};

export default UserProfilePicture;

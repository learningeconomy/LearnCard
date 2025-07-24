import React from 'react';

// Copied / Adapted from learn-card-base
export const UserProfilePicture: React.FC<{
    customContainerClass?: string;
    customImageClass?: string;
    user?: any;
    alt?: string;
    children?: React.ReactNode | null;
}> = ({ customContainerClass, customImageClass, user, alt, children }) => {
    const baseColor = 'bg-indigo-500';
    const src = user?.image || user?.profileImage;
    const letterToDisplay =
        user?.displayName?.substring(0, 1) ||
        user?.profileId?.substring(0, 1) ||
        user?.name?.substring(0, 1) ||
        user?.email?.substring(0, 1) ||
        '#';

    if (!src) {
        return (
            <div
                className={`rounded-full flex items-center justify-center font-bold uppercase select-none h-full w-full text-white text-2xl ${customContainerClass} ${baseColor}`}
            >
                {letterToDisplay}
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

import React from 'react';
import { resizeAndChangeQuality } from '@learncard/helpers';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { transformWeb3AuthProfileImage } from 'learn-card-base/helpers/web3AuthHelpers';
import { getRandomBaseColor } from 'learn-card-base/helpers/colorHelpers';

type ProfilePictureProps = {
    customContainerClass?: string;
    customImageClass?: string;
    customSize?: number;
    onClick?: () => void;
    overrideSrc?: boolean | undefined;
    overrideSrcURL?: string | null | undefined;
    ignoreBaseColor?: boolean;
    useInitialsOverride?: boolean; // use initials even if the user has a profile picture
    children?: React.ReactNode | null;
};

export const ProfilePicture: React.FC<ProfilePictureProps> = ({
    customContainerClass,
    customImageClass,
    customSize = 300,
    onClick = () => { },
    overrideSrc,
    overrideSrcURL,
    ignoreBaseColor = false,
    useInitialsOverride = false,
    children,
}) => {
    const currentUser = useCurrentUser();
    const baseColor = ignoreBaseColor ? '' : currentUser?.baseColor;
    let src = resizeAndChangeQuality(
        transformWeb3AuthProfileImage(currentUser?.profileImage, currentUser?.typeOfLogin),
        customSize,
        90
    );
    let letterToDisplay =
        currentUser?.name?.substring(0, 1) || currentUser?.email?.substring(0, 1) || '#';

    if (overrideSrc && overrideSrcURL) {
        src = resizeAndChangeQuality(overrideSrcURL, customSize, 90);
        return (
            <div
                aria-label="profile-picture"
                onClick={onClick}
                className={`relative ${customContainerClass}`}
            >
                <img
                    className={`rounded-full ${customImageClass}`}
                    alt="user"
                    src={src}
                    referrerPolicy="no-referrer"
                />
                {children}
            </div>
        );
    }

    if (!src || useInitialsOverride) {
        return (
            <div
                aria-label="profile-picture"
                onClick={onClick}
                className={`rounded-full flex items-center justify-center font-bold uppercase ${customContainerClass} ${baseColor}`}
            >
                {letterToDisplay}
                {children}
            </div>
        );
    }

    return (
        <div
            aria-label="profile-picture"
            onClick={onClick}
            className={`relative ${customContainerClass}`}
        >
            <img
                className={`rounded-full select-none ${customImageClass}`}
                alt="user"
                src={src}
                referrerPolicy="no-referrer"
            />
            {children}
        </div>
    );
};

export const UserProfilePicture: React.FC<{
    customContainerClass?: string;
    customImageClass?: string;
    customSize?: number;
    user?: any;
    children?: React.ReactNode | null;
}> = ({ customContainerClass, customImageClass, customSize = 300, user, children }) => {
    const baseColor = 'bg-indigo-500' ?? getRandomBaseColor();
    const src = resizeAndChangeQuality(user?.image || user?.profileImage, customSize, 90);
    const letterToDisplay =
        user?.displayName?.substring(0, 1) ||
        user?.profileId?.substring(0, 1) ||
        user?.name?.substring(0, 1) ||
        user?.email?.substring(0, 1) ||
        '#';

    if (!src) {
        return (
            <div
                className={`rounded-full flex items-center justify-center font-bold uppercase select-none ${customContainerClass} ${baseColor}`}
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
                alt="user"
                src={src}
                referrerPolicy="no-referrer"
            />
            {children}
        </div>
    );
};

export default ProfilePicture;

import React from 'react';
import { resizeAndChangeQuality } from '@learncard/helpers';
import useCurrentUser from 'learn-card-base/hooks/useGetCurrentUser';
import { transformWeb3AuthProfileImage } from 'learn-card-base/helpers/web3AuthHelpers';
import { ensureVisibleBaseColor, getRandomBaseColor } from 'learn-card-base/helpers/colorHelpers';

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
    const baseColor = ignoreBaseColor ? '' : ensureVisibleBaseColor(currentUser?.baseColor);
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
                className={`rounded-full flex items-center justify-center font-bold uppercase ${customContainerClass} ${baseColor} ${baseColor ? 'text-white' : ''}`}
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

const PersonGlyph: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.42 0-8 2.69-8 6v2h16v-2c0-3.31-3.58-6-8-6z" />
    </svg>
);

const firstChar = (s?: string) => (s && s.trim() ? s.trim()[0] : '');

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
        firstChar(user?.displayName) ||
        firstChar(user?.profileId) ||
        firstChar(user?.name) ||
        firstChar(user?.email);

    const [imageLoaded, setImageLoaded] = React.useState(false);
    const [imageFailed, setImageFailed] = React.useState(false);

    React.useEffect(() => {
        setImageLoaded(false);
        setImageFailed(false);
    }, [src]);

    const showFallbackOnly = !src || imageFailed;

    if (showFallbackOnly) {
        return (
            <div
                className={`rounded-full flex items-center justify-center font-bold uppercase select-none ${customContainerClass} ${baseColor} text-white`}
            >
                {letterToDisplay || <PersonGlyph className="w-1/2 h-1/2 opacity-90" />}
                {children}
            </div>
        );
    }

    return (
        <div className={`relative select-none ${customContainerClass}`}>
            {/* Colored placeholder behind the <img>. Visible while the image
                loads so the user never sees the browser's broken-image glyph
                or a bare white circle. The img fades in over the placeholder
                via the opacity transition once it paints. */}
            <div
                aria-hidden="true"
                className={`absolute inset-0 rounded-full flex items-center justify-center font-bold uppercase ${baseColor} text-white`}
            >
                {letterToDisplay || <PersonGlyph className="w-1/2 h-1/2 opacity-90" />}
            </div>
            <img
                className={`relative rounded-full bg-white transition-opacity duration-150 ${customImageClass} ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                alt="user"
                src={src}
                referrerPolicy="no-referrer"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageFailed(true)}
            />
            {children}
        </div>
    );
};

export default ProfilePicture;

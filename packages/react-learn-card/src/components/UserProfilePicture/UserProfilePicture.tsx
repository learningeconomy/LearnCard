import React from 'react';

const PersonSilhouette: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg
        width="22"
        height="22"
        viewBox="0 0 22 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M10.7115 13.5488C6.86057 13.5488 3.57129 14.156 3.57129 16.5845C3.57129 19.014 6.84004 19.6426 10.7115 19.6426C14.5624 19.6426 17.8516 19.0363 17.8516 16.6069C17.8516 14.1774 14.5838 13.5488 10.7115 13.5488Z"
            fill="#353E64"
        />
        <path
            opacity="0.4"
            d="M10.7115 11.2361C13.3347 11.2361 15.4365 9.13345 15.4365 6.51113C15.4365 3.88881 13.3347 1.78613 10.7115 1.78613C8.08913 1.78613 5.98645 3.88881 5.98645 6.51113C5.98645 9.13345 8.08913 11.2361 10.7115 11.2361Z"
            fill="#353E64"
        />
    </svg>
);

const FingerprintIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg
        width="32"
        height="31"
        viewBox="0 0 32 31"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        <path
            d="M15.612 10.3663C21.746 10.3665 26.7187 15.339 26.7187 21.473C26.7187 23.722 24.8953 25.5453 22.6462 25.5454C20.3972 25.5454 18.5738 23.7222 18.5738 21.473C18.5738 19.8373 17.2476 18.5113 15.612 18.5112C13.9763 18.5112 12.6502 19.8372 12.6502 21.473C12.6502 24.103 13.6282 26.5011 15.2418 28.3294C15.7824 28.9423 15.7241 29.8778 15.1117 30.4191C14.4985 30.9602 13.5617 30.902 13.0204 30.2889C10.9478 27.9403 9.68847 24.8519 9.68847 21.473C9.68847 18.2015 12.3406 15.5494 15.612 15.5494C18.8834 15.5495 21.5356 18.2015 21.5356 21.473C21.5356 22.0864 22.0328 22.5836 22.6462 22.5836C23.2596 22.5835 23.7569 22.0862 23.7569 21.473C23.7569 16.9748 20.1102 13.3282 15.612 13.3281C11.1137 13.3281 7.46712 16.9746 7.46712 21.473C7.46712 22.498 7.65616 23.4759 7.99933 24.3755C8.29047 25.1394 7.90699 25.9958 7.14318 26.2874C6.37916 26.5787 5.52292 26.1951 5.23133 25.4313C4.76156 24.1997 4.50533 22.8644 4.50533 21.473C4.50533 15.339 9.47799 10.3663 15.612 10.3663ZM15.4645 21.5019C16.2659 21.3392 17.0486 21.8576 17.2115 22.6589C17.7602 25.3619 20.1527 27.3964 23.0165 27.3965C23.217 27.3965 23.415 27.3869 23.6094 27.3677C24.4233 27.2868 25.1484 27.8814 25.2292 28.6953C25.3096 29.5088 24.7165 30.2339 23.9031 30.3149C23.6113 30.3438 23.315 30.3583 23.0165 30.3583C18.7164 30.3582 15.1311 27.305 14.3076 23.2489C14.145 22.4475 14.6635 21.6649 15.4645 21.5019ZM15.612 5.18313C22.9079 5.18344 29.0803 9.97908 31.1556 16.5863C31.4005 17.3663 30.9665 18.198 30.1867 18.4432C29.4067 18.688 28.575 18.2542 28.3298 17.4743C26.6312 12.0658 21.5773 8.14523 15.612 8.14492C9.64668 8.14505 4.59309 12.0658 2.89428 17.4743C2.64921 18.2542 1.81744 18.6879 1.03739 18.4432C0.257211 18.1981 -0.176617 17.3666 0.0684418 16.5863C2.14387 9.97898 8.31608 5.18326 15.612 5.18313ZM15.612 0C21.2529 0.000192516 26.3708 2.25505 30.1071 5.90911C30.6913 6.4809 30.7017 7.41857 30.1304 8.0032C29.5586 8.58772 28.6209 8.59782 28.0362 8.02633C24.8309 4.89168 20.4478 2.96198 15.612 2.96179C10.7762 2.96185 6.39334 4.89163 3.18787 8.02633C2.60327 8.59809 1.66569 8.58756 1.09378 8.0032C0.522099 7.41847 0.532273 6.48093 1.11693 5.90911C4.85343 2.255 9.97118 5.92358e-05 15.612 0Z"
            fill="currentColor"
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
    avatarFingerprintColor?: string;
    avatarTextClassName?: string;
    avatarIconClassName?: string;
    avatarSilhouetteClassName?: string;
    avatarFallbackVariant?: 'initial' | 'fingerprint';
}> = ({
    customContainerClass,
    customImageClass,
    user,
    alt,
    children,
    avatarColor,
    avatarFingerprintColor,
    avatarTextClassName,
    avatarIconClassName,
    avatarSilhouetteClassName,
    avatarFallbackVariant = 'initial',
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
        const fingerprintIconClassName = `${avatarIconClassName || 'w-[60%] h-[60%]'} ${
            avatarFingerprintColor || 'text-white/85'
        }`;

        return (
            <div
                className={`rounded-full flex items-center justify-center font-poppins font-semibold uppercase select-none text-white text-2xl ${customContainerClass} ${baseColor}`}
            >
                {avatarFallbackVariant === 'fingerprint' ? (
                    <FingerprintIcon className={fingerprintIconClassName} />
                ) : letterToDisplay ? (
                    <span className={avatarTextClassName || ''}>{letterToDisplay}</span>
                ) : (
                    <PersonSilhouette
                        className={avatarSilhouetteClassName || avatarIconClassName}
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

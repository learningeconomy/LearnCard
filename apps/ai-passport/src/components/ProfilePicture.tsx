import { useStore } from '@nanostores/react';
import { profile } from '../stores/profile';

type UserProfile = {
    image?: string;
    name?: string;
    [key: string]: any; // Allow other properties
};

type ProfilePictureProps = {
    className?: string;
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
};

const ProfilePicture = ({
    className = '',
    hideOnMobile = false,
    hideOnDesktop = false,
}: ProfilePictureProps) => {
    const profileData = useStore(profile);
    const userProfile = profileData.profile as UserProfile | null;
    const mobileClass = hideOnMobile ? 'hidden md:block' : '';
    const desktopClass = hideOnDesktop ? 'md:hidden' : '';

    // Get profile picture URL or use default avatar
    const profilePicture = userProfile?.image || '';
    const name = userProfile?.name || '';
    const initials = name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    return (
        <div className={`relative ${mobileClass} ${desktopClass} ${className}`}>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                {profilePicture ? (
                    <img
                        src={profilePicture}
                        alt={name || 'Profile'}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-indigo-500 text-white font-medium">
                        {initials || (
                            <svg
                                className="h-5 w-5 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePicture;

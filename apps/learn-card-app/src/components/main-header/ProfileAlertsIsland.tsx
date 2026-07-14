import React from 'react';

import { useIsLoggedIn, ProfilePicture } from 'learn-card-base';
import NotificationButton from 'learn-card-base/components/notification-button/NotificationButton';
import { BrandingEnum } from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import useOpenMyLearnCard from '../learncard/useOpenMyLearnCard';
import useOpenNotifications from '../notifications/useOpenNotifications';

type ProfileAlertsIslandProps = {
    branding?: BrandingEnum;
    /** Color class for the alerts icon. Defaults to a dark tone that reads on the
     *  white desktop island; MainHeader passes the page's header color. */
    notificationColorOverride?: string;
    className?: string;
};

/**
 * Profile picture + alerts (megaphone) cluster. On desktop `.main-header-profile-island`
 * (header.scss) renders it as a white rounded pill; on mobile the icons sit bare.
 * Rendered inside MainHeader on mobile, and directly in the page content on desktop
 * (where the redesigned pages hide MainHeader entirely).
 */
const ProfileAlertsIsland: React.FC<ProfileAlertsIslandProps> = ({
    branding = BrandingEnum.learncard,
    notificationColorOverride,
    className,
}) => {
    const isLoggedIn = useIsLoggedIn();
    const openMyLearnCard = useOpenMyLearnCard(branding);
    const openNotifications = useOpenNotifications();

    if (!isLoggedIn) return null;

    return (
        <div
            className={`main-header-profile-island flex items-center gap-2 ${
                className ?? ''
            }`.trim()}
        >
            <button
                type="button"
                aria-label="Open profile"
                onClick={openMyLearnCard}
                className="flex items-center justify-center"
            >
                <ProfilePicture
                    customContainerClass="h-[35px] w-[35px] min-h-[35px] min-w-[35px] max-h-[35px] max-w-[35px]"
                    customImageClass="w-full h-full object-cover"
                />
            </button>
            <NotificationButton
                colorOverride={notificationColorOverride ?? 'text-grayscale-900'}
                iconVariant="alerts"
                onOpen={openNotifications}
            />
        </div>
    );
};

export default ProfileAlertsIsland;

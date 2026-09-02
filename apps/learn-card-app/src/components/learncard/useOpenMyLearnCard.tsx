import React from 'react';

import { useModal, ModalTypes, BrandingEnum } from 'learn-card-base';

import MyLearnCardModal from './MyLearnCardModal';

/**
 * Opens the "My LearnCard" profile/settings view in a right-loading modal
 * (LC-1921). On desktop it slides in from the right beside the nav; on mobile
 * the right modal fills the screen and closes back to the previous page.
 *
 * Shared by the header profile avatar (MainHeader), the side-menu Settings row,
 * and the Dashboard avatar so all entry points present the same modal/config.
 */
export const useOpenMyLearnCard = (branding: BrandingEnum = BrandingEnum.learncard) => {
    const { newModal: openProfileModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });

    return () => openProfileModal(<MyLearnCardModal branding={branding} />);
};

export default useOpenMyLearnCard;

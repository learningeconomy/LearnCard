import React from 'react';

import { useModal, ModalTypes, BrandingEnum } from 'learn-card-base';

import MyLearnCardModal from './MyLearnCardModal';

/**
 * Opens the "My LearnCard" profile/settings view in a Freeform modal.
 *
 * Shared by the header profile avatar (MainHeader) and the side-menu
 * Settings row (LC-1921) so the two entry points can never drift on
 * which modal/config they present.
 */
export const useOpenMyLearnCard = (branding: BrandingEnum = BrandingEnum.learncard) => {
    const { newModal: openProfileModal } = useModal({
        desktop: ModalTypes.Freeform,
        mobile: ModalTypes.Freeform,
    });

    return () => openProfileModal(<MyLearnCardModal branding={branding} />);
};

export default useOpenMyLearnCard;

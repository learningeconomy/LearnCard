import React from 'react';

import { ModalTypes, useModal } from 'learn-card-base';

import SkillProfileModal from '../components/SkillProfileModal';

export const useSkillProfileModal = () => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.Right,
        desktop: ModalTypes.Right,
    });

    const openSkillProfile = () => {
        newModal(
            <SkillProfileModal onClose={closeModal} />,
            { hideButton: true, sectionClassName: '!max-w-[640px]' },
        );
    };

    return { openSkillProfile };
};

export default useSkillProfileModal;

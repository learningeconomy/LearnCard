import BoostGroupedBySkillsModal from './BoostGroupedBySkillsModal';

import { VC } from '@learncard/types';
import { ModalTypes, VC_WITH_URI, useModal } from 'learn-card-base';
import { BoostCMSSKillsCategoryEnum } from '../../../components/boost/boostCMS/boostCMSForms/boostCMSSkills/boostSkills';

const useBoostGroupedBySkillsModal = (credentials: VC[] | VC_WITH_URI[]) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.FullScreen,
    });

    const handlePresentBoostModal = (
        skillCategory: BoostCMSSKillsCategoryEnum,
        totalSkillsCount: number
    ) => {
        if (skillCategory && credentials?.length > 0) {
            newModal(
                <BoostGroupedBySkillsModal
                    credentials={credentials}
                    skillCategory={skillCategory}
                    handleCloseModal={closeModal}
                    totalSkillsCount={totalSkillsCount}
                />,
                {
                    sectionClassName: '!max-w-[500px]',
                }
            );
        }
    };

    return {
        handlePresentBoostModal,
    };
};

export default useBoostGroupedBySkillsModal;

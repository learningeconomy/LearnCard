import React from 'react';
import { useModal, ModalTypes } from 'learn-card-base';
import CheckListContainer from '../../../components/learncard/checklist/CheckListContainer';
import useLCNGatedAction from '../../../components/network-prompts/hooks/useLCNGatedAction';

export const useBuildMyLearnCardModal = () => {
    const { newModal } = useModal();
    const { gate } = useLCNGatedAction();

    const openBuildMyLearnCard = async () => {
        const { prompted } = await gate();
        if (prompted) return;

        newModal(
            <CheckListContainer />,
            { className: '!bg-transparent' },
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    return { openBuildMyLearnCard };
};

export default useBuildMyLearnCardModal;

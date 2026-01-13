import React from 'react';
import { useModal } from 'learn-card-base';
import ViewAlignmentInfo from '../pages/SkillFrameworks/ViewAlignmentInfo';

export const useAlignmentModal = () => {
    const { newModal } = useModal();

    const onAlignmentClick = (alignment: any) => {
        newModal(
            <ViewAlignmentInfo
                frameworkId={alignment.frameworkId}
                skillId={alignment.targetCode}
            />
        );
    };

    return { onAlignmentClick };
};

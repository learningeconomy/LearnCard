import React from 'react';
import {
    ModalTypes,
    middleTruncate,
    useGetSkill,
    useGetSkillFrameworkById,
    useModal,
} from 'learn-card-base';

import TrashBin from 'learn-card-base/svgs/TrashBin';
import CompetencyIcon from 'apps/scouts/src/pages/SkillFrameworks/CompetencyIcon';
import ViewAlignmentInfo from 'apps/scouts/src/pages/SkillFrameworks/ViewAlignmentInfo';

import { SkillFrameworkNode } from 'apps/scouts/src/components/boost/boost';

type BoostCMSSkillDisplayProps = {
    skill: SkillFrameworkNode;
    handleRemoveSkill: (skill: SkillFrameworkNode) => void;
};

const BoostCMSSkillDisplay: React.FC<BoostCMSSkillDisplayProps> = ({
    skill,
    handleRemoveSkill,
}) => {
    const { newModal } = useModal();

    const { data: skillData } = useGetSkill(skill.targetFramework ?? '', skill.id ?? '');
    const { data: frameworkData } = useGetSkillFrameworkById(skill.targetFramework ?? '');

    skill.icon = skill.icon ?? skillData?.icon;

    const showSkillInfoModal = (skill: SkillFrameworkNode) => {
        newModal(<ViewAlignmentInfo alignment={skill} />, undefined, {
            desktop: ModalTypes.FullScreen,
            mobile: ModalTypes.FullScreen,
        });
    };

    return (
        <div
            key={skill.id}
            role="button"
            onClick={() => showSkillInfoModal(skill)}
            className="p-[10px] flex items-center gap-[10px] text-grayscale-900 h-[72px] w-full"
        >
            <CompetencyIcon icon={skill.icon} />

            <div className="flex-1 min-w-0 flex flex-col font-poppins text-[17px] text-grayscale-900">
                <p className="line-clamp-2">
                    <span className="inline-flex items-center gap-[2px] whitespace-nowrap align-middle">
                        <span className="shrink-0 font-[600]">
                            {middleTruncate(skill.targetCode ?? '')}
                        </span>
                    </span>{' '}
                    {skill.targetName}
                </p>
                <span className="text-[12px] text-grayscale-700 font-poppins font-[600]">
                    {frameworkData?.framework?.name ?? '...'}
                </span>
            </div>

            <button
                className="ml-auto text-grayscale-600 hover:text-red-600 transition-colors"
                onClick={e => {
                    e.stopPropagation();
                    handleRemoveSkill(skill);
                }}
            >
                <TrashBin className="h-[24px] w-[24px]" />
            </button>
        </div>
    );
};

export default BoostCMSSkillDisplay;

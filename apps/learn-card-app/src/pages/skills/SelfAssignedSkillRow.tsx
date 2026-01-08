import React from 'react';

import InfoIcon from 'learn-card-base/svgs/InfoIcon';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';
import ViewAlignmentInfo from '../SkillFrameworks/ViewAlignmentInfo';

import { ModalTypes, useModal } from 'learn-card-base';

import { SkillFramework, SkillFrameworkNode } from '../../components/boost/boost';

type SelfAssignedSkillRowProps = {
    skill: SkillFrameworkNode;
    framework: SkillFramework;
    isNodeSelected?: boolean;
    handleToggleSelect: () => void;
};

const SelfAssignedSkillRow: React.FC<SelfAssignedSkillRowProps> = ({
    skill,
    framework,
    isNodeSelected,
    handleToggleSelect,
}) => {
    const { newModal } = useModal();

    return (
        <div
            role="button"
            onClick={handleToggleSelect}
            className="p-[10px] pl-[15px] flex items-center gap-[10px] text-grayscale-900 bg-white rounded-[15px] shadow-box-bottom w-full"
        >
            <>
                {isNodeSelected ? (
                    <CircleCheckmark className="w-[40px] h-[40px]" version="no-padding" />
                ) : (
                    <div className="w-[40px] h-[40px] rounded-full bg-grayscale-300" />
                )}
            </>

            <CompetencyIcon icon={skill.icon} />

            <div className="flex flex-col items-start">
                {/* <p className="text-grayscale-700 text-[12px] font-poppins">Based on Resume</p> */}
                <div className="flex-1 min-w-0 font-poppins text-[16px] text-grayscale-900">
                    <p className="line-clamp-2">{skill.targetName}</p>
                </div>
            </div>

            <button
                className="ml-auto pl-[10px] text-grayscale-500 h-full"
                onClick={e => {
                    e.stopPropagation();
                    newModal(
                        <ViewAlignmentInfo alignment={skill} framework={framework} />,
                        undefined,
                        {
                            desktop: ModalTypes.FullScreen,
                            mobile: ModalTypes.FullScreen,
                        }
                    );
                }}
            >
                <InfoIcon className="w-[30px] h-[30px] text-grayscale-500" version="thinner" />
            </button>
        </div>
    );
};

export default SelfAssignedSkillRow;

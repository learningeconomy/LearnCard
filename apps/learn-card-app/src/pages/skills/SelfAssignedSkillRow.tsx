import React from 'react';

import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import CircleCheckmark from 'learn-card-base/svgs/CircleCheckmark';
import ViewAlignmentInfo from '../SkillFrameworks/ViewAlignmentInfo';

import { ModalTypes, useModal } from 'learn-card-base';

import { SkillFramework, SkillFrameworkNode } from '../../components/boost/boost';

type SelfAssignedSkillRowProps = {
    skill: SkillFrameworkNode;
    framework: SkillFramework;
    isNodeSelected?: boolean;
};

const SelfAssignedSkillRow: React.FC<SelfAssignedSkillRowProps> = ({
    skill,
    framework,
    isNodeSelected,
}) => {
    const { newModal } = useModal();

    return (
        <div
            role="button"
            // onClick={handleClick}
            className="p-[10px] flex items-center gap-[10px] text-grayscale-900 bg-white rounded-[15px] shadow-box-bottom h-[72px] w-full"
        >
            <>
                {isNodeSelected ? (
                    <CircleCheckmark className="w-[40px] h-[40px]" version="no-padding" />
                ) : (
                    <div className="w-[40px] h-[40px] rounded-full bg-grayscale-300" />
                )}
            </>

            <CompetencyIcon icon={skill.icon} />

            <div className="flex-1 min-w-0 font-poppins text-[17px] text-grayscale-900">
                <p className="line-clamp-2">{skill.targetName}</p>
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
                {/* TODO should be info icon */}
                <SlimCaretRight className="w-[24px] h-[24px]" strokeWidth="2" />
            </button>
        </div>
    );
};

export default SelfAssignedSkillRow;

import React from 'react';
import { ModalTypes, useGetSkill, useGetSkillFrameworkById, useModal } from 'learn-card-base';

import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SkillInfoModal from './SkillInfoModal';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';

import { getFrameworkIdAndSkillIdFromUrl } from '../../components/boost/alignmentHelpers';
import { AlignmentWithMetadata } from '../../hooks/useAlignments';

type SkillDisplayProps = {
    skill: AlignmentWithMetadata;
};

const SkillDisplay: React.FC<SkillDisplayProps> = ({ skill }) => {
    const { newModal } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });

    const { frameworkId, skillId } = getFrameworkIdAndSkillIdFromUrl(skill.targetUrl);
    const { data: skillData } = useGetSkill(frameworkId!, skillId!);
    const { data: frameworkData } = useGetSkillFrameworkById(frameworkId!);

    // console.log('skillData:', skillData);

    const openSkillInfoModal = () => {
        newModal(
            <SkillInfoModal
                frameworkId={frameworkId!}
                skillId={skillId!}
                credentials={skill.credentials}
            />
        );
    };

    return (
        <button
            className="flex items-center gap-[15px] rounded-[15px] bg-white p-[10px] font-poppins text-[17px] line-clamp-2 shadow-bottom-2-4"
            onClick={openSkillInfoModal}
        >
            <CompetencyIcon icon={skillData?.icon} size="big" />
            <div className="flex flex-col items-start">
                {skill.targetName}
                <span className="flex gap-[5px] items-center text-grayscale-700 font-poppins font-[500] text-[12px] w-full">
                    <SkillsFrameworkIcon className="w-[15px] h-[15px]" color="currentColor" />
                    <span className="line-clamp-1">{frameworkData?.framework.name ?? '...'}</span>
                </span>
            </div>

            <div className="flex items-center ml-auto">
                <PuzzlePiece
                    className="w-[17px] h-[17px] text-grayscale-700 mr-[2px]"
                    version="filled"
                />
                <span className="text-[14px] font-poppins font-[600] text-grayscale-700 pt-[2px]">
                    {skill.credentials.length}
                </span>
                <SlimCaretRight className="w-[20px] h-[20px] text-grayscale-400" />
            </div>
        </button>
    );
};

export default SkillDisplay;

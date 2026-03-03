import React from 'react';
import { ModalTypes, useModal } from 'learn-card-base';

import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SlimCaretRight from '../../components/svgs/SlimCaretRight';
import SkillsFrameworkIcon from '../../components/svgs/SkillsFrameworkIcon';
import LegacySkillInfoModal from './LegacySkillInfoModal';

import { LegacySkillEntry } from '../../hooks/useAlignments';

type LegacySkillDisplayProps = {
    skill: LegacySkillEntry;
};

const LegacySkillDisplay: React.FC<LegacySkillDisplayProps> = ({ skill }) => {
    const { newModal } = useModal();

    const openSkillInfoModal = () => {
        newModal(
            <LegacySkillInfoModal
                skillName={skill.title}
                skillDescription={skill.description}
                iconSrc={skill.iconSrc}
                credentials={skill.credentials}
            />,
            undefined,
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };
    return (
        <button
            className="flex items-center gap-[15px] rounded-[15px] bg-white p-[10px] font-poppins text-[17px] line-clamp-2 shadow-bottom-2-4"
            onClick={openSkillInfoModal}
        >
            {skill.iconSrc && (
                <img src={skill.iconSrc} alt={skill.title} className="w-[45px] h-[45px]" />
            )}
            <div className="flex flex-col items-start">
                {skill.title}
                <span className="flex gap-[5px] items-center text-grayscale-700 font-poppins font-[500] text-[12px] w-full">
                    <SkillsFrameworkIcon className="w-[15px] h-[15px]" color="currentColor" />
                    <span className="line-clamp-1">LearnCard</span>
                </span>
            </div>

            <div className="flex items-center ml-auto">
                <PuzzlePiece
                    className="w-[17px] h-[17px] text-grayscale-700 mr-[2px]"
                    version="filled"
                />
                <span className="text-[14px] font-poppins font-[600] text-grayscale-700 pt-[2px]">
                    {skill.count}
                </span>
                <SlimCaretRight className="w-[20px] h-[20px] text-grayscale-400" />
            </div>
        </button>
    );
};

export default LegacySkillDisplay;

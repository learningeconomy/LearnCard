import { useGetSkill } from 'learn-card-base';
import React from 'react';
import { SkillLevel } from './skillTypes';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import X from 'src/components/svgs/X';

type SkillTagProps = {
    frameworkId: string;
    skillId: string;
    proficiencyLevel: SkillLevel;
    handleRemoveSkill?: (skill: any) => void;
    handleEditSkill?: (skill: any) => void;
};

const SkillTag: React.FC<SkillTagProps> = ({
    skillId,
    frameworkId,
    proficiencyLevel,
    handleRemoveSkill,
    handleEditSkill,
}) => {
    const { data: skill } = useGetSkill(frameworkId, skillId);

    return (
        <div className="bg-violet-100 text-grayscale-900 pl-[3px] pr-[10px] py-[3px] rounded-[40px] flex items-center gap-[5px] w-fit">
            <CompetencyIcon icon={skill?.icon} size="small" withWhiteBackground />
            <span className="font-poppins text-[13px] font-bold leading-[130%]">
                {skill?.statement ?? '...'}
            </span>
            {handleRemoveSkill && (
                <button
                    type="button"
                    className="text-grayscale-700 p-[3px] rounded-full"
                    onClick={() => handleRemoveSkill(skill)}
                >
                    <X className="w-[23px] h-[23px]" />
                </button>
            )}
        </div>
    );
};

export default SkillTag;

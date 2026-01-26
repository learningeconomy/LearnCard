import React from 'react';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import { useGetSkill } from 'learn-card-base';

type SelfAssignedSkillCardProps = {
    skillId: string;
    frameworkId: string;
};

const SelfAssignedSkillCard: React.FC<SelfAssignedSkillCardProps> = ({ skillId, frameworkId }) => {
    const { data: skillData } = useGetSkill(frameworkId, skillId);

    return (
        <div className="h-[310px] w-[160px] bg-white flex flex-col gap-[10px] mt-[5px] rounded-[15px] overflow-hidden shadow-box-bottom">
            <div className="bg-grayscale-100 border-b-[1px] border-solid border-grayscale-200 flex items-center justify-center py-[15px]">
                <CompetencyIcon icon={skillData?.icon} size="super-big" />
            </div>
            <div className="text-grayscale-900 flex items-center justify-center px-[15px] flex-1 flex-col gap-[5px]">
                <p>{skillData?.statement}</p>
                <p className="text-[14px] text-emerald-500">Self-Assigned</p>
                <p>...</p>
            </div>
        </div>
    );
};

export default SelfAssignedSkillCard;

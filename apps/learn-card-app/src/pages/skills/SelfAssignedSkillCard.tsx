import React from 'react';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import SelfVerifiedCertIcon from 'learn-card-base/svgs/SelfVerifiedCertIcon';
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
                <p className="line-clamp-2 text-grayscale-800 font-poppins text-[14px] font-[600]">
                    {skillData?.statement}
                </p>
                <p className="font-[600] text-[12px] text-emerald-500 flex items-center gap-[3px]">
                    <SelfVerifiedCertIcon className="w-[14px] h-[14px]" /> Self-Assigned
                </p>
                {/* <AlignmentSkillsCount /> */}
            </div>
        </div>
    );
};

export default SelfAssignedSkillCard;

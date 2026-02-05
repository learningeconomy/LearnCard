import React from 'react';
import { useGetSkill } from 'learn-card-base';

import { IonCol } from '@ionic/react';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import CompetencyIcon from '../SkillFrameworks/CompetencyIcon';
import SelfVerifiedCertIcon from 'learn-card-base/svgs/SelfVerifiedCertIcon';

type SelfAssignedSkillCardProps = {
    skillId: string;
    frameworkId: string;
};

const SelfAssignedSkillCard: React.FC<SelfAssignedSkillCardProps> = ({ skillId, frameworkId }) => {
    const { data: skillData } = useGetSkill(frameworkId, skillId);

    return (
        <IonCol size="12" className="flex justify-center items-center relative">
            <div className="flex bg-white flex-col shadow-box-bottom relative p-0 w-[160px] h-[310px] rounded-[20px] overflow-hidden ">
                <div className="bg-grayscale-100 border-b-[1px] border-solid border-grayscale-200 flex items-center justify-center py-[15px]">
                    <CompetencyIcon icon={skillData?.icon} size="super-big" />
                </div>
                <div className="text-grayscale-900 flex items-center justify-center px-[15px] flex-1 flex-col gap-[5px] relative pb-[20px]">
                    <p
                        className="line-clamp-2 text-grayscale-800 font-poppins text-[14px] font-[600]"
                        title={skillData?.statement}
                    >
                        {skillData?.statement}
                    </p>
                    <p className="font-[600] text-[12px] text-emerald-500 flex items-center gap-[3px]">
                        <SelfVerifiedCertIcon className="w-[14px] h-[14px]" /> Self-Assigned
                    </p>

                    <div
                        className={`px-[10px] py-[2px] flex gap-[3px] items-center rounded-[5px] overflow-hidden bg-violet-100 absolute bottom-[20px]`}
                    >
                        <PuzzlePiece
                            className="w-[20px] h-[20px] text-grayscale-800"
                            version="filled"
                        />
                        <p className="text-[12px] text-grayscale-800 font-poppins font-[600]">
                            1 Skill
                        </p>
                    </div>
                </div>
            </div>
        </IonCol>
    );
};

export default SelfAssignedSkillCard;

import React from 'react';
import { useGetBoostSkills, useGetSelfAssignedSkillsBoost, useGetSkill } from 'learn-card-base';
import {
    ApiSkillNode,
    convertApiSkillNodeToSkillTreeNode,
} from '../../helpers/skillFramework.helpers';
import SkillProficiencyBar, {
    SkillLevel,
    SkillProficiencyBarModeEnum,
} from './SkillProficiencyBar';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';

type MainSkillInfoBoxProps = {
    frameworkId: string;
    skillId: string;
};

const MainSkillInfoBox: React.FC<MainSkillInfoBoxProps> = ({ frameworkId, skillId }) => {
    const { data: alignmentData } = useGetSkill(frameworkId ?? '', skillId ?? '');
    const { data: sasBoostData } = useGetSelfAssignedSkillsBoost();
    const { data: sasBoostSkills } = useGetBoostSkills(sasBoostData?.uri);

    const alignment = alignmentData
        ? convertApiSkillNodeToSkillTreeNode(alignmentData as ApiSkillNode)
        : undefined;

    const sasLevel = sasBoostSkills?.find(s => s.id === skillId)?.proficiencyLevel;

    return (
        <section className="bg-white rounded-[24px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full">
            <div className="bg-grayscale-50 flex flex-col gap-[10px] items-center p-[20px] border-b-[1px] border-grayscale-200 border-solid">
                <span className="text-[60px] h-[80px] w-[80px] leading-[80px] font-fluentEmoji cursor-none pointer-events-none select-none">
                    {alignment?.icon}
                </span>

                <h2 className="text-[20px] text-grayscale-900 font-poppins">
                    {alignment?.targetName}
                </h2>

                <div className="px-[10px] py-[2px] flex gap-[3px] items-center rounded-[5px] overflow-hidden bg-violet-100">
                    <PuzzlePiece
                        className="w-[20px] h-[20px] text-grayscale-800"
                        version="filled"
                    />
                    <p className="text-[12px] text-grayscale-800 font-poppins font-[600] uppercase">
                        Skill
                    </p>
                </div>
            </div>

            {(alignment?.targetDescription || alignment?.targetCode) && (
                <div className="flex flex-col gap-[15px] p-[20px]">
                    {alignment?.targetDescription && (
                        <p className="text-grayscale-700 font-poppins text-[16px] tracking-[-0.25px]">
                            {alignment?.targetDescription}
                        </p>
                    )}
                    {Boolean(sasLevel) && sasLevel !== SkillLevel.Hidden && (
                        <div className="border-t-[1px] border-grayscale-200 pt-[20px] flex flex-col gap-[5px] items-start w-full">
                            <SkillProficiencyBar
                                proficiencyLevel={sasLevel}
                                mode={SkillProficiencyBarModeEnum.Display}
                            />
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};

export default MainSkillInfoBox;

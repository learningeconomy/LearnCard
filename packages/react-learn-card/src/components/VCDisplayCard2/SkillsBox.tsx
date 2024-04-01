import React, { useState } from 'react';

import {
    boostCMSSKillCategories,
    CATEGORY_TO_SKILLS,
    SKILLS_TO_SUBSKILLS,
} from '../../constants/skills';

import SelectedSkills from './SelectedSkills';

const SkillsBox: React.FC<{ category: string; skill: string; subSkills: string[] }[]> = ({
    skills,
}) => {
    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full relative">
            <h3 className="text-[20px] leading-[20px] text-grayscale-900">Skills</h3>

            {skills?.length > 0 && (
                <div className="ion-padding pt-0 pb-4 flex items-center justify-center flex-col w-full">
                    {skills?.map((_skill, index) => {
                        const category = boostCMSSKillCategories?.find(
                            c => c?.type === _skill?.category
                        );
                        const skill = CATEGORY_TO_SKILLS?.[_skill?.category]?.find(
                            s => s.type === _skill.skill
                        );
                        const subSkills = SKILLS_TO_SUBSKILLS?.[_skill?.skill];

                        const selectedSkills = skills ?? [];
                        const skillSelected = selectedSkills?.find(s => s?.skill === skill?.type);

                        return <SelectedSkills skill={skill} skillSelected={skillSelected} />;
                    })}
                </div>
            )}
        </div>
    );
};

export default SkillsBox;

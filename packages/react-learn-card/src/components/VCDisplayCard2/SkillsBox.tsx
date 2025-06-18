import React from 'react';

import {
    boostCMSSKillCategories,
    CATEGORY_TO_SKILLS,
    SKILLS_TO_SUBSKILLS,
    type BoostCMSSKillsCategoryEnum,
} from '../../constants/skills';

import SelectedSkills from './SelectedSkills';
import PuzzlePiece from '../svgs/PuzzlePiece';

const SkillsBox: React.FC<{
    skills: { category: string; skill: string; subSkills: string[] }[];
}> = ({ skills }) => {
    return (
        <div className="bg-white flex flex-col items-start gap-[10px] rounded-[20px] shadow-bottom px-[15px] py-[20px] w-full relative">
            <div className="flex items-center justify-start">
                <div className="bg-violet-500 rounded-full flex items-center justify-center h-[30px] w-[30px] p-1">
                    <PuzzlePiece className="text-white" fill="#fff" />
                </div>{' '}
                <h3 className="text-[20px] leading-[20px] text-grayscale-900 ml-2">Skills</h3>
            </div>

            {skills.length > 0 && (
                <div className="pt-0 pb-4 flex items-center justify-center flex-col w-full">
                    {skills.map((_skill, index) => {
                        const _category = boostCMSSKillCategories.find(
                            c => c.type === _skill.category
                        );
                        const skill: any = CATEGORY_TO_SKILLS[
                            _skill.category as BoostCMSSKillsCategoryEnum
                        ].find(s => s.type === _skill.skill);
                        const _subSkills = SKILLS_TO_SUBSKILLS[_skill.skill];

                        const selectedSkills = skills ?? [];
                        const skillSelected: any = selectedSkills.find(s => s.skill === skill.type);

                        return (
                            <SelectedSkills
                                key={index}
                                skill={skill}
                                skillSelected={skillSelected}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SkillsBox;

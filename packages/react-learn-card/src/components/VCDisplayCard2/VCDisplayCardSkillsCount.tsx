import React from 'react';

import PuzzlePiece from '../svgs/PuzzlePiece';

import { categorizeSkills, getTotalCountOfSkills } from '../../helpers/credential.helpers';

export const VCDisplayCardSkillsCount: React.FC<{
    skills: { category: string; skill: string; subSkills: string[] }[];
    onClick?: () => void;
}> = ({ skills, onClick }) => {
    const skillsCount = getTotalCountOfSkills(skills);

    if (skillsCount === 0) return <></>;

    const skillsMap = categorizeSkills(skills);

    // Calculate total count of skills and subskills
    const totalSkills: any = Object.values(skillsMap).reduce(
        (total: any, category: any) => total + category?.length,
        0
    );
    const totalSubskills: any = Object.values(skillsMap).reduce(
        (total: any, category: any) => total + (category?.totalSubskillsCount || 0),
        0
    );

    const total: any = totalSkills + totalSubskills;

    const text: string = skillsCount === 1 ? 'Skill' : 'Skills';

    return (
        <div
            className="flex items-center justify-center mt-8 cursor-pointer px-4 py-2 bg-white rounded-[20px] shadow-bottom"
            onClick={onClick}
        >
            <div className="text-violet-500 text-xl flex items-center justify-center tracking-[0.75px] font-poppins font-semibold">
                +{total} {text}{' '}
                <div className="bg-violet-500 rounded-full flex items-center justify-center ml-2 h-[30px] w-[30px] p-1">
                    <PuzzlePiece className="text-white" fill="#fff" />
                </div>
            </div>
        </div>
    );
};

export default VCDisplayCardSkillsCount;

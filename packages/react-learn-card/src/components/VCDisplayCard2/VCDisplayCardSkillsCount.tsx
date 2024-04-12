import React from 'react';

import PuzzlePiece from '../svgs/PuzzlePiece';

import { getTotalCountOfSkills } from '../../helpers/credential.helpers';

export const VCDisplayCardSkillsCount: React.FC<{
    skills: { category: string; skill: string; subSkills: string[] }[];
    onClick?: () => void;
}> = ({ skills, onClick }) => {
    const skillsCount = getTotalCountOfSkills(skills);

    if (skillsCount === 0) return <></>;

    const text = skillsCount === 1 ? 'Skill' : 'Skills';

    return (
        <div className="flex items-center justify-center mt-8 cursor-pointer" onClick={onClick}>
            <p className="text-violet-500 text-xl flex items-center justify-center tracking-[0.75px] font-poppins font-semibold">
                +{skillsCount} {text}{' '}
                <div className="bg-violet-500 rounded-full flex items-center justify-center ml-2 h-[30px] w-[30px] p-1">
                    <PuzzlePiece className="text-white" fill="#fff" />
                </div>
            </p>
        </div>
    );
};

export default VCDisplayCardSkillsCount;

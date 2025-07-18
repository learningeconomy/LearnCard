import React from 'react';

import PuzzlePiece from '../svgs/PuzzlePiece';

import { categorizeSkills, getTotalCountOfSkills } from '../../helpers/credential.helpers';

// Copy of VCDisplayCardSkillsCount, necessary to avoid circular dependency
export const CertDisplayCardSkillsCount: React.FC<{
    skills: { category: string; skill: string; subSkills: string[] }[];
    onClick?: () => void;
    className?: string;
    isInSkillsModal?: boolean;
}> = ({ skills, onClick, className, isInSkillsModal }) => {
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
            className={`flex w-full items-center justify-center cursor-pointer bg-white rounded-[20px] ${
                className === 'boost-generic' ? '' : 'px-4 py-2 mt-4'
            } `}
            onClick={onClick}
        >
            <div
                className={`text-violet-500 flex items-center justify-center tracking-[0.75px] font-poppins font-semibold ${
                    className === 'boost-generic' ? 'text-[12px] mt-[5px]' : 'text-sm'
                }`}
            >
                {isInSkillsModal ? (
                    <>
                        <div className="bg-violet-500 rounded-full flex items-center justify-center mr-[5px] p-1 h-[20px] w-[20px]">
                            <PuzzlePiece className="text-white" fill="#fff" />
                        </div>
                        +{total} {text}
                    </>
                ) : (
                    <>
                        +{total} {text}
                        <div className="bg-violet-500 rounded-full flex items-center justify-center ml-2 p-1 h-[30px] w-[30px]">
                            <PuzzlePiece className="text-white" fill="#fff" />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CertDisplayCardSkillsCount;

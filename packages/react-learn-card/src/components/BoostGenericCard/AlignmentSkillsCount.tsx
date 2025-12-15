import React from 'react';
import PuzzlePiece from '../svgs/PuzzlePiece';
import { VC } from '@learncard/types';
import { categorizeSkills } from '../../helpers/credential.helpers';

type AlignmentSkillsCountProps = {
    credential?: VC;
    onClick?: () => void;
    className?: string;
};

const AlignmentSkillsCount: React.FC<AlignmentSkillsCountProps> = ({
    credential,
    onClick,
    className = '',
}) => {
    if (!credential) return <></>;

    const achievement = (credential?.credentialSubject as any)?.achievement;
    let alignmentCount = achievement?.alignment?.length || 0;

    if (alignmentCount === 0 && credential.skills?.length > 0) {
        const skillsMap = categorizeSkills(credential.skills ?? []);

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
        alignmentCount = total;
    }

    return (
        <div
            role={onClick ? ('button' as const) : undefined}
            onClick={onClick}
            className={`px-[10px] py-[2px] flex gap-[3px] items-center rounded-[5px] overflow-hidden bg-violet-100 ${className}`}
        >
            <PuzzlePiece className="w-[20px] h-[20px] text-grayscale-800" version="filled" />
            <p className="text-[12px] text-grayscale-800 font-poppins font-[600]">
                {`${alignmentCount} Skill${alignmentCount !== 1 ? 's' : ''}`}
            </p>
        </div>
    );
};

export default AlignmentSkillsCount;

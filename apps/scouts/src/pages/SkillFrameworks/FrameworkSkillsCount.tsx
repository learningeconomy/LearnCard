import React from 'react';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import { useCountSkillsInFramework } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

type FrameworkSkillsCountProps = {
    frameworkId?: string;
    skillId?: string;
    countOverride?: number;
    className?: string;
    textClassName?: string;
    iconClassName?: string;
    includeSkillWord?: boolean;
    countAdjustment?: number; // used to adjust the count when nodes have been deleted or added (but before the backend is updated)
};

const FrameworkSkillsCount: React.FC<FrameworkSkillsCountProps> = ({
    frameworkId,
    skillId,
    countOverride,
    className = '',
    textClassName = '',
    iconClassName = '',
    includeSkillWord = false,
    countAdjustment = 0,
}) => {
    const { data: { count } = { count: undefined } } = useCountSkillsInFramework(
        frameworkId ?? '',
        skillId,
        { onlyCountCompetencies: true }
    );

    const countToUse = (countOverride ?? count) + countAdjustment;

    return (
        <div className={`flex items-center text-grayscale-600 gap-[2px] ${className}`}>
            <PuzzlePiece version="filled" className={iconClassName} />
            {includeSkillWord ? (
                <span className={`${textClassName} font-poppins font-[600]`}>
                    {countToUse !== undefined
                        ? countToUse === 1
                            ? m['skillFrameworks.skill_one']()
                            : m['skillFrameworks.skill_other']({ count: countToUse })
                        : m['skillFrameworks.skillLoading']()}
                </span>
            ) : (
                <span className="font-poppins font-[600]">{countToUse ?? '...'}</span>
            )}
        </div>
    );
};

export default FrameworkSkillsCount;

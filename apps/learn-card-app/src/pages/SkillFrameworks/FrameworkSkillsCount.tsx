import React from 'react';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import { conditionalPluralize, useCountSkillsInFramework } from 'learn-card-base';
import { isOpenSaltFramework } from '../../helpers/opensalt.helpers';

type FrameworkSkillsCountProps = {
    frameworkId?: string;
    skillId?: string;
    sourceURI?: string;
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
    sourceURI,
    countOverride,
    className = '',
    textClassName = '',
    iconClassName = '',
    includeSkillWord = false,
    countAdjustment = 0,
}) => {
    const isOpenSalt = isOpenSaltFramework({ id: frameworkId ?? '', sourceURI });
    const { data: { count } = { count: undefined } } = useCountSkillsInFramework(
        frameworkId ?? '',
        skillId,
        { onlyCountCompetencies: !isOpenSalt }
    );

    const calculatedCount = (countOverride ?? count) + countAdjustment;
    const countToUse = Number.isNaN(calculatedCount) ? undefined : calculatedCount;

    return (
        <div className={`flex items-center text-grayscale-600 gap-[2px] ${className}`}>
            <PuzzlePiece version="filled" className={iconClassName} />
            {includeSkillWord ? (
                <span className={`${textClassName} font-poppins font-[600]`}>
                    {countToUse !== undefined
                        ? conditionalPluralize(countToUse, 'skill')
                        : '... skills'}
                </span>
            ) : (
                <span className="font-poppins font-[600]">{countToUse ?? '...'}</span>
            )}
        </div>
    );
};

export default FrameworkSkillsCount;

import React from 'react';
import numeral from 'numeral';
import { useFlags } from 'launchdarkly-react-client-sdk';

import SlimCaretRight from '../../../components/svgs/SlimCaretRight';
import AiPathwayCareerDetails from './AiPathwaysCareerDetails';
import useTheme from '../../../theme/hooks/useTheme';
import { IconSetEnum } from '../../../theme/icons/index';

import {
    CredentialCategoryEnum,
    ModalTypes,
    useModal,
    useSemanticSearchSkills,
} from 'learn-card-base';
import { OccupationDetailsResponse } from 'learn-card-base/types/careerOneStop';
import { getYearlyWages } from './ai-pathway-careers.helpers';

type SemanticSkillRecord = {
    id: string;
    statement: string;
    score?: number;
};

export const AiPathwayCareerItem: React.FC<{
    occupation: OccupationDetailsResponse;
    showDescription?: boolean;
    variant?: 'list' | 'card';
}> = ({ occupation, showDescription = false, variant = 'list' }) => {
    const { newModal } = useModal();
    const { getIconSet } = useTheme();
    const flags = useFlags();
    const frameworkId = flags?.selfAssignedSkillsFrameworkId as string;
    const onetTitle = occupation?.OnetTitle?.trim() ?? '';

    const iconSet = getIconSet(IconSetEnum.sideMenu);
    const SkillDecoration = iconSet[CredentialCategoryEnum.skill] as React.ComponentType<{
        className?: string;
    }>;
    const { data: semanticSkillsData } = useSemanticSearchSkills(onetTitle, frameworkId, {
        limit: 4,
    });
    const matchingSkills = (semanticSkillsData?.records ?? []) as SemanticSkillRecord[];
    const firstSkill = matchingSkills[0];
    const firstSkillIcon = firstSkill?.icon;
    const totalSkillsCount = matchingSkills.length;
    const remainingSkillsCount = Math.max(totalSkillsCount - 1, 0);
    const isCardVariant = variant === 'card';

    const openCareerDetailsModal = () => {
        newModal(<AiPathwayCareerDetails occupation={occupation} />, undefined, {
            desktop: ModalTypes.Right,
            mobile: ModalTypes.Right,
        });
    };

    const yearlyWages = getYearlyWages(occupation?.Wages?.NationalWagesList || []);
    const medianSalary = yearlyWages?.Median;

    return (
        <div
            role="button"
            className={
                isCardVariant
                    ? 'w-full flex flex-col items-start justify-start p-4 gap-2 border-solid border-[1px] border-grayscale-200 border-b-[3px] border-b-cyan-501 rounded-[20px] bg-white shadow-bottom-1-5'
                    : 'w-full flex flex-col items-start justify-start pt-2 pb-4 gap-1 border-solid border-b-[1px] border-grayscale-200 last:border-b-0'
            }
            onClick={openCareerDetailsModal}
        >
            <div className="w-full flex flex-col items-start justify-start gap-1">
                <div className="flex items-center justify-between w-full">
                    <h4
                        className={`pr-1 text-left line-clamp-1 ${
                            isCardVariant
                                ? 'text-grayscale-900 font-semibold text-[17px] leading-[36px]'
                                : 'text-grayscale-800 font-semibold text-[17px]'
                        }`}
                    >
                        {occupation?.OnetTitle}
                    </h4>

                    <div>
                        <SlimCaretRight className="text-grayscale-700 w-[24px] h-auto" />
                    </div>
                </div>
                <div className="w-full flex flex-col items-start justify-start">
                    <p className="text-grayscale-600 text-[13px] text-left font-semibold">
                        AVG. ANNUAL SALARY
                    </p>
                    <p className="text-indigo-400 text-xl font-semibold text-left">
                        ${numeral(medianSalary).format('0,0')}
                    </p>
                </div>

                {firstSkill && (
                    <div className="w-full flex flex-col items-start gap-2 flex-wrap pt-1">
                        {totalSkillsCount > 0 && (
                            <p className="text-grayscale-600 text-sm text-left font-semibold">
                                {totalSkillsCount}{' '}
                                {totalSkillsCount === 1 ? 'Matching Skill' : 'Matching Skills'}
                            </p>
                        )}
                        <div className="w-full flex items-center gap-2 flex-wrap">
                            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-2">
                                {firstSkillIcon || (
                                    <SkillDecoration className="w-4 h-4 text-grayscale-700" />
                                )}
                                <p className="text-grayscale-900 text-xs font-semibold line-clamp-1">
                                    {firstSkill.statement}
                                </p>
                            </div>
                            {remainingSkillsCount > 0 && (
                                <div className="inline-flex items-center rounded-full bg-violet-50 px-3 py-2">
                                    <p className="text-grayscale-900 text-xs font-semibold">
                                        + {remainingSkillsCount} more
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {showDescription && (
                    <p className="text-grayscale-600 line-clamp-2 text-sm text-left">
                        {occupation?.OnetDescription}
                    </p>
                )}
            </div>
        </div>
    );
};

export default AiPathwayCareerItem;

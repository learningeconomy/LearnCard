import React from 'react';
import numeral from 'numeral';

import SlimCaretRight from '../../../components/svgs/SlimCaretRight';
import AiPathwayCareerDetails from './AiPathwaysCareerDetails';

import { ModalTypes, useModal } from 'learn-card-base';
import { OccupationDetailsResponse } from 'learn-card-base/types/careerOneStop';
import { getYearlyWages } from './ai-pathway-careers.helpers';

export const AiPathwayCareerItem: React.FC<{
    occupation: OccupationDetailsResponse;
    showDescription?: boolean;
}> = ({ occupation, showDescription = false }) => {
    const { newModal } = useModal();

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
            className="w-full flex flex-col items-start justify-start pt-2 pb-4 gap-1 border-solid border-b-[1px] border-grayscale-200 last:border-b-0"
            onClick={openCareerDetailsModal}
        >
            <div className="w-full flex flex-col items-start justify-start gap-1">
                <div className="flex items-center justify-between w-full">
                    <h4 className="pr-1 text-grayscale-800 font-semibold text-[17px] text-left line-clamp-1">
                        {occupation?.OnetTitle}
                    </h4>

                    <div>
                        <SlimCaretRight className="text-grayscale-800 w-[24px] h-auto" />
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

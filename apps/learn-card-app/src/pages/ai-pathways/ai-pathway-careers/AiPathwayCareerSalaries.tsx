import React from 'react';

import AiPathwayAvgSalaryDisplay from './AiPathwayAvgSalaryDisplay';
import AiPathwayCareerPipeChart from './AiPathwayCareerPipeChart';

import { OccupationDetailsResponse } from 'learn-card-base/types/careerOneStop';

export const AiPathwayCareerSalaries: React.FC<{ occupation: OccupationDetailsResponse }> = ({
    occupation,
}) => {
    const wages = occupation?.Wages?.NationalWagesList;

    const [rate, yearly] = wages;

    const minSalary = yearly?.Pct10;
    const medianSalary = yearly?.Median;
    const maxSalary = yearly?.Pct90;

    return (
        <div className="bg-white rounded-[24px] p-[20px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full gap-2">
            <div className="w-full flex items-center justify-start">
                <h2 className="text-xl text-grayscale-800 font-notoSans">
                    {occupation.OnetTitle} Salaries
                </h2>
            </div>

            {/* salary */}
            <AiPathwayAvgSalaryDisplay
                medianSalary={medianSalary}
                minSalary={minSalary}
                maxSalary={maxSalary}
            />

            <AiPathwayCareerPipeChart wages={occupation.Wages} />
        </div>
    );
};

export default AiPathwayCareerSalaries;

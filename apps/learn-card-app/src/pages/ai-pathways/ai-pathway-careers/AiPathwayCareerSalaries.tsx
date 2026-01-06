import React from 'react';

import AiPathwayAvgSalaryDisplay from './AiPathwayAvgSalaryDisplay';
import AiPathwayCareerPipeChart from './AiPathwayCareerPipeChart';

import { type AiPathwayCareer, getSalaryStats } from './ai-pathway-careers.helpers';

export const AiPathwayCareerSalaries: React.FC<{ career: AiPathwayCareer }> = ({ career }) => {
    const { medianSalary, minSalary, maxSalary } = getSalaryStats(career.salaryData);

    return (
        <div className="bg-white rounded-[24px] p-[20px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full gap-2">
            <div className="w-full flex items-center justify-start">
                <h2 className="text-xl text-grayscale-800 font-notoSans">
                    {career.title} Salaries
                </h2>
            </div>

            {/* salary */}
            <AiPathwayAvgSalaryDisplay
                medianSalary={medianSalary}
                minSalary={minSalary}
                maxSalary={maxSalary}
            />

            <AiPathwayCareerPipeChart career={career} />
        </div>
    );
};

export default AiPathwayCareerSalaries;

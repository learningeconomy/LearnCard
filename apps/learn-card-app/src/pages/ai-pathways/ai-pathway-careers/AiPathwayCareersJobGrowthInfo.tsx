import React from 'react';
import numeral from 'numeral';

import ArrowUp from 'learn-card-base/svgs/ArrowUp';

import { OccupationDetailsResponse } from 'learn-card-base/types/careerOneStop';

export const AiPathwayCareerJobGrowthInfo: React.FC<{ occupation: OccupationDetailsResponse }> = ({
    occupation,
}) => {
    const projection = occupation.Projections?.Projections?.[0];

    const jobGrowth = projection
        ? {
              annualOpenings: Number(projection.ProjectedAnnualJobOpening),
              percentChange: Number(projection.PerCentChange),
              estimatedYear: Number(projection.EstimatedYear),
              projectedYear: Number(projection.ProjectedYear),
          }
        : undefined;

    if (!jobGrowth) return null;

    return (
        <div className="bg-white rounded-[24px] p-[20px] flex flex-col overflow-y-auto shadow-box-bottom max-w-[600px] mx-auto min-w-[300px] shrink-0 w-full gap-2">
            <div className="w-full flex items-center justify-start">
                <h2 className="text-xl text-grayscale-800 font-notoSans">
                    Growth in the Job Market
                </h2>
            </div>

            <div className="w-full flex items-start justify-start gap-2">
                <span className="w-[20px] h-[20px]">
                    <ArrowUp className="text-grayscale-900 mt-1" />
                </span>
                <p className="text-grayscale-800 text-sm text-left">
                    From {jobGrowth.estimatedYear} to {jobGrowth.projectedYear}, demand for{' '}
                    <strong>{occupation.OnetTitle}</strong> is projected to grow by{' '}
                    <strong>{jobGrowth.percentChange}%</strong>, with approximately{' '}
                    <strong>{numeral(jobGrowth.annualOpenings).format('0,0')}</strong> job openings
                    per year.
                </p>
            </div>
        </div>
    );
};

export default AiPathwayCareerJobGrowthInfo;

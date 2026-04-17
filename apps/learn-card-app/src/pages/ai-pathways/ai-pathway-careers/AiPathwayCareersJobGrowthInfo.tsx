import React from 'react';
import numeral from 'numeral';

import ArrowUp from 'learn-card-base/svgs/ArrowUp';
import { type OccupationDetailsResponse } from 'learn-card-base';
import AiPathwayCareerSection from './AiPathwayCareerSection';

export const AiPathwayCareerJobGrowthInfo: React.FC<{
    occupation: OccupationDetailsResponse;
    compact?: boolean;
}> = ({ occupation, compact = false }) => {
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
        <AiPathwayCareerSection
            title="Growth in the Job Market"
            compact={compact}
            headerOverride={
                <h2 className="text-[17px] text-grayscale-900 font-poppins font-bold leading-[24px] flex gap-[5px] items-center">
                    <ArrowUp className="h-[24px] w-[24px] text-teal-500" />

                    <span className="leading-[24px]">
                        <span className="text-teal-500">Growth</span> in the Job Market
                    </span>
                </h2>
            }
        >
            <p className="text-grayscale-600 text-[14px] text-left">
                From {jobGrowth.estimatedYear} to {jobGrowth.projectedYear}, demand for{' '}
                {occupation.OnetTitle} is projected to grow by{' '}
                <strong className="text-indigo-600 font-bold">{jobGrowth.percentChange}%</strong>,
                with approximately{' '}
                <strong className="text-indigo-600 font-bold">
                    {numeral(jobGrowth.annualOpenings).format('0,0')} new job openings
                </strong>{' '}
                for this role.
            </p>
        </AiPathwayCareerSection>
    );
};

export default AiPathwayCareerJobGrowthInfo;

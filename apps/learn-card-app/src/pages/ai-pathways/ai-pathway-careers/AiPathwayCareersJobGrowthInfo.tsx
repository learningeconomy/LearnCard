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
        <AiPathwayCareerSection title="Growth in the Job Market" compact={compact}>
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
        </AiPathwayCareerSection>
    );
};

export default AiPathwayCareerJobGrowthInfo;

import React from 'react';
import numeral from 'numeral';

import ArrowUp from 'learn-card-base/svgs/ArrowUp';
import ArrowTrendingDown from 'learn-card-base/svgs/ArrowTrendingDown';
import ArrowLeftRight from 'learn-card-base/svgs/ArrowLeftRight';
import { type OccupationDetailsResponse } from 'learn-card-base';
import AiPathwayCareerSection from './AiPathwayCareerSection';

type JobMarketState = 'growth' | 'stable' | 'decline';

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

    const marketState: JobMarketState =
        jobGrowth.percentChange > 5
            ? 'growth'
            : jobGrowth.percentChange < -5
            ? 'decline'
            : 'stable';

    const marketStateConfig: Record<
        JobMarketState,
        {
            title: string;
            accentClassName: string;
            icon: React.ReactNode;
            description: React.ReactNode;
        }
    > = {
        growth: {
            title: 'Growth in the Job Market',
            accentClassName: 'text-teal-500',
            icon: <ArrowUp className="h-[24px] w-[24px] text-teal-500" />,
            description: (
                <p className="text-grayscale-600 text-[14px] text-left">
                    From {jobGrowth.estimatedYear} to {jobGrowth.projectedYear}, demand for{' '}
                    {occupation.OnetTitle} is projected to grow by{' '}
                    <strong className="text-indigo-600 font-bold">
                        {jobGrowth.percentChange}%
                    </strong>
                    , with approximately{' '}
                    <strong className="text-indigo-600 font-bold">
                        {numeral(jobGrowth.annualOpenings).format('0,0')} new job openings
                    </strong>{' '}
                    for this role.
                </p>
            ),
        },
        stable: {
            title: 'Stable in the Job Market',
            accentClassName: 'text-blue-500',
            icon: <ArrowLeftRight className="h-[24px] w-[24px] text-blue-500" />,
            description: (
                <p className="text-grayscale-600 text-[14px] text-left">
                    From {jobGrowth.estimatedYear} to {jobGrowth.projectedYear}, demand for{' '}
                    {occupation.OnetTitle} is projected to remain stable with{' '}
                    {jobGrowth.percentChange >= 0 ? 'an increase' : 'a decrease'} by{' '}
                    <strong className="text-indigo-600 font-bold">
                        {Math.abs(jobGrowth.percentChange)}%
                    </strong>{' '}
                    and approximately{' '}
                    <strong className="text-indigo-600 font-bold">
                        {numeral(jobGrowth.annualOpenings).format('0,0')} new job openings
                    </strong>{' '}
                    for this role.
                </p>
            ),
        },
        decline: {
            title: 'Decline in the Job Market',
            accentClassName: 'text-amber-500',
            icon: <ArrowTrendingDown className="h-[24px] w-[24px] text-amber-500" />,
            description: (
                <p className="text-grayscale-600 text-[14px] text-left">
                    From {jobGrowth.estimatedYear} to {jobGrowth.projectedYear}, demand for{' '}
                    {occupation.OnetTitle} is projected to decline by{' '}
                    <strong className="text-indigo-600 font-bold">
                        {Math.abs(jobGrowth.percentChange)}%
                    </strong>
                    , with approximately{' '}
                    <strong className="text-indigo-600 font-bold">
                        {numeral(jobGrowth.annualOpenings).format('0,0')} new job openings
                    </strong>{' '}
                    for this role.
                </p>
            ),
        },
    };

    const { title, accentClassName, icon, description } = marketStateConfig[marketState];

    return (
        <AiPathwayCareerSection
            title={title}
            compact={compact}
            headerOverride={
                <h2 className="text-[17px] text-grayscale-900 font-poppins font-bold leading-[24px] flex gap-[5px] items-center">
                    {icon}

                    <span className="leading-[24px]">
                        <span className={accentClassName}>
                            {title.split(' in the Job Market')[0]}
                        </span>{' '}
                        in the Job Market
                    </span>
                </h2>
            }
        >
            {description}
        </AiPathwayCareerSection>
    );
};

export default AiPathwayCareerJobGrowthInfo;

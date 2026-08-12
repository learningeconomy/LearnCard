import React from 'react';
import numeral from 'numeral';

import {
    useSalariesForKeyword,
    type OccupationDetailsResponse,
    type CareerOneStopLocationResult,
} from 'learn-card-base';
import { getWagesBySalaryType, getYearlyWages } from './ai-pathway-careers.helpers';
import AiPathwayCareerSection from './AiPathwayCareerSection';

export const AiPathwayTopPayLocations: React.FC<{
    occupation: OccupationDetailsResponse;
    compact?: boolean;
    salaryType?: 'per_year' | 'per_hour';
}> = ({ occupation, compact = false, salaryType = 'per_year' }) => {
    const { data, isLoading } = useSalariesForKeyword({
        keyword: occupation.OnetTitle,
    });

    type LocationSalary = { location: string; salary: number };

    const formatLocationSalary = (value: number): string => {
        if (salaryType === 'per_hour') {
            return `$${new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
            }).format(value)}`;
        }

        return numeral(value).format('$0a');
    };

    const topPaidLocations: LocationSalary[] = (
        (data?.LocationsList ?? []) as CareerOneStopLocationResult[]
    )
        .map((l): LocationSalary => {
            const selectedWages =
                getWagesBySalaryType(l.OccupationList?.[0]?.WageInfo || [], salaryType) ||
                getYearlyWages(l.OccupationList?.[0]?.WageInfo || []);

            return {
                location: l.LocationName,
                salary: Number(selectedWages?.Pct90) || 0,
            };
        })
        .filter((l): l is LocationSalary => l.salary > 0)
        .sort((a, b) => b.salary - a.salary);

    const salaryTypeLabel = salaryType === 'per_hour' ? '/hr' : '/yr';

    const sectionTitle = 'Top Pay Locations';

    return (
        <AiPathwayCareerSection title={sectionTitle} compact={compact}>
            {isLoading ? (
                <p className="text-sm text-grayscale-600">Finding top pay locations...</p>
            ) : topPaidLocations.length > 0 ? (
                <div className="w-full flex flex-col items-start justify-start gap-[10px]">
                    {topPaidLocations.map(l => {
                        return (
                            <div
                                key={l.location}
                                className="w-full flex items-center justify-between"
                            >
                                <p className="text-grayscale-900 text-[16px] leading-[20px]">
                                    {l.location}
                                </p>
                                <p className="text-grayscale-900 text-[14px] leading-[18px]">
                                    {formatLocationSalary(l.salary)}
                                    <span className="text-grayscale-600 text-[12px] font-[400] leading-[16px] tracking-[0.72px]">
                                        {salaryTypeLabel}
                                    </span>
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-grayscale-600">
                    Location salary data isn't available yet.
                </p>
            )}

            {/* <div className="w-full flex items-center justify-center">
                <button className="text-grayscale-900 font-semibold">See All Locations</button>
            </div> */}
        </AiPathwayCareerSection>
    );
};

export default AiPathwayTopPayLocations;

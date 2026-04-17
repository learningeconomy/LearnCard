import React from 'react';
import numeral from 'numeral';

import {
    useSalariesForKeyword,
    type OccupationDetailsResponse,
    type CareerOneStopLocationResult,
} from 'learn-card-base';
import { getYearlyWages } from './ai-pathway-careers.helpers';
import AiPathwayCareerSection from './AiPathwayCareerSection';

export const AiPathwayTopPayLocations: React.FC<{
    occupation: OccupationDetailsResponse;
    compact?: boolean;
}> = ({ occupation, compact = false }) => {
    const { data, isLoading } = useSalariesForKeyword({
        keyword: occupation.OnetTitle,
    });

    type LocationSalary = { location: string; salary: number };

    const topPaidLocations: LocationSalary[] = (
        (data?.LocationsList ?? []) as CareerOneStopLocationResult[]
    )
        .map((l): LocationSalary => {
            const yearly = getYearlyWages(l.OccupationList?.[0]?.WageInfo || []);

            return {
                location: l.LocationName,
                salary: Number(yearly?.Pct90) || 0,
            };
        })
        .filter((l): l is LocationSalary => l.salary > 0)
        .sort((a, b) => b.salary - a.salary);

    const sectionTitle = 'Top Pay Locations';

    return (
        <AiPathwayCareerSection title={sectionTitle} compact={compact}>
            {isLoading ? (
                <p className="text-sm text-grayscale-600">Finding top pay locations...</p>
            ) : topPaidLocations.length > 0 ? (
                <div className="w-full flex flex-col items-start justify-start gap-2">
                    {topPaidLocations.map(l => {
                        return (
                            <div
                                key={l.location}
                                className="w-full flex items-center justify-between"
                            >
                                <p className="text-grayscale-700">{l.location}</p>
                                <p className="text-grayscale-700 font-semibold">
                                    {numeral(l.salary).format('$0a')}
                                    <span className="text-grayscale-500 font-normal">/yr</span>
                                </p>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <p className="text-sm text-grayscale-600">
                    Location salary data isn’t available yet.
                </p>
            )}

            {/* <div className="w-full flex items-center justify-center">
                <button className="text-grayscale-900 font-semibold">See All Locations</button>
            </div> */}
        </AiPathwayCareerSection>
    );
};

export default AiPathwayTopPayLocations;

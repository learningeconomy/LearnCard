import React from 'react';

import AiPathwayAvgSalaryDisplay from './AiPathwayAvgSalaryDisplay';
import AiPathwayCareerPipeChart from './AiPathwayCareerPipeChart';
import AiPathwayCareerSection from './AiPathwayCareerSection';

import { type OccupationDetailsResponse } from 'learn-card-base';
import { getYearlyWages } from './ai-pathway-careers.helpers';

export const AiPathwayCareerSalaries: React.FC<{
    occupation: OccupationDetailsResponse;
    compact?: boolean;
}> = ({ occupation, compact = false }) => {
    const wages = occupation?.Wages;
    const yearly = getYearlyWages(wages?.NationalWagesList || []);

    const minSalary = yearly?.Pct10;
    const medianSalary = yearly?.Median;
    const maxSalary = yearly?.Pct90;
    const sectionTitle = compact ? 'Salary Range' : `${occupation.OnetTitle} Salaries`;

    return (
        <AiPathwayCareerSection title={sectionTitle} compact={compact}>
            {yearly ? (
                <>
                    {/* salary */}
                    <AiPathwayAvgSalaryDisplay
                        medianSalary={medianSalary || ''}
                        minSalary={minSalary || ''}
                        maxSalary={maxSalary || ''}
                    />
                    {!compact && (
                        <AiPathwayCareerPipeChart
                            wages={occupation.Wages}
                            estimatedEmployment={
                                occupation.Projections?.Projections?.[0]?.EstimatedEmployment
                            }
                        />
                    )}
                </>
            ) : (
                <p className="text-sm text-grayscale-600">
                    Salary data isn't available for this title yet.
                </p>
            )}
        </AiPathwayCareerSection>
    );
};

export default AiPathwayCareerSalaries;

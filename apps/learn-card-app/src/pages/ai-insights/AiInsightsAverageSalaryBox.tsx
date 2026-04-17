import React from 'react';
import numeral from 'numeral';

import type { OccupationDetailsResponse } from 'learn-card-base';

import AiPathwayCareerPipeChart from '../ai-pathways/ai-pathway-careers/AiPathwayCareerPipeChart';
import { getYearlyWages } from '../ai-pathways/ai-pathway-careers/ai-pathway-careers.helpers';

type AiInsightsAverageSalaryBoxProps = {
    professionalTitle: string;
    occupation?: OccupationDetailsResponse;
    isLoading?: boolean;
};

const formatSalaryAmount = (value: string | number | undefined, compact = false): string => {
    if (value === undefined || value === null || value === '') {
        return compact ? '$0' : '$0';
    }

    const numericValue =
        typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));

    if (!Number.isFinite(numericValue)) {
        return typeof value === 'string' && value.startsWith('$') ? value : `$${value}`;
    }

    if (!compact) {
        return `$${new Intl.NumberFormat('en-US').format(numericValue)}`;
    }

    return numeral(numericValue)
        .format('$0a')
        .replace(/k/g, 'K')
        .replace(/m/g, 'M')
        .replace(/b/g, 'B');
};

const formatAboutCount = (value: string | number | undefined): string => {
    if (value === undefined || value === null || value === '') {
        return '';
    }

    const numericValue =
        typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));

    if (!Number.isFinite(numericValue)) {
        return '';
    }

    return numeral(numericValue).format('0a');
};

const AiInsightsAverageSalaryBox: React.FC<AiInsightsAverageSalaryBoxProps> = ({
    professionalTitle,
    occupation,
    isLoading = false,
}) => {
    const yearlyWages = occupation
        ? getYearlyWages(occupation?.Wages?.NationalWagesList || [])
        : undefined;
    const projection = occupation?.Projections?.Projections?.[0];

    const minSalary = yearlyWages?.Pct10;
    const medianSalary = yearlyWages?.Median;
    const maxSalary = yearlyWages?.Pct90;
    const formattedMedianSalary = formatSalaryAmount(medianSalary, false);
    const formattedMinSalary = formatSalaryAmount(minSalary, true);
    const formattedMaxSalary = formatSalaryAmount(maxSalary, true);
    const employmentCount = formatAboutCount(projection?.EstimatedEmployment);
    const title = occupation?.OnetTitle?.trim() || professionalTitle.trim() || 'Career';
    const pluralizedTitle = title.toLowerCase().endsWith('s')
        ? title.toLowerCase()
        : `${title.toLowerCase()}s`;

    return (
        <div className="flex flex-col gap-4 w-full max-w-[600px] mx-auto rounded-[20px] bg-white py-[18px] px-[16px] shadow-bottom-4-4">
            <h2 className="text-[18px] font-semibold text-grayscale-900 font-poppins">
                Average Salaries
            </h2>

            <div className="rounded-[18px] border border-grayscale-200 bg-white px-4 py-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 text-[18px] font-semibold text-grayscale-800 font-poppins truncate">
                        {title}
                    </p>
                    <span className="shrink-0 text-grayscale-600 pt-1">
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-6 h-6"
                        >
                            <path
                                d="M6 9L12 15L18 9"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                </div>

                {isLoading ? (
                    <p className="text-sm text-grayscale-600">Finding salary data...</p>
                ) : occupation && yearlyWages ? (
                    <>
                        <p className="flex flex-wrap items-end gap-1 leading-none">
                            <span className="text-[24px] font-semibold bg-[linear-gradient(90deg,#6366F1_0%,#818CF8_98.7%)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                                {formattedMedianSalary}
                            </span>
                            <span className="text-sm text-grayscale-600 font-medium">
                                /yr average
                            </span>
                        </p>

                        <p className="text-sm font-medium text-grayscale-600">
                            Range: {formattedMinSalary} - {formattedMaxSalary}
                        </p>

                        {employmentCount && (
                            <p className="text-sm font-semibold text-grayscale-700">
                                About {employmentCount} {pluralizedTitle} worldwide
                            </p>
                        )}
                    </>
                ) : (
                    <p className="text-sm text-grayscale-600">
                        We could not find salary data for this title yet.
                    </p>
                )}
            </div>

            {occupation && yearlyWages && (
                <>
                    <div className="flex flex-col items-center justify-center gap-1 text-grayscale-600 pt-2">
                        <div className="flex items-center justify-center gap-1.5 text-[14px] leading-none">
                            <span className="w-[6px] h-[6px] rounded-full bg-grayscale-900 shrink-0" />
                            <span className="text-grayscale-800 font-medium">
                                Median: {formattedMedianSalary}
                            </span>
                        </div>

                        {employmentCount && (
                            <p className="text-sm font-medium text-grayscale-500">
                                ~ {employmentCount} people
                            </p>
                        )}
                    </div>

                    <AiPathwayCareerPipeChart wages={occupation.Wages} showMedianOverlay={false} />
                </>
            )}
        </div>
    );
};

export default AiInsightsAverageSalaryBox;

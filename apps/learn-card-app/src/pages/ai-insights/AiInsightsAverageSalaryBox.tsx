import React from 'react';
import numeral from 'numeral';

import type { OccupationDetailsResponse } from 'learn-card-base';

import CaretDown from 'src/components/svgs/CaretDown';
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
        <div className="flex flex-col gap-[30px] w-full max-w-[600px] mx-auto rounded-[15px] bg-white py-[25px] px-[15px] shadow-bottom-4-4">
            <h2 className="text-[18px] font-bold text-grayscale-900 font-poppins text-left leading-[24px] tracking-[0.32px]">
                Average Salaries
            </h2>

            <div className="rounded-[10px] border-[1px] border-solid border-grayscale-200 bg-grayscale-50 p-[10px] flex flex-col gap-[10px] items-start">
                <div className="flex items-start gap-[10px] w-full">
                    <p className="min-w-0 text-[17px] font-bold text-grayscale-800 font-poppins truncate">
                        {title}
                    </p>
                    <CaretDown className="h-[25px] w-[25px] ml-auto" version="2" />
                </div>

                {isLoading ? (
                    <p className="text-sm text-grayscale-600">Finding salary data...</p>
                ) : occupation && yearlyWages ? (
                    <>
                        <p className="flex flex-wrap items-end gap-1 leading-none">
                            <span className="text-[21px] font-bold bg-[linear-gradient(90deg,#6366F1_0%,#818CF8_98.7%)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                                {formattedMedianSalary}
                            </span>
                            <span className="text-[12px] text-grayscale-700 leading-[16px]">
                                /yr average
                            </span>
                        </p>

                        <div className="flex flex-col items-start text-[12px] text-grayscale-600 font-bold">
                            <p>
                                Range: {formattedMinSalary} - {formattedMaxSalary}
                            </p>

                            {employmentCount && (
                                <p>
                                    About {employmentCount} {pluralizedTitle} worldwide
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-grayscale-600">
                        We could not find salary data for this title yet.
                    </p>
                )}
            </div>

            {occupation && yearlyWages && (
                <div className="flex flex-col">
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
                </div>
            )}
        </div>
    );
};

export default AiInsightsAverageSalaryBox;

import React, { useMemo } from 'react';

import { toTitleCase, type OccupationDetailsResponse } from 'learn-card-base';

import type { SkillProfileSalaryData } from '../ai-pathways/ai-pathways-skill-profile/SkillProfileStep3';
import {
    getSalaryPercentileAtValue,
    getSelectedWagesBySalaryType,
} from '../ai-pathways/ai-pathway-careers/ai-pathway-careers.helpers';

type AiInsightsMarketComparisonBoxProps = {
    professionalTitle: string;
    occupation?: OccupationDetailsResponse;
    salaryData?: SkillProfileSalaryData;
    isLoading?: boolean;
    salaryType?: SkillProfileSalaryData['salaryType'];
};

const formatCurrency = (
    value: number,
    salaryType: SkillProfileSalaryData['salaryType']
): string => {
    const formattedValue = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: salaryType === 'per_hour' ? 2 : 0,
        maximumFractionDigits: salaryType === 'per_hour' ? 2 : 0,
    }).format(value);

    return `$${formattedValue.replace(/\.00$/, '')}`;
};

const formatScaleLabel = (
    value: number,
    salaryType: SkillProfileSalaryData['salaryType']
): string => {
    if (salaryType === 'per_hour') {
        const formattedValue = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);

        return formattedValue.replace(/\.00$/, '');
    }

    const formattedValue = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value / 1000);

    return formattedValue.replace(/\.00$/, '');
};

const parseSalaryValue = (value: string | undefined): number | undefined => {
    if (!value) {
        return undefined;
    }

    const numericValue = Number(value.replace(/[$,+]/g, '').trim());

    return Number.isFinite(numericValue) ? numericValue : undefined;
};

const clampPercent = (value: number): number => {
    return Math.min(100, Math.max(0, value));
};

const pluralizeTitle = (title: string): string => {
    const normalizedTitle = title.trim().toLowerCase();

    if (!normalizedTitle) {
        return 'careers';
    }

    return normalizedTitle.endsWith('s') ? normalizedTitle : `${normalizedTitle}s`;
};

const AiInsightsMarketComparisonBox: React.FC<AiInsightsMarketComparisonBoxProps> = ({
    professionalTitle,
    occupation,
    salaryData,
    isLoading = false,
    salaryType = 'per_year',
}) => {
    const selectedWages = useMemo(() => {
        if (!occupation) {
            return undefined;
        }

        return getSelectedWagesBySalaryType(occupation.Wages.NationalWagesList || [], salaryType);
    }, [occupation, salaryType]);

    const marketLow = useMemo(
        () => (selectedWages?.Pct10 ? parseSalaryValue(selectedWages.Pct10) : undefined),
        [selectedWages?.Pct10]
    );
    const marketAvg = useMemo(
        () => (selectedWages?.Median ? parseSalaryValue(selectedWages.Median) : undefined),
        [selectedWages?.Median]
    );
    const marketHigh = useMemo(
        () => (selectedWages?.Pct90 ? parseSalaryValue(selectedWages.Pct90) : undefined),
        [selectedWages?.Pct90]
    );

    const currentSalary = useMemo(() => parseSalaryValue(salaryData?.salary), [salaryData?.salary]);

    const scaleMax = useMemo(
        () => Math.max(marketHigh ?? 0, currentSalary ?? 0, 1),
        [marketHigh, currentSalary]
    );

    const getPositionFromValue = (value: number): number => {
        return clampPercent((value / scaleMax) * 100);
    };

    const markerLeft = useMemo(() => {
        return currentSalary !== undefined ? getPositionFromValue(currentSalary) : undefined;
    }, [currentSalary, scaleMax]);

    const comparisonPercent = useMemo(() => {
        return currentSalary !== undefined && selectedWages
            ? getSalaryPercentileAtValue(currentSalary, selectedWages, salaryType)
            : undefined;
    }, [currentSalary, selectedWages, salaryType]);

    const comparisonPercentLabel = useMemo(() => {
        return comparisonPercent !== undefined
            ? Math.round(comparisonPercent).toString()
            : undefined;
    }, [comparisonPercent]);

    const title = useMemo(() => {
        return occupation?.OnetTitle?.trim() || professionalTitle.trim() || 'Career';
    }, [occupation?.OnetTitle, professionalTitle]);

    const titlePlural = useMemo(() => {
        return toTitleCase(pluralizeTitle(title));
    }, [title]);

    const marketLowLabel = useMemo(
        () => (marketLow !== undefined ? formatCurrency(marketLow, salaryType) : '$0'),
        [marketLow, salaryType]
    );
    const marketAvgLabel = useMemo(
        () => (marketAvg !== undefined ? formatCurrency(marketAvg, salaryType) : '$0'),
        [marketAvg, salaryType]
    );
    const marketHighLabel = useMemo(
        () => (marketHigh !== undefined ? formatCurrency(marketHigh, salaryType) : '$0'),
        [marketHigh, salaryType]
    );
    const currentSalaryLabel = useMemo(
        () => (currentSalary !== undefined ? formatCurrency(currentSalary, salaryType) : '$0'),
        [currentSalary, salaryType]
    );
    const marketComparisonAriaLabel = useMemo(() => {
        return `Salary comparison for ${title}. Your salary is ${currentSalaryLabel}. Market range is ${marketLowLabel} to ${marketHighLabel}, with an average of ${marketAvgLabel}. You are above ${
            comparisonPercentLabel ?? 0
        }% of other ${titlePlural} in the market.`;
    }, [
        comparisonPercentLabel,
        currentSalaryLabel,
        marketAvgLabel,
        marketHighLabel,
        marketLowLabel,
        title,
        titlePlural,
    ]);

    const tickValues = useMemo(
        () => [0, scaleMax * 0.25, scaleMax * 0.5, scaleMax * 0.75, scaleMax],
        [scaleMax]
    );

    if (isLoading) {
        return (
            <div className="w-full rounded-[18px] border border-grayscale-200 bg-grayscale-10 px-4 py-4 font-poppins">
                <h3 className="text-[18px] font-semibold text-grayscale-900">
                    Your Market Comparison
                </h3>
                <p className="mt-2 text-sm text-grayscale-600">Finding market data...</p>
            </div>
        );
    }

    if (!occupation || !selectedWages || currentSalary === undefined) {
        return (
            <div className="w-full rounded-[18px] border border-grayscale-200 bg-grayscale-10 px-4 py-4 font-poppins">
                <h3 className="text-[18px] font-semibold text-grayscale-900">
                    Your Market Comparison
                </h3>
                <p className="mt-2 text-sm text-grayscale-600">
                    Add your salary to see how you compare against the market.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full font-poppins flex flex-col gap-4">
            <div className="flex flex-col gap-[10px]">
                <h3 className="text-[17px] font-bold text-grayscale-900 leading-[24px] text-left">
                    Your Market Comparison
                </h3>
                <p className="text-[14px] text-grayscale-600 leading-[18px] text-left">
                    It looks like you make more than {comparisonPercentLabel ?? 0}% of other{' '}
                    {toTitleCase(titlePlural)} in the market.
                </p>
            </div>

            <div className="space-y-2">
                <div className="relative h-[16px] px-[15px]" aria-hidden="true">
                    {tickValues.map((tickValue, index) => (
                        <span
                            key={`${tickValue}-${index}`}
                            className={`absolute top-0 whitespace-nowrap text-[14px] leading-[14px] tracking-[0.32px] text-grayscale-600 ${
                                index === 0
                                    ? 'translate-x-0 text-left'
                                    : index === tickValues.length - 1
                                    ? '-translate-x-full text-right'
                                    : index === 2
                                    ? '-translate-x-1/2 text-center'
                                    : '-translate-x-1/2 text-center'
                            }`}
                            style={{ left: `${getPositionFromValue(tickValue)}%` }}
                        >
                            {formatScaleLabel(tickValue, salaryType)}
                        </span>
                    ))}
                </div>

                <div
                    className="relative h-4 rounded-full bg-grayscale-200 overflow-visible"
                    role="img"
                    aria-label={marketComparisonAriaLabel}
                >
                    <div
                        className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#D8E0FF_0%,#C8C3FF_55%,#4F46E5_100%)]"
                        style={{ width: '100%' }}
                        aria-hidden="true"
                    />

                    {markerLeft !== undefined && (
                        <div
                            className="absolute top-1/2 z-10 -translate-y-1/2"
                            style={{
                                left: `${markerLeft}%`,
                                transform:
                                    markerLeft <= 0
                                        ? 'translate(0, -50%)'
                                        : markerLeft >= 100
                                        ? 'translate(calc(-100% + 4px), -50%)'
                                        : 'translate(-50%, -50%)',
                            }}
                            aria-hidden="true"
                        >
                            <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm">
                                <div className="h-4 w-4 rounded-full border-4 border-emerald-500 bg-white" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center">
                    <p className="text-[12px] font-semibold leading-[14px] text-grayscale-600">
                        MARKET LOW
                    </p>
                    <p className="text-[12px] font-bold text-grayscale-900 leading-[16px] tracking-[0.72px]">
                        {marketLowLabel}
                    </p>
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-[12px] font-semibold leading-[14px] text-grayscale-600">
                        MARKET AVG
                    </p>
                    <p className="text-[12px] font-bold text-grayscale-900 leading-[16px] tracking-[0.72px]">
                        {marketAvgLabel}
                    </p>
                </div>
                <div className="flex flex-col items-center">
                    <p className="text-[12px] font-semibold leading-[14px] text-grayscale-600">
                        MARKET HIGH
                    </p>
                    <p className="text-[12px] font-bold text-grayscale-900 leading-[16px] tracking-[0.72px]">
                        {marketHighLabel}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AiInsightsMarketComparisonBox;

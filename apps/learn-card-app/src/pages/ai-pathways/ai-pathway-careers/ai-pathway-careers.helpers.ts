import numeral from 'numeral';

import { type WageItem } from 'learn-card-base';

const FULL_TIME_HOURS_PER_YEAR = 2080;

export type AiPathwayCareer = {
    id: number;
    title: string;
    description: string;
    salary: number;
    salaryData: { bucket: number; value: number }[];
    skills: { id: number; name: string; description: string }[];
    qualitativeInsights: {
        jobSecurityScore: number;
        workLifeBalanceScore: number;
    };
    jobsCount: number;
    qualifications: {
        education: string;
        experience: string;
    };
    topPaidLocations: {
        location: string;
        salary: number;
    }[];
};

export const getSalaryStats = (salaries: { bucket: number; value: number }[]) => {
    const medianSalary = salaries[Math.floor(salaries.length / 2)].value;
    const minSalary = Math.min(...salaries.map(d => d.value));
    const maxSalary = Math.max(...salaries.map(d => d.value));

    return { medianSalary, minSalary, maxSalary };
};

export const buildSalaryPipeData = (wages: WageItem) => {
    return [
        { bucket: 1, value: Number(wages.Pct10) },
        { bucket: 2, value: Number(wages.Pct25) },
        { bucket: 4, value: Number(wages.Median) },
        { bucket: 6, value: Number(wages.Pct75) },
        { bucket: 7, value: Number(wages.Pct90) },
    ];
};

export const getWagesBySalaryType = (
    wages: WageItem[],
    salaryType: 'per_year' | 'per_hour' = 'per_year'
) => {
    const rateType = salaryType === 'per_hour' ? 'Hourly' : 'Annual';

    return wages.find(wage => wage.RateType === rateType);
};

const convertWageValue = (
    value: string,
    fromRateType: WageItem['RateType'],
    salaryType: 'per_year' | 'per_hour'
): string => {
    const numericValue = Number(String(value).replace(/,/g, ''));

    if (!Number.isFinite(numericValue)) {
        return value;
    }

    if (fromRateType === 'Annual' && salaryType === 'per_hour') {
        return (numericValue / FULL_TIME_HOURS_PER_YEAR).toFixed(2);
    }

    if (fromRateType === 'Hourly' && salaryType === 'per_year') {
        return String(numericValue * FULL_TIME_HOURS_PER_YEAR);
    }

    return String(numericValue);
};

export const normalizeWageForSalaryType = (
    wage: WageItem,
    salaryType: 'per_year' | 'per_hour' = 'per_year'
): WageItem => {
    if (
        (salaryType === 'per_hour' && wage.RateType === 'Hourly') ||
        (salaryType === 'per_year' && wage.RateType === 'Annual')
    ) {
        return wage;
    }

    return {
        ...wage,
        RateType: salaryType === 'per_hour' ? 'Hourly' : 'Annual',
        Pct10: convertWageValue(wage.Pct10, wage.RateType, salaryType),
        Pct25: convertWageValue(wage.Pct25, wage.RateType, salaryType),
        Median: convertWageValue(wage.Median, wage.RateType, salaryType),
        Pct75: convertWageValue(wage.Pct75, wage.RateType, salaryType),
        Pct90: convertWageValue(wage.Pct90, wage.RateType, salaryType),
    };
};

export const getFirstAvailableKeywords = (
    pathways: { keywords?: { occupations?: string[]; jobs?: string[]; careers?: string[] } }[]
): string[] => {
    for (const pathway of pathways) {
        const keywords =
            (pathway.keywords?.occupations?.length && pathway.keywords.occupations) ||
            (pathway.keywords?.careers?.length && pathway.keywords.careers) ||
            (pathway.keywords?.jobs?.length && pathway.keywords.jobs) ||
            [];

        if (keywords && keywords.length > 0) {
            return keywords;
        }
    }

    return [];
};

export const getFirstAvailableFieldOfStudy = (
    pathways: { keywords?: { fieldOfStudy?: string } }[]
): string => {
    for (const pathway of pathways) {
        const fos = pathway.keywords?.fieldOfStudy;

        if (fos) return fos;
    }

    return '';
};

export const getAllKeywords = (
    pathways: { keywords?: { occupations?: string[]; jobs?: string[]; careers?: string[] } }[]
): string[] => {
    const allKeywords: string[] = [];

    for (const pathway of pathways) {
        if (pathway.keywords?.occupations?.length) {
            allKeywords.push(...pathway.keywords.occupations);
        }
        if (pathway.keywords?.careers?.length) {
            allKeywords.push(...pathway.keywords.careers);
        }
        if (pathway.keywords?.jobs?.length) {
            allKeywords.push(...pathway.keywords.jobs);
        }
    }

    // Remove duplicates while preserving order
    return [...new Set(allKeywords)];
};

export const getYearlyWages = (wages: WageItem[]) => {
    return getWagesBySalaryType(wages, 'per_year');
};

export const getSelectedWagesBySalaryType = (
    wages: WageItem[],
    salaryType: 'per_year' | 'per_hour' = 'per_year'
) => {
    const selectedWages = getWagesBySalaryType(wages, salaryType) || getYearlyWages(wages);

    return selectedWages ? normalizeWageForSalaryType(selectedWages, salaryType) : undefined;
};

export const formatSalaryAmount = (
    value: string | number | undefined,
    compact = false,
    salaryType: 'per_year' | 'per_hour' = 'per_year'
): string => {
    if (value === undefined || value === null || value === '') {
        return compact ? '$0' : '$0';
    }

    const numericValue =
        typeof value === 'number' ? value : Number(String(value).replace(/,/g, ''));

    if (!Number.isFinite(numericValue)) {
        return typeof value === 'string' && value.startsWith('$') ? value : `$${value}`;
    }

    if (salaryType === 'per_hour') {
        const roundedHourlyValue = Math.round(numericValue * 100) / 100;

        if (Number.isInteger(roundedHourlyValue)) {
            return `$${new Intl.NumberFormat('en-US').format(roundedHourlyValue)}`;
        }

        return `$${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(roundedHourlyValue)}`;
    }

    const roundedYearlyValue = Math.round(numericValue);

    if (!compact) {
        return `$${new Intl.NumberFormat('en-US').format(roundedYearlyValue)}`;
    }

    return `$${new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 0,
    }).format(roundedYearlyValue)}`;
};

export const formatAboutCount = (value: string | number | undefined): string => {
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

export const formatEstimatedSalary = (
    wages: WageItem[] | undefined,
    salaryType: 'per_year' | 'per_hour' = 'per_year'
): string => {
    const selectedWages = getSelectedWagesBySalaryType(wages ?? [], salaryType);

    if (!selectedWages?.Median) {
        return '';
    }

    const salarySuffix = salaryType === 'per_hour' ? '/hr' : '/yr';

    return `~ ${formatSalaryAmount(selectedWages.Median, false, salaryType)}${salarySuffix}`;
};

export type SalaryDistributionAnchor = {
    probability: number;
    value: number;
};

type SalaryDistributionBucket = {
    bucket: number;
    bucketLabel: string;
    estimatedPeople: number;
    lowerBound: number;
    upperBound: number;
    isMedianBucket: boolean;
};

const toNumericValue = (value: string | number | undefined): number | null => {
    if (value === undefined || value === null || value === '') {
        return null;
    }

    const numericValue =
        typeof value === 'number' ? value : Number(String(value).replace(/[,+]/g, '').trim());

    return Number.isFinite(numericValue) ? numericValue : null;
};

export const getProbabilityAtValue = (
    value: number,
    anchors: SalaryDistributionAnchor[]
): number => {
    if (anchors.length === 0) {
        return 0;
    }

    if (value <= anchors[0].value) {
        return anchors[0].probability;
    }

    const lastAnchor = anchors[anchors.length - 1];

    if (value >= lastAnchor.value) {
        return lastAnchor.probability;
    }

    for (let index = 1; index < anchors.length; index += 1) {
        const previousAnchor = anchors[index - 1];
        const currentAnchor = anchors[index];

        if (value <= currentAnchor.value) {
            const valueSpan = currentAnchor.value - previousAnchor.value;

            if (valueSpan <= 0) {
                return currentAnchor.probability;
            }

            const ratio = (value - previousAnchor.value) / valueSpan;

            return (
                previousAnchor.probability +
                ratio * (currentAnchor.probability - previousAnchor.probability)
            );
        }
    }

    return lastAnchor.probability;
};

export const getSalaryDistributionAnchors = (
    wages: WageItem,
    _salaryType: 'per_year' | 'per_hour' = 'per_year'
): SalaryDistributionAnchor[] => {
    const pct10 = toNumericValue(wages.Pct10);
    const pct25 = toNumericValue(wages.Pct25);
    const median = toNumericValue(wages.Median);
    const pct75 = toNumericValue(wages.Pct75);
    const pct90 = toNumericValue(wages.Pct90);

    if (pct10 === null || pct25 === null || median === null || pct75 === null || pct90 === null) {
        return [];
    }

    const lowerTail = Math.max(0, pct10 - Math.max(pct25 - pct10, 1));
    const upperTail = Math.max(pct90 + Math.max(pct90 - pct75, 1), pct90 + 1);

    return [
        { probability: 0, value: lowerTail },
        { probability: 0.1, value: pct10 },
        { probability: 0.25, value: pct25 },
        { probability: 0.5, value: median },
        { probability: 0.75, value: pct75 },
        { probability: 0.9, value: pct90 },
        { probability: 1, value: upperTail },
    ];
};

export const getSalaryPercentileAtValue = (
    value: number,
    wages: WageItem,
    salaryType: 'per_year' | 'per_hour' = 'per_year'
): number | undefined => {
    const anchors = getSalaryDistributionAnchors(wages, salaryType);

    if (anchors.length === 0) {
        return undefined;
    }

    return getProbabilityAtValue(value, anchors) * 100;
};

export const buildSalaryDistributionData = (
    wages: WageItem,
    estimatedEmployment?: string | number,
    salaryType: 'per_year' | 'per_hour' = 'per_year'
): SalaryDistributionBucket[] => {
    const totalEmployment = toNumericValue(estimatedEmployment) ?? 100000;

    const anchors = getSalaryDistributionAnchors(wages, salaryType);

    if (anchors.length === 0) {
        return [];
    }

    const median = toNumericValue(wages.Median);

    if (median === null) {
        return [];
    }

    const lowerBound = anchors[0].value;
    const upperBound = anchors[anchors.length - 1].value;
    const bucketCount = 9;
    const bucketWidth = (upperBound - lowerBound) / bucketCount;

    const buckets = Array.from({ length: bucketCount }, (_value, index) => {
        const bucketLower = lowerBound + index * bucketWidth;
        const bucketUpper =
            index === bucketCount - 1 ? upperBound : lowerBound + (index + 1) * bucketWidth;
        const isMedianBucket =
            median >= bucketLower &&
            (index === bucketCount - 1 ? median <= bucketUpper : median < bucketUpper);

        return {
            bucket: index + 1,
            bucketLabel: `${formatSalaryAmount(bucketLower, true, salaryType)}–${formatSalaryAmount(
                bucketUpper,
                true,
                salaryType
            )}`,
            estimatedPeople: 0,
            lowerBound: bucketLower,
            upperBound: bucketUpper,
            isMedianBucket,
        } satisfies SalaryDistributionBucket;
    });

    let allocatedPeople = 0;

    for (let index = 0; index < buckets.length; index += 1) {
        const bucket = buckets[index];

        if (index === buckets.length - 1) {
            bucket.estimatedPeople = Math.max(0, Math.round(totalEmployment - allocatedPeople));
            continue;
        }

        const lowerProbability = getProbabilityAtValue(bucket.lowerBound, anchors);
        const upperProbability = getProbabilityAtValue(bucket.upperBound, anchors);
        const estimatedPeople = Math.max(
            0,
            Math.round((upperProbability - lowerProbability) * totalEmployment)
        );

        bucket.estimatedPeople = estimatedPeople;
        allocatedPeople += estimatedPeople;
    }

    return buckets;
};

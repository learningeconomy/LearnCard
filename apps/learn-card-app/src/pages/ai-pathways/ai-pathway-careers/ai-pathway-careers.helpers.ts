import numeral from 'numeral';

import { type WageItem } from 'learn-card-base';

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
    return getWagesBySalaryType(wages, salaryType) || getYearlyWages(wages);
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
        return `$${new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(numericValue)}`;
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

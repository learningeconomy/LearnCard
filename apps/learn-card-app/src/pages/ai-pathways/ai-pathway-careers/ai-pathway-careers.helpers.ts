import { WageItem, Wages } from 'learn-card-base/types/careerOneStop';

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
    return wages.find(wage => wage.RateType === 'Annual');
};

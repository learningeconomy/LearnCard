import { WageItem } from 'learn-card-base/types/careerOneStop';

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

export const AI_PATHWAY_CAREERS: AiPathwayCareer[] = [
    {
        id: 1,
        title: 'Data Analyst',
        description: `A data analyst gathers, cleans, and interprets data to help organizations 
            make better business decisions. They work with various tools like SQL, Excel, 
            and data visualization software to identify trends, create reports, and communicate 
            findings to stakeholders. A data analyst's role includes preparing and presenting 
        data-driven insights to solve problems and support strategies`,
        salary: 120000,
        salaryData: [
            { bucket: 1, value: 55000 },
            { bucket: 2, value: 65000 },
            { bucket: 3, value: 75000 },
            { bucket: 4, value: 85000 },
            { bucket: 5, value: 95000 },
            { bucket: 6, value: 110000 },
            { bucket: 7, value: 125000 },
        ],
        skills: [
            {
                id: 1,
                name: 'SQL & Database Management',
                description:
                    'Write complex queries, optimize database performance, and manage large datasets across multiple database systems',
            },
            {
                id: 2,
                name: 'Data Visualization',
                description:
                    'Create compelling charts and dashboards using tools like Tableau, Power BI, or Python libraries to communicate insights effectively',
            },
            {
                id: 3,
                name: 'Statistical Analysis',
                description:
                    'Apply statistical methods and hypothesis testing to validate findings and ensure data-driven conclusions are statistically sound',
            },
            {
                id: 4,
                name: 'Business Intelligence',
                description:
                    'Translate complex data findings into actionable business strategies and present insights to non-technical stakeholders',
            },
        ],
        qualitativeInsights: {
            jobSecurityScore: 80,
            workLifeBalanceScore: 70,
        },
        jobsCount: 32500,
        qualifications: {
            education: "Bachelor's degree in Computer Science, Statistics, or related field",
            experience: '2-3 years of data analysis experience',
        },
        topPaidLocations: [
            { location: 'San Francisco, CA', salary: 145000 },
            { location: 'New York, NY', salary: 135000 },
            { location: 'Seattle, WA', salary: 130000 },
            { location: 'Boston, MA', salary: 125000 },
            { location: 'Austin, TX', salary: 120000 },
        ],
    },
    {
        id: 2,
        title: 'Account Manager',
        description: `Account managers build and maintain relationships with clients, ensuring customer satisfaction while identifying opportunities for business growth. They serve as the primary point of contact, coordinate with internal teams, and develop strategies to meet client objectives and drive revenue.`,
        salary: 127000,
        salaryData: [
            { bucket: 1, value: 60000 },
            { bucket: 2, value: 75000 },
            { bucket: 3, value: 85000 },
            { bucket: 4, value: 95000 },
            { bucket: 5, value: 110000 },
            { bucket: 6, value: 125000 },
            { bucket: 7, value: 145000 },
        ],
        skills: [
            {
                id: 1,
                name: 'Client Relationship Management',
                description:
                    'Build and maintain strong, long-term client relationships through regular communication, trust-building, and understanding client needs',
            },
            {
                id: 2,
                name: 'Sales Strategy & Negotiation',
                description:
                    'Develop effective sales strategies, negotiate contracts, and close deals while maximizing revenue and client satisfaction',
            },
            {
                id: 3,
                name: 'Project Coordination',
                description:
                    'Manage multiple client projects simultaneously, coordinate internal resources, and ensure timely delivery of services and solutions',
            },
            {
                id: 4,
                name: 'Market Analysis',
                description:
                    'Analyze market trends, competitor activities, and industry developments to identify growth opportunities and strategic positioning',
            },
        ],
        qualitativeInsights: {
            jobSecurityScore: 70,
            workLifeBalanceScore: 50,
        },
        jobsCount: 27000,
        qualifications: {
            education: "Bachelor's degree in Business, Marketing, or related field",
            experience: '3-5 years of account management or sales experience',
        },
        topPaidLocations: [
            { location: 'New York, NY', salary: 155000 },
            { location: 'San Francisco, CA', salary: 150000 },
            { location: 'Boston, MA', salary: 140000 },
            { location: 'Chicago, IL', salary: 135000 },
            { location: 'Los Angeles, CA', salary: 130000 },
        ],
    },
    {
        id: 3,
        title: 'Customer Success Manager',
        description: `Customer success managers focus on ensuring customers achieve their desired outcomes while using products or services. They proactively engage with clients, provide strategic guidance, and work to reduce churn while identifying upsell opportunities and fostering long-term relationships.`,
        salary: 121000,
        salaryData: [
            { bucket: 1, value: 58000 },
            { bucket: 2, value: 70000 },
            { bucket: 3, value: 82000 },
            { bucket: 4, value: 92000 },
            { bucket: 5, value: 105000 },
            { bucket: 6, value: 118000 },
            { bucket: 7, value: 135000 },
        ],
        skills: [
            {
                id: 1,
                name: 'Customer Onboarding',
                description:
                    'Guide new customers through seamless onboarding processes, ensuring they understand product features and achieve early value realization',
            },
            {
                id: 2,
                name: 'Customer Retention Strategies',
                description:
                    'Develop and implement proactive strategies to reduce churn, identify at-risk customers, and create intervention plans to improve retention',
            },
            {
                id: 3,
                name: 'Product Knowledge & Training',
                description:
                    'Maintain deep product expertise and deliver effective training sessions to help customers maximize product value and achieve their goals',
            },
            {
                id: 4,
                name: 'Data-Driven Insights',
                description:
                    'Analyze customer usage data and feedback to identify trends, measure satisfaction, and provide strategic recommendations for improvement',
            },
        ],
        qualitativeInsights: {
            jobSecurityScore: 65,
            workLifeBalanceScore: 80,
        },
        jobsCount: 35000,
        qualifications: {
            education: "Bachelor's degree in Business, Communications, or related field",
            experience: '2-4 years of customer service or account management experience',
        },
        topPaidLocations: [
            { location: 'San Francisco, CA', salary: 145000 },
            { location: 'New York, NY', salary: 140000 },
            { location: 'Seattle, WA', salary: 135000 },
            { location: 'Boston, MA', salary: 130000 },
            { location: 'Austin, TX', salary: 125000 },
        ],
    },
];

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
    pathways: { keywords?: { occupation?: string[]; jobs?: string[]; careers?: string[] } }[]
): string[] => {
    for (const pathway of pathways) {
        const keywords =
            (pathway.keywords?.occupation?.length && pathway.keywords.occupation) ||
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
    pathways: { keywords?: { occupation?: string[]; jobs?: string[]; careers?: string[] } }[]
): string[] => {
    const allKeywords: string[] = [];

    for (const pathway of pathways) {
        if (pathway.keywords?.occupation?.length) {
            allKeywords.push(...pathway.keywords.occupation);
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

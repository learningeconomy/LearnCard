export type AiPathwayCareer = {
    id: number;
    title: string;
    description: string;
    salary: string;
    salaryData: { bucket: number; value: number }[];
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
        salary: '120000',
        salaryData: [
            { bucket: 1, value: 55000 },
            { bucket: 2, value: 65000 },
            { bucket: 3, value: 75000 },
            { bucket: 4, value: 85000 },
            { bucket: 5, value: 95000 },
            { bucket: 6, value: 110000 },
            { bucket: 7, value: 125000 },
        ],
    },
    {
        id: 2,
        title: 'Account Manager',
        description: `Account managers build and maintain relationships with clients, ensuring customer satisfaction while identifying opportunities for business growth. They serve as the primary point of contact, coordinate with internal teams, and develop strategies to meet client objectives and drive revenue.`,
        salary: '127000',
        salaryData: [
            { bucket: 1, value: 60000 },
            { bucket: 2, value: 75000 },
            { bucket: 3, value: 85000 },
            { bucket: 4, value: 95000 },
            { bucket: 5, value: 110000 },
            { bucket: 6, value: 125000 },
            { bucket: 7, value: 145000 },
        ],
    },
    {
        id: 3,
        title: 'Customer Success Manager',
        description: `Customer success managers focus on ensuring customers achieve their desired outcomes while using products or services. They proactively engage with clients, provide strategic guidance, and work to reduce churn while identifying upsell opportunities and fostering long-term relationships.`,
        salary: '121000',
        salaryData: [
            { bucket: 1, value: 58000 },
            { bucket: 2, value: 70000 },
            { bucket: 3, value: 82000 },
            { bucket: 4, value: 92000 },
            { bucket: 5, value: 105000 },
            { bucket: 6, value: 118000 },
            { bucket: 7, value: 135000 },
        ],
    },
];

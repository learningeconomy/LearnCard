export type AiPathwayCareer = {
    id: number;
    title: string;
    description: string;
    salary: string;
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
    },
    {
        id: 2,
        title: 'Account Manager',
        description: `Strengthen number sense with quick estimation strategies for sums, differences, and comparisons—no calculator needed.`,
        salary: '127000',
    },
    {
        id: 3,
        title: 'Customer Success Manager',
        description: `Explore open-ended math problems that encourage creative thinking and flexible approaches to problem solving.`,
        salary: '121000',
    },
];

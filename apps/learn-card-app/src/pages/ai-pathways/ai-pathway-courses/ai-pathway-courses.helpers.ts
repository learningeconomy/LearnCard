export type AiPathwayCourse = {
    id: number;
    title: string;
    provider: string;
    durationAvg: string;
    durationTotal: string;
    topics: string[];
    rating: number;
    source: string;
};

export const AI_PATHWAY_COURSES: AiPathwayCourse[] = [
    {
        id: 1,
        title: 'Exploratory Data Analysis',
        provider: 'John Hopkins University',
        durationAvg: '4-8 hours/week',
        durationTotal: '12 weeks',
        topics: ['Data Analysis', 'Machine Learning'],
        rating: 3.8,
        source: 'edX',
    },
    {
        id: 2,
        title: 'Robotics: Vision Intelligence and Machine Learning',
        provider: 'University of Pennsylvania',
        durationAvg: '8 hours/week',
        durationTotal: '12 weeks',
        topics: ['Machine Learning'],
        rating: 4.2,
        source: 'edX',
    },
    {
        id: 3,
        title: 'Python Data Structures',
        provider: 'University of Michigan',
        durationAvg: '3-4 hours/week',
        durationTotal: '2 weeks',
        topics: ['Python'],
        rating: 4.7,
        source: 'edX',
    },
];

import { OccupationDetailsOptions } from 'learn-card-base/types/careerOneStop';
import Megaphone from '../../../assets/images/course.megaphone.icon.png';

export type AiPathwayCourse = {
    id: number;
    title: string;
    description: string;
    provider: string;
    durationAvg: string;
    durationTotal: string;
    topics: string[];
    rating: number;
    source: string;
    image: string;
};

export const AI_PATHWAY_COURSES: AiPathwayCourse[] = [
    {
        id: 1,
        title: 'Exploratory Data Analysis',
        description:
            'Master the fundamentals of exploratory data analysis using Python and R. Learn to clean, transform, and visualize data to uncover meaningful patterns and insights that drive data-driven decision making.',
        provider: 'John Hopkins University',
        durationAvg: '4-8 hours/week',
        durationTotal: '12 weeks',
        topics: ['Data Analysis', 'Machine Learning'],
        rating: 3.8,
        source: 'edX',
        image: Megaphone,
    },
    {
        id: 2,
        title: 'Robotics: Vision Intelligence and Machine Learning',
        description:
            'Dive into the intersection of robotics and artificial intelligence. Explore computer vision techniques and machine learning algorithms that enable robots to perceive, understand, and interact with their environment intelligently.',
        provider: 'University of Pennsylvania',
        durationAvg: '8 hours/week',
        durationTotal: '12 weeks',
        topics: ['Machine Learning'],
        rating: 4.2,
        source: 'edX',
        image: Megaphone,
    },
    {
        id: 3,
        title: 'Python Data Structures',
        description:
            'Build a strong foundation in Python programming by mastering essential data structures. Learn to efficiently organize, store, and manipulate data using lists, dictionaries, sets, and tuples to solve complex computational problems.',
        provider: 'University of Michigan',
        durationAvg: '3-4 hours/week',
        durationTotal: '2 weeks',
        topics: ['Python'],
        rating: 4.7,
        source: 'edX',
        image: Megaphone,
    },
];

export const getKeywordsForCourses = (occupations: OccupationDetailsOptions[]) => {
    const keywords = occupations.flatMap(occupation => occupation.OnetTitle);
    return keywords;
};

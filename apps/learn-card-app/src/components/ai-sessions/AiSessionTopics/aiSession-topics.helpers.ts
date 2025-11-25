import { AiPassportAppsEnum } from '../../ai-passport-apps/aiPassport-apps.helpers';

export type AiSessionTopic = {
    id: number;
    title: string;
    sessionsCount: number;
    sessions: LearningPathway[];
    appType: AiPassportAppsEnum;
    lastUpdated: string;
};

export type LearningPathway = {
    id: number;
    title: string;
    completed: boolean;
    lastUpdated: string;
    summary: string;
    description: string;
    learned: string[];
    skills: {
        title: string;
        description: string;
    }[];
    nextSteps: {
        title: string;
        description: string;
    }[];
};

export const AI_TOPICS_AND_SESSIONS_DUMMY_DATA: AiSessionTopic[] = [
    {
        id: 1,
        title: 'Fractions',
        sessionsCount: 5,
        lastUpdated: '2025-04-01T10:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'Fractions 101',
                completed: true,
                lastUpdated: '2025-04-01T10:05:00Z',
                summary: 'This session covered the topic of Fractions 101.',
                learned: [
                    'Key concept 1 of Fractions 101',
                    'Key concept 2 of Fractions 101',
                    'Key concept 3 of Fractions 101',
                ],
                skills: [
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Fractions 101',
                        description: 'A follow-up topic to reinforce concepts from Fractions 101.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Equivalent Fractions',
                completed: false,
                lastUpdated: '2025-04-01T10:10:00Z',
                summary: 'This session covered the topic of Equivalent Fractions.',
                learned: [
                    'Key concept 1 of Equivalent Fractions',
                    'Key concept 2 of Equivalent Fractions',
                    'Key concept 3 of Equivalent Fractions',
                ],
                skills: [
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Equivalent Fractions',
                        description:
                            'A follow-up topic to reinforce concepts from Equivalent Fractions.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Adding Fractions',
                completed: false,
                lastUpdated: '2025-04-01T10:15:00Z',
                summary: 'This session covered the topic of Adding Fractions.',
                learned: [
                    'Key concept 1 of Adding Fractions',
                    'Key concept 2 of Adding Fractions',
                    'Key concept 3 of Adding Fractions',
                ],
                skills: [
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Adding Fractions',
                        description:
                            'A follow-up topic to reinforce concepts from Adding Fractions.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Subtracting Fractions',
                completed: true,
                lastUpdated: '2025-04-01T10:20:00Z',
                summary: 'This session covered the topic of Subtracting Fractions.',
                learned: [
                    'Key concept 1 of Subtracting Fractions',
                    'Key concept 2 of Subtracting Fractions',
                    'Key concept 3 of Subtracting Fractions',
                ],
                skills: [
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Subtracting Fractions',
                        description:
                            'A follow-up topic to reinforce concepts from Subtracting Fractions.',
                    },
                ],
            },
            {
                id: 5,
                title: 'Multiplying Fractions',
                completed: false,
                lastUpdated: '2025-04-01T10:25:00Z',
                summary: 'This session covered the topic of Multiplying Fractions.',
                learned: [
                    'Key concept 1 of Multiplying Fractions',
                    'Key concept 2 of Multiplying Fractions',
                    'Key concept 3 of Multiplying Fractions',
                ],
                skills: [
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Multiplying Fractions',
                        description:
                            'A follow-up topic to reinforce concepts from Multiplying Fractions.',
                    },
                ],
            },
        ],
        appType: 'chatGPT',
    },
    {
        id: 2,
        title: 'UX Research',
        sessionsCount: 3,
        lastUpdated: '2025-03-28T12:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'Understanding User Needs',
                completed: true,
                lastUpdated: '2025-03-28T12:05:00Z',
                summary: 'This session covered the topic of Understanding User Needs.',
                learned: [
                    'Key concept 1 of Understanding User Needs',
                    'Key concept 2 of Understanding User Needs',
                    'Key concept 3 of Understanding User Needs',
                ],
                skills: [
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Understanding User Needs',
                        description:
                            'A follow-up topic to reinforce concepts from Understanding User Needs.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Creating Personas',
                completed: false,
                lastUpdated: '2025-03-28T12:10:00Z',
                summary: 'This session covered the topic of Creating Personas.',
                learned: [
                    'Key concept 1 of Creating Personas',
                    'Key concept 2 of Creating Personas',
                    'Key concept 3 of Creating Personas',
                ],
                skills: [
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Creating Personas',
                        description:
                            'A follow-up topic to reinforce concepts from Creating Personas.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Conducting Interviews',
                completed: false,
                lastUpdated: '2025-03-28T12:15:00Z',
                summary: 'This session covered the topic of Conducting Interviews.',
                learned: [
                    'Key concept 1 of Conducting Interviews',
                    'Key concept 2 of Conducting Interviews',
                    'Key concept 3 of Conducting Interviews',
                ],
                skills: [
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Conducting Interviews',
                        description:
                            'A follow-up topic to reinforce concepts from Conducting Interviews.',
                    },
                ],
            },
        ],
        appType: 'claude',
    },
    {
        id: 3,
        title: 'Fashion Design',
        sessionsCount: 4,
        lastUpdated: '2025-03-30T09:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'Color Theory',
                completed: true,
                lastUpdated: '2025-03-30T09:05:00Z',
                summary: 'This session covered the topic of Color Theory.',
                learned: [
                    'Key concept 1 of Color Theory',
                    'Key concept 2 of Color Theory',
                    'Key concept 3 of Color Theory',
                ],
                skills: [
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Color Theory',
                        description: 'A follow-up topic to reinforce concepts from Color Theory.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Silhouettes',
                completed: false,
                lastUpdated: '2025-03-30T09:10:00Z',
                summary: 'This session covered the topic of Silhouettes.',
                learned: [
                    'Key concept 1 of Silhouettes',
                    'Key concept 2 of Silhouettes',
                    'Key concept 3 of Silhouettes',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Silhouettes',
                        description: 'A follow-up topic to reinforce concepts from Silhouettes.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Textiles and Fabrics',
                completed: true,
                lastUpdated: '2025-03-30T09:15:00Z',
                summary: 'This session covered the topic of Textiles and Fabrics.',
                learned: [
                    'Key concept 1 of Textiles and Fabrics',
                    'Key concept 2 of Textiles and Fabrics',
                    'Key concept 3 of Textiles and Fabrics',
                ],
                skills: [
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Textiles and Fabrics',
                        description:
                            'A follow-up topic to reinforce concepts from Textiles and Fabrics.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Trends in Fashion',
                completed: false,
                lastUpdated: '2025-03-30T09:20:00Z',
                summary: 'This session covered the topic of Trends in Fashion.',
                learned: [
                    'Key concept 1 of Trends in Fashion',
                    'Key concept 2 of Trends in Fashion',
                    'Key concept 3 of Trends in Fashion',
                ],
                skills: [
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Trends in Fashion',
                        description:
                            'A follow-up topic to reinforce concepts from Trends in Fashion.',
                    },
                ],
            },
        ],
        appType: 'claude',
    },
    {
        id: 4,
        title: 'Algebra',
        sessionsCount: 6,
        lastUpdated: '2025-03-29T14:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'Variables and Expressions',
                completed: true,
                lastUpdated: '2025-03-29T14:05:00Z',
                summary: 'This session covered the topic of Variables and Expressions.',
                learned: [
                    'Key concept 1 of Variables and Expressions',
                    'Key concept 2 of Variables and Expressions',
                    'Key concept 3 of Variables and Expressions',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Variables and Expressions',
                        description:
                            'A follow-up topic to reinforce concepts from Variables and Expressions.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Solving Equations',
                completed: false,
                lastUpdated: '2025-03-29T14:10:00Z',
                summary: 'This session covered the topic of Solving Equations.',
                learned: [
                    'Key concept 1 of Solving Equations',
                    'Key concept 2 of Solving Equations',
                    'Key concept 3 of Solving Equations',
                ],
                skills: [
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Solving Equations',
                        description:
                            'A follow-up topic to reinforce concepts from Solving Equations.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Inequalities',
                completed: false,
                lastUpdated: '2025-03-29T14:15:00Z',
                summary: 'This session covered the topic of Inequalities.',
                learned: [
                    'Key concept 1 of Inequalities',
                    'Key concept 2 of Inequalities',
                    'Key concept 3 of Inequalities',
                ],
                skills: [
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Inequalities',
                        description: 'A follow-up topic to reinforce concepts from Inequalities.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Functions',
                completed: true,
                lastUpdated: '2025-03-29T14:20:00Z',
                summary: 'This session covered the topic of Functions.',
                learned: [
                    'Key concept 1 of Functions',
                    'Key concept 2 of Functions',
                    'Key concept 3 of Functions',
                ],
                skills: [
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Functions',
                        description: 'A follow-up topic to reinforce concepts from Functions.',
                    },
                ],
            },
            {
                id: 5,
                title: 'Graphing Basics',
                completed: false,
                lastUpdated: '2025-03-29T14:25:00Z',
                summary: 'This session covered the topic of Graphing Basics.',
                learned: [
                    'Key concept 1 of Graphing Basics',
                    'Key concept 2 of Graphing Basics',
                    'Key concept 3 of Graphing Basics',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Graphing Basics',
                        description:
                            'A follow-up topic to reinforce concepts from Graphing Basics.',
                    },
                ],
            },
            {
                id: 6,
                title: 'Word Problems',
                completed: false,
                lastUpdated: '2025-03-29T14:30:00Z',
                summary: 'This session covered the topic of Word Problems.',
                learned: [
                    'Key concept 1 of Word Problems',
                    'Key concept 2 of Word Problems',
                    'Key concept 3 of Word Problems',
                ],
                skills: [
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Word Problems',
                        description: 'A follow-up topic to reinforce concepts from Word Problems.',
                    },
                ],
            },
        ],
        appType: 'chatGPT',
    },
    {
        id: 5,
        title: 'World History',
        sessionsCount: 7,
        lastUpdated: '2025-04-01T08:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'Ancient Civilizations',
                completed: true,
                lastUpdated: '2025-04-01T08:05:00Z',
                summary: 'This session covered the topic of Ancient Civilizations.',
                learned: [
                    'Key concept 1 of Ancient Civilizations',
                    'Key concept 2 of Ancient Civilizations',
                    'Key concept 3 of Ancient Civilizations',
                ],
                skills: [
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Ancient Civilizations',
                        description:
                            'A follow-up topic to reinforce concepts from Ancient Civilizations.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Medieval Times',
                completed: false,
                lastUpdated: '2025-04-01T08:10:00Z',
                summary: 'This session covered the topic of Medieval Times.',
                learned: [
                    'Key concept 1 of Medieval Times',
                    'Key concept 2 of Medieval Times',
                    'Key concept 3 of Medieval Times',
                ],
                skills: [
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Medieval Times',
                        description: 'A follow-up topic to reinforce concepts from Medieval Times.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Renaissance',
                completed: false,
                lastUpdated: '2025-04-01T08:15:00Z',
                summary: 'This session covered the topic of Renaissance.',
                learned: [
                    'Key concept 1 of Renaissance',
                    'Key concept 2 of Renaissance',
                    'Key concept 3 of Renaissance',
                ],
                skills: [
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Renaissance',
                        description: 'A follow-up topic to reinforce concepts from Renaissance.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Industrial Revolution',
                completed: false,
                lastUpdated: '2025-04-01T08:20:00Z',
                summary: 'This session covered the topic of Industrial Revolution.',
                learned: [
                    'Key concept 1 of Industrial Revolution',
                    'Key concept 2 of Industrial Revolution',
                    'Key concept 3 of Industrial Revolution',
                ],
                skills: [
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Industrial Revolution',
                        description:
                            'A follow-up topic to reinforce concepts from Industrial Revolution.',
                    },
                ],
            },
            {
                id: 5,
                title: 'World Wars',
                completed: false,
                lastUpdated: '2025-04-01T08:25:00Z',
                summary: 'This session covered the topic of World Wars.',
                learned: [
                    'Key concept 1 of World Wars',
                    'Key concept 2 of World Wars',
                    'Key concept 3 of World Wars',
                ],
                skills: [
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after World Wars',
                        description: 'A follow-up topic to reinforce concepts from World Wars.',
                    },
                ],
            },
            {
                id: 6,
                title: 'Cold War',
                completed: false,
                lastUpdated: '2025-04-01T08:30:00Z',
                summary: 'This session covered the topic of Cold War.',
                learned: [
                    'Key concept 1 of Cold War',
                    'Key concept 2 of Cold War',
                    'Key concept 3 of Cold War',
                ],
                skills: [
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Cold War',
                        description: 'A follow-up topic to reinforce concepts from Cold War.',
                    },
                ],
            },
            {
                id: 7,
                title: 'Modern History',
                completed: false,
                lastUpdated: '2025-04-01T08:35:00Z',
                summary: 'This session covered the topic of Modern History.',
                learned: [
                    'Key concept 1 of Modern History',
                    'Key concept 2 of Modern History',
                    'Key concept 3 of Modern History',
                ],
                skills: [
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Modern History',
                        description: 'A follow-up topic to reinforce concepts from Modern History.',
                    },
                ],
            },
        ],
        appType: 'chatGPT',
    },
    {
        id: 6,
        title: 'Web Development',
        sessionsCount: 5,
        lastUpdated: '2025-03-27T11:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'HTML Basics',
                completed: true,
                lastUpdated: '2025-03-27T11:05:00Z',
                summary: 'This session covered the topic of HTML Basics.',
                learned: [
                    'Key concept 1 of HTML Basics',
                    'Key concept 2 of HTML Basics',
                    'Key concept 3 of HTML Basics',
                ],
                skills: [
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after HTML Basics',
                        description: 'A follow-up topic to reinforce concepts from HTML Basics.',
                    },
                ],
            },
            {
                id: 2,
                title: 'CSS Fundamentals',
                completed: true,
                lastUpdated: '2025-03-27T11:10:00Z',
                summary: 'This session covered the topic of CSS Fundamentals.',
                learned: [
                    'Key concept 1 of CSS Fundamentals',
                    'Key concept 2 of CSS Fundamentals',
                    'Key concept 3 of CSS Fundamentals',
                ],
                skills: [
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after CSS Fundamentals',
                        description:
                            'A follow-up topic to reinforce concepts from CSS Fundamentals.',
                    },
                ],
            },
            {
                id: 3,
                title: 'JavaScript Essentials',
                completed: true,
                lastUpdated: '2025-03-27T11:15:00Z',
                summary: 'This session covered the topic of JavaScript Essentials.',
                learned: [
                    'Key concept 1 of JavaScript Essentials',
                    'Key concept 2 of JavaScript Essentials',
                    'Key concept 3 of JavaScript Essentials',
                ],
                skills: [
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after JavaScript Essentials',
                        description:
                            'A follow-up topic to reinforce concepts from JavaScript Essentials.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Responsive Design',
                completed: true,
                lastUpdated: '2025-03-27T11:20:00Z',
                summary: 'This session covered the topic of Responsive Design.',
                learned: [
                    'Key concept 1 of Responsive Design',
                    'Key concept 2 of Responsive Design',
                    'Key concept 3 of Responsive Design',
                ],
                skills: [
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Responsive Design',
                        description:
                            'A follow-up topic to reinforce concepts from Responsive Design.',
                    },
                ],
            },
            {
                id: 5,
                title: 'Backend Introduction',
                completed: false,
                lastUpdated: '2025-03-27T11:25:00Z',
                summary: 'This session covered the topic of Backend Introduction.',
                learned: [
                    'Key concept 1 of Backend Introduction',
                    'Key concept 2 of Backend Introduction',
                    'Key concept 3 of Backend Introduction',
                ],
                skills: [
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Backend Introduction',
                        description:
                            'A follow-up topic to reinforce concepts from Backend Introduction.',
                    },
                ],
            },
        ],
        appType: 'gemini',
    },
    {
        id: 7,
        title: 'Gardening',
        sessionsCount: 4,
        lastUpdated: '2025-04-01T07:30:00Z',
        sessions: [
            {
                id: 1,
                title: 'Soil Preparation',
                completed: false,
                lastUpdated: '2025-04-01T07:35:00Z',
                summary: 'This session covered the topic of Soil Preparation.',
                learned: [
                    'Key concept 1 of Soil Preparation',
                    'Key concept 2 of Soil Preparation',
                    'Key concept 3 of Soil Preparation',
                ],
                skills: [
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Soil Preparation',
                        description:
                            'A follow-up topic to reinforce concepts from Soil Preparation.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Planting Basics',
                completed: true,
                lastUpdated: '2025-04-01T07:40:00Z',
                summary: 'This session covered the topic of Planting Basics.',
                learned: [
                    'Key concept 1 of Planting Basics',
                    'Key concept 2 of Planting Basics',
                    'Key concept 3 of Planting Basics',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Planting Basics',
                        description:
                            'A follow-up topic to reinforce concepts from Planting Basics.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Watering Techniques',
                completed: false,
                lastUpdated: '2025-04-01T07:45:00Z',
                summary: 'This session covered the topic of Watering Techniques.',
                learned: [
                    'Key concept 1 of Watering Techniques',
                    'Key concept 2 of Watering Techniques',
                    'Key concept 3 of Watering Techniques',
                ],
                skills: [
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Watering Techniques',
                        description:
                            'A follow-up topic to reinforce concepts from Watering Techniques.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Garden Maintenance',
                completed: false,
                lastUpdated: '2025-04-01T07:50:00Z',
                summary: 'This session covered the topic of Garden Maintenance.',
                learned: [
                    'Key concept 1 of Garden Maintenance',
                    'Key concept 2 of Garden Maintenance',
                    'Key concept 3 of Garden Maintenance',
                ],
                skills: [
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Garden Maintenance',
                        description:
                            'A follow-up topic to reinforce concepts from Garden Maintenance.',
                    },
                ],
            },
        ],
        appType: 'gemini',
    },
    {
        id: 8,
        title: 'Cooking',
        sessionsCount: 6,
        lastUpdated: '2025-03-31T16:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'Knife Skills',
                completed: true,
                lastUpdated: '2025-03-31T16:05:00Z',
                summary: 'This session covered the topic of Knife Skills.',
                learned: [
                    'Key concept 1 of Knife Skills',
                    'Key concept 2 of Knife Skills',
                    'Key concept 3 of Knife Skills',
                ],
                skills: [
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Knife Skills',
                        description: 'A follow-up topic to reinforce concepts from Knife Skills.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Basic Sauces',
                completed: true,
                lastUpdated: '2025-03-31T16:10:00Z',
                summary: 'This session covered the topic of Basic Sauces.',
                learned: [
                    'Key concept 1 of Basic Sauces',
                    'Key concept 2 of Basic Sauces',
                    'Key concept 3 of Basic Sauces',
                ],
                skills: [
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Basic Sauces',
                        description: 'A follow-up topic to reinforce concepts from Basic Sauces.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Baking Fundamentals',
                completed: true,
                lastUpdated: '2025-03-31T16:15:00Z',
                summary: 'This session covered the topic of Baking Fundamentals.',
                learned: [
                    'Key concept 1 of Baking Fundamentals',
                    'Key concept 2 of Baking Fundamentals',
                    'Key concept 3 of Baking Fundamentals',
                ],
                skills: [
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Baking Fundamentals',
                        description:
                            'A follow-up topic to reinforce concepts from Baking Fundamentals.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Stir Fry Techniques',
                completed: false,
                lastUpdated: '2025-03-31T16:20:00Z',
                summary: 'This session covered the topic of Stir Fry Techniques.',
                learned: [
                    'Key concept 1 of Stir Fry Techniques',
                    'Key concept 2 of Stir Fry Techniques',
                    'Key concept 3 of Stir Fry Techniques',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Stir Fry Techniques',
                        description:
                            'A follow-up topic to reinforce concepts from Stir Fry Techniques.',
                    },
                ],
            },
            {
                id: 5,
                title: 'Roasting',
                completed: false,
                lastUpdated: '2025-03-31T16:25:00Z',
                summary: 'This session covered the topic of Roasting.',
                learned: [
                    'Key concept 1 of Roasting',
                    'Key concept 2 of Roasting',
                    'Key concept 3 of Roasting',
                ],
                skills: [
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Roasting',
                        description: 'A follow-up topic to reinforce concepts from Roasting.',
                    },
                ],
            },
            {
                id: 6,
                title: 'Dessert Preparation',
                completed: false,
                lastUpdated: '2025-03-31T16:30:00Z',
                summary: 'This session covered the topic of Dessert Preparation.',
                learned: [
                    'Key concept 1 of Dessert Preparation',
                    'Key concept 2 of Dessert Preparation',
                    'Key concept 3 of Dessert Preparation',
                ],
                skills: [
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Dessert Preparation',
                        description:
                            'A follow-up topic to reinforce concepts from Dessert Preparation.',
                    },
                ],
            },
        ],
        appType: 'gemini',
    },
    {
        id: 9,
        title: 'Music Theory',
        sessionsCount: 5,
        lastUpdated: '2025-03-26T10:30:00Z',
        sessions: [
            {
                id: 1,
                title: 'Introduction to Music',
                completed: true,
                lastUpdated: '2025-03-26T10:35:00Z',
                summary: 'This session covered the topic of Introduction to Music.',
                learned: [
                    'Key concept 1 of Introduction to Music',
                    'Key concept 2 of Introduction to Music',
                    'Key concept 3 of Introduction to Music',
                ],
                skills: [
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Introduction to Music',
                        description:
                            'A follow-up topic to reinforce concepts from Introduction to Music.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Scales and Modes',
                completed: false,
                lastUpdated: '2025-03-26T10:40:00Z',
                summary: 'This session covered the topic of Scales and Modes.',
                learned: [
                    'Key concept 1 of Scales and Modes',
                    'Key concept 2 of Scales and Modes',
                    'Key concept 3 of Scales and Modes',
                ],
                skills: [
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Scales and Modes',
                        description:
                            'A follow-up topic to reinforce concepts from Scales and Modes.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Chord Progressions',
                completed: false,
                lastUpdated: '2025-03-26T10:45:00Z',
                summary: 'This session covered the topic of Chord Progressions.',
                learned: [
                    'Key concept 1 of Chord Progressions',
                    'Key concept 2 of Chord Progressions',
                    'Key concept 3 of Chord Progressions',
                ],
                skills: [
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Chord Progressions',
                        description:
                            'A follow-up topic to reinforce concepts from Chord Progressions.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Rhythm and Meter',
                completed: false,
                lastUpdated: '2025-03-26T10:50:00Z',
                summary: 'This session covered the topic of Rhythm and Meter.',
                learned: [
                    'Key concept 1 of Rhythm and Meter',
                    'Key concept 2 of Rhythm and Meter',
                    'Key concept 3 of Rhythm and Meter',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Rhythm and Meter',
                        description:
                            'A follow-up topic to reinforce concepts from Rhythm and Meter.',
                    },
                ],
            },
            {
                id: 5,
                title: 'Harmonization',
                completed: true,
                lastUpdated: '2025-03-26T10:55:00Z',
                summary: 'This session covered the topic of Harmonization.',
                learned: [
                    'Key concept 1 of Harmonization',
                    'Key concept 2 of Harmonization',
                    'Key concept 3 of Harmonization',
                ],
                skills: [
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Harmonization',
                        description: 'A follow-up topic to reinforce concepts from Harmonization.',
                    },
                ],
            },
        ],
        appType: 'claude',
    },
    {
        id: 10,
        title: 'Digital Marketing',
        sessionsCount: 4,
        lastUpdated: '2025-03-25T12:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'SEO Basics',
                completed: true,
                lastUpdated: '2025-03-25T12:05:00Z',
                summary: 'This session covered the topic of SEO Basics.',
                learned: [
                    'Key concept 1 of SEO Basics',
                    'Key concept 2 of SEO Basics',
                    'Key concept 3 of SEO Basics',
                ],
                skills: [
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after SEO Basics',
                        description: 'A follow-up topic to reinforce concepts from SEO Basics.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Social Media Strategies',
                completed: true,
                lastUpdated: '2025-03-25T12:10:00Z',
                summary: 'This session covered the topic of Social Media Strategies.',
                learned: [
                    'Key concept 1 of Social Media Strategies',
                    'Key concept 2 of Social Media Strategies',
                    'Key concept 3 of Social Media Strategies',
                ],
                skills: [
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Social Media Strategies',
                        description:
                            'A follow-up topic to reinforce concepts from Social Media Strategies.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Content Marketing',
                completed: false,
                lastUpdated: '2025-03-25T12:15:00Z',
                summary: 'This session covered the topic of Content Marketing.',
                learned: [
                    'Key concept 1 of Content Marketing',
                    'Key concept 2 of Content Marketing',
                    'Key concept 3 of Content Marketing',
                ],
                skills: [
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Content Marketing',
                        description:
                            'A follow-up topic to reinforce concepts from Content Marketing.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Email Campaigns',
                completed: false,
                lastUpdated: '2025-03-25T12:20:00Z',
                summary: 'This session covered the topic of Email Campaigns.',
                learned: [
                    'Key concept 1 of Email Campaigns',
                    'Key concept 2 of Email Campaigns',
                    'Key concept 3 of Email Campaigns',
                ],
                skills: [
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Email Campaigns',
                        description:
                            'A follow-up topic to reinforce concepts from Email Campaigns.',
                    },
                ],
            },
        ],
        appType: 'chatGPT',
    },
    {
        id: 11,
        title: 'Photography',
        sessionsCount: 4,
        lastUpdated: '2025-04-01T13:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'Camera Settings',
                completed: false,
                lastUpdated: '2025-04-01T13:05:00Z',
                summary: 'This session covered the topic of Camera Settings.',
                learned: [
                    'Key concept 1 of Camera Settings',
                    'Key concept 2 of Camera Settings',
                    'Key concept 3 of Camera Settings',
                ],
                skills: [
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Camera Settings',
                        description:
                            'A follow-up topic to reinforce concepts from Camera Settings.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Composition Techniques',
                completed: true,
                lastUpdated: '2025-04-01T13:10:00Z',
                summary: 'This session covered the topic of Composition Techniques.',
                learned: [
                    'Key concept 1 of Composition Techniques',
                    'Key concept 2 of Composition Techniques',
                    'Key concept 3 of Composition Techniques',
                ],
                skills: [
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Composition Techniques',
                        description:
                            'A follow-up topic to reinforce concepts from Composition Techniques.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Lighting Fundamentals',
                completed: false,
                lastUpdated: '2025-04-01T13:15:00Z',
                summary: 'This session covered the topic of Lighting Fundamentals.',
                learned: [
                    'Key concept 1 of Lighting Fundamentals',
                    'Key concept 2 of Lighting Fundamentals',
                    'Key concept 3 of Lighting Fundamentals',
                ],
                skills: [
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Lighting Fundamentals',
                        description:
                            'A follow-up topic to reinforce concepts from Lighting Fundamentals.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Editing Tips',
                completed: false,
                lastUpdated: '2025-04-01T13:20:00Z',
                summary: 'This session covered the topic of Editing Tips.',
                learned: [
                    'Key concept 1 of Editing Tips',
                    'Key concept 2 of Editing Tips',
                    'Key concept 3 of Editing Tips',
                ],
                skills: [
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Editing Tips',
                        description: 'A follow-up topic to reinforce concepts from Editing Tips.',
                    },
                ],
            },
        ],
        appType: 'gemini',
    },
    {
        id: 12,
        title: 'Fitness Training',
        sessionsCount: 6,
        lastUpdated: '2025-03-30T20:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'Warm-up and Stretching',
                completed: true,
                lastUpdated: '2025-03-30T20:05:00Z',
                summary: 'This session covered the topic of Warm-up and Stretching.',
                learned: [
                    'Key concept 1 of Warm-up and Stretching',
                    'Key concept 2 of Warm-up and Stretching',
                    'Key concept 3 of Warm-up and Stretching',
                ],
                skills: [
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Warm-up and Stretching',
                        description:
                            'A follow-up topic to reinforce concepts from Warm-up and Stretching.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Cardio Basics',
                completed: false,
                lastUpdated: '2025-03-30T20:10:00Z',
                summary: 'This session covered the topic of Cardio Basics.',
                learned: [
                    'Key concept 1 of Cardio Basics',
                    'Key concept 2 of Cardio Basics',
                    'Key concept 3 of Cardio Basics',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Cardio Basics',
                        description: 'A follow-up topic to reinforce concepts from Cardio Basics.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Strength Training',
                completed: false,
                lastUpdated: '2025-03-30T20:15:00Z',
                summary: 'This session covered the topic of Strength Training.',
                learned: [
                    'Key concept 1 of Strength Training',
                    'Key concept 2 of Strength Training',
                    'Key concept 3 of Strength Training',
                ],
                skills: [
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Strength Training',
                        description:
                            'A follow-up topic to reinforce concepts from Strength Training.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Flexibility and Balance',
                completed: false,
                lastUpdated: '2025-03-30T20:20:00Z',
                summary: 'This session covered the topic of Flexibility and Balance.',
                learned: [
                    'Key concept 1 of Flexibility and Balance',
                    'Key concept 2 of Flexibility and Balance',
                    'Key concept 3 of Flexibility and Balance',
                ],
                skills: [
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Flexibility and Balance',
                        description:
                            'A follow-up topic to reinforce concepts from Flexibility and Balance.',
                    },
                ],
            },
            {
                id: 5,
                title: 'Nutrition Essentials',
                completed: false,
                lastUpdated: '2025-03-30T20:25:00Z',
                summary: 'This session covered the topic of Nutrition Essentials.',
                learned: [
                    'Key concept 1 of Nutrition Essentials',
                    'Key concept 2 of Nutrition Essentials',
                    'Key concept 3 of Nutrition Essentials',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Nutrition Essentials',
                        description:
                            'A follow-up topic to reinforce concepts from Nutrition Essentials.',
                    },
                ],
            },
            {
                id: 6,
                title: 'Cool Down',
                completed: false,
                lastUpdated: '2025-03-30T20:30:00Z',
                summary: 'This session covered the topic of Cool Down.',
                learned: [
                    'Key concept 1 of Cool Down',
                    'Key concept 2 of Cool Down',
                    'Key concept 3 of Cool Down',
                ],
                skills: [
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Cool Down',
                        description: 'A follow-up topic to reinforce concepts from Cool Down.',
                    },
                ],
            },
        ],
        appType: 'chatGPT',
    },
    {
        id: 13,
        title: 'Art History',
        sessionsCount: 4,
        lastUpdated: '2025-03-28T09:30:00Z',
        sessions: [
            {
                id: 1,
                title: 'Prehistoric Art',
                completed: false,
                lastUpdated: '2025-03-28T09:35:00Z',
                summary: 'This session covered the topic of Prehistoric Art.',
                learned: [
                    'Key concept 1 of Prehistoric Art',
                    'Key concept 2 of Prehistoric Art',
                    'Key concept 3 of Prehistoric Art',
                ],
                skills: [
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Prehistoric Art',
                        description:
                            'A follow-up topic to reinforce concepts from Prehistoric Art.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Ancient Art',
                completed: true,
                lastUpdated: '2025-03-28T09:40:00Z',
                summary: 'This session covered the topic of Ancient Art.',
                learned: [
                    'Key concept 1 of Ancient Art',
                    'Key concept 2 of Ancient Art',
                    'Key concept 3 of Ancient Art',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Ancient Art',
                        description: 'A follow-up topic to reinforce concepts from Ancient Art.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Renaissance Art',
                completed: false,
                lastUpdated: '2025-03-28T09:45:00Z',
                summary: 'This session covered the topic of Renaissance Art.',
                learned: [
                    'Key concept 1 of Renaissance Art',
                    'Key concept 2 of Renaissance Art',
                    'Key concept 3 of Renaissance Art',
                ],
                skills: [
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Renaissance Art',
                        description:
                            'A follow-up topic to reinforce concepts from Renaissance Art.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Modern Art',
                completed: false,
                lastUpdated: '2025-03-28T09:50:00Z',
                summary: 'This session covered the topic of Modern Art.',
                learned: [
                    'Key concept 1 of Modern Art',
                    'Key concept 2 of Modern Art',
                    'Key concept 3 of Modern Art',
                ],
                skills: [
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Modern Art',
                        description: 'A follow-up topic to reinforce concepts from Modern Art.',
                    },
                ],
            },
        ],
        appType: 'claude',
    },
    {
        id: 14,
        title: 'Data Science',
        sessionsCount: 5,
        lastUpdated: '2025-03-31T15:45:00Z',
        sessions: [
            {
                id: 1,
                title: 'Introduction to Data Science',
                completed: true,
                lastUpdated: '2025-03-31T15:50:00Z',
                summary: 'This session covered the topic of Introduction to Data Science.',
                learned: [
                    'Key concept 1 of Introduction to Data Science',
                    'Key concept 2 of Introduction to Data Science',
                    'Key concept 3 of Introduction to Data Science',
                ],
                skills: [
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Introduction to Data Science',
                        description:
                            'A follow-up topic to reinforce concepts from Introduction to Data Science.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Statistics Basics',
                completed: false,
                lastUpdated: '2025-03-31T15:55:00Z',
                summary: 'This session covered the topic of Statistics Basics.',
                learned: [
                    'Key concept 1 of Statistics Basics',
                    'Key concept 2 of Statistics Basics',
                    'Key concept 3 of Statistics Basics',
                ],
                skills: [
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Statistics Basics',
                        description:
                            'A follow-up topic to reinforce concepts from Statistics Basics.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Python for Data Science',
                completed: false,
                lastUpdated: '2025-03-31T16:00:00Z',
                summary: 'This session covered the topic of Python for Data Science.',
                learned: [
                    'Key concept 1 of Python for Data Science',
                    'Key concept 2 of Python for Data Science',
                    'Key concept 3 of Python for Data Science',
                ],
                skills: [
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Python for Data Science',
                        description:
                            'A follow-up topic to reinforce concepts from Python for Data Science.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Data Visualization',
                completed: false,
                lastUpdated: '2025-03-31T16:05:00Z',
                summary: 'This session covered the topic of Data Visualization.',
                learned: [
                    'Key concept 1 of Data Visualization',
                    'Key concept 2 of Data Visualization',
                    'Key concept 3 of Data Visualization',
                ],
                skills: [
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Data Visualization',
                        description:
                            'A follow-up topic to reinforce concepts from Data Visualization.',
                    },
                ],
            },
            {
                id: 5,
                title: 'Machine Learning Overview',
                completed: false,
                lastUpdated: '2025-03-31T16:10:00Z',
                summary: 'This session covered the topic of Machine Learning Overview.',
                learned: [
                    'Key concept 1 of Machine Learning Overview',
                    'Key concept 2 of Machine Learning Overview',
                    'Key concept 3 of Machine Learning Overview',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Machine Learning Overview',
                        description:
                            'A follow-up topic to reinforce concepts from Machine Learning Overview.',
                    },
                ],
            },
        ],
        appType: 'chatGPT',
    },
    {
        id: 15,
        title: 'Public Speaking',
        sessionsCount: 4,
        lastUpdated: '2025-03-29T18:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'Overcoming Stage Fright',
                completed: false,
                lastUpdated: '2025-03-29T18:05:00Z',
                summary: 'This session covered the topic of Overcoming Stage Fright.',
                learned: [
                    'Key concept 1 of Overcoming Stage Fright',
                    'Key concept 2 of Overcoming Stage Fright',
                    'Key concept 3 of Overcoming Stage Fright',
                ],
                skills: [
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Overcoming Stage Fright',
                        description:
                            'A follow-up topic to reinforce concepts from Overcoming Stage Fright.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Speech Structure',
                completed: false,
                lastUpdated: '2025-03-29T18:10:00Z',
                summary: 'This session covered the topic of Speech Structure.',
                learned: [
                    'Key concept 1 of Speech Structure',
                    'Key concept 2 of Speech Structure',
                    'Key concept 3 of Speech Structure',
                ],
                skills: [
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Speech Structure',
                        description:
                            'A follow-up topic to reinforce concepts from Speech Structure.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Engaging Your Audience',
                completed: false,
                lastUpdated: '2025-03-29T18:15:00Z',
                summary: 'This session covered the topic of Engaging Your Audience.',
                learned: [
                    'Key concept 1 of Engaging Your Audience',
                    'Key concept 2 of Engaging Your Audience',
                    'Key concept 3 of Engaging Your Audience',
                ],
                skills: [
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Engaging Your Audience',
                        description:
                            'A follow-up topic to reinforce concepts from Engaging Your Audience.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Using Visual Aids',
                completed: false,
                lastUpdated: '2025-03-29T18:20:00Z',
                summary: 'This session covered the topic of Using Visual Aids.',
                learned: [
                    'Key concept 1 of Using Visual Aids',
                    'Key concept 2 of Using Visual Aids',
                    'Key concept 3 of Using Visual Aids',
                ],
                skills: [
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Using Visual Aids',
                        description:
                            'A follow-up topic to reinforce concepts from Using Visual Aids.',
                    },
                ],
            },
        ],
        appType: 'gemini',
    },
    {
        id: 16,
        title: 'Creative Writing',
        sessionsCount: 6,
        lastUpdated: '2025-03-27T17:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'Generating Ideas',
                completed: true,
                lastUpdated: '2025-03-27T17:05:00Z',
                summary: 'This session covered the topic of Generating Ideas.',
                learned: [
                    'Key concept 1 of Generating Ideas',
                    'Key concept 2 of Generating Ideas',
                    'Key concept 3 of Generating Ideas',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Generating Ideas',
                        description:
                            'A follow-up topic to reinforce concepts from Generating Ideas.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Character Development',
                completed: false,
                lastUpdated: '2025-03-27T17:10:00Z',
                summary: 'This session covered the topic of Character Development.',
                learned: [
                    'Key concept 1 of Character Development',
                    'Key concept 2 of Character Development',
                    'Key concept 3 of Character Development',
                ],
                skills: [
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Character Development',
                        description:
                            'A follow-up topic to reinforce concepts from Character Development.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Setting and World Building',
                completed: false,
                lastUpdated: '2025-03-27T17:15:00Z',
                summary: 'This session covered the topic of Setting and World Building.',
                learned: [
                    'Key concept 1 of Setting and World Building',
                    'Key concept 2 of Setting and World Building',
                    'Key concept 3 of Setting and World Building',
                ],
                skills: [
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Setting and World Building',
                        description:
                            'A follow-up topic to reinforce concepts from Setting and World Building.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Dialogue Writing',
                completed: false,
                lastUpdated: '2025-03-27T17:20:00Z',
                summary: 'This session covered the topic of Dialogue Writing.',
                learned: [
                    'Key concept 1 of Dialogue Writing',
                    'Key concept 2 of Dialogue Writing',
                    'Key concept 3 of Dialogue Writing',
                ],
                skills: [
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Dialogue Writing',
                        description:
                            'A follow-up topic to reinforce concepts from Dialogue Writing.',
                    },
                ],
            },
            {
                id: 5,
                title: 'Editing and Revising',
                completed: false,
                lastUpdated: '2025-03-27T17:25:00Z',
                summary: 'This session covered the topic of Editing and Revising.',
                learned: [
                    'Key concept 1 of Editing and Revising',
                    'Key concept 2 of Editing and Revising',
                    'Key concept 3 of Editing and Revising',
                ],
                skills: [
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Editing and Revising',
                        description:
                            'A follow-up topic to reinforce concepts from Editing and Revising.',
                    },
                ],
            },
            {
                id: 6,
                title: 'Publishing Basics',
                completed: false,
                lastUpdated: '2025-03-27T17:30:00Z',
                summary: 'This session covered the topic of Publishing Basics.',
                learned: [
                    'Key concept 1 of Publishing Basics',
                    'Key concept 2 of Publishing Basics',
                    'Key concept 3 of Publishing Basics',
                ],
                skills: [
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Publishing Basics',
                        description:
                            'A follow-up topic to reinforce concepts from Publishing Basics.',
                    },
                ],
            },
        ],
        appType: 'claude',
    },
    {
        id: 17,
        title: 'Personal Finance',
        sessionsCount: 5,
        lastUpdated: '2025-03-26T21:00:00Z',
        sessions: [
            {
                id: 1,
                title: 'Budgeting Basics',
                completed: true,
                lastUpdated: '2025-03-26T21:05:00Z',
                summary: 'This session covered the topic of Budgeting Basics.',
                learned: [
                    'Key concept 1 of Budgeting Basics',
                    'Key concept 2 of Budgeting Basics',
                    'Key concept 3 of Budgeting Basics',
                ],
                skills: [
                    {
                        title: 'Critical Thinking',
                        description: 'Applying logic and analysis to solve problems.',
                    },
                    {
                        title: 'Research Skills',
                        description: 'Finding and using information effectively.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Budgeting Basics',
                        description:
                            'A follow-up topic to reinforce concepts from Budgeting Basics.',
                    },
                ],
            },
            {
                id: 2,
                title: 'Understanding Credit',
                completed: false,
                lastUpdated: '2025-03-26T21:10:00Z',
                summary: 'This session covered the topic of Understanding Credit.',
                learned: [
                    'Key concept 1 of Understanding Credit',
                    'Key concept 2 of Understanding Credit',
                    'Key concept 3 of Understanding Credit',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Creativity',
                        description: 'Generating original ideas and solutions.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Understanding Credit',
                        description:
                            'A follow-up topic to reinforce concepts from Understanding Credit.',
                    },
                ],
            },
            {
                id: 3,
                title: 'Investing 101',
                completed: false,
                lastUpdated: '2025-03-26T21:15:00Z',
                summary: 'This session covered the topic of Investing 101.',
                learned: [
                    'Key concept 1 of Investing 101',
                    'Key concept 2 of Investing 101',
                    'Key concept 3 of Investing 101',
                ],
                skills: [
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Investing 101',
                        description: 'A follow-up topic to reinforce concepts from Investing 101.',
                    },
                ],
            },
            {
                id: 4,
                title: 'Saving Strategies',
                completed: false,
                lastUpdated: '2025-03-26T21:20:00Z',
                summary: 'This session covered the topic of Saving Strategies.',
                learned: [
                    'Key concept 1 of Saving Strategies',
                    'Key concept 2 of Saving Strategies',
                    'Key concept 3 of Saving Strategies',
                ],
                skills: [
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Communication',
                        description: 'Explaining ideas clearly and effectively.',
                    },
                    {
                        title: 'Problem Solving',
                        description: 'Strategically addressing challenges.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Saving Strategies',
                        description:
                            'A follow-up topic to reinforce concepts from Saving Strategies.',
                    },
                ],
            },
            {
                id: 5,
                title: 'Debt Management',
                completed: false,
                lastUpdated: '2025-03-26T21:25:00Z',
                summary: 'This session covered the topic of Debt Management.',
                learned: [
                    'Key concept 1 of Debt Management',
                    'Key concept 2 of Debt Management',
                    'Key concept 3 of Debt Management',
                ],
                skills: [
                    {
                        title: 'Numeracy',
                        description: 'Understanding of numbers and mathematical reasoning.',
                    },
                    {
                        title: 'Visual Thinking',
                        description: 'Using diagrams and visuals to enhance understanding.',
                    },
                    {
                        title: 'Collaboration',
                        description: 'Working well in group settings.',
                    },
                    {
                        title: 'Focus & Attention',
                        description: 'Sustaining concentration on tasks.',
                    },
                    {
                        title: 'Technical Skills',
                        description: 'Using tools and technology proficiently.',
                    },
                ],
                nextSteps: [
                    {
                        title: 'Next step after Debt Management',
                        description:
                            'A follow-up topic to reinforce concepts from Debt Management.',
                    },
                ],
            },
        ],
        appType: 'chatGPT',
    },
];

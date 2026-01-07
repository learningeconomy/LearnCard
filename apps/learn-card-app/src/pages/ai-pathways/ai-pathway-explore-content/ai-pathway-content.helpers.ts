export type AiPathwayContent = {
    id?: number;
    title?: string;
    description?: string;
    source?: string;
    url?: string;
};

export const AI_PATHWAY_CONTENT: AiPathwayContent[] = [
    {
        id: 1,
        title: 'Javascript Beginners Course',
        description: 'Learn the fundamentals of Javascript programming',
        source: 'YouTube',
        url: 'https://www.youtube.com/watch?v=x2RNw4M6cME',
    },
    {
        id: 2,
        title: 'React Native Reanimated Course',
        description: 'Learn the fundamentals of React Native Reanimated programming',
        source: 'YouTube',
        url: 'https://www.youtube.com/watch?v=Wr2fOM_xD2I',
    },
];

export type AiTopicItem = {
    id: number;
    name: string;
    count: number;
};

export const TOPICS_DUMMY_DATA: AiTopicItem[] = [
    {
        id: 1,
        name: 'fractions',
        count: 22,
    },
    {
        id: 2,
        name: 'creative writing',
        count: 18,
    },
    {
        id: 3,
        name: 'world history',
        count: 16,
    },
    {
        id: 4,
        name: 'woodworking',
        count: 4,
    },
];

export enum AiSessionsSortOptionsEnum {
    newlyAdded = 'newlyAdded',
    recentlyOpened = 'recentlyOpened',
    mostSessions = 'mostSessions',
    alphabetical = 'alphabetical',
}

export enum AiSessionsFilterOptionsEnum {
    showAll = 'showAll',
    completed = 'completed',
    unfinished = 'unfinished',
}

export enum AiFilteringTypes {
    sessions = 'sessions',
    topics = 'topics',
}

export type AiSessionsSortOption = {
    id: number;
    title: string;
    type: AiSessionsSortOptionsEnum;
};

export type AiSessionsFilterOption = Omit<AiSessionsSortOption, 'type'> & {
    type: AiSessionsFilterOptionsEnum;
};

export const AI_SESSIONS_SORT_OPTIONS: AiSessionsSortOption[] = [
    {
        id: 1,
        title: 'Newly Added',
        type: AiSessionsSortOptionsEnum.newlyAdded,
    },
    {
        id: 2,
        title: 'Recently Opened ',
        type: AiSessionsSortOptionsEnum.recentlyOpened,
    },
    {
        id: 3,
        title: 'Most Sessions',
        type: AiSessionsSortOptionsEnum.mostSessions,
    },
    {
        id: 4,
        title: 'Alphabetically',
        type: AiSessionsSortOptionsEnum.alphabetical,
    },
];

export const AI_SESSIONS_FILTER_OPTIONS: AiSessionsFilterOption[] = [
    {
        id: 1,
        title: 'Show All Sessions',
        type: AiSessionsFilterOptionsEnum.showAll,
    },
    {
        id: 2,
        title: 'Only Completed Sessions',
        type: AiSessionsFilterOptionsEnum.completed,
    },
    {
        id: 3,
        title: 'Only Unfinished Sessions',
        type: AiSessionsFilterOptionsEnum.unfinished,
    },
];

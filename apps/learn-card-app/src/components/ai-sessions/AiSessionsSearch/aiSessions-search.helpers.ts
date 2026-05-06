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
        title: 'Most Recent',
        type: AiSessionsSortOptionsEnum.newlyAdded,
    },
    {
        id: 2,
        title: 'A-Z',
        type: AiSessionsSortOptionsEnum.alphabetical,
    },
];

export const AI_SESSIONS_FILTER_OPTIONS: AiSessionsFilterOption[] = [
    {
        id: 1,
        title: 'All',
        type: AiSessionsFilterOptionsEnum.showAll,
    },
    {
        id: 2,
        title: 'Unfinished',
        type: AiSessionsFilterOptionsEnum.unfinished,
    },
];

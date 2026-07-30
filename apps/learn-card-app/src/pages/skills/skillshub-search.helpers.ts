export enum SkillsHubSortOptionsEnum {
    alphabetical = 'alphabetical',
    recentlyAdded = 'recentlyAdded',
}

export enum SkillsHubFilterOptionsEnum {
    all = 'all',
}

// Can be "all" or a specific frameworkId string
export type SkillsHubFilterValue = SkillsHubFilterOptionsEnum | string;

export type SkillsHubSortOption = {
    id: number;
    title: string;
    buttonText: string;
    type: SkillsHubSortOptionsEnum;
};

export type SkillsHubFilterOption = Omit<SkillsHubSortOption, 'type' | 'buttonText'> & {
    type: SkillsHubFilterOptionsEnum;
};

export const SKILLSHUB_SORT_OPTIONS: SkillsHubSortOption[] = [
    {
        id: 1,
        title: 'Recently Added',
        buttonText: 'RECENT',
        type: SkillsHubSortOptionsEnum.recentlyAdded,
    },
    {
        id: 2,
        title: 'Alphabetically',
        buttonText: 'A-Z',
        type: SkillsHubSortOptionsEnum.alphabetical,
    },
];

export const SKILLSHUB_FILTER_OPTIONS: SkillsHubFilterOption[] = [
    {
        id: 1,
        title: 'Show All Frameworks',
        type: SkillsHubFilterOptionsEnum.all,
    },
];

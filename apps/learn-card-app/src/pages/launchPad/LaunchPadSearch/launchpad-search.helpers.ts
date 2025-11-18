export enum LaunchPadSortOptionsEnum {
    featuredBy = 'featuredBy',
    mostUsed = 'mostUsed',
    alphabetical = 'alphabetical',
    recentlyAdded = 'recentlyAdded',
}

export enum LaunchPadFilterOptionsEnum {
    allApps = 'allApps',
    myApps = 'myApps',
    unConnectedApps = 'unconnectedApps',
}

export type LaunchPadSortOption = {
    id: number;
    title: string;
    type: LaunchPadSortOptionsEnum;
};

export type LaunchPadFilterOption = Omit<LaunchPadSortOption, 'type'> & {
    type: LaunchPadFilterOptionsEnum;
};

export const LAUNCHPAD_SORT_OPTIONS: LaunchPadSortOption[] = [
    {
        id: 1,
        title: 'Featured',
        type: LaunchPadSortOptionsEnum.featuredBy,
    },
    {
        id: 2,
        title: 'Most Used',
        type: LaunchPadSortOptionsEnum.mostUsed,
    },
    {
        id: 3,
        title: 'A-Z',
        type: LaunchPadSortOptionsEnum.alphabetical,
    },
    {
        id: 4,
        title: 'Recently Added',
        type: LaunchPadSortOptionsEnum.recentlyAdded,
    },
];

export const LAUNCHPAD_FILTER_OPTIONS: LaunchPadFilterOption[] = [
    {
        id: 1,
        title: 'Show All Apps',
        type: LaunchPadFilterOptionsEnum.allApps,
    },
    {
        id: 2,
        title: 'Only My Apps',
        type: LaunchPadFilterOptionsEnum.myApps,
    },
    {
        id: 3,
        title: 'Only Unconnected Apps',
        type: LaunchPadFilterOptionsEnum.unConnectedApps,
    },
];

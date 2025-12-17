export enum BoostTemplateSortOptionsEnum {
    recentlyAdded = 'recentlyAdded',
    alphabetical = 'alphabetical',
}

export enum BoostTemplateFilterOptionsEnum {
    showAll = 'showAll',
    myTemplates = 'myTemplates',
    learnCardTemplates = 'learnCardTemplates',
}

export type BoostTemplateSortOption = {
    id: number;
    title: string;
    type: BoostTemplateSortOptionsEnum;
};

export type BoostTemplateFilterOption = Omit<BoostTemplateSortOption, 'type'> & {
    type: BoostTemplateFilterOptionsEnum;
};

export const BOOST_TEMPLATE_SORT_OPTIONS: BoostTemplateSortOption[] = [
    {
        id: 1,
        title: 'Sort by Recently Added',
        type: BoostTemplateSortOptionsEnum.recentlyAdded,
    },
    {
        id: 2,
        title: 'Sort Alphabetically',
        type: BoostTemplateSortOptionsEnum.alphabetical,
    },
];

export const BOOST_TEMPLATE_FILTER_OPTIONS: BoostTemplateFilterOption[] = [
    {
        id: 1,
        title: 'Show All Templates',
        type: BoostTemplateFilterOptionsEnum.showAll,
    },
    {
        id: 2,
        title: 'Only My Templates',
        type: BoostTemplateFilterOptionsEnum.myTemplates,
    },
    {
        id: 3,
        title: 'Only LearnCard Templates',
        type: BoostTemplateFilterOptionsEnum.learnCardTemplates,
    },
];

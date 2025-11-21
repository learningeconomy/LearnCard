import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import {
    BoostCategoryOptionsEnum,
    CATEGORY_TO_SUBCATEGORY_LIST,
} from '../boost-options/boostOptions';

export enum BadgePackOptionsEnum {
    scoutpass = 'scoutpass',
    local = 'local',
    troop = 'troop',
    network = 'network',
}

export type BadgePackOption = {
    name: string;
    color: string;
    type: BadgePackOptionsEnum;
    id: string;
};
export const badgePackOptions: BadgePackOption[] = [
    {
        name: 'ScoutPass',
        color: '#4B9F5C',
        type: BadgePackOptionsEnum.scoutpass,
        id: BadgePackOptionsEnum.scoutpass,
    },
    {
        name: 'Local',
        color: '#FF5655',
        type: BadgePackOptionsEnum.local,
        id: BadgePackOptionsEnum.local,
    },
];

export const boostPackOptions: BadgePackOption[] = [
    {
        name: 'ScoutPass',
        color: '#4B9F5C',
        type: BadgePackOptionsEnum.scoutpass,
        id: BadgePackOptionsEnum.scoutpass,
    },
];

export const defaultBadgePacks = {
    [BadgePackOptionsEnum.scoutpass]: CATEGORY_TO_SUBCATEGORY_LIST?.[
        BoostCategoryOptionsEnum.meritBadge
    ].slice(0, 7),
    [BadgePackOptionsEnum.local]:
        CATEGORY_TO_SUBCATEGORY_LIST?.[BoostCategoryOptionsEnum.meritBadge].slice(-3),
};

export const badgePacks = {
    [BadgePackOptionsEnum.scoutpass]: CATEGORY_TO_SUBCATEGORY_LIST?.[
        BoostCategoryOptionsEnum.meritBadge
    ].slice(0, 7),
    [BadgePackOptionsEnum.local]:
        CATEGORY_TO_SUBCATEGORY_LIST?.[BoostCategoryOptionsEnum.meritBadge].slice(-3),
};

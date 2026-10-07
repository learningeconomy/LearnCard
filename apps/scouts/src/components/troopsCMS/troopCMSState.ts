import { BoostCategoryOptionsEnum } from 'learn-card-base';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';

import { GreenScoutsPledge2 } from 'learn-card-base/svgs/ScoutsPledge2';
import { ScoutsNetworkTent } from 'learn-card-base/svgs/ScoutsNetworkTent';
import ScoutsLogo from '../svgs/ScoutsLogo';

import { BoostCMSAppearanceDisplayTypeEnum } from 'learn-card-base';
import { VC } from '@learncard/types';
import { TroopsAppearanceTabs } from './TroopsCMSAppearanceForm/TroopsCMSAppearanceTabs';
import * as m from '../../paraglide/messages.js';

// different editor modes the CMS can be opended in
export enum TroopsCMSEditorModeEnum {
    create = 'create',
    edit = 'edit',
}

// different modes the CMS can be opened in
export enum TroopsCMSViewModeEnum {
    global = 'global',
    network = 'network',
    leader = 'leader',
    troop = 'troop',
    member = 'member',
}

export const troopsCMSViewModeDefaults: {
    [key in TroopsCMSViewModeEnum]?: {
        titleKey: string;
        altTitle?: string;
        Icon: React.FC<{ className?: string }>;
        image: string;
        backgroundImage: string;
        color: string;
        type: TroopsCMSViewModeEnum;
    };
} = {
    [TroopsCMSViewModeEnum.global]: {
        titleKey: 'troops.globalNetworkLabel',
        altTitle: 'Global Network',
        Icon: ScoutsLogo,
        image: 'https://cdn.filestackcontent.com/0RZLXJurQmOOlSvdkENj',
        backgroundImage: 'https://cdn.filestackcontent.com/ZKexqYHQS5SSWgOOPLjl',
        color: 'sp-purple-base',
        type: TroopsCMSViewModeEnum.global,
    },
    [TroopsCMSViewModeEnum.network]: {
        titleKey: 'troops.nationalNetworkLabel',
        altTitle: 'Network',
        Icon: ScoutsNetworkTent,
        image: 'https://cdn.filestackcontent.com/yapZ1xFqTSmaDz5H5dVL',
        backgroundImage: 'https://cdn.filestackcontent.com/H815W3JUSbW9De76oZ0c',
        color: 'sp-fire-red',
        type: TroopsCMSViewModeEnum.network,
    },
    [TroopsCMSViewModeEnum.troop]: {
        titleKey: 'troops.troop',
        altTitle: 'Troop',
        Icon: GreenScoutsPledge2,
        image: 'https://cdn.filestackcontent.com/yapZ1xFqTSmaDz5H5dVL',
        backgroundImage: 'https://cdn.filestackcontent.com/NR4YvCLERFemM7tBaFLZ',
        color: 'sp-green-forest',
        type: TroopsCMSViewModeEnum.troop,
    },
    [TroopsCMSViewModeEnum.leader]: {
        titleKey: 'troops.leaderOne',
        Icon: ScoutsNetworkTent,
        image: 'https://cdn.filestackcontent.com/yapZ1xFqTSmaDz5H5dVL',
        backgroundImage: 'https://cdn.filestackcontent.com/H815W3JUSbW9De76oZ0c',
        color: 'sp-fire-red',
        type: TroopsCMSViewModeEnum.leader,
    },
    [TroopsCMSViewModeEnum.member]: {
        titleKey: 'troops.memberOne',
        Icon: GreenScoutsPledge2,
        image: 'https://cdn.filestackcontent.com/yapZ1xFqTSmaDz5H5dVL',
        backgroundImage: 'https://cdn.filestackcontent.com/NR4YvCLERFemM7tBaFLZ',
        color: 'sp-green-forest',
        type: TroopsCMSViewModeEnum.member,
    },
};

export const troopsIDDefaults: {
    [key in TroopsCMSViewModeEnum]?: {
        idThumbnail?: string;
        idBackgroundImage: string;
        idBackgroundColor?: string;
        idIssuerThumbnail?: string;
        dimIdBackgroundImage?: boolean;
        repeatIdBackgroundImage?: boolean;
        accentFontColor?: string;
        accentColor?: string;
        fontColor?: string;
        idDescription?: string;
    };
} = {
    [TroopsCMSViewModeEnum.global]: {
        // global admin
        idThumbnail: 'https://cdn.filestackcontent.com/jb78q47RQb7SnVix1qPQ',
        idBackgroundImage: 'https://cdn.filestackcontent.com/Ao7iQNOARseW04IOqoQI',
        dimIdBackgroundImage: true,
        repeatIdBackgroundImage: true,
        idBackgroundColor: '#622599',
        idIssuerThumbnail: 'https://cdn.filestackcontent.com/0RZLXJurQmOOlSvdkENj',
        fontColor: '#FFFFFF',
        accentColor: '#9FED8F',
        accentFontColor: '#18224E',
    },
    [TroopsCMSViewModeEnum.network]: {
        idThumbnail: 'https://cdn.filestackcontent.com/iN74IXWWRM63EFNhce1z',
        idBackgroundImage: 'https://cdn.filestackcontent.com/LNbpBjz7ReWEKLdalOof',
        dimIdBackgroundImage: true,
        repeatIdBackgroundImage: true,
        idBackgroundColor: '#9FED8F',
        idIssuerThumbnail: 'https://cdn.filestackcontent.com/yapZ1xFqTSmaDz5H5dVL',
        fontColor: '#18224E',
        accentColor: '#622599',
        accentFontColor: '#FFFFFF',
    },

    [TroopsCMSViewModeEnum.leader]: {
        idThumbnail: 'https://cdn.filestackcontent.com/Mxk85lcHRfi8RKxM7Jtm',
        idBackgroundImage: 'https://cdn.filestackcontent.com/EfV4xWIKRCO9akwAt9XC',
        dimIdBackgroundImage: true,
        repeatIdBackgroundImage: true,
        idBackgroundColor: '#0094B4',
        idIssuerThumbnail: 'https://cdn.filestackcontent.com/yapZ1xFqTSmaDz5H5dVL',
        fontColor: '#FFFFFF',
        accentColor: '#82E6DE',
        accentFontColor: '#18224E',
    },
    [TroopsCMSViewModeEnum.member]: {
        idThumbnail: 'https://cdn.filestackcontent.com/TSyzXLwQhi7WjAtk29pg',
        idBackgroundImage: 'https://cdn.filestackcontent.com/fhq271HSAiR7xeJYFKdT',
        dimIdBackgroundImage: true,
        repeatIdBackgroundImage: true,
        idBackgroundColor: '#248737',
        idIssuerThumbnail: 'https://cdn.filestackcontent.com/yapZ1xFqTSmaDz5H5dVL',
        fontColor: '#FFFFFF',
        accentColor: '#9FED8F',
        accentFontColor: '#18224E',
    },
};

export const getTroopsCMSViewModeDefaults = (viewMode: TroopsCMSViewModeEnum) => {
    if (viewMode) {
        return {
            ...troopsCMSViewModeDefaults[viewMode],
        };
    }

    return {
        titleKey: '',
        Icon: () => null, // default to an empty component
        image: '',
        color: '',
    };
};

export type TroopCMSBasicInfo = {
    name: number | string | null;
    description: string;
    narrative: string; // criteria narrative
    type: BoostCategoryOptionsEnum | string; // main category
    achievementType: string | null; // sub category type
    credentialExpires: boolean;
    expirationDate?: string | null;

    // ID / Group fields
    location?: string;
    issuerName?: string;
};

export type TroopCMSIssueTo = {
    profileId: string;
    did: string;
    displayName?: string;
    email?: string;
    image?: string;
    unremovable?: boolean;
};

export type TroopCMSAdmin = {
    profileId: string;
    did: string;
    displayName?: string;
    email?: string;
    image?: string;
    unremovable?: boolean;
};

export type TroopCMSAppearance = {
    displayType: BoostCMSAppearanceDisplayTypeEnum | undefined;

    inheritNetworkContent?: boolean;
    inheritNetworkStyles?: boolean;

    badgeThumbnail?: string;
    backgroundColor?: string;
    backgroundImage?: string;

    // Troops 2.0 fields
    fadeBackgroundImage?: boolean;
    repeatBackgroundImage?: boolean;

    // ID / Group fields
    fontColor?: string;
    accentColor?: string;
    idBackgroundImage?: string;
    dimIdBackgroundImage?: boolean;
    idIssuerThumbnail?: string;
    showIdIssuerImage?: boolean;

    // Troops 2.0 fields
    idThumbnail?: string;
    accentFontColor?: string;
    idBackgroundColor?: string;
    repeatIdBackgroundImage: boolean;
    idDescription?: string;

    activeAppearanceTab?: TroopsAppearanceTabs;
    presetStyles: {
        fontColor: string;
        dimIdBackgroundImage: boolean; // fade background
        repeatIdBackgroundImage: boolean;
        idBackgroundColor: string;
    };
};

export type TroopCMSNetworkFields = {
    networkType?: string;
    country?: string;
    region?: string;
    organization?: string;
};

export type TroopCMSFields = {
    inheritNetworkContent?: boolean;
    inheritNetworkStyles?: boolean;
    basicInfo: TroopCMSBasicInfo;
    networkFields?: TroopCMSNetworkFields;
    issueTo: TroopCMSIssueTo[];
    admins: TroopCMSAdmin[];
    appearance: TroopCMSAppearance;
    memberID?: TroopCMSFields;
};

export const defaultTroopState: TroopCMSFields = {
    inheritNetworkContent: true,
    inheritNetworkStyles: true,
    basicInfo: {
        name: null, // network name || troop number ||
        description: '',
        narrative: '', // criteria narrative
        type: BoostCategoryOptionsEnum.membership, // main category
        achievementType: '', // sub category type
        credentialExpires: false,
        expirationDate: null,

        // ID / Group fields
        location: '',
        issuerName: '',
    },
    networkFields: {
        networkType: '',
        country: '',
        region: '',
        organization: '',
    },
    issueTo: [],
    admins: [],
    appearance: {
        displayType: BoostCMSAppearanceDisplayTypeEnum.ID,

        inheritNetworkContent: true,
        inheritNetworkStyles: true,

        badgeThumbnail: '', // troop thumbnail
        backgroundColor: '#353E64', // troop background color
        backgroundImage: '', // troop background image

        // Troops 2.0 fields
        fadeBackgroundImage: false,
        repeatBackgroundImage: false,

        // ID / Group fields
        fontColor: '',
        accentColor: '',
        idBackgroundImage: '',
        dimIdBackgroundImage: false, // fade background
        idIssuerThumbnail: '', // troop thumbnail
        showIdIssuerImage: true,

        // Troops 2.0 fields
        idThumbnail: '',
        accentFontColor: '',
        idBackgroundColor: '',
        repeatIdBackgroundImage: false,
        idDescription: '',

        activeAppearanceTab: TroopsAppearanceTabs.custom,
        presetStyles: {
            fontColor: '',
            dimIdBackgroundImage: false, // fade background
            repeatIdBackgroundImage: false,
            idBackgroundColor: '',
        },
    },
};

export const scoutPermissions: {
    [key in TroopsCMSViewModeEnum]?: { id: number; titleKey: string; roleKeys: string[] }[];
} = {
    // global admin
    [TroopsCMSViewModeEnum.global]: [
        { id: 1, titleKey: 'troops.perms.general', roleKeys: ['troops.perms.viewAnalytics'] },
        {
            id: 2,
            titleKey: 'troops.childMenu.socialBoosts',
            roleKeys: ['troops.perms.issue', 'troops.perms.create'],
        },
        {
            id: 3,
            titleKey: 'troops.childMenu.meritBadges',
            roleKeys: ['troops.perms.issue', 'troops.perms.create', 'troops.perms.revoke'],
        },
        {
            id: 4,
            titleKey: 'troops.childMenu.troops',
            roleKeys: ['troops.perms.create', 'common.edit', 'troops.perms.revoke'],
        },
        {
            id: 5,
            titleKey: 'troops.perms.troopLeaderIds',
            roleKeys: ['troops.perms.issue', 'common.edit', 'troops.perms.revoke'],
        },
        {
            id: 6,
            titleKey: 'troops.childMenu.nationalNetworks',
            roleKeys: ['troops.perms.create', 'common.edit', 'troops.perms.revoke'],
        },
        {
            id: 7,
            titleKey: 'troops.perms.nationalAdminIds',
            roleKeys: ['troops.perms.issue', 'common.edit', 'troops.perms.revoke'],
        },
        {
            id: 8,
            titleKey: 'troops.perms.globalAdminIds',
            roleKeys: ['troops.perms.issue', 'common.edit', 'troops.perms.revoke'],
        },
    ],
    // network admins
    [TroopsCMSViewModeEnum.network]: [
        { id: 1, titleKey: 'troops.perms.general', roleKeys: ['troops.perms.viewAnalytics'] },
        { id: 2, titleKey: 'troops.childMenu.socialBoosts', roleKeys: ['troops.perms.create'] },
        { id: 3, titleKey: 'troops.childMenu.meritBadges', roleKeys: ['troops.perms.create'] },
        {
            id: 4,
            titleKey: 'troops.childMenu.troops',
            roleKeys: ['troops.perms.create', 'common.edit', 'troops.perms.revoke'],
        },
        {
            id: 5,
            titleKey: 'troops.perms.troopLeaderIds',
            roleKeys: ['troops.perms.issue', 'common.edit', 'troops.perms.revoke'],
        },
        {
            id: 6,
            titleKey: 'troops.perms.nationalAdminIds',
            roleKeys: ['troops.perms.issue', 'common.edit', 'troops.perms.revoke'],
        },
    ],
    // troop leaders
    [TroopsCMSViewModeEnum.leader]: [
        { id: 1, titleKey: 'troops.perms.general', roleKeys: ['troops.perms.viewAnalytics'] },
        {
            id: 2,
            titleKey: 'troops.childMenu.socialBoosts',
            roleKeys: ['troops.perms.issue', 'troops.perms.create', 'troops.perms.revoke'],
        },
        {
            id: 3,
            titleKey: 'troops.childMenu.meritBadges',
            roleKeys: ['troops.perms.issue', 'troops.perms.create', 'troops.perms.revoke'],
        },
        {
            id: 4,
            titleKey: 'troops.perms.scoutIds',
            roleKeys: ['troops.perms.issue', 'common.edit', 'troops.perms.revoke'],
        },
        {
            id: 5,
            titleKey: 'troops.perms.troopLeaderPermissions',
            roleKeys: ['troops.perms.issue', 'common.edit', 'troops.perms.revoke'],
        },
    ],
    // scouts
    [TroopsCMSViewModeEnum.member]: [
        { id: 1, titleKey: 'troops.perms.general', roleKeys: ['troops.perms.viewAnalytics'] },
        {
            id: 2,
            titleKey: 'troops.childMenu.socialBoosts',
            roleKeys: ['troops.perms.issue', 'troops.perms.create'],
        },
        {
            id: 3,
            titleKey: 'troops.childMenu.meritBadges',
            roleKeys: ['troops.perms.issue', 'troops.perms.create', 'troops.perms.revoke'],
        },
        {
            id: 4,
            titleKey: 'troops.childMenu.troops',
            roleKeys: ['troops.perms.create', 'common.edit', 'troops.perms.revoke'],
        },
        {
            id: 5,
            titleKey: 'troops.perms.troopLeaderIds',
            roleKeys: ['troops.perms.issue', 'common.edit', 'troops.perms.revoke'],
        },
        {
            id: 6,
            titleKey: 'troops.childMenu.nationalNetworks',
            roleKeys: ['troops.perms.create', 'common.edit', 'troops.perms.revoke'],
        },
        {
            id: 7,
            titleKey: 'troops.perms.nationalAdminIds',
            roleKeys: ['troops.perms.issue', 'common.edit', 'troops.perms.revoke'],
        },
        {
            id: 8,
            titleKey: 'troops.perms.globalAdminIds',
            roleKeys: ['troops.perms.issue', 'common.edit', 'troops.perms.revoke'],
        },
    ],
};

/**
 * Resolve a `scoutPermissions` `titleKey`/`roleKey` to its localized label.
 *
 * The config stores stable Paraglide message keys (not translated text); these
 * helpers perform the catalog lookup at invocation time so the labels follow the
 * active locale. The maps hold thunks so `m[...]()` only runs when a label is
 * needed (never at module scope).
 */
const PERMISSION_TITLE_LABELS: Record<string, () => string> = {
    'troops.perms.general': () => m['troops.perms.general'](),
    'troops.perms.troopLeaderIds': () => m['troops.perms.troopLeaderIds'](),
    'troops.perms.nationalAdminIds': () => m['troops.perms.nationalAdminIds'](),
    'troops.perms.globalAdminIds': () => m['troops.perms.globalAdminIds'](),
    'troops.perms.scoutIds': () => m['troops.perms.scoutIds'](),
    'troops.perms.troopLeaderPermissions': () => m['troops.perms.troopLeaderPermissions'](),
    'troops.childMenu.socialBoosts': () => m['troops.childMenu.socialBoosts'](),
    'troops.childMenu.meritBadges': () => m['troops.childMenu.meritBadges'](),
    'troops.childMenu.troops': () => m['troops.childMenu.troops'](),
    'troops.childMenu.nationalNetworks': () => m['troops.childMenu.nationalNetworks'](),
};

const PERMISSION_ROLE_LABELS: Record<string, () => string> = {
    'troops.perms.viewAnalytics': () => m['troops.perms.viewAnalytics'](),
    'troops.perms.issue': () => m['troops.perms.issue'](),
    'troops.perms.create': () => m['troops.perms.create'](),
    'troops.perms.revoke': () => m['troops.perms.revoke'](),
    'common.edit': () => m['common.edit'](),
};

export const permissionTitle = (titleKey: string | undefined): string =>
    (titleKey && PERMISSION_TITLE_LABELS[titleKey]?.()) || '';

export const permissionRole = (roleKey: string | undefined): string =>
    (roleKey && PERMISSION_ROLE_LABELS[roleKey]?.()) || '';

/**
 * Resolve a `troopsCMSViewModeDefaults` `titleKey` to its localized label.
 * `VIEW_MODE_TITLE_LABELS` holds thunks so `m[...]()` only runs at invocation.
 */
const VIEW_MODE_TITLE_LABELS: Record<string, () => string> = {
    'troops.globalNetworkLabel': () => m['troops.globalNetworkLabel'](),
    'troops.nationalNetworkLabel': () => m['troops.nationalNetworkLabel'](),
    'troops.troop': () => m['troops.troop'](),
    'troops.leaderOne': () => m['troops.leaderOne'](),
    'troops.memberOne': () => m['troops.memberOne'](),
};

export const viewModeTitle = (titleKey: string | undefined): string =>
    (titleKey && VIEW_MODE_TITLE_LABELS[titleKey]?.()) || '';

export type TroopsCMSState = TroopCMSFields & {
    memberID?: TroopCMSFields;
    parentID?: TroopCMSFields & {
        boostUri?: string;
    };
    grandParentID?: TroopCMSFields & {
        boostUri?: string;
    };
};

export const initializeTroopState = (viewMode: TroopsCMSViewModeEnum): TroopsCMSState => {
    if (viewMode === TroopsCMSViewModeEnum.global) {
        const categoryType = BoostCategoryOptionsEnum.globalAdminId;
        const achievementType = AchievementTypes.Global;

        const { image, backgroundImage } = troopsCMSViewModeDefaults[TroopsCMSViewModeEnum.global]!;
        const idDefaults = troopsIDDefaults?.global;

        return {
            ...defaultTroopState,
            inheritNetworkContent: false,
            inheritNetworkStyles: false,
            basicInfo: {
                ...defaultTroopState.basicInfo,
                name: 'World Scouting',
                description: m['troops.worldScoutingMission'](),
                type: categoryType,
                achievementType: achievementType,
            },
            appearance: {
                ...defaultTroopState.appearance,
                ...idDefaults,
                backgroundImage: backgroundImage,
                idIssuerThumbnail: image,
                badgeThumbnail: image,
                fadeBackgroundImage: true,
                repeatBackgroundImage: true,

                // preset global ID styles
                presetStyles: {
                    fontColor: idDefaults?.fontColor ?? '',
                    dimIdBackgroundImage: idDefaults?.dimIdBackgroundImage ?? true, // fade background
                    repeatIdBackgroundImage: idDefaults?.repeatIdBackgroundImage ?? true,
                    idBackgroundColor: idDefaults?.idBackgroundColor ?? '',
                },
            },
        };
    } else if (viewMode === TroopsCMSViewModeEnum.network) {
        const categoryType = BoostCategoryOptionsEnum.nationalNetworkAdminId;
        const achievementType = AchievementTypes.Network;
        const { image, backgroundImage } =
            troopsCMSViewModeDefaults[TroopsCMSViewModeEnum.network]!;
        const idDefaults = troopsIDDefaults?.network;

        return {
            ...defaultTroopState,
            inheritNetworkContent: false,
            inheritNetworkStyles: false,
            basicInfo: {
                ...defaultTroopState.basicInfo,
                name: '',
                type: categoryType,
                achievementType: achievementType,
            },
            appearance: {
                ...defaultTroopState.appearance,
                ...idDefaults,
                backgroundImage: backgroundImage,
                idIssuerThumbnail: image,
                badgeThumbnail: image,
                fadeBackgroundImage: true,
                repeatBackgroundImage: true,

                // preset network ID styles
                presetStyles: {
                    fontColor: idDefaults?.fontColor ?? '',
                    dimIdBackgroundImage: idDefaults?.dimIdBackgroundImage ?? true, // fade background
                    repeatIdBackgroundImage: idDefaults?.repeatIdBackgroundImage ?? true,
                    idBackgroundColor: idDefaults?.idBackgroundColor ?? '',
                },
            },
        };
    } else if (viewMode === TroopsCMSViewModeEnum.troop) {
        const categoryType = BoostCategoryOptionsEnum.troopLeaderId;
        const achievementType = AchievementTypes.Troop;
        const { image, backgroundImage } = troopsCMSViewModeDefaults[TroopsCMSViewModeEnum.troop]!;
        const idDefaults = troopsIDDefaults?.leader;
        return {
            ...defaultTroopState,
            basicInfo: {
                ...defaultTroopState.basicInfo,
                achievementType: achievementType,
                type: categoryType,
            },
            appearance: {
                ...defaultTroopState.appearance,
                ...idDefaults,
                backgroundImage: backgroundImage,
                idIssuerThumbnail: image,
                badgeThumbnail: image,
                fadeBackgroundImage: true,
                repeatBackgroundImage: true,
                inheritNetworkStyles: false,

                // preset leader ID styles
                presetStyles: {
                    fontColor: idDefaults?.fontColor ?? '',
                    dimIdBackgroundImage: idDefaults?.dimIdBackgroundImage ?? true, // fade background
                    repeatIdBackgroundImage: idDefaults?.repeatIdBackgroundImage ?? true,
                    idBackgroundColor: idDefaults?.idBackgroundColor ?? '',
                },
            },
            memberID: {
                ...defaultTroopState,
                basicInfo: {
                    ...defaultTroopState.basicInfo,
                    type: BoostCategoryOptionsEnum.scoutId,
                    achievementType: AchievementTypes.ScoutMember,
                },
                appearance: {
                    ...defaultTroopState.appearance,
                    ...troopsIDDefaults?.member,
                    backgroundImage: backgroundImage,
                    idIssuerThumbnail: image,
                    badgeThumbnail: image,
                    fadeBackgroundImage: true,
                    repeatBackgroundImage: true,
                    inheritNetworkStyles: false,

                    // preset member ID styles
                    presetStyles: {
                        fontColor: troopsIDDefaults?.member?.fontColor ?? '',
                        dimIdBackgroundImage:
                            troopsIDDefaults?.member?.dimIdBackgroundImage ?? true, // fade background
                        repeatIdBackgroundImage:
                            troopsIDDefaults?.member?.repeatIdBackgroundImage ?? true,
                        idBackgroundColor: troopsIDDefaults?.member?.idBackgroundColor ?? '',
                    },
                },
            },
        };
    }

    return {
        ...defaultTroopState,
        basicInfo: {
            ...defaultTroopState.basicInfo,
            achievementType: AchievementTypes.Troop,
        },
    };
};
export const initializeTroopStateForCredential = (
    credential: VC,
    viewMode: TroopsCMSViewModeEnum
): TroopsCMSState => {
    const defaults = initializeTroopState(viewMode);

    if (!credential) return defaults;

    const { boostID } = credential;
    const achievement = credential.credentialSubject.achievement;

    const stateWithCredentialInfo = {
        ...defaults,
        appearance: {
            ...defaults.appearance,
            ...boostID, // accentColor, accentFontColor, fontColor, idDescription, idThumbnail
            ...credential.display, // overwrites boostID's backgroundImage, backgroundColor, repeatBackgroundImage
            idBackgroundImage: boostID.backgroundImage,
            idBackgroundColor: boostID.idBackgroundColor,
            dimIdBackgroundImage: boostID.dimBackgroundImage,
            idIssuerThumbnail: boostID.issuerThumbnail,
            repeatIdBackgroundImage: boostID.repeatBackgroundImage,
            showIdIssuerImage: boostID.showIssuerThumbnail,
            badgeThumbnail: boostID.issuerThumbnail,

            // set to false because we don't store this on the credential, so we'll default to assuming the credential's info is its own
            inheritNetworkContent: false,
            inheritNetworkStyles: false,
        },
        basicInfo: {
            ...defaults.basicInfo,
            name:
                viewMode === TroopsCMSViewModeEnum.troop
                    ? Number.parseInt(credential.name.split(' ').at(-1)) // "Troop 123" -> "123" so that it's valid for the number input box
                    : credential.name,
            description: achievement.description,
            narrative: achievement.criteria.narrative,
            achievementType: achievement.achievementType,

            // TODO
            issuerName: credential.issuer, // this is a did
            // credentialExpires: !!achievement.expiration
            // location
        },
        // Pre-populate networkFields for edit UI (country, region, networkType, organization)
        networkFields: {
            networkType: (credential as any)?.address?.addressLocality ?? '',
            country: (credential as any)?.address?.addressCountry ?? '',
            region: (credential as any)?.address?.addressRegion ?? '',
            organization: (credential as any)?.boostID?.IDIssuerName ?? '',
        },

        // again, we don't store these on the credential, so we'll default to false
        inheritNetworkContent: false,
        inheritNetworkStyles: false,

        // will get filled in by a useEffect in TroopsCMSWrapper when the appropriate data loads
        memberID: {},
        issueTo: [],
        admins: [],
    };

    if (
        stateWithCredentialInfo.appearance.idDescription ===
        stateWithCredentialInfo.basicInfo.description
    ) {
        stateWithCredentialInfo.appearance.inheritNetworkContent = true;
    }

    return stateWithCredentialInfo;
};

export const mapParentIntoState = (
    state: TroopsCMSState,
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>,
    resolvedBoost: any,
    viewMode: TroopsCMSViewModeEnum,
    boostUri?: string
) => {
    if (viewMode === TroopsCMSViewModeEnum.global) return;
    if (viewMode === TroopsCMSViewModeEnum.network) {
        setState(prevState => {
            return {
                ...prevState,
                parentID: {
                    ...defaultTroopState,
                    boostUri,
                    basicInfo: {
                        ...prevState?.basicInfo,
                        name: resolvedBoost?.name,
                        description: resolvedBoost?.credentialSubject?.achievement?.description,
                        narrative:
                            resolvedBoost?.credentialSubject?.achievement?.criteria?.narrative,
                        credentialExpires: resolvedBoost?.expirationDate ? true : false,
                        expirationDate: resolvedBoost?.expirationDate,
                        issuerName: resolvedBoost?.boostID?.IDIssuerName,
                    },
                    appearance: {
                        ...prevState?.appearance,
                        badgeThumbnail: resolvedBoost?.image,
                        backgroundImage: resolvedBoost?.display?.backgroundImage,
                        backgroundColor: resolvedBoost?.display?.backgroundColor,

                        fontColor: resolvedBoost?.boostID?.fontColor,
                        accentColor: resolvedBoost?.boostID?.accentColor,
                        idBackgroundImage: resolvedBoost?.boostID?.backgroundImage,
                        dimIdBackgroundImage: resolvedBoost?.boostID?.dimBackgroundImage,
                        idIssuerThumbnail: resolvedBoost?.boostID?.issuerThumbnail,
                        showIdIssuerImage: resolvedBoost?.boostID?.showIssuerThumbnail,

                        fadeBackgroundImage: resolvedBoost?.display?.fadeBackgroundImage,
                        repeatBackgroundImage: resolvedBoost?.display?.repeatBackgroundImage,

                        idThumbnail: resolvedBoost?.boostID?.idThumbnail,
                        accentFontColor: resolvedBoost?.boostID?.accentFontColor,
                        idBackgroundColor: resolvedBoost?.boostID?.idBackgroundColor,
                        repeatIdBackgroundImage: resolvedBoost?.boostID?.repeatIdBackgroundImage,
                        idDescription: resolvedBoost?.boostID?.idDescription,
                    },
                },
            };
        });
    } else if (viewMode === TroopsCMSViewModeEnum.troop) {
        setState(prevState => {
            return {
                ...prevState,
                parentID: {
                    ...defaultTroopState,
                    boostUri,
                    basicInfo: {
                        ...prevState?.basicInfo,
                        name: resolvedBoost?.name,
                        description: resolvedBoost?.credentialSubject?.achievement?.description,
                        narrative:
                            resolvedBoost?.credentialSubject?.achievement?.criteria?.narrative,
                        credentialExpires: resolvedBoost?.expirationDate ? true : false,
                        expirationDate: resolvedBoost?.expirationDate,
                        issuerName: resolvedBoost?.boostID?.IDIssuerName,
                    },
                    appearance: {
                        ...prevState?.appearance,
                        badgeThumbnail: resolvedBoost?.image,
                        backgroundImage: resolvedBoost?.display?.backgroundImage,
                        backgroundColor: resolvedBoost?.display?.backgroundColor,

                        fontColor: resolvedBoost?.boostID?.fontColor,
                        accentColor: resolvedBoost?.boostID?.accentColor,
                        idBackgroundImage: resolvedBoost?.boostID?.backgroundImage,
                        dimIdBackgroundImage: resolvedBoost?.boostID?.dimBackgroundImage,
                        showIdIssuerImage: resolvedBoost?.boostID?.showIssuerThumbnail,

                        fadeBackgroundImage: resolvedBoost?.display?.fadeBackgroundImage,
                        repeatBackgroundImage: resolvedBoost?.display?.repeatBackgroundImage,

                        accentFontColor: resolvedBoost?.boostID?.accentFontColor,
                        idBackgroundColor: resolvedBoost?.boostID?.idBackgroundColor,
                        repeatIdBackgroundImage: resolvedBoost?.boostID?.repeatIdBackgroundImage,
                        idDescription: resolvedBoost?.boostID?.idDescription,
                    },
                },
            };
        });
    }
};

export const mapGrandParentIntoState = (
    state: TroopsCMSState,
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>,
    resolvedBoost: any,
    viewMode: TroopsCMSViewModeEnum,
    boostUri?: string
) => {
    if (viewMode === TroopsCMSViewModeEnum.global) return;
    if (viewMode === TroopsCMSViewModeEnum.network) return;
    if (viewMode === TroopsCMSViewModeEnum.troop) {
        setState(prevState => {
            return {
                ...prevState,
                grandParentID: {
                    ...defaultTroopState,
                    boostUri,
                    basicInfo: {
                        ...prevState?.basicInfo,
                        name: resolvedBoost?.name,
                        description: resolvedBoost?.credentialSubject?.achievement?.description,
                        narrative:
                            resolvedBoost?.credentialSubject?.achievement?.criteria?.narrative,
                        credentialExpires: resolvedBoost?.expirationDate ? true : false,
                        expirationDate: resolvedBoost?.expirationDate,
                        issuerName: resolvedBoost?.boostID?.IDIssuerName,
                    },
                    appearance: {
                        ...prevState?.appearance,
                        badgeThumbnail: resolvedBoost?.image,
                        backgroundImage: resolvedBoost?.display?.backgroundImage,
                        backgroundColor: resolvedBoost?.display?.backgroundColor,

                        fontColor: resolvedBoost?.boostID?.fontColor,
                        accentColor: resolvedBoost?.boostID?.accentColor,
                        idBackgroundImage: resolvedBoost?.boostID?.backgroundImage,
                        dimIdBackgroundImage: resolvedBoost?.boostID?.dimBackgroundImage,
                        showIdIssuerImage: resolvedBoost?.boostID?.showIssuerThumbnail,

                        fadeBackgroundImage: resolvedBoost?.boostID?.fadeBackgroundImage,
                        repeatBackgroundImage: resolvedBoost?.boostID?.repeatBackgroundImage,

                        accentFontColor: resolvedBoost?.boostID?.accentFontColor,
                        idBackgroundColor: resolvedBoost?.boostID?.idBackgroundColor,
                        repeatIdBackgroundImage: resolvedBoost?.boostID?.repeatIdBackgroundImage,
                        idDescription: resolvedBoost?.boostID?.idDescription,
                    },
                },
            };
        });
    }
};

export const mapMemberIdIntoState = (
    state: TroopsCMSState,
    setState: React.Dispatch<React.SetStateAction<TroopsCMSState>>,
    resolvedBoost: any,
    boostUri?: string
) => {
    setState(prevState => {
        return {
            ...prevState,
            memberID: {
                ...defaultTroopState,
                boostUri,
                basicInfo: {
                    ...prevState?.basicInfo,
                    name: resolvedBoost?.name,
                    description: resolvedBoost?.credentialSubject?.achievement?.description,
                    narrative: resolvedBoost?.credentialSubject?.achievement?.criteria?.narrative,
                    credentialExpires: resolvedBoost?.expirationDate ? true : false,
                    expirationDate: resolvedBoost?.expirationDate,
                    issuerName: resolvedBoost?.boostID?.IDIssuerName,
                },
                appearance: {
                    ...prevState?.appearance,
                    badgeThumbnail: resolvedBoost?.image,
                    backgroundImage: resolvedBoost?.display?.backgroundImage,
                    backgroundColor: resolvedBoost?.display?.backgroundColor,

                    fontColor: resolvedBoost?.boostID?.fontColor,
                    accentColor: resolvedBoost?.boostID?.accentColor,
                    idBackgroundImage: resolvedBoost?.boostID?.backgroundImage,
                    dimIdBackgroundImage: resolvedBoost?.boostID?.dimBackgroundImage,
                    idIssuerThumbnail: resolvedBoost?.boostID?.issuerThumbnail,
                    showIdIssuerImage: resolvedBoost?.boostID?.showIssuerThumbnail,

                    fadeBackgroundImage: resolvedBoost?.display?.fadeBackgroundImage,
                    repeatBackgroundImage: resolvedBoost?.display?.repeatBackgroundImage,

                    idThumbnail: resolvedBoost?.boostID?.idThumbnail,
                    accentFontColor: resolvedBoost?.boostID?.accentFontColor,
                    idBackgroundColor: resolvedBoost?.boostID?.idBackgroundColor,
                    repeatIdBackgroundImage: resolvedBoost?.boostID?.repeatIdBackgroundImage,
                    idDescription: resolvedBoost?.boostID?.idDescription,
                },
            },
        };
    });
};

export const getNetworkState = (
    state: TroopsCMSState,
    viewMode: TroopsCMSViewModeEnum,
    parentViewMode?: TroopsCMSViewModeEnum
) => {
    const isInGlobalViewMode = viewMode === TroopsCMSViewModeEnum.global;
    const isInNetworkViewMode = viewMode === TroopsCMSViewModeEnum.network;
    const isInTroopViewMode = viewMode === TroopsCMSViewModeEnum.troop;
    const isInMemberViewMode = viewMode === TroopsCMSViewModeEnum.member;
    const isInLeaderViewMode = viewMode === TroopsCMSViewModeEnum.leader;

    if (isInGlobalViewMode) return state;
    if (isInLeaderViewMode && parentViewMode === TroopsCMSViewModeEnum.global) {
        return state;
    }
    if (isInNetworkViewMode) return state;
    if (isInLeaderViewMode && parentViewMode === TroopsCMSViewModeEnum.network) {
        return state.parentID;
    }
    if (isInTroopViewMode) return state?.parentID;
    if (isInMemberViewMode && parentViewMode === TroopsCMSViewModeEnum.troop) return state.parentID;
    if (isInLeaderViewMode && parentViewMode === TroopsCMSViewModeEnum.troop) return state.parentID;
};

export const getMemberTypeText = (
    parentViewMode: TroopsCMSViewModeEnum,
    viewMode: TroopsCMSViewModeEnum
) => {
    const isInGlobalViewMode = parentViewMode === TroopsCMSViewModeEnum.global;
    const isInNetworkViewMode = parentViewMode === TroopsCMSViewModeEnum.network;
    const isInTroopViewMode = parentViewMode === TroopsCMSViewModeEnum.troop;
    const isInMemberViewMode = viewMode === TroopsCMSViewModeEnum.member;
    const isInLeaderViewMode = viewMode === TroopsCMSViewModeEnum.leader;

    if (isInGlobalViewMode) return 'Global Admin';
    if (isInNetworkViewMode) return 'National Admin';
    if (isInTroopViewMode) {
        if (isInMemberViewMode) return 'Scout';
        if (isInLeaderViewMode) return 'Troop Leader';
    }
};

export const getNetworkIDPayload = (state: TroopsCMSState, viewMode?: TroopsCMSViewModeEnum) => {
    // Start with the current state's appearance; if inheriting styles and parent appearance exists, use that
    let styles: TroopCMSAppearance = state.appearance;

    // check if we need to inherit the network styles
    const shouldInheritNetworkStyles: boolean = state?.inheritNetworkStyles ?? false;
    if (shouldInheritNetworkStyles) styles = state.parentID?.appearance ?? state.appearance;

    const thumbnail = styles?.badgeThumbnail;
    const backgroundImage = styles?.backgroundImage;
    const fadeBackgroundImage = styles?.fadeBackgroundImage;
    const repeatBackgroundImage = styles?.repeatBackgroundImage;

    // transform state here as needed
    const name =
        viewMode === TroopsCMSViewModeEnum.troop
            ? `Troop ${state?.basicInfo?.name}`
            : state?.basicInfo?.name;

    // check if we need to inherit the network content
    // if not fallback to the description set in state
    const description: string | undefined = state?.inheritNetworkContent
        ? state?.parentID?.basicInfo?.description
        : state?.basicInfo?.description;
    const idDescription: string | undefined = state?.appearance?.inheritNetworkContent
        ? description
        : state?.appearance?.idDescription;

    // return transformed state
    return {
        ...state,
        basicInfo: {
            ...state?.basicInfo,
            name: name,
            description: description,
        },
        appearance: {
            ...state.appearance,
            idIssuerThumbnail: thumbnail,
            thumbnail: thumbnail,
            backgroundImage: backgroundImage,
            fadeBackgroundImage: fadeBackgroundImage,
            repeatBackgroundImage: repeatBackgroundImage,
            idDescription: idDescription,
        },
    };
};

export const getScoutIDPayload = (
    parentState: TroopsCMSState,
    state: TroopCMSFields,
    viewMode?: TroopsCMSViewModeEnum
) => {
    // transform state here as needed
    let styles: TroopCMSAppearance = parentState?.appearance;

    // check if we need to inherit the network styles
    const shouldInheritNetworkStyles = parentState?.inheritNetworkStyles ?? false;
    if (shouldInheritNetworkStyles) styles = parentState?.parentID?.appearance;

    const thumbnail = styles?.badgeThumbnail;
    const backgroundImage = styles?.backgroundImage;
    const fadeBackgroundImage = styles?.fadeBackgroundImage;
    const repeatBackgroundImage = styles?.repeatBackgroundImage;

    // check if we need to inherit the network content
    // if not fallback to the description set in state
    const description: string | undefined = parentState?.inheritNetworkContent
        ? parentState?.parentID?.basicInfo?.description
        : parentState?.basicInfo?.description;
    const idDescription: string | undefined = state?.appearance?.inheritNetworkContent
        ? description
        : state?.appearance?.idDescription;

    const name =
        viewMode === TroopsCMSViewModeEnum.troop
            ? `Troop ${parentState?.basicInfo?.name}`
            : parentState?.basicInfo?.name;

    // return transformed state
    return {
        ...state,
        basicInfo: {
            ...state?.basicInfo,
            ...parentState?.basicInfo,
            name: name,
            achievementType: AchievementTypes.ScoutMember,
            type: BoostCategoryOptionsEnum.scoutId,
            description,
        },
        appearance: {
            ...state.appearance,
            badgeThumbnail: thumbnail,
            idIssuerThumbnail: thumbnail,
            backgroundImage: backgroundImage,
            fadeBackgroundImage: fadeBackgroundImage,
            repeatBackgroundImage: repeatBackgroundImage,
            idDescription: idDescription,
        },
    };
};

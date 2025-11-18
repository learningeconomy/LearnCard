import { EmojiClickData } from 'emoji-picker-react';
import {
    BoostCMSAppearanceDisplayTypeEnum,
    CurrentUser,
    getLastNameOrFirst,
} from 'learn-card-base';
import { BoostCategoryOptionsEnum } from '../boost/boost-options/boostOptions';
import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import { LearnCardIDCMSTabsEnum } from '../learncardID-CMS/LearnCardIDCMSTabs';
import { VC } from '@learncard/types';

export const DEFAULT_FAMILY_THUMBNAIL = 'https://cdn.filestackcontent.com/iPkEtnqmSv61isfMCzpf';

// different editor modes the CMS can be opened in
export enum FamilyCMSEditorModeEnum {
    create = 'create',
    edit = 'edit',
}

export type MemberTitleTypes = {
    singular: string;
    plural: string;
};

export type FamilyCMSBasicInfo = {
    name: string; // * family name
    description: string; // * family motto
    type: BoostCategoryOptionsEnum | string; // main category // * family
    achievementType: string | null; // sub category type

    memberTitles: {
        guardians: MemberTitleTypes;
        dependents: MemberTitleTypes;
    };

    narrative?: string; // criteria narrative
    credentialExpires?: boolean;
    expirationDate?: string | null;
    location?: string;
    issuerName?: string;
};

export type FamilyCMSAppearance = {
    displayType?: BoostCMSAppearanceDisplayTypeEnum | undefined; // * family

    // top level styles
    badgeThumbnail?: string;
    backgroundColor?: string;
    backgroundImage?: string;
    fadeBackgroundImage?: boolean;
    repeatBackgroundImage?: boolean;

    // family top level styles
    headerBackgroundColor?: string;
    headerFontColor?: string;

    emoji?: EmojiClickData | null;
    toggleFamilyEmoji?: boolean;

    // ID styles
    fontColor?: string;
    accentColor?: string;
    idBackgroundImage?: string;
    dimIdBackgroundImage?: boolean;
    idIssuerThumbnail?: string;
    showIdIssuerImage?: boolean;
    idThumbnail?: string;
    accentFontColor?: string;
    idBackgroundColor?: string;
    repeatIdBackgroundImage?: boolean;
    idDescription?: string;

    presetStyle?: LearnCardIDCMSTabsEnum;
};

// an existing user
export type FamilyMember = {
    profileId: string;
    did: string;
    displayName?: string;
    email?: string;
    image?: string;
};

// an ephemeral account
export type FamilyChildAccount = {
    name?: string;
    shortBio?: string;
    image?: string;
    profileId?: string;

    learnCardID?: FamilyCMSAppearance;
};

export type FamilyCMSState = {
    basicInfo: FamilyCMSBasicInfo;
    issueTo: FamilyMember[];
    admins: FamilyMember[]; // * guardians
    appearance: FamilyCMSAppearance;
    pin?: string[];
    childAccounts: FamilyChildAccount[];
};

export const defaultFamilyState: FamilyCMSState = {
    basicInfo: {
        name: '', // * family name
        description: '', // * family motto
        type: BoostCategoryOptionsEnum.family,
        achievementType: AchievementTypes.Family,
        memberTitles: {
            // * custom member titles
            guardians: {
                singular: 'Guardian',
                plural: 'Guardians',
            },
            dependents: {
                singular: 'Child',
                plural: 'Children',
            },
        },

        narrative: '',
        credentialExpires: false,
        expirationDate: null,
        location: '',
        issuerName: '',
    },
    issueTo: [],
    admins: [], // * guardians
    appearance: {
        displayType: BoostCMSAppearanceDisplayTypeEnum.Family,

        // top level styles
        badgeThumbnail: DEFAULT_FAMILY_THUMBNAIL, // family thumbnail
        backgroundColor: '#EFF0F5', // wallpaper background color
        backgroundImage: '', //  wallpaper background image
        fadeBackgroundImage: false, // fade wallpaper
        repeatBackgroundImage: false, // repeat wallpaper
        // family top level styles
        headerBackgroundColor: '#ffffff', // header background color
        headerFontColor: '#353E64', // header font color

        emoji: null,
        toggleFamilyEmoji: false,

        // id styles
        fontColor: '',
        accentColor: '',
        idBackgroundImage: '',
        dimIdBackgroundImage: false, // fade background
        idIssuerThumbnail: '', // troop thumbnail
        showIdIssuerImage: true,
        idThumbnail: '',
        accentFontColor: '',
        idBackgroundColor: '',
        repeatIdBackgroundImage: false,
        idDescription: '',
    },
    pin: [],
    childAccounts: [],
};

export const initializeFamilyState = (currentUser?: CurrentUser): FamilyCMSState => {
    return {
        ...defaultFamilyState,
        basicInfo: {
            ...defaultFamilyState?.basicInfo,
            name: `${getLastNameOrFirst(currentUser?.name)} Family`,
        },
    };
};

export const mapCredentialIntoState = (credential: VC) => {
    return {
        basicInfo: {
            name: credential?.name,
            description: credential?.credentialSubject?.achievement?.description,
            narrative: credential?.credentialSubject?.achievement?.criteria?.narrative,
            credentialExpires: credential?.expirationDate ? true : false,
            expirationDate: credential?.expirationDate,
            issuerName: credential?.boostID?.IDIssuerName,
            memberTitles: credential?.familyTitles,
        },
        appearance: {
            badgeThumbnail: credential?.image,
            backgroundImage: credential?.display?.backgroundImage,
            backgroundColor: credential?.display?.backgroundColor,

            fadeBackgroundImage: credential?.display?.fadeBackgroundImage,
            repeatBackgroundImage: credential?.display?.repeatBackgroundImage,

            emoji: credential?.display?.emoji,
            toggleFamilyEmoji: !!credential?.display?.emoji?.unified,
        },
    };
};

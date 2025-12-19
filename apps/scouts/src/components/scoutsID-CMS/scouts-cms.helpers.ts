import { BoostCMSAppearanceDisplayTypeEnum } from 'learn-card-base';
import { ScoutPassIDCMSTabsEnum } from './ScoutPassIDCMSTabs';

export type UserCMSAppearance = {
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

    // emoji?: EmojiClickData | null;
    // toggleFamilyEmoji?: boolean;

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

    presetStyle?: ScoutPassIDCMSTabsEnum;
};

export type userAccount = {
    name?: string;
    shortBio?: string;
    image?: string;
    profileId?: string;
    scoutPassID?: UserCMSAppearance;
};

type AllowedBackgroundStylesType = {
    backgroundSize?: string;
    backgroundImage?: string;
    backgroundPosition?: string;
    backgroundAttachment?: string;
    backgroundRepeat?: string;
    backgroundColor?: string;
    color?: string;
};

export const DEFAULT_SCOUTS_WALLPAPER = 'https://cdn.filestackcontent.com/ImEqbxSFRESCRdkhQKY8';
export const DEFAULT_SCOUTS_ID_WALLPAPER = 'https://cdn.filestackcontent.com/9Bgaim1ShGYSFgUBB2hn';
export const DEFAULT_SCOUTPASS_ID_ISSUER_THUMBNAIL =
    'https://cdn.filestackcontent.com/jp2QjYhLRknledLz0wN9';
export const DEFAULT_COLOR_DARK = '#353E64';
export const DEFAULT_COLOR_LIGHT = '#EFF0F5';

export const getIdBackgroundStyles = (idStyles?: UserCMSAppearance) => {
    const {
        idBackgroundImage: idImage,
        dimIdBackgroundImage: idDimBg,
        idBackgroundColor: idBgColor,
        repeatIdBackgroundImage: idRepeat,
        fontColor: idFontColor,
    } = idStyles ?? {};

    const backgroundUrl = idImage || DEFAULT_SCOUTS_ID_WALLPAPER;
    const dimBackgroundImage = idDimBg || true;
    const backgroundColor = idBgColor || DEFAULT_COLOR_DARK;
    const repeatBackgroundImage = idRepeat || false;

    let backgroundStyles: AllowedBackgroundStylesType = {
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', // This makes it fixed
        backgroundSize: 'cover',
        backgroundImage: `url(${backgroundUrl})`,
        backgroundRepeat: 'no-repeat',
    };

    if (dimBackgroundImage) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundImage: `linear-gradient(#353E6480, #353E6480), url(${backgroundUrl})`,
        };

        if (backgroundColor) {
            backgroundStyles = {
                ...backgroundStyles,
                backgroundImage: `linear-gradient(${backgroundColor}80, ${backgroundColor}80), url(${backgroundUrl})`,
            };
        }
    }

    if (repeatBackgroundImage) {
        backgroundStyles = {
            ...backgroundStyles,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto',
        };
    }

    if (!dimBackgroundImage && !backgroundUrl) {
        backgroundStyles.backgroundColor = backgroundColor;
    }

    backgroundStyles.color = idFontColor;

    return backgroundStyles;
};

export const getScoutPassIDStyleDefaults = (
    activeTab: ScoutPassIDCMSTabsEnum,
    existingStyles?: UserCMSAppearance,
    revertedStyles?: UserCMSAppearance
): UserCMSAppearance => {
    if (activeTab === ScoutPassIDCMSTabsEnum.dark) {
        return {
            backgroundColor: DEFAULT_COLOR_LIGHT,
            backgroundImage: existingStyles?.backgroundImage ?? DEFAULT_SCOUTS_WALLPAPER,
            fadeBackgroundImage: false,
            repeatBackgroundImage: existingStyles?.repeatBackgroundImage,

            fontColor: DEFAULT_COLOR_LIGHT,
            accentColor: '#ffffff',
            idBackgroundImage: existingStyles?.idBackgroundImage ?? DEFAULT_SCOUTS_ID_WALLPAPER,
            dimIdBackgroundImage: true,
            idIssuerThumbnail: DEFAULT_SCOUTPASS_ID_ISSUER_THUMBNAIL,
            showIdIssuerImage: true,
            idThumbnail: '',
            accentFontColor: '',
            idBackgroundColor: DEFAULT_COLOR_DARK,
            repeatIdBackgroundImage: false,
            idDescription: 'ScoutPass',

            presetStyle: ScoutPassIDCMSTabsEnum.dark,
            ...revertedStyles,
        };
    } else if (activeTab === ScoutPassIDCMSTabsEnum.light) {
        return {
            backgroundColor: DEFAULT_COLOR_LIGHT,
            backgroundImage: existingStyles?.backgroundImage ?? DEFAULT_SCOUTS_WALLPAPER,
            fadeBackgroundImage: false,
            repeatBackgroundImage: existingStyles?.repeatBackgroundImage,

            fontColor: DEFAULT_COLOR_DARK,
            accentColor: '#ffffff',
            idBackgroundImage: existingStyles?.idBackgroundImage ?? DEFAULT_SCOUTS_ID_WALLPAPER,
            dimIdBackgroundImage: true,
            idIssuerThumbnail: DEFAULT_SCOUTPASS_ID_ISSUER_THUMBNAIL,
            showIdIssuerImage: true,
            idThumbnail: '',
            accentFontColor: '',
            idBackgroundColor: '#FFFFFF',
            repeatIdBackgroundImage: false,
            idDescription: 'ScoutPass',

            presetStyle: ScoutPassIDCMSTabsEnum.light,
            ...revertedStyles,
        };
    } else if (activeTab === ScoutPassIDCMSTabsEnum.custom) {
        return {
            backgroundColor: DEFAULT_COLOR_LIGHT,
            backgroundImage: existingStyles?.backgroundImage ?? DEFAULT_SCOUTS_WALLPAPER,
            fadeBackgroundImage: false,
            repeatBackgroundImage: existingStyles?.repeatBackgroundImage,

            fontColor: DEFAULT_COLOR_LIGHT,
            accentColor: '#ffffff',
            idBackgroundImage: existingStyles?.idBackgroundImage ?? DEFAULT_SCOUTS_ID_WALLPAPER,
            dimIdBackgroundImage: existingStyles?.dimIdBackgroundImage ?? false,
            idIssuerThumbnail: DEFAULT_SCOUTPASS_ID_ISSUER_THUMBNAIL,
            showIdIssuerImage: true,
            idThumbnail: '',
            accentFontColor: '',
            idBackgroundColor: DEFAULT_COLOR_DARK,
            repeatIdBackgroundImage: false,
            idDescription: 'ScoutPass',

            presetStyle: ScoutPassIDCMSTabsEnum.custom,
            ...revertedStyles,
        };
    }

    return {
        backgroundColor: DEFAULT_COLOR_LIGHT,
        backgroundImage: DEFAULT_SCOUTS_WALLPAPER,
        fadeBackgroundImage: false,
        repeatBackgroundImage: false,

        fontColor: DEFAULT_COLOR_LIGHT,
        accentColor: '#ffffff',
        idBackgroundImage: DEFAULT_SCOUTS_ID_WALLPAPER,
        dimIdBackgroundImage: true,
        idIssuerThumbnail: DEFAULT_SCOUTPASS_ID_ISSUER_THUMBNAIL,
        showIdIssuerImage: true,
        idThumbnail: '',
        accentFontColor: '',
        idBackgroundColor: '#2DD4BF',
        repeatIdBackgroundImage: false,
        idDescription: 'ScoutPass',

        presetStyle: ScoutPassIDCMSTabsEnum.dark,
    };
};

export const getScoutPassIDBackgroundColor = (
    activeTab: ScoutPassIDCMSTabsEnum,
    existingStyles: UserCMSAppearance
) => {
    if (!existingStyles?.idBackgroundImage) {
        return {
            idBackgroundColor: existingStyles?.idBackgroundColor,
            dimIdBackgroundImage: existingStyles?.dimIdBackgroundImage ?? false,
        };
    }

    if (activeTab === ScoutPassIDCMSTabsEnum.dark) {
        return {
            idBackgroundColor: DEFAULT_COLOR_DARK,
            dimIdBackgroundImage: false,
        };
    } else if (activeTab === ScoutPassIDCMSTabsEnum.light) {
        return {
            idBackgroundColor: DEFAULT_COLOR_LIGHT,
            dimIdBackgroundImage: false,
        };
    } else if (activeTab === ScoutPassIDCMSTabsEnum.custom) {
        return {
            idBackgroundColor: DEFAULT_COLOR_LIGHT,
            dimIdBackgroundImage: existingStyles?.dimIdBackgroundImage ?? false,
        };
    }
};

import { FamilyCMSAppearance } from '../familyCMS/familyCMSState';
import { LearnCardIDCMSTabsEnum } from './LearnCardIDCMSTabs';

type AllowedBackgroundStylesType = {
    backgroundSize?: string;
    backgroundImage?: string;
    backgroundPosition?: string;
    backgroundAttachment?: string;
    backgroundRepeat?: string;
    backgroundColor?: string;
    color?: string;
};

export const DEFAULT_LEARNCARD_WALLPAPER = 'https://cdn.filestackcontent.com/ImEqbxSFRESCRdkhQKY8';
export const DEFAULT_LEARNCARD_ID_WALLPAPER =
    'https://cdn.filestackcontent.com/9Bgaim1ShGYSFgUBB2hn';
export const DEFAULT_LEARNCARD_ID_ISSUER_THUMBNAIL =
    'https://cdn.filestackcontent.com/PymCLMCTWxKOnVxcapQD';
export const DEFAULT_COLOR_DARK = '#353E64';
export const DEFAULT_COLOR_LIGHT = '#EFF0F5';

export const getIdBackgroundStyles = (idStyles?: FamilyCMSAppearance) => {
    const {
        idBackgroundImage: idImage,
        dimIdBackgroundImage: idDimBg,
        idBackgroundColor: idBgColor,
        repeatIdBackgroundImage: idRepeat,
        fontColor: idFontColor,
    } = idStyles ?? {};

    const backgroundUrl = idImage || DEFAULT_LEARNCARD_ID_WALLPAPER;
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

export const getLearnCardIDStyleDefaults = (
    activeTab: LearnCardIDCMSTabsEnum,
    existingStyles?: FamilyCMSAppearance,
    revertedStyles?: FamilyCMSAppearance
): FamilyCMSAppearance => {
    if (activeTab === LearnCardIDCMSTabsEnum.dark) {
        return {
            backgroundColor: DEFAULT_COLOR_LIGHT,
            backgroundImage: existingStyles?.backgroundImage ?? DEFAULT_LEARNCARD_WALLPAPER,
            fadeBackgroundImage: false,
            repeatBackgroundImage: existingStyles?.repeatBackgroundImage,

            fontColor: DEFAULT_COLOR_LIGHT,
            accentColor: '#ffffff',
            idBackgroundImage: existingStyles?.idBackgroundImage ?? DEFAULT_LEARNCARD_ID_WALLPAPER,
            dimIdBackgroundImage: true,
            idIssuerThumbnail: DEFAULT_LEARNCARD_ID_ISSUER_THUMBNAIL,
            showIdIssuerImage: true,
            idThumbnail: '',
            accentFontColor: '',
            idBackgroundColor: DEFAULT_COLOR_DARK,
            repeatIdBackgroundImage: false,
            idDescription: 'LearnCard',

            presetStyle: LearnCardIDCMSTabsEnum.dark,
            ...revertedStyles,
        };
    } else if (activeTab === LearnCardIDCMSTabsEnum.light) {
        return {
            backgroundColor: DEFAULT_COLOR_LIGHT,
            backgroundImage: existingStyles?.backgroundImage ?? DEFAULT_LEARNCARD_WALLPAPER,
            fadeBackgroundImage: false,
            repeatBackgroundImage: existingStyles?.repeatBackgroundImage,

            fontColor: DEFAULT_COLOR_DARK,
            accentColor: '#ffffff',
            idBackgroundImage: existingStyles?.idBackgroundImage ?? DEFAULT_LEARNCARD_ID_WALLPAPER,
            dimIdBackgroundImage: true,
            idIssuerThumbnail: DEFAULT_LEARNCARD_ID_ISSUER_THUMBNAIL,
            showIdIssuerImage: true,
            idThumbnail: '',
            accentFontColor: '',
            idBackgroundColor: '#FFFFFF',
            repeatIdBackgroundImage: false,
            idDescription: 'LearnCard',

            presetStyle: LearnCardIDCMSTabsEnum.light,
            ...revertedStyles,
        };
    } else if (activeTab === LearnCardIDCMSTabsEnum.custom) {
        return {
            backgroundColor: DEFAULT_COLOR_LIGHT,
            backgroundImage: existingStyles?.backgroundImage ?? DEFAULT_LEARNCARD_WALLPAPER,
            fadeBackgroundImage: false,
            repeatBackgroundImage: existingStyles?.repeatBackgroundImage,

            fontColor: DEFAULT_COLOR_LIGHT,
            accentColor: '#ffffff',
            idBackgroundImage: existingStyles?.idBackgroundImage ?? DEFAULT_LEARNCARD_ID_WALLPAPER,
            dimIdBackgroundImage: existingStyles?.dimIdBackgroundImage ?? false,
            idIssuerThumbnail: DEFAULT_LEARNCARD_ID_ISSUER_THUMBNAIL,
            showIdIssuerImage: true,
            idThumbnail: '',
            accentFontColor: '',
            idBackgroundColor: DEFAULT_COLOR_DARK,
            repeatIdBackgroundImage: false,
            idDescription: 'LearnCard',

            presetStyle: LearnCardIDCMSTabsEnum.custom,
            ...revertedStyles,
        };
    }

    return {
        backgroundColor: DEFAULT_COLOR_LIGHT,
        backgroundImage: DEFAULT_LEARNCARD_WALLPAPER,
        fadeBackgroundImage: false,
        repeatBackgroundImage: false,

        fontColor: DEFAULT_COLOR_LIGHT,
        accentColor: '#ffffff',
        idBackgroundImage: DEFAULT_LEARNCARD_ID_WALLPAPER,
        dimIdBackgroundImage: true,
        idIssuerThumbnail: DEFAULT_LEARNCARD_ID_ISSUER_THUMBNAIL,
        showIdIssuerImage: true,
        idThumbnail: '',
        accentFontColor: '',
        idBackgroundColor: '#2DD4BF',
        repeatIdBackgroundImage: false,
        idDescription: 'LearnCard',

        presetStyle: LearnCardIDCMSTabsEnum.dark,
    };
};

export const getLearnCardIDBackgroundColor = (
    activeTab: LearnCardIDCMSTabsEnum,
    existingStyles: FamilyCMSAppearance
) => {
    if (!existingStyles?.idBackgroundImage) {
        return {
            idBackgroundColor: existingStyles?.idBackgroundColor,
            dimIdBackgroundImage: existingStyles?.dimIdBackgroundImage ?? false,
        };
    }

    if (activeTab === LearnCardIDCMSTabsEnum.dark) {
        return {
            idBackgroundColor: DEFAULT_COLOR_DARK,
            dimIdBacgroundImage: false,
        };
    } else if (activeTab === LearnCardIDCMSTabsEnum.light) {
        return {
            idBackgroundColor: DEFAULT_COLOR_LIGHT,
            dimIdBackgroundImage: false,
        };
    } else if (activeTab === LearnCardIDCMSTabsEnum.custom) {
        return {
            idBackgroundColor: DEFAULT_COLOR_LIGHT,
            dimIdBackgroundImage: existingStyles?.dimIdBackgroundImage ?? false,
        };
    }
};

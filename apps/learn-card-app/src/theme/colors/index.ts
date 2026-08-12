import { CredentialCategoryEnum } from 'learn-card-base';

export type CategoryColor = {
    primaryColor?: string;
    secondaryColor?: string;
    indicatorColor?: string;
    borderColor?: string;

    // category page colors
    statusBarColor?: string;
    headerTextColor?: string;
    headerBrandingTextColor?: string;
    backgroundPrimaryColor?: string; // header
    backgroundSecondaryColor?: string; // content
    helperTextColor?: string;
    tabActiveColor?: string;
};

// Colors for non-category launchpad items
export type LaunchPadColors = {
    contacts: { color: string };
    aiSessions: { color: string };
    alerts: { color: string; indicatorTextColor?: string; indicatorBgColor?: string };
    buttons: {
        connected: string;
        unconnected: string;
    };
};

export type SideMenuColors = {
    linkActiveColor: string;
    linkInactiveColor: string;
    linkActiveBackgroundColor: string;
    linkInactiveBackgroundColor: string;
    primaryButtonColor: string;
    secondaryButtonColor: string;
    indicatorColor: string;
    syncingColor: string;
    completedColor: string;
};

export type NavBarColors = {
    activeColor: string;
    inactiveColor: string;
    syncingColor: string;
    completedColor: string;
};

export type SpilledCupColors = {
    backsplash: string;
    spill: string;
    cupOutline: string;
};

export type IntroSlidesColors = {
    firstSlideBackground: string;
    secondSlideBackground: string;
    thirdSlideBackground: string;
    textColors: {
        primary: string;
        secondary: string;
    };
    pagination: {
        primary: string;
        secondary: string;
    };
};

export type PlaceholderCategoryKey = CredentialCategoryEnum | 'defaults';

export type PlaceholderCategoryMap = {
    [K in PlaceholderCategoryKey]?: {
        spilledCup: SpilledCupColors;
    };
};

export type DefaultColors = {
    primaryColor: string;
    primaryColorShade: string;
    loaders: string[];
};

// Per-theme color table: category colors + launchPad colors + placeholders
export type ThemeColorTable = Partial<Record<CredentialCategoryEnum, CategoryColor>> & {
    launchPad: LaunchPadColors;
    sideMenu: SideMenuColors;
    navbar?: NavBarColors;
    placeholders?: PlaceholderCategoryMap;
    introSlides?: IntroSlidesColors;
    defaults: DefaultColors;
};

export enum ColorSetEnum {
    launchPad = 'launchPad',
    sideMenu = 'sideMenu',
    navbar = 'navbar',
    placeholders = 'placeholders',
    introSlides = 'introSlides',
    defaults = 'defaults',
}

export type ColorSetByEnum = {
    [ColorSetEnum.launchPad]: LaunchPadColors;
    [ColorSetEnum.sideMenu]: SideMenuColors;
    [ColorSetEnum.navbar]: NavBarColors;
    [ColorSetEnum.placeholders]: PlaceholderCategoryMap;
    [ColorSetEnum.introSlides]: IntroSlidesColors;
    [ColorSetEnum.defaults]: DefaultColors;
};

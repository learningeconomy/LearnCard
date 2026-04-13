import type { ThemeStyles } from '../validators/styles.validators';

export type WalletCardStyles = {
    iconStyles: string;
    cardStyles: string;
};

export type LaunchPadStyles = {
    textStyles: string;
    iconStyles: string;
    indicatorStyles?: string;
};

export type DefaultsStyles = {
    tabs: {
        borderRadius: string;
    };
};

export type ThemeStylesPerTheme = {
    wallet: WalletCardStyles;
    launchPad: LaunchPadStyles;
    defaults: DefaultsStyles;
};

export enum StyleSetEnum {
    wallet = 'wallet',
    launchPad = 'launchPad',
    defaults = 'defaults',
}

// Type mapping for style sets
export type StyleSetMap = {
    [StyleSetEnum.wallet]: ThemeStyles['wallet'];
    [StyleSetEnum.launchPad]: ThemeStyles['launchPad'];
    [StyleSetEnum.defaults]: ThemeStyles['defaults'];
};


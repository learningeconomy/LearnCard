import { ThemeEnum } from '../helpers/theme-helpers';
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

export const styles = {
    [ThemeEnum.Colorful]: {
        wallet: {
            cardStyles: 'h-[240px]',
            iconStyles: 'w-[100px] h-[100px]',
        },
        launchPad: {
            textStyles: 'text-[16px]',
            iconStyles: 'w-[75px] h-auto xxs:w-[60px] xxs:h-[60px]',
            indicatorStyles: 'shadow-soft-bottom',
        },
        defaults: {
            tabs: {
                borderRadius: 'rounded-[5px]',
            },
        },
    },
    [ThemeEnum.Formal]: {
        wallet: {
            cardStyles: 'h-[200px]',
            iconStyles: 'w-[60px] h-[60px]',
        },
        launchPad: {
            textStyles: 'text-[14px]',
            iconStyles: 'w-[55px] h-auto xxs:w-[55px] xxs:h-[55px] mb-2',
        },
        defaults: {
            tabs: {
                borderRadius: 'rounded-[5px]',
            },
        },
    },
} as const satisfies Record<ThemeEnum, ThemeStylesPerTheme>;

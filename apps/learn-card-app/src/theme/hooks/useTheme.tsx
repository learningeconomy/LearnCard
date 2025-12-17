// src/theme/hooks/useTheme.tsx
import { themeStore } from '../store/themeStore';

import type { StyleSetEnum, StyleSetMap } from '../styles';
import type { CategoryIcons, IconSetEnum } from '../icons';
import type { CategoryColor, ColorSetByEnum, ColorSetEnum } from '../colors';

import type { ThemeCategory } from '../validators/theme.validators';

import { ViewMode } from '../types/theme.types';
import { ThemeEnum } from '../helpers/theme-helpers';
import { loadThemeSchema } from '../helpers/loadTheme';
import { CredentialCategoryEnum } from 'learn-card-base';

import passportPageStore, { PassportPageViewMode } from '../../stores/passportPageStore';

export type ThemedCategoryPayload = {
    category: ThemeCategory;
    icons: CategoryIcons;
    colors: CategoryColor;
};

const EMPTY_ICONS: CategoryIcons = {};
const EMPTY_COLORS: CategoryColor = {};

export const useTheme = () => {
    const selectedTheme = themeStore.use.theme();
    const theme = loadThemeSchema(selectedTheme);

    const { colors, icons, styles } = theme;

    const getIconSet = <T extends IconSetEnum>(iconSetType: T) => {
        const iconSet = icons[iconSetType];
        return iconSet ?? EMPTY_ICONS;
    };

    const getColorSet = <T extends ColorSetEnum>(colorSetType: T) => {
        const colorSet = colors[colorSetType];
        return (colorSet as ColorSetByEnum[T]) ?? EMPTY_COLORS;
    };

    const getStyleSet = <T extends StyleSetEnum>(styleSetType: T): StyleSetMap[T] => {
        const styleSet = styles?.[styleSetType];
        return styleSet as StyleSetMap[T];
    };

    const getThemedCategoryIcons = (categoryId: CredentialCategoryEnum): CategoryIcons =>
        icons?.[categoryId] ?? EMPTY_ICONS;

    const getThemedCategoryColors = (categoryId: CredentialCategoryEnum): CategoryColor =>
        colors?.[categoryId] ?? EMPTY_COLORS;

    const getThemedCategory = (categoryId: CredentialCategoryEnum): ThemedCategoryPayload =>
        (() => {
            const category = theme.categories.find(c => c.categoryId === categoryId);

            return {
                category: category as ThemeCategory,
                icons: getThemedCategoryIcons(categoryId),
                colors: getThemedCategoryColors(categoryId),
            };
        })();

    const syncThemeDefaults = (theme: ThemeEnum) => {
        const schema = loadThemeSchema(theme);
        const { defaults } = schema;
        passportPageStore.set.setViewMode(
            defaults.viewMode === ViewMode.List
                ? PassportPageViewMode.list
                : PassportPageViewMode.grid
        );
    };

    return {
        theme,
        icons,
        colors,
        getThemedCategoryIcons,
        getThemedCategoryColors,
        getThemedCategory,
        getIconSet,
        getColorSet,
        getStyleSet,
        syncThemeDefaults,
    };
};

export default useTheme;

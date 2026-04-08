// src/theme/hooks/useTheme.tsx
import { useEffect } from 'react';

import { CredentialCategoryEnum, useGetPreferencesForDid, useIsLoggedIn } from 'learn-card-base';

import { getDefaultTheme, resolveThemeForTenant, themeStore } from '../store/themeStore';

import type { StyleSetEnum, StyleSetMap } from '../styles';
import type { CategoryIcons, IconSetEnum } from '../icons';
import type { CategoryColor, ColorSetByEnum, ColorSetEnum } from '../colors';

import type { ThemeCategory } from '../validators/theme.validators';

import { ViewMode } from '../types/theme.types';
import { loadThemeSchema } from '../helpers/loadTheme';

import passportPageStore, { PassportPageViewMode } from '../../stores/passportPageStore';

export type ThemedCategoryPayload = {
    category: ThemeCategory;
    icons: CategoryIcons;
    colors: CategoryColor;
};

const EMPTY_ICONS: CategoryIcons = {};
const EMPTY_COLORS: CategoryColor = {};

export const syncThemeDefaults = (theme: string): void => {
    const schema = loadThemeSchema(theme);
    const { defaults } = schema;

    passportPageStore.set.setViewMode(
        defaults.viewMode === ViewMode.List ? PassportPageViewMode.list : PassportPageViewMode.grid
    );
};

export const applyTheme = (theme: string): string => {
    const resolvedTheme = loadThemeSchema(theme);

    themeStore.set.theme(resolvedTheme.id);
    syncThemeDefaults(resolvedTheme.id);

    return resolvedTheme.id;
};

export const useInitializeTheme = (): void => {
    const isLoggedIn = useIsLoggedIn();
    const { data: preferences, isFetched } = useGetPreferencesForDid(isLoggedIn);

    useEffect(() => {
        if (!isLoggedIn) {
            const defaultTheme = getDefaultTheme();

            if (themeStore.get.theme() !== defaultTheme) {
                applyTheme(defaultTheme);
                return;
            }

            syncThemeDefaults(defaultTheme);
            return;
        }

        if (!isFetched) return;

        const resolvedTheme = resolveThemeForTenant(preferences?.theme);

        if (themeStore.get.theme() !== resolvedTheme) {
            applyTheme(resolvedTheme);
            return;
        }

        syncThemeDefaults(resolvedTheme);
    }, [isFetched, isLoggedIn, preferences?.theme]);
};

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

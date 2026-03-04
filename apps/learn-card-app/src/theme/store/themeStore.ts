import { createStore } from '@udecode/zustood';

import { ThemeEnum } from '../helpers/theme-helpers';

// Get default theme from environment variable or fallback to colorful
const getDefaultTheme = (): ThemeEnum => {
    const envTheme = APP_THEME as string;

    return Object.values(ThemeEnum).includes(envTheme as ThemeEnum)
        ? (envTheme as ThemeEnum)
        : ThemeEnum.Colorful;
};

export const themeStore = createStore('themeStore')<{
    theme: ThemeEnum;
}>({ theme: getDefaultTheme() }, { persist: { name: 'themeStore', enabled: true } });

export default themeStore;

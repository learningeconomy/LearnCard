import { createStore } from '@udecode/zustood';

import { ThemeEnum } from '../helpers/theme-helpers';
import { getResolvedTenantConfig } from '../../config/bootstrapTenantConfig';

// Get default theme from TenantConfig branding, with env var fallback
const getDefaultTheme = (): ThemeEnum => {
    let themeStr: string = 'colorful';

    try {
        themeStr = getResolvedTenantConfig().branding.defaultTheme;
    } catch {
        // TenantConfig not yet resolved — fall back to Vite global
        themeStr = (typeof APP_THEME !== 'undefined' && APP_THEME) ? APP_THEME : 'colorful';
    }

    return Object.values(ThemeEnum).includes(themeStr as ThemeEnum)
        ? (themeStr as ThemeEnum)
        : ThemeEnum.Colorful;
};

export const themeStore = createStore('themeStore')<{
    theme: ThemeEnum;
}>({ theme: getDefaultTheme() }, { persist: { name: 'themeStore', enabled: true } });

export default themeStore;

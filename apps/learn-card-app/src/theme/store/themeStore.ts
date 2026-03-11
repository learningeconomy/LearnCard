import { createStore } from '@udecode/zustood';

import { getResolvedTenantConfig } from '../../config/bootstrapTenantConfig';
import type { TenantConfig } from 'learn-card-base';

const DEFAULT_THEME = 'colorful';

// Get default theme from TenantConfig branding, with env var fallback.
// Returns a string ID; loadThemeSchema() handles fallback if the ID is unknown.
const getDefaultTheme = (): string => {
    try {
        return getResolvedTenantConfig().branding.defaultTheme;
    } catch {
        // TenantConfig not yet resolved — fall back to Vite global
        return (typeof APP_THEME !== 'undefined' && APP_THEME) ? APP_THEME : DEFAULT_THEME;
    }
};

export const themeStore = createStore('themeStore')<{
    theme: string;
}>({ theme: getDefaultTheme() }, { persist: { name: 'themeStore', enabled: true } });

/**
 * Check whether theme switching is enabled for the current tenant.
 * Returns false when the tenant explicitly disables it.
 */
export const isThemeSwitchingEnabled = (config?: TenantConfig): boolean => {
    try {
        const cfg = config ?? getResolvedTenantConfig();

        return cfg.features.themeSwitching !== false;
    } catch {
        return true;
    }
};

/**
 * If the tenant disables theme switching, force-set the store to the
 * configured defaultTheme. Call this from bootstrapTenantConfig() after
 * the config is resolved so it overrides any stale persisted preference.
 */
export const enforceDefaultTheme = (): void => {
    try {
        const config = getResolvedTenantConfig();

        console.log("RESOLVED CONFIG", config)
        if (config.features.themeSwitching === false) {
            const forced = getDefaultTheme();

            // Set immediately (covers case where hydration already happened)
            console.log("FORCED THEME", forced)
            themeStore.set.theme(forced);

            // Subscribe to catch async persist hydration that may overwrite
            // the value we just set. Once corrected, unsubscribe.
            const unsub = themeStore.store.subscribe(({ theme }) => {
                if (theme !== forced) {
                    themeStore.set.theme(forced);
                    unsub();
                }
            });

            // Safety: clean up subscription after 5s regardless
            setTimeout(() => unsub(), 5000);
        }
    } catch {
        // Config not yet available — nothing to enforce
    }
};

export default themeStore;

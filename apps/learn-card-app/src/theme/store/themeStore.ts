import { createStore } from '@udecode/zustood';

import { getResolvedTenantConfig } from '../../config/bootstrapTenantConfig';
import type { TenantConfig } from 'learn-card-base';
import { emitConfigDebugEvent, emitConfigWarning } from '../../components/debug/configDebugEvents';
import { isRegisteredThemeId, resolveThemeId } from '../helpers/loadTheme';

const DEFAULT_THEME = 'colorful';

const getAppFallbackTheme = (): string => {
    return typeof APP_THEME !== 'undefined' && APP_THEME ? APP_THEME : DEFAULT_THEME;
};

// Get default theme from TenantConfig branding, with env var fallback.
// Returns a string ID; loadThemeSchema() handles fallback if the ID is unknown.
export const getDefaultTheme = (config?: TenantConfig): string => {
    try {
        const cfg = config ?? getResolvedTenantConfig();

        return resolveThemeId(cfg.branding.defaultTheme, getAppFallbackTheme());
    } catch {
        // TenantConfig not yet resolved — fall back to Vite global
        return resolveThemeId(getAppFallbackTheme(), DEFAULT_THEME);
    }
};

export const themeStore = createStore('themeStore')<{
    theme: string;
}>({ theme: getDefaultTheme() }, { persist: { name: 'themeStore', enabled: true } });

/**
 * Check whether theme switching is enabled for the current tenant.
 * Returns false when the tenant explicitly disables it or when
 * fewer than 2 themes are allowed (nothing to switch between).
 */
export const isThemeSwitchingEnabled = (config?: TenantConfig): boolean => {
    try {
        const cfg = config ?? getResolvedTenantConfig();

        if (cfg.features.themeSwitching === false) return false;

        const allowed = cfg.branding.allowedThemes;

        if (allowed && allowed.length < 2) return false;

        return true;
    } catch {
        return true;
    }
};

/**
 * Get the list of theme IDs the current tenant allows.
 * Falls back to ['colorful', 'formal'] when not configured.
 */
export const getAllowedThemes = (config?: TenantConfig): string[] => {
    const DEFAULT_ALLOWED = ['colorful', 'formal'];

    try {
        const cfg = config ?? getResolvedTenantConfig();

        return cfg.branding.allowedThemes ?? DEFAULT_ALLOWED;
    } catch {
        return DEFAULT_ALLOWED;
    }
};

export const isThemeSupported = (theme: string, config?: TenantConfig): boolean => {
    if (!isRegisteredThemeId(theme)) return false;

    try {
        const cfg = config ?? getResolvedTenantConfig();

        if (cfg.features.themeSwitching === false) {
            return theme === getDefaultTheme(cfg);
        }

        return new Set(getAllowedThemes(cfg)).has(theme);
    } catch {
        return new Set(getAllowedThemes()).has(theme);
    }
};

export const resolveThemeForTenant = (
    preferredTheme?: string | null,
    config?: TenantConfig
): string => {
    const defaultTheme = getDefaultTheme(config);

    if (!preferredTheme) return defaultTheme;

    return isThemeSupported(preferredTheme, config) ? preferredTheme : defaultTheme;
};

/**
 * Ensure the persisted theme is valid for the current tenant.
 *
 * - If theme switching is disabled, force-set to defaultTheme.
 * - If the persisted theme isn't in allowedThemes, reset to defaultTheme.
 *
 * Call this from bootstrapTenantConfig() after the config is resolved so
 * it overrides any stale persisted preference.
 */
export const enforceDefaultTheme = (): void => {
    try {
        const config = getResolvedTenantConfig();
        const defaultTheme = getDefaultTheme(config);
        const allowed = new Set(getAllowedThemes(config));
        const current = themeStore.get.theme();

        const needsReset = config.features.themeSwitching === false || !allowed.has(current);

        emitConfigDebugEvent(
            'theme:enforce_default',
            `Checking theme enforcement (current: ${current}, default: ${defaultTheme}, switching: ${config.features.themeSwitching})`,
            {
                data: {
                    current,
                    defaultTheme,
                    needsReset,
                    allowed: [...allowed],
                    themeSwitching: config.features.themeSwitching,
                },
            }
        );

        if (needsReset) {
            const reason =
                config.features.themeSwitching === false
                    ? 'theme switching disabled'
                    : `"${current}" not in allowed themes`;

            emitConfigWarning(
                'theme:enforce_reset',
                `Resetting theme from "${current}" to "${defaultTheme}" (${reason})`,
                { current, defaultTheme, reason }
            );

            // Set immediately (covers case where hydration already happened)
            themeStore.set.theme(defaultTheme);

            // Subscribe to catch async persist hydration that may overwrite
            // the value we just set. Once corrected, unsubscribe.
            const unsub = themeStore.store.subscribe(({ theme }) => {
                if (theme !== defaultTheme) {
                    themeStore.set.theme(defaultTheme);
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

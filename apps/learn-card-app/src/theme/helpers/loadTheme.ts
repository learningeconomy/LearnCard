import type { Theme } from '../validators/theme.validators';
import { loadAllJsonThemes } from './loadJsonTheme';

// ─── Dynamic theme registry ────────────────────────────────────────────

const themeRegistry = new Map<string, Theme>();

/**
 * Register a theme in the global registry.
 * Can be called externally to add themes beyond the JSON-discovered ones.
 */
export const registerTheme = (theme: Theme): void => {
    themeRegistry.set(theme.id, Object.freeze(theme));
};

// Auto-discover and register all JSON themes from schemas/*/theme.json
for (const theme of loadAllJsonThemes()) {
    registerTheme(theme);
}

/**
 * Frozen snapshot of all registered themes, keyed by ID.
 * Kept for backward compatibility with code that reads `THEMES[ThemeEnum.Colorful]`.
 */
export const THEMES: Record<string, Theme> = new Proxy({} as Record<string, Theme>, {
    get: (_target, prop: string) => themeRegistry.get(prop),
    ownKeys: () => [...themeRegistry.keys()],
    getOwnPropertyDescriptor: (_target, prop: string) => {
        const theme = themeRegistry.get(prop);

        return theme ? { configurable: true, enumerable: true, value: theme } : undefined;
    },
});

/** All registered theme IDs, in registration order. */
export const getRegisteredThemeIds = (): string[] => [...themeRegistry.keys()];

/** Check whether a theme ID exists in the registry. */
export const isRegisteredThemeId = (theme?: string | null): theme is string =>
    typeof theme === 'string' && themeRegistry.has(theme);

export type ThemeMap = Record<string, Theme>;

/**
 * Resolve a theme ID to a registered theme ID.
 * Falls back to `fallbackTheme`, then the first registered theme.
 */
export const resolveThemeId = (theme?: string | null, fallbackTheme?: string | null): string => {
    if (isRegisteredThemeId(theme)) return theme;

    if (isRegisteredThemeId(fallbackTheme)) return fallbackTheme;

    const fallback = themeRegistry.values().next().value;

    if (!fallback) {
        throw new Error(`No themes registered. Requested: "${theme}"`);
    }

    return fallback.id;
};

/**
 * Load a validated theme by its ID.
 * Falls back to the first registered theme if the ID is unknown.
 */
export const loadThemeSchema = (theme: string): Theme => {
    return themeRegistry.get(resolveThemeId(theme)) as Theme;
};

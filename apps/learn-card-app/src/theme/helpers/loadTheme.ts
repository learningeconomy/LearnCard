import { formalTheme } from '../schemas/formal';
import { colorfulTheme } from '../schemas/colorful';
import { ThemeEnum } from '../helpers/theme-helpers';
import type { Theme } from '../validators/theme.validators';

// ─── Dynamic theme registry ────────────────────────────────────────────

const themeRegistry = new Map<string, Theme>();

/**
 * Register a theme in the global registry.
 * Called at module load time by each theme schema file.
 */
export const registerTheme = (theme: Theme): void => {
    themeRegistry.set(theme.id, Object.freeze(theme));
};

// Register built-in themes
registerTheme(colorfulTheme);
registerTheme(formalTheme);

/**
 * Frozen snapshot of all registered themes, keyed by ID.
 * Kept for backward compatibility with code that reads `THEMES[ThemeEnum.Colorful]`.
 */
export const THEMES: Record<string, Theme> = new Proxy({} as Record<string, Theme>, {
    get: (_target, prop: string) => themeRegistry.get(prop),
    ownKeys: () => [...themeRegistry.keys()],
    getOwnPropertyDescriptor: (_target, prop: string) => {
        const theme = themeRegistry.get(prop);

        return theme
            ? { configurable: true, enumerable: true, value: theme }
            : undefined;
    },
});

/** All registered theme IDs, in registration order. */
export const getRegisteredThemeIds = (): string[] => [...themeRegistry.keys()];

export type ThemeMap = Record<string, Theme>;

/**
 * Load a validated theme by its ID.
 * Falls back to the first registered theme if the ID is unknown.
 */
export const loadThemeSchema = (theme: ThemeEnum | string): Theme => {
    const found = themeRegistry.get(theme);

    if (found) return found;

    const fallback = themeRegistry.values().next().value;

    if (!fallback) {
        throw new Error(`No themes registered. Requested: "${theme}"`);
    }

    return fallback;
};

/**
 * Theme ids and loader colors straight from the bundled `theme.json` files.
 *
 * The startup entry (themeStore, the boot loader) needs only these. Importing `loadTheme` instead builds
 * and validates every theme at import time and pulls in every icon set (hundreds of KB of SVG components),
 * so that stays with the screens that render themed UI.
 */
import type { ThemeJsonConfig } from '../validators/themeJson.validators';

const themeJsonModules = import.meta.glob<ThemeJsonConfig>('../schemas/*/theme.json', {
    eager: true,
    import: 'default',
});

// Keyed by folder name, in the same order loadJsonTheme registers them.
const configs = new Map<string, ThemeJsonConfig>();
for (const [path, config] of Object.entries(themeJsonModules)) {
    const match = path.match(/\/schemas\/([^/]+)\/theme\.json$/);
    if (match) configs.set(match[1], config);
}

export const isRegisteredThemeId = (theme?: string | null): theme is string =>
    typeof theme === 'string' && configs.has(theme);

/** Same contract as loadTheme's resolveThemeId: theme, then fallbackTheme, then the first theme. */
export const resolveThemeId = (theme?: string | null, fallbackTheme?: string | null): string => {
    if (isRegisteredThemeId(theme)) return theme;
    if (isRegisteredThemeId(fallbackTheme)) return fallbackTheme;

    const first = configs.keys().next().value;
    if (!first) throw new Error(`No themes registered. Requested: "${theme}"`);

    return first;
};

const NO_LOADERS: string[] = [];

/** `colors.defaults.loaders` of a theme, following `extends`. */
export const getThemeLoaderColors = (theme: string): string[] => {
    const seen = new Set<string>();
    let id: string | undefined = theme;

    while (id && !seen.has(id)) {
        seen.add(id);
        const config = configs.get(id) as
            (ThemeJsonConfig & { colors?: { defaults?: { loaders?: string[] } } }) | undefined;
        const loaders = config?.colors?.defaults?.loaders;
        if (loaders?.length) return loaders;
        id = config?.extends;
    }

    return NO_LOADERS;
};

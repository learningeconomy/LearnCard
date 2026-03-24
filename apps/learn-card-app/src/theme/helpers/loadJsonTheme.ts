/**
 * JSON-based theme loader.
 *
 * Reads `theme.json` files from `schemas/{themeId}/` folders, resolves
 * `extends` inheritance, expands shorthand color helpers (`categoryBase`,
 * `placeholderBase`), and wires up icon sets + image assets.
 *
 * The output is a validated `Theme` object identical to what the old
 * TS-based schema files produced.
 */
import React from 'react';

import { CredentialCategoryEnum, WALLET_ICON_PALETTE_DEFAULTS, deepMerge } from 'learn-card-base';
import type { IconPalette } from 'learn-card-base';

import type { Theme } from '../validators/theme.validators';
import { validateThemeData } from '../validators/theme.validators';
import { ViewMode } from '../types/theme.types';

import { resolveIconSet } from '../icons/iconSets';
import type { CategoryIcons } from '../icons';
import {
    DEFAULT_CATEGORIES,
    DEFAULT_SIDE_MENU_ROOT_LINKS,
    DEFAULT_SIDE_MENU_SECONDARY_LINKS,
    DEFAULT_NAVBAR,
} from '../shared';

// ─── Raw JSON shape (inferred from the Zod source of truth) ─────────────

import type { ThemeJsonConfig } from '../validators/themeJson.validators';
import { emitConfigDebugEvent, emitConfigWarning, emitConfigSuccess } from '../../components/debug/configDebugEvents';
import {
    ALL_CATEGORIES,
    CATEGORY_KEY_TO_VALUE,
    expandCategoryColors,
    expandPlaceholders,
} from './themeExpansion';

// ─── Glob imports (resolved at build time by Vite) ───────────────────────

const themeJsonModules = import.meta.glob<ThemeJsonConfig>(
    '../schemas/*/theme.json',
    { eager: true, import: 'default' },
);

const themeAssetModules = import.meta.glob<string>(
    '../schemas/*/assets/*',
    { eager: true, import: 'default' },
);

// ─── Helpers ─────────────────────────────────────────────────────────────
// Pure expansion utilities live in ./themeExpansion.ts for testability.

/**
 * Resolve an asset path like `"./assets/switcher-icon.png"` to a Vite-hashed
 * URL by looking it up in the glob map.
 */
const resolveAsset = (themeId: string, relativePath: string): string => {
    const fileName = relativePath.replace(/^\.\/assets\//, '');
    const globKey = `../schemas/${themeId}/assets/${fileName}`;

    // Fall back to the colorful theme's asset if the requested theme doesn't have it
    const fallbackKey = `../schemas/colorful/assets/${fileName}`;

    if (!themeAssetModules[globKey] && themeAssetModules[fallbackKey]) {
        emitConfigWarning('theme:asset_fallback', `Asset "${fileName}" missing from "${themeId}", using colorful fallback`, { themeId, fileName, globKey, fallbackKey });
    } else if (!themeAssetModules[globKey] && !themeAssetModules[fallbackKey]) {
        emitConfigWarning('theme:asset_fallback', `Asset "${fileName}" not found in "${themeId}" or colorful fallback`, { themeId, fileName });
    }

    return themeAssetModules[globKey] ?? themeAssetModules[fallbackKey] ?? relativePath;
};

// ─── Theme resolution cache ──────────────────────────────────────────────

const resolvedCache = new Map<string, ThemeJsonConfig>();

/**
 * Parse all discovered `theme.json` files into a raw config map keyed by ID.
 */
const getRawConfigs = (): Map<string, ThemeJsonConfig> => {
    const configs = new Map<string, ThemeJsonConfig>();

    for (const [path, config] of Object.entries(themeJsonModules)) {
        // path looks like "../schemas/formal/theme.json"
        const match = path.match(/\/schemas\/([^/]+)\/theme\.json$/);

        if (match) {
            configs.set(match[1], config);
        }
    }

    return configs;
};

const rawConfigs = getRawConfigs();

/**
 * Recursively resolve a theme's `extends` chain, deep-merging parent → child.
 * Detects cycles.
 */
const resolveExtends = (
    id: string,
    seen: Set<string> = new Set(),
): ThemeJsonConfig => {
    if (resolvedCache.has(id)) return resolvedCache.get(id)!;

    const config = rawConfigs.get(id);

    if (!config) {
        throw new Error(`Theme "${id}" not found. Available: ${[...rawConfigs.keys()].join(', ')}`);
    }

    if (seen.has(id)) {
        throw new Error(`Circular theme extends: ${[...seen, id].join(' → ')}`);
    }

    seen.add(id);

    let resolved: ThemeJsonConfig;

    if (config.extends) {
        const parent = resolveExtends(config.extends, seen);

        resolved = deepMerge(
            parent as unknown as Record<string, unknown>,
            config as unknown as Record<string, unknown>,
        ) as unknown as ThemeJsonConfig;

        // Child's id and displayName always win
        resolved.id = config.id;
        resolved.displayName = config.displayName;
    } else {
        resolved = { ...config };
    }

    resolvedCache.set(id, resolved);

    return resolved;
};

// ─── Icon palette wiring ─────────────────────────────────────────────────

/** Map CredentialCategoryEnum values to WALLET_ICON_PALETTE_DEFAULTS keys. */
const CATEGORY_TO_PALETTE_KEY: Partial<Record<CredentialCategoryEnum, string>> = {
    [CredentialCategoryEnum.aiTopic]: 'AiSessions',
    [CredentialCategoryEnum.aiPathway]: 'AiPathways',
    [CredentialCategoryEnum.aiInsight]: 'AiInsights',
    [CredentialCategoryEnum.skill]: 'Skills',
    [CredentialCategoryEnum.socialBadge]: 'Boosts',
    [CredentialCategoryEnum.achievement]: 'Achievements',
    [CredentialCategoryEnum.learningHistory]: 'Studies',
    [CredentialCategoryEnum.accomplishment]: 'Portfolio',
    [CredentialCategoryEnum.accommodation]: 'Assistance',
    [CredentialCategoryEnum.workHistory]: 'Experiences',
    [CredentialCategoryEnum.family]: 'Families',
    [CredentialCategoryEnum.id]: 'IDs',
};

/**
 * Wrap an icon component so it always receives the given `palette` prop.
 * Existing render-sites that only pass `className` / `version` will
 * automatically pick up the themed palette.
 */
const wrapIconWithPalette = (
    Component: React.ComponentType<Record<string, unknown>>,
    palette: Partial<IconPalette>,
): React.ComponentType<Record<string, unknown>> => {
    const Wrapped: React.FC<Record<string, unknown>> = props =>
        React.createElement(Component, { ...props, palette });

    return Wrapped;
};

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * Build a fully validated `Theme` object from a `theme.json` config.
 */
const buildTheme = (config: ThemeJsonConfig): Theme => {
    const colors = config.colors ?? {};

    // Expand category colors
    const categoryColors = expandCategoryColors(colors);

    // Expand placeholders
    const placeholders = expandPlaceholders(colors);

    // Assemble the full color table
    const colorTable: Record<string, unknown> = {
        ...categoryColors,
        launchPad: colors.launchPad ?? {},
        sideMenu: colors.sideMenu ?? {},
        navbar: colors.navbar ?? {},
        introSlides: colors.introSlides ?? {},
        placeholders,
        defaults: colors.defaults ?? {},
    };

    // Resolve icon set (supports full sets and partial sets with inheritance)
    const iconSetName = config.iconSet ?? 'colorful';
    const iconSet = resolveIconSet(iconSetName);

    // Resolve view mode
    const viewMode = config.defaults?.viewMode === 'grid' ? ViewMode.Grid : ViewMode.List;

    // Resolve image assets
    const switcherIcon = resolveAsset(config.id, './assets/switcher-icon.png');
    const buildMyLCIcon = resolveAsset(config.id, './assets/blocks-icon.png');

    // Assemble styles
    const styles = config.styles ?? {};

    // Build resolved icon palettes: start from compiled defaults, merge theme overrides
    const resolvedIconPalettes: Record<string, Required<IconPalette>> = { ...WALLET_ICON_PALETTE_DEFAULTS };

    if (config.iconPalettes) {
        for (const [key, overrides] of Object.entries(config.iconPalettes)) {
            const base = resolvedIconPalettes[key] ?? WALLET_ICON_PALETTE_DEFAULTS[key];

            if (base) {
                resolvedIconPalettes[key] = { ...base, ...overrides };
            }
        }
    }

    // Apply palette overrides to icon components by wrapping them
    let themedIcons = iconSet;

    if (config.iconPalettes && Object.keys(config.iconPalettes).length > 0) {
        themedIcons = { ...iconSet };

        for (const cat of ALL_CATEGORIES) {
            const paletteKey = CATEGORY_TO_PALETTE_KEY[cat];

            if (!paletteKey || !config.iconPalettes[paletteKey]) continue;

            const palette = resolvedIconPalettes[paletteKey];
            const catIcons = iconSet[cat];

            if (!catIcons) continue;

            const wrapped: CategoryIcons = {};

            if (catIcons.Icon) {
                wrapped.Icon = wrapIconWithPalette(
                    catIcons.Icon as React.ComponentType<Record<string, unknown>>,
                    palette,
                ) as CategoryIcons['Icon'];
            }

            if (catIcons.IconWithShape) {
                wrapped.IconWithShape = wrapIconWithPalette(
                    catIcons.IconWithShape as React.ComponentType<Record<string, unknown>>,
                    palette,
                ) as CategoryIcons['IconWithShape'];
            }

            if (catIcons.IconWithLightShape) {
                wrapped.IconWithLightShape = wrapIconWithPalette(
                    catIcons.IconWithLightShape as React.ComponentType<Record<string, unknown>>,
                    palette,
                ) as CategoryIcons['IconWithLightShape'];
            }

            themedIcons[cat] = wrapped;
        }
    }

    return validateThemeData({
        id: config.id,
        name: config.id,
        displayName: config.displayName,
        colors: colorTable,
        icons: themedIcons,
        iconPalettes: resolvedIconPalettes,
        styles,
        defaults: {
            viewMode,
            switcherIcon,
            buildMyLCIcon,
        },
        categories: DEFAULT_CATEGORIES,
        sideMenuRootLinks: DEFAULT_SIDE_MENU_ROOT_LINKS,
        sideMenuSecondaryLinks: DEFAULT_SIDE_MENU_SECONDARY_LINKS,
        navbar: DEFAULT_NAVBAR,
    });
};

/**
 * Discover all JSON theme folders and return validated Theme objects.
 * Results are cached after first call.
 */
export const loadAllJsonThemes = (): Theme[] => {
    const themes: Theme[] = [];

    for (const id of rawConfigs.keys()) {
        try {
            const resolved = resolveExtends(id);

            themes.push(buildTheme(resolved));

            emitConfigSuccess('theme:loaded', `Theme "${id}" loaded${resolved.extends ? ` (extends ${resolved.extends})` : ''}`, { themeId: id, extends: resolved.extends, displayName: resolved.displayName });
        } catch (err) {
            emitConfigWarning('theme:loaded', `Failed to load theme "${id}": ${err instanceof Error ? err.message : String(err)}`, { themeId: id, error: err instanceof Error ? err.message : String(err) });
        }
    }

    emitConfigDebugEvent('theme:store_init', `${themes.length} theme(s) loaded: ${themes.map(t => t.id).join(', ')}`, { data: { count: themes.length, themeIds: themes.map(t => t.id) } });

    return themes;
};

/** Get all discovered JSON theme IDs. */
export const getJsonThemeIds = (): string[] => [...rawConfigs.keys()];

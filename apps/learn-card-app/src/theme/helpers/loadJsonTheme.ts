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

import { ICON_SETS } from '../icons/iconSets';
import type { CategoryIcons } from '../icons';
import {
    DEFAULT_CATEGORIES,
    DEFAULT_SIDE_MENU_ROOT_LINKS,
    DEFAULT_SIDE_MENU_SECONDARY_LINKS,
    DEFAULT_NAVBAR,
} from '../shared';

// ─── Raw JSON shape ──────────────────────────────────────────────────────

interface ThemeJsonColors {
    /** Uniform base applied to every credential category (formal-style). */
    categoryBase?: Record<string, string>;

    /** Per-category overrides. Merged on top of categoryBase if both exist. */
    categories?: Record<string, Record<string, string>>;

    launchPad?: Record<string, unknown>;
    sideMenu?: Record<string, string>;
    navbar?: Record<string, string>;
    introSlides?: Record<string, unknown>;

    /** Shorthand: a single placeholder applied to every category + defaults. */
    placeholderBase?: Record<string, unknown>;

    /** Explicit per-category placeholders (colorful-style). */
    placeholders?: Record<string, unknown>;

    defaults?: Record<string, unknown>;
}

interface ThemeJsonConfig {
    id: string;
    displayName: string;

    /** Parent theme ID. All unset fields inherit from the parent. */
    extends?: string;

    /** Icon set name (key into ICON_SETS). Defaults to parent's set. */
    iconSet?: string;

    /**
     * Per-category icon color overrides.
     * Keys match the WALLET_ICON_PALETTE_DEFAULTS map keys
     * (e.g. "Skills", "Boosts", "AiInsights").
     * Values are partial IconPalette objects merged over the compiled defaults.
     */
    iconPalettes?: Record<string, Partial<IconPalette>>;

    defaults?: {
        viewMode?: 'list' | 'grid';
    };

    colors?: ThemeJsonColors;

    styles?: Record<string, unknown>;
}

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

const ALL_CATEGORIES = Object.values(CredentialCategoryEnum);

/**
 * Map from enum key (camelCase, used in JSON) → enum value (spaced string, used at runtime).
 * e.g. 'socialBadge' → 'Social Badge'
 */
const CATEGORY_KEY_TO_VALUE: Record<string, CredentialCategoryEnum> = {};

for (const [key, value] of Object.entries(CredentialCategoryEnum)) {
    CATEGORY_KEY_TO_VALUE[key] = value as CredentialCategoryEnum;
}

/** Resolve a JSON category key to its runtime enum value, falling through as-is if no mapping. */
const resolveCategoryKey = (key: string): string => CATEGORY_KEY_TO_VALUE[key] ?? key;

/**
 * Expand `categoryBase` + optional `categories` overrides into a full
 * per-`CredentialCategoryEnum` color map.
 */
const expandCategoryColors = (
    colors: ThemeJsonColors,
): Record<string, Record<string, string>> => {
    const base = colors.categoryBase ?? {};
    const overrides = colors.categories ?? {};

    const result: Record<string, Record<string, string>> = {};

    for (const cat of ALL_CATEGORIES) {
        // Find overrides using either the enum value or the JSON key
        const jsonKey = Object.entries(CATEGORY_KEY_TO_VALUE).find(([, v]) => v === cat)?.[0];
        const catOverrides = overrides[cat] ?? (jsonKey ? overrides[jsonKey] : undefined);

        result[cat] = { ...base, ...catOverrides };
    }

    return result;
};

/**
 * Expand `placeholderBase` into per-category placeholder entries,
 * or pass through explicit `placeholders` as-is.
 */
const expandPlaceholders = (
    colors: ThemeJsonColors,
): Record<string, unknown> => {
    if (colors.placeholders) {
        // Remap JSON keys (camelCase) to enum values (spaced strings)
        return remapCategoryKeys(colors.placeholders);
    }

    if (!colors.placeholderBase) return {};

    const result: Record<string, unknown> = {};

    for (const cat of ALL_CATEGORIES) {
        result[cat] = { ...colors.placeholderBase };
    }

    result['defaults'] = { ...colors.placeholderBase };

    return result;
};

/** Remap object keys from JSON enum keys to runtime enum values. */
const remapCategoryKeys = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        result[resolveCategoryKey(key)] = value;
    }

    return result;
};

/**
 * Resolve an asset path like `"./assets/switcher-icon.png"` to a Vite-hashed
 * URL by looking it up in the glob map.
 */
const resolveAsset = (themeId: string, relativePath: string): string => {
    const globKey = `../schemas/${themeId}/assets/${relativePath.replace(/^\.\/assets\//, '')}`;

    return themeAssetModules[globKey] ?? relativePath;
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

    // Resolve icon set
    const iconSetName = config.iconSet ?? 'colorful';
    const iconSet = ICON_SETS[iconSetName];

    if (!iconSet) {
        throw new Error(
            `Icon set "${iconSetName}" not found for theme "${config.id}". ` +
            `Available: ${Object.keys(ICON_SETS).join(', ')}`,
        );
    }

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
        const resolved = resolveExtends(id);

        themes.push(buildTheme(resolved));
    }

    return themes;
};

/** Get all discovered JSON theme IDs. */
export const getJsonThemeIds = (): string[] => [...rawConfigs.keys()];

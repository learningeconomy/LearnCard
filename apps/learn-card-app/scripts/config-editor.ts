#!/usr/bin/env npx tsx

/**
 * config-editor.ts
 *
 * Lightweight dev server for the tenant config editor UI.
 * Serves the SPA and provides REST endpoints for tenant CRUD + validation.
 *
 * Usage:
 *   npx tsx scripts/config-editor.ts
 *   pnpm config-editor
 *
 * Opens http://localhost:4400 in your default browser.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync, rmSync } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';

import { z } from 'zod';

import { tenantConfigSchema } from 'learn-card-base/src/config/tenantConfigSchema';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/src/config/tenantDefaults';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const ENVIRONMENTS_DIR = resolve(APP_ROOT, 'environments');
const TOOLS_DIR = resolve(APP_ROOT, 'tools/config-editor');
const LANDING_PATH = resolve(TOOLS_DIR, 'index.html');
const CONFIG_SPA_PATH = resolve(TOOLS_DIR, 'config.html');
const THEMES_SPA_PATH = resolve(TOOLS_DIR, 'themes.html');

const PORT = 4400;

// ---------------------------------------------------------------------------
// Deep merge (same as prepare-native-config.ts)
// ---------------------------------------------------------------------------

const deepMerge = (
    base: Record<string, unknown>,
    overrides: Record<string, unknown>
): Record<string, unknown> => {
    const result = { ...base };

    for (const key of Object.keys(overrides)) {
        const baseVal = base[key];
        const overrideVal = overrides[key];

        if (
            baseVal && overrideVal &&
            typeof baseVal === 'object' && !Array.isArray(baseVal) &&
            typeof overrideVal === 'object' && !Array.isArray(overrideVal)
        ) {
            result[key] = deepMerge(
                baseVal as Record<string, unknown>,
                overrideVal as Record<string, unknown>,
            );
        } else {
            result[key] = overrideVal;
        }
    }

    return result;
};

// ---------------------------------------------------------------------------
// Compute overrides (diff against defaults)
// ---------------------------------------------------------------------------

const computeOverrides = (
    merged: Record<string, unknown>,
    defaults: Record<string, unknown>
): Record<string, unknown> => {
    const overrides: Record<string, unknown> = {};

    for (const key of Object.keys(merged)) {
        if (key.startsWith('_')) continue;

        const mergedVal = merged[key];
        const defaultVal = defaults[key];

        if (mergedVal === defaultVal) continue;

        if (
            mergedVal && defaultVal &&
            typeof mergedVal === 'object' && !Array.isArray(mergedVal) &&
            typeof defaultVal === 'object' && !Array.isArray(defaultVal)
        ) {
            const nested = computeOverrides(
                mergedVal as Record<string, unknown>,
                defaultVal as Record<string, unknown>,
            );

            if (Object.keys(nested).length > 0) {
                overrides[key] = nested;
            }
        } else if (JSON.stringify(mergedVal) !== JSON.stringify(defaultVal)) {
            overrides[key] = mergedVal;
        }
    }

    return overrides;
};

// ---------------------------------------------------------------------------
// Theme JSON validation (Zod schema for the raw theme.json input format)
// ---------------------------------------------------------------------------

// Category keys that appear in theme.json (camelCase enum keys from CredentialCategoryEnum)
const VALID_CATEGORY_KEYS = new Set([
    'socialBadge', 'achievement', 'accomplishment', 'accommodation',
    'workHistory', 'experience', 'learningHistory', 'course',
    'skill', 'events', 'family', 'relationship',
    'meritBadge', 'troops', 'globalAdminId', 'nationalNetworkAdminId',
    'troopLeaderId', 'scoutId', 'aiSummary', 'aiTopic', 'aiPathway',
    'aiInsight', 'aiAssessment', 'membership', 'goals', 'id', 'currency',
]);

const CategoryColorFieldSchema = z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    indicatorColor: z.string().optional(),
    borderColor: z.string().optional(),
    statusBarColor: z.string().optional(),
    headerBrandingTextColor: z.string().optional(),
    headerTextColor: z.string().optional(),
    backgroundPrimaryColor: z.string().optional(),
    backgroundSecondaryColor: z.string().optional(),
    tabActiveColor: z.string().optional(),
}).strict();

const SpilledCupSchema = z.object({
    backsplash: z.string(),
    spill: z.string(),
    cupOutline: z.string(),
}).strict();

const LaunchPadItemSchema = z.object({
    color: z.string().optional(),
    indicatorTextColor: z.string().optional(),
    indicatorBgColor: z.string().optional(),
}).strict();

const RawThemeColorsSchema = z.object({
    categoryBase: CategoryColorFieldSchema.optional(),
    categories: z.record(z.string(), CategoryColorFieldSchema).optional(),

    launchPad: z.object({
        contacts: LaunchPadItemSchema.optional(),
        aiSessions: LaunchPadItemSchema.optional(),
        alerts: LaunchPadItemSchema.optional(),
        buttons: z.object({
            connected: z.string().optional(),
            unconnected: z.string().optional(),
        }).optional(),
    }).optional(),

    sideMenu: z.object({
        linkActiveColor: z.string().optional(),
        linkInactiveColor: z.string().optional(),
        linkActiveBackgroundColor: z.string().optional(),
        linkInactiveBackgroundColor: z.string().optional(),
        primaryButtonColor: z.string().optional(),
        secondaryButtonColor: z.string().optional(),
        indicatorColor: z.string().optional(),
        syncingColor: z.string().optional(),
        completedColor: z.string().optional(),
    }).optional(),

    navbar: z.object({
        activeColor: z.string().optional(),
        inactiveColor: z.string().optional(),
        syncingColor: z.string().optional(),
        completedColor: z.string().optional(),
    }).optional(),

    introSlides: z.object({
        firstSlideBackground: z.string().optional(),
        secondSlideBackground: z.string().optional(),
        thirdSlideBackground: z.string().optional(),
        textColors: z.object({ primary: z.string(), secondary: z.string() }).optional(),
        pagination: z.object({ primary: z.string(), secondary: z.string() }).optional(),
    }).optional(),

    placeholderBase: z.object({ spilledCup: SpilledCupSchema }).optional(),
    placeholders: z.record(z.string(), z.object({ spilledCup: SpilledCupSchema }).optional()).optional(),

    defaults: z.object({
        primaryColor: z.string().optional(),
        primaryColorShade: z.string().optional(),
        loaders: z.array(z.string()).optional(),
    }).optional(),
}).strict();

const RawThemeStylesSchema = z.object({
    wallet: z.object({
        cardStyles: z.string(),
        iconStyles: z.string(),
    }).optional(),
    launchPad: z.object({
        textStyles: z.string(),
        iconStyles: z.string(),
        indicatorStyles: z.string().optional(),
    }).optional(),
    defaults: z.object({
        tabs: z.object({ borderRadius: z.string() }).optional(),
    }).optional(),
}).strict();

const IconPaletteOverrideSchema = z.object({
    primary: z.string().optional(),
    primaryLight: z.string().optional(),
    accent: z.string().optional(),
    stroke: z.string().optional(),
});

const RawThemeConfigSchema = z.object({
    id: z.string(),
    displayName: z.string().min(1, 'displayName must not be empty'),
    extends: z.string().optional(),
    iconSet: z.string().optional(),
    iconPalettes: z.record(z.string(), IconPaletteOverrideSchema).optional(),
    defaults: z.object({
        viewMode: z.enum(['grid', 'list']).optional(),
    }).optional(),
    colors: RawThemeColorsSchema.optional(),
    styles: RawThemeStylesSchema.optional(),
}).strict();

interface ThemeValidationResult {
    valid: boolean;
    errors: { path: string; message: string }[];
    warnings: { path: string; message: string }[];
}

const validateThemeConfig = (config: unknown): ThemeValidationResult => {
    const errors: { path: string; message: string }[] = [];
    const warnings: { path: string; message: string }[] = [];

    // 1. Structural + type validation via Zod
    const result = RawThemeConfigSchema.safeParse(config);

    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push({
                path: issue.path.join('.'),
                message: issue.message,
            });
        }
    }

    // 2. Semantic warnings (valid structure but questionable values)
    if (typeof config === 'object' && config !== null) {
        const obj = config as Record<string, unknown>;

        // Check category keys in colors.categories
        const categories = (obj.colors as Record<string, unknown>)?.categories as Record<string, unknown> | undefined;

        if (categories && typeof categories === 'object') {
            for (const key of Object.keys(categories)) {
                if (!VALID_CATEGORY_KEYS.has(key)) {
                    warnings.push({
                        path: `colors.categories.${key}`,
                        message: `Unknown category key "${key}" — not in CredentialCategoryEnum`,
                    });
                }
            }
        }

        // Check placeholders keys
        const placeholders = (obj.colors as Record<string, unknown>)?.placeholders as Record<string, unknown> | undefined;

        if (placeholders && typeof placeholders === 'object') {
            for (const key of Object.keys(placeholders)) {
                if (key !== 'defaults' && !VALID_CATEGORY_KEYS.has(key)) {
                    warnings.push({
                        path: `colors.placeholders.${key}`,
                        message: `Unknown placeholder category "${key}"`,
                    });
                }
            }
        }

        // Check extends references an existing theme
        if (obj.extends && typeof obj.extends === 'string') {
            const parentDir = join(THEME_SCHEMAS_DIR, obj.extends);

            if (!existsSync(join(parentDir, 'theme.json'))) {
                warnings.push({
                    path: 'extends',
                    message: `Parent theme "${obj.extends}" not found on disk`,
                });
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
};

// ---------------------------------------------------------------------------
// API handlers
// ---------------------------------------------------------------------------

const listTenants = (): { name: string; hasConfig: boolean; hasAssets: boolean }[] => {
    if (!existsSync(ENVIRONMENTS_DIR)) return [];

    return readdirSync(ENVIRONMENTS_DIR)
        .filter(name => {
            const full = join(ENVIRONMENTS_DIR, name);

            return statSync(full).isDirectory();
        })
        .map(name => ({
            name,
            hasConfig: existsSync(join(ENVIRONMENTS_DIR, name, 'config.json')),
            hasAssets: existsSync(join(ENVIRONMENTS_DIR, name, 'assets')),
        }));
};

const readTenantConfig = (tenant: string): { overrides: Record<string, unknown>; merged: Record<string, unknown> } => {
    const configPath = join(ENVIRONMENTS_DIR, tenant, 'config.json');
    let overrides: Record<string, unknown> = {};

    if (existsSync(configPath)) {
        overrides = JSON.parse(readFileSync(configPath, 'utf-8'));
    }

    const merged = deepMerge(
        DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
        overrides,
    );

    return { overrides, merged };
};

const validateConfig = (config: Record<string, unknown>): { valid: boolean; errors: string[]; data?: Record<string, unknown> } => {
    const result = tenantConfigSchema.safeParse(config);

    if (result.success) {
        return { valid: true, errors: [], data: result.data as unknown as Record<string, unknown> };
    }

    return {
        valid: false,
        errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    };
};

const saveTenantConfig = (tenant: string, overrides: Record<string, unknown>): void => {
    const tenantDir = join(ENVIRONMENTS_DIR, tenant);

    if (!existsSync(tenantDir)) {
        mkdirSync(tenantDir, { recursive: true });
    }

    writeFileSync(
        join(tenantDir, 'config.json'),
        JSON.stringify(overrides, null, 4) + '\n',
        'utf-8',
    );
};

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.ico']);

const MIME_TYPES: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
};

const listTenantAssets = (tenant: string): { path: string; name: string; size: number }[] => {
    const assetsDir = join(ENVIRONMENTS_DIR, tenant, 'assets');

    if (!existsSync(assetsDir)) return [];

    const results: { path: string; name: string; size: number }[] = [];

    const walk = (dir: string, prefix: string) => {
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry);
            const rel = prefix ? `${prefix}/${entry}` : entry;
            const stat = statSync(full);

            if (stat.isDirectory()) {
                walk(full, rel);
            } else if (IMAGE_EXTENSIONS.has(extname(entry).toLowerCase())) {
                results.push({ path: rel, name: entry, size: stat.size });
            }
        }
    };

    walk(assetsDir, '');

    return results;
};

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const readBody = (req: IncomingMessage): Promise<string> =>
    new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });

const readRawBody = (req: IncomingMessage, maxBytes = 20 * 1024 * 1024): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let size = 0;

        req.on('data', (chunk: Buffer) => {
            size += chunk.length;

            if (size > maxBytes) {
                req.destroy();
                reject(new Error('Body too large'));
                return;
            }

            chunks.push(chunk);
        });

        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });

const runScript = (cmd: string, args: string[]): Promise<{ exitCode: number; output: string }> =>
    new Promise((resolve) => {
        const child = spawn(cmd, args, { cwd: APP_ROOT, shell: true });
        let output = '';

        child.stdout.on('data', (d: Buffer) => { output += d.toString(); });
        child.stderr.on('data', (d: Buffer) => { output += d.toString(); });

        child.on('close', (code) => {
            resolve({ exitCode: code ?? 1, output });
        });

        child.on('error', (err) => {
            resolve({ exitCode: 1, output: output + '\n' + String(err) });
        });
    });

const json = (res: ServerResponse, status: number, data: unknown): void => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

// ---------------------------------------------------------------------------
// Theme editor helpers (JSON folder-based)
// ---------------------------------------------------------------------------

const THEME_DIR = resolve(APP_ROOT, 'src/theme');
const THEME_SCHEMAS_DIR = resolve(THEME_DIR, 'schemas');

// ---------------------------------------------------------------------------
// Icon SVG preview helpers
// ---------------------------------------------------------------------------

const ICON_SVG_DIR_COLORFUL = resolve(APP_ROOT, '../../packages/learn-card-base/src/svgs/wallet');
const ICON_SVG_DIR_FORMAL = resolve(APP_ROOT, '../../packages/learn-card-base/src/svgs/walletsIconsFormal');

interface IconMeta {
    /** Colorful source file (in wallet/) */
    file: string;
    /** Which exported component to extract for colorful/WithShape variant */
    component: string;
    /** Formal source file (in walletsIconsFormal/), if it exists */
    formalFile?: string;
    /** Which exported component to extract for formal variant */
    formalComponent?: string;
    /** Hardcoded fill/stroke color in the formal SVG (used for color substitution) */
    formalColor?: string;
    defaults: { primary: string; primaryLight: string; accent: string; stroke: string };
}

const ICON_META: Record<string, IconMeta> = {
    AiSessions: {
        file: 'AiSessionsIcon.tsx',
        component: 'AiSessionsIconWithShape',
        formalFile: 'AiSessionsIconFormal.tsx',
        formalComponent: 'AiSessionsIconFormal',
        formalColor: '#6366F1',
        defaults: { primary: '#22D3EE', primaryLight: '#A5F3FC', accent: '#6366F1', stroke: '#6366F1' },
    },
    AiPathways: {
        file: 'AiPathwaysIcon.tsx',
        component: 'AiPathwaysIconWithShape',
        formalFile: 'AiPathwaysIconFormal.tsx',
        formalComponent: 'AiPathwaysIconFormal',
        formalColor: '#14B8A6',
        defaults: { primary: '#2DD4BF', primaryLight: '#2DD4BF', accent: '#6366F1', stroke: '#0F766E' },
    },
    AiInsights: {
        file: 'AiInsightsIcon.tsx',
        component: 'AiInsightsIconWithShape',
        formalFile: 'AiInsightsIconFormal.tsx',
        formalComponent: 'AiInsightsIconFormal',
        formalColor: '#84CC16',
        defaults: { primary: '#A3E635', primaryLight: '#BEF264', accent: '#6366F1', stroke: '#4D7C0F' },
    },
    Skills: {
        file: 'SkillsIcon.tsx',
        component: 'SkillsIconWithShape',
        formalFile: 'SkillsIconFormal.tsx',
        formalComponent: 'SkillsIconFormal',
        formalColor: '#8B5CF6',
        defaults: { primary: '#A78BFA', primaryLight: '#C4B5FD', accent: '#8e51ff', stroke: '#6D28D9' },
    },
    Boosts: {
        file: 'BoostsIcon.tsx',
        component: 'BoostsIconWithShape',
        formalFile: 'BoostsIconFormal.tsx',
        formalComponent: 'BoostsIconFormal',
        formalColor: '#3B82F6',
        defaults: { primary: '#60A5FA', primaryLight: '#93C5FD', accent: '#22D3EE', stroke: '#1D4ED8' },
    },
    Achievements: {
        file: 'AchievementsIcon.tsx',
        component: 'AchievementsIconWithShape',
        formalFile: 'AchievementsIconFormal.tsx',
        formalComponent: 'AchievementsIconFormal',
        formalColor: '#F43F5E',
        defaults: { primary: '#F472B6', primaryLight: '#F9A8D4', accent: '#FDE047', stroke: '#BE185D' },
    },
    Studies: {
        file: 'StudiesIcon.tsx',
        component: 'StudiesIconWithShape',
        formalFile: 'StudiesIconFormal.tsx',
        formalComponent: 'StudiesIconFormal',
        formalColor: '#10B981',
        defaults: { primary: '#34D399', primaryLight: '#34D399', accent: '#BEF264', stroke: '#047857' },
    },
    Portfolio: {
        file: 'PortfolioIcon.tsx',
        component: 'PortfolioIconWithShape',
        formalFile: 'PortfolioIconFormal.tsx',
        formalComponent: 'PortfolioIconFormal',
        formalColor: '#EAB308',
        defaults: { primary: '#FACC15', primaryLight: '#FDE047', accent: '#34D399', stroke: '#A16207' },
    },
    Assistance: {
        file: 'AssistanceIcon.tsx',
        component: 'AssistanceIconWithShape',
        formalFile: 'AssistanceIconFormal.tsx',
        formalComponent: 'AssistanceIconFormal',
        formalColor: '#5B21B6',
        defaults: { primary: '#A78BFA', primaryLight: '#C4B5FD', accent: '#EC4899', stroke: '#5B21B6' },
    },
    Experiences: {
        file: 'ExperiencesIcon.tsx',
        component: 'ExperiencesIconWithShape',
        formalFile: 'ExperiencesIconFormal.tsx',
        formalComponent: 'ExperiencesIconFormal',
        formalColor: '#06B6D4',
        defaults: { primary: '#22D3EE', primaryLight: '#A5F3FC', accent: '#FEF08A', stroke: '#0E7490' },
    },
    Families: {
        file: 'FamiliesIcon.tsx',
        component: 'FamiliesIconWithShape',
        formalFile: 'FamiliesIconFormal.tsx',
        formalComponent: 'FamiliesIconFormal',
        formalColor: '#D97706',
        defaults: { primary: '#FBBF24', primaryLight: '#FDE047', accent: '#22D3EE', stroke: '#92400E' },
    },
    IDs: {
        file: 'IDsIcon.tsx',
        component: 'IDsIconWithShape',
        formalFile: 'IDsIconFormal.tsx',
        formalComponent: 'IDsIconFormal',
        formalColor: '#1E40AF',
        defaults: { primary: '#60A5FA', primaryLight: '#93C5FD', accent: '#EC4899', stroke: '#1E40AF' },
    },
    AllBoosts: {
        file: 'AllBoostsIcon.tsx',
        component: 'AllBoostsIcon',
        formalFile: 'AllBoostsIcon.tsx',
        formalComponent: 'AllBoostsIcon',
        defaults: { primary: '#353E64', primaryLight: '#353E64', accent: '#18224E', stroke: '#353E64' },
    },
};

/** Cache of extracted SVG templates keyed by `iconKey:componentName` */
const svgTemplateCache = new Map<string, string>();

/**
 * Extract the SVG from a specific React component in a TSX file.
 * Returns an SVG string with `{p.primary}` etc. as literal placeholders (colorful)
 * or hardcoded colors (formal).
 */
const extractSvgTemplate = (iconKey: string, variant: 'colorful' | 'formal' = 'colorful'): string | null => {
    const meta = ICON_META[iconKey];

    if (!meta) return null;

    const isFormal = variant === 'formal';
    const fileName = isFormal ? meta.formalFile : meta.file;
    const componentName = isFormal ? meta.formalComponent : meta.component;

    if (!fileName || !componentName) return null;

    const cacheKey = `${iconKey}:${variant}:${componentName}`;
    const cached = svgTemplateCache.get(cacheKey);

    if (cached) return cached;

    const baseDir = isFormal ? ICON_SVG_DIR_FORMAL : ICON_SVG_DIR_COLORFUL;
    const filePath = join(baseDir, fileName);

    if (!existsSync(filePath)) return null;

    const source = readFileSync(filePath, 'utf-8');

    // Find the target component declaration
    const componentPattern = new RegExp(
        `export\\s+const\\s+${componentName}[^=]*=[^>]*>\\s*\\{`,
    );
    const componentMatch = componentPattern.exec(source);

    if (!componentMatch) return null;

    const searchStart = componentMatch.index!;

    // Find the <svg from this component
    const svgStart = source.indexOf('<svg', searchStart);

    if (svgStart < 0) return null;

    // Find matching </svg> — count nested svg tags
    let depth = 0;
    let i = svgStart;

    while (i < source.length) {
        if (source[i] === '<') {
            if (source.substring(i, i + 4) === '<svg') {
                depth++;
            } else if (source.substring(i, i + 6) === '</svg>') {
                depth--;

                if (depth === 0) {
                    const svgRaw = source.substring(svgStart, i + 6);

                    svgTemplateCache.set(cacheKey, svgRaw);
                    return svgRaw;
                }
            }
        }

        i++;
    }

    return null;
};

/**
 * Convert JSX SVG attributes to valid HTML SVG and substitute palette colors.
 */
const renderIconSvg = (
    iconKey: string,
    palette: { primary: string; primaryLight: string; accent: string; stroke: string },
    variant: 'colorful' | 'formal' = 'colorful',
    hasPrimaryOverride = true,
): string | null => {
    const template = extractSvgTemplate(iconKey, variant);

    if (!template) return null;

    const meta = ICON_META[iconKey];

    let svg = template;

    if (variant === 'formal') {
        // Formal icons use dynamic {fillColor} / {strokeColor} JSX expressions
        const color = hasPrimaryOverride ? palette.primary : (meta?.formalColor ?? '#666');

        svg = svg.replace(/=\{fillColor\}/g, `="${color}"`);
        svg = svg.replace(/=\{strokeColor\}/g, `="${color}"`);

        // Also replace any remaining hardcoded hex colors (legacy formal icons)
        if (meta?.formalColor && hasPrimaryOverride) {
            const escapedHex = meta.formalColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const hexPattern = new RegExp(escapedHex, 'gi');

            svg = svg.replace(hexPattern, palette.primary);
        }
    } else {
        // Colorful icons use JSX palette expressions: fill={p.primary} → fill="<hex>"
        svg = svg.replace(/=\{p\.primary\}/g, `="${palette.primary}"`);
        svg = svg.replace(/=\{p\.primaryLight\}/g, `="${palette.primaryLight}"`);
        svg = svg.replace(/=\{p\.accent\}/g, `="${palette.accent}"`);
        svg = svg.replace(/=\{p\.stroke\}/g, `="${palette.stroke}"`);
    }

    // Replace any remaining {fill} or similar JSX expressions with defaults
    svg = svg.replace(/=\{fill\}/g, '="white"');

    // Convert JSX camelCase attributes to kebab-case HTML SVG attributes
    svg = svg.replace(/className=/g, 'class=');
    svg = svg.replace(/fillRule=/g, 'fill-rule=');
    svg = svg.replace(/clipRule=/g, 'clip-rule=');
    svg = svg.replace(/strokeWidth=/g, 'stroke-width=');
    svg = svg.replace(/strokeLinecap=/g, 'stroke-linecap=');
    svg = svg.replace(/strokeLinejoin=/g, 'stroke-linejoin=');
    svg = svg.replace(/strokeMiterlimit=/g, 'stroke-miterlimit=');
    svg = svg.replace(/strokeDasharray=/g, 'stroke-dasharray=');
    svg = svg.replace(/strokeDashoffset=/g, 'stroke-dashoffset=');
    svg = svg.replace(/xlinkHref=/g, 'xlink:href=');
    svg = svg.replace(/xmlSpace=/g, 'xml:space=');

    // Remove JSX className references like class={className} or class={`... ${className}`}
    svg = svg.replace(/\s+class=\{[^}]*\}/g, '');

    // Remove any remaining JSX expressions in attributes
    svg = svg.replace(/=\{[^}]*\}/g, '=""');

    return svg;
};

interface ThemeInfo {
    id: string;
    displayName: string;
    extends?: string;
    iconSet?: string;
    configPath: string;
}

/**
 * Auto-discover themes by scanning schemas/{name}/theme.json folders.
 */
const listThemes = (): ThemeInfo[] => {
    if (!existsSync(THEME_SCHEMAS_DIR)) return [];

    return readdirSync(THEME_SCHEMAS_DIR)
        .filter(name => {
            const dir = join(THEME_SCHEMAS_DIR, name);
            return statSync(dir).isDirectory() && existsSync(join(dir, 'theme.json'));
        })
        .map(name => {
            const configPath = join(THEME_SCHEMAS_DIR, name, 'theme.json');
            const config = JSON.parse(readFileSync(configPath, 'utf-8'));

            return {
                id: config.id ?? name,
                displayName: config.displayName ?? name,
                extends: config.extends,
                iconSet: config.iconSet,
                configPath,
            };
        });
};

interface ScaffoldOptions {
    id: string;
    displayName: string;
    baseTheme: string; // theme ID to extend (e.g. 'colorful' or 'formal')
    baseCategoryColor?: {
        primaryColor: string;
        secondaryColor: string;
        indicatorColor: string;
        borderColor: string;
        statusBarColor: string;
        headerBrandingTextColor: string;
        headerTextColor: string;
        backgroundPrimaryColor: string;
        backgroundSecondaryColor: string;
        tabActiveColor: string;
    };
    viewMode: 'grid' | 'list';
}

/**
 * Scaffold a new JSON theme folder.
 *
 * Creates:
 *   schemas/{id}/theme.json   — with `extends` pointing to the base theme
 *   schemas/{id}/assets/      — copies switcher + blocks icons from base
 *
 * No TS files are touched. The JSON loader auto-discovers the new folder.
 */
const scaffoldTheme = (opts: ScaffoldOptions): { success: boolean; files: string[]; error?: string } => {
    const { id, displayName, baseTheme, baseCategoryColor, viewMode } = opts;
    const files: string[] = [];

    try {
        const themeDir = join(THEME_SCHEMAS_DIR, id);
        const assetsDir = join(themeDir, 'assets');

        if (existsSync(join(themeDir, 'theme.json'))) {
            return { success: false, files: [], error: `Theme '${id}' already exists at ${themeDir}` };
        }

        // Verify the base theme exists
        const baseDir = join(THEME_SCHEMAS_DIR, baseTheme);

        if (!existsSync(join(baseDir, 'theme.json'))) {
            return { success: false, files: [], error: `Base theme '${baseTheme}' not found` };
        }

        // 1. Create theme folder + assets dir
        mkdirSync(assetsDir, { recursive: true });

        // 2. Build theme.json with overrides only
        const themeJson: Record<string, unknown> = {
            id,
            displayName,
            extends: baseTheme,
        };

        // Only include iconSet if different from base
        // (inherits from base by default via extends)

        // Only include color overrides if provided
        if (baseCategoryColor) {
            themeJson.colors = {
                categoryBase: baseCategoryColor,
            };
        }

        // Only include defaults if viewMode differs from base
        const baseConfig = JSON.parse(readFileSync(join(baseDir, 'theme.json'), 'utf-8'));

        if (viewMode !== baseConfig.defaults?.viewMode) {
            themeJson.defaults = { viewMode };
        }

        const configPath = join(themeDir, 'theme.json');

        writeFileSync(configPath, JSON.stringify(themeJson, null, 4) + '\n', 'utf-8');
        files.push(configPath);

        // 3. Copy asset images from base theme
        const baseAssetsDir = join(baseDir, 'assets');

        if (existsSync(baseAssetsDir)) {
            for (const file of readdirSync(baseAssetsDir)) {
                const src = join(baseAssetsDir, file);
                const dest = join(assetsDir, file);

                if (statSync(src).isFile()) {
                    writeFileSync(dest, readFileSync(src));
                    files.push(dest);
                }
            }
        }

        return { success: true, files };
    } catch (err) {
        return { success: false, files, error: String(err) };
    }
};

// ---------------------------------------------------------------------------
// Managed dev server process
// ---------------------------------------------------------------------------

interface DevServerState {
    phase: 'preparing' | 'starting' | 'running' | 'stopped' | 'error';
    tenant: string;
    netlify: boolean;
    output: string[];
    pid: number | null;
    startedAt: number;
    url: string | null;
    exitCode: number | null;
    process: ReturnType<typeof spawn> | null;
}

const MAX_OUTPUT_LINES = 500;

let devServer: DevServerState | null = null;

const appendOutput = (line: string): void => {
    if (!devServer) return;

    devServer.output.push(line);

    if (devServer.output.length > MAX_OUTPUT_LINES) {
        devServer.output = devServer.output.slice(-MAX_OUTPUT_LINES);
    }
};

const killDevServer = (): void => {
    if (!devServer?.process) return;

    const proc = devServer.process;

    try {
        // Kill the process group (negative PID kills the group)
        if (proc.pid) process.kill(-proc.pid, 'SIGTERM');
    } catch {
        // Fallback: kill just the process
        try { proc.kill('SIGTERM'); } catch { /* already dead */ }
    }

    devServer.process = null;
    devServer.phase = 'stopped';
    devServer.pid = null;
    appendOutput('\n--- Server stopped ---');
};

const NETLIFY_DEV_PORT = 8888;
const VITE_TARGET_PORT = 3001;

const startDevServer = (tenant: string, netlify = false): void => {
    // Kill any existing server first
    if (devServer?.process) killDevServer();

    devServer = {
        phase: 'preparing',
        tenant,
        netlify,
        output: [],
        pid: null,
        startedAt: Date.now(),
        url: null,
        exitCode: null,
        process: null,
    };

    appendOutput(`▸ Applying config for "${tenant}"...`);

    // Phase 1: prepare-native-config
    const prepare = spawn(
        'npx',
        ['tsx', 'scripts/prepare-native-config.ts', tenant],
        { cwd: APP_ROOT, shell: true, detached: true },
    );

    devServer.process = prepare;
    devServer.pid = prepare.pid ?? null;

    prepare.stdout.on('data', (d: Buffer) => {
        for (const line of d.toString().split('\n')) {
            if (line.trim()) appendOutput(line);
        }
    });

    prepare.stderr.on('data', (d: Buffer) => {
        for (const line of d.toString().split('\n')) {
            if (line.trim()) appendOutput(line);
        }
    });

    prepare.on('close', (code) => {
        if (!devServer || devServer.phase === 'stopped') return;

        if (code !== 0) {
            devServer.phase = 'error';
            devServer.exitCode = code;
            devServer.process = null;
            appendOutput(`\n✗ prepare-native-config exited with code ${code}`);
            return;
        }

        devServer.phase = 'starting';

        if (netlify) {
            // Phase 2a: netlify dev wrapping vite
            appendOutput(`\n▸ Starting Netlify dev server (edge functions enabled)...`);
            appendOutput(`  Vite on :${VITE_TARGET_PORT} → Netlify proxy on :${NETLIFY_DEV_PORT}`);

            // Use a single shell string so quotes are preserved around the --command value
            const ndev = spawn(
                `npx netlify dev --command="npx vite --port ${VITE_TARGET_PORT}" --target-port ${VITE_TARGET_PORT}`,
                [],
                { cwd: APP_ROOT, shell: true, detached: true },
            );

            devServer.process = ndev;
            devServer.pid = ndev.pid ?? null;

            ndev.stdout.on('data', (d: Buffer) => {
                const text = d.toString();

                for (const line of text.split('\n')) {
                    if (line.trim()) appendOutput(line);
                }

                // Netlify CLI prints "Server now ready on http://localhost:8888"
                const netlifyReady = text.match(/ready on (https?:\/\/[^\s]+)/) ||
                    text.match(/Server now ready on (https?:\/\/[^\s]+)/) ||
                    text.match(new RegExp(`localhost:${NETLIFY_DEV_PORT}`));

                if (netlifyReady && devServer && devServer.phase !== 'running') {
                    devServer.phase = 'running';
                    devServer.url = typeof netlifyReady[1] === 'string'
                        ? netlifyReady[1]
                        : `http://localhost:${NETLIFY_DEV_PORT}`;
                }
            });

            ndev.stderr.on('data', (d: Buffer) => {
                const text = d.toString();

                for (const line of text.split('\n')) {
                    if (line.trim()) appendOutput(line);
                }

                // Some Netlify CLI versions print ready message to stderr
                const netlifyReady = text.match(/ready on (https?:\/\/[^\s]+)/) ||
                    text.match(/Server now ready on (https?:\/\/[^\s]+)/);

                if (netlifyReady && devServer && devServer.phase !== 'running') {
                    devServer.phase = 'running';
                    devServer.url = typeof netlifyReady[1] === 'string'
                        ? netlifyReady[1]
                        : `http://localhost:${NETLIFY_DEV_PORT}`;
                }
            });

            ndev.on('close', (nCode) => {
                if (!devServer || devServer.phase === 'stopped') return;

                devServer.phase = nCode === 0 ? 'stopped' : 'error';
                devServer.exitCode = nCode;
                devServer.process = null;
                appendOutput(`\n--- Netlify dev exited (code ${nCode}) ---`);
            });

            ndev.on('error', (err) => {
                if (!devServer) return;

                devServer.phase = 'error';
                devServer.process = null;
                appendOutput(`\n✗ Netlify dev error: ${String(err)}`);
            });
        } else {
            // Phase 2b: raw vite dev
            appendOutput('\n▸ Starting Vite dev server...');

            const vite = spawn('npx', ['vite', '--host'], {
                cwd: APP_ROOT,
                shell: true,
                detached: true,
            });

            devServer.process = vite;
            devServer.pid = vite.pid ?? null;

            vite.stdout.on('data', (d: Buffer) => {
                const text = d.toString();

                for (const line of text.split('\n')) {
                    if (line.trim()) appendOutput(line);
                }

                // Detect when Vite is ready
                const urlMatch = text.match(/Local:\s+(https?:\/\/[^\s]+)/);

                if (urlMatch && devServer) {
                    devServer.phase = 'running';
                    devServer.url = urlMatch[1]!;
                }
            });

            vite.stderr.on('data', (d: Buffer) => {
                for (const line of d.toString().split('\n')) {
                    if (line.trim()) appendOutput(line);
                }
            });

            vite.on('close', (viteCode) => {
                if (!devServer || devServer.phase === 'stopped') return;

                devServer.phase = viteCode === 0 ? 'stopped' : 'error';
                devServer.exitCode = viteCode;
                devServer.process = null;
                appendOutput(`\n--- Vite exited (code ${viteCode}) ---`);
            });

            vite.on('error', (err) => {
                if (!devServer) return;

                devServer.phase = 'error';
                devServer.process = null;
                appendOutput(`\n✗ Vite error: ${String(err)}`);
            });
        }
    });

    prepare.on('error', (err) => {
        if (!devServer) return;

        devServer.phase = 'error';
        devServer.process = null;
        appendOutput(`\n✗ Prepare error: ${String(err)}`);
    });
};

const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    const path = url.pathname;

    // CORS for local dev
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    try {
        // --- Theme API routes ---

        if (path === '/api/themes' && req.method === 'GET') {
            json(res, 200, listThemes());
            return;
        }

        if (path === '/api/themes/scaffold' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req)) as ScaffoldOptions;

            if (!body.id || !body.displayName || !body.baseTheme) {
                json(res, 400, { error: 'Missing required fields: id, displayName, baseTheme' });
                return;
            }

            // Sanitize the id
            const sanitizedId = body.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

            if (!sanitizedId) {
                json(res, 400, { error: 'Invalid theme id' });
                return;
            }

            const result = scaffoldTheme({ ...body, id: sanitizedId });

            json(res, result.success ? 200 : 400, result);
            return;
        }

        if (path === '/api/validate-theme' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const validation = validateThemeConfig(body);

            json(res, 200, validation);
            return;
        }

        // Icon SVG preview: GET /api/icon-preview/:key?primary=...&primaryLight=...&accent=...&stroke=...
        const iconPreviewMatch = path.match(/^\/api\/icon-preview\/([a-zA-Z]+)$/);

        if (iconPreviewMatch && req.method === 'GET') {
            const iconKey = iconPreviewMatch[1]!;
            const meta = ICON_META[iconKey];

            if (!meta) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end(`Unknown icon key: ${iconKey}`);
                return;
            }

            const variant = (url.searchParams.get('variant') === 'formal' ? 'formal' : 'colorful') as 'colorful' | 'formal';

            const palette = {
                primary: url.searchParams.get('primary') || meta.defaults.primary,
                primaryLight: url.searchParams.get('primaryLight') || meta.defaults.primaryLight,
                accent: url.searchParams.get('accent') || meta.defaults.accent,
                stroke: url.searchParams.get('stroke') || meta.defaults.stroke,
            };

            // For formal icons, only apply color substitution when an explicit primary is given
            const hasPrimaryOverride = !!url.searchParams.get('primary');

            const svg = renderIconSvg(iconKey, palette, variant, hasPrimaryOverride);

            if (!svg) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Failed to extract SVG for ${iconKey}`);
                return;
            }

            res.writeHead(200, {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'no-cache',
            });
            res.end(svg);
            return;
        }

        // List available icon keys and their defaults
        if (path === '/api/icon-defaults' && req.method === 'GET') {
            const defaults: Record<string, { primary: string; primaryLight: string; accent: string; stroke: string }> = {};

            for (const [key, meta] of Object.entries(ICON_META)) {
                defaults[key] = meta.defaults;
            }

            json(res, 200, defaults);
            return;
        }

        // Serve theme asset images
        const themeAssetMatch = path.match(/^\/api\/themes\/([a-zA-Z0-9_-]+)\/assets\/(.+)$/);

        if (themeAssetMatch && req.method === 'GET') {
            const themeId = themeAssetMatch[1]!;
            const fileName = themeAssetMatch[2]!;

            if (fileName.includes('..')) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Bad request');
                return;
            }

            const fullPath = join(THEME_SCHEMAS_DIR, themeId, 'assets', fileName);

            if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Asset not found');
                return;
            }

            const ext = extname(fullPath).toLowerCase();
            const mime = MIME_TYPES[ext] ?? 'application/octet-stream';

            res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-cache' });
            res.end(readFileSync(fullPath));
            return;
        }

        // CRUD for individual themes: GET / PUT / DELETE
        const themeMatch = path.match(/^\/api\/themes\/([a-zA-Z0-9_-]+)$/);

        if (themeMatch) {
            const themeId = themeMatch[1]!;
            const themeDir = join(THEME_SCHEMAS_DIR, themeId);
            const themeJsonPath = join(themeDir, 'theme.json');

            if (req.method === 'GET') {
                if (!existsSync(themeJsonPath)) {
                    json(res, 404, { error: `Theme '${themeId}' not found` });
                    return;
                }

                json(res, 200, JSON.parse(readFileSync(themeJsonPath, 'utf-8')));
                return;
            }

            if (req.method === 'PUT') {
                const body = JSON.parse(await readBody(req));

                // Always force id to match folder name
                body.id = themeId;

                // Validate before saving
                const validation = validateThemeConfig(body);

                // Ensure the folder + assets dir exist
                if (!existsSync(themeDir)) {
                    mkdirSync(join(themeDir, 'assets'), { recursive: true });
                }

                // Save even with warnings, but block on errors
                if (!validation.valid) {
                    json(res, 400, { saved: false, themeId, validation });
                    return;
                }

                writeFileSync(themeJsonPath, JSON.stringify(body, null, 4) + '\n', 'utf-8');
                json(res, 200, { saved: true, themeId, config: body, validation });
                return;
            }

            if (req.method === 'DELETE') {
                if (!existsSync(themeDir)) {
                    json(res, 404, { error: `Theme '${themeId}' not found` });
                    return;
                }

                rmSync(themeDir, { recursive: true, force: true });
                json(res, 200, { deleted: true, themeId });
                return;
            }
        }

        // --- Tenant API routes ---

        if (path === '/api/defaults') {
            json(res, 200, DEFAULT_LEARNCARD_TENANT_CONFIG);
            return;
        }

        if (path === '/api/tenants' && req.method === 'GET') {
            json(res, 200, listTenants());
            return;
        }

        const tenantMatch = path.match(/^\/api\/tenant\/([a-zA-Z0-9_-]+)$/);

        if (tenantMatch) {
            const tenant = tenantMatch[1]!;

            if (req.method === 'GET') {
                json(res, 200, readTenantConfig(tenant));
                return;
            }

            if (req.method === 'PUT') {
                const body = JSON.parse(await readBody(req));
                const merged = deepMerge(
                    DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
                    body.overrides,
                );
                const validation = validateConfig(merged);

                if (!validation.valid) {
                    json(res, 400, { error: 'Validation failed', errors: validation.errors });
                    return;
                }

                saveTenantConfig(tenant, body.overrides);
                json(res, 200, { saved: true, overrides: body.overrides, merged });
                return;
            }
        }

        if (path === '/api/validate' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const merged = deepMerge(
                DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
                body,
            );

            json(res, 200, validateConfig(merged));
            return;
        }

        // List asset files for a tenant
        const assetsListMatch = path.match(/^\/api\/tenant\/([a-zA-Z0-9_-]+)\/assets$/);

        if (assetsListMatch && req.method === 'GET') {
            json(res, 200, listTenantAssets(assetsListMatch[1]!));
            return;
        }

        // Serve an asset file from a tenant's assets directory
        const assetFileMatch = path.match(/^\/assets\/([a-zA-Z0-9_-]+)\/(.+)$/);

        if (assetFileMatch && req.method === 'GET') {
            const tenant = assetFileMatch[1]!;
            const filePath = assetFileMatch[2]!;

            // Prevent directory traversal
            if (filePath.includes('..')) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Bad request');
                return;
            }

            const fullPath = join(ENVIRONMENTS_DIR, tenant, 'assets', filePath);

            if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Asset not found');
                return;
            }

            const ext = extname(fullPath).toLowerCase();
            const mime = MIME_TYPES[ext] ?? 'application/octet-stream';

            res.writeHead(200, {
                'Content-Type': mime,
                'Cache-Control': 'no-cache',
            });
            res.end(readFileSync(fullPath));
            return;
        }

        if (path === '/api/compute-overrides' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const overrides = computeOverrides(
                body,
                DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
            );

            json(res, 200, overrides);
            return;
        }

        // --- Action endpoints ---

        if (path === '/api/actions/upload-logo' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const { tenant, filename, data } = body;

            if (!tenant || !filename || !data) {
                json(res, 400, { error: 'Missing tenant, filename, or data' });
                return;
            }

            const tenantDir = join(ENVIRONMENTS_DIR, tenant);

            if (!existsSync(tenantDir)) {
                mkdirSync(tenantDir, { recursive: true });
            }

            const logoPath = join(tenantDir, filename);

            writeFileSync(logoPath, Buffer.from(data, 'base64'));
            json(res, 200, { saved: true, path: logoPath });
            return;
        }

        if (path === '/api/actions/generate-assets' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const { tenant, bgColor, name } = body;

            if (!tenant) {
                json(res, 400, { error: 'Missing tenant' });
                return;
            }

            const logoPath = join(ENVIRONMENTS_DIR, tenant, 'logo.png');

            if (!existsSync(logoPath)) {
                json(res, 400, { error: 'No logo.png found. Upload a logo first.' });
                return;
            }

            const args = ['scripts/generate-tenant-assets.ts', tenant, logoPath];

            if (bgColor) args.push('--bg', bgColor);
            if (name) args.push('--name', name);

            const result = await runScript('npx tsx', args);

            json(res, result.exitCode === 0 ? 200 : 500, result);
            return;
        }

        if (path === '/api/actions/apply-config' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const { tenant } = body;

            if (!tenant) {
                json(res, 400, { error: 'Missing tenant' });
                return;
            }

            const result = await runScript('npx tsx', ['scripts/prepare-native-config.ts', tenant]);

            json(res, result.exitCode === 0 ? 200 : 500, result);
            return;
        }

        if (path === '/api/actions/reset-config' && req.method === 'POST') {
            const result = await runScript('npx tsx', ['scripts/prepare-native-config.ts', '--reset']);

            json(res, result.exitCode === 0 ? 200 : 500, result);
            return;
        }

        if (path === '/api/actions/dev-server/start' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const { tenant, netlify: useNetlify } = body;

            if (!tenant) {
                json(res, 400, { error: 'Missing tenant' });
                return;
            }

            startDevServer(tenant, !!useNetlify);
            json(res, 200, { started: true, tenant, netlify: !!useNetlify });
            return;
        }

        if (path === '/api/actions/dev-server/status' && req.method === 'GET') {
            if (!devServer) {
                json(res, 200, { active: false });
                return;
            }

            // Return last N lines requested (default 100)
            const since = parseInt(url.searchParams.get('since') ?? '0', 10);
            const lines = devServer.output.slice(since);

            json(res, 200, {
                active: true,
                phase: devServer.phase,
                tenant: devServer.tenant,
                netlify: devServer.netlify,
                pid: devServer.pid,
                url: devServer.url,
                exitCode: devServer.exitCode,
                startedAt: devServer.startedAt,
                uptime: Date.now() - devServer.startedAt,
                totalLines: devServer.output.length,
                lines,
                since,
            });
            return;
        }

        if (path === '/api/actions/dev-server/stop' && req.method === 'POST') {
            if (!devServer?.process) {
                json(res, 200, { stopped: true, wasRunning: false });
                return;
            }

            killDevServer();
            json(res, 200, { stopped: true, wasRunning: true });
            return;
        }

        // --- SPA routing ---

        if (path === '/' || path === '/index.html') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(readFileSync(LANDING_PATH, 'utf-8'));
            return;
        }

        if (path === '/config') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(readFileSync(CONFIG_SPA_PATH, 'utf-8'));
            return;
        }

        if (path === '/themes') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(readFileSync(THEMES_SPA_PATH, 'utf-8'));
            return;
        }

        // 404
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    } catch (err) {
        console.error('Server error:', err);
        json(res, 500, { error: String(err) });
    }
};

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const server = createServer(handler);

server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;

    console.log(`\n🎨 Tenant Config Editor running at: ${url}\n`);

    // Open browser
    const cmd = process.platform === 'darwin' ? 'open'
        : process.platform === 'win32' ? 'start'
        : 'xdg-open';

    exec(`${cmd} ${url}`);
});

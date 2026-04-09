#!/usr/bin/env npx tsx

/**
 * validate-theme-schemas.ts
 *
 * Validates every theme.json file in src/theme/schemas/<theme>/ against the
 * ThemeJsonSchema Zod validator. Catches malformed theme files before deploy.
 *
 * This is a lightweight structural check that does NOT require Vite's
 * import.meta.glob or React components — it validates the raw JSON shape
 * and inheritance chains only.
 *
 * Usage:
 *   npx tsx scripts/validate-theme-schemas.ts
 *
 * Exit codes:
 *   0 — all themes valid
 *   1 — one or more themes invalid
 */

import { readdirSync, existsSync, readFileSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { ThemeJsonSchema } from '../src/theme/validators/themeJson.validators';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const SCHEMAS_DIR = resolve(APP_ROOT, 'src/theme/schemas');

// ---------------------------------------------------------------------------
// Discover themes
// ---------------------------------------------------------------------------

if (!existsSync(SCHEMAS_DIR)) {
    console.error(`❌ Schemas directory not found: ${SCHEMAS_DIR}`);
    process.exit(1);
}

const themeDirs = readdirSync(SCHEMAS_DIR).filter(name => {
    const full = join(SCHEMAS_DIR, name);

    return statSync(full).isDirectory();
});

if (themeDirs.length === 0) {
    console.log('⚠  No theme directories found in src/theme/schemas/');
    process.exit(0);
}

// ---------------------------------------------------------------------------
// Load all raw configs for extends resolution
// ---------------------------------------------------------------------------

const rawConfigs = new Map<string, Record<string, unknown>>();

for (const theme of themeDirs) {
    const configPath = join(SCHEMAS_DIR, theme, 'theme.json');

    if (!existsSync(configPath)) continue;

    try {
        const raw = JSON.parse(readFileSync(configPath, 'utf-8'));

        rawConfigs.set(theme, raw);
    } catch (err) {
        console.error(`✗  ${theme} — failed to parse theme.json: ${err}`);
    }
}

// ---------------------------------------------------------------------------
// Validate each theme
// ---------------------------------------------------------------------------

let failures = 0;
let warnings = 0;

for (const theme of themeDirs) {
    const configPath = join(SCHEMAS_DIR, theme, 'theme.json');

    if (!existsSync(configPath)) {
        console.log(`⚠  ${theme}/ — no theme.json (assets-only theme dir)`);
        continue;
    }

    const raw = rawConfigs.get(theme);

    if (!raw) {
        failures++;
        continue;
    }

    try {
        // 1. Validate JSON structure
        const result = ThemeJsonSchema.safeParse(raw);

        if (!result.success) {
            console.error(`✗  ${theme} — INVALID JSON structure:`);

            for (const issue of result.error.issues) {
                console.error(`      ${issue.path.join('.')}: ${issue.message}`);
            }

            failures++;
            continue;
        }

        // 2. Check id matches directory name
        if (raw.id !== theme) {
            console.error(`✗  ${theme} — id mismatch: theme.json has id="${raw.id}" but directory is "${theme}"`);
            failures++;
            continue;
        }

        // 3. Validate extends chain
        if (raw.extends) {
            const parentId = raw.extends as string;

            if (!rawConfigs.has(parentId)) {
                console.error(`✗  ${theme} — extends "${parentId}" which does not exist`);
                failures++;
                continue;
            }

            // Check for circular extends
            const seen = new Set<string>();
            let current: string | undefined = theme;

            while (current) {
                if (seen.has(current)) {
                    console.error(`✗  ${theme} — circular extends chain: ${[...seen, current].join(' → ')}`);
                    failures++;
                    break;
                }

                seen.add(current);

                const cfg = rawConfigs.get(current);

                current = cfg?.extends as string | undefined;
            }

            if (seen.has(theme) && [...seen].pop() === theme) continue;
        }

        // 4. Validate iconSet reference
        const KNOWN_ICON_SETS = ['colorful', 'formal'];
        const iconSet = raw.iconSet as string | undefined;

        if (iconSet && !KNOWN_ICON_SETS.includes(iconSet)) {
            console.warn(`⚠  ${theme} — references unknown iconSet "${iconSet}" (known: ${KNOWN_ICON_SETS.join(', ')})`);
            warnings++;
        }

        // 5. Check required assets exist
        const assetsDir = join(SCHEMAS_DIR, theme, 'assets');

        if (existsSync(assetsDir)) {
            const assetFiles = readdirSync(assetsDir);
            const hasSwitcherIcon = assetFiles.some(f => f.startsWith('switcher-icon'));
            const hasBlocksIcon = assetFiles.some(f => f.startsWith('blocks-icon'));

            if (!hasSwitcherIcon) {
                console.warn(`⚠  ${theme} — missing assets/switcher-icon.* (theme switcher will use fallback)`);
                warnings++;
            }

            if (!hasBlocksIcon) {
                console.warn(`⚠  ${theme} — missing assets/blocks-icon.* (build-my-LC icon will use fallback)`);
                warnings++;
            }
        } else if (!raw.extends) {
            // Root themes (no extends) should have their own assets
            console.warn(`⚠  ${theme} — no assets/ directory (root theme without inherited assets)`);
            warnings++;
        }

        console.log(`✓  ${theme} — valid (displayName="${raw.displayName}"${raw.extends ? `, extends="${raw.extends}"` : ''})`);
    } catch (err) {
        console.error(`✗  ${theme} — unexpected error: ${err}`);
        failures++;
    }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('');

if (warnings > 0) {
    console.log(`⚠  ${warnings} warning(s).`);
}

if (failures > 0) {
    console.error(`❌ ${failures} theme(s) failed validation.`);
    process.exit(1);
} else {
    console.log(`✅ All ${themeDirs.length} theme(s) valid.`);
}

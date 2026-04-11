#!/usr/bin/env npx tsx

/**
 * create-theme.ts — Interactive theme scaffolding tool.
 *
 * Creates a new theme JSON file in `src/theme/schemas/<id>/` with:
 *   - theme.json (valid skeleton with sensible defaults)
 *   - assets/ directory with placeholder files
 *
 * Usage:
 *   npx tsx scripts/create-theme.ts
 *   npx tsx scripts/create-theme.ts --id=mytheme     # skip the ID prompt
 *   npx tsx scripts/create-theme.ts --extends=colorful # inherit from colorful
 */

import { createInterface } from 'readline';
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync, copyFileSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const THEME_SCHEMAS_DIR = resolve(APP_ROOT, 'src/theme/schemas');
const ICON_SETS_PATH = resolve(APP_ROOT, 'src/theme/icons/iconSets.ts');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const rl = createInterface({ input: process.stdin, output: process.stdout });

const ask = (question: string, defaultValue?: string): Promise<string> =>
    new Promise(res => {
        const suffix = defaultValue ? ` (${defaultValue})` : '';

        rl.question(`  ${question}${suffix}: `, answer => {
            res(answer.trim() || defaultValue || '');
        });
    });

const askYesNo = async (question: string, defaultYes = true): Promise<boolean> => {
    const hint = defaultYes ? 'Y/n' : 'y/N';
    const answer = await ask(`${question} [${hint}]`);

    if (!answer) return defaultYes;

    return answer.toLowerCase().startsWith('y');
};

const slugify = (s: string): string =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const bold = (s: string): string => `\x1b[1m${s}\x1b[0m`;
const green = (s: string): string => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string): string => `\x1b[36m${s}\x1b[0m`;
const dim = (s: string): string => `\x1b[2m${s}\x1b[0m`;
const yellow = (s: string): string => `\x1b[33m${s}\x1b[0m`;

const discoverThemes = (): string[] => {
    if (!existsSync(THEME_SCHEMAS_DIR)) return [];

    return readdirSync(THEME_SCHEMAS_DIR).filter(name => {
        const full = join(THEME_SCHEMAS_DIR, name);

        return statSync(full).isDirectory() && existsSync(join(full, 'theme.json'));
    });
};

const discoverIconSets = (): string[] => {
    try {
        const content = readFileSync(ICON_SETS_PATH, 'utf-8');
        const matches = content.match(/['"](\w+)['"]\s*:/g);

        if (!matches) return ['colorful', 'formal'];

        return [...new Set(matches.map(m => m.replace(/['":\s]/g, '')))];
    } catch {
        return ['colorful', 'formal'];
    }
};

// ---------------------------------------------------------------------------
// Theme JSON template
// ---------------------------------------------------------------------------

const buildThemeJson = (opts: {
    id: string;
    displayName: string;
    extendsTheme?: string;
    iconSet: string;
    viewMode: string;
}) => {
    const json: Record<string, unknown> = {
        id: opts.id,
        displayName: opts.displayName,
    };

    if (opts.extendsTheme) {
        json.extends = opts.extendsTheme;
    }

    json.iconSet = opts.iconSet;

    json.defaults = {
        viewMode: opts.viewMode,
    };

    // Only add full color/style scaffolding when NOT extending a parent
    if (!opts.extendsTheme) {
        json.colors = {
            categoryBase: {
                primaryColor: 'blue-500',
                secondaryColor: 'blue-700',
                indicatorColor: 'indigo-500',
                borderColor: 'blue-300',
                statusBarColor: 'blue-500',
                headerBrandingTextColor: 'text-white',
                headerTextColor: 'text-white',
                backgroundPrimaryColor: '!bg-blue-500',
                backgroundSecondaryColor: 'blue-200',
                tabActiveColor: 'bg-blue-300',
            },
            categories: {},
            launchPad: {
                contacts: { color: 'green-500' },
                aiSessions: { color: 'purple-500' },
                alerts: { color: 'amber-500' },
            },
            sideMenu: {
                bg: 'white',
                text: 'grayscale-900',
                activeText: 'blue-500',
                activeBg: 'blue-50',
            },
            navbar: {
                bg: 'white',
                text: 'grayscale-600',
                activeText: 'blue-500',
            },
            introSlides: {},
            placeholderBase: {
                spilledCup: {
                    backsplash: '#E2E3E9',
                    spill: '#3B82F6',
                    cupOutline: '#353E64',
                },
            },
            defaults: {
                primaryColor: 'blue-500',
                secondaryColor: 'blue-700',
                indicatorColor: 'indigo-500',
                borderColor: 'blue-300',
                statusBarColor: 'blue-500',
                headerBrandingTextColor: 'text-white',
                headerTextColor: 'text-white',
                backgroundPrimaryColor: '!bg-blue-500',
                backgroundSecondaryColor: 'blue-200',
                tabActiveColor: 'bg-blue-300',
            },
        };

        json.styles = {
            wallet: {
                cardStyles: 'h-[240px]',
                iconStyles: 'w-[100px] h-[100px]',
            },
            launchPad: {
                textStyles: 'text-[16px]',
                iconStyles: 'w-[75px] h-auto xxs:w-[60px] xxs:h-[60px]',
                indicatorStyles: 'shadow-soft-bottom',
            },
            defaults: {
                tabs: {
                    borderRadius: 'rounded-[5px]',
                },
            },
        };
    } else {
        // When extending, only add override stubs
        json.colors = {
            categoryBase: {},
            categories: {},
        };

        json.styles = {};
    }

    return json;
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
    console.log('');
    console.log(bold('🎨 LearnCard Theme Creator'));
    console.log(dim('   Create a new theme in a few easy steps.\n'));

    const existingThemes = discoverThemes();
    const iconSets = discoverIconSets();

    console.log(dim(`   Existing themes: ${existingThemes.join(', ') || 'none'}`));
    console.log(dim(`   Available icon sets: ${iconSets.join(', ')}`));
    console.log('');

    // ── Step 1: Theme ID ────────────────────────────────────────────────
    const cliId = process.argv.find(a => a.startsWith('--id='))?.split('=')[1];
    const cliExtends = process.argv.find(a => a.startsWith('--extends='))?.split('=')[1];

    let themeId = cliId || '';

    if (!themeId) {
        console.log(cyan('Step 1/5') + ' — Choose a theme ID');
        console.log(dim('   Lowercase alphanumeric slug. This becomes the directory name.'));

        themeId = slugify(await ask('Theme ID'));
    }

    if (!themeId) {
        console.log(yellow('  No theme ID provided. Aborting.'));
        rl.close();
        return;
    }

    const themeDir = join(THEME_SCHEMAS_DIR, themeId);

    if (existsSync(themeDir)) {
        console.log(yellow(`  Theme "${themeId}" already exists at ${themeDir}`));

        const overwrite = await askYesNo('Overwrite?', false);

        if (!overwrite) {
            console.log(dim('  Cancelled.'));
            rl.close();
            return;
        }
    }

    // ── Step 2: Display name ────────────────────────────────────────────
    console.log('');
    console.log(cyan('Step 2/5') + ' — Display name');

    const defaultDisplayName = themeId.charAt(0).toUpperCase() + themeId.slice(1);
    const displayName = await ask('Display name', defaultDisplayName);

    // ── Step 3: Extends (parent theme) ──────────────────────────────────
    console.log('');
    console.log(cyan('Step 3/5') + ' — Inherit from a parent theme');
    console.log(dim('   Leave blank for a standalone theme, or pick a parent.'));

    if (existingThemes.length > 0) {
        existingThemes.forEach((t, i) => {
            console.log(`     ${cyan(`${i + 1}`)}  ${t}`);
        });
    }

    let extendsTheme = cliExtends || '';

    if (!cliExtends) {
        const extendsInput = await ask('Extends (blank for none)');

        if (/^\d+$/.test(extendsInput)) {
            extendsTheme = existingThemes[parseInt(extendsInput, 10) - 1] ?? '';
        } else {
            extendsTheme = extendsInput;
        }
    }

    if (extendsTheme && !existingThemes.includes(extendsTheme)) {
        console.log(yellow(`  Warning: parent theme "${extendsTheme}" not found. Proceeding anyway.`));
    }

    // ── Step 4: Icon set ────────────────────────────────────────────────
    console.log('');
    console.log(cyan('Step 4/5') + ' — Icon set');

    iconSets.forEach((s, i) => {
        console.log(`     ${cyan(`${i + 1}`)}  ${s}`);
    });

    const iconSetInput = await ask('Icon set', iconSets[0]);

    let iconSet: string;

    if (/^\d+$/.test(iconSetInput)) {
        iconSet = iconSets[parseInt(iconSetInput, 10) - 1] ?? iconSets[0]!;
    } else {
        iconSet = iconSetInput || iconSets[0]!;
    }

    // ── Step 5: View mode ───────────────────────────────────────────────
    console.log('');
    console.log(cyan('Step 5/5') + ' — Default view mode');
    console.log(`     ${cyan('1')}  grid`);
    console.log(`     ${cyan('2')}  list`);

    const viewModeInput = await ask('View mode', '1');
    const viewMode = viewModeInput === '2' ? 'list' : 'grid';

    // ── Summary ─────────────────────────────────────────────────────────
    console.log('');
    console.log(bold('Summary:'));
    console.log(`  ID:           ${bold(themeId)}`);
    console.log(`  Display name: ${displayName}`);
    console.log(`  Extends:      ${extendsTheme || dim('(standalone)')}`);
    console.log(`  Icon set:     ${iconSet}`);
    console.log(`  View mode:    ${viewMode}`);
    console.log(`  Directory:    ${dim(themeDir)}`);
    console.log('');

    const confirm = await askYesNo('Create this theme?');

    if (!confirm) {
        console.log(dim('  Cancelled.'));
        rl.close();
        return;
    }

    // ── Create files ────────────────────────────────────────────────────

    mkdirSync(themeDir, { recursive: true });
    mkdirSync(join(themeDir, 'assets'), { recursive: true });

    // Copy assets from parent or colorful as defaults
    const sourceTheme = extendsTheme || 'colorful';
    const sourceAssetsDir = join(THEME_SCHEMAS_DIR, sourceTheme, 'assets');

    if (existsSync(sourceAssetsDir)) {
        const assetFiles = readdirSync(sourceAssetsDir);

        for (const file of assetFiles) {
            const src = join(sourceAssetsDir, file);
            const dest = join(themeDir, 'assets', file);

            if (!existsSync(dest) && statSync(src).isFile()) {
                copyFileSync(src, dest);
                console.log(`  ${green('+')} assets/${file} ${dim(`(from ${sourceTheme})`)}`);
            }
        }
    }

    // Write theme.json
    const themeJson = buildThemeJson({
        id: themeId,
        displayName,
        extendsTheme: extendsTheme || undefined,
        iconSet,
        viewMode,
    });

    writeFileSync(
        join(themeDir, 'theme.json'),
        JSON.stringify(themeJson, null, 4) + '\n',
        'utf-8',
    );

    console.log(`  ${green('+')} theme.json`);

    // ── Done ────────────────────────────────────────────────────────────
    console.log('');
    console.log(green('✅ Theme created!'));
    console.log('');
    console.log('  Next steps:');
    console.log(`    1. Edit ${cyan(`src/theme/schemas/${themeId}/theme.json`)} to customize colors and styles`);
    console.log(`    2. Replace assets in ${cyan(`src/theme/schemas/${themeId}/assets/`)}`);
    console.log(`    3. Run ${cyan('pnpm lc validate')} to check your theme`);
    console.log(`    4. Add "${themeId}" to your tenant's ${cyan('allowedThemes')} in config.json`);
    console.log('');

    rl.close();
};

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});

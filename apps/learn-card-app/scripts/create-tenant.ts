#!/usr/bin/env bunx tsx

import { getLogger } from 'learn-card-base/src/logging/logger';
const log = getLogger();

/**
 * create-tenant.ts — Interactive tenant scaffolding tool.
 *
 * Creates a new tenant environment directory with:
 *   - config.json (with sensible defaults, only overrides from user input)
 *   - assets/ directory structure (android/, ios/, web/, branding/, config/)
 *   - Placeholder Capacitor + manifest configs
 *   - Entry in tenant-registry.json (for the edge function)
 *   - Optional theme.json scaffold
 *
 * Usage:
 *   bunx tsx scripts/create-tenant.ts
 *   bunx tsx scripts/create-tenant.ts --id=mytenant    # skip the ID prompt
 *
 * Designed for non-technical users — every step has clear prompts and defaults.
 */

import { createInterface } from 'readline';
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const ENVIRONMENTS_DIR = resolve(APP_ROOT, 'environments');
const THEME_SCHEMAS_DIR = resolve(APP_ROOT, 'src/theme/schemas');
const REGISTRY_PATH = resolve(ENVIRONMENTS_DIR, 'tenant-registry.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const rl = createInterface({ input: process.stdin, output: process.stdout });

const ask = (question: string, defaultValue?: string): Promise<string> =>
    new Promise(resolve => {
        const suffix = defaultValue ? ` (${defaultValue})` : '';

        rl.question(`  ${question}${suffix}: `, answer => {
            resolve(answer.trim() || defaultValue || '');
        });
    });

const askYesNo = async (question: string, defaultYes = true): Promise<boolean> => {
    const hint = defaultYes ? 'Y/n' : 'y/N';
    const answer = await ask(`${question} [${hint}]`);

    if (!answer) return defaultYes;

    return answer.toLowerCase().startsWith('y');
};

const slugify = (s: string): string =>
    s
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

const bold = (s: string): string => `\x1b[1m${s}\x1b[0m`;
const green = (s: string): string => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string): string => `\x1b[36m${s}\x1b[0m`;
const dim = (s: string): string => `\x1b[2m${s}\x1b[0m`;
const yellow = (s: string): string => `\x1b[33m${s}\x1b[0m`;

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
    log.info('');
    log.info(bold('🏗  LearnCard Tenant Creator'));
    log.info(dim('   Create a new tenant environment in a few easy steps.\n'));

    // ── Step 1: Tenant ID ───────────────────────────────────────────────
    const cliId = process.argv.find(a => a.startsWith('--id='))?.split('=')[1];

    let tenantId = cliId || '';

    if (!tenantId) {
        log.info(cyan('Step 1/6') + ' — Choose a tenant ID');
        log.info(dim('   This becomes the directory name and internal identifier.'));
        log.info(dim('   Use lowercase letters, numbers, and hyphens only.\n'));

        tenantId = await ask('Tenant ID (e.g. "scoutpass", "vetpass")');
    }

    tenantId = slugify(tenantId);

    if (!tenantId) {
        log.error('\n❌ Tenant ID is required.');
        process.exit(1);
    }

    const tenantDir = join(ENVIRONMENTS_DIR, tenantId);

    if (existsSync(tenantDir)) {
        log.error(`\n❌ Tenant "${tenantId}" already exists at ${tenantDir}`);
        process.exit(1);
    }

    log.info(green(`   ✓ Tenant ID: ${bold(tenantId)}\n`));

    // ── Step 2: Display name ────────────────────────────────────────────
    log.info(cyan('Step 2/6') + ' — App branding');
    log.info(dim('   How should this app appear to users?\n'));

    const displayName = await ask(
        'Display name (e.g. "ScoutPass", "VetPass")',
        tenantId.charAt(0).toUpperCase() + tenantId.slice(1)
    );
    const shortName = await ask('Short name (for mobile home screen)', displayName.slice(0, 12));

    log.info(green(`   ✓ "${bold(displayName)}" (${shortName})\n`));

    // ── Step 3: Domain ──────────────────────────────────────────────────
    log.info(cyan('Step 3/6') + ' — Domain configuration');
    log.info(dim('   The production hostname and local dev domain.\n'));

    const domain = await ask('Production domain (e.g. "scoutpass.org")', `${tenantId}.app`);
    const devDomain = await ask('Local dev domain', 'localhost:3000');

    log.info(green(`   ✓ ${domain} ${dim(`(dev: ${devDomain})`)}\n`));

    // ── Step 4: Theme ───────────────────────────────────────────────────
    log.info(cyan('Step 4/6') + ' — Theme');
    log.info(dim('   Which visual theme should this tenant use?\n'));

    const existingThemes = existsSync(THEME_SCHEMAS_DIR)
        ? (require('fs')
              .readdirSync(THEME_SCHEMAS_DIR)
              .filter((d: string) =>
                  require('fs').statSync(join(THEME_SCHEMAS_DIR, d)).isDirectory()
              ) as string[])
        : [];

    if (existingThemes.length > 0) {
        log.info(dim(`   Available themes: ${existingThemes.join(', ')}`));
    }

    const defaultTheme = await ask('Default theme', 'formal');
    const themeSwitching = await askYesNo('Enable theme switching?', false);
    const createCustomTheme = await askYesNo('Create a custom theme for this tenant?', false);

    log.info(green(`   ✓ Theme: ${bold(defaultTheme)}${themeSwitching ? '' : ' (locked)'}\n`));

    // ── Step 5: Features ────────────────────────────────────────────────
    log.info(cyan('Step 5/6') + ' — Feature flags');
    log.info(dim('   Toggle major features on/off for this tenant.\n'));

    const aiFeatures = await askYesNo('Enable AI features?', true);
    const appStore = await askYesNo('Enable App Store?', true);
    const analytics = await askYesNo('Enable analytics?', false);
    const introSlides = await askYesNo('Show intro slides on first launch?', true);

    log.info(green('   ✓ Features configured\n'));

    // ── Step 6: Native app (optional) ───────────────────────────────────
    log.info(cyan('Step 6/6') + ' — Native app settings ' + dim('(optional)'));
    log.info(dim('   Skip this if you only need a web deployment.\n'));

    const configureNative = await askYesNo('Configure native app (iOS/Android)?', false);

    let bundleId = '';
    let nativeDisplayName = '';

    if (configureNative) {
        bundleId = await ask('Bundle ID (e.g. "com.scoutpass.app")', `com.${tenantId}.app`);
        nativeDisplayName = await ask('Native display name', displayName);
    }

    log.info('');

    // ── Build config.json ───────────────────────────────────────────────

    const config: Record<string, unknown> = {
        tenantId,
        domain,
        devDomain,

        apis: {
            brainService: 'https://network.learncard.com/trpc',
            brainServiceApi: 'https://network.learncard.com/api',
            cloudService: 'https://cloud.learncard.com/trpc',
            lcaApi: 'https://api.learncard.app/trpc',
        },

        auth: {
            provider: 'firebase',
            keyDerivation: 'sss',
            firebase: {
                apiKey: 'TODO_FIREBASE_API_KEY',
                authDomain: `${tenantId}.firebaseapp.com`,
                projectId: tenantId,
                storageBucket: `${tenantId}.appspot.com`,
                messagingSenderId: 'TODO_MESSAGING_SENDER_ID',
                appId: 'TODO_APP_ID',
            },
            sss: {
                serverUrl: 'https://api.learncard.app/trpc',
                enableEmailBackupShare: true,
                requireEmailForPhoneUsers: true,
            },
        },

        branding: {
            name: displayName,
            shortName,
            defaultTheme,
            brandingKey: tenantId,
            headerText: displayName.toUpperCase(),
            homeRoute: '/wallet',
        },

        features: {
            aiFeatures,
            appStore,
            analytics,
            themeSwitching,
            introSlides,
        },

        observability: {
            launchDarklyClientId: 'TODO_LAUNCHDARKLY_CLIENT_ID',
            userflowToken: 'TODO_USERFLOW_TOKEN',
        },

        links: {},
    };

    if (configureNative) {
        config.native = {
            bundleId,
            displayName: nativeDisplayName,
            deepLinkDomains: [domain],
        };
    }

    // ── Create directory structure ──────────────────────────────────────

    log.info(bold('Creating tenant files...'));
    log.info('');

    const dirs = [
        tenantDir,
        join(tenantDir, 'assets'),
        join(tenantDir, 'assets', 'android'),
        join(tenantDir, 'assets', 'ios'),
        join(tenantDir, 'assets', 'web'),
        join(tenantDir, 'assets', 'branding'),
        join(tenantDir, 'assets', 'config'),
    ];

    for (const dir of dirs) {
        mkdirSync(dir, { recursive: true });
    }

    // Write config.json
    const configPath = join(tenantDir, 'config.json');

    writeFileSync(configPath, JSON.stringify(config, null, 4) + '\n');

    log.info(`   ${green('✓')} ${dim('environments/' + tenantId + '/')}config.json`);

    // Write placeholder Capacitor config
    const capConfig = {
        appId: bundleId || `com.${tenantId}.app`,
        appName: nativeDisplayName || displayName,
        webDir: 'build',
        server: { androidScheme: 'https' },
    };

    writeFileSync(
        join(tenantDir, 'assets', 'config', 'capacitor.config.json'),
        JSON.stringify(capConfig, null, 4) + '\n'
    );

    log.info(`   ${green('✓')} ${dim('assets/config/')}capacitor.config.json`);

    // Write placeholder manifest
    const manifest = {
        short_name: shortName,
        name: displayName,
        icons: [],
        start_url: '.',
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#ffffff',
    };

    writeFileSync(
        join(tenantDir, 'assets', 'config', 'manifest.json'),
        JSON.stringify(manifest, null, 4) + '\n'
    );

    writeFileSync(
        join(tenantDir, 'assets', 'config', 'manifest.webmanifest'),
        JSON.stringify(manifest, null, 4) + '\n'
    );

    log.info(`   ${green('✓')} ${dim('assets/config/')}manifest.json + manifest.webmanifest`);

    // ── Update tenant registry ──────────────────────────────────────────

    try {
        const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));

        if (!registry.hostnames[domain]) {
            registry.hostnames[domain] = {
                tenantId,
                domain,
            };

            writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 4) + '\n');

            log.info(
                `   ${green('✓')} ${dim('environments/')}tenant-registry.json ${dim(
                    '(added ' + domain + ')'
                )}`
            );
        }
    } catch {
        log.info(
            `   ${yellow('⚠')} Could not update tenant-registry.json — add ${domain} manually`
        );
    }

    // ── Create custom theme (optional) ──────────────────────────────────

    if (createCustomTheme) {
        const themeDir = join(THEME_SCHEMAS_DIR, tenantId);
        const themeAssetsDir = join(themeDir, 'assets');

        mkdirSync(themeAssetsDir, { recursive: true });

        const themeJson = {
            id: tenantId,
            displayName: `${displayName} Theme`,
            extends: 'formal',
            iconSet: 'formal',

            defaults: {
                viewMode: 'list',
            },

            colors: {
                categoryBase: {
                    primaryColor: 'cyan-301',
                    backgroundPrimaryColor: '!bg-cyan-400',
                    statusBarColor: 'light',
                },
                launchPad: {
                    backgroundPrimaryColor: '!bg-slate-50',
                },
                sideMenu: {
                    backgroundColor: '#FFFFFF',
                    textColor: '#18224E',
                },
                navbar: {
                    backgroundPrimaryColor: '#FFFFFF',
                },
                introSlides: {
                    backgroundColorSlide1: '#F0F9FF',
                    backgroundColorSlide2: '#F0FDF4',
                    backgroundColorSlide3: '#FFF7ED',
                },
                placeholderBase: {
                    backgroundPrimaryColor: '!bg-slate-50',
                    iconColor: '#94A3B8',
                },
            },

            styles: {
                wallet: {
                    walletHeaderClass: 'bg-white',
                    walleBorderClass: 'border-b border-gray-200',
                },
                launchPad: {
                    headerClass: 'bg-white',
                    borderClass: 'border-b border-gray-200',
                },
            },
        };

        writeFileSync(join(themeDir, 'theme.json'), JSON.stringify(themeJson, null, 4) + '\n');

        log.info(
            `   ${green('✓')} ${dim('src/theme/schemas/' + tenantId + '/')}theme.json ${dim(
                '(extends formal)'
            )}`
        );

        // Copy placeholder assets from formal if they exist
        const formalAssetsDir = join(THEME_SCHEMAS_DIR, 'formal', 'assets');

        if (existsSync(formalAssetsDir)) {
            for (const file of require('fs').readdirSync(formalAssetsDir) as string[]) {
                const src = join(formalAssetsDir, file);
                const dest = join(themeAssetsDir, file);

                if (!existsSync(dest)) {
                    try {
                        copyFileSync(src, dest);
                    } catch {
                        // Non-critical
                    }
                }
            }

            log.info(`   ${green('✓')} ${dim('Copied theme assets from formal/')}`);
        }
    }

    // ── Summary ─────────────────────────────────────────────────────────

    log.info('');
    log.info(green(bold('✅ Tenant created successfully!')));
    log.info('');
    log.info(bold('Next steps:'));
    log.info('');
    log.info(`  1. ${bold('Fill in TODO values')} in config.json:`);
    log.info(`     ${dim(configPath)}`);
    log.info(
        `     Look for ${yellow('TODO_*')} placeholders (Firebase keys, LaunchDarkly, Userflow)`
    );
    log.info('');
    log.info(`  2. ${bold('Add branding assets')} to the assets/branding/ directory:`);
    log.info(`     ${dim('• app-icon.png       — App icon (1024×1024)')}`);
    log.info(`     ${dim('• brand-mark.png     — Brand mark / logo')}`);
    log.info(`     ${dim('• text-logo.svg      — Text logo (SVG)')}`);
    log.info(`     ${dim('• desktop-login-bg.png — Desktop login background')}`);
    log.info('');
    log.info(`  3. ${bold('Validate')} your config:`);
    log.info(`     ${cyan('bunx tsx scripts/validate-tenant-configs.ts')}`);
    log.info('');
    log.info(`  4. ${bold('Start dev server')} with your tenant:`);
    log.info(`     ${cyan(`TENANT=${tenantId} bun run docker-start:tenant`)}`);
    log.info('');

    if (createCustomTheme) {
        log.info(`  5. ${bold('Customize your theme')} colors and styles:`);
        log.info(`     ${dim(`src/theme/schemas/${tenantId}/theme.json`)}`);
        log.info(`     ${cyan('bunx tsx scripts/validate-theme-schemas.ts')}`);
        log.info('');
    }

    rl.close();
};

main().catch(err => {
    log.error('\n❌ Unexpected error:', err);
    process.exit(1);
});

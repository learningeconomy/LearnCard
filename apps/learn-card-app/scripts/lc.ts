#!/usr/bin/env bun

import { getLogger } from 'learn-card-base/src/logging/logger';
const log = getLogger();

/**
 * lc.ts — Interactive developer launcher for the LearnCard app.
 *
 * A single entry point for all common dev tasks. Discovers tenants
 * and themes automatically, presents clear options, and runs the
 * right commands. Designed so a developer who just pulled the repo
 * can type `bun run lc` and be productive immediately.
 *
 * Usage:
 *   bun run lc                    # interactive menu
 *   bun run lc help                # cheat sheet of common commands
 *
 * ⚡ Golden paths:
 *   bun run lc dev vetpass alpha       # web dev server (prompts for run mode)
 *   bun run lc dev vetpass alpha app   # app only — skip the mode menu
 *   bun run lc dev vetpass alpha full  # full stack — skip the mode menu
 *   bun run lc sync vetpass alpha      # cap sync + tenant config patching
 *   bun run lc open vetpass ios        # sync tenant + open Xcode / Android Studio
 *
 * Other shortcuts:
 *   bun run lc start               # Vite only (no Docker)
 *   bun run lc validate            # run all validators
 *   bun run lc resolve vetpass     # print final merged config
 *   bun run lc native build vetpass ios beta  # sync + fastlane build
 */

import { createInterface } from 'readline';
import { readdirSync, existsSync, readFileSync, writeFileSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync, execFileSync } from 'child_process';
import { networkInterfaces } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const MONOREPO_ROOT = resolve(APP_ROOT, '../..');
const ENVIRONMENTS_DIR = resolve(APP_ROOT, 'environments');
const THEME_SCHEMAS_DIR = resolve(APP_ROOT, 'src/theme/schemas');
const FASTLANE_ROOT = resolve(APP_ROOT, '../../tools/fastlane');
const BRAIN_SERVICE_ROOT = resolve(MONOREPO_ROOT, 'services/learn-card-network/brain-service');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const rl = createInterface({ input: process.stdin, output: process.stdout });

const ask = (question: string): Promise<string> =>
    new Promise(res => {
        rl.question(question, answer => res(answer.trim()));
    });

const bold = (s: string): string => `\x1b[1m${s}\x1b[0m`;
const green = (s: string): string => `\x1b[32m${s}\x1b[0m`;
const cyan = (s: string): string => `\x1b[36m${s}\x1b[0m`;
const dim = (s: string): string => `\x1b[2m${s}\x1b[0m`;
const yellow = (s: string): string => `\x1b[33m${s}\x1b[0m`;
const red = (s: string): string => `\x1b[31m${s}\x1b[0m`;

const discoverTenants = (): string[] => {
    if (!existsSync(ENVIRONMENTS_DIR)) return [];

    return readdirSync(ENVIRONMENTS_DIR).filter(name => {
        const full = join(ENVIRONMENTS_DIR, name);

        // Must have config.json; skip the legacy "local" directory (now learncard/config.local.json)
        return (
            statSync(full).isDirectory() &&
            existsSync(join(full, 'config.json')) &&
            name !== 'local'
        );
    });
};

const discoverStages = (tenantId: string): string[] => {
    const tenantDir = join(ENVIRONMENTS_DIR, tenantId);

    if (!existsSync(tenantDir)) return [];

    return readdirSync(tenantDir)
        .filter(f => /^config\..+\.json$/.test(f))
        .map(f => f.replace(/^config\./, '').replace(/\.json$/, ''));
};

const discoverThemes = (): string[] => {
    if (!existsSync(THEME_SCHEMAS_DIR)) return [];

    return readdirSync(THEME_SCHEMAS_DIR).filter(name => {
        const full = join(THEME_SCHEMAS_DIR, name);

        return statSync(full).isDirectory() && existsSync(join(full, 'theme.json'));
    });
};

/** Check if a string matches a known stage name across all tenants (or 'local'). */
const asStage = (value?: string): string | undefined => {
    if (!value) return undefined;
    if (value === 'local' || value === 'production') return value;

    const allStages = new Set<string>();

    for (const t of discoverTenants()) {
        for (const s of discoverStages(t)) {
            allStages.add(s);
        }
    }

    return allStages.has(value) ? value : undefined;
};

const getTenantDisplayName = (tenantId: string): string => {
    try {
        const configPath = join(ENVIRONMENTS_DIR, tenantId, 'config.json');
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));

        return config.branding?.name ?? tenantId;
    } catch {
        return tenantId;
    }
};

const getTenantBundleId = (tenantId: string): string => {
    try {
        const configPath = join(ENVIRONMENTS_DIR, tenantId, 'config.json');
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));

        return config.native?.bundleId ?? `com.${tenantId}.app`;
    } catch {
        return `com.${tenantId}.app`;
    }
};

const runCommand = (cmd: string, label: string, shortcut?: string, cwd?: string): void => {
    log.info('');
    log.info(green(`▶ ${label}`));
    log.info(dim(`  $ ${cmd}`));

    if (shortcut) {
        log.info('');
        log.info(dim(`  💡 Next time, run: ${cyan(shortcut)}`));
    }

    log.info('');

    rl.close();

    const child = spawn('sh', ['-c', cmd], {
        cwd: cwd ?? APP_ROOT,
        stdio: 'inherit',
        env: { ...process.env },
    });

    child.on('exit', code => process.exit(code ?? 0));
};

// ---------------------------------------------------------------------------
// Credential Viewer & Seed Data
// ---------------------------------------------------------------------------

const launchCredentialViewer = () => {
    runCommand(
        'bunx nx dev credential-viewer',
        'Launching Credential Viewer',
        'bun run lc viewer',
        MONOREPO_ROOT
    );
};

const seedAppStoreListing = async () => {
    const seedScript = resolve(BRAIN_SERVICE_ROOT, 'scripts/seed-dev-app.ts');

    if (!existsSync(seedScript)) {
        log.error(`\n❌ Seed script not found at ${seedScript}`);
        rl.close();
        process.exit(1);
    }

    log.info('');
    log.info(bold('🌱 Seed App Store Listing'));
    log.info(dim('   Creates a dev partner app, profile, and listing in your local DB.'));
    log.info(dim('   Requires Neo4j + Redis + MongoDB running (e.g. bun run lc dev ... full).'));
    log.info('');
    log.info(dim('   Press Enter on any field to accept the default.'));
    log.info('');

    const fields: Array<{ flag: string; label: string; defaultVal: string; hint?: string }> = [
        { flag: '--app-name', label: 'App name', defaultVal: 'Dev Partner App' },
        { flag: '--app-url', label: 'App URL', defaultVal: 'http://localhost:4321' },
        { flag: '--profile', label: 'Owner profile ID', defaultVal: 'dev-owner' },
        {
            flag: '--install-for',
            label: 'Install for profile',
            defaultVal: '',
            hint: 'skip to not auto-install',
        },
        { flag: '--app-image', label: 'App image URL', defaultVal: '', hint: 'skip for no image' },
        {
            flag: '--promotion',
            label: 'Promotion level',
            defaultVal: 'FEATURED_CAROUSEL',
            hint: 'FEATURED_CAROUSEL | CURATED_LIST | NONE',
        },
        {
            flag: '--sa-endpoint',
            label: 'Signing authority endpoint',
            defaultVal: 'http://localhost:5100/api',
        },
        { flag: '--template-alias', label: 'Template alias', defaultVal: 'default' },
    ];

    const flagParts: string[] = [];

    for (const field of fields) {
        const defaultHint = field.defaultVal || (field.hint ?? 'none');
        const val = await ask(`  ${field.label} ${dim(`(${defaultHint})`)}: `);

        if (val && val !== field.defaultVal) {
            flagParts.push(`${field.flag} ${val}`);
        }
    }

    const resetLimits = await ask(`  Reset rate limits? ${dim('(y/N)')}: `);

    if (resetLimits.toLowerCase() === 'y') {
        flagParts.push('--reset-rate-limits');
    }

    const flagStr = flagParts.join(' ');
    const cmd = `bun scripts/seed-dev-app.ts${flagStr ? ` ${flagStr}` : ''}`;

    runCommand(
        cmd,
        'Seeding app store listing into local database',
        `bun run lc seed app${flagStr ? ` ${flagStr}` : ''}`,
        BRAIN_SERVICE_ROOT
    );
};

/**
 * Seed the Pathways v0.5 demo bundle — three AppStoreListings with a mix of
 * launch types (EMBEDDED_IFRAME, DIRECT_LINK, AI_TUTOR), using deterministic
 * UUIDs so the in-app dev seed (`src/pages/pathways/dev/devSeed.ts`) can
 * reference them by ID without a lookup round-trip.
 *
 * All defaults come from the preset itself; only the owner profile is
 * promptable here so you can seed the bundle under a specific dev account.
 */
const seedPathwayDemoBundle = async () => {
    const seedScript = resolve(BRAIN_SERVICE_ROOT, 'scripts/seed-dev-app.ts');

    if (!existsSync(seedScript)) {
        log.error(`\n❌ Seed script not found at ${seedScript}`);
        rl.close();
        process.exit(1);
    }

    log.info('');
    log.info(bold('🌱 Seed Pathways demo bundle'));
    log.info(dim('   Seeds 3 AppStoreListings for the AWS Cloud Practitioner demo pathway:'));
    log.info(dim('     • Coursera — AWS Cloud Essentials  (DIRECT_LINK)'));
    log.info(dim('     • AWS Practice Studio              (EMBEDDED_IFRAME)'));
    log.info(dim('     • Cloud Coach                       (AI_TUTOR)'));
    log.info(dim('   Idempotent — safe to re-run.'));
    log.info('');

    const ownerProfileId = await ask(`  Owner profile ID ${dim('(dev-owner)')}: `);
    const installFor = await ask(`  Install for profile ${dim('(skip to not auto-install)')}: `);

    const flagParts: string[] = ['--preset pathway-demo'];

    if (ownerProfileId) flagParts.push(`--profile ${ownerProfileId}`);
    if (installFor) flagParts.push(`--install-for ${installFor}`);

    const flagStr = flagParts.join(' ');
    const cmd = `bun scripts/seed-dev-app.ts ${flagStr}`;

    runCommand(
        cmd,
        'Seeding Pathways demo bundle into local database',
        `bun run lc seed pathway-demo${ownerProfileId ? ` --profile ${ownerProfileId}` : ''}`,
        BRAIN_SERVICE_ROOT
    );
};

const seedTestData = async () => {
    log.info('');
    log.info(bold('  🌱 Seed Test Data'));
    log.info(dim('   Populate your local database with dev data.'));
    log.info('');
    log.info(
        `  ${cyan('a')}  ${bold('App store listing')}       ${dim(
            '— dev partner app + profile + listing'
        )}`
    );
    log.info(
        `  ${cyan('b')}  ${bold('Pathways demo bundle')}    ${dim(
            '— 3 listings for the AWS Cloud Practitioner pathway'
        )}`
    );
    log.info('');
    log.info(dim('  Press Enter to go back'));
    log.info('');

    const sub = await ask('Pick [a, b]: ');

    switch (sub) {
        case 'a':
            await seedAppStoreListing();
            break;

        case 'b':
            await seedPathwayDemoBundle();
            break;

        default:
            await main();
            break;
    }
};

// ---------------------------------------------------------------------------
// Menu actions
// ---------------------------------------------------------------------------

const pickStage = async (
    tenantId: string,
    defaultStage: 'local' | 'production' = 'local'
): Promise<string> => {
    const stages = discoverStages(tenantId);

    if (stages.length === 0) {
        return defaultStage;
    }

    const lastIdx = stages.length + 1;
    const defaultIdx = defaultStage === 'production' ? lastIdx : 1;

    log.info('');
    log.info(bold('Available stages:'));
    log.info('');
    log.info(
        `  ${cyan('1')}  ${bold('local')} — local dev ${
            defaultStage === 'local' ? dim('(default)') : ''
        }`
    );

    stages
        .filter(s => s !== 'local')
        .forEach((s, i) => {
            log.info(`  ${cyan(`${i + 2}`)}  ${bold(s)}`);
        });

    log.info(
        `  ${cyan(`${lastIdx}`)}  ${bold('production')} — no stage overlay ${
            defaultStage === 'production' ? dim('(default)') : ''
        }`
    );
    log.info('');

    const choice = await ask(
        `Pick a stage [1-${lastIdx}] ${dim(`(default: ${defaultIdx} / ${defaultStage})`)}: `
    );

    if (!choice) return defaultStage;
    if (choice === '1') return 'local';
    if (choice === String(lastIdx)) return 'production';

    const allStages = ['local', ...stages.filter(s => s !== 'local')];
    const idx = parseInt(choice, 10) - 1;

    return allStages[idx] ?? defaultStage;
};

type DevMode = 'full' | 'app' | 'services';

const asDevMode = (s?: string): DevMode | undefined => {
    if (!s) return undefined;

    const map: Record<string, DevMode> = {
        full: 'full',
        app: 'app',
        services: 'services',
    };

    return map[s.toLowerCase()];
};

/**
 * Recognized CLI keywords that mean "skip docker --build".
 * Use a positive keyword (`fast`) and the literal flag (`no-build`) so the
 * intent is obvious either way.
 */
const NO_BUILD_KEYWORDS = new Set(['fast', 'no-build', 'nobuild']);

const asNoBuild = (s?: string): boolean | undefined => {
    if (!s) return undefined;
    if (NO_BUILD_KEYWORDS.has(s.toLowerCase())) return true;
    if (s.toLowerCase() === 'build' || s.toLowerCase() === 'rebuild') return false;

    return undefined;
};
const isLocalAi = (s?: string): boolean => s?.toLowerCase() === 'local-aip';

const startDev = async (
    tenantId?: string,
    stageId?: string,
    devMode?: DevMode,
    noBuild?: boolean,
    useLocalAi = false
) => {
    const tenants = discoverTenants();

    if (!tenantId) {
        log.info('');
        log.info(bold('Available tenants:'));
        log.info('');

        tenants.forEach((t, i) => {
            const name = getTenantDisplayName(t);
            const stages = discoverStages(t);
            const stageList = stages.length > 0 ? dim(` [${stages.join(', ')}]`) : '';
            const marker = t === 'learncard' ? dim(' (default)') : '';

            log.info(`  ${cyan(`${i + 1}`)}  ${bold(t)} — ${name}${marker}${stageList}`);
        });

        log.info('');

        const choice = await ask(
            `Pick a tenant [1-${tenants.length}] or name ${dim('(default: learncard)')}: `
        );

        if (!choice) {
            tenantId = 'learncard';
        } else if (/^\d+$/.test(choice)) {
            const idx = parseInt(choice, 10) - 1;

            tenantId = tenants[idx] ?? 'learncard';
        } else {
            tenantId = choice;
        }
    }

    // Pick stage if not provided via CLI shortcut
    if (!stageId) {
        const stages = discoverStages(tenantId);

        if (stages.length > 0) {
            stageId = await pickStage(tenantId);
        } else {
            stageId = 'local';
        }
    }

    const displayName = getTenantDisplayName(tenantId);
    const stageFlag = stageId === 'production' ? '' : ` --stage ${stageId}`;
    const stageLabel = stageId === 'production' ? '' : ` (${stageId})`;

    if (!devMode) {
        log.info('');
        log.info(bold('How do you want to run?'));
        log.info('');
        log.info(
            `  ${cyan('1')}  ${bold('Full stack')} — Docker services + Vite dev server ${dim(
                '(bun run dev)'
            )}`
        );
        log.info(
            `  ${cyan('2')}  ${bold('App only')} — Just the Vite dev server ${dim(
                '(assumes services are running)'
            )}`
        );
        log.info(
            `  ${cyan('3')}  ${bold('Services only')} — Docker services, no app ${dim(
                '(bun run dev:services)'
            )}`
        );
        log.info('');

        const modeChoice = await ask(`Pick a mode [1-3] ${dim('(default: 1)')}: `);

        devMode = modeChoice === '2' ? 'app' : modeChoice === '3' ? 'services' : 'full';
    }

    // Only Docker-backed modes care about --build; ask once if the caller
    // didn't already decide via the CLI shortcut.
    const usesDocker = devMode === 'full' || devMode === 'services';

    if (usesDocker && noBuild === undefined) {
        log.info('');
        log.info(
            dim('  Tip: skip --build to start ~10× faster when nothing in Docker has changed.')
        );
        const buildAns = await ask(`Rebuild Docker images? ${dim('(Y/n)')}: `);

        noBuild = buildAns.trim().toLowerCase() === 'n';
    }

    const stageArg = stageId === 'local' ? '' : ` ${stageId}`;
    const modeArg = devMode === 'full' ? '' : ` ${devMode}`;
    const buildFlag = noBuild ? '' : ' --build';
    const fastArg = noBuild ? ' fast' : '';
    const localAiFlag = useLocalAi ? ' --local-aip' : '';
    const localAiArg = useLocalAi ? ' local-aip' : '';
    const localAiEnv = useLocalAi ? ' LOCAL_AIP=1' : '';
    const dockerUidEnv = 'LOCAL_UID=$(id -u) LOCAL_GID=$(id -g)';

    switch (devMode) {
        case 'app':
            runCommand(
                `bun scripts/prepare-native-config.ts ${tenantId}${stageFlag}${localAiFlag} && vite --host`,
                `Starting ${displayName}${stageLabel} — app only${useLocalAi ? ' + local AI' : ''}`,
                `bun run lc dev ${tenantId}${stageArg} app${localAiArg}`
            );
            break;

        case 'services':
            runCommand(
                `${dockerUidEnv} docker compose -f compose-local.yaml up${buildFlag} --scale app=0`,
                `Starting Docker services (no app)${noBuild ? ' — skipping rebuild' : ''}`,
                `bun run lc dev ${tenantId}${stageArg} services${fastArg}`
            );
            break;

        case 'full':
        default:
            runCommand(
                `${dockerUidEnv}${localAiEnv} TENANT=${tenantId} STAGE=${stageId} docker compose -f compose-local.yaml up${buildFlag}`,
                `Starting ${displayName}${stageLabel} — full stack${
                    noBuild ? ' (skipping rebuild)' : ''
                }${useLocalAi ? ' + local AI' : ''}`,
                `bun run lc dev ${tenantId}${stageArg}${
                    modeArg ? '' : ' full'
                }${fastArg}${localAiArg}`
            );
            break;
    }
};

const pickTenantAndPrepare = async () => {
    const tenants = discoverTenants();

    log.info('');
    log.info(bold('Switch active tenant config:'));
    log.info('');

    tenants.forEach((t, i) => {
        const name = getTenantDisplayName(t);
        const stages = discoverStages(t);
        const stageList = stages.length > 0 ? dim(` [${stages.join(', ')}]`) : '';

        log.info(`  ${cyan(`${i + 1}`)}  ${bold(t)} — ${name}${stageList}`);
    });

    log.info('');

    const choice = await ask(`Pick a tenant [1-${tenants.length}]: `);

    let tenantId: string;

    if (/^\d+$/.test(choice)) {
        tenantId = tenants[parseInt(choice, 10) - 1] ?? 'learncard';
    } else {
        tenantId = choice || 'learncard';
    }

    const stageId = await pickStage(tenantId);
    const stageFlag = stageId === 'production' ? '' : ` --stage ${stageId}`;

    const stageArg = stageId === 'local' ? '' : ` ${stageId}`;

    runCommand(
        `bun scripts/prepare-native-config.ts ${tenantId}${stageFlag}`,
        `Preparing config for ${getTenantDisplayName(tenantId)} (${tenantId}, ${stageId})`,
        `bun run lc switch ${tenantId}${stageArg}`
    );
};

const runValidators = () => {
    runCommand(
        'bun scripts/validate-tenant-configs.ts && bun scripts/validate-theme-schemas.ts',
        'Validating all tenant configs + theme schemas',
        'bun run lc validate'
    );
};

const generateAssets = async () => {
    const tenants = discoverTenants();

    log.info('');
    log.info(bold('Generate tenant assets from a logo'));
    log.info(dim('  Creates iOS, Android, web, and branding assets.'));
    log.info('');

    // 1. Pick tenant
    tenants.forEach((t, i) => {
        const name = getTenantDisplayName(t);
        const hasAssets = existsSync(join(ENVIRONMENTS_DIR, t, 'assets'));
        const assetLabel = hasAssets ? dim(' (has assets — will overwrite)') : '';

        log.info(`  ${cyan(`${i + 1}`)}  ${bold(t)} — ${name}${assetLabel}`);
    });

    log.info('');

    const tenantChoice = await ask(`Pick a tenant [1-${tenants.length}]: `);
    let tenantId: string;

    if (/^\d+$/.test(tenantChoice)) {
        tenantId = tenants[parseInt(tenantChoice, 10) - 1] ?? tenants[0]!;
    } else {
        tenantId = tenantChoice || tenants[0]!;
    }

    // 2. Generation mode
    const hasExistingAssets = existsSync(join(ENVIRONMENTS_DIR, tenantId, 'assets'));

    let fillOnly = false;

    if (hasExistingAssets) {
        log.info('');
        log.info(bold('This tenant already has assets. How do you want to generate?'));
        log.info('');
        log.info(
            `  ${cyan('1')}  ${bold(
                'Fill missing'
            )} — only generate assets that don\'t exist yet ${dim('(safe)')}`
        );
        log.info(
            `  ${cyan('2')}  ${bold(
                'Full regen'
            )}  — regenerate all assets (overwrites existing) ${dim('(config/ preserved)')}`
        );
        log.info('');

        const modeChoice = await ask(`Pick a mode [1-2] ${dim('(default: 1 / fill)')}: `);

        fillOnly = modeChoice !== '2';
    }

    // 3. Logo path (primary icon / brand mark)
    log.info('');
    log.info(dim('  Tip: Drag a file from Finder into the terminal to paste its path.'));
    log.info(dim('  The primary logo is the icon/mark — used for app icons, favicon, etc.'));
    log.info(dim('  Recommended: PNG or SVG, at least 1024×1024.'));
    log.info('');

    let logoPath = await ask('Primary icon / brand mark file path: ');

    if (!logoPath) {
        log.info(yellow('  No logo path provided. Aborting.'));
        rl.close();
        return;
    }

    // Strip quotes that drag-and-drop sometimes adds
    logoPath = logoPath.replace(/^["']|["']$/g, '').trim();

    // 3b. Display name
    const configName = getTenantDisplayName(tenantId);
    const nameDefault =
        configName !== tenantId ? configName : tenantId.charAt(0).toUpperCase() + tenantId.slice(1);

    log.info('');

    const nameInput = await ask(`Display name ${dim(`(default: ${nameDefault})`)}: `);
    const displayName = nameInput || nameDefault;

    // 4. Background color
    log.info('');
    log.info(dim('  Icon & splash background color. Use hex format: #1A3C5E'));

    const bgInput = await ask(`Background color ${dim('(default: #FFFFFF)')}: `);
    const bgHex = bgInput || '#FFFFFF';

    // 5. Splash background color
    const splashInput = await ask(
        `Splash background color ${dim(`(default: same as bg ${bgHex})`)}: `
    );
    const splashHex = splashInput || '';

    // 6. Optional: skip splash?
    log.info('');

    const skipSplashInput = await ask(`Skip splash screens? ${dim('(y/N)')}: `);
    const skipSplash = skipSplashInput.toLowerCase() === 'y';

    // 7. Logo variant overrides
    log.info('');
    log.info(bold('Logo variant overrides'));
    log.info(dim('  If you have Figma exports for different logo variants, provide them below.'));
    log.info(dim('  Press Enter to skip any variant — it will be auto-generated.'));
    log.info('');

    // -- Icon for dark backgrounds --
    log.info(dim('  Icon / brand mark — light/white version for dark backgrounds.'));
    log.info(dim('  (e.g. white version of your icon for use on dark/colored surfaces)'));
    const iconLightInput = await ask(
        `Icon for dark backgrounds ${dim('(Enter to auto-generate)')}: `
    );

    log.info('');

    // -- Wordmark for dark backgrounds --
    log.info(dim('  Wordmark (text only, no icon) — white/light text for dark backgrounds.'));
    log.info(dim('  (Used on: loading page, intro slides, login page)'));
    const wordmarkInput = await ask(
        `Wordmark for dark backgrounds ${dim('(Enter to auto-generate)')}: `
    );

    // -- Wordmark for light backgrounds --
    log.info(dim('  Wordmark (text only, no icon) — dark text for light backgrounds.'));
    log.info(dim('  (Used on: side menu header, AI sessions desktop header)'));
    const wordmarkLightInput = await ask(
        `Wordmark for light backgrounds ${dim('(Enter to auto-generate)')}: `
    );

    log.info('');

    // -- Full lockup for light backgrounds --
    log.info(dim('  Full lockup (icon + wordmark combined) — dark logo for light backgrounds.'));
    log.info(dim('  (Used for: og:image, share cards, external embeds)'));
    const fullLogoInput = await ask(
        `Full lockup for light backgrounds ${dim('(Enter to skip)')}: `
    );

    // -- Full lockup for dark backgrounds --
    log.info(dim('  Full lockup (icon + wordmark combined) — light logo for dark backgrounds.'));
    log.info(dim('  (Used for: splash screens, share cards on dark surfaces)'));
    const fullLogoDarkInput = await ask(
        `Full lockup for dark backgrounds ${dim('(Enter to skip)')}: `
    );

    log.info('');

    // -- Desktop backgrounds --
    log.info(dim('  Desktop login background images (optional overrides).'));
    const desktopBgInput = await ask(`Desktop login BG file ${dim('(Enter to auto-generate)')}: `);
    const desktopBgAltInput = await ask(
        `Desktop login BG alt file ${dim('(Enter to auto-generate)')}: `
    );

    // Build command
    let cmd = `bun scripts/generate-tenant-assets.ts ${tenantId} ${JSON.stringify(logoPath)}`;
    let shortcut = `bun run lc generate ${tenantId} ${JSON.stringify(logoPath)}`;

    cmd += ` --bg "${bgHex}"`;
    shortcut += ` --bg "${bgHex}"`;

    if (displayName !== nameDefault) {
        cmd += ` --name "${displayName}"`;
        shortcut += ` --name "${displayName}"`;
    }

    if (splashHex) {
        cmd += ` --splash-bg "${splashHex}"`;
        shortcut += ` --splash-bg "${splashHex}"`;
    }

    if (skipSplash) {
        cmd += ' --no-splash';
        shortcut += ' --no-splash';
    }

    if (fillOnly) {
        cmd += ' --fill';
        shortcut += ' --fill';
    }

    // Skip the generate script's own confirmation — we already confirmed here
    cmd += ' --yes';

    const cleanPath = (p: string) => p.replace(/^["']|["']$/g, '').trim();

    if (iconLightInput) {
        const cleaned = cleanPath(iconLightInput);
        cmd += ` --icon-light ${JSON.stringify(cleaned)}`;
        shortcut += ` --icon-light ${JSON.stringify(cleaned)}`;
    }

    if (wordmarkInput) {
        const cleaned = cleanPath(wordmarkInput);
        cmd += ` --wordmark ${JSON.stringify(cleaned)}`;
        shortcut += ` --wordmark ${JSON.stringify(cleaned)}`;
    }

    if (wordmarkLightInput) {
        const cleaned = cleanPath(wordmarkLightInput);
        cmd += ` --wordmark-light ${JSON.stringify(cleaned)}`;
        shortcut += ` --wordmark-light ${JSON.stringify(cleaned)}`;
    }

    if (fullLogoInput) {
        const cleaned = cleanPath(fullLogoInput);
        cmd += ` --full-logo ${JSON.stringify(cleaned)}`;
        shortcut += ` --full-logo ${JSON.stringify(cleaned)}`;
    }

    if (fullLogoDarkInput) {
        const cleaned = cleanPath(fullLogoDarkInput);
        cmd += ` --full-logo-light ${JSON.stringify(cleaned)}`;
        shortcut += ` --full-logo-light ${JSON.stringify(cleaned)}`;
    }

    if (desktopBgInput) {
        cmd += ` --desktop-bg ${JSON.stringify(cleanPath(desktopBgInput))}`;
    }

    if (desktopBgAltInput) {
        cmd += ` --desktop-bg-alt ${JSON.stringify(cleanPath(desktopBgAltInput))}`;
    }

    // Summary
    log.info('');
    log.info(bold('Summary:'));
    log.info(`  Tenant:       ${bold(tenantId)}`);
    log.info(`  Mode:         ${fillOnly ? 'fill missing only' : 'full regeneration'}`);
    log.info(`  Primary icon: ${logoPath}`);
    log.info(`  Name:         ${displayName}`);
    log.info(`  Icon BG:      ${bgHex}`);
    log.info(`  Splash BG:    ${splashHex || bgHex}`);
    log.info(`  Skip splash:  ${skipSplash ? 'yes' : 'no'}`);

    // Show which variants were provided
    const variants: Array<[string, string]> = [];

    if (iconLightInput) variants.push(['Icon (dark bg)', cleanPath(iconLightInput)]);
    if (wordmarkInput) variants.push(['Wordmark (dark bg)', cleanPath(wordmarkInput)]);
    if (wordmarkLightInput) variants.push(['Wordmark (light bg)', cleanPath(wordmarkLightInput)]);
    if (fullLogoInput) variants.push(['Full lockup (light bg)', cleanPath(fullLogoInput)]);
    if (fullLogoDarkInput) variants.push(['Full lockup (dark bg)', cleanPath(fullLogoDarkInput)]);
    if (desktopBgInput) variants.push(['Desktop BG', cleanPath(desktopBgInput)]);
    if (desktopBgAltInput) variants.push(['Desktop BG alt', cleanPath(desktopBgAltInput)]);

    if (variants.length > 0) {
        log.info('');
        log.info(bold('  Logo variants:'));

        for (const [label, val] of variants) {
            log.info(`    ${label}: ${val}`);
        }
    } else {
        log.info('');
        log.info(dim('  No logo variants provided — all will be auto-generated.'));
    }

    log.info('');

    const confirm = await ask(`Proceed? ${dim('(Y/n)')}: `);

    if (confirm.toLowerCase() === 'n') {
        log.info(dim('  Cancelled.'));
        rl.close();
        return;
    }

    runCommand(cmd, `Generating assets for ${displayName} (${tenantId})`, shortcut);
};

// ---------------------------------------------------------------------------
// Reusable tenant picker (returns tenantId)
// ---------------------------------------------------------------------------

const pickTenant = async (defaultTenant = 'learncard'): Promise<string> => {
    const tenants = discoverTenants();

    log.info('');
    log.info(bold('Available tenants:'));
    log.info('');

    tenants.forEach((t, i) => {
        const name = getTenantDisplayName(t);
        const marker = t === defaultTenant ? dim(' (default)') : '';

        log.info(`  ${cyan(`${i + 1}`)}  ${bold(t)} — ${name}${marker}`);
    });

    log.info('');

    const choice = await ask(
        `Pick a tenant [1-${tenants.length}] or name ${dim(`(default: ${defaultTenant})`)}: `
    );

    if (!choice) return defaultTenant;

    if (/^\d+$/.test(choice)) {
        return tenants[parseInt(choice, 10) - 1] ?? defaultTenant;
    }

    return choice;
};

// ---------------------------------------------------------------------------
// Native / Capacitor commands
// ---------------------------------------------------------------------------

type Platform = 'ios' | 'android';

const pickPlatform = async (): Promise<Platform> => {
    log.info('');
    log.info(bold('Platform:'));
    log.info('');
    log.info(`  ${cyan('1')}  ${bold('ios')}     — Open in Xcode / run on iOS simulator`);
    log.info(`  ${cyan('2')}  ${bold('android')} — Open in Android Studio / run on device`);
    log.info('');

    const choice = await ask(`Pick a platform [1-2] ${dim('(default: 1 / ios)')}: `);

    return choice === '2' ? 'android' : 'ios';
};

const getLanIp = (): string | null => {
    const nets = networkInterfaces();

    for (const name of Object.keys(nets)) {
        for (const net of nets[name] ?? []) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (!net.internal && net.family === 'IPv4') {
                return net.address;
            }
        }
    }

    return null;
};

const CAP_CONFIG_TS = resolve(APP_ROOT, 'capacitor.config.ts');
const CAP_CONFIG_BACKUP = resolve(APP_ROOT, 'capacitor.config.ts.bak');

const patchCapConfigSource = (serverUrl: string): void => {
    const content = readFileSync(CAP_CONFIG_TS, 'utf-8');

    // Back up the original so we can restore it cleanly after sync
    writeFileSync(CAP_CONFIG_BACKUP, content, 'utf-8');

    // Inject a `server` property into the config object, right before the closing `};`
    const serverBlock = `    server: {\n        url: '${serverUrl}',\n        cleartext: true,\n    },\n`;

    // Insert before the final `};` that closes the config object
    let patched = content.replace(
        /(\n};\s*\nexport default config;)/,
        `\n${serverBlock}};\n\nexport default config;`
    );

    if (patched === content) {
        log.warn(`   ⚠️  Could not find insertion point in capacitor.config.ts — patching failed`);
        return;
    }

    // Also disable Capgo auto-update for the session — an OTA bundle landing
    // mid-dev can force-reload off the LAN URL or pop the CapGoUpdateModal.
    // The .bak restore in Step 3 puts `autoUpdate: true` back automatically.
    const beforeCapgoPatch = patched;

    patched = patched.replace(/autoUpdate:\s*true,/, 'autoUpdate: false,');

    const capgoDisabled = patched !== beforeCapgoPatch;

    writeFileSync(CAP_CONFIG_TS, patched, 'utf-8');
    log.info(`   ${green('✓')} Patched capacitor.config.ts → server.url = ${serverUrl}`);

    if (capgoDisabled) {
        log.info(
            `   ${green('✓')} Patched capacitor.config.ts → CapacitorUpdater.autoUpdate = false`
        );
    } else {
        log.warn(
            `   ⚠️  Could not find \`autoUpdate: true\` in CapacitorUpdater — Capgo may still poll during the session`
        );
    }
};

const unpatchCapConfigSource = (): void => {
    if (!existsSync(CAP_CONFIG_BACKUP)) {
        log.warn('   ⚠️  No backup found — skipping unpatch');
        return;
    }

    const original = readFileSync(CAP_CONFIG_BACKUP, 'utf-8');

    writeFileSync(CAP_CONFIG_TS, original, 'utf-8');

    // Remove the backup file
    try {
        execSync(`rm -f "${CAP_CONFIG_BACKUP}"`, { cwd: APP_ROOT });
    } catch {
        /* ignore */
    }

    log.info(`   ${green('✓')} Restored capacitor.config.ts from backup`);
};

/**
 * Re-patch the platform `capacitor.config.json` files after
 * `prepare-native-config.ts` has run.
 *
 * Why this exists: `prepare-native-config.ts` Step 5b (`cpSync` of
 * `environments/<tenant>/assets/config/capacitor.config.json` over the
 * cap-synced platform JSONs) wholesale replaces both
 * `ios/App/App/capacitor.config.json` and the Android equivalent. That
 * drops the `server` block we patched into the source TS in Step 1
 * (so live-reload would silently fall back to the local bundle) AND
 * restores `CapacitorUpdater.autoUpdate: true` (so Capgo polls for OTA
 * bundles mid-dev session and can force-reload off the LAN URL).
 *
 * The platform JSONs are gitignored and regenerated on the next
 * `prepare-native-config.ts` run, so no manual cleanup is needed —
 * the next normal `bun run lc` invocation lands us back on the canonical
 * tenant config.
 */
const patchPlatformJsonsForLiveReload = (serverUrl: string): void => {
    const platformPaths = [
        resolve(APP_ROOT, 'ios/App/App/capacitor.config.json'),
        resolve(APP_ROOT, 'android/app/src/main/assets/capacitor.config.json'),
    ];

    for (const jsonPath of platformPaths) {
        if (!existsSync(jsonPath)) continue;

        try {
            const raw = JSON.parse(readFileSync(jsonPath, 'utf-8'));

            raw.server = { url: serverUrl, cleartext: true };

            if (raw.plugins?.CapacitorUpdater) {
                raw.plugins.CapacitorUpdater.autoUpdate = false;
            }

            writeFileSync(jsonPath, JSON.stringify(raw, null, 2) + '\n', 'utf-8');

            const relPath = jsonPath.replace(`${APP_ROOT}/`, '');

            log.info(`   ${green('✓')} Patched ${relPath} → server.url + autoUpdate=false`);
        } catch (err) {
            log.warn(`   ⚠️  Failed to patch ${jsonPath}:`, err);
        }
    }
};

/**
 * Set Vite env vars that differ between production and non-production native builds.
 * In dev mode (`bun run lc dev`), `import.meta.env.DEV` is true so the debug widget
 * shows automatically. But `vite build` always produces a production bundle where
 * `DEV` is false, so we must explicitly enable the widget via env var for non-prod stages.
 */
const setNativeBuildEnv = (stageId: string): void => {
    const isProduction = stageId === 'production';

    process.env.VITE_ENABLE_AUTH_DEBUG_WIDGET = isProduction ? 'false' : 'true';
};

const execBlocking = (cmd: string, label: string, cwd: string = APP_ROOT): void => {
    log.info('');
    log.info(green(`▶ ${label}`));
    log.info(dim(`  $ ${cmd}`));
    log.info('');

    try {
        execSync(cmd, { cwd, stdio: 'inherit' });
    } catch (err) {
        log.error(`\n❌ Command failed: ${cmd}`);
        throw err;
    }
};

/**
 * Argument-array exec (no shell). Use this whenever any argument is derived from
 * user input or config (tenant, stage, channel, appId, version) so values are
 * passed verbatim to the binary and never parsed by a shell — closes the
 * command-injection surface that string interpolation into `execBlocking` opens.
 */
const execFileBlocking = (
    file: string,
    args: string[],
    label: string,
    cwd: string = APP_ROOT
): void => {
    log.info('');
    log.info(green(`▶ ${label}`));
    log.info(dim(`  $ ${file} ${args.join(' ')}`));
    log.info('');

    try {
        execFileSync(file, args, { cwd, stdio: 'inherit' });
    } catch (err) {
        log.error(`\n❌ Command failed: ${file} ${args.join(' ')}`);
        throw err;
    }
};

const nativeSync = async (tenantId?: string, stageId?: string) => {
    if (!tenantId) {
        tenantId = await pickTenant();
    }

    if (!stageId) {
        stageId = await pickStage(tenantId);
    }

    const stageFlag = stageId === 'production' ? '' : ` --stage ${stageId}`;
    const displayName = getTenantDisplayName(tenantId);

    log.info('');
    log.info(bold(`📱 Native sync: ${displayName} (${tenantId}, ${stageId})`));

    // 1. Populate public/ with tenant config + assets (so vite build picks them up)
    execBlocking(
        `bun scripts/prepare-native-config.ts ${tenantId}${stageFlag}`,
        'Preparing tenant config (public/)'
    );

    // 2. Build web app with correct tenant data
    setNativeBuildEnv(stageId);
    execBlocking('npx vite build', 'Building web app');

    // 3. Copy fresh build/ into native projects
    execBlocking('bunx cap sync', 'Running Capacitor sync');

    // 4. Re-patch native files that cap sync overwrites (capacitor.config.json, etc.)
    execBlocking(
        `bun scripts/prepare-native-config.ts ${tenantId}${stageFlag}`,
        'Patching native projects with tenant config'
    );

    log.info('');
    log.info(green('✅ Native sync complete.'));
    log.info(
        dim(
            '   Run `bun run lc native open ios` or `bun run lc native open android` to open the IDE.'
        )
    );
    log.info('');

    rl.close();
};

const nativeOpen = async (platform?: Platform, tenantId?: string, stageId?: string) => {
    if (!platform) {
        platform = await pickPlatform();
    }

    // If a tenant is specified, build + sync + patch before opening
    if (tenantId) {
        if (!stageId) {
            stageId = await pickStage(tenantId);
        }

        const stageFlag = stageId === 'production' ? '' : ` --stage ${stageId}`;
        const displayName = getTenantDisplayName(tenantId);

        log.info('');
        log.info(bold(`📱 Native open: ${displayName} (${tenantId}) → ${platform}`));

        // 1. Populate public/ with tenant config + assets
        execBlocking(
            `bun scripts/prepare-native-config.ts ${tenantId}${stageFlag}`,
            'Preparing tenant config (public/)'
        );

        // 2. Build web app with correct tenant data
        setNativeBuildEnv(stageId);
        execBlocking('npx vite build', 'Building web app');

        // 3. Copy fresh build/ into native projects
        execBlocking('bunx cap sync', 'Running Capacitor sync');

        // 4. Re-patch native files that cap sync overwrites (capacitor.config.json, etc.)
        execBlocking(
            `bun scripts/prepare-native-config.ts ${tenantId}${stageFlag}`,
            'Patching native projects with tenant config'
        );
    }

    rl.close();

    const label = platform === 'ios' ? 'Opening Xcode' : 'Opening Android Studio';
    const hint = tenantId
        ? `bun run lc native open ${platform} ${tenantId}${
              stageId && stageId !== 'local' ? ` ${stageId}` : ''
          }`
        : `bun run lc native open ${platform}`;

    runCommand(`bunx cap open ${platform}`, label, hint);
};

const nativeRun = async (tenantId?: string, platform?: Platform) => {
    if (!tenantId) {
        tenantId = await pickTenant();
    }

    if (!platform) {
        platform = await pickPlatform();
    }

    const stageFlag = ' --stage local';
    const displayName = getTenantDisplayName(tenantId);

    log.info('');
    log.info(bold(`📱 Native run: ${displayName} → ${platform}`));

    // 1. Populate public/ with tenant config + assets
    execBlocking(
        `bun scripts/prepare-native-config.ts ${tenantId}${stageFlag}`,
        'Preparing tenant config (public/)'
    );

    // 2. Build web app with correct tenant data
    setNativeBuildEnv('local');
    execBlocking('npx vite build', 'Building web app');

    // 3. Copy fresh build/ into native projects
    execBlocking('bunx cap sync', 'Running Capacitor sync');

    // 4. Re-patch native files that cap sync overwrites (capacitor.config.json, etc.)
    execBlocking(
        `bun scripts/prepare-native-config.ts ${tenantId}${stageFlag}`,
        'Patching native projects with tenant config'
    );

    const runFlag = platform === 'android' ? ' --target' : '';

    rl.close();

    runCommand(
        `bunx cap run ${platform}${runFlag}`,
        `Running on ${platform}`,
        `bun run lc native run ${tenantId} ${platform}`
    );
};

const nativeDev = async (tenantId?: string, platform?: Platform) => {
    if (!tenantId) {
        tenantId = await pickTenant();
    }

    if (!platform) {
        platform = await pickPlatform();
    }

    const displayName = getTenantDisplayName(tenantId);
    const lanIp = getLanIp();

    if (!lanIp) {
        log.error('\n❌ Could not detect a LAN IP address.');
        log.error('   Make sure you are connected to a local network (Wi-Fi or Ethernet).');
        rl.close();
        process.exit(1);
    }

    const vitePort = 5173;
    const serverUrl = `http://${lanIp}:${vitePort}`;

    log.info('');
    log.info(bold(`📱 Native live-reload: ${displayName} → ${platform}`));
    log.info(`   LAN IP:     ${cyan(lanIp)}`);
    log.info(`   Server URL:  ${cyan(serverUrl)}`);
    log.info('');

    // Step 1: Patch capacitor.config.ts source with server.url for live-reload
    log.info('');
    log.info(green('▶ Step 1/6 — Patching capacitor.config.ts with live-reload URL'));
    patchCapConfigSource(serverUrl);

    // Step 2: Cap sync (reads from the patched TS source → generates platform JSONs with server.url)
    execBlocking('bunx cap sync', 'Step 2/6 — Capacitor sync (with live-reload URL)');

    // Step 3: Restore the original capacitor.config.ts so git stays clean
    log.info('');
    log.info(green('▶ Step 3/6 — Restoring capacitor.config.ts (git stays clean)'));
    unpatchCapConfigSource();

    // Step 4: Patch native projects with tenant config. This step COPIES the
    // tenant base `capacitor.config.json` over the cap-synced platform JSONs,
    // which drops the live-reload `server` block and restores Capgo
    // `autoUpdate: true`. Step 5 below re-applies both directly.
    execBlocking(
        `bun scripts/prepare-native-config.ts ${tenantId} --stage local`,
        'Step 4/6 — Patching native projects with tenant config'
    );

    // Step 5: Re-apply live-reload patches directly to the platform JSONs
    // (the only thing that survives Step 4's tenant config copy).
    log.info('');
    log.info(green('▶ Step 5/6 — Re-applying live-reload patches to platform JSONs'));
    patchPlatformJsonsForLiveReload(serverUrl);

    // Step 6: Launch Vite + open the IDE
    log.info('');
    log.info(green('🚀 Starting Vite dev server + opening native IDE'));
    log.info('');
    log.info(
        `   The app on your ${
            platform === 'ios' ? 'iOS Simulator / device' : 'Android device'
        } will`
    );
    log.info(`   load from ${bold(serverUrl)} with live-reload.`);
    log.info('');
    log.info(dim('   Press Ctrl+C to stop the Vite dev server.'));
    log.info('');

    rl.close();

    // Open the native IDE in background, then start vite in foreground
    const openCmd = platform === 'ios' ? 'bunx cap open ios' : 'bunx cap open android';

    const child = spawn('sh', ['-c', `${openCmd} & vite --host --port ${vitePort}`], {
        cwd: APP_ROOT,
        stdio: 'inherit',
        env: { ...process.env },
    });

    child.on('exit', code => process.exit(code ?? 0));
};

// ---------------------------------------------------------------------------
// Fastlane build integration
// ---------------------------------------------------------------------------

type FastlaneLane = 'release' | 'beta' | 'upload_to_appetize';

const pickFastlaneLane = async (platform: Platform): Promise<FastlaneLane> => {
    log.info('');
    log.info(bold('Build type:'));
    log.info('');

    if (platform === 'ios') {
        log.info(`  ${cyan('1')}  ${bold('beta')}       ${dim('— build + upload to TestFlight')}`);
        log.info(
            `  ${cyan('2')}  ${bold('release')}    ${dim('— build + submit to App Store review')}`
        );
        log.info(
            `  ${cyan('3')}  ${bold('appetize')}   ${dim(
                '— simulator build + upload to Appetize.io'
            )}`
        );
        log.info('');

        const choice = await ask(`Pick a build type [1-3] ${dim('(default: 1 / beta)')}: `);

        switch (choice) {
            case '2':
                return 'release';
            case '3':
                return 'upload_to_appetize';
            default:
                return 'beta';
        }
    } else {
        log.info(
            `  ${cyan('1')}  ${bold('release')}    ${dim('— build AAB + upload to Play Store')}`
        );
        log.info(
            `  ${cyan('2')}  ${bold('appetize')}   ${dim('— build APK + upload to Appetize.io')}`
        );
        log.info('');

        const choice = await ask(`Pick a build type [1-2] ${dim('(default: 1 / release)')}: `);

        switch (choice) {
            case '2':
                return 'upload_to_appetize';
            default:
                return 'release';
        }
    }
};

const parseLaneArg = (s?: string): FastlaneLane | undefined => {
    if (!s) return undefined;

    const map: Record<string, FastlaneLane> = {
        beta: 'beta',
        release: 'release',
        appetize: 'upload_to_appetize',
        upload_to_appetize: 'upload_to_appetize',
    };

    return map[s.toLowerCase()];
};

const nativeBuild = async (tenantId?: string, platform?: Platform, lane?: FastlaneLane) => {
    if (!existsSync(FASTLANE_ROOT)) {
        log.error(`\n❌ Fastlane directory not found at ${FASTLANE_ROOT}`);
        log.error(dim('   Expected: tools/fastlane/ in the monorepo root'));
        rl.close();
        process.exit(1);
    }

    if (!tenantId) {
        tenantId = await pickTenant();
    }

    if (!platform) {
        platform = await pickPlatform();
    }

    if (!lane) {
        lane = await pickFastlaneLane(platform);
    }

    const displayName = getTenantDisplayName(tenantId);
    const bundleId = getTenantBundleId(tenantId);

    log.info('');
    log.info(bold(`🚀 Fastlane build: ${displayName} → ${platform} ${lane}`));
    log.info(`   Bundle ID: ${cyan(bundleId)}`);

    const stage = lane === 'upload_to_appetize' ? 'alpha' : 'production';

    // Step 1: Populate public/ with tenant config + assets
    execBlocking(
        `bun scripts/prepare-native-config.ts ${tenantId} --stage ${stage}`,
        `Preparing tenant config (${stage})`
    );

    // Step 2: Build web app with correct tenant data
    setNativeBuildEnv(stage);
    execBlocking('npx vite build', 'Building web app');

    // Step 3: Cap sync (copies fresh build/ into native projects)
    execBlocking('bunx cap sync', 'Running Capacitor sync');

    // Step 4: Re-patch native files that cap sync overwrites (capacitor.config.json, etc.)
    execBlocking(
        `bun scripts/prepare-native-config.ts ${tenantId} --stage ${stage}`,
        `Patching native projects with tenant config (${stage})`
    );

    // Step 5: Derive env vars from tenant config (override .env values)
    const xcodeProject = resolve(APP_ROOT, 'ios/App/App.xcodeproj');
    const xcodeWorkspace = resolve(APP_ROOT, 'ios/App/App.xcworkspace');
    const gradleFilePath = resolve(APP_ROOT, 'android/app/build.gradle');
    const gradleProjectDir = resolve(APP_ROOT, 'android');

    const derivedEnv: Record<string, string> = {
        APP_ID: bundleId,
        XCODE_PROJECT: xcodeProject,
        XCODE_WORKSPACE: xcodeWorkspace,
        GRADLE_FILE_PATH: gradleFilePath,
        GRADLE_PROJECT_DIRECTORY: gradleProjectDir,
    };

    // Check for fastlane .env (secrets)
    const fastlaneEnvPath = resolve(FASTLANE_ROOT, 'fastlane/.env');
    const hasEnvFile = existsSync(fastlaneEnvPath);

    log.info('');
    log.info(bold('   Derived from tenant config:'));
    log.info(dim(`     APP_ID=${bundleId}`));
    log.info(dim(`     XCODE_PROJECT=${xcodeProject}`));
    log.info(dim(`     GRADLE_PROJECT_DIRECTORY=${gradleProjectDir}`));

    if (!hasEnvFile) {
        log.info('');
        log.info(yellow('   ⚠️  No .env file found at tools/fastlane/fastlane/.env'));
        log.info(dim('      Fastlane needs secrets (API keys, signing credentials).'));
        log.info(dim('      Create one with the required values, or set env vars manually.'));
    }

    log.info('');

    const laneLabel = lane === 'upload_to_appetize' ? 'appetize' : lane;
    const shortcut = `bun run lc native build ${tenantId} ${platform} ${laneLabel}`;

    log.info(green(`▶ Running: fastlane ${platform} ${lane}`));
    log.info(dim(`  $ cd tools/fastlane && bundle exec fastlane ${platform} ${lane}`));
    log.info('');
    log.info(dim(`  💡 Next time, run: ${cyan(shortcut)}`));
    log.info('');

    rl.close();

    // Spawn fastlane — derived env vars override .env, secrets from .env load normally
    const child = spawn('bundle', ['exec', 'fastlane', platform, lane], {
        cwd: FASTLANE_ROOT,
        stdio: 'inherit',
        env: { ...process.env, ...derivedEnv },
    });

    child.on('exit', code => process.exit(code ?? 0));
};

// ---------------------------------------------------------------------------
// Capgo OTA preview (local build → PR channel)
// ---------------------------------------------------------------------------

const getAppVersion = (): string => {
    try {
        return JSON.parse(readFileSync(join(APP_ROOT, 'package.json'), 'utf-8')).version ?? '0.0.0';
    } catch {
        return '0.0.0';
    }
};

const getShortSha = (): string => {
    try {
        return execSync('git rev-parse --short HEAD', {
            cwd: APP_ROOT,
            stdio: ['ignore', 'pipe', 'ignore'],
        })
            .toString()
            .trim();
    } catch {
        return 'local';
    }
};

/**
 * Best-effort lookup of the PR number for the current branch via the GitHub
 * CLI. Used only to suggest a `pr-<n>` channel name (which surfaces as
 * "Beta #<n>" in the app's Version Info channel switcher). Returns undefined
 * when `gh` isn't installed / authed or the branch has no open PR.
 */
const getPrNumberForBranch = (): string | undefined => {
    try {
        const out = execSync('gh pr view --json number -q .number', {
            cwd: APP_ROOT,
            stdio: ['ignore', 'pipe', 'ignore'],
        })
            .toString()
            .trim();

        return /^\d+$/.test(out) ? out : undefined;
    } catch {
        return undefined;
    }
};

interface CapgoArgs {
    tenant?: string;
    stage?: string;
    channel?: string;
}

/**
 * Flexible arg parse for `lc capgo [tenant] [stage] [channel]`. Order-agnostic:
 *   - a known stage (local / production / <stage>) → stage
 *   - a `pr-*` token → channel (other channel names must be entered interactively)
 *   - anything else → tenant
 */
const parseCapgoArgs = (parts: Array<string | undefined>): CapgoArgs => {
    const result: CapgoArgs = {};

    for (const p of parts) {
        if (!p) continue;

        const stage = asStage(p);

        if (!result.stage && stage) {
            result.stage = stage;
            continue;
        }

        if (!result.channel && (/^pr-/i.test(p) || RESERVED_CHANNEL_RE.test(p))) {
            result.channel = p;
            continue;
        }

        if (!result.tenant) result.tenant = p;
    }

    return result;
};

const RESERVED_CHANNEL_RE = /^\d+\.\d+\.\d+$/;
const VALID_CHANNEL_RE = /^[A-Za-z0-9._-]+$/;

const isReservedChannel = (name: string): boolean =>
    RESERVED_CHANNEL_RE.test(name) || name === 'staging' || name === 'production';

const rejectChannel = (name: string): 'invalid' | 'reserved' | undefined => {
    if (!VALID_CHANNEL_RE.test(name)) return 'invalid';
    if (isReservedChannel(name)) return 'reserved';

    return undefined;
};

const logChannelRejection = (name: string): void => {
    if (!VALID_CHANNEL_RE.test(name)) {
        log.error(red(`❌ Invalid channel name "${name}".`));
        log.error(dim('   Use only letters, numbers, and . _ - (e.g. `pr-123`, `pr-local`).'));
        return;
    }

    log.error(red(`❌ Refusing to target channel "${name}".`));
    log.error(dim('   Semver channels (e.g. 1.0.9) are the live production OTA channels and'));
    log.error(dim('   `staging` is CI-managed — targeting them would replace the bundle real'));
    log.error(dim('   users receive. Use a preview channel like `pr-123` or `pr-local`.'));
};

/**
 * Build the web app locally with a selectable tenant config/stage (defaults to
 * production) and push an OTA bundle to a Capgo channel — without waiting on CI.
 *
 * Naming the channel `pr-<n>` makes it show up as "Beta #<n>" in the app's
 * Version Info → "Switch update channel" picker. `--self-assign` marks the
 * uploaded bundle as the channel default so `CapacitorUpdater.setChannel()`
 * (the in-app switcher) can opt into it.
 *
 * Capgo commands run from the monorepo root with the same paths CI uses
 * (`.github/workflows/capgo-upload.yml`) so delta/dependency calc matches.
 */
const capgoPreview = async (tenantId?: string, stageId?: string, channelArg?: string) => {
    const token = process.env.CAPGO_TOKEN;

    if (!token) {
        log.error(red('\n❌ CAPGO_TOKEN is not set in your environment.'));
        log.error(dim('   The Capgo CLI reads it to authenticate uploads. Export it first:'));
        log.error(dim('     export CAPGO_TOKEN=<your-capgo-api-key>'));
        log.error(
            dim('   Grab a key from the Capgo dashboard (Account → API keys) or the team vault.')
        );
        rl.close();
        process.exit(1);
    }

    if (!tenantId) {
        tenantId = await pickTenant();
    }

    if (!discoverTenants().includes(tenantId)) {
        log.error(red(`\n❌ Unknown tenant "${tenantId}".`));
        log.error(dim(`   Available: ${discoverTenants().join(', ')}`));
        rl.close();
        process.exit(1);
    }

    // Default to production config — the whole point of a local Capgo build is
    // to skip CI's production-branch gating.
    if (!stageId) {
        stageId = await pickStage(tenantId, 'production');
    }

    const appId = getTenantBundleId(tenantId);
    const displayName = getTenantDisplayName(tenantId);

    let channel = channelArg?.trim();

    if (channel && rejectChannel(channel)) {
        log.error('');
        logChannelRejection(channel);
        rl.close();
        process.exit(1);
    }

    if (!channel) {
        const prNumber = getPrNumberForBranch();
        const suggested = prNumber ? `pr-${prNumber}` : 'pr-local';

        log.info('');
        log.info(dim('  Channels named `pr-<number>` show up as "Beta #<number>" in the app\'s'));
        log.info(dim('  Version Info → "Switch update channel" picker.'));
        log.info('');

        while (!channel) {
            const answer = await ask(`Channel name ${dim(`(default: ${suggested})`)}: `);
            const candidate = (answer || suggested).trim();

            if (rejectChannel(candidate)) {
                logChannelRejection(candidate);
                log.info('');
                continue;
            }

            channel = candidate;
        }
    }

    const stageArgs = stageId === 'production' ? [] : ['--stage', stageId];
    const stageLabel = stageId;
    const bundleVersion = `${getAppVersion()}-${channel}.${getShortSha()}`;

    log.info('');
    log.info(bold(`📲 Capgo preview: ${displayName} → channel ${cyan(channel)}`));
    log.info(`   App ID:  ${cyan(appId)}`);
    log.info(`   Config:  ${cyan(`${tenantId} (${stageLabel})`)}`);
    log.info(`   Bundle:  ${cyan(bundleVersion)}`);

    execFileBlocking(
        'bun',
        ['scripts/prepare-native-config.ts', tenantId, ...stageArgs],
        `Step 1/4 — Preparing tenant config (${stageLabel})`
    );

    setNativeBuildEnv(stageId);
    execFileBlocking('npx', ['vite', 'build'], 'Step 2/4 — Building web app');

    log.info('');
    log.info(green('▶ Step 3/4 — Ensuring Capgo channel exists'));
    log.info(dim(`  $ bunx @capgo/cli@latest channel add ${channel} ${appId}`));

    try {
        execFileSync('bunx', ['@capgo/cli@latest', 'channel', 'add', channel, appId], {
            cwd: MONOREPO_ROOT,
            stdio: 'pipe',
            env: { ...process.env, CAPGO_TOKEN: token },
        });
        log.info(`   ${green('✓')} Created channel ${channel}`);
    } catch (err) {
        const e = err as { stdout?: Buffer; stderr?: Buffer };
        const out = `${e.stdout?.toString() ?? ''}${e.stderr?.toString() ?? ''}`;

        if (/already exist|duplicate key value violates unique constraint/i.test(out)) {
            log.info(`   ${green('✓')} Channel ${channel} already exists — continuing.`);
        } else {
            if (out) log.error(out);
            log.error(red('\n❌ Failed to create Capgo channel.'));
            rl.close();
            process.exit(1);
        }
    }

    execFileBlocking(
        'bunx',
        [
            '@capgo/cli@latest',
            'bundle',
            'upload',
            appId,
            '--delta',
            '--path',
            'apps/learn-card-app/build',
            '--channel',
            channel,
            '--bundle',
            bundleVersion,
            '--package-json',
            'apps/learn-card-app/package.json',
            '--node-modules',
            'node_modules',
        ],
        'Step 4/4 — Uploading bundle to Capgo',
        MONOREPO_ROOT
    );

    execFileBlocking(
        'bunx',
        [
            '@capgo/cli@latest',
            'channel',
            'set',
            channel,
            '--bundle',
            bundleVersion,
            '--self-assign',
            appId,
        ],
        'Setting channel default (self-assign)',
        MONOREPO_ROOT
    );

    log.info('');
    log.info(
        green(`✅ Uploaded ${bundleVersion} to channel ${cyan(channel)} (${stageLabel} config)`)
    );
    log.info('');
    log.info(bold('  Try it on a device:'));
    log.info(`  ${dim('1.')} Open the installed ${displayName} app (native build).`);
    log.info(`  ${dim('2.')} Side menu → tap the version line in the footer.`);
    log.info(`  ${dim('3.')} Expand ${bold('Advanced')} → ${bold('Switch update channel…')}`);

    if (/^pr-\d+$/.test(channel)) {
        log.info(`  ${dim('4.')} Pick ${bold(`Beta #${channel.slice(3)}`)} (channel ${channel}).`);
    } else {
        log.info(`  ${dim('4.')} Enter ${bold(channel)} in the custom channel field.`);
    }

    log.info(`  ${dim('5.')} The bundle installs on next app reload.`);
    log.info('');
    log.info(
        yellow('  ⚠️  The device must run a native binary whose defaultChannel is compatible ')
    );
    log.info(yellow('     with this bundle. OTA can only swap JS, not native code.'));
    log.info('');

    rl.close();
};

const nativeMenu = async () => {
    log.info('');
    log.info(bold('📱 Native / Capacitor'));
    log.info('');
    log.info(
        `  ${cyan('1')}  ${bold('Live-reload dev')}   ${dim(
            '— Vite --host + cap sync + open IDE (auto LAN IP)'
        )}`
    );
    log.info(
        `  ${cyan('2')}  ${bold('Sync')}              ${dim('— cap sync + tenant config patching')}`
    );
    log.info(
        `  ${cyan('3')}  ${bold('Open IDE')}           ${dim(
            '— (optional: sync tenant) + open Xcode / Android Studio'
        )}`
    );
    log.info(
        `  ${cyan('4')}  ${bold('Run')}               ${dim(
            '— build + sync + run on device/simulator'
        )}`
    );
    log.info(
        `  ${cyan('5')}  ${bold('Build & Ship')}       ${dim(
            '— sync + fastlane (beta, release, appetize)'
        )}`
    );
    log.info(
        `  ${cyan('6')}  ${bold('Capgo preview')}      ${dim(
            '— local OTA build → PR channel (selectable config)'
        )}`
    );
    log.info('');
    log.info(
        dim(
            '  Or run directly: bun run lc native dev|sync|open|run|build|capgo [tenant] [stage] [ios|android] [beta|release|appetize]'
        )
    );
    log.info('');

    const choice = await ask('Pick an option [1-6]: ');

    switch (choice) {
        case '1':
            await nativeDev();
            break;

        case '2':
            await nativeSync();
            break;

        case '3':
            await nativeOpen();
            break;

        case '4':
            await nativeRun();
            break;

        case '5':
            await nativeBuild();
            break;

        case '6':
            await capgoPreview();
            break;

        default:
            log.info(yellow('Unknown option. Try 1-6.'));
            rl.close();
            break;
    }
};

const handleNativeShortcut = async (args: string[]): Promise<boolean> => {
    const subcommand = args[0];
    const arg1 = args[1];
    const arg2 = args[2];

    const asPlatform = (s?: string): Platform | undefined => {
        if (s === 'ios' || s === 'android') return s;
        return undefined;
    };

    if (!subcommand) {
        // Interactive native menu
        await nativeMenu();
        return true;
    }

    switch (subcommand) {
        case 'dev': {
            // bun run lc native dev [tenant] [ios|android]
            const platform = asPlatform(arg2) ?? asPlatform(arg1);
            const tenant = arg1 && !asPlatform(arg1) ? arg1 : undefined;

            await nativeDev(tenant, platform);
            return true;
        }

        case 'sync': {
            // bun run lc native sync [tenant] [stage]
            const allArgs = [arg1, arg2];

            const stage = allArgs.reduce<string | undefined>(
                (found, a) => found ?? asStage(a),
                undefined
            );

            const tenant = allArgs.find(a => a && !asPlatform(a) && !asStage(a));

            await nativeSync(tenant, stage);
            return true;
        }

        case 'open': {
            // bun run lc native open [ios|android] [tenant] [stage]
            const arg3 = args[3];
            const allArgs = [arg1, arg2, arg3];

            const platform = allArgs.reduce<Platform | undefined>(
                (found, a) => found ?? asPlatform(a),
                undefined
            );

            const stage = allArgs.reduce<string | undefined>(
                (found, a) => found ?? asStage(a),
                undefined
            );

            const tenant = allArgs.find(a => a && !asPlatform(a) && !asStage(a));

            await nativeOpen(platform, tenant, stage);
            return true;
        }

        case 'run': {
            // bun run lc native run [tenant] [ios|android]
            const platform = asPlatform(arg2) ?? asPlatform(arg1);
            const tenant = arg1 && !asPlatform(arg1) ? arg1 : undefined;

            await nativeRun(tenant, platform);
            return true;
        }

        case 'build': {
            // bun run lc native build [tenant] [ios|android] [beta|release|appetize]
            const arg3 = args[3];

            // Parse flexible arg order: tenant, platform, and lane can appear in any position
            const allArgs = [arg1, arg2, arg3];

            const platform = allArgs.reduce<Platform | undefined>(
                (found, a) => found ?? asPlatform(a),
                undefined
            );

            const lane = allArgs.reduce<FastlaneLane | undefined>(
                (found, a) => found ?? parseLaneArg(a),
                undefined
            );

            const tenant = allArgs.find(a => a && !asPlatform(a) && !parseLaneArg(a));

            await nativeBuild(tenant, platform, lane);
            return true;
        }

        case 'capgo': {
            const { tenant, stage, channel } = parseCapgoArgs([arg1, arg2, args[3]]);

            await capgoPreview(tenant, stage, channel);
            return true;
        }

        default:
            return false;
    }
};

// ---------------------------------------------------------------------------
// CLI shortcut handling
// ---------------------------------------------------------------------------

const handleShortcuts = async (): Promise<boolean> => {
    const args = process.argv.slice(2);
    const command = args[0];
    const arg = args[1];
    const arg2 = args[2];

    if (!command) return false;

    switch (command) {
        case 'help':
            printHelp();
            return true;

        case 'editor':
            runCommand('bun scripts/config-editor.ts', 'Config editor');
            return true;

        case 'switch': {
            const switchTenant = arg ?? 'learncard';
            const switchStage = arg2 ?? 'local';
            const switchStageFlag = switchStage === 'production' ? '' : ` --stage ${switchStage}`;

            runCommand(
                `bun scripts/prepare-native-config.ts ${switchTenant}${switchStageFlag}`,
                `Preparing config for ${switchTenant} (${switchStage})`
            );
            return true;
        }

        case 'dev': {
            // bun run lc dev [tenant] [stage] [full|app|services] [fast|no-build] [local-aip]
            const devAllArgs = args.slice(1);

            const devModeArg = devAllArgs.reduce<DevMode | undefined>(
                (found, a) => found ?? asDevMode(a),
                undefined
            );

            const devNoBuildArg = devAllArgs.reduce<boolean | undefined>(
                (found, a) => found ?? asNoBuild(a),
                undefined
            );
            const useLocalAi = devAllArgs.some(isLocalAi);

            const devStageArg = devAllArgs.reduce<string | undefined>((found, a) => {
                if (found !== undefined) return found;
                if (asDevMode(a) || asNoBuild(a) !== undefined || isLocalAi(a)) return undefined;

                return asStage(a);
            }, undefined);

            const devTenantArg = devAllArgs.find(
                a =>
                    a && !asDevMode(a) && !asStage(a) && asNoBuild(a) === undefined && !isLocalAi(a)
            );

            await startDev(devTenantArg, devStageArg, devModeArg, devNoBuildArg, useLocalAi);
            return true;
        }

        case 'sync': {
            // bun run lc sync [tenant] [stage]  — top-level alias for native sync
            const syncAllArgs = [arg, arg2];

            const syncStage = syncAllArgs.reduce<string | undefined>(
                (found, a) => found ?? asStage(a),
                undefined
            );

            const syncTenant = syncAllArgs.find(a => a && !asStage(a));

            await nativeSync(syncTenant, syncStage);
            return true;
        }

        case 'open': {
            // bun run lc open [tenant] [ios|android] [stage]
            const openArg3 = args[3];
            const openAllArgs = [arg, arg2, openArg3];

            const asPlatformLocal = (s?: string): Platform | undefined => {
                if (s === 'ios' || s === 'android') return s;
                return undefined;
            };

            const openPlatform = openAllArgs.reduce<Platform | undefined>(
                (found, a) => found ?? asPlatformLocal(a),
                undefined
            );

            const openStage = openAllArgs.reduce<string | undefined>(
                (found, a) => found ?? asStage(a),
                undefined
            );

            const openTenant = openAllArgs.find(a => a && !asPlatformLocal(a) && !asStage(a));

            await nativeOpen(openPlatform, openTenant, openStage);
            return true;
        }

        case 'start': {
            const tenant = arg ?? 'learncard';
            const stage = arg2 ?? 'local';
            const stageFlag = stage === 'production' ? '' : ` --stage ${stage}`;

            runCommand(
                `bun scripts/prepare-native-config.ts ${tenant}${stageFlag} && vite --host`,
                `Starting ${tenant} (${stage}) — app only`
            );
            return true;
        }

        case 'validate':
            runValidators();
            return true;

        case 'generate': {
            // bun run lc generate <tenant> <logo> [--bg ...] [--name ...] etc.
            // Pass all args directly to generate-tenant-assets.ts
            if (arg) {
                const passthrough = args.slice(1).join(' ');

                runCommand(
                    `bun scripts/generate-tenant-assets.ts ${passthrough}`,
                    `Generating assets for ${arg}`
                );
            } else {
                await generateAssets();
            }

            return true;
        }

        case 'native': {
            // bun run lc native [dev|sync|open|run] [tenant] [ios|android]
            const nativeArgs = args.slice(1);
            const handled = await handleNativeShortcut(nativeArgs);

            if (!handled) {
                log.info(yellow(`Unknown native subcommand: ${nativeArgs[0]}`));
                log.info(dim('  Available: dev, sync, open, run, build, capgo'));
                rl.close();
            }

            return true;
        }

        case 'resolve': {
            // bun run lc resolve [tenant] [stage]
            const resolveTenant = arg ?? 'learncard';
            const resolveStage = arg2;

            const resolveStageFlag = resolveStage ? ` --stage ${resolveStage}` : '';

            runCommand(
                `bun scripts/resolve-tenant-config.ts ${resolveTenant}${resolveStageFlag}`,
                `Resolving final config for ${resolveTenant}${
                    resolveStage ? ` (${resolveStage})` : ''
                }`
            );
            return true;
        }

        case 'create':
            runCommand('bun scripts/create-tenant.ts', 'Create a new tenant');
            return true;

        case 'create-theme':
            runCommand('bun scripts/create-theme.ts', 'Create a new theme');
            return true;

        case 'bump-default-capgo-channel':
        case 'bump-capgo-channel': {
            // bun run lc bump-default-capgo-channel [newChannel]
            const newChannel = arg ? ` ${arg}` : '';

            runCommand(
                `bun scripts/bump-default-capgo-channel.ts${newChannel}`,
                'Bump Capgo defaultChannel in capacitor.config.ts',
                arg
                    ? `bun run lc bump-default-capgo-channel ${arg}`
                    : 'bun run lc bump-default-capgo-channel'
            );
            return true;
        }

        case 'capgo': {
            const { tenant, stage, channel } = parseCapgoArgs([arg, arg2, args[3]]);

            await capgoPreview(tenant, stage, channel);
            return true;
        }

        case 'viewer':
            launchCredentialViewer();
            return true;

        case 'seed': {
            // bun run lc seed app [flags...]
            if (arg === 'app') {
                const passthrough = args.slice(2).join(' ');

                runCommand(
                    `bun scripts/seed-dev-app.ts${passthrough ? ` ${passthrough}` : ''}`,
                    'Seeding app store listing into local database',
                    undefined,
                    BRAIN_SERVICE_ROOT
                );
            } else if (arg) {
                log.info(yellow(`Unknown seed subcommand: ${arg}`));
                log.info(dim('  Available: app'));
                rl.close();
            } else {
                await seedTestData();
            }

            return true;
        }

        case 'tenants':
            log.info('');
            log.info(bold('Available tenants:'));

            for (const t of discoverTenants()) {
                const name = getTenantDisplayName(t);
                const stages = discoverStages(t);
                const domain = (() => {
                    try {
                        return (
                            JSON.parse(
                                readFileSync(join(ENVIRONMENTS_DIR, t, 'config.json'), 'utf-8')
                            ).domain ?? ''
                        );
                    } catch {
                        return '';
                    }
                })();

                const stageList = stages.length > 0 ? dim(` stages: [${stages.join(', ')}]`) : '';

                log.info(
                    `  ${green('•')} ${bold(t)} — ${name}${
                        domain ? dim(` (${domain})`) : ''
                    }${stageList}`
                );
            }

            log.info('');
            log.info(bold('Available themes:'));

            for (const t of discoverThemes()) {
                log.info(`  ${green('•')} ${t}`);
            }

            log.info('');
            rl.close();
            return true;

        default:
            return false;
    }
};

// ---------------------------------------------------------------------------
// Help / cheat sheet
// ---------------------------------------------------------------------------

const printHelp = () => {
    const tenants = discoverTenants();

    log.info('');
    log.info(bold('🃏 LearnCard CLI — Quick Reference'));
    log.info('');
    log.info(bold('  ⚡ Start'));
    log.info('');
    log.info(
        `  ${cyan('bun run lc dev <tenant> [stage] [mode] [fast] [local-aip]')}  ${dim(
            'Web dev server (mode: full|app|services)'
        )}`
    );
    log.info(
        `  ${cyan('bun run lc sync <tenant> [stage]')}              ${dim(
            'Cap sync + tenant config patching'
        )}`
    );
    log.info(
        `  ${cyan('bun run lc open <tenant> [platform]')}           ${dim(
            'Sync tenant + open Xcode / Android Studio'
        )}`
    );
    log.info('');
    log.info(dim('  Examples:'));
    log.info(
        dim('    bun run lc dev vetpass alpha                # prompts for run mode + rebuild')
    );
    log.info(dim('    bun run lc dev vetpass alpha app            # app only, no prompt'));
    log.info(dim('    bun run lc dev vetpass alpha full           # full stack, no prompt'));
    log.info(dim('    bun run lc dev learncard production app local-aip # app + local AI backend'));
    log.info(
        dim('    bun run lc dev vetpass alpha full fast      # full stack, skip docker --build')
    );
    log.info(
        dim('    bun run lc dev vetpass alpha services fast  # services only, skip docker --build')
    );
    log.info(dim('    bun run lc sync vetpass alpha'));
    log.info(dim('    bun run lc open vetpass ios'));
    log.info('');
    log.info(bold('  🛠 Tools'));
    log.info('');
    log.info(
        `  ${cyan('bun run lc viewer')}                     ${dim('Launch the Credential Viewer')}`
    );
    log.info(
        `  ${cyan('bun run lc seed app [flags]')}           ${dim(
            'Seed app store listing into local DB'
        )}`
    );
    log.info(
        `  ${cyan('bun run skill-frameworks seed [stage]')} ${dim('Seed default skill frameworks')}`
    );
    log.info(
        `  ${cyan('bun run skill-frameworks add-admin [stage] [profileId]')} ${dim(
            'Grant framework admin access to an existing profile'
        )}`
    );
    log.info(
        `  ${cyan('bun run lc native')}                     ${dim(
            'Full native menu (dev, run, build)'
        )}`
    );
    log.info(
        `  ${cyan('bun run lc capgo [tenant] [stage] [channel]')} ${dim(
            'Local OTA build → PR/Beta channel (default: prod config)'
        )}`
    );
    log.info('');
    log.info(bold('  🔧 Setup'));
    log.info('');
    log.info(`  ${cyan('bun run lc create')}                     ${dim('Scaffold a new tenant')}`);
    log.info(`  ${cyan('bun run lc create-theme')}               ${dim('Scaffold a new theme')}`);
    log.info(
        `  ${cyan('bun run lc bump-default-capgo-channel')} ${dim(
            'Bump Capgo OTA channel (native compat break)'
        )}`
    );
    log.info(
        `  ${cyan('bun run lc generate <tenant> <logo>')}   ${dim(
            'Generate icons/splash from a logo'
        )}`
    );
    log.info(
        `  ${cyan('bun run lc validate')}                   ${dim(
            'Run all config + theme validators'
        )}`
    );
    log.info(
        `  ${cyan('bun run lc switch <tenant> [stage]')}    ${dim(
            'Prepare config without starting'
        )}`
    );
    log.info(
        `  ${cyan('bun run lc editor')}                     ${dim('Visual config editor on :4400')}`
    );
    log.info(
        `  ${cyan('bun run lc resolve <tenant> [stage]')}   ${dim('Print final merged config')}`
    );
    log.info(`  ${cyan('bun run lc start <tenant> [stage]')}     ${dim('Vite only (no Docker)')}`);
    log.info(
        `  ${cyan('bun run lc tenants')}                    ${dim(
            'List all tenants, stages, and themes'
        )}`
    );
    log.info('');
    log.info(dim(`  Available tenants: ${tenants.join(', ')}`));
    log.info('');

    rl.close();
};

// ---------------------------------------------------------------------------
// Interactive menu
// ---------------------------------------------------------------------------

const configAndScaffoldingMenu = async () => {
    log.info('');
    log.info(bold('  🔧 Config & Scaffolding'));
    log.info('');
    log.info(
        `  ${cyan('a')}  ${bold('Create a new tenant')}     ${dim('— interactive scaffolding')}`
    );
    log.info(
        `  ${cyan('b')}  ${bold('Create a new theme')}      ${dim(
            '— interactive theme scaffolding'
        )}`
    );
    log.info(
        `  ${cyan('c')}  ${bold('Generate tenant assets')}  ${dim(
            '— create icons/splash from a logo'
        )}`
    );
    log.info(
        `  ${cyan('d')}  ${bold('Validate configs')}        ${dim(
            '— run all config + theme validators'
        )}`
    );
    log.info(
        `  ${cyan('e')}  ${bold('Switch tenant config')}    ${dim(
            '— prepare config without starting'
        )}`
    );
    log.info(
        `  ${cyan('f')}  ${bold('Config editor')}           ${dim(
            '— visual config editor on :4400'
        )}`
    );
    log.info(
        `  ${cyan('g')}  ${bold('Resolve config')}          ${dim('— print final merged config')}`
    );
    log.info('');
    log.info(dim('  Press Enter to go back'));
    log.info('');

    const sub = await ask('Pick [a-g]: ');

    switch (sub) {
        case 'a':
            runCommand('bun scripts/create-tenant.ts', 'Create a new tenant', 'bun run lc create');
            break;

        case 'b':
            runCommand(
                'bun scripts/create-theme.ts',
                'Create a new theme',
                'bun run lc create-theme'
            );
            break;

        case 'c':
            await generateAssets();
            break;

        case 'd':
            runValidators();
            break;

        case 'e':
            await pickTenantAndPrepare();
            break;

        case 'f':
            runCommand('bun scripts/config-editor.ts', 'Config editor', 'bun run lc editor');
            break;

        case 'g': {
            const tenant = await pickTenant();
            const stage = await pickStage(tenant);
            const stageFlag = stage === 'local' ? '' : ` --stage ${stage}`;

            runCommand(
                `bun scripts/resolve-tenant-config.ts ${tenant}${stageFlag}`,
                `Resolving final config for ${tenant}${stage !== 'local' ? ` (${stage})` : ''}`,
                `bun run lc resolve ${tenant}${stage !== 'local' ? ` ${stage}` : ''}`
            );
            break;
        }

        default:
            // Enter or unknown — go back to main menu
            await main();
            break;
    }
};

const main = async () => {
    if (await handleShortcuts()) return;

    const tenants = discoverTenants();
    const themes = discoverThemes();

    log.info('');
    log.info(bold('🃏 LearnCard Developer Tools'));
    log.info(
        dim(
            `   ${tenants.length} tenant(s): ${tenants.join(', ')}  •  ${
                themes.length
            } theme(s): ${themes.join(', ')}`
        )
    );
    log.info('');
    log.info(bold('  ⚡ Start'));
    log.info(`  ${cyan('1')}  ${bold('Dev server')}              ${dim('— web dev for a tenant')}`);
    log.info(
        `  ${cyan('2')}  ${bold('Native sync')}             ${dim('— sync + patch tenant config')}`
    );
    log.info(
        `  ${cyan('3')}  ${bold('Open native IDE')}         ${dim('— Xcode / Android Studio')}`
    );
    log.info('');
    log.info(bold('  � Tools'));
    log.info(
        `  ${cyan('4')}  ${bold('Credential Viewer')}       ${dim(
            '— browse & test credential fixtures'
        )}`
    );
    log.info(
        `  ${cyan('5')}  ${bold('Seed test data')}          ${dim(
            '— populate local DB with dev app + profiles'
        )}`
    );
    log.info(
        `  ${cyan('6')}  ${bold('Native menu')}             ${dim(
            '— full Capacitor menu (dev, run, build, ship)'
        )}`
    );
    log.info('');
    log.info(bold('  🔧 Setup'));
    log.info(
        `  ${cyan('7')}  ${bold('Config & scaffolding')}    ${dim(
            '— create, validate, edit, generate...'
        )}`
    );
    log.info('');
    log.info(`  ${cyan('h')}  ${dim('Help & shortcuts')}`);
    log.info('');

    const choice = await ask('Pick an option [1-7, h]: ');

    switch (choice) {
        case '1':
            await startDev();
            break;

        case '2':
            await nativeSync();
            break;

        case '3':
            await nativeOpen();
            break;

        case '4':
            launchCredentialViewer();
            break;

        case '5':
            await seedTestData();
            break;

        case '6':
            await nativeMenu();
            break;

        case '7':
            await configAndScaffoldingMenu();
            break;

        case 'h':
        case 'H':
        case 'help':
            printHelp();
            break;

        default:
            log.info(yellow('Unknown option. Try 1-7 or h.'));
            rl.close();
            break;
    }
};

main().catch(err => {
    log.error('Unexpected error:', err);
    process.exit(1);
});

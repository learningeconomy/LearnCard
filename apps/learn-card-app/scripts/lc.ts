#!/usr/bin/env npx tsx

/**
 * lc.ts — Interactive developer launcher for the LearnCard app.
 *
 * A single entry point for all common dev tasks. Discovers tenants
 * and themes automatically, presents clear options, and runs the
 * right commands. Designed so a developer who just pulled the repo
 * can type `pnpm lc` and be productive immediately.
 *
 * Usage:
 *   pnpm lc              # interactive menu
 *   pnpm lc dev          # shortcut: start with Docker (same as pnpm dev)
 *   pnpm lc dev vetpass  # shortcut: start vetpass tenant with Docker
 *   pnpm lc start        # shortcut: Vite only (no Docker)
 *   pnpm lc validate     # shortcut: run all validators
 *   pnpm lc native       # interactive native/Capacitor menu
 *   pnpm lc native dev vetpass ios   # live-reload on device
 *   pnpm lc native sync vetpass      # prepare + build + cap sync
 *   pnpm lc native open ios          # open Xcode/Android Studio
 */

import { createInterface } from 'readline';
import { readdirSync, existsSync, readFileSync, writeFileSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import { networkInterfaces } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const ENVIRONMENTS_DIR = resolve(APP_ROOT, 'environments');
const THEME_SCHEMAS_DIR = resolve(APP_ROOT, 'src/theme/schemas');

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

const discoverTenants = (): string[] => {
    if (!existsSync(ENVIRONMENTS_DIR)) return [];

    return readdirSync(ENVIRONMENTS_DIR).filter(name => {
        const full = join(ENVIRONMENTS_DIR, name);

        // Must have config.json; skip the legacy "local" directory (now learncard/config.local.json)
        return statSync(full).isDirectory() && existsSync(join(full, 'config.json')) && name !== 'local';
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

const getTenantDisplayName = (tenantId: string): string => {
    try {
        const configPath = join(ENVIRONMENTS_DIR, tenantId, 'config.json');
        const config = JSON.parse(readFileSync(configPath, 'utf-8'));

        return config.branding?.name ?? tenantId;
    } catch {
        return tenantId;
    }
};

const runCommand = (cmd: string, label: string, shortcut?: string): void => {
    console.log('');
    console.log(green(`▶ ${label}`));
    console.log(dim(`  $ ${cmd}`));

    if (shortcut) {
        console.log('');
        console.log(dim(`  💡 Next time, run: ${cyan(shortcut)}`));
    }

    console.log('');

    rl.close();

    const child = spawn('sh', ['-c', cmd], {
        cwd: APP_ROOT,
        stdio: 'inherit',
        env: { ...process.env },
    });

    child.on('exit', code => process.exit(code ?? 0));
};

// ---------------------------------------------------------------------------
// Menu actions
// ---------------------------------------------------------------------------

const pickStage = async (tenantId: string): Promise<string> => {
    const stages = discoverStages(tenantId);

    if (stages.length === 0) {
        return 'local';
    }

    console.log('');
    console.log(bold('Available stages:'));
    console.log('');
    console.log(`  ${cyan('1')}  ${bold('local')} — local dev ${dim('(default)')}`);

    stages.filter(s => s !== 'local').forEach((s, i) => {
        console.log(`  ${cyan(`${i + 2}`)}  ${bold(s)}`);
    });

    console.log(`  ${cyan(`${stages.length + 1}`)}  ${bold('production')} — no stage overlay`);
    console.log('');

    const choice = await ask(`Pick a stage [1-${stages.length + 1}] ${dim('(default: 1 / local)')}: `);

    if (!choice || choice === '1') return 'local';

    const lastIdx = stages.length + 1;

    if (choice === String(lastIdx)) return 'production';

    const allStages = ['local', ...stages.filter(s => s !== 'local')];
    const idx = parseInt(choice, 10) - 1;

    return allStages[idx] ?? 'local';
};

const startDev = async (tenantId?: string, stageId?: string) => {
    const tenants = discoverTenants();

    if (!tenantId) {
        console.log('');
        console.log(bold('Available tenants:'));
        console.log('');

        tenants.forEach((t, i) => {
            const name = getTenantDisplayName(t);
            const stages = discoverStages(t);
            const stageList = stages.length > 0 ? dim(` [${stages.join(', ')}]`) : '';
            const marker = t === 'learncard' ? dim(' (default)') : '';

            console.log(`  ${cyan(`${i + 1}`)}  ${bold(t)} — ${name}${marker}${stageList}`);
        });

        console.log('');

        const choice = await ask(`Pick a tenant [1-${tenants.length}] or name ${dim('(default: learncard)')}: `);

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

    console.log('');
    console.log(bold('How do you want to run?'));
    console.log('');
    console.log(`  ${cyan('1')}  ${bold('Full stack')} — Docker services + Vite dev server ${dim('(pnpm dev)')}`);
    console.log(`  ${cyan('2')}  ${bold('App only')} — Just the Vite dev server ${dim('(assumes services are running)')}`);
    console.log(`  ${cyan('3')}  ${bold('Services only')} — Docker services, no app ${dim('(pnpm dev:services)')}`);
    console.log('');

    const mode = await ask(`Pick a mode [1-3] ${dim('(default: 1)')}: `);

    const stageArg = stageId === 'local' ? '' : ` ${stageId}`;

    switch (mode) {
        case '2':
            runCommand(
                `npx tsx scripts/prepare-native-config.ts ${tenantId}${stageFlag} && vite --host`,
                `Starting ${displayName}${stageLabel} — app only`,
                `pnpm lc start ${tenantId}${stageArg}`,
            );
            break;

        case '3':
            runCommand(
                'docker compose -f compose-local.yaml up --build --scale app=0',
                'Starting Docker services (no app)',
            );
            break;

        case '1':
        default:
            runCommand(
                `TENANT=${tenantId} STAGE=${stageId} docker compose -f compose-local.yaml up --build`,
                `Starting ${displayName}${stageLabel} — full stack`,
                `pnpm lc dev ${tenantId}${stageArg}`,
            );
            break;
    }
};

const pickTenantAndPrepare = async () => {
    const tenants = discoverTenants();

    console.log('');
    console.log(bold('Switch active tenant config:'));
    console.log('');

    tenants.forEach((t, i) => {
        const name = getTenantDisplayName(t);
        const stages = discoverStages(t);
        const stageList = stages.length > 0 ? dim(` [${stages.join(', ')}]`) : '';

        console.log(`  ${cyan(`${i + 1}`)}  ${bold(t)} — ${name}${stageList}`);
    });

    console.log('');

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
        `npx tsx scripts/prepare-native-config.ts ${tenantId}${stageFlag}`,
        `Preparing config for ${getTenantDisplayName(tenantId)} (${tenantId}, ${stageId})`,
        `pnpm lc switch ${tenantId}${stageArg}`,
    );
};

const runValidators = () => {
    runCommand(
        'npx tsx scripts/validate-tenant-configs.ts && npx tsx scripts/validate-theme-schemas.ts',
        'Validating all tenant configs + theme schemas',
        'pnpm lc validate',
    );
};

const generateAssets = async () => {
    const tenants = discoverTenants();

    console.log('');
    console.log(bold('Generate tenant assets from a logo'));
    console.log(dim('  Creates iOS, Android, web, and branding assets.'));
    console.log('');

    // 1. Pick tenant
    tenants.forEach((t, i) => {
        const name = getTenantDisplayName(t);
        const hasAssets = existsSync(join(ENVIRONMENTS_DIR, t, 'assets'));
        const assetLabel = hasAssets ? dim(' (has assets — will overwrite)') : '';

        console.log(`  ${cyan(`${i + 1}`)}  ${bold(t)} — ${name}${assetLabel}`);
    });

    console.log('');

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
        console.log('');
        console.log(bold('This tenant already has assets. How do you want to generate?'));
        console.log('');
        console.log(`  ${cyan('1')}  ${bold('Fill missing')} — only generate assets that don\'t exist yet ${dim('(safe)')}`);
        console.log(`  ${cyan('2')}  ${bold('Full regen')}  — regenerate all assets (overwrites existing) ${dim('(config/ preserved)')}`);
        console.log('');

        const modeChoice = await ask(`Pick a mode [1-2] ${dim('(default: 1 / fill)')}: `);

        fillOnly = modeChoice !== '2';
    }

    // 3. Logo path (primary icon / brand mark)
    console.log('');
    console.log(dim('  Tip: Drag a file from Finder into the terminal to paste its path.'));
    console.log(dim('  The primary logo is the icon/mark — used for app icons, favicon, etc.'));
    console.log(dim('  Recommended: PNG or SVG, at least 1024×1024.'));
    console.log('');

    let logoPath = await ask('Primary icon / brand mark file path: ');

    if (!logoPath) {
        console.log(yellow('  No logo path provided. Aborting.'));
        rl.close();
        return;
    }

    // Strip quotes that drag-and-drop sometimes adds
    logoPath = logoPath.replace(/^["']|["']$/g, '').trim();

    // 3b. Display name
    const configName = getTenantDisplayName(tenantId);
    const nameDefault = configName !== tenantId ? configName : tenantId.charAt(0).toUpperCase() + tenantId.slice(1);

    console.log('');

    const nameInput = await ask(`Display name ${dim(`(default: ${nameDefault})`)}: `);
    const displayName = nameInput || nameDefault;

    // 4. Background color
    console.log('');
    console.log(dim('  Icon & splash background color. Use hex format: #1A3C5E'));

    const bgInput = await ask(`Background color ${dim('(default: #FFFFFF)')}: `);
    const bgHex = bgInput || '#FFFFFF';

    // 5. Splash background color
    const splashInput = await ask(`Splash background color ${dim(`(default: same as bg ${bgHex})`)}: `);
    const splashHex = splashInput || '';

    // 6. Optional: skip splash?
    console.log('');

    const skipSplashInput = await ask(`Skip splash screens? ${dim('(y/N)')}: `);
    const skipSplash = skipSplashInput.toLowerCase() === 'y';

    // 7. Logo variant overrides
    console.log('');
    console.log(bold('Logo variant overrides'));
    console.log(dim('  If you have Figma exports for different logo variants, provide them below.'));
    console.log(dim('  Press Enter to skip any variant — it will be auto-generated.'));
    console.log('');

    // -- Icon for dark backgrounds --
    console.log(dim('  Icon / brand mark — light/white version for dark backgrounds.'));
    console.log(dim('  (e.g. white version of your icon for use on dark/colored surfaces)'));
    const iconLightInput = await ask(`Icon for dark backgrounds ${dim('(Enter to auto-generate)')}: `);

    console.log('');

    // -- Wordmark for dark backgrounds --
    console.log(dim('  Wordmark (text only, no icon) — white/light text for dark backgrounds.'));
    console.log(dim('  (Used on: loading page, intro slides, login page)'));
    const wordmarkInput = await ask(`Wordmark for dark backgrounds ${dim('(Enter to auto-generate)')}: `);

    // -- Wordmark for light backgrounds --
    console.log(dim('  Wordmark (text only, no icon) — dark text for light backgrounds.'));
    console.log(dim('  (Used on: side menu header, AI sessions desktop header)'));
    const wordmarkLightInput = await ask(`Wordmark for light backgrounds ${dim('(Enter to auto-generate)')}: `);

    console.log('');

    // -- Full lockup for light backgrounds --
    console.log(dim('  Full lockup (icon + wordmark combined) — dark logo for light backgrounds.'));
    console.log(dim('  (Used for: og:image, share cards, external embeds)'));
    const fullLogoInput = await ask(`Full lockup for light backgrounds ${dim('(Enter to skip)')}: `);

    // -- Full lockup for dark backgrounds --
    console.log(dim('  Full lockup (icon + wordmark combined) — light logo for dark backgrounds.'));
    console.log(dim('  (Used for: splash screens, share cards on dark surfaces)'));
    const fullLogoDarkInput = await ask(`Full lockup for dark backgrounds ${dim('(Enter to skip)')}: `);

    console.log('');

    // -- Desktop backgrounds --
    console.log(dim('  Desktop login background images (optional overrides).'));
    const desktopBgInput = await ask(`Desktop login BG file ${dim('(Enter to auto-generate)')}: `);
    const desktopBgAltInput = await ask(`Desktop login BG alt file ${dim('(Enter to auto-generate)')}: `);

    // Build command
    let cmd = `npx tsx scripts/generate-tenant-assets.ts ${tenantId} ${JSON.stringify(logoPath)}`;
    let shortcut = `pnpm lc generate ${tenantId} ${JSON.stringify(logoPath)}`;

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
    console.log('');
    console.log(bold('Summary:'));
    console.log(`  Tenant:       ${bold(tenantId)}`);
    console.log(`  Mode:         ${fillOnly ? 'fill missing only' : 'full regeneration'}`);
    console.log(`  Primary icon: ${logoPath}`);
    console.log(`  Name:         ${displayName}`);
    console.log(`  Icon BG:      ${bgHex}`);
    console.log(`  Splash BG:    ${splashHex || bgHex}`);
    console.log(`  Skip splash:  ${skipSplash ? 'yes' : 'no'}`);

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
        console.log('');
        console.log(bold('  Logo variants:'));

        for (const [label, val] of variants) {
            console.log(`    ${label}: ${val}`);
        }
    } else {
        console.log('');
        console.log(dim('  No logo variants provided — all will be auto-generated.'));
    }

    console.log('');

    const confirm = await ask(`Proceed? ${dim('(Y/n)')}: `);

    if (confirm.toLowerCase() === 'n') {
        console.log(dim('  Cancelled.'));
        rl.close();
        return;
    }

    runCommand(
        cmd,
        `Generating assets for ${displayName} (${tenantId})`,
        shortcut,
    );
};

// ---------------------------------------------------------------------------
// Reusable tenant picker (returns tenantId)
// ---------------------------------------------------------------------------

const pickTenant = async (defaultTenant = 'learncard'): Promise<string> => {
    const tenants = discoverTenants();

    console.log('');
    console.log(bold('Available tenants:'));
    console.log('');

    tenants.forEach((t, i) => {
        const name = getTenantDisplayName(t);
        const marker = t === defaultTenant ? dim(' (default)') : '';

        console.log(`  ${cyan(`${i + 1}`)}  ${bold(t)} — ${name}${marker}`);
    });

    console.log('');

    const choice = await ask(`Pick a tenant [1-${tenants.length}] or name ${dim(`(default: ${defaultTenant})`)}: `);

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
    console.log('');
    console.log(bold('Platform:'));
    console.log('');
    console.log(`  ${cyan('1')}  ${bold('ios')}     — Open in Xcode / run on iOS simulator`);
    console.log(`  ${cyan('2')}  ${bold('android')} — Open in Android Studio / run on device`);
    console.log('');

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
    const patched = content.replace(
        /(\n};\s*\nexport default config;)/,
        `\n${serverBlock}};\n\nexport default config;`,
    );

    if (patched === content) {
        console.warn(`   ⚠️  Could not find insertion point in capacitor.config.ts — patching failed`);
        return;
    }

    writeFileSync(CAP_CONFIG_TS, patched, 'utf-8');
    console.log(`   ${green('✓')} Patched capacitor.config.ts → server.url = ${serverUrl}`);
};

const unpatchCapConfigSource = (): void => {
    if (!existsSync(CAP_CONFIG_BACKUP)) {
        console.warn('   ⚠️  No backup found — skipping unpatch');
        return;
    }

    const original = readFileSync(CAP_CONFIG_BACKUP, 'utf-8');

    writeFileSync(CAP_CONFIG_TS, original, 'utf-8');

    // Remove the backup file
    try { execSync(`rm -f "${CAP_CONFIG_BACKUP}"`, { cwd: APP_ROOT }); } catch { /* ignore */ }

    console.log(`   ${green('✓')} Restored capacitor.config.ts from backup`);
};

const execBlocking = (cmd: string, label: string): void => {
    console.log('');
    console.log(green(`▶ ${label}`));
    console.log(dim(`  $ ${cmd}`));
    console.log('');

    try {
        execSync(cmd, { cwd: APP_ROOT, stdio: 'inherit' });
    } catch (err) {
        console.error(`\n❌ Command failed: ${cmd}`);
        throw err;
    }
};

const nativeSync = async (tenantId?: string, stageId?: string) => {
    if (!tenantId) {
        tenantId = await pickTenant();
    }

    if (!stageId) {
        stageId = 'local';
    }

    const stageFlag = stageId === 'production' ? '' : ` --stage ${stageId}`;
    const displayName = getTenantDisplayName(tenantId);

    console.log('');
    console.log(bold(`📱 Native sync: ${displayName} (${tenantId})`));

    execBlocking(
        `npx tsx scripts/prepare-native-config.ts ${tenantId}${stageFlag}`,
        'Preparing tenant config',
    );

    execBlocking(
        'npx cap sync',
        'Running Capacitor sync',
    );

    console.log('');
    console.log(green('✅ Native sync complete.'));
    console.log(dim('   Run `pnpm lc native open ios` or `pnpm lc native open android` to open the IDE.'));
    console.log('');

    rl.close();
};

const nativeOpen = async (platform?: Platform) => {
    if (!platform) {
        platform = await pickPlatform();
    }

    rl.close();

    const label = platform === 'ios' ? 'Opening Xcode' : 'Opening Android Studio';

    runCommand(`npx cap open ${platform}`, label, `pnpm lc native open ${platform}`);
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

    console.log('');
    console.log(bold(`📱 Native run: ${displayName} → ${platform}`));

    execBlocking(
        `npx tsx scripts/prepare-native-config.ts ${tenantId}${stageFlag}`,
        'Preparing tenant config',
    );

    execBlocking('npx cap sync', 'Running Capacitor sync');

    const runFlag = platform === 'android' ? ' --target' : '';

    rl.close();

    runCommand(
        `npx cap run ${platform}${runFlag}`,
        `Running on ${platform}`,
        `pnpm lc native run ${tenantId} ${platform}`,
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
        console.error('\n❌ Could not detect a LAN IP address.');
        console.error('   Make sure you are connected to a local network (Wi-Fi or Ethernet).');
        rl.close();
        process.exit(1);
    }

    const vitePort = 5173;
    const serverUrl = `http://${lanIp}:${vitePort}`;

    console.log('');
    console.log(bold(`📱 Native live-reload: ${displayName} → ${platform}`));
    console.log(`   LAN IP:     ${cyan(lanIp)}`);
    console.log(`   Server URL:  ${cyan(serverUrl)}`);
    console.log('');

    // Step 1: Prepare tenant config
    execBlocking(
        `npx tsx scripts/prepare-native-config.ts ${tenantId} --stage local`,
        'Step 1/4 — Preparing tenant config',
    );

    // Step 2: Patch capacitor.config.ts source with server.url
    console.log('');
    console.log(green('▶ Step 2/4 — Patching capacitor.config.ts with live-reload URL'));
    patchCapConfigSource(serverUrl);

    // Step 3: Cap sync (reads from the patched TS source → generates platform JSONs with server.url)
    execBlocking('npx cap sync', 'Step 3/4 — Capacitor sync (with live-reload URL)');

    // Step 4: Restore the original capacitor.config.ts so git stays clean
    console.log('');
    console.log(green('▶ Step 4/4 — Restoring capacitor.config.ts (git stays clean)'));
    unpatchCapConfigSource();

    // Now launch Vite + open the IDE
    console.log('');
    console.log(green('🚀 Starting Vite dev server + opening native IDE'));
    console.log('');
    console.log(`   The app on your ${platform === 'ios' ? 'iOS Simulator / device' : 'Android device'} will`);
    console.log(`   load from ${bold(serverUrl)} with live-reload.`);
    console.log('');
    console.log(dim('   Press Ctrl+C to stop the Vite dev server.'));
    console.log('');

    rl.close();

    // Open the native IDE in background, then start vite in foreground
    const openCmd = platform === 'ios' ? 'npx cap open ios' : 'npx cap open android';

    const child = spawn('sh', ['-c', `${openCmd} & vite --host --port ${vitePort}`], {
        cwd: APP_ROOT,
        stdio: 'inherit',
        env: { ...process.env },
    });

    child.on('exit', code => process.exit(code ?? 0));
};

const nativeMenu = async () => {
    console.log('');
    console.log(bold('📱 Native / Capacitor'));
    console.log('');
    console.log(`  ${cyan('1')}  ${bold('Live-reload dev')}   ${dim('— Vite --host + cap sync + open IDE (auto LAN IP)')}`);
    console.log(`  ${cyan('2')}  ${bold('Sync')}              ${dim('— prepare config + cap sync (no build)')}`);
    console.log(`  ${cyan('3')}  ${bold('Open IDE')}           ${dim('— open Xcode or Android Studio')}`);
    console.log(`  ${cyan('4')}  ${bold('Run')}               ${dim('— build + sync + run on device/simulator')}`);
    console.log('');
    console.log(dim('  Or run directly: pnpm lc native dev|sync|open|run [tenant] [ios|android]'));
    console.log('');

    const choice = await ask('Pick an option [1-4]: ');

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

        default:
            console.log(yellow('Unknown option. Try 1-4.'));
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
            // pnpm lc native dev [tenant] [ios|android]
            const platform = asPlatform(arg2) ?? asPlatform(arg1);
            const tenant = arg1 && !asPlatform(arg1) ? arg1 : undefined;

            await nativeDev(tenant, platform);
            return true;
        }

        case 'sync': {
            // pnpm lc native sync [tenant]
            await nativeSync(arg1);
            return true;
        }

        case 'open': {
            // pnpm lc native open [ios|android]
            await nativeOpen(asPlatform(arg1));
            return true;
        }

        case 'run': {
            // pnpm lc native run [tenant] [ios|android]
            const platform = asPlatform(arg2) ?? asPlatform(arg1);
            const tenant = arg1 && !asPlatform(arg1) ? arg1 : undefined;

            await nativeRun(tenant, platform);
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
        case 'editor':
            runCommand('npx tsx scripts/config-editor.ts', 'Config editor');
            return true;

        case 'switch': {
            const switchTenant = arg ?? 'learncard';
            const switchStage = arg2 ?? 'local';
            const switchStageFlag = switchStage === 'production' ? '' : ` --stage ${switchStage}`;

            runCommand(
                `npx tsx scripts/prepare-native-config.ts ${switchTenant}${switchStageFlag}`,
                `Preparing config for ${switchTenant} (${switchStage})`,
            );
            return true;
        }

        case 'dev':
            await startDev(arg, arg2);
            return true;

        case 'start': {
            const tenant = arg ?? 'learncard';
            const stage = arg2 ?? 'local';
            const stageFlag = stage === 'production' ? '' : ` --stage ${stage}`;

            runCommand(
                `npx tsx scripts/prepare-native-config.ts ${tenant}${stageFlag} && vite --host`,
                `Starting ${tenant} (${stage}) — app only`,
            );
            return true;
        }

        case 'validate':
            runValidators();
            return true;

        case 'generate': {
            // pnpm lc generate <tenant> <logo> [--bg ...] [--name ...] etc.
            // Pass all args directly to generate-tenant-assets.ts
            if (arg) {
                const passthrough = args.slice(1).join(' ');

                runCommand(
                    `npx tsx scripts/generate-tenant-assets.ts ${passthrough}`,
                    `Generating assets for ${arg}`,
                );
            } else {
                await generateAssets();
            }

            return true;
        }

        case 'native': {
            // pnpm lc native [dev|sync|open|run] [tenant] [ios|android]
            const nativeArgs = args.slice(1);
            const handled = await handleNativeShortcut(nativeArgs);

            if (!handled) {
                console.log(yellow(`Unknown native subcommand: ${nativeArgs[0]}`));
                console.log(dim('  Available: dev, sync, open, run'));
                rl.close();
            }

            return true;
        }

        case 'create':
            runCommand('npx tsx scripts/create-tenant.ts', 'Create a new tenant');
            return true;

        case 'create-theme':
            runCommand('npx tsx scripts/create-theme.ts', 'Create a new theme');
            return true;

        case 'tenants':
            console.log('');
            console.log(bold('Available tenants:'));

            for (const t of discoverTenants()) {
                const name = getTenantDisplayName(t);
                const stages = discoverStages(t);
                const domain = (() => {
                    try {
                        return JSON.parse(readFileSync(join(ENVIRONMENTS_DIR, t, 'config.json'), 'utf-8')).domain ?? '';
                    } catch { return ''; }
                })();

                const stageList = stages.length > 0 ? dim(` stages: [${stages.join(', ')}]`) : '';

                console.log(`  ${green('•')} ${bold(t)} — ${name}${domain ? dim(` (${domain})`) : ''}${stageList}`);
            }

            console.log('');
            console.log(bold('Available themes:'));

            for (const t of discoverThemes()) {
                console.log(`  ${green('•')} ${t}`);
            }

            console.log('');
            rl.close();
            return true;

        default:
            return false;
    }
};

// ---------------------------------------------------------------------------
// Interactive menu
// ---------------------------------------------------------------------------

const main = async () => {
    if (await handleShortcuts()) return;

    const tenants = discoverTenants();
    const themes = discoverThemes();

    console.log('');
    console.log(bold('🃏 LearnCard Developer Tools'));
    console.log(dim(`   ${tenants.length} tenant(s): ${tenants.join(', ')}`));
    console.log(dim(`   ${themes.length} theme(s): ${themes.join(', ')}`));
    console.log('');
    console.log(`  ${cyan('1')}  ${bold('Start dev server')}        ${dim('— pick a tenant + launch mode')}`);
    console.log(`  ${cyan('2')}  ${bold('Switch tenant config')}    ${dim('— prepare config without starting')}`);
    console.log(`  ${cyan('3')}  ${bold('Validate everything')}     ${dim('— run all config + theme validators')}`);
    console.log(`  ${cyan('4')}  ${bold('Create a new tenant')}     ${dim('— interactive scaffolding')}`);
    console.log(`  ${cyan('5')}  ${bold('Open config editor')}      ${dim('— visual config editor on :4400')}`);
    console.log(`  ${cyan('6')}  ${bold('Generate tenant assets')}  ${dim('— create icons/splash from a logo')}`);
    console.log(`  ${cyan('7')}  ${bold('Native / Capacitor')}     ${dim('— sync, open IDE, live-reload on device')}`);
    console.log(`  ${cyan('8')}  ${bold('Create a new theme')}     ${dim('— interactive theme scaffolding')}`);
    console.log('');
    console.log(dim('  Or run directly: pnpm lc dev | start | validate | create | create-theme | switch | editor | generate | native | tenants'));
    console.log('');

    const choice = await ask('Pick an option [1-8]: ');

    switch (choice) {
        case '1':
            await startDev();
            break;

        case '2':
            await pickTenantAndPrepare();
            break;

        case '3':
            runValidators();
            break;

        case '4':
            runCommand('npx tsx scripts/create-tenant.ts', 'Create a new tenant', 'pnpm lc create');
            break;

        case '5':
            runCommand('npx tsx scripts/config-editor.ts', 'Config editor', 'pnpm lc editor');
            break;

        case '6':
            await generateAssets();
            break;

        case '7':
            await nativeMenu();
            break;

        case '8':
            runCommand('npx tsx scripts/create-theme.ts', 'Create a new theme', 'pnpm lc create-theme');
            break;

        default:
            console.log(yellow('Unknown option. Try 1-8.'));
            rl.close();
            break;
    }
};

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});

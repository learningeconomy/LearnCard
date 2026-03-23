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
 */

import { createInterface } from 'readline';
import { readdirSync, existsSync, readFileSync, statSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

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

    // 2. Logo path
    console.log('');
    console.log(dim('  Tip: You can drag a file from Finder into the terminal to paste its path.'));
    console.log(dim('  Recommended: PNG or SVG, at least 1024×1024.'));
    console.log('');

    let logoPath = await ask('Logo file path: ');

    if (!logoPath) {
        console.log(yellow('  No logo path provided. Aborting.'));
        rl.close();
        return;
    }

    // Strip quotes that drag-and-drop sometimes adds
    logoPath = logoPath.replace(/^["']|["']$/g, '').trim();

    // 3. Display name
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

    // 7. Optional overrides
    console.log('');
    console.log(dim('  Optional overrides (press Enter to skip and auto-generate):'));
    console.log('');

    const textLogoInput = await ask(`Text logo file ${dim('(Enter to auto-generate)')}: `);
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

    const cleanPath = (p: string) => p.replace(/^["']|["']$/g, '').trim();

    if (textLogoInput) {
        cmd += ` --text-logo ${JSON.stringify(cleanPath(textLogoInput))}`;
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
    console.log(`  Tenant:     ${bold(tenantId)}`);
    console.log(`  Logo:       ${logoPath}`);
    console.log(`  Name:       ${displayName}`);
    console.log(`  Icon BG:    ${bgHex}`);
    console.log(`  Splash BG:  ${splashHex || bgHex}`);
    console.log(`  Skip splash: ${skipSplash ? 'yes' : 'no'}`);

    if (textLogoInput) console.log(`  Text logo:  ${cleanPath(textLogoInput)}`);
    if (desktopBgInput) console.log(`  Desktop BG: ${cleanPath(desktopBgInput)}`);
    if (desktopBgAltInput) console.log(`  Desktop BG alt: ${cleanPath(desktopBgAltInput)}`);

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

        case 'create':
            runCommand('npx tsx scripts/create-tenant.ts', 'Create a new tenant');
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
    console.log('');
    console.log(dim('  Or run directly: pnpm lc dev | start | validate | create | switch | editor | generate | tenants'));
    console.log('');

    const choice = await ask('Pick an option [1-6]: ');

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

        default:
            console.log(yellow('Unknown option. Try 1-6.'));
            rl.close();
            break;
    }
};

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});

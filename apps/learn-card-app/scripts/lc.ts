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

        return statSync(full).isDirectory() && existsSync(join(full, 'config.json'));
    });
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

const runCommand = (cmd: string, label: string): void => {
    console.log('');
    console.log(green(`▶ ${label}`));
    console.log(dim(`  $ ${cmd}`));
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

const startDev = async (tenantId?: string) => {
    const tenants = discoverTenants();

    if (!tenantId) {
        console.log('');
        console.log(bold('Available tenants:'));
        console.log('');

        tenants.forEach((t, i) => {
            const name = getTenantDisplayName(t);
            const marker = t === 'learncard' ? dim(' (default)') : '';

            console.log(`  ${cyan(`${i + 1}`)}  ${bold(t)} — ${name}${marker}`);
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

    const displayName = getTenantDisplayName(tenantId);

    console.log('');
    console.log(bold('How do you want to run?'));
    console.log('');
    console.log(`  ${cyan('1')}  ${bold('Full stack')} — Docker services + Vite dev server ${dim('(pnpm dev)')}`);
    console.log(`  ${cyan('2')}  ${bold('App only')} — Just the Vite dev server ${dim('(assumes services are running)')}`);
    console.log(`  ${cyan('3')}  ${bold('Services only')} — Docker services, no app ${dim('(pnpm dev:services)')}`);
    console.log('');

    const mode = await ask(`Pick a mode [1-3] ${dim('(default: 1)')}: `);

    switch (mode) {
        case '2':
            runCommand(
                `npx tsx scripts/prepare-native-config.ts ${tenantId} && vite --host`,
                `Starting ${displayName} (${tenantId}) — app only`,
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
            // For full stack, we set TENANT so docker-start:tenant picks it up
            process.env.TENANT = tenantId;

            runCommand(
                `TENANT=${tenantId} docker compose -f compose-local.yaml up --build`,
                `Starting ${displayName} (${tenantId}) — full stack`,
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

        console.log(`  ${cyan(`${i + 1}`)}  ${bold(t)} — ${name}`);
    });

    console.log('');

    const choice = await ask(`Pick a tenant [1-${tenants.length}]: `);

    let tenantId: string;

    if (/^\d+$/.test(choice)) {
        tenantId = tenants[parseInt(choice, 10) - 1] ?? 'learncard';
    } else {
        tenantId = choice || 'learncard';
    }

    runCommand(
        `npx tsx scripts/prepare-native-config.ts ${tenantId}`,
        `Preparing config for ${getTenantDisplayName(tenantId)} (${tenantId})`,
    );
};

const runValidators = () => {
    runCommand(
        'npx tsx scripts/validate-tenant-configs.ts && npx tsx scripts/validate-theme-schemas.ts',
        'Validating all tenant configs + theme schemas',
    );
};

// ---------------------------------------------------------------------------
// CLI shortcut handling
// ---------------------------------------------------------------------------

const handleShortcuts = async (): Promise<boolean> => {
    const [, , command, arg] = process.argv;

    if (!command) return false;

    switch (command) {
        case 'dev':
            await startDev(arg);
            return true;

        case 'start':
            runCommand(
                `npx tsx scripts/prepare-native-config.ts ${arg ?? 'learncard'} && vite --host`,
                `Starting ${arg ?? 'learncard'} — app only`,
            );
            return true;

        case 'validate':
            runValidators();
            return true;

        case 'create':
            runCommand('npx tsx scripts/create-tenant.ts', 'Create a new tenant');
            return true;

        case 'tenants':
            console.log('');
            console.log(bold('Available tenants:'));

            for (const t of discoverTenants()) {
                const name = getTenantDisplayName(t);
                const domain = (() => {
                    try {
                        return JSON.parse(readFileSync(join(ENVIRONMENTS_DIR, t, 'config.json'), 'utf-8')).domain ?? '';
                    } catch { return ''; }
                })();

                console.log(`  ${green('•')} ${bold(t)} — ${name}${domain ? dim(` (${domain})`) : ''}`);
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
    console.log(dim('  Or run directly: pnpm lc dev [tenant] | start [tenant] | validate | create | tenants'));
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
            runCommand('npx tsx scripts/create-tenant.ts', 'Create a new tenant');
            break;

        case '5':
            runCommand('npx tsx scripts/config-editor.ts', 'Config editor');
            break;

        case '6':
            console.log('');
            console.log(dim('Usage: npx tsx scripts/generate-tenant-assets.ts <tenant> <logo-path> --bg "#hex" --name "Name"'));
            console.log('');
            rl.close();
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

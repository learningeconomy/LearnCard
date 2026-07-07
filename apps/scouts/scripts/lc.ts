#!/usr/bin/env bun

import { spawn } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { createInterface } from 'readline';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

import { getLogger } from '../../../packages/learn-card-base/src/logging/logger';

const log = getLogger('lc');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const ENVIRONMENTS_DIR = resolve(APP_ROOT, 'environments');
const LCA_API_ROOT = resolve(APP_ROOT, '../../services/learn-card-network/lca-api');
const SCOUTS_ENV_PATH = resolve(LCA_API_ROOT, '.env.scouts');
const FALLBACK_ENV_PATH = resolve(LCA_API_ROOT, '.env');

/**
 * ScoutPass is single-tenant, so unlike learn-card-app's lc there is no tenant
 * picker — just stages. Stages are discovered from environments/scoutpass:
 * every config.<stage>.json overlay is a stage, plus the implicit 'production'
 * stage which is the base config.json with no overlay. ScoutPass has no staging
 * environment, so this normally yields ['local', 'production'].
 */
const PROJECT_ID = 'scoutpass';

const rl = createInterface({ input: process.stdin, output: process.stdout });

const ask = async (question: string): Promise<string> => {
    return await new Promise(resolveAnswer => {
        rl.question(question, answer => resolveAnswer(answer.trim()));
    });
};

const bold = (value: string): string => `\x1b[1m${value}\x1b[0m`;
const green = (value: string): string => `\x1b[32m${value}\x1b[0m`;
const cyan = (value: string): string => `\x1b[36m${value}\x1b[0m`;
const dim = (value: string): string => `\x1b[2m${value}\x1b[0m`;
const yellow = (value: string): string => `\x1b[33m${value}\x1b[0m`;

const loadEnvFile = (filePath: string): Record<string, string> => {
    if (!existsSync(filePath)) {
        return {};
    }

    const env: Record<string, string> = {};
    const lines = readFileSync(filePath, 'utf-8').split(/\r?\n/);

    for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        const equalsIndex = trimmed.indexOf('=');

        if (equalsIndex === -1) {
            continue;
        }

        const key = trimmed.slice(0, equalsIndex).trim();

        if (!key) {
            continue;
        }

        let value = trimmed.slice(equalsIndex + 1).trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        env[key] = value;
    }

    return env;
};

const loadScoutsEnv = (): Record<string, string> => {
    if (existsSync(SCOUTS_ENV_PATH)) {
        return loadEnvFile(SCOUTS_ENV_PATH);
    }

    return loadEnvFile(FALLBACK_ENV_PATH);
};

const scoutsEnv = loadScoutsEnv();

for (const [key, value] of Object.entries(scoutsEnv)) {
    if (process.env[key] === undefined) {
        process.env[key] = value;
    }
}

const runCommand = (
    cmd: string,
    label: string,
    shortcut?: string,
    cwd: string = APP_ROOT,
    extraEnv?: Record<string, string>
): void => {
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
        cwd,
        stdio: 'inherit',
        env: { ...process.env, ...extraEnv },
    });

    child.on('exit', code => process.exit(code ?? 0));
};

// ---------------------------------------------------------------------------
// Stage / environment resolution
// ---------------------------------------------------------------------------

const discoverStages = (): string[] => {
    const projectDir = join(ENVIRONMENTS_DIR, PROJECT_ID);

    if (!existsSync(projectDir)) return ['production'];

    const overlays = readdirSync(projectDir)
        .filter(f => /^config\..+\.json$/.test(f))
        .map(f => f.replace(/^config\./, '').replace(/\.json$/, ''));

    // 'production' is the base config.json with no overlay applied
    return [...overlays, 'production'];
};

const asStage = (value?: string): string | undefined => {
    if (!value) return undefined;

    return discoverStages().includes(value) ? value : undefined;
};

const deepMerge = (
    base: Record<string, unknown>,
    overlay: Record<string, unknown>
): Record<string, unknown> => {
    const result: Record<string, unknown> = { ...base };

    for (const [key, value] of Object.entries(overlay)) {
        const baseValue = result[key];

        if (
            value &&
            baseValue &&
            typeof value === 'object' &&
            typeof baseValue === 'object' &&
            !Array.isArray(value) &&
            !Array.isArray(baseValue)
        ) {
            result[key] = deepMerge(
                baseValue as Record<string, unknown>,
                value as Record<string, unknown>
            );
        } else {
            result[key] = value;
        }
    }

    return result;
};

const resolveStageConfig = (stage: string): Record<string, any> => {
    const projectDir = join(ENVIRONMENTS_DIR, PROJECT_ID);
    const basePath = join(projectDir, 'config.json');

    if (!existsSync(basePath)) {
        log.error(`Missing base config: ${basePath}`);
        process.exit(1);
    }

    const base = JSON.parse(readFileSync(basePath, 'utf-8'));

    if (stage === 'production') return base;

    const overlayPath = join(projectDir, `config.${stage}.json`);

    if (!existsSync(overlayPath)) return base;

    return deepMerge(base, JSON.parse(readFileSync(overlayPath, 'utf-8')));
};

/**
 * Maps a resolved stage config to the env vars the scouts app consumes.
 * These become vite build defines (see vite.config.ts) and are forwarded
 * into docker compose via ${VAR:-default} substitution in the compose files.
 */
const configToEnv = (config: Record<string, any>): Record<string, string> => {
    const env: Record<string, string> = {};
    const apis = config.apis ?? {};

    if (apis.brainService) env.LCN_URL = apis.brainService;
    if (apis.brainServiceApi) env.LCN_API_URL = apis.brainServiceApi;
    if (apis.cloudService) env.CLOUD_URL = apis.cloudService;
    if (apis.xapi) env.LEARN_CLOUD_XAPI_URL = apis.xapi;
    if (apis.lcaApi) env.API_URL = apis.lcaApi;
    if (config.observability?.sentryEnv) env.SENTRY_ENV = config.observability.sentryEnv;

    return env;
};

const resolveStageEnv = (stage: string): Record<string, string> =>
    configToEnv(resolveStageConfig(stage));

const getEnvFileLabel = (): string => {
    if (existsSync(SCOUTS_ENV_PATH)) {
        return `${SCOUTS_ENV_PATH} (.env.scouts preferred)`;
    }

    return `${FALLBACK_ENV_PATH} (.env fallback)`;
};

const printResolvedStage = (stage?: string): void => {
    const stages = discoverStages();
    const selected = stage ?? 'local';

    if (!stages.includes(selected)) {
        log.info(yellow(`Unknown stage: ${selected}. Available: ${stages.join(', ')}`));
        rl.close();
        return;
    }

    log.info('');
    log.info(bold(`Resolved environment for ${PROJECT_ID} (stage: ${selected})`));
    log.info('');
    log.info(JSON.stringify(resolveStageConfig(selected), null, 4));
    log.info('');
    log.info(bold('Injected env vars:'));
    log.info('');

    for (const [key, value] of Object.entries(resolveStageEnv(selected))) {
        log.info(`  ${cyan(key)}=${value}`);
    }

    log.info('');
    rl.close();
};

const asPlatform = (value?: string): Platform | undefined => {
    if (value === 'ios' || value === 'android') {
        return value;
    }

    return undefined;
};

type DevMode = 'full' | 'app' | 'services';
type Platform = 'ios' | 'android';

const asDevMode = (value?: string): DevMode | undefined => {
    if (!value) {
        return undefined;
    }

    const map: Record<string, DevMode> = {
        full: 'full',
        app: 'app',
        services: 'services',
    };

    return map[value.toLowerCase()];
};

const asNoBuild = (value?: string): boolean | undefined => {
    if (!value) {
        return undefined;
    }

    const normalized = value.toLowerCase();

    if (['fast', 'no-build', 'nobuild'].includes(normalized)) {
        return true;
    }

    if (['build', 'rebuild'].includes(normalized)) {
        return false;
    }

    return undefined;
};

const pickPlatform = async (): Promise<Platform> => {
    log.info('');
    log.info(bold('Platform:'));
    log.info('');
    log.info(`  ${cyan('1')}  ${bold('ios')}     — Open in Xcode / run on iOS simulator`);
    log.info(`  ${cyan('2')}  ${bold('android')} — Open in Android Studio / run on Android device`);
    log.info('');

    const choice = await ask(`Pick a platform [1-2] ${dim('(default: 1 / ios)')}: `);

    return choice === '2' ? 'android' : 'ios';
};

const startAppOnly = (stage?: string): void => {
    const stageId = stage ?? 'local';

    runCommand(
        'bun run docker-start',
        `Starting Scouts app only (env: ${stageId})`,
        'bun run lc start',
        APP_ROOT,
        resolveStageEnv(stageId)
    );
};

const startDev = async (devMode?: DevMode, noBuild?: boolean, stage?: string): Promise<void> => {
    if (!devMode) {
        log.info('');
        log.info(bold('How do you want to run Scouts?'));
        log.info('');
        log.info(
            `  ${cyan('1')}  ${bold('Full stack')} — Docker services + Vite dev server ${dim(
                '(bun run dev)'
            )}`
        );
        log.info(
            `  ${cyan('2')}  ${bold('App only')} — Vite with Scouts runtime env ${dim(
                '(bun run docker-start)'
            )}`
        );
        log.info(
            `  ${cyan('3')}  ${bold('Services only')} — Docker services, no app ${dim(
                '(bun run dev:services)'
            )}`
        );
        log.info('');

        const choice = await ask(`Pick a mode [1-3] ${dim('(default: 1)')}: `);
        devMode = choice === '2' ? 'app' : choice === '3' ? 'services' : 'full';
    }

    const usesDocker = devMode === 'full' || devMode === 'services';

    if (usesDocker && noBuild === undefined) {
        log.info('');
        log.info(dim('  Tip: skip --build to start faster when nothing in Docker has changed.'));
        const buildAnswer = await ask(`Rebuild Docker images? ${dim('(Y/n)')}: `);
        noBuild = buildAnswer.trim().toLowerCase() === 'n';
    }

    // Dev flows default to the local stage — its env matches the docker stack.
    // Pass a stage arg (e.g. `bun run lc dev app production`) to point elsewhere.
    const stageId = stage ?? 'local';
    const stageEnv = resolveStageEnv(stageId);

    if (devMode === 'app') {
        runCommand(
            'bun run docker-start',
            `Starting Scouts app only (env: ${stageId})`,
            'bun run lc dev app',
            APP_ROOT,
            stageEnv
        );
        return;
    }

    if (devMode === 'services') {
        if (noBuild) {
            runCommand(
                'docker compose -f compose-local.yaml up --scale app=0',
                'Starting Scouts Docker services only — skipping rebuild',
                'bun run lc dev services fast',
                APP_ROOT,
                stageEnv
            );
            return;
        }

        runCommand(
            'bun run dev:services',
            'Starting Scouts Docker services only',
            'bun run lc dev services',
            APP_ROOT,
            stageEnv
        );
        return;
    }

    if (noBuild) {
        runCommand(
            'bun run dev-no-build',
            `Starting Scouts full stack (env: ${stageId}) — skipping rebuild`,
            'bun run lc dev fast',
            APP_ROOT,
            stageEnv
        );
        return;
    }

    runCommand(
        'bun run dev',
        `Starting Scouts full stack (env: ${stageId})`,
        'bun run lc dev',
        APP_ROOT,
        stageEnv
    );
};

const nativeSync = (): void => {
    runCommand('bunx cap sync', 'Running Capacitor sync', 'bun run lc native sync');
};

const nativeOpen = async (platform?: Platform): Promise<void> => {
    const selectedPlatform = platform ?? (await pickPlatform());

    runCommand(
        `bunx cap open ${selectedPlatform}`,
        `Opening ${selectedPlatform === 'ios' ? 'Xcode' : 'Android Studio'}`,
        `bun run lc native open ${selectedPlatform}`
    );
};

const nativeRun = async (platform?: Platform): Promise<void> => {
    const selectedPlatform = platform ?? (await pickPlatform());

    runCommand(
        `bunx cap run ${selectedPlatform}`,
        `Running Scouts on ${selectedPlatform}`,
        `bun run lc native run ${selectedPlatform}`
    );
};

const nativePackage = async (platform?: Platform): Promise<void> => {
    const selectedPlatform = platform ?? (await pickPlatform());
    const cmd =
        selectedPlatform === 'ios'
            ? 'bun run build-and-open-ios-app'
            : 'bun run build-and-open-android-app';

    runCommand(
        cmd,
        `Building and opening ${selectedPlatform === 'ios' ? 'iOS' : 'Android'} app`,
        `bun run lc native package ${selectedPlatform}`
    );
};

const nativeMenu = async (): Promise<void> => {
    log.info('');
    log.info(bold('📱 Native / Capacitor'));
    log.info('');
    log.info(`  ${cyan('1')}  ${bold('Sync')}             ${dim('— cap sync')}`);
    log.info(`  ${cyan('2')}  ${bold('Open iOS')}         ${dim('— open Xcode')}`);
    log.info(`  ${cyan('3')}  ${bold('Open Android')}     ${dim('— open Android Studio')}`);
    log.info(`  ${cyan('4')}  ${bold('Run iOS')}          ${dim('— cap run ios')}`);
    log.info(`  ${cyan('5')}  ${bold('Run Android')}      ${dim('— cap run android')}`);
    log.info(`  ${cyan('6')}  ${bold('Package iOS')}      ${dim('— build and open the iOS app')}`);
    log.info(
        `  ${cyan('7')}  ${bold('Package Android')}  ${dim('— build and open the Android app')}`
    );
    log.info('');

    const choice = await ask('Pick an option [1-7]: ');

    switch (choice) {
        case '1':
            nativeSync();
            break;
        case '2':
            await nativeOpen('ios');
            break;
        case '3':
            await nativeOpen('android');
            break;
        case '4':
            await nativeRun('ios');
            break;
        case '5':
            await nativeRun('android');
            break;
        case '6':
            await nativePackage('ios');
            break;
        case '7':
            await nativePackage('android');
            break;
        default:
            log.info(yellow('Unknown option. Try 1-7.'));
            rl.close();
            break;
    }
};

const printHelp = (): void => {
    log.info('');
    log.info(bold('🛡️ Scouts CLI — Quick Reference'));
    log.info('');
    log.info(bold('  ⚡ Start'));
    log.info('');
    log.info(
        `  ${cyan('bun run lc dev [full|app|services] [fast|no-build] [stage]')} ${dim(
            'Interactive dev launcher'
        )}`
    );
    log.info(`  ${cyan('bun run lc start [stage]')}                ${dim('Vite dev server only')}`);
    log.info(`  ${cyan('bun run lc services')}                     ${dim('Docker services only')}`);
    log.info(
        `  ${cyan('bun run lc docker-start [stage]')}         ${dim(
            'Vite dev server with app-specific runtime env'
        )}`
    );
    log.info('');
    log.info(bold('  🌐 Environments'));
    log.info('');
    log.info(
        `  ${cyan('bun run lc resolve [stage]')}              ${dim(
            'Print resolved config + injected env vars'
        )}`
    );
    log.info(
        dim(
            `  Stages are discovered from environments/${PROJECT_ID} (config.<stage>.json + implicit 'production').`
        )
    );
    log.info(
        dim(
            `  Currently available: ${discoverStages().join(
                ', '
            )} — dev commands default to 'local'.`
        )
    );
    log.info(dim(`  LCA API env file: ${getEnvFileLabel()}`));
    log.info('');
    log.info(bold('  📱 Native'));
    log.info('');
    log.info(`  ${cyan('bun run lc native')}                       ${dim('Native menu')}`);
    log.info(`  ${cyan('bun run lc native sync')}                  ${dim('Capacitor sync')}`);
    log.info(`  ${cyan('bun run lc native open [ios|android]')}    ${dim('Open native IDE')}`);
    log.info(
        `  ${cyan('bun run lc native run [ios|android]')}     ${dim('Run on device/simulator')}`
    );
    log.info(
        `  ${cyan('bun run lc native package [ios|android]')} ${dim('Build and open native app')}`
    );
    log.info('');
    log.info(bold('  🛠 Build'));
    log.info('');
    log.info(`  ${cyan('bun run lc build')}                        ${dim('Build the web app')}`);
    log.info(
        `  ${cyan('bun run lc ship [ios|android]')}           ${dim('Build and open a native app')}`
    );
    log.info('');
    log.info(dim('  Available package scripts: apps/scouts/package.json'));
    log.info('');
    rl.close();
};

const handleNativeShortcut = async (args: string[]): Promise<boolean> => {
    const subcommand = args[0];
    const allArgs = args.slice(1);

    if (!subcommand) {
        await nativeMenu();
        return true;
    }

    switch (subcommand) {
        case 'sync':
            nativeSync();
            return true;
        case 'open': {
            await nativeOpen(asPlatform(allArgs[0]));
            return true;
        }
        case 'run': {
            await nativeRun(asPlatform(allArgs[0]));
            return true;
        }
        case 'package': {
            await nativePackage(asPlatform(allArgs[0]));
            return true;
        }
        default:
            return false;
    }
};

const handleShortcuts = async (): Promise<boolean> => {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command) {
        return false;
    }

    switch (command) {
        case 'help':
            printHelp();
            return true;

        case 'start': {
            const stageId = asStage(args[1]) ?? 'local';

            runCommand(
                'bun run start',
                `Starting Scouts app only (env: ${stageId})`,
                'bun run lc start',
                APP_ROOT,
                resolveStageEnv(stageId)
            );
            return true;
        }

        case 'services':
            runCommand(
                'bun run dev:services',
                'Starting Scouts Docker services only',
                'bun run lc services'
            );
            return true;

        case 'docker-start': {
            const stageId = asStage(args[1]) ?? 'local';

            runCommand(
                'bun run docker-start',
                `Starting Scouts Docker-start app (env: ${stageId})`,
                'bun run lc docker-start',
                APP_ROOT,
                resolveStageEnv(stageId)
            );
            return true;
        }

        case 'resolve':
            printResolvedStage(asStage(args[1]) ?? args[1]);
            return true;

        case 'build':
            runCommand('bun run build', 'Building Scouts web app', 'bun run lc build');
            return true;

        case 'ship': {
            const platform = asPlatform(args[1]);
            await nativePackage(platform);
            return true;
        }

        case 'native': {
            const handled = await handleNativeShortcut(args.slice(1));

            if (!handled) {
                log.info(yellow(`Unknown native subcommand: ${args[1] ?? ''}`));
                log.info(dim('  Available: sync, open, run, package'));
                rl.close();
            }

            return true;
        }

        case 'dev': {
            const devArgs = [args[1], args[2], args[3]];

            const devMode = devArgs.reduce<DevMode | undefined>((found, value) => {
                if (found) {
                    return found;
                }

                return asDevMode(value);
            }, undefined);

            const noBuild = devArgs.reduce<boolean | undefined>((found, value) => {
                if (found !== undefined) {
                    return found;
                }

                return asNoBuild(value);
            }, undefined);

            const stage = devArgs.reduce<string | undefined>((found, value) => {
                if (found) {
                    return found;
                }

                return asStage(value);
            }, undefined);

            await startDev(devMode, noBuild, stage);
            return true;
        }

        default:
            return false;
    }
};

const main = async (): Promise<void> => {
    if (await handleShortcuts()) {
        return;
    }

    log.info('');
    log.info(bold('🛡️ Scouts Developer Tools'));
    log.info('');
    log.info(`  ${cyan('1')}  ${bold('Dev server')}        ${dim('— app only')}`);
    log.info(`  ${cyan('2')}  ${bold('Docker dev')}        ${dim('— full stack')}`);
    log.info(`  ${cyan('3')}  ${bold('Docker services')}   ${dim('— backend services only')}`);
    log.info(`  ${cyan('4')}  ${bold('Native menu')}       ${dim('— sync, open, run, package')}`);
    log.info(`  ${cyan('5')}  ${bold('Build web app')}     ${dim('— vite build')}`);
    log.info(`  ${cyan('h')}  ${dim('Help & shortcuts')}`);
    log.info('');

    const choice = await ask('Pick an option [1-5, h]: ');

    switch (choice) {
        case '1':
            startAppOnly();
            break;
        case '2':
            await startDev('full');
            break;
        case '3':
            await startDev('services');
            break;
        case '4':
            await nativeMenu();
            break;
        case '5':
            runCommand('bun run build', 'Building Scouts web app', 'bun run lc build');
            break;
        case 'h':
        case 'H':
        case 'help':
            printHelp();
            break;
        default:
            log.info(yellow('Unknown option. Try 1-5 or h.'));
            rl.close();
            break;
    }
};

main().catch(err => {
    log.error('Unexpected error:', err);
    process.exit(1);
});

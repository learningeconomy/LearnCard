#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const packageName = '@learncard/didkit-plugin-node';
const bindingName = `${packageName}-linux-x64-gnu`;
const registry = 'https://registry.npmjs.org/';

const parseOptions = args => {
    const options = { timeoutMs: 900_000, pollIntervalMs: 15_000 };
    const flags = { '--timeout-ms': 'timeoutMs', '--poll-interval-ms': 'pollIntervalMs' };

    for (let index = 0; index < args.length; index += 2) {
        const key = Object.hasOwn(flags, args[index]) ? flags[args[index]] : undefined;
        const value = args[index + 1];
        if (
            !key ||
            !/^\d+$/.test(value ?? '') ||
            Number(value) < 1 ||
            Number(value) > 2_147_483_647
        ) {
            throw new Error(
                'Usage: node scripts/wait-for-trigger-native-package.mjs ' +
                    '[--timeout-ms <positive milliseconds>] [--poll-interval-ms <positive milliseconds>]'
            );
        }
        options[key] = Number(value);
    }

    return options;
};

const installErrorCode = result => {
    try {
        const code = JSON.parse(result.stdout).error?.code;
        if (typeof code === 'string') return code;
    } catch {
        // Older npm versions report their error code only on stderr.
    }
    return result.stderr?.match(/^npm (?:ERR!|error) code (\S+)\s*$/m)?.[1];
};

const waitForPackage = async ({ timeoutMs, pollIntervalMs }) => {
    if (
        process.platform !== 'linux' ||
        process.arch !== 'x64' ||
        !process.report.getReport().header.glibcVersionRuntime
    ) {
        throw new Error('The Trigger native readiness check requires Linux x64 with glibc.');
    }

    const manifest = JSON.parse(
        readFileSync('packages/plugins/didkit-plugin-node/package.json', 'utf8')
    );
    if (
        manifest.name !== packageName ||
        typeof manifest.version !== 'string' ||
        !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(manifest.version)
    ) {
        throw new Error('The native workspace package must declare an exact package version.');
    }

    const specification = `${packageName}@${manifest.version}`;
    const deadline = performance.now() + timeoutMs;
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'trigger-native-readiness-'));
    const remaining = () => {
        const milliseconds = Math.floor(deadline - performance.now());
        if (milliseconds <= 0)
            throw new Error(`Timed out waiting for ${specification} to be ready.`);
        return milliseconds;
    };

    try {
        // Do not inherit registry overrides, credentials, user npmrc, or Node preload hooks.
        const environment = { PATH: process.env.PATH, HOME: temporaryRoot, TMPDIR: temporaryRoot };
        const userConfig = join(temporaryRoot, 'user.npmrc');
        const globalConfig = join(temporaryRoot, 'global.npmrc');
        writeFileSync(userConfig, '');
        writeFileSync(globalConfig, '');

        const run = (command, args, cwd, maximumMs) => {
            const result = spawnSync(command, args, {
                cwd,
                env: environment,
                encoding: 'utf8',
                timeout: Math.min(remaining(), maximumMs),
                killSignal: 'SIGKILL',
                maxBuffer: 4 * 1024 * 1024,
            });
            if (result.error || result.signal) {
                throw new Error(
                    `${command} could not complete the readiness check: ` +
                        `${result.error?.message ?? result.signal}`
                );
            }
            remaining();
            return result;
        };

        for (let attempt = 1; ; attempt += 1) {
            remaining();
            const installRoot = join(temporaryRoot, 'install');
            mkdirSync(installRoot);
            writeFileSync(join(installRoot, 'package.json'), '{"private":true}');
            console.log(
                `Checking ${specification} and its Linux x64 binding (attempt ${attempt}).`
            );

            const result = run(
                'npm',
                [
                    'install',
                    specification,
                    `${bindingName}@${manifest.version}`,
                    `--registry=${registry}`,
                    `--@learncard:registry=${registry}`,
                    `--userconfig=${userConfig}`,
                    `--globalconfig=${globalConfig}`,
                    `--cache=${join(temporaryRoot, 'cache')}`,
                    '--prefer-online',
                    '--ignore-scripts',
                    '--no-audit',
                    '--no-fund',
                    '--no-package-lock',
                    '--fetch-retries=0',
                    '--json',
                ],
                installRoot,
                120_000
            );

            if (result.status === 0) {
                // A fresh process resolves only the installed public packages, not workspace output.
                const probe = run(
                    process.execPath,
                    [
                        '--input-type=module',
                        '--eval',
                        "import { createRequire } from 'node:module';\n" +
                            "const require = createRequire(process.cwd() + '/package.json');\n" +
                            `require(${JSON.stringify(bindingName)});\n` +
                            `await require(${JSON.stringify(packageName)}).getDidKitPlugin();`,
                    ],
                    installRoot,
                    30_000
                );
                if (probe.status !== 0) {
                    throw new Error(
                        `Native load verification failed for ${specification}:\n${probe.stderr || probe.stdout}`
                    );
                }
                console.log(
                    `${specification} is installable and getDidKitPlugin() loaded successfully.`
                );
                return;
            }

            const code = installErrorCode(result);
            if (code !== 'E404' && code !== 'ETARGET') {
                throw new Error(
                    `npm install failed (${code ?? result.status}) for ${specification}:\n` +
                        (result.stderr || result.stdout)
                );
            }
            console.log(`Publication is not ready (${code}); waiting before retrying.`);
            rmSync(installRoot, { recursive: true, force: true });
            await sleep(Math.min(pollIntervalMs, remaining()));
        }
    } finally {
        rmSync(temporaryRoot, { recursive: true, force: true });
    }
};

try {
    await waitForPackage(parseOptions(process.argv.slice(2)));
} catch (error) {
    console.error(`[trigger-native-readiness] ${error.message}`);
    process.exitCode = 1;
}

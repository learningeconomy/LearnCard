import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import {
    patchSmokeCapacitorConfig,
    type SmokeNativePlatform,
} from '../src/native-smoke/patchSmokeNativeConfig.ts';
import {
    readSmokeResultFiles,
    renderSmokeSummary,
    runSmoke,
    smokeReportFailed,
    type BrowserStackBuild,
    type BrowserStackClient,
    type SmokePlatform,
    type SmokeResultFile,
    BrowserStackRequestError,
} from '../src/native-smoke/maestroSmoke.ts';

const execFileAsync = promisify(execFile);
const API_ROOT = 'https://api-cloud.browserstack.com';

const authHeader = (username: string, accessKey: string): string =>
    `Basic ${Buffer.from(`${username}:${accessKey}`).toString('base64')}`;

const browserStackRequest = async (
    username: string,
    accessKey: string,
    path: string,
    init: RequestInit
): Promise<unknown> => {
    const headers = new Headers(init.headers);
    headers.set('Authorization', authHeader(username, accessKey));
    if (!(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

    const response = await fetch(`${API_ROOT}${path}`, { ...init, headers });
    const text = await response.text();
    if (!response.ok) {
        throw new BrowserStackRequestError(
            response.status,
            `BrowserStack ${init.method ?? 'GET'} ${path} failed (HTTP ${response.status}): ${text.slice(0, 300)}`
        );
    }
    if (!text) return {};
    try {
        return JSON.parse(text) as unknown;
    } catch {
        throw new BrowserStackRequestError(
            response.status,
            `BrowserStack ${path} returned non-JSON: ${text.slice(0, 300)}`
        );
    }
};

const createClient = (
    username: string,
    accessKey: string,
    customId: string
): BrowserStackClient => ({
    uploadApp: async (bytes, filename) => {
        const form = new FormData();
        form.set('file', new Blob([bytes]), filename);
        form.set('custom_id', `${customId}-app`.slice(0, 100));
        const body = (await browserStackRequest(
            username,
            accessKey,
            '/app-automate/maestro/v2/app',
            {
                method: 'POST',
                body: form,
            }
        )) as { app_url?: string };
        if (!body.app_url) throw new Error('BrowserStack app upload did not return app_url');
        return body.app_url;
    },
    uploadSuite: async (bytes, filename) => {
        const form = new FormData();
        form.set('file', new Blob([bytes]), filename);
        form.set('custom_id', `${customId}-suite`.slice(0, 100));
        const body = (await browserStackRequest(
            username,
            accessKey,
            '/app-automate/maestro/v2/test-suite',
            { method: 'POST', body: form }
        )) as { test_suite_url?: string };
        if (!body.test_suite_url) {
            throw new Error('BrowserStack test suite upload did not return test_suite_url');
        }
        return body.test_suite_url;
    },
    startBuild: async (platform, body) => {
        const response = (await browserStackRequest(
            username,
            accessKey,
            `/app-automate/maestro/v2/${platform}/build`,
            { method: 'POST', body: JSON.stringify(body) }
        )) as { build_id?: string };
        if (!response.build_id) throw new Error('BrowserStack did not return build_id');
        return response.build_id;
    },
    getBuild: async buildId => {
        const body = await browserStackRequest(
            username,
            accessKey,
            `/app-automate/maestro/v2/builds/${buildId}`,
            { method: 'GET' }
        );
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
            throw new Error('BrowserStack build status was not an object');
        }
        return body as BrowserStackBuild;
    },
    stopBuild: async buildId => {
        await browserStackRequest(
            username,
            accessKey,
            `/app-automate/maestro/builds/${buildId}/stop`,
            { method: 'POST', body: '{}' }
        );
    },
});

const zipFlow = async (flowPath: string): Promise<Uint8Array> => {
    if (basename(flowPath) !== 'smoke-signin-wallet.yaml') {
        throw new Error('The Maestro flow must be named smoke-signin-wallet.yaml');
    }
    const root = await mkdtemp(join(tmpdir(), 'lc-maestro-'));
    try {
        const parent = join(root, 'LearnCardSmoke');
        await mkdir(parent, { recursive: true });
        await copyFile(flowPath, join(parent, 'smoke-signin-wallet.yaml'));
        const zipPath = join(root, 'suite.zip');
        await execFileAsync('zip', ['-r', zipPath, 'LearnCardSmoke'], { cwd: root });
        return new Uint8Array(await readFile(zipPath));
    } finally {
        await rm(root, { recursive: true, force: true });
    }
};

const requireEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set`);
    return value;
};

const parseRuns = (value: string): number => {
    const runs = Number(value);
    if (!Number.isInteger(runs) || runs < 1 || runs > 10) {
        throw new Error('SMOKE_RUNS must be an integer from 1 to 10');
    }
    return runs;
};

const parsePlatform = (value: string): SmokePlatform => {
    if (value === 'android' || value === 'ios') return value;
    throw new Error('SMOKE_PLATFORM must be android or ios');
};

const writeSummary = async (markdown: string): Promise<void> => {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryPath) return;
    await writeFile(summaryPath, `${markdown}\n`, { flag: 'a' });
};

const run = async (): Promise<void> => {
    const outPath = process.env.SMOKE_OUT;
    const platformValue = process.env.SMOKE_PLATFORM;
    const deviceValue = process.env.SMOKE_DEVICE ?? 'unknown';
    let result: SmokeResultFile;
    try {
        const platform = parsePlatform(requireEnv('SMOKE_PLATFORM'));
        const device = requireEnv('SMOKE_DEVICE');
        const runs = parseRuns(process.env.SMOKE_RUNS ?? '1');
        const appPath = requireEnv('SMOKE_APP');
        const flowPath = requireEnv('SMOKE_FLOW');
        if (!outPath) throw new Error('SMOKE_OUT is not set');
        const username = requireEnv('BROWSERSTACK_USERNAME');
        const accessKey = requireEnv('BROWSERSTACK_ACCESS_KEY');

        result = {
            platform,
            device,
            runs: await runSmoke(
                {
                    platform,
                    device,
                    runs,
                    appBytes: new Uint8Array(await readFile(appPath)),
                    appFilename: basename(appPath),
                    suiteBytes: await zipFlow(flowPath),
                    suiteFilename: 'LearnCardSmoke.zip',
                    sha: process.env.GITHUB_SHA ?? 'local',
                },
                createClient(
                    username,
                    accessKey,
                    `lc-smoke-${platform}-${process.env.GITHUB_RUN_ID ?? 'local'}`
                ),
                { log: line => console.log(line) }
            ),
        };
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        const platform = platformValue === 'ios' ? 'ios' : 'android';
        console.error(detail);
        result = {
            platform,
            device: deviceValue,
            runs: [
                {
                    platform,
                    device: deviceValue,
                    run: 1,
                    status: 'error',
                    durationSeconds: null,
                    buildId: null,
                    sessionId: null,
                    sessionUrl: null,
                    detail,
                },
            ],
        };
    }

    if (!outPath) throw new Error('SMOKE_OUT is not set');
    await writeFile(outPath, `${JSON.stringify(result, null, 2)}\n`);
    const markdown = renderSmokeSummary([result], []);
    console.log(markdown);
    await writeSummary(markdown);
    if (smokeReportFailed([result], [])) process.exitCode = 1;
};

const summarize = async (root: string): Promise<void> => {
    const { readdir } = await import('node:fs/promises');
    const files: unknown[] = [];
    const visit = async (directory: string): Promise<void> => {
        let entries;
        try {
            entries = await readdir(directory, { withFileTypes: true });
        } catch {
            return;
        }
        for (const entry of entries) {
            const path = join(directory, entry.name);
            if (entry.isDirectory()) await visit(path);
            else if (entry.isFile() && entry.name.endsWith('.json')) {
                files.push(JSON.parse(await readFile(path, 'utf8')));
            }
        }
    };
    await visit(root);

    const parsed = readSmokeResultFiles(files);
    const markdown = renderSmokeSummary(parsed);
    console.log(markdown);
    await writeSummary(markdown);
    if (smokeReportFailed(parsed)) process.exitCode = 1;
};

const patchNativeConfigs = async (): Promise<void> => {
    const { existsSync, readFileSync, writeFileSync } = await import('node:fs');
    const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const targets: Array<{ platform: SmokeNativePlatform; path: string }> = [
        { platform: 'ios', path: resolve(appRoot, 'ios/App/App/capacitor.config.json') },
        {
            platform: 'android',
            path: resolve(appRoot, 'android/app/src/main/assets/capacitor.config.json'),
        },
    ];

    let patched = 0;
    for (const target of targets) {
        if (!existsSync(target.path)) continue;
        const raw = JSON.parse(readFileSync(target.path, 'utf8')) as Record<string, unknown>;
        const next = patchSmokeCapacitorConfig(raw, target.platform);
        writeFileSync(target.path, `${JSON.stringify(next, null, 2)}\n`);
        patched += 1;
        console.log(`patched ${target.path}`);
    }
    if (patched === 0) {
        throw new Error(
            'No capacitor.config.json files found. Run cap sync and prepare-native-config first.'
        );
    }
};

const command = process.argv[2];
if (command === 'summarize') {
    await summarize(process.argv[3] ?? 'smoke-results');
} else if (command === 'patch-native-config') {
    await patchNativeConfigs();
} else if (command === 'run' || command === undefined) {
    await run();
} else {
    throw new Error(`Unknown command ${command}`);
}

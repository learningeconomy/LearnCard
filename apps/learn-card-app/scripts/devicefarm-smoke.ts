import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';

import {
    createMaestroZip,
    curlUploadArgs,
    deviceFarmAwsArgs,
    DEVICE_FARM_REGION,
    parseAndroidFrameworks,
    parseArtifacts,
    parseDevices,
    parseJobs,
    parseRun,
    parseSmokeRuns,
    resolveProjectArn,
    runAndroidFrameworks,
    runIosXcuiOnDeviceFarm,
    summarizeDeviceFarm,
    unscheduledIosResult,
    type DeviceFarmArtifactQuery,
    type DeviceFarmClient,
    type DeviceFarmScheduleRequest,
} from '../src/native-smoke/deviceFarmSmoke';
import { patchSmokeCapacitorConfig } from '../src/native-smoke/patchSmokeNativeConfig';
import type { SmokeResultFile } from '../src/native-smoke/smokeResult';

const execFileAsync = promisify(execFile);

const requireEnv = (name: string): string => {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set`);
    return value;
};

const writeSummary = async (markdown: string): Promise<void> => {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (!summaryPath) return;
    await writeFile(summaryPath, `${markdown}\n`, { flag: 'a' });
};

const redactUrl = (text: string, url: string): string =>
    text.split(url).join('[redacted-upload-url]');

const execAws = async (args: readonly string[]): Promise<unknown> => {
    const { stdout } = await execFileAsync('aws', deviceFarmAwsArgs(args), {
        maxBuffer: 64 * 1024 * 1024,
    });
    const text = stdout.trim();
    if (!text) return {};
    return JSON.parse(text) as unknown;
};

const listAll = async (args: readonly string[], key: string): Promise<unknown[]> => {
    const items: unknown[] = [];
    let nextToken: string | undefined;
    do {
        const pageArgs = nextToken ? [...args, '--next-token', nextToken] : [...args];
        const body = await execAws(pageArgs);
        if (!body || typeof body !== 'object') break;
        const page = (body as Record<string, unknown>)[key];
        if (Array.isArray(page)) items.push(...page);
        const token = (body as { nextToken?: unknown }).nextToken;
        nextToken = typeof token === 'string' && token ? token : undefined;
    } while (nextToken);
    return items;
};

const createAwsClient = (projectArn: string): DeviceFarmClient => ({
    listDevices: async () => parseDevices({ devices: await listAll(['list-devices'], 'devices') }),
    createUpload: async input => {
        const body = await execAws([
            'create-upload',
            '--project-arn',
            projectArn,
            '--name',
            input.name,
            '--type',
            input.type,
        ]);
        const upload =
            body && typeof body === 'object'
                ? (body as { upload?: { arn?: unknown; url?: unknown } }).upload
                : undefined;
        if (!upload || typeof upload.arn !== 'string' || typeof upload.url !== 'string') {
            throw new Error(
                `Device Farm create-upload did not return an ARN and URL for ${input.name}`
            );
        }
        return { arn: upload.arn, url: upload.url };
    },
    putBytes: async (url, bytes) => {
        const directory = await mkdtemp(join(tmpdir(), 'lc-df-upload-'));
        const filePath = join(directory, 'payload');
        try {
            await writeFile(filePath, bytes);
            await execFileAsync('curl', curlUploadArgs(filePath, url));
        } catch (error) {
            const err = error as { message?: string; stderr?: unknown };
            const stderr = typeof err.stderr === 'string' ? err.stderr : '';
            throw new Error(
                redactUrl(`${err.message ?? 'upload failed'}\n${stderr}`, url).slice(0, 500),
                { cause: error }
            );
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    },
    getUpload: async arn => {
        const body = await execAws(['get-upload', '--arn', arn]);
        const upload =
            body && typeof body === 'object'
                ? (body as { upload?: { status?: unknown; metadata?: unknown } }).upload
                : undefined;
        return {
            status: typeof upload?.status === 'string' ? upload.status : '',
            message: typeof upload?.metadata === 'string' ? upload.metadata : undefined,
        };
    },
    createDevicePool: async input => {
        const body = await execAws([
            'create-device-pool',
            '--project-arn',
            projectArn,
            '--name',
            input.name,
            '--rules',
            JSON.stringify(input.rules),
        ]);
        const pool =
            body && typeof body === 'object'
                ? (body as { devicePool?: { arn?: unknown } }).devicePool
                : undefined;
        if (!pool || typeof pool.arn !== 'string') {
            throw new Error('Device Farm create-device-pool did not return an ARN');
        }
        return pool.arn;
    },
    deleteDevicePool: async arn => {
        await execAws(['delete-device-pool', '--arn', arn]);
    },
    devicePoolExists: async arn => {
        try {
            await execAws(['get-device-pool', '--arn', arn]);
            return true;
        } catch (error) {
            if (error instanceof Error && /\(NotFoundException\)/.test(error.message)) return false;
            throw error;
        }
    },
    scheduleRun: async (input: DeviceFarmScheduleRequest) => {
        const directory = await mkdtemp(join(tmpdir(), 'lc-df-schedule-'));
        const filePath = join(directory, 'schedule.json');
        try {
            await writeFile(filePath, JSON.stringify(input));
            const body = await execAws(['schedule-run', '--cli-input-json', `file://${filePath}`]);
            const run =
                body && typeof body === 'object'
                    ? (body as { run?: { arn?: unknown } }).run
                    : undefined;
            if (!run || typeof run.arn !== 'string') {
                throw new Error('Device Farm schedule-run did not return a run ARN');
            }
            return run.arn;
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    },
    getRun: async arn => parseRun(await execAws(['get-run', '--arn', arn])),
    listJobs: async runArn =>
        parseJobs({ jobs: await listAll(['list-jobs', '--arn', runArn], 'jobs') }),
    listArtifacts: async (arn, type: DeviceFarmArtifactQuery) =>
        parseArtifacts({
            artifacts: await listAll(['list-artifacts', '--arn', arn, '--type', type], 'artifacts'),
        }),
    stopRun: async arn => {
        await execAws(['stop-run', '--arn', arn]);
    },
});

const readJsonTree = async (root: string): Promise<unknown[]> => {
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
                files.push(JSON.parse(await readFile(path, 'utf8')) as unknown);
            }
        }
    };
    await visit(root);
    return files;
};

const run = async (): Promise<void> => {
    const outPath = process.env.SMOKE_OUT;
    const device = 'unscheduled';
    let result: SmokeResultFile;
    try {
        if (!outPath) throw new Error('SMOKE_OUT is not set');
        const platform = requireEnv('SMOKE_PLATFORM');
        const project = resolveProjectArn(process.env.DEVICEFARM_PROJECT_ARN);
        console.log(
            `Device Farm project ${project.projectId} (${project.source}, ${DEVICE_FARM_REGION})`
        );
        const runs = parseSmokeRuns(process.env.SMOKE_RUNS ?? '1');
        const sha = process.env.GITHUB_SHA ?? 'local';
        const runId = process.env.GITHUB_RUN_ID
            ? `${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT ?? '1'}`
            : randomUUID();
        const client = createAwsClient(project.arn);
        const log = { log: (line: string) => console.log(line) };
        if (platform === 'android') {
            const frameworks = parseAndroidFrameworks(process.env.SMOKE_ANDROID_FRAMEWORK);
            const appPath = requireEnv('SMOKE_APP');
            const wantsMaestro = frameworks.includes('maestro');
            const wantsEspresso = frameworks.includes('espresso');
            result = await runAndroidFrameworks(
                {
                    projectArn: project.arn,
                    runs,
                    frameworks,
                    appBytes: new Uint8Array(await readFile(appPath)),
                    appFilename: appPath.split('/').pop() ?? 'learncard-smoke.apk',
                    suiteBytes: wantsMaestro
                        ? await createMaestroZip(requireEnv('SMOKE_FLOW'))
                        : undefined,
                    specBytes: wantsMaestro
                        ? new Uint8Array(await readFile(requireEnv('SMOKE_SPEC')))
                        : undefined,
                    testBytes: wantsEspresso
                        ? new Uint8Array(await readFile(requireEnv('SMOKE_TEST_APK')))
                        : undefined,
                    testFilename: process.env.SMOKE_TEST_APK?.split('/').pop(),
                    sha,
                    runId,
                },
                client,
                log
            );
        } else if (platform === 'ios') {
            const ipaPath = requireEnv('SMOKE_APP');
            const testPath = requireEnv('SMOKE_TEST_PACKAGE');
            result = await runIosXcuiOnDeviceFarm(
                {
                    projectArn: project.arn,
                    runs,
                    ipaBytes: new Uint8Array(await readFile(ipaPath)),
                    ipaFilename: ipaPath.split('/').pop() ?? 'LearnCard-smoke.ipa',
                    testBytes: new Uint8Array(await readFile(testPath)),
                    testFilename: testPath.split('/').pop() ?? 'AppUITests.zip',
                    sha,
                    runId,
                },
                client,
                log
            );
        } else {
            throw new Error('SMOKE_PLATFORM must be android or ios');
        }
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        console.error(detail);
        const failedPlatform = process.env.SMOKE_PLATFORM === 'ios' ? 'ios' : 'android';
        result = {
            platform: failedPlatform,
            device,
            runs: [
                {
                    platform: failedPlatform,
                    device,
                    run: 1,
                    status: 'error',
                    durationSeconds: null,
                    buildId: null,
                    sessionId: null,
                    sessionUrl: null,
                    videoUrl: null,
                    detail,
                },
            ],
        };
    }

    if (!outPath) throw new Error('SMOKE_OUT is not set');
    await writeFile(outPath, `${JSON.stringify(result, null, 2)}\n`);
    const { markdown, failed } = summarizeDeviceFarm([result], [result.platform]);
    console.log(markdown);
    await writeSummary(markdown);
    if (failed) process.exitCode = 1;
};

const summarize = async (root: string): Promise<void> => {
    const { markdown, failed } = summarizeDeviceFarm(await readJsonTree(root));
    console.log(markdown);
    await writeSummary(markdown);
    if (failed) process.exitCode = 1;
};

const writeUnscheduledIos = async (): Promise<void> => {
    const outPath = requireEnv('SMOKE_OUT');
    const result = unscheduledIosResult();
    await writeFile(outPath, `${JSON.stringify(result, null, 2)}\n`);
    const markdown = `## Native smoke — AWS Device Farm\n\n${result.note}`;
    console.log(markdown);
    await writeSummary(markdown);
};

const saveVideos = async (): Promise<void> => {
    const outPath = requireEnv('SMOKE_OUT');
    const directory = requireEnv('SMOKE_VIDEO_DIR');
    const { existsSync } = await import('node:fs');
    if (!existsSync(outPath)) {
        console.log(`no smoke results at ${outPath}`);
        return;
    }
    const result = JSON.parse(await readFile(outPath, 'utf8')) as SmokeResultFile;
    await mkdir(directory, { recursive: true });
    for (const sample of result.runs) {
        if (!sample.videoUrl) {
            console.log(`no video artifact for run ${sample.run}`);
            continue;
        }
        try {
            const response = await fetch(sample.videoUrl);
            if (!response.ok) {
                console.log(
                    `video download failed for run ${sample.run} (HTTP ${response.status})`
                );
                continue;
            }
            const slug = sample.device.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
            const destination = join(directory, `${result.platform}-run-${sample.run}-${slug}.mp4`);
            await writeFile(destination, Buffer.from(await response.arrayBuffer()));
            console.log(`saved ${destination}`);
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            console.log(`video download failed for run ${sample.run}: ${detail}`);
        }
    }
};

const patchNativeConfig = async (platform: string | undefined): Promise<void> => {
    if (platform !== 'android' && platform !== 'ios') {
        throw new Error('Usage: devicefarm-smoke.ts patch-native-config <android|ios>');
    }
    const configPath = fileURLToPath(
        new URL(
            platform === 'ios'
                ? '../ios/App/App/capacitor.config.json'
                : '../android/app/src/main/assets/capacitor.config.json',
            import.meta.url
        )
    );
    const config = JSON.parse(await readFile(configPath, 'utf8')) as Record<string, unknown>;
    await writeFile(
        configPath,
        `${JSON.stringify(patchSmokeCapacitorConfig(config, platform), null, 2)}\n`
    );
};

const command = process.argv[2];
if (command === 'summarize') {
    await summarize(process.argv[3] ?? 'smoke-results');
} else if (command === 'write-unscheduled-ios') {
    await writeUnscheduledIos();
} else if (command === 'patch-native-config') {
    await patchNativeConfig(process.argv[3]);
} else if (command === 'videos') {
    await saveVideos();
} else if (command === 'run' || command === undefined) {
    await run();
} else {
    throw new Error(`Unknown command ${command}`);
}

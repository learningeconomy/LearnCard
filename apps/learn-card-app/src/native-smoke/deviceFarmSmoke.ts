import { execFile } from 'node:child_process';
import { copyFile, mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { promisify } from 'node:util';

import {
    readSmokeResultFiles,
    renderSmokeSummary,
    smokeReportFailed,
    type DevicePoolCleanup,
    type SmokeDeviceRun,
    type SmokePlatform,
    type SmokeResultFile,
    type SmokeRunStatus,
} from './smokeResult';

const execFileAsync = promisify(execFile);

/** LC-2362 spike project. Used only when DEVICEFARM_PROJECT_ARN is empty. */
export const FALLBACK_PROJECT_ARN =
    'arn:aws:devicefarm:us-west-2:206533012615:project:3ba5ae8a-11df-4f36-8059-3cc624d239f0';

export const DEVICE_FARM_REGION = 'us-west-2';

export const DEVICE_FARM_JOB_TIMEOUT_MINUTES = 20;

export const MAESTRO_FLOW_NAME = 'smoke-signin-wallet.yaml';

export const MAESTRO_ARCHIVE_ENTRY = `.maestro/${MAESTRO_FLOW_NAME}`;

export const UNSCHEDULED_IOS_NOTE =
    'IPA built with the development match profile. No Device Farm run: Maestro does not drive these physical iPhones, and there is no XCUITest bundle to upload.';

const PROJECT_ARN =
    /^arn:aws:devicefarm:([a-z0-9-]+):\d{12}:project:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const DEVICE_ARN = /^arn:aws:devicefarm:us-west-2:(?:\d{12})?:device:[A-Za-z0-9_-]+$/;

const ARTIFACT_QUERIES = ['FILE', 'LOG', 'SCREENSHOT'] as const;

export type DeviceFarmArtifactQuery = (typeof ARTIFACT_QUERIES)[number];

export type DeviceFarmDevice = {
    arn: string;
    name?: string;
    manufacturer?: string;
    model?: string;
    formFactor?: string;
    platform?: string;
    os?: string;
    availability?: string;
    fleetType?: string;
};

export type DevicePoolRule = {
    attribute: string;
    operator: string;
    value: string;
};

export type DeviceFarmRun = {
    arn: string;
    status?: string;
    result?: string;
    started?: string;
    stopped?: string;
    deviceMinutes?: number | null;
};

export type DeviceFarmJob = {
    arn: string;
    name?: string;
    result?: string;
};

export type DeviceFarmArtifact = {
    arn?: string;
    name?: string;
    type?: string;
    url?: string;
};

export type DeviceFarmUploadType =
    | 'ANDROID_APP'
    | 'IOS_APP'
    | 'APPIUM_NODE_TEST_PACKAGE'
    | 'APPIUM_NODE_TEST_SPEC'
    | 'INSTRUMENTATION_TEST_PACKAGE'
    | 'XCTEST_UI_TEST_PACKAGE';

export type DeviceFarmTest = {
    type: 'APPIUM_NODE' | 'INSTRUMENTATION' | 'XCTEST_UI';
    testPackageArn: string;
    testSpecArn?: string;
    filter?: string;
};

export type DeviceFarmClient = {
    listDevices: () => Promise<DeviceFarmDevice[]>;
    createUpload: (input: {
        name: string;
        type: DeviceFarmUploadType;
    }) => Promise<{ arn: string; url: string }>;
    putBytes: (url: string, bytes: Uint8Array) => Promise<void>;
    getUpload: (arn: string) => Promise<{ status: string; message?: string }>;
    createDevicePool: (input: { name: string; rules: DevicePoolRule[] }) => Promise<string>;
    deleteDevicePool: (arn: string) => Promise<void>;
    devicePoolExists: (arn: string) => Promise<boolean>;
    scheduleRun: (input: DeviceFarmScheduleRequest) => Promise<string>;
    getRun: (arn: string) => Promise<DeviceFarmRun>;
    listJobs: (runArn: string) => Promise<DeviceFarmJob[]>;
    listArtifacts: (arn: string, type: DeviceFarmArtifactQuery) => Promise<DeviceFarmArtifact[]>;
    stopRun: (arn: string) => Promise<void>;
};

export type DeviceFarmScheduleRequest = {
    projectArn: string;
    appArn: string;
    devicePoolArn: string;
    name: string;
    test: DeviceFarmTest;
    executionConfiguration: {
        jobTimeoutMinutes: number;
        videoCapture: true;
    };
};

export type UnscheduledIosResult = {
    platform: 'ios';
    device: 'not scheduled';
    scheduled: false;
    note: string;
    runs: [];
};

type Clock = {
    pollIntervalMs?: number;
    uploadTimeoutMs?: number;
    runTimeoutMs?: number;
    sleep?: (ms: number) => Promise<void>;
    now?: () => number;
    log?: (line: string) => void;
};

const stringField = (value: unknown): string | undefined =>
    typeof value === 'string' && value.length > 0 ? value : undefined;

const osMajor = (os: string | undefined): number | null => {
    const match = /^(\d+)/.exec((os ?? '').trim());
    return match ? Number(match[1]) : null;
};

const osRank = (os: string | undefined): number => {
    const match = /^(\d+)(?:\.(\d+))?/.exec((os ?? '').trim());
    if (!match) return -1;
    return Number(match[1]) * 100 + Number(match[2] ?? '0');
};

const availabilityRank = (value: string | undefined): number => {
    if (value === 'HIGHLY_AVAILABLE') return 0;
    if (value === 'AVAILABLE') return 1;
    if (value === 'BUSY') return 2;
    return 3;
};

export const resolveProjectArn = (
    value: string | undefined
): { arn: string; source: 'variable' | 'fallback'; projectId: string } => {
    const trimmed = value?.trim() ?? '';
    const arn = trimmed || FALLBACK_PROJECT_ARN;
    const match = PROJECT_ARN.exec(arn);
    if (!match) throw new Error('DEVICEFARM_PROJECT_ARN is not a Device Farm project ARN');
    if (match[1] !== DEVICE_FARM_REGION) {
        throw new Error('Device Farm project must be in us-west-2');
    }
    return {
        arn,
        source: trimmed ? 'variable' : 'fallback',
        projectId: arn.split(':project:')[1] ?? '',
    };
};

export const parseSmokeRuns = (value: string): number => {
    const runs = Number(value);
    if (!Number.isInteger(runs) || runs < 1 || runs > 10) {
        throw new Error('SMOKE_RUNS must be an integer from 1 to 10');
    }
    return runs;
};

export const deviceFarmAwsArgs = (args: readonly string[]): string[] => [
    'devicefarm',
    ...args,
    '--region',
    DEVICE_FARM_REGION,
    '--output',
    'json',
];

export const curlUploadArgs = (filePath: string, url: string): string[] => [
    '--fail',
    '--silent',
    '--show-error',
    '--retry',
    '2',
    '--upload-file',
    filePath,
    url,
];

export const isDeviceArn = (arn: string): boolean => DEVICE_ARN.test(arn);

export const parseDevices = (body: unknown): DeviceFarmDevice[] => {
    if (!body || typeof body !== 'object') return [];
    const devices = (body as { devices?: unknown }).devices;
    if (!Array.isArray(devices)) return [];
    return devices.flatMap(device => {
        if (!device || typeof device !== 'object') return [];
        const record = device as Record<string, unknown>;
        if (typeof record.arn !== 'string' || !isDeviceArn(record.arn)) return [];
        return [
            {
                arn: record.arn,
                name: stringField(record.name),
                manufacturer: stringField(record.manufacturer),
                model: stringField(record.model),
                formFactor: stringField(record.formFactor),
                platform: stringField(record.platform),
                os: stringField(record.os),
                availability: stringField(record.availability),
                fleetType: stringField(record.fleetType),
            },
        ];
    });
};

export const deviceLabel = (device: DeviceFarmDevice): string => {
    const name = device.name || device.model || 'device';
    const platform = device.platform === 'IOS' ? 'iOS' : 'Android';
    return `${name} (${platform} ${device.os || 'unknown'})`;
};

const matchesPlatform = (device: DeviceFarmDevice, platform: 'android' | 'ios'): boolean => {
    if (device.formFactor && device.formFactor !== 'PHONE') return false;
    if (device.fleetType && device.fleetType !== 'PUBLIC') return false;
    if (device.availability === 'TEMPORARY_NOT_AVAILABLE') return false;
    const major = osMajor(device.os);
    if (platform === 'android') {
        if (device.platform !== 'ANDROID') return false;
        if (major === null || major < 14 || major > 15) return false;
        const maker =
            `${device.manufacturer ?? ''} ${device.name ?? ''} ${device.model ?? ''}`.toLowerCase();
        return (
            maker.includes('samsung') ||
            maker.includes('google') ||
            maker.includes('pixel') ||
            maker.includes('galaxy')
        );
    }
    if (device.platform !== 'IOS') return false;
    if (major === null || major < 17 || major > 18) return false;
    const name = `${device.name ?? ''} ${device.model ?? ''}`.toLowerCase();
    return name.includes('iphone');
};

export const selectSmokeDevice = (
    devices: DeviceFarmDevice[],
    platform: 'android' | 'ios'
): DeviceFarmDevice => {
    const candidates = devices.filter(device => matchesPlatform(device, platform));
    if (candidates.length === 0) {
        const wanted =
            platform === 'android'
                ? 'a public Galaxy or Pixel phone on Android 14 or 15'
                : 'a public iPhone on iOS 17 or 18';
        throw new Error(
            `No Device Farm device matched ${wanted}. Listed ${devices.length} devices.`
        );
    }
    candidates.sort((left, right) => {
        const availability =
            availabilityRank(left.availability) - availabilityRank(right.availability);
        if (availability !== 0) return availability;
        const os = osRank(right.os) - osRank(left.os);
        if (os !== 0) return os;
        return (right.name ?? '').localeCompare(left.name ?? '');
    });
    const chosen = candidates[0];
    if (!chosen) throw new Error('No Device Farm device matched');
    return chosen;
};

export const devicePoolRuleForArn = (deviceArn: string): DevicePoolRule => {
    if (!isDeviceArn(deviceArn)) throw new Error('Refusing to pin a device pool to an invalid ARN');
    return {
        attribute: 'ARN',
        operator: 'IN',
        value: JSON.stringify([deviceArn]),
    };
};

export const scheduleRunInput = (input: {
    projectArn: string;
    appArn: string;
    devicePoolArn: string;
    testPackageArn: string;
    testSpecArn: string;
    name: string;
}): DeviceFarmScheduleRequest => ({
    projectArn: input.projectArn,
    appArn: input.appArn,
    devicePoolArn: input.devicePoolArn,
    name: input.name,
    test: {
        type: 'APPIUM_NODE',
        testPackageArn: input.testPackageArn,
        testSpecArn: input.testSpecArn,
    },
    executionConfiguration: {
        jobTimeoutMinutes: DEVICE_FARM_JOB_TIMEOUT_MINUTES,
        videoCapture: true,
    },
});

export const scheduleInstrumentationInput = (input: {
    projectArn: string;
    appArn: string;
    devicePoolArn: string;
    testPackageArn: string;
    name: string;
}): DeviceFarmScheduleRequest => ({
    projectArn: input.projectArn,
    appArn: input.appArn,
    devicePoolArn: input.devicePoolArn,
    name: input.name,
    test: {
        type: 'INSTRUMENTATION',
        testPackageArn: input.testPackageArn,
        filter: 'com.learncard.app.SmokeSignInWalletTest',
    },
    executionConfiguration: {
        jobTimeoutMinutes: DEVICE_FARM_JOB_TIMEOUT_MINUTES,
        videoCapture: true,
    },
});

export const scheduleXctestInput = (input: {
    projectArn: string;
    appArn: string;
    devicePoolArn: string;
    testPackageArn: string;
    name: string;
}): DeviceFarmScheduleRequest => ({
    projectArn: input.projectArn,
    appArn: input.appArn,
    devicePoolArn: input.devicePoolArn,
    name: input.name,
    test: {
        type: 'XCTEST_UI',
        testPackageArn: input.testPackageArn,
    },
    executionConfiguration: {
        jobTimeoutMinutes: DEVICE_FARM_JOB_TIMEOUT_MINUTES,
        videoCapture: true,
    },
});

export type AndroidFramework = 'maestro' | 'espresso';

export const parseAndroidFrameworks = (value: string | undefined): AndroidFramework[] => {
    const choice = (value ?? 'espresso').trim();
    if (choice === 'maestro') return ['maestro'];
    if (choice === 'espresso') return ['espresso'];
    if (choice === 'both') return ['maestro', 'espresso'];
    throw new Error('SMOKE_ANDROID_FRAMEWORK must be maestro, espresso, or both');
};

export const deviceFarmConsoleUrl = (arn: string): string | null => {
    const job = /:job:([0-9a-f-]+)\/([0-9a-f-]+)\/([0-9a-f-]+)$/i.exec(arn);
    if (job) {
        return `https://${DEVICE_FARM_REGION}.console.aws.amazon.com/devicefarm/home?region=${DEVICE_FARM_REGION}#/projects/${job[1]}/runs/${job[2]}/jobs/${job[3]}`;
    }
    const run = /:run:([0-9a-f-]+)\/([0-9a-f-]+)$/i.exec(arn);
    if (!run) return null;
    return `https://${DEVICE_FARM_REGION}.console.aws.amazon.com/devicefarm/home?region=${DEVICE_FARM_REGION}#/projects/${run[1]}/runs/${run[2]}`;
};

export const videoArtifactUrl = (artifacts: DeviceFarmArtifact[]): string | null => {
    const video = artifacts.find(artifact => artifact.type === 'VIDEO' && artifact.url);
    return video?.url ?? null;
};

export const runDurationSeconds = (run: DeviceFarmRun): number | null => {
    if (run.started && run.stopped) {
        const ms = Date.parse(run.stopped) - Date.parse(run.started);
        if (Number.isFinite(ms) && ms >= 0) return Math.round(ms / 1000);
    }
    if (typeof run.deviceMinutes === 'number' && Number.isFinite(run.deviceMinutes)) {
        return Math.round(run.deviceMinutes * 60);
    }
    return null;
};

const runStatus = (result: string): SmokeRunStatus => {
    if (result === 'PASSED') return 'passed';
    if (result === 'ERRORED') return 'error';
    if (result === 'STOPPED') return 'timed_out';
    return 'failed';
};

export const interpretDeviceFarmRun = (
    run: DeviceFarmRun,
    jobs: DeviceFarmJob[],
    artifacts: DeviceFarmArtifact[],
    context: { platform?: SmokePlatform; device: string; run: number; framework?: string }
): SmokeDeviceRun | null => {
    if ((run.status ?? '').toUpperCase() !== 'COMPLETED') return null;
    const result = (run.result ?? '').toUpperCase();
    const status = runStatus(result);
    const job = jobs.find(candidate => candidate.arn) ?? jobs[0];
    const named = job?.name || context.device;
    return {
        platform: context.platform ?? 'android',
        device: context.framework ? `${named} (${context.framework})` : named,
        run: context.run,
        status,
        durationSeconds: runDurationSeconds(run),
        buildId: run.arn,
        sessionId: job?.arn ?? null,
        sessionUrl: deviceFarmConsoleUrl(job?.arn ?? run.arn),
        videoUrl: videoArtifactUrl(artifacts),
        detail: status === 'passed' ? null : `Device Farm result: ${run.result ?? 'unknown'}`,
    };
};

export const parseRun = (body: unknown): DeviceFarmRun => {
    const run =
        body && typeof body === 'object' && 'run' in body ? (body as { run?: unknown }).run : body;
    if (!run || typeof run !== 'object') throw new Error('Device Farm run was not an object');
    const record = run as Record<string, unknown>;
    if (typeof record.arn !== 'string') throw new Error('Device Farm run had no ARN');
    const minutes = record.deviceMinutes;
    const total =
        minutes && typeof minutes === 'object' ? (minutes as { total?: unknown }).total : undefined;
    return {
        arn: record.arn,
        status: stringField(record.status),
        result: stringField(record.result),
        started: stringField(record.started),
        stopped: stringField(record.stopped),
        deviceMinutes: typeof total === 'number' ? total : null,
    };
};

export const parseJobs = (body: unknown): DeviceFarmJob[] => {
    if (!body || typeof body !== 'object') return [];
    const jobs = (body as { jobs?: unknown }).jobs;
    if (!Array.isArray(jobs)) return [];
    return jobs.flatMap(job => {
        if (!job || typeof job !== 'object') return [];
        const record = job as Record<string, unknown>;
        if (typeof record.arn !== 'string') return [];
        const device = record.device;
        const deviceName =
            device && typeof device === 'object'
                ? stringField((device as { name?: unknown }).name)
                : undefined;
        return [
            {
                arn: record.arn,
                name: deviceName ?? stringField(record.name),
                result: stringField(record.result),
            },
        ];
    });
};

export const parseArtifacts = (body: unknown): DeviceFarmArtifact[] => {
    if (!body || typeof body !== 'object') return [];
    const artifacts = (body as { artifacts?: unknown }).artifacts;
    if (!Array.isArray(artifacts)) return [];
    return artifacts.flatMap(artifact => {
        if (!artifact || typeof artifact !== 'object') return [];
        const record = artifact as Record<string, unknown>;
        return [
            {
                arn: stringField(record.arn),
                name: stringField(record.name),
                type: stringField(record.type),
                url: stringField(record.url),
            },
        ];
    });
};

const errorRun = (
    platform: SmokePlatform,
    device: string,
    run: number,
    detail: string
): SmokeDeviceRun => ({
    platform,
    device,
    run,
    status: 'error',
    durationSeconds: null,
    buildId: null,
    sessionId: null,
    sessionUrl: null,
    videoUrl: null,
    detail,
});

const shortToken = (value: string, fallback: string): string =>
    (value.replace(/[^0-9a-z-]/gi, '') || fallback).slice(0, 32);

const waitUntil = async (
    timeoutMs: number,
    pollIntervalMs: number,
    now: () => number,
    sleep: (ms: number) => Promise<void>,
    poll: () => Promise<boolean>
): Promise<boolean> => {
    const started = now();
    while (now() - started < timeoutMs) {
        if (await poll()) return true;
        await sleep(pollIntervalMs);
    }
    return false;
};

const confirmPoolCleanup = async (
    client: DeviceFarmClient,
    poolArn: string,
    { now, sleep, log }: Required<Pick<Clock, 'now' | 'sleep' | 'log'>>
): Promise<DevicePoolCleanup> => {
    try {
        await client.deleteDevicePool(poolArn);
        const deleted = await waitUntil(30_000, 2_000, now, sleep, async () => {
            return !(await client.devicePoolExists(poolArn));
        });
        if (!deleted) throw new Error('Device Farm still reports the pool after deletion');
        log(`device pool deletion confirmed ${poolArn}`);
        return { status: 'deleted', poolArn };
    } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        log(`device pool cleanup failed for ${poolArn}: ${detail}`);
        return { status: 'failed', poolArn, detail };
    }
};

export const runAndroidOnDeviceFarm = async (
    request: {
        projectArn: string;
        runs: number;
        appBytes: Uint8Array;
        appFilename: string;
        suiteBytes: Uint8Array;
        suiteFilename: string;
        specBytes: Uint8Array;
        specFilename: string;
        sha: string;
        runId: string;
    },
    client: DeviceFarmClient,
    options?: Clock
): Promise<SmokeResultFile> => {
    const pollIntervalMs = options?.pollIntervalMs ?? 15_000;
    const uploadTimeoutMs = options?.uploadTimeoutMs ?? 10 * 60 * 1000;
    const runTimeoutMs = options?.runTimeoutMs ?? (DEVICE_FARM_JOB_TIMEOUT_MINUTES + 2) * 60 * 1000;
    const sleep = options?.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
    const now = options?.now ?? (() => Date.now());
    const log = options?.log ?? (() => undefined);
    const sha = shortToken(request.sha, 'local');
    const runId = shortToken(request.runId, 'local');

    if (!request.appFilename.endsWith('.apk')) {
        throw new Error('Device Farm Android app must be an .apk');
    }

    const device = selectSmokeDevice(await client.listDevices(), 'android');
    const label = deviceLabel(device);
    log(`selected ${label} ${device.arn}`);

    const uploadOne = async (
        name: string,
        type: DeviceFarmUploadType,
        bytes: Uint8Array
    ): Promise<string> => {
        const created = await client.createUpload({ name, type });
        await client.putBytes(created.url, bytes);
        const ready = await waitUntil(uploadTimeoutMs, pollIntervalMs, now, sleep, async () => {
            const upload = await client.getUpload(created.arn);
            const status = upload.status.toUpperCase();
            log(`upload ${name} ${status || 'pending'}`);
            if (status === 'SUCCEEDED') return true;
            if (status === 'FAILED') {
                throw new Error(
                    `Device Farm upload ${name} failed${upload.message ? `: ${upload.message.slice(0, 300)}` : ''}`
                );
            }
            return false;
        });
        if (!ready) throw new Error(`Timed out waiting for Device Farm upload ${name}`);
        return created.arn;
    };

    const appArn = await uploadOne(`learncard-smoke-${sha}.apk`, 'ANDROID_APP', request.appBytes);
    const testPackageArn = await uploadOne(
        `learncard-smoke-${sha}-maestro.zip`,
        'APPIUM_NODE_TEST_PACKAGE',
        request.suiteBytes
    );
    const testSpecArn = await uploadOne(
        `learncard-smoke-${sha}-testspec.yml`,
        'APPIUM_NODE_TEST_SPEC',
        request.specBytes
    );

    const poolArn = await client.createDevicePool({
        name: `lc-smoke-${runId}`.slice(0, 256),
        rules: [devicePoolRuleForArn(device.arn)],
    });

    log(`created temporary device pool ${poolArn}`);
    const result: SmokeResultFile = { platform: 'android', device: label, runs: [] };
    const { runs } = result;
    try {
        for (let run = 1; run <= request.runs; run += 1) {
            const started = now();
            const context = { device: label, run };
            try {
                const runArn = await client.scheduleRun(
                    scheduleRunInput({
                        projectArn: request.projectArn,
                        appArn,
                        devicePoolArn: poolArn,
                        testPackageArn,
                        testSpecArn,
                        name: `lc-smoke-run-${run}-${sha}`.slice(0, 256),
                    })
                );
                log(`scheduled ${runArn}`);
                const readCompletedRun = async (): Promise<SmokeDeviceRun | null> => {
                    const current = await client.getRun(runArn);
                    log(
                        `android run ${run} ${current.status ?? 'unknown'} ${current.result ?? ''}`
                    );
                    if ((current.status ?? '').toUpperCase() !== 'COMPLETED') return null;
                    const jobs = await client.listJobs(runArn).catch(() => []);
                    const artifacts: DeviceFarmArtifact[] = [];
                    for (const job of jobs) {
                        for (const type of ARTIFACT_QUERIES) {
                            const page = await client.listArtifacts(job.arn, type).catch(() => []);
                            artifacts.push(...page);
                        }
                    }
                    return interpretDeviceFarmRun(current, jobs, artifacts, context);
                };
                let interpreted: SmokeDeviceRun | null = null;
                const deadline = started + runTimeoutMs;
                while (now() < deadline) {
                    interpreted = await readCompletedRun();
                    if (interpreted) break;
                    await sleep(pollIntervalMs);
                }
                if (!interpreted) {
                    await client.stopRun(runArn).catch(() => undefined);
                    runs.push({
                        ...errorRun('android', label, run, 'Timed out waiting for Device Farm'),
                        status: 'timed_out',
                        durationSeconds: Math.max(0, Math.round((now() - started) / 1000)),
                        buildId: runArn,
                        sessionUrl: deviceFarmConsoleUrl(runArn),
                    });
                    continue;
                }
                const withDuration =
                    interpreted.durationSeconds === null
                        ? {
                              ...interpreted,
                              durationSeconds: Math.max(0, Math.round((now() - started) / 1000)),
                          }
                        : interpreted;
                runs.push(withDuration);
            } catch (error) {
                const detail = error instanceof Error ? error.message : String(error);
                log(`android run ${run} error: ${detail}`);
                runs.push(errorRun('android', label, run, detail));
            }
        }
    } finally {
        result.cleanup = await confirmPoolCleanup(client, poolArn, { now, sleep, log });
    }
    return result;
};

type PlannedUpload = {
    key: string;
    name: string;
    type: DeviceFarmUploadType;
    bytes: Uint8Array;
};

type PlannedSession = {
    framework: string;
    uploads: PlannedUpload[];
    test: (uploaded: Record<string, string>) => DeviceFarmTest;
};

export const runDeviceFarmPlan = async (
    request: {
        platform: SmokePlatform;
        projectArn: string;
        runs: number;
        sha: string;
        runId: string;
        sessions: PlannedSession[];
    },
    client: DeviceFarmClient,
    options?: Clock
): Promise<SmokeResultFile> => {
    const pollIntervalMs = options?.pollIntervalMs ?? 15_000;
    const uploadTimeoutMs = options?.uploadTimeoutMs ?? 10 * 60 * 1000;
    const runTimeoutMs = options?.runTimeoutMs ?? (DEVICE_FARM_JOB_TIMEOUT_MINUTES + 2) * 60 * 1000;
    const sleep = options?.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
    const now = options?.now ?? (() => Date.now());
    const log = options?.log ?? (() => undefined);
    const sha = shortToken(request.sha, 'local');
    const runId = shortToken(request.runId, 'local');
    const device = selectSmokeDevice(
        await client.listDevices(),
        request.platform === 'ios' ? 'ios' : 'android'
    );
    const label = deviceLabel(device);
    log(`selected ${label} ${device.arn}`);

    const uploadOne = async (upload: PlannedUpload): Promise<string> => {
        const created = await client.createUpload({ name: upload.name, type: upload.type });
        await client.putBytes(created.url, upload.bytes);
        const ready = await waitUntil(uploadTimeoutMs, pollIntervalMs, now, sleep, async () => {
            const status = await client.getUpload(created.arn);
            const normalized = status.status.toUpperCase();
            log(`upload ${upload.name} ${normalized || 'pending'}`);
            if (normalized === 'SUCCEEDED') return true;
            if (normalized === 'FAILED') {
                throw new Error(
                    `Device Farm upload ${upload.name} failed${status.message ? `: ${status.message.slice(0, 300)}` : ''}`
                );
            }
            return false;
        });
        if (!ready) throw new Error(`Timed out waiting for Device Farm upload ${upload.name}`);
        return created.arn;
    };

    const uploaded: Record<string, string> = {};
    for (const session of request.sessions) {
        for (const upload of session.uploads) {
            if (uploaded[upload.key]) continue;
            uploaded[upload.key] = await uploadOne(upload);
        }
    }

    const poolArn = await client.createDevicePool({
        name: `lc-smoke-${request.platform}-${runId}`.slice(0, 256),
        rules: [devicePoolRuleForArn(device.arn)],
    });

    log(`created temporary device pool ${poolArn}`);
    const result: SmokeResultFile = { platform: request.platform, device: label, runs: [] };
    const { runs } = result;
    try {
        for (const session of request.sessions) {
            for (let run = 1; run <= request.runs; run += 1) {
                const started = now();
                const context = {
                    platform: request.platform,
                    device: label,
                    run,
                    framework: session.framework,
                };
                try {
                    const runArn = await client.scheduleRun({
                        projectArn: request.projectArn,
                        appArn: uploaded.app ?? '',
                        devicePoolArn: poolArn,
                        name: `lc-smoke-${session.framework}-${run}-${sha}`.slice(0, 256),
                        test: session.test(uploaded),
                        executionConfiguration: {
                            jobTimeoutMinutes: DEVICE_FARM_JOB_TIMEOUT_MINUTES,
                            videoCapture: true,
                        },
                    });
                    log(`scheduled ${session.framework} ${runArn}`);
                    let interpreted: SmokeDeviceRun | null = null;
                    const deadline = started + runTimeoutMs;
                    while (now() < deadline) {
                        const current = await client.getRun(runArn);
                        log(
                            `${request.platform} ${session.framework} run ${run} ${current.status ?? 'unknown'} ${current.result ?? ''}`
                        );
                        if ((current.status ?? '').toUpperCase() !== 'COMPLETED') {
                            await sleep(pollIntervalMs);
                            continue;
                        }
                        const jobs = await client.listJobs(runArn).catch(() => []);
                        const artifacts: DeviceFarmArtifact[] = [];
                        for (const job of jobs) {
                            for (const type of ARTIFACT_QUERIES) {
                                artifacts.push(
                                    ...(await client.listArtifacts(job.arn, type).catch(() => []))
                                );
                            }
                        }
                        interpreted = interpretDeviceFarmRun(current, jobs, artifacts, context);
                        break;
                    }
                    if (!interpreted) {
                        await client.stopRun(runArn).catch(() => undefined);
                        runs.push({
                            ...errorRun(
                                request.platform,
                                `${label} (${session.framework})`,
                                run,
                                'Timed out waiting for Device Farm'
                            ),
                            status: 'timed_out',
                            durationSeconds: Math.max(0, Math.round((now() - started) / 1000)),
                            buildId: runArn,
                            sessionUrl: deviceFarmConsoleUrl(runArn),
                        });
                        continue;
                    }
                    runs.push(
                        interpreted.durationSeconds === null
                            ? {
                                  ...interpreted,
                                  durationSeconds: Math.max(
                                      0,
                                      Math.round((now() - started) / 1000)
                                  ),
                              }
                            : interpreted
                    );
                } catch (error) {
                    const detail = error instanceof Error ? error.message : String(error);
                    log(`${request.platform} ${session.framework} run ${run} error: ${detail}`);
                    runs.push(
                        errorRun(request.platform, `${label} (${session.framework})`, run, detail)
                    );
                }
            }
        }
    } finally {
        result.cleanup = await confirmPoolCleanup(client, poolArn, { now, sleep, log });
    }
    return result;
};

export const runAndroidFrameworks = async (
    request: {
        projectArn: string;
        runs: number;
        frameworks: AndroidFramework[];
        appBytes: Uint8Array;
        appFilename: string;
        suiteBytes?: Uint8Array;
        specBytes?: Uint8Array;
        testBytes?: Uint8Array;
        testFilename?: string;
        sha: string;
        runId: string;
    },
    client: DeviceFarmClient,
    options?: Clock
): Promise<SmokeResultFile> => {
    if (!request.appFilename.endsWith('.apk')) {
        throw new Error('Device Farm Android app must be an .apk');
    }
    const sha = shortToken(request.sha, 'local');
    const sessions: PlannedSession[] = [];
    for (const framework of request.frameworks) {
        if (framework === 'maestro') {
            if (!request.suiteBytes || !request.specBytes) {
                throw new Error('Maestro on Device Farm needs the flow zip and the test spec');
            }
            sessions.push({
                framework,
                uploads: [
                    {
                        key: 'app',
                        name: `learncard-smoke-${sha}.apk`,
                        type: 'ANDROID_APP',
                        bytes: request.appBytes,
                    },
                    {
                        key: 'suite',
                        name: `learncard-smoke-${sha}-maestro.zip`,
                        type: 'APPIUM_NODE_TEST_PACKAGE',
                        bytes: request.suiteBytes,
                    },
                    {
                        key: 'spec',
                        name: `learncard-smoke-${sha}-testspec.yml`,
                        type: 'APPIUM_NODE_TEST_SPEC',
                        bytes: request.specBytes,
                    },
                ],
                test: uploaded => ({
                    type: 'APPIUM_NODE',
                    testPackageArn: uploaded.suite ?? '',
                    testSpecArn: uploaded.spec,
                }),
            });
        } else {
            if (!request.testBytes) {
                throw new Error('Espresso on Device Farm needs the androidTest APK');
            }
            sessions.push({
                framework,
                uploads: [
                    {
                        key: 'app',
                        name: `learncard-smoke-${sha}.apk`,
                        type: 'ANDROID_APP',
                        bytes: request.appBytes,
                    },
                    {
                        key: 'espresso',
                        name: request.testFilename ?? 'app-debug-androidTest.apk',
                        type: 'INSTRUMENTATION_TEST_PACKAGE',
                        bytes: request.testBytes,
                    },
                ],
                test: uploaded => ({
                    type: 'INSTRUMENTATION',
                    testPackageArn: uploaded.espresso ?? '',
                    filter: 'com.learncard.app.SmokeSignInWalletTest',
                }),
            });
        }
    }
    return runDeviceFarmPlan(
        {
            platform: 'android',
            projectArn: request.projectArn,
            runs: request.runs,
            sha: request.sha,
            runId: request.runId,
            sessions,
        },
        client,
        options
    );
};

export const runIosXcuiOnDeviceFarm = async (
    request: {
        projectArn: string;
        runs: number;
        ipaBytes: Uint8Array;
        ipaFilename: string;
        testBytes: Uint8Array;
        testFilename: string;
        sha: string;
        runId: string;
    },
    client: DeviceFarmClient,
    options?: Clock
): Promise<SmokeResultFile> => {
    if (!request.ipaFilename.endsWith('.ipa')) {
        throw new Error('Device Farm iOS app must be an .ipa');
    }
    return runDeviceFarmPlan(
        {
            platform: 'ios',
            projectArn: request.projectArn,
            runs: request.runs,
            sha: request.sha,
            runId: request.runId,
            sessions: [
                {
                    framework: 'xctest',
                    uploads: [
                        {
                            key: 'app',
                            name: request.ipaFilename,
                            type: 'IOS_APP',
                            bytes: request.ipaBytes,
                        },
                        {
                            key: 'xctest',
                            name: request.testFilename,
                            type: 'XCTEST_UI_TEST_PACKAGE',
                            bytes: request.testBytes,
                        },
                    ],
                    test: uploaded => ({
                        type: 'XCTEST_UI',
                        testPackageArn: uploaded.xctest ?? '',
                    }),
                },
            ],
        },
        client,
        options
    );
};

export const createMaestroZip = async (flowPath: string): Promise<Uint8Array> => {
    if (basename(flowPath) !== MAESTRO_FLOW_NAME) {
        throw new Error(`The Maestro flow must be named ${MAESTRO_FLOW_NAME}`);
    }
    const root = await mkdtemp(join(tmpdir(), 'lc-maestro-'));
    try {
        await mkdir(join(root, '.maestro'));
        await copyFile(flowPath, join(root, MAESTRO_ARCHIVE_ENTRY));
        const zipPath = join(root, 'maestro.zip');
        await execFileAsync('zip', ['-r', zipPath, '.maestro'], { cwd: root });
        return new Uint8Array(await readFile(zipPath));
    } finally {
        await rm(root, { recursive: true, force: true });
    }
};

export const unscheduledIosResult = (): UnscheduledIosResult => ({
    platform: 'ios',
    device: 'not scheduled',
    scheduled: false,
    note: UNSCHEDULED_IOS_NOTE,
    runs: [],
});

const isUnscheduledIos = (file: unknown): file is UnscheduledIosResult => {
    if (!file || typeof file !== 'object') return false;
    const record = file as { platform?: unknown; scheduled?: unknown };
    return record.platform === 'ios' && record.scheduled === false;
};

export const summarizeDeviceFarm = (
    files: unknown[],
    expectedPlatforms: SmokePlatform[] = ['android', 'ios']
): { markdown: string; failed: boolean } => {
    const scheduled = readSmokeResultFiles(files.filter(file => !isUnscheduledIos(file)));
    const missingPlatforms = expectedPlatforms.filter(
        platform => !scheduled.some(file => file.platform === platform)
    );
    const markdown = renderSmokeSummary(scheduled, missingPlatforms);
    return {
        markdown: `${markdown}\n\nVideo links are presigned Device Farm FILE artifacts (artifact type VIDEO) and expire. The run link is the console page for that job.`,
        failed: smokeReportFailed(scheduled, missingPlatforms),
    };
};

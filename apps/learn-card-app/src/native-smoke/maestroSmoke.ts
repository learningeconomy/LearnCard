export type SmokePlatform = 'android' | 'ios';

export type SmokeRunStatus = 'passed' | 'failed' | 'error' | 'timed_out';

/** One Maestro execution on one BrowserStack device. */
export type SmokeDeviceRun = {
    platform: SmokePlatform;
    device: string;
    run: number;
    status: SmokeRunStatus;
    durationSeconds: number | null;
    buildId: string | null;
    sessionId: string | null;
    sessionUrl: string | null;
    detail: string | null;
};

export type SmokeResultFile = {
    platform: SmokePlatform;
    device: string;
    runs: SmokeDeviceRun[];
};

export type BrowserStackSession = {
    id?: string;
    status?: string;
    duration?: number | string | null;
    testcases?: {
        status?: {
            passed?: number;
            failed?: number;
            error?: number;
            timedout?: number;
        };
    };
};

export type BrowserStackBuild = {
    id?: string;
    status?: string;
    duration?: number | string | null;
    devices?: Array<{
        sessions?: BrowserStackSession[];
    }>;
};

export type BrowserStackClient = {
    uploadApp: (bytes: Uint8Array, filename: string) => Promise<string>;
    uploadSuite: (bytes: Uint8Array, filename: string) => Promise<string>;
    startBuild: (platform: SmokePlatform, body: Record<string, unknown>) => Promise<string>;
    getBuild: (buildId: string) => Promise<BrowserStackBuild>;
    stopBuild: (buildId: string) => Promise<void>;
};

export class BrowserStackRequestError extends Error {
    readonly status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'BrowserStackRequestError';
        this.status = status;
    }
}

const IN_PROGRESS = new Set(['', 'queued', 'running', 'pending']);

const STATUS_RANK: Record<SmokeRunStatus, number> = {
    passed: 0,
    failed: 1,
    error: 2,
    timed_out: 3,
};

const normalizeStatus = (status: string | undefined): string => (status ?? '').trim().toLowerCase();

export const isBuildInProgress = (status: string | undefined): boolean =>
    IN_PROGRESS.has(normalizeStatus(status));

export const browserStackSessionUrl = (buildId: string, sessionId: string | null): string =>
    sessionId
        ? `https://app-automate.browserstack.com/dashboard/v2/sessions/${sessionId}`
        : `https://app-automate.browserstack.com/dashboard/v2/builds/${buildId}`;

const parseDuration = (value: number | string | null | undefined): number | null => {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
        return Math.round(Number(value));
    }
    return null;
};

const sessionOutcome = (session: BrowserStackSession): SmokeRunStatus | null => {
    const cases = session.testcases?.status;
    const failedCases = cases?.failed ?? 0;
    const errorCases = cases?.error ?? 0;
    const timedOutCases = cases?.timedout ?? 0;
    if (timedOutCases > 0 && failedCases === 0 && errorCases === 0) return 'timed_out';
    if (errorCases > 0 && failedCases === 0) return 'error';
    if (failedCases + errorCases + timedOutCases > 0) return 'failed';

    const status = normalizeStatus(session.status);
    if (status === 'passed' || status === 'success') return 'passed';
    if (status === 'timedout' || status === 'timeout') return 'timed_out';
    if (status === 'error') return 'error';
    if (
        status === 'failed' ||
        status === 'skipped' ||
        status === 'stopped' ||
        status === 'cancelled' ||
        status === 'canceled' ||
        status === 'aborted'
    ) {
        return 'failed';
    }
    if (isBuildInProgress(status)) return null;
    if ((status === 'done' || status === 'completed') && (cases?.passed ?? 0) > 0) return 'passed';
    if (status === 'done' || status === 'completed') return 'failed';
    return null;
};

const worstStatus = (statuses: SmokeRunStatus[]): SmokeRunStatus =>
    statuses.reduce((worst, current) =>
        STATUS_RANK[current] > STATUS_RANK[worst] ? current : worst
    );

export const interpretBuild = (
    build: BrowserStackBuild,
    context: { platform: SmokePlatform; device: string; run: number; buildId: string }
): SmokeDeviceRun | null => {
    if (isBuildInProgress(build.status)) return null;

    const sessions = build.devices?.flatMap(device => device.sessions ?? []) ?? [];
    const outcomes = sessions
        .map(session => sessionOutcome(session))
        .filter((status): status is SmokeRunStatus => status !== null);

    const buildStatus = normalizeStatus(build.status);
    let status: SmokeRunStatus;
    if (outcomes.length > 0) {
        status = worstStatus(outcomes);
    } else if (buildStatus === 'passed' || buildStatus === 'success') {
        status = 'passed';
    } else if (buildStatus === 'timedout' || buildStatus === 'timeout') {
        status = 'timed_out';
    } else if (buildStatus === 'error') {
        status = 'error';
    } else {
        status = 'failed';
    }

    const chosen = sessions.reduce<BrowserStackSession | undefined>((worst, session) => {
        if (!worst) return session;
        const worstOutcome = sessionOutcome(worst);
        const outcome = sessionOutcome(session);
        const worstRank = worstOutcome ? STATUS_RANK[worstOutcome] : -1;
        const rank = outcome ? STATUS_RANK[outcome] : -1;
        return rank > worstRank ? session : worst;
    }, undefined);

    const durationSeconds =
        parseDuration(chosen?.duration) ?? parseDuration(build.duration) ?? null;

    return {
        platform: context.platform,
        device: context.device,
        run: context.run,
        status,
        durationSeconds,
        buildId: context.buildId,
        sessionId: chosen?.id ?? null,
        sessionUrl: browserStackSessionUrl(context.buildId, chosen?.id ?? null),
        detail: status === 'passed' ? null : `BrowserStack status: ${build.status ?? 'unknown'}`,
    };
};

export const maestroBuildRequest = (input: {
    appUrl: string;
    testSuiteUrl: string;
    device: string;
    platform: SmokePlatform;
    run: number;
    sha: string;
}): Record<string, unknown> => ({
    app: input.appUrl,
    testSuite: input.testSuiteUrl,
    project: 'LearnCardNativeSmoke',
    customBuildName: `lc-smoke-${input.platform}-run-${input.run}-${input.sha.slice(0, 7) || 'local'}`,
    devices: [input.device],
    execute: ['smoke-signin-wallet.yaml'],
    deviceLogs: 'true',
});

const failedRun = (
    context: { platform: SmokePlatform; device: string; run: number },
    detail: string
): SmokeDeviceRun => ({
    platform: context.platform,
    device: context.device,
    run: context.run,
    status: 'error',
    durationSeconds: null,
    buildId: null,
    sessionId: null,
    sessionUrl: null,
    detail,
});

export const runSmoke = async (
    request: {
        platform: SmokePlatform;
        device: string;
        runs: number;
        appBytes: Uint8Array;
        appFilename: string;
        suiteBytes: Uint8Array;
        suiteFilename: string;
        sha: string;
    },
    client: BrowserStackClient,
    options?: {
        pollIntervalMs?: number;
        runTimeoutMs?: number;
        sleep?: (ms: number) => Promise<void>;
        now?: () => number;
        log?: (line: string) => void;
    }
): Promise<SmokeDeviceRun[]> => {
    const pollIntervalMs = options?.pollIntervalMs ?? 15_000;
    const runTimeoutMs = options?.runTimeoutMs ?? 25 * 60 * 1000;
    const sleep = options?.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
    const now = options?.now ?? (() => Date.now());
    const log = options?.log ?? (() => undefined);

    const appUrl = await client.uploadApp(request.appBytes, request.appFilename);
    const testSuiteUrl = await client.uploadSuite(request.suiteBytes, request.suiteFilename);
    log(`uploaded app ${appUrl} and suite ${testSuiteUrl}`);

    const runs: SmokeDeviceRun[] = [];
    for (let run = 1; run <= request.runs; run += 1) {
        const context = { platform: request.platform, device: request.device, run };
        const started = now();
        try {
            const buildId = await client.startBuild(
                request.platform,
                maestroBuildRequest({
                    appUrl,
                    testSuiteUrl,
                    device: request.device,
                    platform: request.platform,
                    run,
                    sha: request.sha,
                })
            );
            let interpreted: SmokeDeviceRun | null = null;
            let latest: BrowserStackBuild | null = null;
            while (now() - started < runTimeoutMs) {
                latest = await client.getBuild(buildId);
                log(`${request.platform} run ${run} ${buildId} ${latest.status ?? 'unknown'}`);
                interpreted = interpretBuild(latest, { ...context, buildId });
                if (interpreted) break;
                await sleep(pollIntervalMs);
            }
            if (!interpreted) {
                await client.stopBuild(buildId).catch(() => undefined);
                const wallSeconds = Math.max(0, Math.round((now() - started) / 1000));
                runs.push({
                    ...failedRun(context, 'Timed out waiting for BrowserStack'),
                    status: 'timed_out',
                    durationSeconds: wallSeconds,
                    buildId,
                    sessionUrl: browserStackSessionUrl(buildId, null),
                });
                continue;
            }
            if (interpreted.durationSeconds === null) {
                interpreted = {
                    ...interpreted,
                    durationSeconds: Math.max(0, Math.round((now() - started) / 1000)),
                };
            }
            runs.push(interpreted);
        } catch (error) {
            const detail = error instanceof Error ? error.message : String(error);
            log(`${request.platform} run ${run} error: ${detail}`);
            runs.push(failedRun(context, detail));
        }
    }

    return runs;
};

const EXPECTED_PLATFORMS: SmokePlatform[] = ['android', 'ios'];

const isPlatform = (value: unknown): value is SmokePlatform =>
    value === 'android' || value === 'ios';

export const readSmokeResultFiles = (files: unknown[]): SmokeResultFile[] =>
    files.flatMap(file => {
        if (!file || typeof file !== 'object') return [];
        const record = file as Partial<SmokeResultFile>;
        if (!isPlatform(record.platform) || typeof record.device !== 'string') return [];
        if (!Array.isArray(record.runs)) return [];
        return [{ platform: record.platform, device: record.device, runs: record.runs }];
    });

const escapeCell = (value: string): string =>
    value.replace(/[\\|]/g, character => `\\${character}`);

export const renderSmokeSummary = (
    files: SmokeResultFile[],
    missingPlatforms: SmokePlatform[] = EXPECTED_PLATFORMS.filter(
        platform => !files.some(file => file.platform === platform)
    )
): string => {
    const runs = files.flatMap(file => file.runs);
    const lines = [
        '## Native smoke — BrowserStack Maestro',
        '',
        '| Platform | Device | Run | Result | Duration | BrowserStack |',
        '| --- | --- | --- | --- | --- | --- |',
    ];

    const sorted = [...runs].sort((left, right) => {
        if (left.platform !== right.platform) return left.platform.localeCompare(right.platform);
        return left.run - right.run;
    });

    if (sorted.length === 0) {
        lines.push('| — | — | — | — | — | — |');
    }

    for (const run of sorted) {
        const duration = run.durationSeconds === null ? 'n/a' : `${run.durationSeconds}s`;
        const link = run.sessionUrl ? `[session](${run.sessionUrl})` : 'n/a';
        const result =
            run.detail && run.status !== 'passed' ? `${run.status} (${run.detail})` : run.status;
        lines.push(
            `| ${escapeCell(run.platform)} | ${escapeCell(run.device)} | ${run.run} | ${escapeCell(result)} | ${duration} | ${link} |`
        );
    }

    lines.push('');
    const platformsToReport = EXPECTED_PLATFORMS.filter(
        platform =>
            files.some(file => file.platform === platform) || missingPlatforms.includes(platform)
    );
    for (const platform of platformsToReport) {
        const platformRuns = runs.filter(run => run.platform === platform);
        if (platformRuns.length === 0) {
            lines.push(`${platform}: no result. The job failed before Maestro reported a session.`);
            continue;
        }
        const passed = platformRuns.filter(run => run.status === 'passed').length;
        lines.push(`${platform}: ${passed}/${platformRuns.length} passed.`);
    }

    if (missingPlatforms.length > 0) {
        lines.push('');
        lines.push(`Missing platform results: ${missingPlatforms.join(', ')}.`);
    }

    return lines.join('\n');
};

export const smokeReportFailed = (
    files: SmokeResultFile[],
    missingPlatforms: SmokePlatform[] = EXPECTED_PLATFORMS.filter(
        platform => !files.some(file => file.platform === platform)
    )
): boolean =>
    missingPlatforms.length > 0 ||
    files.some(file => file.runs.length === 0 || file.runs.some(run => run.status !== 'passed'));

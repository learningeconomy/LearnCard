export type SmokePlatform = 'android' | 'ios';

export type SmokeRunStatus = 'passed' | 'failed' | 'error' | 'timed_out';

/** One native smoke execution on one device. */
export type SmokeDeviceRun = {
    platform: SmokePlatform;
    device: string;
    run: number;
    status: SmokeRunStatus;
    durationSeconds: number | null;
    buildId: string | null;
    sessionId: string | null;
    sessionUrl: string | null;
    videoUrl?: string | null;
    detail: string | null;
};

export type SmokeResultFile = {
    platform: SmokePlatform;
    device: string;
    runs: SmokeDeviceRun[];
    cleanup?: DevicePoolCleanup;
};

export type DevicePoolCleanup =
    { status: 'deleted'; poolArn: string } | { status: 'failed'; poolArn: string; detail: string };

const EXPECTED_PLATFORMS: SmokePlatform[] = ['android', 'ios'];

const isPlatform = (value: unknown): value is SmokePlatform =>
    value === 'android' || value === 'ios';

export const readSmokeResultFiles = (files: unknown[]): SmokeResultFile[] =>
    files.flatMap(file => {
        if (!file || typeof file !== 'object') return [];
        const record = file as Partial<SmokeResultFile>;
        if (!isPlatform(record.platform) || typeof record.device !== 'string') return [];
        if (!Array.isArray(record.runs)) return [];
        const { cleanup } = record;
        const validCleanup =
            typeof cleanup?.poolArn === 'string' &&
            cleanup.poolArn.length > 0 &&
            (cleanup.status === 'deleted' ||
                (cleanup.status === 'failed' && typeof cleanup.detail === 'string'));
        return [
            {
                platform: record.platform,
                device: record.device,
                runs: record.runs,
                cleanup: validCleanup ? cleanup : undefined,
            },
        ];
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
        '## Native smoke — AWS Device Farm',
        '',
        '| Platform | Device | Run | Result | Duration | Device Farm |',
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
        const video = run.videoUrl ? ` [video](${run.videoUrl})` : '';
        const link = run.sessionUrl ? `[run](${run.sessionUrl})${video}` : 'n/a';
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
            lines.push(
                `${platform}: no result. The job failed before Device Farm reported a result.`
            );
            continue;
        }
        const passed = platformRuns.filter(run => run.status === 'passed').length;
        lines.push(`${platform}: ${passed}/${platformRuns.length} passed.`);
    }

    lines.push('', '### Temporary device-pool cleanup', '');
    for (const platform of platformsToReport) {
        const cleanup = files.find(file => file.platform === platform)?.cleanup;
        if (cleanup?.status === 'deleted') {
            lines.push(`- ${platform}: deletion confirmed for \`${cleanup.poolArn}\`.`);
        } else if (cleanup?.status === 'failed') {
            lines.push(
                `- ${platform}: deletion unconfirmed for \`${cleanup.poolArn}\`. ${cleanup.detail}`
            );
        } else {
            lines.push(`- ${platform}: no cleanup evidence.`);
        }
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
    files.some(
        file =>
            file.cleanup?.status !== 'deleted' ||
            file.runs.length === 0 ||
            file.runs.some(run => run.status !== 'passed')
    );

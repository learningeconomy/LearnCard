#!/usr/bin/env bun
/**
 * EducationOS scenario runner (WORKPLAN §1a "Developer loop first").
 *
 *   bun run scenario doctor [--json]
 *   bun run scenario mvp --driver live [--json] [--only S07] [--from S09]
 *                        [--keep-lms] [--district <ecosystemId>]
 *
 * From the repo root: `bun run scenario -- mvp --driver live`. The in-process driver needs
 * vitest's fresh test database, so it runs as `bun run scenario:in-process` (repo root) or
 * `bun run test:scenario` (brain-service), not through this CLI.
 * Exit codes: 0 all good, 1 a step FAILed, 2 the doctor FAILed (or bad usage).
 */
import { constants as osConstants } from 'node:os';
import { bootstrapScenarioEnv } from './env';
import { createReporter, redact } from './core/report';
import type { ScenarioOptions } from './core/types';
import type { ScenarioPort } from './port';

const IN_PROCESS_HINT =
    'The in-process driver runs under vitest against a fresh test database: ' +
    '`bun run scenario:in-process` from the repo root ' +
    '(or `bun run test:scenario` in services/learn-card-network/brain-service).';

const USAGE = `usage:
  scenario doctor [--json]
  scenario mvp --driver live [--json] [--only <step>] [--from <step>] [--keep-lms] [--district <id>]
in-process: ${IN_PROCESS_HINT}`;

const SIGNALS: readonly NodeJS.Signals[] = ['SIGINT', 'SIGTERM', 'SIGHUP'];

const flag = (args: readonly string[], name: string): boolean => args.includes(`--${name}`);

const value = (args: readonly string[], name: string): string | undefined => {
    const index = args.indexOf(`--${name}`);
    if (index < 0) return undefined;
    const next = args[index + 1];
    if (!next || next.startsWith('--')) throw new Error(`--${name} needs a value\n${USAGE}`);
    return next;
};

const parseDriver = (raw: string | undefined): 'live' => {
    if (raw === 'live') return raw;
    throw new Error(`--driver must be live\n${USAGE}`);
};

const doctor = async (json: boolean): Promise<number> => {
    const { runDoctor, doctorStatus } = await import('./doctor');
    const checks = await runDoctor();
    const reporter = createReporter(json);
    for (const check of checks) {
        reporter.info(
            json
                ? JSON.stringify({ type: 'doctor', ...check })
                : `${check.status.padEnd(4)} ${check.name}: ${check.detail}${check.fix && check.status !== 'PASS' ? `\n     → ${check.fix}` : ''}`
        );
    }
    const status = doctorStatus(checks);
    reporter.info(json ? JSON.stringify({ type: 'doctor-summary', status }) : `doctor: ${status}`);
    return status === 'FAIL' ? 2 : 0;
};

const mvp = async (args: readonly string[]): Promise<number> => {
    if (value(args, 'driver') === 'in-process') {
        console.error(IN_PROCESS_HINT);
        return 2;
    }
    const options: ScenarioOptions = {
        driver: parseDriver(value(args, 'driver')),
        json: flag(args, 'json'),
        only: value(args, 'only'),
        from: value(args, 'from'),
        keepLms: flag(args, 'keep-lms'),
        districtId: value(args, 'district'),
    };
    if (options.districtId && options.driver !== 'live') {
        throw new Error('--district only applies to the live driver');
    }
    const { newRunId, runMvpWalkthrough } = await import('./mvp-walkthrough');
    const runId = newRunId();
    const { createLivePort } = await import('./drivers/live/port');
    let port: ScenarioPort | undefined;
    // A signal skips `finally` and the 'exit' event, so close the port (stopping the
    // spawned demo LMS) before exiting with the conventional 128 + signal number. Repeats
    // are ignored while closing: under prove:demo-lms a Ctrl-C arrives twice (from the
    // terminal's process group and forwarded by the parent).
    let stopping = false;
    const onSignal = (signal: NodeJS.Signals): void => {
        if (stopping) return;
        stopping = true;
        const code = 128 + (osConstants.signals[signal] ?? 0);
        void (port?.close() ?? Promise.resolve())
            .catch(() => undefined)
            .finally(() => process.exit(code));
    };
    for (const signal of SIGNALS) process.on(signal, onSignal);
    try {
        port = await createLivePort({ runId, keepLms: options.keepLms });
        const summary = await runMvpWalkthrough({ port, options, runId });
        return summary.exitCode;
    } finally {
        for (const signal of SIGNALS) process.off(signal, onSignal);
        await port?.close();
    }
};

const main = async (): Promise<number> => {
    bootstrapScenarioEnv();
    const [command, ...args] = process.argv.slice(2);
    if (command === 'doctor') return doctor(flag(args, 'json'));
    if (command === 'mvp') return mvp(args);
    console.error(USAGE);
    return 2;
};

main()
    .then(code => process.exit(code))
    .catch(error => {
        console.error(
            redact(error instanceof Error ? (error.stack ?? error.message) : String(error))
        );
        process.exit(2);
    });

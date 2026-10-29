/**
 * Output. Every line the runner prints goes through `redact`, which replaces any value a
 * driver registered with `registerSecret` (service-account secrets, tokens, cookies).
 */
import type { StepResult, StepStatus } from './types';

const secrets = new Set<string>();

/** Drivers register every secret they hold before it can reach a log line. */
export const registerSecret = (value: string | undefined): void => {
    // Very short values would redact ordinary words.
    if (value && value.length >= 8) secrets.add(value);
};

export const redact = (text: string): string => {
    let out = text;
    for (const value of secrets) out = out.split(value).join('[REDACTED]');
    // Bearer tokens and cookies that were never registered.
    return out
        .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{16,}/g, 'Bearer [REDACTED]')
        .replace(/(SERVICE_ACCOUNT_SECRET=)\S+/g, '$1[REDACTED]');
};

const write = (line: string): void => {
    process.stdout.write(`${redact(line)}\n`);
};

const pad = (value: string, width: number): string =>
    value.length >= width ? value : value + ' '.repeat(width - value.length);

export type Reporter = {
    stepStarted: (id: string, title: string) => void;
    stepFinished: (result: StepResult) => void;
    summary: (results: readonly StepResult[], meta: { runId: string; driver: string }) => void;
    info: (message: string) => void;
};

const COUNTED: StepStatus[] = ['PASS', 'FAIL', 'WARN', 'OBSERVED', 'BLOCKED', 'SKIP'];

const tableReporter = (): Reporter => ({
    stepStarted: () => undefined,
    stepFinished: result => {
        const labels = result.labels.length ? ` [${result.labels.join(', ')}]` : '';
        write(
            `${pad(result.status, 8)} ${pad(result.id, 4)} ${pad(result.via, 8)} ${result.title}${labels}` +
                (result.reason ? ` — ${result.reason}` : '') +
                ` (${result.ms} ms)`
        );
        for (const note of result.notes) write(`                       · ${note}`);
        if (result.explain) write(`                       ↳ ${result.explain}`);
    },
    summary: (results, meta) => {
        const counts = COUNTED.map(
            status => `${status} ${results.filter(result => result.status === status).length}`
        );
        write(`\nscenario ${meta.runId} (${meta.driver}): ${counts.join(', ')}`);
    },
    info: message => write(message),
});

const jsonReporter = (): Reporter => ({
    stepStarted: () => undefined,
    stepFinished: result => write(JSON.stringify({ type: 'step', ...result })),
    summary: (results, meta) =>
        write(
            JSON.stringify({
                type: 'summary',
                ...meta,
                counts: Object.fromEntries(
                    COUNTED.map(status => [
                        status,
                        results.filter(result => result.status === status).length,
                    ])
                ),
            })
        ),
    info: message => write(JSON.stringify({ type: 'info', message })),
});

export const createReporter = (json: boolean): Reporter =>
    json ? jsonReporter() : tableReporter();

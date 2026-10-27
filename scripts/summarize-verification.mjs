import { mkdir, readFile, readdir, writeFile, appendFile } from 'node:fs/promises';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Deliberately do not copy errors, observations, paths, URLs, actor metadata or raw reports.
const [directory, outputDirectory] = process.argv.slice(2);
if (!directory || !outputDirectory)
    throw new Error('Usage: node scripts/summarize-verification.mjs STACK_DIR OUTPUT_DIR');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const map = await readFile(
    join(root, '.agents/skills/verify-learncard/features/README.md'),
    'utf8'
);
const catalog = new Map(
    [...map.matchAll(/^\| `([^`]+)`\s*\|[^\n]+$/gm)].map(row => [
        row[1],
        [...(row[0].split('|')[4] ?? '').matchAll(/`([^`]+)`/g)].map(entry => entry[1]),
    ])
);
const statuses = ['passed', 'failed', 'interrupted', 'running'];
const outcome = value =>
    ['success', 'failure', 'cancelled', 'skipped'].includes(value) ? value : 'unknown';
const phases = [
    'command-total',
    'preflight',
    'build',
    'prepare',
    'compose',
    'readiness',
    'startup',
    'stack-reuse-check',
    'session-reuse-check',
    'bootstrap',
    'bootstrap-browser-launch',
    'bootstrap-harness-setup',
    'bootstrap-learner-sign-in',
    'bootstrap-learner-reload',
    'bootstrap-learner-evidence',
    'bootstrap-recipient-sign-in',
    'bootstrap-recipient-reload',
    'bootstrap-recipient-evidence',
    'bootstrap-evidence-close',
    'bootstrap-browser-close',
    'post-bootstrap-doctor',
    'catalog-stack-check',
    'catalog-browser-launch',
    'catalog',
    'script-stack-check',
    'script-load',
    'script-browser-launch',
    'script-harness-setup',
    'script-execution',
    'script-evidence-close',
    'command-cleanup',
    'teardown',
];
const duration = value =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 86_400_000
        ? Math.round(value)
        : null;
const featureDuration = result => {
    if (result?.durationMs !== undefined) return duration(result.durationMs);
    // Older reports already have timestamps. Only their numeric difference can leave the runner.
    const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (!iso.test(result?.startedAt) || !iso.test(result?.finishedAt)) return null;
    return duration(Date.parse(result.finishedAt) - Date.parse(result.startedAt));
};
const messageNavigationSteps = new Set([
    'message-listing-setup',
    'message-sign-in',
    'message-check-installation',
    'message-open-preview',
    'message-preview-action',
    'message-install-and-open',
    'message-back-skips-listing',
    'message-installed-launch-after-reload',
    'unknown-message-route-returns-home',
]);
const failedOperation = error =>
    typeof error === 'string'
        ? (['page.goto', 'page.reload', 'page.goBack', 'locator.click', 'locator.fill'].find(
              operation =>
                  error.startsWith(`TimeoutError: ${operation}:`) ||
                  error.startsWith(`Error: ${operation}:`)
          ) ?? 'other')
        : 'other';
const readMessageNavigation = async path => {
    let actions;
    try {
        actions = JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) return [];
        throw error;
    }
    if (!Array.isArray(actions)) return [];
    return actions.flatMap(action =>
        messageNavigationSteps.has(action?.label)
            ? [
                  {
                      step: action.label,
                      status: statuses.includes(action.status) ? action.status : 'unknown',
                      durationMs: featureDuration(action),
                      ...(action.status === 'failed'
                          ? { failedOperation: failedOperation(action.error) }
                          : {}),
                  },
              ]
            : []
    );
};
const readTimings = async path => {
    let records;
    try {
        records = JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
        if (error.code === 'ENOENT' || error instanceof SyntaxError) return [];
        throw error;
    }
    if (!Array.isArray(records)) return [];
    return phases.flatMap(phase => {
        const record = records.find(value => value?.phase === phase);
        return record
            ? [
                  {
                      phase,
                      status: statuses.includes(record.status) ? record.status : 'unknown',
                      durationMs: duration(record.durationMs),
                  },
              ]
            : [];
    });
};
const formatDuration = value => {
    if (value === null) return '—';
    const tenths = Math.round(value / 100);
    return `${Math.floor(tenths / 600)}m ${((tenths % 600) / 10).toFixed(1)}s`;
};
// Directory names and script names are private. Only ordinal command groups leave the runner.
const commandTimings = async folder => {
    let entries;
    try {
        entries = await readdir(join(directory, folder), { withFileTypes: true });
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
    const commands = [];
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
        if (!entry.isDirectory()) continue;
        const timings = await readTimings(join(directory, folder, entry.name, 'timings.json'));
        const messageNavigation =
            folder === 'scripts'
                ? await readMessageNavigation(join(directory, folder, entry.name, 'actions.json'))
                : [];
        if (timings.length || messageNavigation.length)
            commands.push({
                timings,
                ...(messageNavigation.length ? { messageNavigation } : {}),
            });
    }
    return commands;
};
const commandOutcomes = {
    startup: outcome(process.env.STARTUP_OUTCOME),
    script: outcome(process.env.SCRIPT_OUTCOME),
    catalog: outcome(process.env.VERIFICATION_OUTCOME),
};
// Older callers provide only VERIFICATION_OUTCOME. New CI callers include all three commands.
const suppliedOutcomes = [
    process.env.STARTUP_OUTCOME,
    process.env.SCRIPT_OUTCOME,
    process.env.VERIFICATION_OUTCOME,
]
    .filter(value => value !== undefined)
    .map(outcome);
const sequenceOutcome =
    ['failure', 'cancelled', 'unknown', 'skipped', 'success'].find(value =>
        suppliedOutcomes.includes(value)
    ) ?? 'unknown';
const summary = {
    run: sequenceOutcome,
    commandOutcomes,
    teardown: outcome(process.env.TEARDOWN_OUTCOME),
    startupTimings: await readTimings(join(directory, 'startup-timings.json')),
    startupCommands: await commandTimings('startup'),
    scriptCommands: await commandTimings('scripts'),
    reports: [],
};
let directories = [];
try {
    directories = await readdir(join(directory, 'runs'), { withFileTypes: true });
} catch (error) {
    if (error.code !== 'ENOENT') throw error;
}
for (const entry of directories.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    let report;
    try {
        report = JSON.parse(
            await readFile(join(directory, 'runs', entry.name, 'report.json'), 'utf8')
        );
    } catch {
        summary.reports.push({
            status: 'unreadable',
            timings: await readTimings(join(directory, 'runs', entry.name, 'timings.json')),
            features: [],
        });
        continue;
    }
    const results = Array.isArray(report.results) ? report.results : [];
    summary.reports.push({
        status: statuses.includes(report.status) ? report.status : 'unknown',
        timings: await readTimings(join(directory, 'runs', entry.name, 'timings.json')),
        features: [...catalog].map(([feature, required]) => {
            const result = results.find(value => value?.feature === feature);
            return {
                feature,
                status: result && statuses.includes(result.status) ? result.status : 'not-run',
                completedEntries: new Set(
                    Array.isArray(result?.entries)
                        ? result.entries.filter(value => required.includes(value))
                        : []
                ).size,
                requiredEntries: required.length,
                durationMs: featureDuration(result),
            };
        }),
    });
}
const lines = [
    '# LearnCard verification',
    '',
    `Verification command sequence: **${summary.run}**. Teardown step: **${summary.teardown}**.`,
    '',
    'Only allowlisted step/operation names, statuses, coverage counts and numeric durations are retained; raw authentication evidence is not uploaded.',
    '',
    'Command totals and bootstrap totals include their nested subphases; do not add them together. GitHub step durations also include CLI loading. Dependency installation and preliminary checks are outside these command timings; use the full workflow duration as the overall baseline.',
    '',
];
if (!summary.reports.length)
    lines.push('No catalog report was produced. Check the prerequisite step outcomes.');
const timingTable = timings => {
    if (!timings.length) return;
    lines.push('| Phase | Status | Duration |', '| --- | --- | --- |');
    for (const timing of timings)
        lines.push(`| ${timing.phase} | ${timing.status} | ${formatDuration(timing.durationMs)} |`);
    lines.push('');
};
if (summary.startupTimings.length) {
    lines.push('## Service startup breakdown', '');
    timingTable(summary.startupTimings);
}
for (const [label, commands] of [
    ['Startup command', summary.startupCommands],
    ['Script command', summary.scriptCommands],
]) {
    for (const [index, command] of commands.entries()) {
        lines.push(`## ${label} ${index + 1}`, '');
        timingTable(command.timings);
        if (command.messageNavigation?.length) {
            lines.push(
                '| Message navigation step | Status | Duration | Failed operation |',
                '| --- | --- | --- | --- |'
            );
            for (const step of command.messageNavigation)
                lines.push(
                    `| ${step.step} | ${step.status} | ${formatDuration(step.durationMs)} | ${step.failedOperation ?? '—'} |`
                );
            lines.push('');
        }
    }
}
for (const [index, report] of summary.reports.entries()) {
    lines.push(`## Catalog run ${index + 1}: ${report.status}`, '');
    timingTable(report.timings);
    lines.push('| Feature | Status | Entries | Duration |', '| --- | --- | --- | --- |');
    for (const feature of report.features) {
        lines.push(
            `| ${feature.feature} | ${feature.status} | ${feature.completedEntries}/${feature.requiredEntries} | ${formatDuration(feature.durationMs)} |`
        );
    }
    lines.push('');
}
await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
await writeFile(join(outputDirectory, 'summary.md'), `${lines.join('\n')}\n`);
if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);

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
    'preflight',
    'build',
    'prepare',
    'compose',
    'readiness',
    'startup',
    'catalog',
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
const summary = {
    run: outcome(process.env.VERIFICATION_OUTCOME),
    teardown: outcome(process.env.TEARDOWN_OUTCOME),
    startupTimings: await readTimings(join(directory, 'startup-timings.json')),
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
    `Catalog step: **${summary.run}**. Teardown step: **${summary.teardown}**.`,
    '',
    'Only allowlisted statuses, coverage counts and numeric durations are retained; raw authentication evidence is not uploaded.',
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
    lines.push('## Startup breakdown', '');
    timingTable(summary.startupTimings);
}
for (const [index, report] of summary.reports.entries()) {
    lines.push(`## Run ${index + 1}: ${report.status}`, '');
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

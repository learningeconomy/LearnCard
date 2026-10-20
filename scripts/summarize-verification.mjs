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
const summary = {
    run: outcome(process.env.VERIFICATION_OUTCOME),
    teardown: outcome(process.env.TEARDOWN_OUTCOME),
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
        summary.reports.push({ status: 'unreadable', features: [] });
        continue;
    }
    const results = Array.isArray(report.results) ? report.results : [];
    summary.reports.push({
        status: statuses.includes(report.status) ? report.status : 'unknown',
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
            };
        }),
    });
}
const lines = [
    '# LearnCard verification',
    '',
    `Catalog step: **${summary.run}**. Teardown step: **${summary.teardown}**.`,
    '',
    'Only allowlisted statuses and coverage counts are retained; raw authentication evidence is not uploaded.',
    '',
];
if (!summary.reports.length)
    lines.push('No catalog report was produced. Check the prerequisite step outcomes.');
for (const [index, report] of summary.reports.entries()) {
    lines.push(
        `## Run ${index + 1}: ${report.status}`,
        '',
        '| Feature | Status | Entries |',
        '| --- | --- | --- |'
    );
    for (const feature of report.features) {
        lines.push(
            `| ${feature.feature} | ${feature.status} | ${feature.completedEntries}/${feature.requiredEntries} |`
        );
    }
    lines.push('');
}
await mkdir(outputDirectory, { recursive: true });
await writeFile(join(outputDirectory, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
await writeFile(join(outputDirectory, 'summary.md'), `${lines.join('\n')}\n`);
if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`);

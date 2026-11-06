const { appendFileSync, existsSync, readFileSync, readdirSync } = require('node:fs');
const { join } = require('node:path');

const cell = value =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/[\r\n]/g, ' ')
        .replace(/[\\`*_[\]{}()|!]/g, '\\$&')
        .slice(0, 500);
const integer = value => Number.isSafeInteger(value) && value >= 0;

const summarize = (directory, outcome) => {
    if (!['success', 'failure', 'cancelled', 'skipped'].includes(outcome)) {
        throw new Error('A GitHub test-step outcome is required.');
    }
    const reports = [];
    let incomplete = 0;
    for (const entry of existsSync(directory)
        ? readdirSync(directory, { withFileTypes: true })
        : []) {
        if (!entry.isDirectory() || !entry.name.startsWith('vitest-')) continue;
        const file = join(directory, entry.name, 'report.json');
        if (!existsSync(file)) {
            incomplete += 1;
            continue;
        }
        const report = JSON.parse(readFileSync(file, 'utf8'));
        if (
            report.schemaVersion !== 1 ||
            typeof report.project !== 'string' ||
            !['passed', 'failed', 'interrupted'].includes(report.reason) ||
            !['passed', 'failed', 'skipped', 'pending', 'recovered'].every(key =>
                integer(report.counts?.[key])
            ) ||
            !integer(report.failedModules) ||
            !integer(report.unhandledErrors) ||
            !Array.isArray(report.cases) ||
            !report.cases.every(
                test =>
                    typeof test.file === 'string' &&
                    typeof test.name === 'string' &&
                    integer(test.retries) &&
                    (test.line === undefined || (integer(test.line) && test.line > 0)) &&
                    ['passed', 'failed', 'skipped', 'pending'].includes(test.state)
            )
        ) {
            throw new Error('Invalid Vitest retry report.');
        }
        reports.push(report);
    }
    reports.sort((a, b) => a.project.localeCompare(b.project));
    const recovered = reports.reduce((total, report) => total + report.counts.recovered, 0);
    const lines = [
        '## Test retries',
        '',
        `Nx test step: **${outcome}**. Nx runs once; failing Vitest cases default to one retry.`,
        'Builds, setup/import failures and non-Vitest targets retain their failure status.',
        '',
        `Recovered in executed Vitest processes: **${recovered}**. These tests are flaky, not first-attempt passes.`,
        'Cached tasks are not recounted here; their original flaky-test warnings remain in Nx terminal output.',
        '',
        '| Vitest project | Run | Passed | Failed | Skipped | Recovered | Failed modules | Unhandled errors |',
        '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |',
        ...reports.map(
            report =>
                `| ${cell(report.project)} | ${report.reason} | ${report.counts.passed} | ${report.counts.failed} | ${report.counts.skipped} | ${report.counts.recovered} | ${report.failedModules} | ${report.unhandledErrors} |`
        ),
        '',
        '| Retried or failed case | Result | Retries |',
        '| --- | --- | ---: |',
        ...reports.flatMap(report =>
            report.cases.map(
                test =>
                    `| ${cell(`${test.file}${test.line ? `:${test.line}` : ''} — ${test.name}`)} | ${test.state === 'passed' && test.retries > 0 ? 'recovered (flaky)' : test.state} | ${test.retries} |`
            )
        ),
        '',
    ];
    if (!reports.length || incomplete) {
        lines.push(
            `Reporting coverage: ${reports.length} completed Vitest processes; ${incomplete} incomplete reports.`,
            'Missing reports can mean an early failure, interruption, cached tasks or non-Vitest targets. This is not proof that every selected task executed.',
            ''
        );
    }
    return {
        markdown: lines.join('\n'),
        incomplete:
            incomplete > 0 ||
            reports.some(
                report =>
                    report.reason !== 'passed' ||
                    report.counts.failed > 0 ||
                    report.counts.pending > 0 ||
                    report.failedModules > 0 ||
                    report.unhandledErrors > 0
            ),
    };
};

if (require.main === module) {
    const { LC_CI_TEST_REPORT_DIR, LC_CI_NX_OUTCOME, GITHUB_STEP_SUMMARY } = process.env;
    if (!LC_CI_TEST_REPORT_DIR || !GITHUB_STEP_SUMMARY) {
        throw new Error('Retry report directory and GitHub summary path are required.');
    }
    const result = summarize(LC_CI_TEST_REPORT_DIR, LC_CI_NX_OUTCOME);
    appendFileSync(GITHUB_STEP_SUMMARY, result.markdown);
    if (LC_CI_NX_OUTCOME === 'success' && result.incomplete) process.exitCode = 1;
}

module.exports = { summarize };

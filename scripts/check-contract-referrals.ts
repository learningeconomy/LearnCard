/** Run referral QA with synthetic actors and a disposable Neo4j test container. */
import { spawn, spawnSync } from 'node:child_process';
import { closeSync, mkdtempSync, openSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface TestReport {
    numPassedTests: number;
    numFailedTests: number;
    numPendingTests: number;
    success: boolean;
    testResults: {
        name: string;
        status: string;
        assertionResults: { fullName: string; status: string; failureMessages: string[] }[];
    }[];
}

const suites = [
    ['contract-requests.spec.ts', 'Referrals, privacy, and delivery retries'],
    ['notifications.helpers.spec.ts', 'Webhook responses and routing'],
    ['notifications-worker.spec.ts', 'Queued notification delivery'],
] as const;
const broaderSuites = [
    ['app-notifications.spec.ts', 'Legacy app notifications'],
    ['credential-refresh-notifications.spec.ts', 'Credential refresh notifications'],
    ['consentflow.spec.ts', 'Consent lifecycle and legacy contracts'],
    ['consent-data-boundaries.spec.ts', 'Sharing permission boundaries'],
    ['consent-recipients.spec.ts', 'Audience changes and encryption recipients'],
    ['credentials.spec.ts', 'Credential lifecycle'],
] as const;

const main = async (): Promise<number> => {
    const args = process.argv.slice(2);
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`Usage: bun run test:referrals [--full]

Start OrbStack/Docker and install workspace dependencies with bun install first.
The command starts a disposable Neo4j database, creates synthetic test accounts,
runs referral/privacy/retry checks, and stops the database after the run.
No running API services, environment setup, or real accounts are needed.

--full   Also check consent, credential, and legacy-notification regressions.
Logs and a JSON result are saved in the OS temporary directory.
This checks service routes in-process; it does not test the app or a live CRM.`);
        return 0;
    }
    if (args.some(arg => arg !== '--full')) {
        console.error('Unknown option. Use bun run test:referrals --help.');
        return 1;
    }

    const root = dirname(dirname(fileURLToPath(import.meta.url)));
    const service = join(root, 'services/learn-card-network/brain-service');
    let vitestCli: string;
    try {
        const require = createRequire(join(service, 'package.json'));
        vitestCli = join(dirname(require.resolve('vitest/package.json')), 'vitest.mjs');
    } catch {
        console.error('Workspace dependencies are missing. Run bun install at the repo root.');
        return 1;
    }
    const docker = spawnSync('docker', ['info', '--format', '{{.ServerVersion}}'], {
        encoding: 'utf8',
        timeout: 10_000,
    });
    if (docker.error || docker.status !== 0) {
        console.error('Docker is unavailable. Start OrbStack or Docker Desktop, then rerun.');
        return 1;
    }

    const selected = args.includes('--full') ? [...suites, ...broaderSuites] : [...suites];
    const artifacts = mkdtempSync(join(tmpdir(), 'learncard-referrals-'));
    const reportPath = join(artifacts, 'results.json');
    const logPath = join(artifacts, 'runner.log');
    const log = openSync(logPath, 'w');
    console.log('Referral QA: Docker ready. Starting a disposable Neo4j database...');
    console.log('The first run may take longer while Docker downloads neo4j:5.');
    console.log(`Running ${selected.length} suites with synthetic accounts. Log: ${logPath}`);

    const runner = spawn(
        'node',
        [
            vitestCli,
            'run',
            '--config',
            'vitest.integration.config.ts',
            ...selected.map(([file]) => `test/${file}`),
            '--testTimeout=30000',
            '--hookTimeout=30000',
            '--maxWorkers=1',
            '--passWithNoTests=false',
            '--reporter=json',
            `--outputFile=${reportPath}`,
        ],
        {
            cwd: service,
            env: {
                ...process.env,
                SEED: 'a'.repeat(64),
                TESTCONTAINERS_REUSE_ENABLE: 'false',
            },
            stdio: ['ignore', log, log],
        }
    );
    const interrupt = (): void => {
        runner.kill('SIGINT');
    };
    process.on('SIGINT', interrupt);
    process.on('SIGTERM', interrupt);
    const started = Date.now();
    const progress = setInterval(() => {
        console.log(`Still running (${Math.round((Date.now() - started) / 1000)}s)...`);
    }, 15_000);
    let exitCode: number;
    try {
        exitCode = await new Promise<number>((resolve, reject) => {
            runner.once('error', reject);
            runner.once('close', (code, signal) => resolve(code ?? (signal ? 130 : 1)));
        });
    } finally {
        clearInterval(progress);
        closeSync(log);
        process.off('SIGINT', interrupt);
        process.off('SIGTERM', interrupt);
    }

    let report: TestReport;
    try {
        report = JSON.parse(readFileSync(reportPath, 'utf8'));
    } catch {
        console.error(`The runner stopped before producing results. Inspect ${logPath}`);
        return exitCode || 1;
    }
    for (const [file, label] of selected) {
        const suite = report.testResults.find(result => basename(result.name) === file);
        const passed =
            suite?.assertionResults.filter(result => result.status === 'passed').length ?? 0;
        const complete = suite?.status === 'passed' && passed > 0;
        console.log(`${complete ? 'PASS' : 'FAIL'} ${label}: ${passed} checks passed`);
        for (const test of suite?.assertionResults ?? []) {
            if (test.status === 'failed') {
                console.error(`  ${test.fullName}\n${test.failureMessages.join('\n')}`);
            }
        }
    }
    const success =
        exitCode === 0 &&
        report.success &&
        report.numPassedTests > 0 &&
        report.numFailedTests === 0 &&
        report.numPendingTests === 0 &&
        selected.every(([file]) =>
            report.testResults.some(
                result =>
                    basename(result.name) === file &&
                    result.status === 'passed' &&
                    result.assertionResults.length > 0
            )
        );
    console.log(
        `\n${success ? 'PASS' : 'FAIL'} Referral QA: ${report.numPassedTests} passed, ${report.numFailedTests} failed, ${report.numPendingTests} skipped.`
    );
    console.log(`Results: ${reportPath}\nFull log: ${logPath}`);
    return success ? 0 : exitCode || 1;
};

main()
    .then(code => {
        process.exitCode = code;
    })
    .catch(error => {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 1;
    });

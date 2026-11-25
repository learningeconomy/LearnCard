#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.includes('--help')) {
    console.log(`Usage: node scripts/review-lc2233.mjs [--output-dir NEW_DIRECTORY]

Reproduce the fixture request counts and run focused cache/correctness tests.
Requires the repo's Node version and bun install --frozen-lockfile first.
Uses fixtures, not a staging account. Does not deploy or run the full CI catalog.
Reports are retained in a fresh temporary directory unless --output-dir is given.`);
    process.exit(0);
}

const main = () => {
    if (args.length && (args.length !== 2 || args[0] !== '--output-dir' || !args[1])) {
        throw new Error('Unknown arguments. Run with --help for usage.');
    }
    const [major, minor] = process.versions.node.split('.').map(Number);
    if (major !== 24 || minor < 12) {
        throw new Error('Use Node 24.12–24.x (see .nvmrc), then rerun this command.');
    }
    const vitest = join(root, 'node_modules/vitest/vitest.mjs');
    if (!existsSync(vitest)) {
        throw new Error(
            'Dependencies missing. Run bun install --frozen-lockfile at the repo root.'
        );
    }
    // Refuse existing output directories so an old report cannot masquerade as a new pass.
    const output = args.length ? resolve(args[1]) : mkdtempSync(join(tmpdir(), 'lc2233-review-'));
    if (args.length) mkdirSync(output, { recursive: false });
    const registryOutput = join(output, 'registry-requests.json');
    const groups = [
        {
            name: 'credential-consent-registry',
            directory: 'packages/learn-card-base',
            tests: [
                'src/react-query/queries/credentialResolution.test.ts',
                'src/react-query/queries/vcQueries.performance.test.tsx',
                'src/react-query/queries/idCredentials.test.tsx',
                'src/react-query/queries/consentedContracts.test.ts',
                'src/react-query/queries/issuerRegistry.test.ts',
                'src/react-query/queries/issuerRegistry.performance.test.ts',
                'src/react-query/mutations/networkConsent.performance.test.tsx',
                'src/react-query/mutations/syncConsentFlow.performance.test.tsx',
            ],
            minimumPassed: 8,
        },
        {
            name: 'in-flight-profile-reads',
            directory: 'packages/plugins/learn-card-network',
            tests: ['src/test/index.test.ts', '-t', 'concurrent profile reads'],
            minimumPassed: 2,
        },
    ];
    const head = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
    const status = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' });
    const summary = {
        head: head.status === 0 ? head.stdout.trim() : null,
        workingTreeClean: status.status === 0 ? !status.stdout.trim() : null,
        startedAt: new Date().toISOString(),
        node: process.versions.node,
        scope: 'Focused fixture/unit tests; not a live browser benchmark, typecheck, or full CI run.',
        groups: [],
    };
    console.log(`LC-2233 reviewer check · head ${summary.head ?? 'unknown'}\nReports: ${output}`);
    for (const group of groups) {
        const selectedFiles = group.tests
            .filter(argument => argument.startsWith('src/'))
            .map(file => join(root, group.directory, file));
        for (const file of selectedFiles) {
            if (!existsSync(file)) throw new Error(`Required test file is missing: ${file}`);
        }
        console.log(`\nChecking ${group.name}…`);
        const report = join(output, `${group.name}.json`);
        const child = spawnSync(
            process.execPath,
            [
                '--no-experimental-webstorage',
                '--conditions=development',
                vitest,
                'run',
                ...group.tests,
                '--maxWorkers=2',
                '--passWithNoTests=false',
                '--typecheck.enabled=false',
                '--reporter=default',
                '--reporter=json',
                `--outputFile=${report}`,
            ],
            {
                cwd: join(root, group.directory),
                stdio: 'inherit',
                env: { ...process.env, LC2233_EVIDENCE_JSON: registryOutput },
            }
        );
        if (child.error) throw child.error;
        if (child.status !== 0) {
            throw new Error(
                `${group.name} failed (${child.signal ?? child.status}); see output above.`
            );
        }
        const result = JSON.parse(readFileSync(report, 'utf8'));
        const reportedFiles = new Set(result.testResults.map(suite => resolve(suite.name)));
        if (
            !result.success ||
            result.numPassedTests < group.minimumPassed ||
            selectedFiles.some(file => !reportedFiles.has(file))
        ) {
            throw new Error(`${group.name} did not run the expected checks; inspect ${report}.`);
        }
        summary.groups.push({
            name: group.name,
            passed: result.numPassedTests,
            unselectedOrSkipped: result.numPendingTests,
            report,
        });
    }
    const registry = JSON.parse(readFileSync(registryOutput, 'utf8'));
    console.log('\nControlled registry comparison (16 distinct issuers):');
    console.table({
        'Shared documents': {
            before: registry.before.sharedDocuments,
            after: registry.after.sharedDocuments,
        },
        'Issuer-specific lookups': {
            before: registry.before.issuerLookups,
            after: registry.after.issuerLookups,
        },
        'Total requests': { before: registry.before.total, after: registry.after.total },
    });
    console.log(`Same issuer metadata: ${registry.sameIssuerMetadata}`);
    console.log(`Additional warm-repeat requests: ${registry.warmRepeatAdditionalRequests}`);
    console.log(
        'These are fixture request counts, not measured mobile speed or server CPU savings.'
    );
    summary.registry = registry;
    summary.completedAt = new Date().toISOString();
    writeFileSync(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
    console.log(
        `\nPASS · ${summary.groups.reduce((sum, group) => sum + group.passed, 0)} focused tests. Summary: ${join(output, 'summary.json')}`
    );
};

try {
    main();
} catch (error) {
    console.error(
        `\nReviewer check failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
}

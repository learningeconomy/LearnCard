const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { resolve } = require('node:path');

const workflow = JSON.parse(
    execFileSync(
        'ruby',
        [
            '-rjson',
            '-ryaml',
            '-e',
            'puts JSON.generate(YAML.load_file(ARGV.fetch(0), aliases: true))',
            resolve(__dirname, '../workflows/mock-e2e.yml'),
        ],
        { encoding: 'utf8' }
    )
);
const steps = workflow.jobs['mock-e2e'].steps;
const eligibility = steps.findIndex(step => step.id === 'eligibility');
const setup = steps.findIndex(step => step.uses === './.github/actions/setup');
const cache = steps.find(step => step.uses === 'actions/cache@v6');
const install = steps.find(step => step.name === 'Install Playwright browser and OS dependencies');
const full = steps.find(step => step.name === 'Run full mocked E2E');
assert.ok(eligibility >= 0 && eligibility < setup, 'eligibility must precede dependency install');
assert.ok(
    steps.findIndex(step => step.id === 'browser') > setup,
    'identity must use installed Playwright'
);
for (const step of steps.slice(setup)) {
    assert.match(step.if, /steps\.eligibility\.outputs\.run_e2e == 'true'/, step.name);
}
assert.equal(cache.with.key, '${{ steps.browser.outputs.key }}');
assert.equal(cache.with['restore-keys'], undefined, 'no incompatible fallback browser cache');
assert.match(install.run, /playwright install --with-deps firefox/);
assert.doesNotMatch(
    install.if,
    /cache-hit/,
    'OS packages and cache repair run even on an exact hit'
);
assert.equal(full.run, 'bunx nx run learn-card-app:test-mock');
assert.equal(steps.filter(step => /nx (affected|run)/.test(step.run ?? '')).length, 1);
assert.match(workflow.concurrency.group, /workflow_dispatch.*github\.run_id/);
assert.match(steps.find(step => step.name === 'Upload Playwright report').if, /always\(\)/);
assert.deepEqual(workflow.permissions, { contents: 'read' });
assert.equal(
    steps.find(step => step.uses?.startsWith('actions/checkout@')).with['persist-credentials'],
    false
);
assert.equal(
    steps.some(step => step.run?.includes('--test scripts/mock-e2e-ci.test.cjs')),
    false,
    'policy regressions belong in Lint, not the mock check before eligibility'
);
const lint = JSON.parse(
    execFileSync(
        'ruby',
        [
            '-rjson',
            '-ryaml',
            '-e',
            'puts JSON.generate(YAML.load_file(ARGV.fetch(0), aliases: true))',
            resolve(__dirname, '../workflows/lint.yml'),
        ],
        { encoding: 'utf8' }
    )
);
assert.ok(
    lint.jobs.RepositoryContracts.steps.some(
        step => step.run === 'node --test scripts/mock-e2e-ci.test.cjs'
    )
);
console.log('Mock E2E setup/eligibility/cache/full-suite contracts passed.');

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '../..');
const load = name => yaml.load(readFileSync(path.join(root, '.github/workflows', name), 'utf8'));
const deploy = load('deploy.yml');
const recovery = load('capgo-recovery.yml');
const determine = deploy.jobs['determine-affected'];

test('recovery is isolated from the standard deploy menu and fixes the production frontend target', () => {
    assert.equal(deploy.on.workflow_dispatch.inputs['capgo-bundle-version'], undefined);
    assert.equal(recovery.on.workflow_dispatch.inputs['recovery-version'].required, true);
    const call = recovery.jobs.deploy;
    assert.equal(call.needs, 'validate');
    assert.equal(call.uses, './.github/workflows/deploy.yml');
    assert.deepEqual(call.with, {
        'target-environment': 'production',
        'deploy-frontend': true,
        'capgo-bundle-version': '${{ inputs.recovery-version }}',
    });
    assert.match(deploy.jobs['deploy-frontend'].if, /inputs\.deploy-frontend == true/);
    assert.match(deploy.jobs['deploy-frontend'].concurrency.group, /matrix\.environment/);
});

test('recovery preflight rejects blank and invalid versions before invoking deploy', () => {
    const step = recovery.jobs.validate.steps.find(
        item => item.name === 'Validate recovery version'
    );
    const { version } = JSON.parse(
        readFileSync(path.join(root, 'apps/learn-card-app/package.json'))
    );
    const run = recoveryVersion =>
        spawnSync('bash', ['-e', '-c', step.run], {
            cwd: root,
            env: {
                ...process.env,
                RECOVERY_VERSION: recoveryVersion,
                TARGET_ENVIRONMENT: 'production',
                DEPLOY_FRONTEND: 'true',
            },
        });
    assert.notEqual(run('').status, 0);
    assert.notEqual(run('not-a-version').status, 0);
    assert.equal(run(`${version}-recovery.1`).status, 0);
    const validation = determine.steps.findIndex(
        item => item.name === 'Validate CapGo recovery input'
    );
    assert.ok(
        validation >= 0 &&
            validation < determine.steps.findIndex(item => item.id === 'check_manual')
    );
});

test('manual deployment matrix selects each requested environment', () => {
    const script = determine.steps.find(item => item.id === 'set-env').run;
    const cases = [
        ['production', 'learn-card-app-production', true],
        ['staging', 'learn-card-app-staging', false],
        ['scouts', 'scout-app-production', true],
        ['scouts-staging', 'scout-app-staging', false],
        ['vetpass', 'vetpass-app-production', false],
        ['vetpass-staging', 'vetpass-app-staging', false],
    ];
    for (const [target, environment, capgo] of cases) {
        const dir = mkdtempSync(path.join(tmpdir(), 'capgo-matrix-'));
        try {
            const output = path.join(dir, 'output');
            const rendered = script.replace(/\$\{\{\s*(.*?)\s*\}\}/g, (_, expression) => {
                if (expression.trim() === 'github.event_name') return 'workflow_dispatch';
                if (expression.trim() === 'inputs.target-environment') return target;
                return '';
            });
            const result = spawnSync('bash', ['-e', '-c', rendered], {
                cwd: root,
                env: { ...process.env, GITHUB_OUTPUT: output },
                encoding: 'utf8',
            });
            assert.equal(result.status, 0, result.stderr);
            const lines = Object.fromEntries(
                readFileSync(output, 'utf8')
                    .trim()
                    .split('\n')
                    .map(line => {
                        const separator = line.indexOf('=');
                        return [line.slice(0, separator), line.slice(separator + 1)];
                    })
            );
            assert.equal(lines.frontend_matrix_has_legs, 'true');
            assert.deepEqual(
                JSON.parse(lines.frontend_deployment_matrix).include.map(leg => [
                    leg.environment,
                    leg.capgo,
                ]),
                [[environment, capgo]]
            );
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    }
});

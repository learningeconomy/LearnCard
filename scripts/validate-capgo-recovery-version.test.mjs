import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('./validate-capgo-recovery-version.mjs', import.meta.url));
const { version } = JSON.parse(
    readFileSync(new URL('../apps/learn-card-app/package.json', import.meta.url), 'utf8')
);
const validate = (recovery, env = {}) =>
    spawnSync(process.execPath, [script], {
        env: {
            ...process.env,
            RECOVERY_VERSION: recovery,
            TARGET_ENVIRONMENT: 'production',
            DEPLOY_FRONTEND: 'true',
            ...env,
        },
        encoding: 'utf8',
    });

test('accepts a recovery prerelease without reserving a future release version', () => {
    assert.equal(validate(`${version}-recovery.3`).status, 0);
    assert.equal(validate('', { TARGET_ENVIRONMENT: 'scouts' }).status, 0);
});

for (const recovery of [
    version,
    '999.999.999',
    '999.999.999-recovery.1',
    `${version}-recovery.0`,
    `${version}-recovery.01`,
    `${version}-recovery.1+metadata`,
    `${version}-recovery.1\n`,
    `${version}-recovery.1\necho unexpected`,
]) {
    test(`rejects recovery version ${JSON.stringify(recovery)}`, () => {
        const result = validate(recovery);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /Do not reserve a future release version/);
    });
}

test('rejects wrong targets and deselected frontend before deploying', () => {
    for (const env of [
        { TARGET_ENVIRONMENT: 'scouts' },
        { TARGET_ENVIRONMENT: 'staging' },
        { DEPLOY_FRONTEND: 'false' },
    ]) {
        const result = validate(`${version}-recovery.3`, env);
        assert.notEqual(result.status, 0);
        assert.match(result.stderr, /requires target production and Deploy Frontend/);
    }
});

test('workflow validates before exposing flags consumed by deployment jobs', () => {
    const workflow = readFileSync(
        new URL('../.github/workflows/deploy.yml', import.meta.url),
        'utf8'
    );
    assert.ok(
        workflow.indexOf('run: node scripts/validate-capgo-recovery-version.mjs') <
            workflow.indexOf('id: check_manual')
    );
});

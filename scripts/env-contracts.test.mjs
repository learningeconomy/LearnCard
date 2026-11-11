import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const moduleUrl = fileURLToPath(new URL('./env-contracts.ts', import.meta.url));
const repoRoot = fileURLToPath(new URL('..', import.meta.url));

const probe = snippet => {
    const program = `
        const module = await import(${JSON.stringify(moduleUrl)});
        const { environmentContracts, validateEnvironmentExamples, loadStageConfigKeys } = module;
        const emit = value => console.log('__RESULT__' + JSON.stringify(value));
        ${snippet}
    `;

    const result = spawnSync('bun', ['--conditions=development', '-e', program], {
        cwd: repoRoot,
        encoding: 'utf8',
        timeout: 120_000,
    });

    assert.equal(result.status, 0, `probe exited non-zero:\n${result.stderr}\n${result.stdout}`);

    const line = result.stdout.split(/\r?\n/).find(entry => entry.startsWith('__RESULT__'));
    assert.ok(line, `probe produced no result line:\n${result.stdout}`);

    return JSON.parse(line.slice('__RESULT__'.length));
};

test('the repository examples satisfy the focused config-model scanner', () => {
    const { errors, contractCount } = probe(`
        emit({ errors: validateEnvironmentExamples(), contractCount: environmentContracts.length });
    `);

    assert.deepEqual(errors, []);
    assert.equal(contractCount, 5);
});

test('required schema keys stay enforced and optional defaults may be omitted', () => {
    const report = probe(`
        const brain = environmentContracts.find(c => c.project === 'brain-service');
        const values = module.parseEnvironmentExample(brain.examplePath);
        const required = Object.entries(brain.shape)
            .filter(([, field]) => !field.safeParse(undefined).success)
            .map(([key]) => key);
        emit({
            seedRequired: required.includes('SEED'),
            neo4jRequired: required.includes('NEO4J_PASSWORD'),
            undocumentedRequired: required.filter(
                key => !brain.unmanagedKeys?.includes(key) && !(key in values)
            ),
            optionalDefaultOmitted:
                brain.shape.INBOX_BATCH_ITEMS_PER_HOUR.safeParse(undefined).success &&
                !('INBOX_BATCH_ITEMS_PER_HOUR' in values),
        });
    `);

    assert.equal(report.seedRequired, true);
    assert.equal(report.neo4jRequired, true);
    assert.deepEqual(report.undocumentedRequired, []);
    assert.equal(report.optionalDefaultOmitted, true);
});

test('bootstrap controls and checked-in stage keys are recognized without arbitrary skips', () => {
    const report = probe(`
        const brain = environmentContracts.find(c => c.project === 'brain-service');
        const cloud = environmentContracts.find(c => c.project === 'learn-cloud-service');
        const stageKeys = loadStageConfigKeys(brain.stageConfigPaths);
        const allowed = (contract, key, keys) =>
            Boolean(contract.unmanagedKeys?.includes(key)) ||
            Boolean(contract.bootstrapKeys?.includes(key)) ||
            keys.has(key) ||
            Object.keys(contract.shape).includes(key);
        emit({
            bootstrapRecognized: brain.bootstrapKeys?.includes('CONFIG_STAGE'),
            stageKeyRecognized: stageKeys.has('SHARE_LINK_MAINTENANCE_NAMESPACE'),
            cloudShareContentStageKey: loadStageConfigKeys(cloud.stageConfigPaths).has(
                'SHARE_CONTENT_AUDIENCE'
            ),
            typoRejected: !allowed(brain, 'SHARE_LINK_MAINTENANCE_NAMSPACE', stageKeys),
            bogusRejected: !allowed(brain, 'TOTALLY_BOGUS_KEY', stageKeys),
        });
    `);

    assert.equal(report.bootstrapRecognized, true);
    assert.equal(report.stageKeyRecognized, true);
    assert.equal(report.cloudShareContentStageKey, true);
    assert.equal(report.typoRejected, true);
    assert.equal(report.bogusRejected, true);
});

test('runtime value validation is preserved and the lca-api reference contract is untouched', () => {
    const report = probe(`
        const brain = environmentContracts.find(c => c.project === 'brain-service');
        const lca = environmentContracts.find(c => c.project === 'lca-api');
        const values = module.parseEnvironmentExample(brain.examplePath);
        const blanked = { ...values, SEED: '', NEO4J_URI: '', NEO4J_USERNAME: '', NEO4J_PASSWORD: '' };
        emit({
            rejectsBlankedSecrets: !brain.schema.safeParse(blanked).success,
            lcaHasNoBootstrapKeys: lca.bootstrapKeys === undefined,
            lcaHasNoStageConfigPaths: lca.stageConfigPaths === undefined,
        });
    `);

    assert.equal(report.rejectsBlankedSecrets, true);
    assert.equal(report.lcaHasNoBootstrapKeys, true);
    assert.equal(report.lcaHasNoStageConfigPaths, true);
});

test('the validator reports missing required inputs and unknown example keys', () => {
    const report = probe(`
        const { z } = await import('zod');
        const brain = environmentContracts.find(c => c.project === 'brain-service');
        const missing = validateEnvironmentExamples([{
            ...brain, shape: { ...brain.shape, REQUIRED_TEST_INPUT: z.string() },
        }]);
        const { SEED, ...withoutSeed } = brain.shape;
        const unknown = validateEnvironmentExamples([{ ...brain, shape: withoutSeed }]);
        emit({
            missing: missing.some(error => error.includes('does not document required REQUIRED_TEST_INPUT')),
            unknown: unknown.some(error => error.includes('documents unknown key SEED')),
        });
    `);
    assert.deepEqual(report, { missing: true, unknown: true });
});

test('stage values are schema-validated, not only treated as documented key names', () => {
    const report = probe(`
        const brain = environmentContracts.find(c => c.project === 'brain-service');
        const errors = validateEnvironmentExamples([{
            ...brain,
            schema: brain.schema.refine(value => !value.CREDENTIAL_REFRESH_ENABLED, 'test rejects enabled refresh'),
        }]);
        emit({
            dev: errors.some(error => error.includes('config.dev.json') && error.includes('test rejects enabled refresh')),
            production: errors.some(error => error.includes('config.production.json') && error.includes('test rejects enabled refresh')),
            example: errors.some(error => error.startsWith(brain.examplePath)),
        });
    `);
    assert.deepEqual(report, { dev: true, production: true, example: false });
});

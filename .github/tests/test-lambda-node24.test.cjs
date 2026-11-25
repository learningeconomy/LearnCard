/* global require, __dirname, console */
/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS configuration contract. */
// brain-service and learn-cloud-service Lambda runtime contract (LC-2308).
// LCA's equivalent lives in test-lca-node24.test.cjs.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '../..');
const PLUGIN = '../../../scripts/serverless-node24-runtime.cjs';
const workflow = yaml.load(
    fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8')
);

const services = [
    { dir: 'brain-service', job: 'deploy-brain-service' },
    { dir: 'learn-cloud-service', job: 'deploy-learn-cloud' },
];

for (const { dir, job } of services) {
    const service = path.join(root, 'services/learn-card-network', dir);
    const load = file => yaml.load(fs.readFileSync(path.join(service, file), 'utf8'));

    for (const file of ['serverless.yml', 'serverless-local.yml']) {
        const config = load(file);
        assert.equal(config.provider.runtime, 'nodejs24.x', `${dir}/${file} runtime`);
        assert.equal(config.custom.esbuild.target, 'node24', `${dir}/${file} esbuild target`);
        assert.equal(
            config.plugins[0],
            PLUGIN,
            `${dir}/${file} must load the Node 24 schema plugin`
        );
        assert.ok(fs.existsSync(path.resolve(service, config.plugins[0])), `${dir}/${file} plugin`);
        for (const fn of Object.values(config.functions ?? {}))
            assert.equal(fn.runtime, undefined, `${dir}/${file} functions inherit the provider`);
        assert.notEqual(config.configValidationMode, 'error');
    }

    const deployed = load('serverless.yml');
    assert.deepEqual(deployed.layers.didkitNative.compatibleRuntimes, ['nodejs24.x']);
    assert.deepEqual(deployed.layers.didkitNative.compatibleArchitectures, ['x86_64']);

    // serverless-esbuild < 1.57 does not know nodejs24.x and aborts with "not a supported runtime".
    const manifest = require(path.join(service, 'package.json'));
    assert.equal(manifest.devDependencies['serverless-esbuild'], '1.57.2');
    assert.ok(
        manifest.scripts['serverless-deploy'].includes(
            'prepare-didkit-native-layer.cjs && node ../../../scripts/verify-node24-didkit-layer.cjs && serverless deploy'
        ),
        `${dir} must verify the native layer before deploying`
    );

    const steps = workflow.jobs[job].steps;
    const nodeIndex = steps.findIndex(step => step.name === 'Set up Lambda Node 24 runtime tools');
    assert.ok(nodeIndex >= 0, `${job} must set up Node 24 before the native layer preflight`);
    assert.equal(steps[nodeIndex].with['node-version-file'], '.nvmrc');
    assert.ok(
        nodeIndex < steps.findIndex(step => step.uses === './.github/actions/setup'),
        `${job} sets up Node before the composite action`
    );
}

assert.match(fs.readFileSync(path.join(root, '.nvmrc'), 'utf8'), /^v24\./);
console.log('brain-service and learn-cloud-service Node 24 Lambda contracts passed');

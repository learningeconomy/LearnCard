/* global require, __dirname, console, process */
/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS configuration contract. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');
const os = require('node:os');

const root = path.resolve(__dirname, '../..');
const service = path.join(root, 'services/learn-card-network/lca-api');
const config = yaml.load(fs.readFileSync(path.join(service, 'serverless.yml'), 'utf8'));
assert.equal(config.provider.runtime, 'nodejs24.x');
assert.equal(config.custom.esbuild.target, 'node24');
assert.deepEqual(config.layers.didkitNative.compatibleRuntimes, ['nodejs24.x']);
assert.deepEqual(config.layers.didkitNative.compatibleArchitectures, ['x86_64']);
for (const fn of Object.values(config.functions)) assert.equal(fn.runtime, undefined);
const local = yaml.load(fs.readFileSync(path.join(service, 'serverless-local.yml'), 'utf8'));
assert.equal(local.provider.runtime, 'nodejs24.x');
assert.equal(local.custom.esbuild.target, 'node24');
const manifest = require(path.join(service, 'package.json'));
const workflow = yaml.load(
    fs.readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8')
);
assert.equal(
    workflow.jobs['deploy-lca-api'].steps.find(
        step => step.name === 'Set up LCA Node 24 runtime tools'
    ).with['node-version'],
    '24.12.0'
);
for (const [name, job] of Object.entries(workflow.jobs)) {
    if (name !== 'deploy-lca-api')
        assert.ok(!job.steps?.some(step => step.name === 'Set up LCA Node 24 runtime tools'));
}
assert.equal(manifest.devDependencies['serverless-esbuild'], '1.57.2');
assert.ok(
    manifest.scripts['serverless-deploy'].includes(
        'node scripts/verify-node24-layer.cjs && serverless deploy'
    )
);
assert.match(fs.readFileSync(path.join(service, 'bundle.mjs'), 'utf8'), /target: 'node24'/);
assert.equal(
    require('serverless-esbuild/dist/helper').providerRuntimeMatcher.aws['nodejs24.x'],
    'node24'
);

const RuntimePlugin = require(path.join(service, 'scripts/node24-runtime.cjs'));
const schema = { definitions: { awsLambdaRuntime: { enum: ['nodejs20.x'] } } };
new RuntimePlugin({ configSchemaHandler: { schema } });
new RuntimePlugin({ configSchemaHandler: { schema } });
assert.deepEqual(schema.definitions.awsLambdaRuntime.enum, ['nodejs20.x', 'nodejs24.x']);
assert.ok(!schema.definitions.awsLambdaRuntime.enum.includes('nodejs99.x'));

const policy = config.resources.Resources.LcaDevBedrockGenerationPolicy;
assert.equal(policy.Type, 'AWS::IAM::Policy');
assert.equal(policy.Condition, 'LcaDevBedrockGeneration');
assert.deepEqual(policy.Properties.Roles, [{ Ref: 'SigningAuthorityExecutionRole' }]);
const condition = config.resources.Conditions.LcaDevBedrockGeneration;
assert.deepEqual(condition, {
    'Fn::And': [
        { 'Fn::Equals': ['${sls:stage}', 'dev'] },
        { 'Fn::Equals': [{ Ref: 'AWS::Region' }, 'us-east-1'] },
    ],
});
const enabled = (stage, region) =>
    stage === condition['Fn::And'][0]['Fn::Equals'][1] &&
    region === condition['Fn::And'][1]['Fn::Equals'][1];
assert.equal(enabled('dev', 'us-east-1'), true);
assert.equal(enabled('production', 'us-east-1'), false);
assert.equal(enabled('dev', 'us-west-2'), false);

const render = (value, account) => {
    if (Array.isArray(value)) return value.map(item => render(item, account));
    if (value && typeof value === 'object') {
        if (value['Fn::Sub'])
            return value['Fn::Sub']
                .replaceAll('${AWS::AccountId}', account)
                .replaceAll('${AWS::Partition}', 'aws');
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, render(item, account)])
        );
    }
    return value;
};
for (const account of ['206533012615', '111122223333']) {
    const statements = render(policy.Properties.PolicyDocument, account).Statement;
    assert.equal(statements.length, 5);
    const [bearer, profiles, project, sol, luna] = statements;
    assert.deepEqual(bearer.Condition, {
        StringEquals: { 'bedrock:bearerTokenType': 'SHORT_TERM' },
    });
    assert.equal(bearer.Resource, '*');
    assert.equal(bearer.Action, 'bedrock:CallWithBearerToken');
    assert.deepEqual(profiles.Action, ['bedrock:GetInferenceProfile', 'bedrock:InvokeModel']);
    assert.deepEqual(
        profiles.Resource,
        ['us.openai.gpt-6.1-sol', 'us.openai.gpt-6-luna'].map(
            id => `arn:aws:bedrock:us-east-1:${account}:inference-profile/${id}`
        )
    );
    assert.equal(profiles.Condition, undefined);
    assert.equal(project.Resource, `arn:aws:bedrock:us-east-1:${account}:project/default`);
    assert.deepEqual(project.Condition.StringEquals['bedrock:ModelArn'], profiles.Resource);
    for (const [statement, model, profile] of [
        [sol, 'openai.gpt-6.1-sol', profiles.Resource[0]],
        [luna, 'openai.gpt-6-luna', profiles.Resource[1]],
    ]) {
        assert.equal(statement.Action, 'bedrock:InvokeModel');
        assert.deepEqual(
            statement.Resource,
            ['us-east-1', 'us-east-2', 'us-west-2'].map(
                region => `arn:aws:bedrock:${region}::foundation-model/${model}`
            )
        );
        assert.deepEqual(statement.Condition, {
            StringEquals: { 'bedrock:InferenceProfileArn': profile },
        });
    }
}
const { verifyLayer } = require(path.join(service, 'scripts/verify-node24-layer.cjs'));
assert.throws(() => verifyLayer('/missing', 20), /Node 24/);
assert.throws(() => verifyLayer('/missing', 24), /Missing Lambda/);
console.log('LCA Node 24 runtime, native preflight and dev Bedrock policy contracts passed');

// Exercise actual Serverless plugin loading and strict schema validation without
// packaging, credentials, deployment, or telemetry network access.
const smoke = async () => {
    const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'lca-node24-schema-'));
    const previousCache = process.env.SLS_SCHEMA_CACHE_BASE_DIR;
    process.env.SLS_SCHEMA_CACHE_BASE_DIR = temporary;
    const previousFetch = globalThis.fetch;
    const clients = ['node:http', 'node:https'].map(name => require(name));
    const saved = clients.map(client => [client.request, client.get]);
    const forbidden = () => {
        throw new Error('Network forbidden in runtime schema test');
    };
    clients.forEach(client => {
        client.request = forbidden;
        client.get = forbidden;
    });
    globalThis.fetch = forbidden;
    try {
        const Serverless = require('serverless');
        const configuration = {
            service: 'lca-node24-schema',
            frameworkVersion: '3',
            configValidationMode: 'error',
            provider: { name: 'aws', runtime: 'nodejs24.x', region: 'us-east-1' },
            plugins: [path.join(service, 'scripts/node24-runtime.cjs')],
            dashboard: { disableMonitoring: true },
            functions: {},
            layers: {
                native: {
                    path: temporary,
                    compatibleRuntimes: ['nodejs24.x'],
                    compatibleArchitectures: ['x86_64'],
                },
            },
        };
        const serverless = new Serverless({
            serviceDir: temporary,
            configurationFilename: 'serverless.json',
            configuration,
            commands: [],
            options: { help: true },
        });
        await serverless.init();
        await serverless.configSchemaHandler.validateConfig(configuration);
        configuration.provider.runtime = 'nodejs99.x';
        await assert.rejects(
            serverless.configSchemaHandler.validateConfig(configuration),
            /configuration/i
        );
        console.log('Actual Serverless strict Node 24 function/layer schema smoke passed');
    } finally {
        clients.forEach((client, index) => {
            [client.request, client.get] = saved[index];
        });
        globalThis.fetch = previousFetch;
        if (previousCache === undefined) delete process.env.SLS_SCHEMA_CACHE_BASE_DIR;
        else process.env.SLS_SCHEMA_CACHE_BASE_DIR = previousCache;
        fs.rmSync(temporary, { recursive: true, force: true });
    }
};
smoke().catch(error => {
    console.error(error);
    process.exitCode = 1;
});

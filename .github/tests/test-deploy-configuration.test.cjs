const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '../..');
const directory = path.join(root, '.github/workflows');
const workflows = new Map();
// Unlike permissive YAML readers, js-yaml rejects repeated mapping keys.
// Check every workflow so merging independent env additions cannot disable deploys.
for (const filename of fs.readdirSync(directory).filter(file => /\.ya?ml$/.test(file))) {
    const source = fs.readFileSync(path.join(directory, filename), 'utf8');
    workflows.set(filename, yaml.load(source, { filename }));
}

const deploySource = fs.readFileSync(path.join(directory, 'deploy.yml'), 'utf8');
const duplicate = '                  RUNTIME_SECRETS_ID: ${{ vars.RUNTIME_SECRETS_ID }}';
assert(deploySource.includes(duplicate));
assert.throws(
    () => yaml.load(deploySource.replace(duplicate, `${duplicate}\n${duplicate}`)),
    /duplicated mapping key/,
    'the parser must reject a reintroduced deploy env duplicate'
);
const lca = workflows
    .get('deploy.yml')
    .jobs['deploy-lca-api'].steps.find(step => step.name === 'Deploy LCA API Service Lambda');
// Infra + non-secret deploy toggles that remain passed through GitHub vars.
for (const key of [
    'RUNTIME_SECRETS_ID',
    'OIDC_REDIRECT_URIS',
    'ESCROW_ENCLAVE_MODE',
    'ESCROW_RELAY_URL',
]) {
    assert.equal(lca.env[key], '${{ vars.' + key + ' }}');
}
// Credential fallbacks (used only when RUNTIME_SECRETS_ID is unset) and the OIDC exception.
for (const key of [
    'SEED',
    'MONGO_URI',
    'MONGO_DB_NAME',
    'AUTHORIZED_DIDS',
    'METABASE_SECRET_KEY',
    'OPENAI_API_KEY',
    'POSTMARK_SERVER_TOKEN',
    'SCOUTS_SSO_CLIENT_SECRET',
    'SENTRY_DSN',
    'GOOGLE_APPLICATION_CREDENTIAL',
    'LEARN_CLOUD_URL',
    'ESCROW_RELAY_AUTH_TOKEN',
    'ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON',
    'OIDC_CLIENT_SECRET',
]) {
    assert.equal(lca.env[key], '${{ secrets.' + key + ' }}', key);
}
// Checked-in per-stage config must NOT be plumbed through Lambda env any more.
for (const key of [
    'DOMAIN_NAME',
    'SENTRY_ENV',
    'POSTMARK_FROM_EMAIL',
    'POSTMARK_BRAND_NAME',
    'POSTMARK_LOGIN_CODE_TEMPLATE_ALIAS',
    'POSTMARK_ENDORSEMENT_REQUEST_TEMPLATE_ALIAS',
    'POSTMARK_RECOVERY_EMAIL_CODE_TEMPLATE_ALIAS',
    'POSTMARK_RECOVERY_KEY_TEMPLATE_ALIAS',
    'KEYCLOAK_ISSUERS',
    'KEYCLOAK_AUDIENCES',
    'KEYCLOAK_JWKS_URL_OVERRIDES',
    'OIDC_ISSUER',
    'OIDC_CLIENT_ID',
    'OIDC_SIGNING_KEY_SECRET_ID',
    'GOOGLE_OAUTH_CLIENT_IDS',
    'APPLE_OAUTH_CLIENT_IDS',
    'SA_SEED_ENCRYPT_WRITES',
    'SA_SEED_ALLOW_LEGACY_READ',
    'ESCROW_ENCLAVE_ACTIVE_KEY_ID',
    'ESCROW_HOLD_DURATION_MS',
    'ESCROW_HOLD_RESTART_MIN_AGE_MS',
]) {
    assert.equal(lca.env[key], undefined, key);
}
assert.equal(lca.env.OIDC_SIGNING_KEY_JWK, undefined);
const lcaServerless = yaml.load(
    fs.readFileSync(path.join(root, 'services/learn-card-network/lca-api/serverless.yml'), 'utf8')
);
assert.equal(lcaServerless.provider.environment, '${file(./serverless.function-env.cjs):provider}');
for (const name of ['trpc', 'api', 'swagger', 'didWeb', 'seedMigration']) {
    assert.equal(
        lcaServerless.functions[name].environment,
        '${file(./serverless.function-env.cjs):api}'
    );
}
const functionsWithRole = role =>
    Object.entries(lcaServerless.functions)
        .filter(([, fn]) => fn.role === role)
        .map(([name]) => name)
        .sort();
// Explicit roles replace, rather than inherit, the provider's generated default role.
assert.deepEqual(functionsWithRole(undefined), ['didWeb', 'swagger']);
assert.deepEqual(functionsWithRole('SigningAuthorityExecutionRole'), [
    'api',
    'seedMigration',
    'trpc',
]);
assert.deepEqual(functionsWithRole('OidcExecutionRole'), ['oidc']);
for (const name of ['didWeb', 'swagger']) {
    const fn = lcaServerless.functions[name];
    assert.equal(Object.hasOwn(fn, 'role'), false, name);
    assert.equal(
        fn.dependsOn,
        undefined,
        `${name} must not depend on the signing-authority KMS grant`
    );
    assert.deepEqual(fn.vpc, lcaServerless.functions.trpc.vpc, `${name} stays in the service VPC`);
}
assert.equal(
    lcaServerless.functions.oidc.environment,
    '${file(./serverless.function-env.cjs):oidc}'
);
assert.equal(lcaServerless.functions.oidc.handler, 'oidcLambda.handler');
const runtimeStatement = {
    Effect: 'Allow',
    Action: 'secretsmanager:GetSecretValue',
    Resource: {
        'Fn::Sub':
            'arn:${AWS::Partition}:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:lca-api/${sls:stage}/runtime-secrets-*',
    },
};
assert.deepEqual(lcaServerless.provider.iam, { role: { statements: [runtimeStatement] } });
const seedKeyStatements =
    lcaServerless.resources.Resources.SigningAuthoritySeedKey.Properties.KeyPolicy.Statement;
assert.deepEqual(
    seedKeyStatements.find(statement => statement.Sid === 'LcaApiSeedEncryption').Principal,
    { AWS: { 'Fn::GetAtt': ['SigningAuthorityExecutionRole', 'Arn'] } }
);
assert.deepEqual(
    seedKeyStatements.find(statement => statement.Sid === 'DenyOtherCryptographicPrincipals')
        .Condition,
    {
        ArnNotEquals: {
            'aws:PrincipalArn': { 'Fn::GetAtt': ['SigningAuthorityExecutionRole', 'Arn'] },
        },
    }
);
assert.deepEqual(
    lcaServerless.resources.Resources.SigningAuthorityExecutionRole.Properties.Policies.flatMap(
        policy => policy.PolicyDocument.Statement
    ),
    [runtimeStatement]
);
for (const [name, resource] of Object.entries(lcaServerless.resources.Resources)) {
    if (name !== 'SigningAuthorityExecutionRole') {
        assert(!JSON.stringify(resource).includes('/runtime-secrets-*'), name);
    }
}
// Function env must stay under Lambda's 4KB limit in both bundle and fallback modes.
// Uses the PRODUCTION checked-in stage (no keycloak/escrow) and realistic value lengths.
const lcaDir = path.join(root, 'services/learn-card-network/lca-api');
const functionEnv = require(path.join(lcaDir, 'serverless.function-env.cjs'));
const productionStage = JSON.parse(
    fs.readFileSync(path.join(lcaDir, 'config/config.production.json'), 'utf8')
);
// Fixed synthetic lengths, not deployed values. Count ALL provider keys, even empty ones.
const lengths = {
    LAMBDA_STAGE: 10,
    PORT: 4,
    REDIS_HOST: 120,
    REDIS_PORT: 4,
    RUNTIME_SECRETS_ID: 90,
    SA_SEED_KMS_KEY_ARN: 90,
    SEED: 64,
    MONGO_URI: 160,
    MONGO_DB_NAME: 40,
    AUTHORIZED_DIDS: 100,
    METABASE_SECRET_KEY: 64,
    OPENAI_API_KEY: 60,
    POSTMARK_SERVER_TOKEN: 40,
    SCOUTS_SSO_CLIENT_SECRET: 64,
    SENTRY_DSN: 100,
    GOOGLE_APPLICATION_CREDENTIAL: 2400,
    LEARN_CLOUD_URL: 60,
    ESCROW_RELAY_URL: 60,
    ESCROW_RELAY_AUTH_TOKEN: 64,
    ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON: 400,
    ESCROW_ENCLAVE_MODE: 8,
    OIDC_CLIENT_SECRET: 64,
    OIDC_REDIRECT_URIS: 200,
};
const placeholder = key => 'x'.repeat(lengths[key] ?? 40);
const size = env =>
    Object.entries(env).reduce(
        (total, [key, value]) =>
            total + Buffer.byteLength(key) + Buffer.byteLength(String(value)) + 8,
        0
    );
const withEnv = (overrides, run) => {
    const saved = {};
    for (const [key, value] of Object.entries(overrides)) {
        saved[key] = process.env[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
    }
    try {
        return run();
    } finally {
        for (const [key, value] of Object.entries(saved)) {
            if (value === undefined) delete process.env[key];
            else process.env[key] = value;
        }
    }
};
const infraKeys = ['LAMBDA_STAGE', 'PORT', 'REDIS_HOST', 'REDIS_PORT', 'SA_SEED_KMS_KEY_ARN'];
withEnv({ RUNTIME_SECRETS_ID: 'lca-api/dev/runtime-secrets' }, () => {
    const provider = functionEnv.provider({ options: { stage: 'production', httpPort: '5100' } });
    assert.deepEqual(Object.keys(provider).sort(), infraKeys);
    assert.equal(provider.LAMBDA_STAGE, 'production');
    assert.equal(provider.PORT, '5100');
    assert.deepEqual(provider.REDIS_HOST, {
        'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Address'],
    });
    assert.deepEqual(provider.SA_SEED_KMS_KEY_ARN, {
        'Fn::GetAtt': ['SigningAuthoritySeedKey', 'Arn'],
    });
});
// Even stale deployment variables for checked-in values must never reach Lambda env.
const stageEnv = Object.fromEntries(
    Object.keys(productionStage).map(key => [key, placeholder(key)])
);
// Production runs WITHOUT keycloak/escrow/oidc, so only these credentials are populated;
// the escrow and oidc fallbacks stay empty and drop out of the function environment.
const secretEnv = Object.fromEntries(
    [
        'SEED',
        'MONGO_URI',
        'MONGO_DB_NAME',
        'AUTHORIZED_DIDS',
        'METABASE_SECRET_KEY',
        'OPENAI_API_KEY',
        'POSTMARK_SERVER_TOKEN',
        'SCOUTS_SSO_CLIENT_SECRET',
        'SENTRY_DSN',
        'GOOGLE_APPLICATION_CREDENTIAL',
        'LEARN_CLOUD_URL',
    ].map(key => [key, placeholder(key)])
);
const emptied = Object.fromEntries(
    [
        'ESCROW_RELAY_URL',
        'ESCROW_RELAY_AUTH_TOKEN',
        'ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON',
        'ESCROW_ENCLAVE_MODE',
        'OIDC_CLIENT_SECRET',
        'OIDC_REDIRECT_URIS',
        'POSTHOG_API_KEY',
        'SA_SEED_LOCAL_KEK',
        'KEYCLOAK_JWKS_URL_OVERRIDES',
    ].map(key => [key, ''])
);
for (const [mode, bundleId] of [
    ['bundle', placeholder('RUNTIME_SECRETS_ID')],
    ['fallback', undefined],
]) {
    withEnv({ ...stageEnv, ...secretEnv, ...emptied, RUNTIME_SECRETS_ID: bundleId }, () => {
        const provider = functionEnv.provider({ options: { stage: 'production' } });
        // Resolve infrastructure references to realistic synthetic deployed lengths.
        for (const key of infraKeys) provider[key] = placeholder(key);
        for (const name of Object.keys(lcaServerless.functions)) {
            const scoped = name === 'oidc' ? functionEnv.oidc() : functionEnv.api();
            const combined = { ...provider, ...scoped };
            for (const key of Object.keys(productionStage))
                assert.equal(combined[key], undefined, key);
            if (mode === 'bundle') {
                const allowed = name === 'oidc' ? infraKeys : [...infraKeys, 'RUNTIME_SECRETS_ID'];
                assert.deepEqual(Object.keys(combined).sort(), [...allowed].sort(), name);
                assert(size(combined) < 1024, `${name}/bundle headroom`);
            }
            assert(size(combined) <= 4096, `${name}/${mode}: ${size(combined)} bytes`);
            console.log(
                `LCA Lambda env ${name}/${mode}: ${size(combined)} bytes (includes conservative per-entry overhead)`
            );
        }
    });
}
// The least-privilege OIDC function gets neither a bundle pointer nor API credentials.
withEnv({ SEED: 'x', MONGO_URI: 'x', MONGO_DB_NAME: 'x', RUNTIME_SECRETS_ID: 'bundle' }, () => {
    const env = { ...functionEnv.provider(), ...functionEnv.oidc() };
    for (const key of ['SEED', 'MONGO_URI', 'MONGO_DB_NAME', 'RUNTIME_SECRETS_ID'])
        assert.equal(env[key], undefined);
});

// Only the oidc function may read the private signing key: a dedicated role, no shared grant.
assert.equal(lcaServerless.functions.oidc.role, 'OidcExecutionRole');
for (const [name, fn] of Object.entries(lcaServerless.functions)) {
    if (name !== 'oidc') assert.notEqual(fn.role, 'OidcExecutionRole', name);
}
const oidcRole = lcaServerless.resources.Resources.OidcExecutionRole.Properties;
assert.deepEqual(
    oidcRole.Policies.flatMap(policy => policy.PolicyDocument.Statement),
    [
        {
            Effect: 'Allow',
            Action: 'secretsmanager:GetSecretValue',
            Resource: {
                'Fn::Sub':
                    'arn:${AWS::Partition}:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:lca-api/${sls:stage}/oidc-signing-jwk-*',
            },
        },
    ]
);
assert.deepEqual(
    oidcRole.ManagedPolicyArns,
    lcaServerless.resources.Resources.SigningAuthorityExecutionRole.Properties.ManagedPolicyArns,
    'the oidc role keeps the same VPC/logging/X-Ray baseline as the other custom role'
);

const workflow = workflows.get('keycloak-infra.yml');
const pluginInit = workflow.jobs.validate.steps.find(step => step.run === 'tflint --init');
assert(pluginInit, 'TFLint plugin initialization must be a separate step');
assert.equal(pluginInit.env.GITHUB_TOKEN, '${{ github.token }}');
assert.deepEqual(workflow.permissions, { contents: 'read' });
assert.equal(workflow.jobs.validate.env?.GITHUB_TOKEN, undefined);
assert(
    workflow.jobs.validate.steps.every(step => step === pluginInit || !step.env?.GITHUB_TOKEN),
    'the read-only GitHub token must be scoped to plugin initialization'
);
const steps = workflow.jobs.deploy.steps;
const resolver = steps.findIndex(step => step.run?.includes('resolve-bootstrap-secret.sh'));
assert(resolver > steps.findIndex(step => step.uses?.startsWith('aws-actions/configure-')));
for (const marker of [
    'check-release-order.sh',
    'aws ecr get-login-password',
    'deploy-image.sh',
    'terraform-plan.sh',
]) {
    assert(resolver < steps.findIndex(step => step.run?.includes(marker)), marker);
}
assert(resolver < steps.findIndex(step => step.uses?.startsWith('docker/build-push-action@')));
assert.equal(
    workflow.jobs.deploy.env.TF_VAR_bootstrap_admin_password_secret_arn,
    '${{ vars.KEYCLOAK_BOOTSTRAP_ADMIN_SECRET_ARN }}'
);
for (const [event, action, terraformRoot, expected] of [
    ['push', '', '', true],
    ['workflow_dispatch', 'promote', 'network', true],
    ['workflow_dispatch', 'plan', 'service', true],
    ['workflow_dispatch', 'apply', 'service', true],
    ['workflow_dispatch', 'plan', 'network', false],
    ['workflow_dispatch', 'apply', 'network', false],
]) {
    assert.equal(
        vm.runInNewContext(steps[resolver].if, {
            github: { event_name: event },
            inputs: { action, root: terraformRoot },
        }),
        expected,
        `${event}/${action}/${terraformRoot}`
    );
}
assert(
    workflow.jobs['build-image'].steps.some(step => step.run?.includes('test-bootstrap-secret.sh')),
    'offline discovery tests must run on Keycloak PRs'
);
console.log(
    `${workflows.size} workflows parsed strictly; deploy env preservation and Keycloak preflight routing passed.`
);

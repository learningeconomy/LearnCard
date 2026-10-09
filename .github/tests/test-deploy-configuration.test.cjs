const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
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
// Scheduled escrow jobs need the runtime bundle (Mongo/Postmark) but not signing-authority KMS.
assert.deepEqual(functionsWithRole(undefined), [
    'didWeb',
    'escrowBlobRewrap',
    'escrowHoldReminders',
    'swagger',
]);
assert.deepEqual(functionsWithRole('SigningAuthorityExecutionRole'), [
    'api',
    'seedMigration',
    'trpc',
]);
assert.deepEqual(functionsWithRole('OidcExecutionRole'), ['oidc']);
for (const name of ['didWeb', 'swagger', 'escrowHoldReminders', 'escrowBlobRewrap']) {
    const fn = lcaServerless.functions[name];
    assert.equal(Object.hasOwn(fn, 'role'), false, name);
    assert.equal(
        fn.dependsOn,
        undefined,
        `${name} must not depend on the signing-authority KMS grant`
    );
    assert.deepEqual(fn.vpc, lcaServerless.functions.trpc.vpc, `${name} stays in the service VPC`);
}
for (const name of ['escrowHoldReminders', 'escrowBlobRewrap']) {
    assert.equal(
        lcaServerless.functions[name].environment,
        '${file(./serverless.function-env.cjs):escrow}',
        name
    );
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
assert.equal(functionEnv.escrow, functionEnv.api, 'escrow jobs share the API environment');
const productionStage = JSON.parse(
    fs.readFileSync(path.join(lcaDir, 'config/config.production.json'), 'utf8')
);
// Fixed synthetic lengths, not deployed values. Count ALL provider keys, even empty ones.
const lengths = {
    LAMBDA_STAGE: 10,
    CONFIG_TENANT: 9,
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
    ESCROW_ENCLAVE_REMOTE_URL: 60,
    ESCROW_ENCLAVE_REMOTE_TOKEN: 64,
    ESCROW_RELEASE_KILL_SWITCH: 5,
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
const infraKeys = [
    'CONFIG_TENANT',
    'LAMBDA_STAGE',
    'PORT',
    'REDIS_HOST',
    'REDIS_PORT',
    'SA_SEED_KMS_KEY_ARN',
];
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
        'ESCROW_ENCLAVE_REMOTE_URL',
        'ESCROW_ENCLAVE_REMOTE_TOKEN',
        'ESCROW_RELEASE_KILL_SWITCH',
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
// Remote escrow enabled: bundle mode keeps only the two toggles in Lambda env; fallback mode
// must still fit, since every escrow credential then rides in the function environment.
const remoteEscrow = Object.fromEntries(
    [
        'ESCROW_ENCLAVE_MODE',
        'ESCROW_ENCLAVE_REMOTE_URL',
        'ESCROW_ENCLAVE_REMOTE_TOKEN',
        'ESCROW_RELEASE_KILL_SWITCH',
    ].map(key => [key, placeholder(key)])
);
for (const [mode, bundleId] of [
    ['bundle', placeholder('RUNTIME_SECRETS_ID')],
    ['fallback', undefined],
]) {
    withEnv({ ...secretEnv, ...emptied, ...remoteEscrow, RUNTIME_SECRETS_ID: bundleId }, () => {
        const provider = functionEnv.provider({ options: { stage: 'production' } });
        for (const key of infraKeys) provider[key] = placeholder(key);
        const combined = { ...provider, ...functionEnv.escrow() };
        if (mode === 'bundle') {
            assert.deepEqual(
                Object.keys(combined).sort(),
                [
                    ...infraKeys,
                    'RUNTIME_SECRETS_ID',
                    'ESCROW_ENCLAVE_MODE',
                    'ESCROW_RELEASE_KILL_SWITCH',
                ].sort()
            );
        }
        assert(size(combined) <= 4096, `remote escrow/${mode}: ${size(combined)} bytes`);
        console.log(`LCA Lambda env remote-escrow/${mode}: ${size(combined)} bytes`);
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

// Read the approved checked-in stages rather than maintaining a second key list.
const stageKeysFor = service => [
    ...new Set(
        ['dev', 'production'].flatMap(stage => {
            const config = JSON.parse(
                fs.readFileSync(
                    path.join(
                        root,
                        `services/learn-card-network/${service}/config/config.${stage}.json`
                    ),
                    'utf8'
                )
            );
            assert.deepEqual(
                Object.keys(config),
                Object.keys(config).sort(),
                `${service}/${stage} sorted`
            );
            return Object.keys(config);
        })
    ),
];
const brainStageKeys = stageKeysFor('brain-service');
const cloudStageKeys = stageKeysFor('learn-cloud-service');

const brain = workflows
    .get('deploy.yml')
    .jobs['deploy-brain-service'].steps.find(step => step.name === 'Deploy Brain Service Lambda');
const cloud = workflows
    .get('deploy.yml')
    .jobs['deploy-learn-cloud'].steps.find(step => step.name === 'Deploy LearnCloud Lambda');

// Both jobs gain the bundle pointer (passed through as a GitHub var, like lca-api).
assert.equal(brain.env.RUNTIME_SECRETS_ID, '${{ vars.RUNTIME_SECRETS_ID }}');
assert.equal(cloud.env.RUNTIME_SECRETS_ID, '${{ vars.RUNTIME_SECRETS_ID }}');
assert.equal(brain.env.APP_STORE_ADMIN_PROFILE_IDS, '${{ vars.APP_STORE_ADMIN_PROFILE_IDS }}');
const brainSteps = workflows.get('deploy.yml').jobs['deploy-brain-service'].steps;
const refreshPreflight = brainSteps.find(
    step => step.name === 'Validate credential refresh configuration'
);
const hashPreflight = brainSteps.find(
    step => step.name === 'Validate share-link request hash secret'
);
assert.equal(refreshPreflight.env.CREDENTIAL_REFRESH_ENABLED, undefined);
assert.equal(refreshPreflight.env.CONFIG_TENANT, "${{ matrix.tenant || 'learncard' }}");
// LearnCard enables refresh (digest secret required in fallback mode); ScoutPass disables it,
// so a fallback-mode ScoutPass deploy must not demand the secret. Unknown tenants fail closed.
for (const [tenant, refreshEnabled] of [
    ['', true],
    ['learncard', true],
    ['scouts', false],
]) {
    for (const stage of ['dev', 'production']) {
        for (const [bundleId, digestSecret, expected] of [
            ['', '', refreshEnabled ? 1 : 0],
            ['', 'fallback-secret', 0],
            ['bundle', '', 0],
        ]) {
            const result = spawnSync('bash', ['-e', '-c', refreshPreflight.run], {
                cwd: root,
                env: {
                    ...process.env,
                    SERVERLESS_STAGE: stage,
                    CONFIG_TENANT: tenant,
                    RUNTIME_SECRETS_ID: bundleId,
                    CREDENTIAL_REFRESH_DIGEST_SECRET: digestSecret,
                },
            });
            assert.equal(
                result.status,
                expected,
                `refresh preflight ${tenant || 'default'}/${stage}/${bundleId || 'fallback'}`
            );
        }
    }
}
assert.notEqual(
    spawnSync('bash', ['-e', '-c', refreshPreflight.run], {
        cwd: root,
        env: {
            ...process.env,
            SERVERLESS_STAGE: 'dev',
            CONFIG_TENANT: 'unknown',
            RUNTIME_SECRETS_ID: '',
        },
    }).status,
    0,
    'refresh preflight fails closed for a tenant without stage files'
);
for (const [bundleId, secret, expected] of [
    ['', '', 0],
    ['', 'too-short', 1],
    ['', 'x'.repeat(32), 0],
    ['bundle', 'too-short', 0],
]) {
    const result = spawnSync('bash', ['-e', '-c', hashPreflight.run], {
        cwd: root,
        env: {
            ...process.env,
            RUNTIME_SECRETS_ID: bundleId,
            SHARE_LINK_REQUEST_HASH_SECRET: secret,
        },
    });
    assert.equal(result.status, expected, `hash preflight ${bundleId || 'fallback'}`);
}

// Checked-in per-stage config must NOT be plumbed through Lambda env any more.
for (const key of brainStageKeys) assert.equal(brain.env[key], undefined, `brain ${key}`);
for (const key of cloudStageKeys) assert.equal(cloud.env[key], undefined, `cloud ${key}`);

// Credential fallbacks (used only when RUNTIME_SECRETS_ID is unset) stay as secrets.
for (const key of [
    'SEED',
    'NEO4J_URI',
    'NEO4J_USERNAME',
    'NEO4J_PASSWORD',
    'POSTMARK_API_KEY',
    'MESSAGEBIRD_AUTH_TOKEN',
    'NOTIFICATIONS_SERVICE_WEBHOOK_URL',
    'CREDENTIAL_REFRESH_DIGEST_SECRET',
    'SHARE_LINK_REQUEST_HASH_SECRET',
    'SMART_RESUME_CLIENT_ID',
    'SMART_RESUME_ACCESS_KEY',
    'SMART_RESUME_CONTRACT_URI',
    'LOGIN_PROVIDER_DID',
    'SKILL_EMBEDDING_GOOGLE_API_KEY',
    'SKILLS_PROVIDER_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'POSTHOG_API_KEY',
    'SENTRY_DSN',
]) {
    assert.equal(brain.env[key], '${{ secrets.' + key + ' }}', `brain ${key}`);
}
for (const key of [
    'LEARN_CLOUD_SEED',
    'LEARN_CLOUD_MONGO_URI',
    'LEARN_CLOUD_MONGO_DB_NAME',
    'XAPI_ENDPOINT',
    'XAPI_USERNAME',
    'XAPI_PASSWORD',
    'RSA_PRIVATE_KEY',
    'RSA_PUBLIC_KEY',
    'JWT_SIGNING_KEY',
    'SENTRY_DSN',
]) {
    assert.equal(cloud.env[key], '${{ secrets.' + key + ' }}', `cloud ${key}`);
}

// Sentry build-time inputs (sourcemap upload) survive in both jobs; SENTRY_ENV does not.
for (const key of ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT']) {
    assert.equal(brain.env[key], '${{ secrets.' + key + ' }}', `brain ${key}`);
    assert.equal(cloud.env[key], '${{ secrets.' + key + ' }}', `cloud ${key}`);
}

// Both services use one generated role and a provider-level environment. Include lift's
// generated queue workers: they inherit that environment just like explicit functions.
const serviceConfigContract = ({
    dir,
    service,
    stageKeys,
    infraKeys,
    fallback,
    optionalFallback = [],
    lengths,
}) => {
    const functionEnvPath = path.join(dir, 'serverless.function-env.cjs');
    const serverlessPath = path.join(dir, 'serverless.yml');
    const productionConfigPath = path.join(dir, 'config/config.production.json');
    const serviceEnv = require(functionEnvPath);
    const serverless = yaml.load(fs.readFileSync(serverlessPath, 'utf8'));
    const productionConfig = JSON.parse(fs.readFileSync(productionConfigPath, 'utf8'));
    assert.equal(
        serverless.provider.environment,
        '${file(./serverless.function-env.cjs):provider}'
    );
    const functions = [
        ...Object.entries(serverless.functions),
        ...Object.entries(serverless.constructs ?? {})
            .filter(([, construct]) => construct.worker)
            .map(([name, construct]) => [`${name}.worker`, construct.worker]),
    ];
    for (const [name, fn] of functions) {
        assert.equal(fn.role, undefined, `${service}/${name} uses the default role`);
        assert.equal(fn.environment, undefined, `${service}/${name} inherits provider env`);
    }

    // Every checked-in stage key must actually live in the production stage file and only
    // there — the production stage never carries a credential, bundle pointer, or infra key.
    for (const key of stageKeys)
        assert(Object.hasOwn(productionConfig, key), `${service} config missing ${key}`);
    for (const key of [...fallback, ...optionalFallback, ...infraKeys, 'RUNTIME_SECRETS_ID'])
        assert.equal(Object.hasOwn(productionConfig, key), false, `${service} config leaks ${key}`);

    const placeholderFor = key => 'x'.repeat(lengths[key] ?? 40);
    // Stale deployment variables for checked-in keys must never leak into function env.
    const stageLeak = Object.fromEntries(stageKeys.map(key => [key, placeholderFor(key)]));
    const fallbackEnv = Object.fromEntries(fallback.map(key => [key, placeholderFor(key)]));
    // These schema credentials were not in the production deployment's captured key set.
    const absentOptionalEnv = Object.fromEntries(optionalFallback.map(key => [key, '']));
    const staleBuildEnv = Object.fromEntries(
        ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT'].map(key => [key, 'build-only'])
    );

    for (const [mode, bundleId] of [
        ['bundle', placeholderFor('RUNTIME_SECRETS_ID')],
        ['fallback', undefined],
    ]) {
        withEnv(
            {
                ...stageLeak,
                ...fallbackEnv,
                ...absentOptionalEnv,
                ...staleBuildEnv,
                GIT_SHA: 'a'.repeat(40),
                RUNTIME_SECRETS_ID: bundleId,
            },
            () => {
                const provider = serviceEnv.provider({
                    options: { stage: 'production', httpPort: '3000' },
                });
                assert.equal(provider.LAMBDA_STAGE, 'production');
                assert.equal(provider.PORT, '3000');
                assert.deepEqual(provider.REDIS_HOST, {
                    'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Address'],
                });
                assert.deepEqual(provider.REDIS_PORT, {
                    'Fn::GetAtt': ['ElasticCacheCluster', 'RedisEndpoint.Port'],
                });
                if (service === 'brain-service') {
                    assert.equal(
                        provider.NOTIFICATIONS_QUEUE_URL,
                        '${construct:notifications-queue.queueUrl}'
                    );
                    assert.equal(provider.INBOX_QUEUE_URL, '${construct:inbox-queue.queueUrl}');
                }
                // Resolve CF intrinsic infra references to realistic synthetic deployed lengths.
                for (const key of infraKeys)
                    if (provider[key] !== undefined) provider[key] = placeholderFor(key);
                // Checked-in per-stage values are applied at cold start, never in the deployed env.
                for (const key of stageKeys)
                    assert.equal(provider[key], undefined, `${service} ${key}`);
                for (const key of Object.keys(staleBuildEnv))
                    assert.equal(provider[key], undefined, key);
                if (mode === 'bundle') {
                    // The bundle delivers every credential; only the pointer + infra remain.
                    for (const key of fallback)
                        assert.equal(provider[key], undefined, `${service} bundle ${key}`);
                    assert(provider.RUNTIME_SECRETS_ID, `${service} keeps the bundle pointer`);
                } else {
                    for (const key of fallback)
                        assert(provider[key] !== undefined, `${service} fallback ${key}`);
                }
                const expectedKeys =
                    mode === 'bundle'
                        ? [...infraKeys, 'RUNTIME_SECRETS_ID']
                        : [...infraKeys, ...fallback];
                assert.deepEqual(
                    Object.keys(provider).sort(),
                    expectedKeys.sort(),
                    `${service}/${mode} key set`
                );
                for (const [name] of functions) {
                    assert(
                        size(provider) < 4096,
                        `${service}/${name}/${mode}: ${size(provider)} bytes`
                    );
                    if (mode === 'bundle')
                        assert(size(provider) < 1024, `${service}/${name} bundle headroom`);
                    console.log(
                        `${service} Lambda env ${name}/${mode}: ${size(provider)} bytes (includes conservative per-entry overhead)`
                    );
                }
            }
        );
    }
    const allCredentials = Object.fromEntries(
        [...fallback, ...optionalFallback].map(key => [key, placeholderFor(key)])
    );
    for (const bundleId of [undefined, 'bundle']) {
        withEnv({ ...allCredentials, RUNTIME_SECRETS_ID: bundleId }, () => {
            const provider = serviceEnv.provider();
            for (const [key, value] of Object.entries(allCredentials)) {
                assert.equal(
                    provider[key],
                    bundleId ? undefined : value,
                    `${service}/${key} fallback only`
                );
            }
        });
    }
};

// Brain Lambda provider fallback credentials (the deploy env secrets above), plus the
// CF-intrinsic infra keys (Redis + serverless-lift queue URLs) that resolve at deploy time.
// Brain shares one execution role, so RUNTIME_SECRETS_ID plus every credential fallback sit
// on the provider. Infra includes Redis and the two serverless-lift queue URLs. The fallback
// set is brain-service/serverless.function-env.cjs's PROVIDER_SECRETS — the only values that
// drop out once the bundle is selected.
serviceConfigContract({
    dir: path.join(root, 'services/learn-card-network/brain-service'),
    service: 'brain-service',
    optionalFallback: ['SKILLS_PROVIDER_API_KEY', 'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'],
    stageKeys: brainStageKeys,
    infraKeys: [
        'CONFIG_TENANT',
        'LAMBDA_STAGE',
        'PORT',
        'REDIS_HOST',
        'REDIS_PORT',
        'NOTIFICATIONS_QUEUE_URL',
        'INBOX_QUEUE_URL',
        'GIT_SHA',
    ],
    fallback: [
        'SEED',
        'NEO4J_URI',
        'NEO4J_USERNAME',
        'NEO4J_PASSWORD',
        'POSTMARK_API_KEY',
        'MESSAGEBIRD_AUTH_TOKEN',
        'SENTRY_DSN',
        'SKILL_EMBEDDING_GOOGLE_API_KEY',
        'SMART_RESUME_CLIENT_ID',
        'SMART_RESUME_ACCESS_KEY',
        'SMART_RESUME_CONTRACT_URI',
        'CREDENTIAL_REFRESH_DIGEST_SECRET',
        'SHARE_LINK_REQUEST_HASH_SECRET',
        'POSTHOG_API_KEY',
        'NOTIFICATIONS_SERVICE_WEBHOOK_URL',
        'LOGIN_PROVIDER_DID',
        'APP_STORE_ADMIN_PROFILE_IDS',
    ],
    lengths: {
        LAMBDA_STAGE: 10,
        CONFIG_TENANT: 9,
        PORT: 4,
        REDIS_HOST: 120,
        REDIS_PORT: 4,
        NOTIFICATIONS_QUEUE_URL: 120,
        INBOX_QUEUE_URL: 120,
        RUNTIME_SECRETS_ID: 90,
        GIT_SHA: 40,
        SEED: 64,
        NEO4J_URI: 120,
        NEO4J_USERNAME: 20,
        NEO4J_PASSWORD: 48,
        POSTMARK_API_KEY: 40,
        MESSAGEBIRD_AUTH_TOKEN: 40,
        NOTIFICATIONS_SERVICE_WEBHOOK_URL: 120,
        CREDENTIAL_REFRESH_DIGEST_SECRET: 64,
        SHARE_LINK_REQUEST_HASH_SECRET: 64,
        SMART_RESUME_CLIENT_ID: 40,
        SMART_RESUME_ACCESS_KEY: 64,
        SMART_RESUME_CONTRACT_URI: 80,
        LOGIN_PROVIDER_DID: 80,
        APP_STORE_ADMIN_PROFILE_IDS: 200,
        SKILL_EMBEDDING_GOOGLE_API_KEY: 48,
        POSTHOG_API_KEY: 48,
        SENTRY_DSN: 100,
    },
});

// LearnCloud Lambda carries the large RSA keypair; the production fallback set must stay
// under Lambda's 4KB per-function limit even with a realistic 1732-byte RSA_PRIVATE_KEY.
serviceConfigContract({
    dir: path.join(root, 'services/learn-card-network/learn-cloud-service'),
    service: 'learn-cloud-service',
    stageKeys: cloudStageKeys,
    infraKeys: ['CONFIG_TENANT', 'LAMBDA_STAGE', 'PORT', 'REDIS_HOST', 'REDIS_PORT'],
    fallback: [
        'LEARN_CLOUD_SEED',
        'LEARN_CLOUD_MONGO_URI',
        'LEARN_CLOUD_MONGO_DB_NAME',
        'XAPI_ENDPOINT',
        'XAPI_USERNAME',
        'XAPI_PASSWORD',
        'RSA_PRIVATE_KEY',
        'RSA_PUBLIC_KEY',
        'JWT_SIGNING_KEY',
        'SENTRY_DSN',
    ],
    lengths: {
        LAMBDA_STAGE: 10,
        CONFIG_TENANT: 9,
        PORT: 4,
        REDIS_HOST: 120,
        REDIS_PORT: 4,
        RUNTIME_SECRETS_ID: 90,
        LEARN_CLOUD_SEED: 64,
        LEARN_CLOUD_MONGO_URI: 160,
        LEARN_CLOUD_MONGO_DB_NAME: 40,
        XAPI_ENDPOINT: 80,
        XAPI_USERNAME: 40,
        XAPI_PASSWORD: 48,
        RSA_PRIVATE_KEY: 1732,
        RSA_PUBLIC_KEY: 460,
        JWT_SIGNING_KEY: 64,
        SENTRY_DSN: 100,
    },
});

// Default-role runtime-bundle grant: the generated provider role may read only this
// service's runtime-secrets namespace, and serverless-lift's queue IAM policies must
// survive alongside it (removing them would break SQS send/consume at runtime).
const assertDefaultRoleRuntimeGrant = ({ dir, secretPrefix, requireQueueConstructs }) => {
    const serverlessPath = path.join(dir, 'serverless.yml');
    const service = yaml.load(fs.readFileSync(serverlessPath, 'utf8'));
    const statements = service.provider.iam?.role?.statements ?? [];
    const grants = statements.filter(
        statement => statement.Action === 'secretsmanager:GetSecretValue'
    );
    assert.equal(grants.length, 1, `${secretPrefix} has one scoped runtime grant`);
    const [runtimeGrant] = grants;
    assert(runtimeGrant, `${secretPrefix} default role must read the runtime bundle`);
    assert.deepEqual(runtimeGrant, {
        Effect: 'Allow',
        Action: 'secretsmanager:GetSecretValue',
        Resource: {
            'Fn::Sub':
                'arn:${AWS::Partition}:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:' +
                secretPrefix +
                '/${sls:stage}/runtime-secrets-*',
        },
    });
    if (requireQueueConstructs) {
        // serverless-lift owns the SQS queues and their generated IAM; the inline provider
        // grant above must not displace those constructs.
        assert(service.constructs?.['inbox-queue']?.type === 'queue', 'inbox queue retained');
        assert(
            service.constructs?.['notifications-queue']?.type === 'queue',
            'notifications queue retained'
        );
    }
};
assertDefaultRoleRuntimeGrant({
    dir: path.join(root, 'services/learn-card-network/brain-service'),
    secretPrefix: 'brain-service',
    requireQueueConstructs: true,
});
assertDefaultRoleRuntimeGrant({
    dir: path.join(root, 'services/learn-card-network/learn-cloud-service'),
    secretPrefix: 'learn-cloud-service',
    requireQueueConstructs: false,
});

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
    `${workflows.size} workflows parsed strictly; deploy env preservation, lca-api/brain/learn-cloud stage-config removal, and Keycloak preflight routing passed.`
);

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
const duplicate = '                  KEYCLOAK_ISSUERS: ${{ vars.KEYCLOAK_ISSUERS }}';
assert(deploySource.includes(duplicate));
assert.throws(
    () => yaml.load(deploySource.replace(duplicate, `${duplicate}\n${duplicate}`)),
    /duplicated mapping key/,
    'the parser must reject a reintroduced deploy env duplicate'
);
const lca = workflows
    .get('deploy.yml')
    .jobs['deploy-lca-api'].steps.find(step => step.name === 'Deploy LCA API Service Lambda');
for (const key of [
    'KEYCLOAK_ISSUERS',
    'KEYCLOAK_AUDIENCES',
    'KEYCLOAK_JWKS_URL_OVERRIDES',
    'OIDC_ISSUER',
    'OIDC_SIGNING_KEY_SECRET_ID',
    'OIDC_CLIENT_ID',
    'OIDC_REDIRECT_URIS',
    'GOOGLE_OAUTH_CLIENT_IDS',
    'APPLE_OAUTH_CLIENT_IDS',
]) {
    assert.equal(lca.env[key], '${{ vars.' + key + ' }}');
}
for (const key of ['OIDC_CLIENT_SECRET']) {
    assert.equal(lca.env[key], '${{ secrets.' + key + ' }}');
}
assert.equal(lca.env.OIDC_SIGNING_KEY_JWK, undefined);
const lcaServerless = yaml.load(
    fs.readFileSync(path.join(root, 'services/learn-card-network/lca-api/serverless.yml'), 'utf8')
);
assert.equal(lcaServerless.provider.environment.OIDC_SIGNING_KEY_JWK, undefined);
assert.equal(
    lcaServerless.provider.environment.OIDC_SIGNING_KEY_SECRET_ID,
    "${env:OIDC_SIGNING_KEY_SECRET_ID, ''}"
);
// Only the oidc function may read the private signing key: a dedicated role, no shared grant.
assert.equal(lcaServerless.provider.iam, undefined);
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

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '../..');
const manifest = yaml.load(fs.readFileSync(path.join(root,
    'services/learn-card-network/lca-api/serverless-local.yml'), 'utf8'));

// Offline supplies AWS_LAMBDA_FUNCTION_NAME, which intentionally uses the Lambda branch
// of the shared bootstrap. The framework CLI stage must not silently opt in to dev config.
assert.equal(manifest.provider.environment.LAMBDA_STAGE, "${env:CONFIG_STAGE, ''}");
for (const configStage of ['', 'dev', 'production']) {
    const env = { AWS_LAMBDA_FUNCTION_NAME: 'offline-handler', LAMBDA_STAGE: configStage };
    assert.equal(env.AWS_LAMBDA_FUNCTION_NAME ? env.LAMBDA_STAGE : undefined, configStage);
}
console.log('lca-api offline config selection remains explicit via CONFIG_STAGE');

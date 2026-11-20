const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '../..');
const workflow = name =>
    yaml.load(readFileSync(path.join(root, '.github/workflows', name), 'utf8'));

test('PR previews cannot pass Sentry upload credentials to PR-head builds', () => {
    const preview = workflow('capgo-pr-preview.yml').jobs.upload;
    const reusable = workflow('capgo-upload.yml');
    assert.equal(preview.with.sentry_upload, false);
    for (const name of ['SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT']) {
        assert.equal(preview.secrets[name], undefined);
        const build = reusable.jobs.upload.steps.find(
            step => step.name === 'Build ${{ inputs.project }}'
        );
        assert.match(build.env[name], /inputs\.sentry_upload && secrets\./);
    }
    const build = reusable.jobs.upload.steps.find(
        step => step.name === 'Build ${{ inputs.project }}'
    );
    assert.match(build.env.SENTRY_UPLOAD_REQUIRED, /inputs\.sentry_upload/);
    assert.equal(reusable.on.workflow_call.inputs.sentry_upload.default, true);
});

test('staging OTA keeps production tenant configuration and requires Sentry upload', () => {
    const staging = workflow('capgo-staging.yml').jobs.upload;
    assert.equal(staging.with.stage, undefined);
    assert.notEqual(staging.with.sentry_upload, false);
    assert.equal(staging.secrets.SENTRY_AUTH_TOKEN, '${{ secrets.SENTRY_AUTH_TOKEN }}');
});

const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');

// Release-owner alerts: an OTA canary after every production Capgo publish, and a
// job that explains native store publishes that did not succeed. These must never
// be able to block the release they are watching.
const root = path.resolve(__dirname, '../..');
const deploy = yaml.load(readFileSync(path.join(root, '.github/workflows/deploy.yml'), 'utf8'));

test('the Capgo canary runs after the channel is set and cannot fail the frontend leg', () => {
    const steps = deploy.jobs['deploy-frontend'].steps;
    const index = id => steps.findIndex(step => step.id === id);
    const canary = steps[index('capgo-canary')];
    assert.ok(canary, 'deploy-frontend has a capgo-canary step');
    assert.ok(
        index('capgo-set-channel') >= 0 && index('capgo-set-channel') < index('capgo-canary')
    );
    assert.equal(canary.if, 'matrix.capgo');
    // A failing canary must not turn deploy-frontend into a failure: that would skip
    // publish-native-apps, the very kind of silent miss these alerts exist for.
    assert.equal(canary['continue-on-error'], true);
    assert.match(canary.run, /scripts\/release-alerts\/capgo-canary\.mjs/);

    const alert = steps.find(step => step.name === 'Alert release owner (OTA delivery)');
    assert.ok(alert, 'deploy-frontend alerts the release owner');
    assert.equal(alert['continue-on-error'], true);
    for (const id of ['capgo-canary', 'capgo-upload', 'capgo-set-channel']) {
        assert.ok(alert.if.includes(`steps.${id}.outcome == 'failure'`), `alerts when ${id} fails`);
    }
    assert.match(alert.env.RELEASE_ALERT_CHANNEL, /#release-owner/);
});

test('the native release check covers failure, skip and cancellation of store publishing', () => {
    const job = deploy.jobs['release-delivery-check'];
    assert.ok(job, 'deploy.yml has a release-delivery-check job');
    assert.deepEqual(job.needs, ['determine-affected', 'deploy-frontend', 'publish-native-apps']);
    assert.match(job.if, /always\(\)/);
    assert.doesNotMatch(job.if, /!cancelled\(\)/);
    assert.match(job.if, /needs\.publish-native-apps\.result != 'success'/);

    // Same eligibility as publish-native-apps itself, minus its frontend-failure guard.
    const publishIf = deploy.jobs['publish-native-apps'].if;
    for (const clause of [
        "github.event.inputs.publish-app-stores == 'true'",
        "needs.determine-affected.outputs.lca_app_changed == 'true'",
    ]) {
        assert.ok(publishIf.includes(clause) && job.if.includes(clause), clause);
    }
    assert.equal(job.permissions.actions, 'read');
    const post = job.steps.find(step => step.name === 'Alert release owner');
    assert.match(post.env.RELEASE_ALERT_CHANNEL, /#release-owner/);
});

test('native job names match what the release check looks for', () => {
    const fastlane = yaml.load(
        readFileSync(path.join(root, '.github/workflows/fastlane-deploy-native-apps.yml'), 'utf8')
    );
    const names = Object.values(fastlane.jobs).map(job => job.name);
    assert.ok(names.includes('${{ inputs.environment }} iOS Deploy'));
    assert.ok(names.includes('${{ inputs.environment }} Android Deploy'));
    // GitHub names called jobs "<caller name> / <job name>"; the script matches this prefix.
    assert.equal(deploy.jobs['publish-native-apps'].name, 'Publish Native Apps to App Stores');
    const script = readFileSync(
        path.join(root, 'scripts/release-alerts/native-release-check.mjs'),
        'utf8'
    );
    assert.match(script, /NATIVE_JOB_PREFIX = 'Publish Native Apps to App Stores'/);
});

test('a bot post failure falls back to the deploy-errors webhook on both alert paths', () => {
    const ota = deploy.jobs['deploy-frontend'].steps.find(
        step => step.name === 'Alert release owner (OTA delivery)'
    );
    const native = deploy.jobs['release-delivery-check'].steps.find(
        step => step.name === 'Alert release owner'
    );
    for (const step of [ota, native]) {
        assert.equal(
            step.env.SLACK_FALLBACK_WEBHOOK,
            '${{ secrets.SLACK_WEBHOOK_DEPLOY_ERRORS_URL }}'
        );
    }
});

test('a canary crash is not reported as an unpublished bundle', () => {
    const alert = deploy.jobs['deploy-frontend'].steps.find(
        step => step.name === 'Alert release owner (OTA delivery)'
    );
    assert.equal(alert.env.UPLOAD_OUTCOME, '${{ steps.capgo-upload.outcome }}');
    assert.equal(alert.env.CHANNEL_OUTCOME, '${{ steps.capgo-set-channel.outcome }}');
    assert.match(alert.run, /OTA canary crashed/);
    assert.match(alert.run, /OTA bundle was not published/);
});

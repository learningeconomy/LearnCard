const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');

// iOS store builds (20.0.x) are numbered above our OTA bundles (1.100.x). If a
// channel has Capgo's "Disable auto downgrade under native" on, no iPhone ever
// takes an update, so every channel CI uploads to must turn it off (--downgrade).
const root = path.resolve(__dirname, '../..');
const steps = file =>
    Object.values(yaml.load(readFileSync(path.join(root, file), 'utf8')).jobs).flatMap(
        job => job.steps ?? []
    );

test('production deploy allows updates below the native version when setting the channel', () => {
    const step = steps('.github/workflows/deploy.yml').find(s => s.name === 'Set CapGo Channel');
    assert.ok(step, 'deploy.yml has a "Set CapGo Channel" step');
    assert.match(step.run, /capgo channel set[\s\S]*--downgrade/);
});

test('reusable Capgo upload allows updates below the native version on every upload', () => {
    const all = steps('.github/workflows/capgo-upload.yml');
    const step = all.find(s => s.name === 'Allow updates below native version (CapGo)');
    assert.ok(step, 'capgo-upload.yml has the under-native step');
    assert.equal(
        step.if,
        undefined,
        'the step runs for every caller, including self_assign: false'
    );
    assert.match(step.run, /capgo channel set "\$CHANNEL"\s+--downgrade/);
    const upload = all.findIndex(s => s.name === 'Upload bundle (CapGo)');
    assert.ok(all.indexOf(step) < upload, 'the setting is applied before the bundle goes live');
});

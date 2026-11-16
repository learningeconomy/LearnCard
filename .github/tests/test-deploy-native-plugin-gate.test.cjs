// A failed native DIDKit build must never look like an intentional skip to the
// frontend, npm, and docker gates (they treat `skipped` deploys as OK).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const file = path.resolve(__dirname, '../workflows/deploy.yml');
const { jobs } = yaml.load(fs.readFileSync(file, 'utf8'));

for (const name of ['deploy-brain-service', 'deploy-learn-cloud', 'deploy-lca-api']) {
    const job = jobs[name];
    assert(job.needs.includes('build-native-plugin'), `${name} needs the native build`);
    assert(
        !/build-native-plugin\.result\s*==\s*'success'/.test(job.if),
        `${name} must not skip on native failure; selected deploys should fail instead`
    );
    const guardIndex = job.steps.findIndex(step => step.name === 'Require native DIDKit plugin');
    const downloadIndex = job.steps.findIndex(step => step.name === 'Download native plugin binary');
    assert(guardIndex === 0, `${name} checks the native result before anything else (got ${guardIndex})`);
    assert(downloadIndex > guardIndex, `${name} guard runs before the artifact download`);
    const guard = job.steps[guardIndex];
    assert.equal(guard.if, "needs.build-native-plugin.result != 'success'");
    assert.match(guard.run, /exit 1/);
    assert.match(guard.run, /skipped/);
}

for (const name of ['deploy-frontend', 'publish-npm', 'push-docker-images']) {
    const job = jobs[name];
    assert(job.needs.includes('build-native-plugin'), `${name} needs the native build`);
    assert.match(job.if, /needs\.build-native-plugin\.result != 'failure'/, name);
    assert.match(job.if, /needs\.build-native-plugin\.result != 'cancelled'/, name);
    // Frontend-only / release paths without Lambdas still run when native is skipped.
    assert.doesNotMatch(job.if, /build-native-plugin\.result == 'success'/, name);
}

console.log('native plugin gate: ok');

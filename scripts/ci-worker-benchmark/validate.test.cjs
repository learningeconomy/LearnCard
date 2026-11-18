'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
    validateGraph,
    validateProfile,
    validateApp,
    validateRetries,
    validateComparable,
} = require('./validate.cjs');

const graph = () => ({
    tasks: {
        tasks: {
            'core:build': { target: { project: 'core', target: 'build' } },
            'learn-card-app:test': { target: { project: 'learn-card-app', target: 'test' } },
            'scouts:test': { target: { project: 'scouts', target: 'test' } },
        },
    },
});
const projects = ['learn-card-app', 'scouts'];
const profile = () => [
    { name: 'thread_name', ph: 'M' },
    ...Object.keys(graph().tasks.tasks).map(name => ({
        name,
        ph: 'X',
        dur: 1000,
        args: { target: { project: name.split(':')[0] }, status: 'success' },
    })),
];
const app = () => ({
    version: 1,
    reason: 'passed',
    unhandledErrors: 0,
    maxWorkers: 3,
    files: ['src/a.test.ts', 'src/b.test.ts'],
    caseCount: 3,
    caseIdentitySha256: 'a'.repeat(64),
});
const reports = () => [
    {
        project: 'apps/learn-card-app',
        reason: 'passed',
        failedModules: 0,
        unhandledErrors: 0,
        counts: { passed: 2, failed: 0, skipped: 1, pending: 0, recovered: 0 },
    },
];

test('pins selected test projects and verifies every uncached task completed', () => {
    const ids = validateGraph(graph(), projects);
    assert.equal(validateProfile(profile(), ids).length, 3);
    assert.throws(
        () => validateGraph(graph(), ['learn-card-app']),
        /affected test projects changed/
    );
    assert.throws(() => validateProfile(profile().slice(0, -1), ids), /executed task set changed/);
    const cached = profile();
    cached[1].args.status = 'local-cache';
    assert.throws(() => validateProfile(cached, ids), /did not run successfully/);
    assert.throws(
        () => validateProfile([...profile(), profile()[1]], ids),
        /duplicate profile task/
    );
});

test('requires complete app file and case identity evidence', () => {
    assert.equal(validateApp(app(), 3).caseCount, 3);
    assert.throws(() => validateApp(app(), 4), /worker override was not applied/);
    assert.throws(() => validateApp({ ...app(), files: [] }, 3), /no files/);
    assert.throws(() => validateApp({ ...app(), files: ['x', 'x'] }, 3), /duplicate app file/);
    assert.throws(
        () => validateApp({ ...app(), caseIdentitySha256: '' }, 3),
        /invalid app test identity/
    );
    assert.throws(() => validateApp({ ...app(), reason: 'failed' }, 3), /did not pass/);
});

test('compares files, case identities, projects, and test counts across runs', () => {
    const reference = {
        tasks: ['app:test'],
        app: validateApp(app(), 3),
        projects: validateRetries(reports()),
    };
    assert.doesNotThrow(() => validateComparable(reference, structuredClone(reference)));
    const changedCase = structuredClone(reference);
    changedCase.app.caseIdentitySha256 = 'b'.repeat(64);
    assert.throws(() => validateComparable(reference, changedCase), /test identities changed/);
    const changedCount = structuredClone(reference);
    changedCount.projects[0].passed += 1;
    assert.throws(() => validateComparable(reference, changedCount), /case counts changed/);
    const changedTask = structuredClone(reference);
    changedTask.tasks = [];
    assert.throws(() => validateComparable(reference, changedTask), /task set changed/);
});

test('allows flaky retries but rejects failed, missing, or interrupted reports', () => {
    const retried = reports();
    retried[0].counts.recovered = 1;
    assert.deepEqual(validateRetries(retried), validateRetries(reports()));
    assert.throws(() => validateRetries([]), /no Vitest reports/);
    assert.throws(
        () => validateRetries([{ ...reports()[0], project: 'other' }]),
        /app retry report missing/
    );
    assert.throws(
        () => validateRetries([{ ...reports()[0], reason: 'interrupted' }]),
        /project failed/
    );
    const failed = reports();
    failed[0].counts.failed = 1;
    assert.throws(() => validateRetries(failed), /failed tests/);
});

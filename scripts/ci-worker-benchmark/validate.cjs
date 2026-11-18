'use strict';

const assert = require('node:assert/strict');

const sorted = values => [...values].sort();
const integer = value => Number.isSafeInteger(value) && value >= 0;

const validateGraph = (graph, expectedProjects) => {
    const tasks = graph?.tasks?.tasks;
    assert.ok(tasks && typeof tasks === 'object', 'Nx task graph is missing');
    const ids = Object.keys(tasks);
    assert.ok(ids.length > 0, 'Nx selected no tasks');
    const projects = ids
        .filter(id => tasks[id]?.target?.target === 'test')
        .map(id => tasks[id].target.project);
    assert.equal(new Set(projects).size, projects.length, 'duplicate test project');
    assert.deepEqual(sorted(projects), sorted(expectedProjects), 'affected test projects changed');
    assert.ok(ids.includes('learn-card-app:test'), 'app target was not selected');
    return sorted(ids);
};

const validateProfile = (profile, expectedTasks) => {
    assert.ok(Array.isArray(profile), 'Nx profile is missing');
    const tasks = profile.filter(event => event?.ph === 'X' && event.args?.target?.project);
    assert.equal(
        new Set(tasks.map(task => task.name)).size,
        tasks.length,
        'duplicate profile task'
    );
    assert.deepEqual(
        sorted(tasks.map(task => task.name)),
        sorted(expectedTasks),
        'executed task set changed'
    );
    for (const task of tasks) {
        assert.equal(task.args.status, 'success', `task did not run successfully: ${task.name}`);
        assert.ok(Number.isFinite(task.dur) && task.dur >= 0, `missing duration: ${task.name}`);
    }
    return tasks.map(task => ({ id: task.name, durationMs: task.dur / 1000 }));
};

const validateApp = (report, expectedWorkers) => {
    assert.equal(report?.version, 1, 'app coverage report missing');
    assert.equal(report.reason, 'passed', 'app coverage report did not pass');
    assert.equal(report.unhandledErrors, 0, 'app reported unhandled errors');
    assert.equal(report.maxWorkers, expectedWorkers, 'app worker override was not applied');
    assert.ok(Array.isArray(report.files) && report.files.length > 0, 'app reported no files');
    assert.ok(
        report.files.every(file => typeof file === 'string' && file.length > 0),
        'invalid app file'
    );
    assert.equal(new Set(report.files).size, report.files.length, 'duplicate app file');
    assert.ok(integer(report.caseCount) && report.caseCount > 0, 'app reported no cases');
    assert.match(report.caseIdentitySha256, /^[a-f0-9]{64}$/, 'invalid app test identity hash');
    return {
        files: sorted(report.files),
        caseCount: report.caseCount,
        caseIdentitySha256: report.caseIdentitySha256,
    };
};

const validateRetries = reports => {
    assert.ok(Array.isArray(reports) && reports.length > 0, 'no Vitest reports');
    const projects = reports.map(report => {
        assert.ok(
            typeof report.project === 'string' && report.project.length,
            'invalid report project'
        );
        assert.equal(report.reason, 'passed', `Vitest project failed: ${report.project}`);
        assert.equal(report.failedModules, 0, `failed test modules: ${report.project}`);
        assert.equal(report.unhandledErrors, 0, `unhandled errors: ${report.project}`);
        for (const key of ['passed', 'failed', 'skipped', 'pending', 'recovered']) {
            assert.ok(integer(report.counts?.[key]), `invalid ${key} count: ${report.project}`);
        }
        assert.equal(report.counts.failed, 0, `failed tests: ${report.project}`);
        assert.equal(report.counts.pending, 0, `pending tests: ${report.project}`);
        return {
            project: report.project,
            passed: report.counts.passed,
            skipped: report.counts.skipped,
        };
    });
    assert.ok(
        projects.some(project => project.project === 'apps/learn-card-app'),
        'app retry report missing'
    );
    return projects.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
};

const validateComparable = (reference, candidate) => {
    assert.deepEqual(candidate.tasks, reference.tasks, 'Nx task set changed');
    assert.deepEqual(candidate.app, reference.app, 'app file or test identities changed');
    assert.deepEqual(
        candidate.projects,
        reference.projects,
        'Vitest project or case counts changed'
    );
};

module.exports = {
    validateGraph,
    validateProfile,
    validateApp,
    validateRetries,
    validateComparable,
};

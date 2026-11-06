const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { isDeepStrictEqual } = require('node:util');

const FILE = 'queue-test-proof.json';
const LIMIT = 128 * 1024;
const SHA = /^[a-f0-9]{40}$/;
const EMPTY_TREE = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
// These tests do not load Deploy's freshly compiled Node DIDKit addon. Keep both
// project dependencies and actual task prerequisites inside this audited boundary.
const ROOTS = {
    types: 'packages/learn-card-types',
    helpers: 'packages/learn-card-helpers',
    core: 'packages/learn-card-core',
    'sss-key-manager': 'packages/sss-key-manager',
    'escrow-enclave-app': 'services/escrow-enclave-app',
    'nx-run-command': 'tools/executors/workspace/run-command',
};
const artifactName = (runId, attempt) => `queue-test-proof-${runId}-${attempt}`;
const positive = n => Number.isSafeInteger(n) && n > 0;
const sorted = values => [...new Set(values)].sort();
const fail = reason => {
    const error = new Error(reason);
    error.proofReason = reason;
    throw error;
};
const requireProof = (condition, reason) => {
    if (!condition) fail(reason);
};

function selection(document) {
    const nodes = document?.graph?.nodes;
    const dependencies = document?.graph?.dependencies;
    const tasks = document?.tasks?.tasks;
    const prerequisites = document?.tasks?.dependencies;
    requireProof(nodes && dependencies && tasks && prerequisites, 'unsupported-test-scope');
    const ids = Object.keys(tasks).sort();
    requireProof(ids.length > 0 && ids.length <= 100, 'unsupported-test-scope');
    const visited = new Set();
    const visit = name => {
        requireProof(
            Object.hasOwn(ROOTS, name) && nodes[name]?.data?.root === ROOTS[name],
            'unsupported-test-scope'
        );
        if (visited.has(name)) return;
        visited.add(name);
        requireProof(Array.isArray(dependencies[name]), 'unsupported-test-scope');
        for (const edge of dependencies[name]) {
            requireProof(typeof edge.target === 'string', 'unsupported-test-scope');
            if (!edge.target.startsWith('npm:')) visit(edge.target);
            else
                requireProof(!edge.target.includes('didkit-plugin-node'), 'unsupported-test-scope');
        }
    };
    const projects = [];
    for (const id of ids) {
        const task = tasks[id];
        requireProof(task.id === id && !task.continuous, 'unsupported-test-scope');
        requireProof(
            Array.isArray(prerequisites[id]) &&
                prerequisites[id].every(dependency => Object.hasOwn(tasks, dependency)),
            'unsupported-test-scope'
        );
        requireProof(['build', 'test'].includes(task.target?.target), 'unsupported-test-scope');
        requireProof(!task.target.configuration, 'unsupported-test-scope');
        visit(task.target.project);
        if (task.target.target === 'test') {
            requireProof(task.cache === false, 'unsupported-test-scope');
            projects.push(task.target.project);
        }
    }
    requireProof(
        projects.length > 0 && !projects.includes('nx-run-command'),
        'unsupported-test-scope'
    );
    return { projects: sorted(projects), tasks: ids };
}

/** Keep unaudited tests fresh while proving each audited test's entire prerequisite closure. */
function reusableSelection(document) {
    const tasks = document?.tasks?.tasks;
    const dependencies = document?.tasks?.dependencies;
    requireProof(tasks && dependencies, 'unsupported-test-scope');
    const ids = Object.keys(tasks);
    requireProof(ids.length > 0 && ids.length <= 1000, 'unsupported-test-scope');
    const tests = ids.filter(id => tasks[id]?.target?.target === 'test');
    const allProjects = tests.map(id => tasks[id].target.project);
    requireProof(
        allProjects.length > 0 &&
            allProjects.every(project => typeof project === 'string' && project.length > 0) &&
            new Set(allProjects).size === allProjects.length,
        'unsupported-test-scope'
    );
    const covered = new Set();
    for (const testId of tests) {
        const project = tasks[testId].target.project;
        if (!Object.hasOwn(ROOTS, project) || project === 'nx-run-command') continue;
        try {
            const closure = new Set();
            const visit = id => {
                requireProof(Object.hasOwn(tasks, id), 'unsupported-test-scope');
                // A test prerequisite could introduce another test configuration
                // that cannot safely be excluded by project name.
                requireProof(
                    id === testId || tasks[id].target?.target === 'build',
                    'unsupported-test-scope'
                );
                requireProof(Array.isArray(dependencies[id]), 'unsupported-test-scope');
                if (closure.has(id)) return;
                closure.add(id);
                for (const dependency of dependencies[id]) visit(dependency);
            };
            visit(testId);
            const subset = {
                ...document,
                tasks: {
                    tasks: Object.fromEntries([...closure].map(id => [id, tasks[id]])),
                    dependencies: Object.fromEntries(
                        [...closure].map(id => [id, dependencies[id]])
                    ),
                },
            };
            selection(subset);
            for (const id of closure) covered.add(id);
        } catch (error) {
            if (error.proofReason !== 'unsupported-test-scope') throw error;
        }
    }
    const scope = selection({
        ...document,
        tasks: {
            tasks: Object.fromEntries([...covered].map(id => [id, tasks[id]])),
            dependencies: Object.fromEntries([...covered].map(id => [id, dependencies[id]])),
        },
    });
    return { ...scope, allProjects: sorted(allProjects) };
}

function runtime(cwd) {
    return {
        os: 'linux',
        arch: 'x64',
        node: `v${readFileSync(path.join(cwd, '.nvmrc'), 'utf8').trim().replace(/^v/, '')}`,
        bun: JSON.parse(
            readFileSync(path.join(cwd, 'package.json'), 'utf8')
        ).packageManager.replace(/^bun@/, ''),
    };
}

function createProof({
    graph,
    base,
    head,
    repository,
    repositoryId,
    runId,
    attempt,
    actualRuntime,
}) {
    requireProof(
        SHA.test(base) && SHA.test(head) && base !== head && base !== EMPTY_TREE,
        'invalid-range'
    );
    requireProof(
        typeof repository === 'string' && /^[\w.-]+\/[\w.-]+$/.test(repository),
        'invalid-proof'
    );
    requireProof([repositoryId, runId, attempt].every(positive), 'invalid-proof');
    return {
        version: 2,
        repository,
        repositoryId,
        runId,
        attempt,
        event: 'merge_group',
        environment: 'ci-tests-fixture-v1',
        base,
        head,
        ...reusableSelection(graph),
        runtime: actualRuntime,
    };
}

function readArchive(bytes) {
    const buffer = Buffer.from(bytes);
    requireProof(buffer.length > 0 && buffer.length <= 1024 * 1024, 'invalid-proof');
    const dir = mkdtempSync(path.join(tmpdir(), 'deploy-test-proof-'));
    try {
        const archive = path.join(dir, 'proof.zip');
        writeFileSync(archive, buffer, { mode: 0o600 });
        // Print one fixed entry; never extract paths or execute artifact contents.
        return JSON.parse(
            execFileSync('/usr/bin/unzip', ['-p', archive, FILE], {
                maxBuffer: LIMIT,
                timeout: 5000,
                stdio: ['ignore', 'pipe', 'pipe'],
            }).toString('utf8')
        );
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
}

async function resolveReuse({
    github,
    repo,
    repositoryId,
    base,
    head,
    graph,
    cwd = process.cwd(),
}) {
    try {
        const request = { timeout: 4000 };
        requireProof(
            SHA.test(base) && SHA.test(head) && base !== head && base !== EMPTY_TREE,
            'invalid-range'
        );
        const scope = reusableSelection(graph);
        const workflow = (
            await github.rest.actions.getWorkflow({ ...repo, workflow_id: 'test.yml', request })
        ).data;
        requireProof(workflow.path === '.github/workflows/test.yml', 'untrusted-workflow');
        const response = (
            await github.rest.actions.listWorkflowRuns({
                ...repo,
                workflow_id: workflow.id,
                event: 'merge_group',
                head_sha: head,
                per_page: 100,
                request,
            })
        ).data;
        requireProof(
            response.total_count <= 100 && Array.isArray(response.workflow_runs),
            'proof-unavailable'
        );
        const runs = response.workflow_runs
            .filter(run => run.head_sha === head)
            .sort((a, b) => b.id - a.id);
        requireProof(runs.length > 0, 'no-queue-run');
        const run = runs[0];
        const trusted = row =>
            row.workflow_id === workflow.id &&
            row.head_sha === head &&
            row.event === 'merge_group' &&
            row.head_branch?.startsWith('gh-readonly-queue/main/') &&
            row.repository?.id === repositoryId &&
            row.head_repository?.id === repositoryId &&
            row.status === 'completed' &&
            row.conclusion === 'success' &&
            positive(row.run_attempt);
        requireProof(trusted(run), 'queue-run-not-successful');
        const jobs = (
            await github.rest.actions.listJobsForWorkflowRunAttempt({
                ...repo,
                run_id: run.id,
                attempt_number: run.run_attempt,
                per_page: 100,
                request,
            })
        ).data;
        requireProof(jobs.total_count <= 100, 'proof-unavailable');
        const testJobs = jobs.jobs.filter(job => job.name === 'Test');
        requireProof(
            testJobs.length === 1 &&
                testJobs[0].conclusion === 'success' &&
                testJobs[0].status === 'completed',
            'test-job-not-successful'
        );
        for (const name of [
            'Test retry reporting contract',
            'Run tests',
            'Summarize test retries',
            'Record queue test proof',
            'Publish queue test proof',
        ]) {
            const steps = testJobs[0].steps.filter(step => step.name === name);
            requireProof(
                steps.length === 1 && steps[0].conclusion === 'success',
                'incomplete-test-proof'
            );
        }
        const name = artifactName(run.id, run.run_attempt);
        const artifacts = (
            await github.rest.actions.listWorkflowRunArtifacts({
                ...repo,
                run_id: run.id,
                name,
                per_page: 100,
                request,
            })
        ).data;
        const matches = artifacts.artifacts.filter(a => a.name === name);
        requireProof(artifacts.total_count <= 100 && matches.length === 1, 'missing-proof');
        const artifact = matches[0];
        requireProof(
            !artifact.expired &&
                artifact.size_in_bytes > 0 &&
                artifact.size_in_bytes <= 1024 * 1024 &&
                artifact.workflow_run?.id === run.id &&
                artifact.workflow_run?.head_sha === head &&
                artifact.workflow_run?.repository_id === repositoryId,
            'invalid-proof'
        );
        const download = await github.rest.actions.downloadArtifact({
            ...repo,
            artifact_id: artifact.id,
            archive_format: 'zip',
            request,
        });
        const proof = readArchive(download.data);
        const expected = createProof({
            graph,
            base,
            head,
            repository: `${repo.owner}/${repo.repo}`,
            repositoryId,
            runId: run.id,
            attempt: run.run_attempt,
            actualRuntime: runtime(cwd),
        });
        // Exact range, selection, runtime and protocol; unknown fields are rejected.
        try {
            assert.deepEqual(proof, expected);
        } catch {
            // Attribute a miss to the base only when every other field matches.
            // Speculative queue ranges and successful Deploy history can advance
            // independently; this diagnostic never relaxes the equality gate.
            const onlyBaseDiffers =
                SHA.test(proof?.base) &&
                proof.base !== base &&
                isDeepStrictEqual({ ...proof, base }, expected);
            fail(onlyBaseDiffers ? 'comparison-base-mismatch' : 'proof-mismatch');
        }
        const latest = (
            await github.rest.actions.getWorkflowRun({ ...repo, run_id: run.id, request })
        ).data;
        requireProof(
            trusted(latest) && latest.run_attempt === run.run_attempt,
            'queue-run-changed'
        );
        const covered = new Set(scope.projects);
        const remainingProjects = scope.allProjects.filter(project => !covered.has(project));
        const partial = remainingProjects.length > 0;
        return {
            reused: !partial,
            reason: partial ? 'partial-matching-queue-proof' : 'matching-queue-proof',
            runId: run.id,
            attempt: run.run_attempt,
            projects: scope.projects,
            ...(partial ? { remainingProjects } : {}),
        };
    } catch (error) {
        // API, expiry, selection and parser failures retain the existing test path.
        return { reused: false, reason: error.proofReason || 'proof-unavailable' };
    }
}

if (require.main === module) {
    const [, , command, graphFile, output] = process.argv;
    assert.equal(command, 'record');
    assert.equal(process.env.GITHUB_EVENT_NAME, 'merge_group');
    let proof;
    try {
        proof = createProof({
            graph: JSON.parse(readFileSync(graphFile, 'utf8')),
            base: process.env.NX_BASE,
            head: process.env.NX_HEAD,
            repository: process.env.GITHUB_REPOSITORY,
            repositoryId: Number(process.env.GITHUB_REPOSITORY_ID),
            runId: Number(process.env.GITHUB_RUN_ID),
            attempt: Number(process.env.GITHUB_RUN_ATTEMPT),
            actualRuntime: {
                os: process.platform,
                arch: process.arch,
                node: process.version,
                bun: execFileSync('bun', ['--version'], { encoding: 'utf8' }).trim(),
            },
        });
    } catch (error) {
        if (error.proofReason !== 'unsupported-test-scope') throw error;
        console.log('Queue proof not applicable: selection is outside the audited test boundary.');
    }
    if (proof) {
        mkdirSync(path.dirname(output), { recursive: true });
        writeFileSync(output, JSON.stringify(proof), { mode: 0o600 });
        require('node:fs').appendFileSync(process.env.GITHUB_OUTPUT, 'publish=true\n');
    }
}

module.exports = { selection, createProof, resolveReuse, readArchive, artifactName, runtime };

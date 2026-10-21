const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const workflowPath = process.argv[2] || path.join(root, '.github/workflows/preview.yml');

const readWorkflow = file => {
    // Reuse the neighboring contracts' Ruby YAML parser without adding a JS dependency.
    const result = spawnSync(
        'ruby',
        [
            '-rjson',
            '-ryaml',
            '-e',
            'puts JSON.generate(YAML.load_file(ARGV.fetch(0), aliases: true))',
            file,
        ],
        { encoding: 'utf8' }
    );
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
};

const workflow = readWorkflow(workflowPath);
const gate = workflow.jobs['should-deploy'];
const deploy = workflow.jobs['deploy-preview'];
const e2e = workflow.jobs['run-e2e-tests'];

// /preview comments only run for the same author associations capgo accepts.
for (const association of ['OWNER', 'MEMBER', 'COLLABORATOR']) {
    assert.match(gate.if, new RegExp(`"${association}"`), `${association} must be allowed`);
}
assert.match(gate.if, /github\.event\.comment\.author_association/);
assert.match(gate.if, /github\.event_name != 'issue_comment'/);
assert.doesNotMatch(gate.if, /CONTRIBUTOR|FIRST_TIME|NONE/);

// Downstream jobs only run after the gate job succeeds with deploy=true.
assert.equal(deploy.needs, 'should-deploy');
assert.equal(deploy.if, "needs.should-deploy.outputs.deploy == 'true'");
assert.deepEqual(e2e.needs, ['should-deploy', 'deploy-preview']);
assert.match(e2e.if, /needs\.deploy-preview\.result == 'success'/);

// Every job declares its own token permissions.
for (const [name, job] of Object.entries(workflow.jobs)) {
    assert.ok(job.permissions, `${name} must declare permissions`);
    assert.notEqual(job.permissions['contents'], 'write', `${name} must not write contents`);
}

// The gate script must not interpolate expressions; run it against fake events.
const trigger = gate.steps.find(step => step.id === 'check');
assert.doesNotMatch(trigger.with.script, /\$\{\{/);

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const runTrigger = async ({ eventName, payload, pr }) => {
    const outputs = {};
    const failures = [];
    const github = {
        rest: {
            pulls: { get: async () => ({ data: pr }) },
            reactions: { createForIssueComment: async () => ({}) },
        },
    };
    const context = {
        eventName,
        payload,
        repo: { owner: 'learningeconomy', repo: 'LearnCard' },
    };
    const core = {
        setOutput: (key, value) => {
            outputs[key] = value;
        },
        setFailed: message => failures.push(message),
    };
    const log = console.log;
    console.log = () => {};
    try {
        await new AsyncFunction('github', 'context', 'core', trigger.with.script)(
            github,
            context,
            core
        );
    } finally {
        console.log = log;
    }
    return { outputs, failures };
};

const head = (fullName, ref = 'feature/x', sha = 'a'.repeat(40)) => ({
    ref,
    sha,
    repo: fullName === undefined ? null : { full_name: fullName },
});
const commentEvent = {
    comment: { id: 1, body: '/preview' },
    issue: { number: 42, pull_request: {} },
};

(async () => {
    const sameRepo = await runTrigger({
        eventName: 'issue_comment',
        payload: commentEvent,
        pr: { head: head('learningeconomy/LearnCard') },
    });
    assert.deepEqual(sameRepo.failures, []);
    assert.equal(sameRepo.outputs.deploy, 'true');
    assert.equal(sameRepo.outputs.branch, 'feature/x');
    assert.equal(sameRepo.outputs.head_sha, 'a'.repeat(40));

    for (const repo of ['someone/LearnCard', undefined]) {
        const refused = await runTrigger({
            eventName: 'issue_comment',
            payload: commentEvent,
            pr: { head: head(repo) },
        });
        assert.equal(refused.failures.length, 1, `head repo ${repo} must be refused`);
        assert.equal(refused.outputs.deploy, undefined);
    }

    const dispatchFork = await runTrigger({
        eventName: 'workflow_dispatch',
        payload: { inputs: { pr_number: '42' } },
        pr: { head: head('someone/LearnCard') },
    });
    assert.equal(dispatchFork.failures.length, 1);

    const labelFork = await runTrigger({
        eventName: 'pull_request',
        payload: {
            action: 'labeled',
            label: { name: 'preview' },
            pull_request: {
                number: 42,
                labels: [{ name: 'preview' }],
                head: head('someone/LearnCard'),
            },
        },
    });
    assert.equal(labelFork.failures.length, 1);

    const otherComment = await runTrigger({
        eventName: 'issue_comment',
        payload: { ...commentEvent, comment: { id: 2, body: 'looks good' } },
        pr: { head: head('someone/LearnCard') },
    });
    assert.deepEqual(otherComment.failures, []);
    assert.equal(otherComment.outputs.deploy, 'false');

    // PR-controlled values reach github-script through env, not script source.
    for (const job of [deploy, e2e]) {
        for (const step of job.steps.filter(s => s.uses?.startsWith('actions/github-script'))) {
            assert.doesNotMatch(step.with.script, /outputs\.branch/, `${step.name} script`);
        }
    }
    for (const name of ['Post "deploying" comment', 'Update comment with preview URL']) {
        const step = deploy.steps.find(s => s.name === name);
        assert.equal(step.env.PREVIEW_BRANCH, '${{ needs.should-deploy.outputs.branch }}');
        assert.match(step.with.script, /process\.env\.PREVIEW_BRANCH/);
    }

    // E2E checks out the exact head the gate looked up.
    const checkout = e2e.steps.find(s => s.uses?.startsWith('actions/checkout'));
    assert.equal(checkout.with.ref, '${{ needs.should-deploy.outputs.head_sha }}');

    console.log('preview workflow contract passed');
})().catch(error => {
    console.error(error);
    process.exit(1);
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
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

    // Dispatch uses the fetched PR's number downstream, not the raw input.
    const dispatch = await runTrigger({
        eventName: 'workflow_dispatch',
        payload: { inputs: { pr_number: '042' } },
        pr: { number: 42, head: head('learningeconomy/LearnCard') },
    });
    assert.deepEqual(dispatch.failures, []);
    assert.equal(dispatch.outputs.deploy, 'true');
    assert.equal(dispatch.outputs.pr_number, '42');
    assert.equal(dispatch.outputs.head_sha, 'a'.repeat(40));

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

    // The EC2 deploy is pinned to the commit the gate looked up.
    const ec2 = deploy.steps.find(s => s.name === 'Deploy preview on EC2');
    assert.equal(ec2.env.HEAD_SHA, '${{ needs.should-deploy.outputs.head_sha }}');
    assert.ok(ec2.with.envs.split(',').includes('HEAD_SHA'), 'HEAD_SHA must be forwarded over SSH');
    assert.match(ec2.with.script, /\^\[0-9a-f\]\{40\}\$/, 'HEAD_SHA must be validated');
    assert.match(ec2.with.script, /git checkout --detach "\$HEAD_SHA"/);
    assert.doesNotMatch(ec2.with.script, /origin\/\$BRANCH/, 'EC2 step must not deploy the branch tip');
    assert.match(ec2.with.script, /deploy-preview\.sh[\s\\]+"\$PR_NUMBER"[\s\\]+"\$BRANCH"[\s\\]+"\$BASE_DOMAIN"[\s\\]+"\$HEAD_SHA"/);

    // deploy-preview.sh checks out the SHA it's given instead of the branch tip.
    const deployScript = fs.readFileSync(path.join(root, 'preview/scripts/deploy-preview.sh'), 'utf8');
    assert.match(deployScript, /HEAD_SHA="\$\{4:-/);
    assert.match(deployScript, /\^\[0-9a-f\]\{40\}\$/);
    assert.match(deployScript, /git fetch origin "\$HEAD_SHA"/);
    assert.match(deployScript, /git checkout --detach "\$HEAD_SHA"/);

    console.log('preview workflow contract passed');
})().catch(error => {
    console.error(error);
    process.exit(1);
});

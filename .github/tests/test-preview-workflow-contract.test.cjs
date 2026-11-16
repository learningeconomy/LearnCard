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

// PR merge/workflow SHAs are not trusted sources for secret-bearing control code.
const controlSelection = deploy.steps.find(s => s.id === 'control-ref');
assert.deepEqual(controlSelection.env, {
    PREVIEW_CONTROL_EVENT: '${{ github.event_name }}',
    PREVIEW_CONTROL_BASE_SHA: '${{ github.event.pull_request.base.sha }}',
    PREVIEW_CONTROL_WORKFLOW_SHA: '${{ github.workflow_sha }}',
});
assert.doesNotMatch(controlSelection.run, /\$\{\{/);
const controlCheckout = deploy.steps.find(s => s.name === 'Checkout preview control script');
assert.equal(controlCheckout.with.ref, '${{ steps.control-ref.outputs.ref }}');
assert.equal(controlCheckout.with['persist-credentials'], false);
assert.equal(controlCheckout.with['sparse-checkout'], '.github/scripts');
assert.equal(deploy.steps.filter(s => s.uses?.startsWith('actions/checkout')).length, 1);
const readiness = deploy.steps.find(s => s.id === 'ec2');
assert.equal(readiness.run, 'python3 .github/scripts/preview-readiness.py');
assert.equal(readiness['timeout-minutes'], 11);
assert.equal(deploy['timeout-minutes'], 40);
assert.equal(readiness.env.PREVIEW_EC2_LAMBDA_URL, '${{ secrets.PREVIEW_EC2_LAMBDA_URL }}');
assert.equal(readiness.env.PREVIEW_EC2_API_KEY, '${{ secrets.PREVIEW_EC2_API_KEY }}');
assert.ok(deploy.steps.indexOf(controlSelection) < deploy.steps.indexOf(controlCheckout));
assert.ok(deploy.steps.indexOf(controlCheckout) < deploy.steps.indexOf(readiness));
assert.equal(controlSelection.if, undefined);
assert.equal(controlSelection['continue-on-error'], undefined);
assert.equal(controlCheckout.if, undefined);
assert.equal(controlCheckout['continue-on-error'], undefined);
assert.equal(
    readiness.if,
    undefined,
    'readiness must not bypass failed trusted selection/checkout'
);
assert.doesNotMatch(readiness.run, /\$\{\{/);

const controlTemporary = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'preview-ref-'));
try {
    const base = 'a'.repeat(40),
        workflowSha = 'b'.repeat(40);
    const head = 'c'.repeat(40),
        merge = 'd'.repeat(40);
    const cases = [
        ['labeled PR', 'pull_request', base, merge, base],
        ['synchronize PR', 'pull_request', base, merge, base],
        ['comment', 'issue_comment', '', workflowSha, workflowSha],
        ['manual', 'workflow_dispatch', '', workflowSha, workflowSha],
        ['missing PR base', 'pull_request', '', merge, null],
        ['invalid PR base', 'pull_request', 'PRIVATE_INVALID_REF', merge, null],
        ['missing comment workflow', 'issue_comment', base, '', null],
        ['invalid dispatch workflow', 'workflow_dispatch', base, 'PRIVATE_INVALID_REF', null],
    ];
    for (const [name, event, baseSha, workflow, expected] of cases) {
        const output = path.join(controlTemporary, 'output');
        fs.rmSync(output, { force: true });
        const selected = spawnSync('bash', ['-e', '-c', controlSelection.run], {
            encoding: 'utf8',
            env: {
                ...process.env,
                PREVIEW_CONTROL_EVENT: event,
                PREVIEW_CONTROL_BASE_SHA: baseSha,
                PREVIEW_CONTROL_WORKFLOW_SHA: workflow,
                PR_HEAD_SHA: head,
                GITHUB_SHA: merge,
                GITHUB_OUTPUT: output,
            },
        });
        assert.equal(selected.status, expected ? 0 : 1, name);
        if (expected) assert.equal(fs.readFileSync(output, 'utf8'), `ref=${expected}\n`, name);
        else assert.equal(fs.existsSync(output), false, `${name} must not fall back to PR code`);
        assert.doesNotMatch(selected.stdout + selected.stderr, /PRIVATE_INVALID_REF/);
    }
} finally {
    fs.rmSync(controlTemporary, { recursive: true, force: true });
}
const readinessTests = spawnSync(
    'python3',
    ['-B', path.join(root, '.github/tests/test_preview_readiness.py'), '-v'],
    {
        cwd: root,
        encoding: 'utf8',
        timeout: 30_000,
    }
);
assert.equal(readinessTests.status, 0, readinessTests.stdout + readinessTests.stderr);
console.log('preview boot/SSH deadlines and isolated HTTP/TCP regressions passed');

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
    assert.doesNotMatch(
        ec2.with.script,
        /origin\/\$BRANCH/,
        'EC2 step must not deploy the branch tip'
    );
    assert.match(
        ec2.with.script,
        /deploy-preview\.sh[\s\\]+"\$PR_NUMBER"[\s\\]+"\$BRANCH"[\s\\]+"\$BASE_DOMAIN"[\s\\]+"\$HEAD_SHA"/
    );

    // deploy-preview.sh checks out the SHA it's given instead of the branch tip.
    const deployScript = fs.readFileSync(
        path.join(root, 'preview/scripts/deploy-preview.sh'),
        'utf8'
    );
    assert.match(deployScript, /HEAD_SHA="\$\{4:-/);
    assert.match(deployScript, /\^\[0-9a-f\]\{40\}\$/);
    assert.match(deployScript, /git fetch origin "\$HEAD_SHA"/);
    assert.match(deployScript, /git checkout --detach "\$HEAD_SHA"/);

    console.log('preview workflow contract passed');
})().catch(error => {
    console.error(error);
    process.exit(1);
});

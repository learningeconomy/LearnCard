const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const readWorkflow = file => {
    // Reuse the neighboring shell contracts' parser without adding a JS dependency.
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
    const workflow = JSON.parse(result.stdout);
    // Ruby's YAML 1.1 parser treats an unquoted "on" key as true.
    workflow.on ??= workflow.true;
    delete workflow.true;
    return workflow;
};
const main = readWorkflow(process.argv[2] || path.join(root, '.github/workflows/deploy.yml'));
const agent = readWorkflow(
    process.argv[3] || path.join(root, '.github/workflows/deploy-ai-agent.yml')
);
const determine = main.jobs['determine-affected'];
const deploy = main.jobs['deploy-ai-agent'];
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'learncard-ai-deploy-'));
let invocation = 0;

// These routing expressions use JavaScript-compatible comparisons/boolean operators.
// Bracket access preserves GitHub's hyphenated job/input names when evaluating them.
const evaluate = (expression, context) =>
    vm.runInNewContext(
        expression
            .trim()
            .replace(/^\$\{\{\s*|\s*\}\}$/g, '')
            .replace(/\.([\w-]+)/g, '["$1"]'),
        {
            always: () => true,
            cancelled: () => false,
            contains: (value, item) => value.includes(item),
            ...context,
        },
        { timeout: 1000 }
    );

const runStep = (id, values) => {
    const output = path.join(temporary, `output-${invocation++}`);
    const step = determine.steps.find(candidate => candidate.id === id);
    const result = spawnSync('bash', ['-e', '-o', 'pipefail', '-c', step.run], {
        encoding: 'utf8',
        env: {
            ...process.env,
            PATH: `${temporary}${path.delimiter}${process.env.PATH}`,
            GITHUB_OUTPUT: output,
            ...values,
        },
    });
    assert.equal(result.status, 0, result.stderr);
    return Object.fromEntries(
        fs
            .readFileSync(output, 'utf8')
            .trim()
            .split('\n')
            .map(line => line.split('='))
    );
};

const route = ({
    message = 'feat: update AI Agent',
    files = [],
    affected = 'ai-agent-service',
    tests = 'success',
    manual = false,
    selected = false,
    environment = 'staging',
    cancelled = false,
    detection = 'success',
} = {}) => {
    const steps = {
        affected: { outputs: { affected } },
        check_manual: { outputs: { is_manual: String(manual) } },
        check_release: { outputs: manual ? {} : runStep('check_release', { COMMIT_MSG: message }) },
        check_versions: { outputs: runStep('check_versions', { CHANGED_PATHS: files.join('\n') }) },
    };
    const outputs = Object.fromEntries(
        Object.entries(determine.outputs)
            .filter(([name]) =>
                ['affected', 'is_manual', 'is_release', 'ai_agent_changed'].includes(name)
            )
            .map(([name, expression]) => [name, evaluate(expression, { steps })])
    );
    const results = {
        'determine-affected': { result: detection, outputs },
        'test-affected': { result: tests },
    };
    const context = {
        github: { event_name: manual ? 'workflow_dispatch' : 'push' },
        inputs: { 'deploy-ai-agent': selected, 'target-environment': environment },
        needs: Object.fromEntries((deploy.needs || []).map(name => [name, results[name]])),
        cancelled: () => cancelled,
    };
    if (!evaluate(deploy.if, context)) return undefined;
    return evaluate(deploy.with['target-environment'], context);
};

try {
    // Execute the real version-detection shell, replacing only its git file-list input.
    fs.writeFileSync(
        path.join(temporary, 'git'),
        '#!/usr/bin/env bash\nprintf "%s\\n" "$CHANGED_PATHS"\n',
        { mode: 0o755 }
    );

    assert.equal(route(), 'staging', 'affected main pushes must deploy staging');
    assert.equal(
        route({ tests: 'failure' }),
        undefined,
        'failed staging tests must block deployment'
    );
    assert.equal(
        route({ affected: 'scouts' }),
        undefined,
        'unrelated main pushes must not deploy AI'
    );

    const release = { message: 'chore(release): version packages', tests: 'skipped' };
    const aiPackage = 'services/learn-card-network/ai-agent/package.json';
    assert.equal(
        route({ ...release, files: [aiPackage] }),
        'production',
        'AI version releases must deploy production'
    );
    assert.equal(
        route({ ...release, files: ['apps/learn-card-app/package.json'] }),
        undefined,
        'other package releases must not deploy AI'
    );
    assert.equal(
        route({ ...release, files: [aiPackage], cancelled: true }),
        undefined,
        'cancelled releases must not deploy'
    );
    assert.equal(
        route({ detection: 'failure' }),
        undefined,
        'failed affected detection must not deploy'
    );

    const manual = { manual: true, selected: true, tests: 'skipped' };
    assert.equal(route({ ...manual, environment: 'production' }), 'production');
    assert.equal(route({ ...manual, environment: 'staging' }), 'staging');
    assert.equal(
        route({ ...manual, environment: 'scouts' }),
        undefined,
        'ScoutPass dispatch must not select AI'
    );
    assert.equal(
        route({ ...manual, selected: false }),
        undefined,
        'manual component selection must be honored'
    );

    assert.deepEqual(
        [main, agent].filter(workflow => Object.hasOwn(workflow.on, 'push')),
        [main],
        'main Deploy must be the only automatic deployment entrypoint'
    );
    assert.equal(
        Object.hasOwn(agent.on, 'workflow_dispatch'),
        false,
        'manual overrides belong to main Deploy'
    );
    assert.equal(
        evaluate(agent.jobs.deploy.if, { github: { event_name: 'pull_request' } }),
        false,
        'PR validation must never deploy'
    );
    assert.equal(agent.on.pull_request.paths, undefined, 'AI CI must also report on unrelated PRs');
    console.log(
        'AI Agent routing passed: affected staging, Changesets production, failure/cancellation gates, manual overrides, and PR isolation.'
    );
} finally {
    fs.rmSync(temporary, { recursive: true, force: true });
}

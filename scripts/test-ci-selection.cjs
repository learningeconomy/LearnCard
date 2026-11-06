const { appendFileSync, readFileSync } = require('node:fs');
const { spawnSync } = require('node:child_process');
const { join } = require('node:path');
const { loadNxGraph } = require('./mock-e2e-ci.cjs');

const brainTasks = [
    'test:integration',
    'test:profile-search',
    'test:inbox:e2e',
    'test:boost-recipients',
    'test:campaigns',
].map(target => `network-brain-service:${target}`);
const groups = {
    brain: { projects: ['network-brain-service'], tasks: brainTasks },
    campaigns: {
        projects: ['network-brain-service', 'lca-api-service'],
        tasks: [...brainTasks, 'lca-api-service:test:integration'],
    },
    escrow: {
        // Preserve the previous escrow change detector's explicit dependencies too.
        projects: ['lca-api-service', 'sss-key-manager', 'escrow-enclave-app'],
        tasks: ['lca-api-service:test:integration'],
    },
};
const graphArgs = [
    'run-many',
    '--projects=network-brain-service,lca-api-service',
    '--targets=test:integration,test:profile-search,test:inbox:e2e,test:boost-recipients,test:campaigns',
];
const all = reason =>
    Object.fromEntries(Object.keys(groups).map(key => [key, { run: true, reason }]));

// These reviewed files configure only the separate full-E2E workflow. Unknown
// tooling stays conservative; a new workflow/script is not automatically exempt.
const independentInputs = new Set([
    '.github/workflows/e2e.yml',
    '.github/tests/test-hosted-e2e-workflow-contract.test.sh',
    'scripts/e2e-hosted/README.md',
]);
const isNonInput = path =>
    independentInputs.has(path) ||
    ['README.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'LICENSE'].includes(path) ||
    /^docs\/.+\.md$/.test(path) ||
    /^\.changeset\/[^/]+\.md$/.test(path);

const decideFromGraph = (paths, { graph, tasks, workspaceConfig = {} }) => {
    const owners = Object.entries(graph.nodes)
        .map(([name, node]) => {
            const root = node.data.root;
            if (typeof root !== 'string' || !root || root === '.' || root.includes('..'))
                throw new Error('Uncertain project ownership');
            return { name, root };
        })
        .sort((a, b) => b.root.length - a.root.length);
    const ownerOf = path => owners.find(project => path.startsWith(`${project.root}/`))?.name;
    const changed = paths.filter(path => !isNonInput(path)).map(ownerOf);
    if (changed.some(name => !name)) return all('unowned-path');

    return Object.fromEntries(
        Object.entries(groups).map(([key, group]) => {
            const required = new Set();
            const visit = name => {
                if (required.has(name)) return;
                const node = graph.nodes[name];
                if (!node) throw new Error('Missing project');
                required.add(name);
                if (!Array.isArray(graph.dependencies[name]))
                    throw new Error('Missing dependency list');
                for (const edge of graph.dependencies[name]) {
                    if (graph.nodes[edge.target]) visit(edge.target);
                    else if (!edge.target.startsWith('npm:')) throw new Error('Missing dependency');
                }
                // Inputs may explicitly reference another workspace project even
                // without an import edge. Include its dependency closure too.
                const inspect = value => {
                    if (typeof value === 'string' && value.includes('{workspaceRoot}/')) {
                        const prefix = value.split('{workspaceRoot}/')[1].split(/[*!?{[]/)[0];
                        for (const project of owners) {
                            if (
                                prefix.startsWith(`${project.root}/`) ||
                                `${project.root}/`.startsWith(prefix)
                            )
                                visit(project.name);
                        }
                    } else if (value && typeof value === 'object') {
                        Object.values(value).forEach(inspect);
                    }
                };
                inspect(node.data.namedInputs);
                inspect(node.data.targets);
                // Root named inputs/defaults are not expanded into graph nodes.
                // Include their workspace references conservatively as well.
                inspect(workspaceConfig.namedInputs);
                inspect(workspaceConfig.targetDefaults);
            };
            group.projects.forEach(visit);
            const seenTasks = new Set();
            const visitTask = id => {
                if (seenTasks.has(id)) return;
                seenTasks.add(id);
                const task = tasks.tasks[id];
                if (!task) throw new Error('Missing prerequisite task');
                visit(task.target.project);
                if (!Array.isArray(tasks.dependencies[id]))
                    throw new Error('Missing task dependencies');
                for (const dependency of tasks.dependencies[id]) visitTask(dependency);
            };
            group.tasks.forEach(visitTask);
            const run = changed.some(name => required.has(name));
            return [
                key,
                { run, reason: run ? 'project-or-dependency-change' : 'unrelated-projects' },
            ];
        })
    );
};

const select = ({ eventName, baseSha, headSha, cwd = process.cwd(), getGraph = loadNxGraph }) => {
    if (eventName === 'workflow_dispatch') return all('manual-dispatch');
    if (!['pull_request', 'merge_group'].includes(eventName)) return all('unknown-event');
    if (![baseSha, headSha].every(sha => /^[a-f0-9]{40,64}$/i.test(sha ?? '')))
        return all('missing-comparison');
    const range =
        eventName === 'pull_request' ? `${baseSha}...${headSha}` : `${baseSha}..${headSha}`;
    const diff = flags => {
        const result = spawnSync(
            'git',
            ['diff', '--name-only', '--no-renames', '-z', ...flags, range, '--'],
            {
                cwd,
                encoding: 'utf8',
                timeout: 30_000,
                maxBuffer: 16 * 1024 * 1024,
            }
        );
        if (result.error || result.status !== 0) throw new Error('Comparison unavailable');
        return result.stdout.split('\0').filter(Boolean);
    };
    let paths;
    try {
        const checkout = spawnSync('git', ['rev-parse', 'HEAD'], {
            cwd,
            encoding: 'utf8',
            timeout: 30_000,
        });
        if (checkout.error || checkout.status !== 0 || checkout.stdout.trim() !== headSha)
            return all('checkout-mismatch');
        paths = diff([]);
        if (!paths.length) return all('empty-comparison');
        if (paths.every(isNonInput))
            return Object.fromEntries(
                Object.keys(groups).map(key => [key, { run: false, reason: 'independent-inputs' }])
            );
        // Deleted sources/declarations can erase the old graph's consumer edges.
        if (diff(['--diff-filter=DT']).some(path => !isNonInput(path)))
            return all('deleted-or-type-changed-input');
    } catch {
        return all('comparison-unavailable');
    }
    if (
        paths.some(
            path =>
                !isNonInput(path) &&
                (!/^(apps|packages|services|examples|tests|tools)\//.test(path) ||
                    /(^|\/)(package\.json|project\.json|tsconfig[^/]*\.json|\.gitignore|\.nxignore)$/.test(
                        path
                    ))
        )
    )
        return all('configuration-or-unknown-input');
    try {
        return decideFromGraph(paths, {
            ...getGraph(cwd, graphArgs),
            workspaceConfig: JSON.parse(readFileSync(join(cwd, 'nx.json'), 'utf8')),
        });
    } catch {
        return all('graph-unavailable');
    }
};

if (require.main === module) {
    const decisions = select({
        eventName: process.env.GITHUB_EVENT_NAME,
        baseSha: process.env.BASE_SHA,
        headSha: process.env.HEAD_SHA,
    });
    for (const [group, { run, reason }] of Object.entries(decisions)) {
        console.log(`${group}: ${run ? 'run' : 'skip'} (${reason})`);
        if (process.env.GITHUB_OUTPUT)
            appendFileSync(process.env.GITHUB_OUTPUT, `${group}=${run}\n`);
    }
    if (process.env.GITHUB_STEP_SUMMARY) {
        try {
            appendFileSync(
                process.env.GITHUB_STEP_SUMMARY,
                `## Integration test selection\n\n${Object.entries(decisions)
                    .map(
                        ([key, value]) =>
                            `- ${key}: **${value.run ? 'run' : 'not applicable — skipped'}** (${value.reason})`
                    )
                    .join('\n')}\n`
            );
        } catch {
            console.warn('Optional selection summary unavailable.');
        }
    }
}

module.exports = { select, decideFromGraph, graphArgs, groups };

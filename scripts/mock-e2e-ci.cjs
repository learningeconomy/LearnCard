const { spawnSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { appendFileSync, existsSync, mkdtempSync, readFileSync, rmSync } = require('node:fs');
const { arch, platform, tmpdir } = require('node:os');
const { dirname, join, resolve } = require('node:path');

// Skip only known prose/release-note locations. All code, shared packages,
// tooling, assets and unknown paths need a dependency check or the full suite.
const isProse = path =>
    ['README.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'LICENSE'].includes(path) ||
    /^docs\/.+\.md$/.test(path) ||
    /^\.changeset\/[^/]+\.md$/.test(path);

const decideFromGraph = (paths, { graph, tasks }) => {
    const app = graph.nodes['learn-card-app'];
    const planned = Object.values(tasks.tasks);
    if (
        !app?.data.targets['test-mock'] ||
        !planned.some(
            task => task.target.project === 'learn-card-app' && task.target.target === 'test-mock'
        )
    )
        throw new Error('Missing mock E2E project/task');

    const required = new Set();
    const visit = name => {
        if (required.has(name)) return;
        if (!graph.nodes[name]) throw new Error('Incomplete project graph');
        required.add(name);
        for (const edge of graph.dependencies[name] ?? []) {
            if (graph.nodes[edge.target]) visit(edge.target);
            else if (!edge.target.startsWith('npm:')) throw new Error('Unknown graph dependency');
        }
    };
    visit('learn-card-app');
    // Include Nx's actual prerequisite tasks, including explicit dependsOn projects
    // that need not have a source-import edge from the app.
    for (const task of planned) visit(task.target.project);

    const projects = Object.entries(graph.nodes)
        .map(([name, node]) => {
            const root = node.data.root;
            if (typeof root !== 'string' || !root || root === '.' || root.includes('..')) {
                throw new Error('Unknown project ownership');
            }
            return { name, root };
        })
        .sort((a, b) => b.root.length - a.root.length);
    for (const path of paths.filter(path => !isProse(path))) {
        const owner = projects.find(project => path.startsWith(`${project.root}/`));
        if (!owner) return { run: true, reason: 'unowned-path' };
        if (required.has(owner.name)) return { run: true, reason: 'mock-dependency-change' };
    }
    return { run: false, reason: 'unrelated-projects' };
};

const loadNxGraph = cwd => {
    // A fresh runner has no workspace install. Never replace an existing install.
    if (existsSync(join(cwd, 'node_modules'))) throw new Error('Workspace already installed');
    const versions = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')).devDependencies;
    if (![versions.nx, versions.typescript].every(version => /^\d+\.\d+\.\d+$/.test(version))) {
        throw new Error('Preflight requires exact Nx and TypeScript versions');
    }
    const tools = mkdtempSync(join(tmpdir(), 'mock-e2e-nx-'));
    const run = (command, args, env = process.env) => {
        const result = spawnSync(command, args, {
            cwd,
            env,
            encoding: 'utf8',
            timeout: 120_000,
            maxBuffer: 16 * 1024 * 1024,
        });
        if (result.error || result.status !== 0) throw new Error('Nx preflight unavailable');
        return result.stdout;
    };
    try {
        // Install only the graph tooling outside the checkout, without lifecycle scripts.
        run('npm', [
            'install',
            '--prefix',
            tools,
            '--ignore-scripts',
            '--no-audit',
            '--no-fund',
            `nx@${versions.nx}`,
            `typescript@${versions.typescript}`,
        ]);
        const modules = join(tools, 'node_modules');
        const nx = JSON.parse(readFileSync(join(modules, 'nx/package.json'), 'utf8'));
        if (nx.version !== versions.nx) throw new Error('Unexpected Nx version');
        const file = join(tools, 'graph.json');
        // --graph plans tasks; it does not execute builds or browser tests.
        run(
            process.execPath,
            [join(modules, 'nx', nx.bin.nx), 'run', 'learn-card-app:test-mock', `--graph=${file}`],
            {
                ...process.env,
                NODE_PATH: modules,
                NX_DAEMON: 'false',
                NX_ISOLATE_PLUGINS: 'false',
                NX_CACHE_PROJECT_GRAPH: 'false',
            }
        );
        return JSON.parse(readFileSync(file, 'utf8'));
    } finally {
        rmSync(tools, { recursive: true, force: true });
    }
};

const decideEligibility = ({ eventName, baseSha, headSha, cwd = process.cwd(), getGraph }) => {
    if (eventName === 'workflow_dispatch') return { run: true, reason: 'manual-dispatch' };
    if (eventName !== 'pull_request') return { run: true, reason: 'unknown-event' };
    if (![baseSha, headSha].every(sha => /^[a-f0-9]{40,64}$/i.test(sha ?? ''))) {
        return { run: true, reason: 'missing-comparison' };
    }

    // Three-dot compares the PR's changes since its merge base, not unrelated
    // base-branch commits. Disabling rename detection includes BOTH old/new paths.
    const diff = spawnSync(
        'git',
        ['diff', '--name-only', '--no-renames', '-z', `${baseSha}...${headSha}`, '--'],
        { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
    );
    if (diff.error || diff.status !== 0) return { run: true, reason: 'comparison-unavailable' };
    const paths = diff.stdout.split('\0').filter(Boolean);
    if (paths.length === 0) return { run: true, reason: 'empty-comparison' };
    if (paths.every(isProse)) return { run: false, reason: 'prose-only' };
    // A deleted/renamed module can erase an import edge from the head graph.
    // Do not use that graph to justify skipping the module's former consumers.
    const removed = spawnSync(
        'git',
        [
            'diff',
            '--name-only',
            '--no-renames',
            '--diff-filter=DT',
            '-z',
            `${baseSha}...${headSha}`,
            '--',
        ],
        { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
    );
    if (removed.error || removed.status !== 0)
        return { run: true, reason: 'comparison-unavailable' };
    if (
        removed.stdout
            .split('\0')
            .filter(Boolean)
            .some(path => !isProse(path))
    ) {
        return { run: true, reason: 'deleted-or-type-changed-input' };
    }
    // Global/unknown locations and dependency metadata always run. Do not trust a
    // head-only graph to explain a changed/deleted dependency declaration.
    if (
        paths.some(
            path =>
                !isProse(path) &&
                (!/^(apps|packages|services|examples|tests|tools)\//.test(path) ||
                    /(^|\/)(package\.json|project\.json|tsconfig[^/]*\.json|\.gitignore|\.nxignore)$/.test(
                        path
                    ))
        )
    )
        return { run: true, reason: 'code-config-or-unknown-path' };
    if (!getGraph) return { run: true, reason: 'graph-unavailable' };
    try {
        return decideFromGraph(paths, getGraph(cwd));
    } catch {
        return { run: true, reason: 'graph-unavailable' };
    }
};

const browserCacheKey = ({ version, manifest, osRelease, hostPlatform, hostArch }) => {
    const firefox = JSON.parse(manifest).browsers.find(browser => browser.name === 'firefox');
    if (!firefox?.revision || !version || !osRelease || !hostPlatform || !hostArch) {
        throw new Error('Incomplete Playwright browser cache identity');
    }
    const hash = value => createHash('sha256').update(value).digest('hex');
    // The full manifest also covers FFmpeg and platform-specific revision overrides.
    return `mock-firefox-v1-${hostPlatform}-${hostArch}-${hash(osRelease)}-${version}-${firefox.revision}-${hash(manifest)}`;
};

const main = () => {
    let outputs;
    if (process.argv[2] === 'eligibility') {
        const result = decideEligibility({
            eventName: process.env.GITHUB_EVENT_NAME,
            baseSha: process.env.BASE_SHA,
            headSha: process.env.HEAD_SHA,
            getGraph: loadNxGraph,
        });
        outputs = { run_e2e: String(result.run), reason: result.reason };
    } else if (process.argv[2] === 'browser-cache-key') {
        const app = resolve('apps/learn-card-app');
        const playwright = require.resolve('playwright/package.json', { paths: [app] });
        const core = dirname(
            require.resolve('playwright-core/package.json', { paths: [dirname(playwright)] })
        );
        outputs = {
            key: browserCacheKey({
                version: JSON.parse(readFileSync(resolve(core, 'package.json'), 'utf8')).version,
                manifest: readFileSync(resolve(core, 'browsers.json'), 'utf8'),
                osRelease: readFileSync('/etc/os-release', 'utf8'),
                hostPlatform: platform(),
                hostArch: arch(),
            }),
        };
    } else {
        throw new Error('Expected eligibility or browser-cache-key');
    }
    for (const [name, value] of Object.entries(outputs)) {
        console.log(`${name}=${value}`);
        if (process.env.GITHUB_OUTPUT)
            appendFileSync(process.env.GITHUB_OUTPUT, `${name}=${value}\n`);
    }
};

if (require.main === module) main();
module.exports = { decideEligibility, decideFromGraph, loadNxGraph, browserCacheKey };

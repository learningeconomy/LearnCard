const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    renameSync,
    rmSync,
    writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const { dirname, join } = require('node:path');
const test = require('node:test');
const {
    decideEligibility,
    decideFromGraph,
    loadNxGraph,
    browserCacheKey,
    validatePreflightVersions,
    eligibilitySummary,
} = require('./mock-e2e-ci.cjs');

const script = join(__dirname, 'mock-e2e-ci.cjs');
const fixture = t => {
    const cwd = mkdtempSync(join(tmpdir(), 'mock-e2e-policy-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const git = (...args) =>
        execFileSync('git', args, {
            cwd,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'pipe'],
        }).trim();
    const write = (path, content = 'fixture\n') => {
        mkdirSync(dirname(join(cwd, path)), { recursive: true });
        writeFileSync(join(cwd, path), content);
    };
    const commit = () => {
        git('add', '-A');
        git(
            '-c',
            'core.hooksPath=/dev/null',
            '-c',
            'user.name=Fixture',
            '-c',
            'user.email=fixture@example.com',
            'commit',
            '--allow-empty',
            '-qm',
            'fixture'
        );
        return git('rev-parse', 'HEAD');
    };
    git('init', '-q', '-b', 'main');
    write('README.md');
    write('docs/guide.md');
    write('packages/shared/src/index.ts');
    const baseSha = commit();
    const decide = headSha =>
        decideEligibility({ eventName: 'pull_request', baseSha, headSha, cwd });
    return { cwd, git, write, commit, baseSha, decide };
};

test('prose-only PR skips, while manual dispatch always runs without comparison metadata', t => {
    const f = fixture(t);
    f.write('docs/guide.md', 'Updated prose\n');
    f.write('.changeset/example.md');
    f.write('README.md', 'Updated readme\n');
    assert.deepEqual(f.decide(f.commit()), { run: false, reason: 'prose-only' });
    assert.deepEqual(decideEligibility({ eventName: 'workflow_dispatch' }), {
        run: true,
        reason: 'manual-dispatch',
    });
});

for (const path of [
    'apps/learn-card-app/src/App.tsx',
    'packages/shared/src/index.ts',
    'packages/plugins/crypto/src/index.ts',
    'services/example/src/index.ts',
    'bun.lock',
    'package.json',
    'nx.json',
    'tsconfig.base.json',
    'scripts/build.ts',
    '.github/workflows/mock-e2e.yml',
    'apps/learn-card-app/tests/mocks/har/issue.har.zip',
    'docs/snippets/quickstart/index.ts',
    'docs/asset.svg',
    'unknown/new-input',
    'packages/shared/src/with\nnewline.ts',
]) {
    test(`conservatively runs for ${JSON.stringify(path)}, even mixed with docs`, t => {
        const f = fixture(t);
        f.write('docs/guide.md', 'Updated prose\n');
        f.write(path, 'Changed code/config/input\n');
        assert.equal(f.decide(f.commit()).run, true);
    });
}

test('renaming code into a documentation location cannot hide its deletion', t => {
    const f = fixture(t);
    renameSync(join(f.cwd, 'packages/shared/src/index.ts'), join(f.cwd, 'docs/moved.md'));
    assert.equal(f.decide(f.commit()).run, true);
});

test('renaming documentation into code cannot hide the new input', t => {
    const f = fixture(t);
    renameSync(join(f.cwd, 'docs/guide.md'), join(f.cwd, 'packages/shared/src/guide.ts'));
    assert.equal(f.decide(f.commit()).run, true);
});

test('code deletion runs; a prose deletion can skip', t => {
    const f = fixture(t);
    rmSync(join(f.cwd, 'docs/guide.md'));
    assert.equal(f.decide(f.commit()).run, false);
    rmSync(join(f.cwd, 'packages/shared/src/index.ts'));
    assert.equal(f.decide(f.commit()).run, true);
});

test('merge-base comparison ignores unrelated new commits on the base branch', t => {
    const f = fixture(t);
    f.git('checkout', '-qb', 'feature');
    f.write('docs/guide.md', 'PR prose\n');
    const headSha = f.commit();
    f.git('checkout', '-q', 'main');
    f.write('packages/shared/src/index.ts', 'Unrelated main change\n');
    const baseSha = f.commit();
    assert.deepEqual(
        decideEligibility({ eventName: 'pull_request', baseSha, headSha, cwd: f.cwd }),
        {
            run: false,
            reason: 'prose-only',
        }
    );
});

test('missing, invalid, unreachable or empty comparisons run rather than silently skipping', t => {
    const f = fixture(t);
    for (const baseSha of [undefined, '--not-a-sha', 'f'.repeat(40), f.baseSha]) {
        assert.equal(
            decideEligibility({
                eventName: 'pull_request',
                baseSha,
                headSha: f.baseSha,
                cwd: f.cwd,
            }).run,
            true
        );
    }
    assert.equal(decideEligibility({ eventName: 'unexpected' }).run, true);
    assert.equal(
        decideEligibility({
            eventName: 'pull_request',
            baseSha: f.baseSha,
            headSha: f.baseSha,
            cwd: '/missing-repository',
        }).run,
        true
    );
});

test('CLI emits the decision through GitHub outputs with no installed dependencies', t => {
    const f = fixture(t);
    f.write('docs/guide.md', 'PR prose\n');
    const headSha = f.commit();
    const output = join(f.cwd, 'output');
    const summary = join(f.cwd, 'summary');
    writeFileSync(summary, 'Earlier step\n');
    const result = spawnSync(process.execPath, [script, 'eligibility'], {
        cwd: f.cwd,
        encoding: 'utf8',
        env: {
            ...process.env,
            GITHUB_EVENT_NAME: 'pull_request',
            BASE_SHA: f.baseSha,
            HEAD_SHA: headSha,
            GITHUB_OUTPUT: output,
            GITHUB_STEP_SUMMARY: summary,
        },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(output, 'utf8'), 'run_e2e=false\nreason=prose-only\n');
    assert.match(readFileSync(summary, 'utf8'), /^Earlier step\n### Mock E2E/);
    assert.match(readFileSync(summary, 'utf8'), /Not applicable.*suite skipped/);
    assert.match(readFileSync(summary, 'utf8'), /`prose-only`/);
});

const projectGraph = () => ({
    graph: {
        nodes: Object.fromEntries(
            [
                ['learn-card-app', 'apps/learn-card-app'],
                ['ui', 'packages/ui'],
                ['core', 'packages/shared'],
                ['scouts', 'apps/scouts'],
                ['backend', 'services/backend'],
                ['builder', 'tools/builder'],
            ].map(([name, root]) => [
                name,
                { data: { root, targets: name === 'learn-card-app' ? { 'test-mock': {} } : {} } },
            ])
        ),
        dependencies: {
            'learn-card-app': [{ target: 'ui', type: 'implicit' }],
            ui: [{ target: 'core', type: 'dynamic' }],
            backend: [{ target: 'core', type: 'static' }],
        },
    },
    tasks: {
        tasks: {
            'learn-card-app:test-mock': {
                target: { project: 'learn-card-app', target: 'test-mock' },
            },
            'builder:build': { target: { project: 'builder', target: 'build' } },
        },
    },
});

test('Nx graph skips unrelated app/service projects but keeps direct/transitive/implicit dependencies', () => {
    for (const path of ['apps/scouts/src/App.tsx', 'services/backend/src/route.ts']) {
        assert.deepEqual(decideFromGraph([path, 'docs/guide.md'], projectGraph()), {
            run: false,
            reason: 'unrelated-projects',
        });
    }
    for (const path of [
        'apps/learn-card-app/tests/example.spec.ts',
        'packages/ui/src/view.tsx',
        'packages/shared/src/index.ts',
        'tools/builder/src/build.ts',
    ])
        assert.deepEqual(decideFromGraph([path], projectGraph()), {
            run: true,
            reason: 'mock-dependency-change',
        });
});

test('task prerequisites outside source-import graph still require tests; cycles terminate', () => {
    const snapshot = projectGraph();
    snapshot.graph.dependencies.core = [{ target: 'ui', type: 'static' }];
    assert.equal(decideFromGraph(['tools/builder/src/build.ts'], snapshot).run, true);
    assert.equal(decideFromGraph(['apps/scouts/src/App.tsx'], snapshot).run, false);
    assert.equal(decideFromGraph(['packages/shared/src/index.ts'], snapshot).run, true);
});

test('Nx ownership prefers the deepest project; unowned/new/deleted project paths run', () => {
    const snapshot = projectGraph();
    snapshot.graph.nodes['nested-ui'] = { data: { root: 'apps/scouts/nested', targets: {} } };
    snapshot.graph.dependencies.ui.push({ target: 'nested-ui', type: 'static' });
    assert.equal(decideFromGraph(['apps/scouts/nested/view.ts'], snapshot).run, true);
    assert.equal(decideFromGraph(['packages/new-or-deleted/src/index.ts'], snapshot).run, true);
});

test('real Git decisions use the Nx provider only for eligible project changes', t => {
    const f = fixture(t);
    f.write('apps/scouts/src/App.tsx');
    assert.deepEqual(
        decideEligibility({
            eventName: 'pull_request',
            baseSha: f.baseSha,
            headSha: f.commit(),
            cwd: f.cwd,
            getGraph: projectGraph,
        }),
        {
            run: false,
            reason: 'unrelated-projects',
        }
    );
    f.write('packages/shared/src/index.ts', 'Shared dependency changed\n');
    assert.equal(
        decideEligibility({
            eventName: 'pull_request',
            baseSha: f.baseSha,
            headSha: f.commit(),
            cwd: f.cwd,
            getGraph: projectGraph,
        }).run,
        true
    );
});

test('global config, project metadata and manual runs bypass graph-based skipping', t => {
    const f = fixture(t);
    f.write('apps/scouts/project.json');
    const getGraph = () => {
        throw new Error('must not be called');
    };
    const args = {
        eventName: 'pull_request',
        baseSha: f.baseSha,
        headSha: f.commit(),
        cwd: f.cwd,
        getGraph,
    };
    assert.equal(decideEligibility(args).reason, 'code-config-or-unknown-path');
    assert.equal(
        decideEligibility({ ...args, eventName: 'workflow_dispatch' }).reason,
        'manual-dispatch'
    );
});

test('unavailable or malformed graph/task plans run instead of skipping', t => {
    const f = fixture(t);
    f.write('apps/scouts/src/App.tsx');
    const args = { eventName: 'pull_request', baseSha: f.baseSha, headSha: f.commit(), cwd: f.cwd };
    for (const getGraph of [
        () => {
            throw new Error('bootstrap failed');
        },
        () => ({}),
        () => {
            const g = projectGraph();
            delete g.graph.nodes['learn-card-app'];
            return g;
        },
        () => {
            const g = projectGraph();
            g.tasks.tasks = {};
            return g;
        },
        () => {
            const g = projectGraph();
            g.graph.dependencies.ui.push({ target: 'missing' });
            return g;
        },
    ])
        assert.deepEqual(decideEligibility({ ...args, getGraph }), {
            run: true,
            reason: 'graph-unavailable',
        });
});

test('deleting or renaming code runs even if its former dependency edge is absent', t => {
    const f = fixture(t);
    // The head graph could have lost the edge when an imported module disappeared.
    const getGraph = () => {
        throw new Error('must not trust head graph for a deletion');
    };
    renameSync(join(f.cwd, 'packages/shared/src/index.ts'), join(f.cwd, 'docs/moved.md'));
    assert.deepEqual(
        decideEligibility({
            eventName: 'pull_request',
            baseSha: f.baseSha,
            headSha: f.commit(),
            cwd: f.cwd,
            getGraph,
        }),
        {
            run: true,
            reason: 'deleted-or-type-changed-input',
        }
    );
});

test('root project ownership visibly requests a full run', t => {
    const f = fixture(t);
    f.write('apps/scouts/src/App.tsx');
    const getGraph = () => {
        const snapshot = projectGraph();
        snapshot.graph.nodes.root = { data: { root: '.', targets: {} } };
        return snapshot;
    };
    assert.deepEqual(
        decideEligibility({
            eventName: 'pull_request',
            baseSha: f.baseSha,
            headSha: f.commit(),
            cwd: f.cwd,
            getGraph,
        }),
        {
            run: true,
            reason: 'root-project-requires-full-run',
        }
    );
});

test('preflight manifest must match exact root tool versions', () => {
    const versions = { nx: '23.2.1', typescript: '5.9.3' };
    validatePreflightVersions(versions, { dependencies: { ...versions } });
    for (const dependencies of [
        { ...versions, nx: '23.2.2' },
        { ...versions, typescript: '^5.9.3' },
        { nx: versions.nx },
        { ...versions, extra: '1.0.0' },
    ])
        assert.throws(() => validatePreflightVersions(versions, { dependencies }), {
            code: 'PREFLIGHT_VERSION_MISMATCH',
        });
    assert.throws(
        () =>
            validatePreflightVersions(
                { ...versions, nx: '^23.2.1' },
                { dependencies: { ...versions } }
            ),
        { code: 'PREFLIGHT_VERSION_MISMATCH' }
    );
});

test('bootstrap uses copied lockfile and npm ci from outside the checkout, then cleans tools', t => {
    const f = fixture(t);
    const versions = { nx: '23.2.1', typescript: '5.9.3' };
    f.write('package.json', JSON.stringify({ private: true, devDependencies: versions }));
    const manifest = JSON.stringify({ private: true, dependencies: versions });
    const lock = JSON.stringify({
        lockfileVersion: 3,
        packages: { '': { dependencies: versions } },
    });
    f.write('.github/mock-e2e-preflight/package.json', manifest);
    f.write('.github/mock-e2e-preflight/package-lock.json', lock);
    f.write('.npmrc', 'registry=https://must-not-apply.invalid/\n');
    const record = join(f.cwd, 'bootstrap-path');
    const cli = `const fs=require('node:fs');const assert=require('node:assert/strict');
assert.equal(process.cwd(),${JSON.stringify(require('node:fs').realpathSync(f.cwd))});
assert.deepEqual(process.argv.slice(2,4),['run','learn-card-app:test-mock']);
fs.writeFileSync(process.argv.find(arg=>arg.startsWith('--graph=')).slice(8),${JSON.stringify(JSON.stringify(projectGraph()))});`;
    const npm = `#!/usr/bin/env node
const fs=require('node:fs');const assert=require('node:assert/strict');
assert.deepEqual(process.argv.slice(2),['ci','--ignore-scripts','--no-audit','--no-fund']);
assert.notEqual(process.cwd(),${JSON.stringify(f.cwd)});
assert.equal(fs.existsSync('.npmrc'),false);
assert.equal(fs.readFileSync('package.json','utf8'),${JSON.stringify(manifest)});
assert.equal(fs.readFileSync('package-lock.json','utf8'),${JSON.stringify(lock)});
fs.writeFileSync(${JSON.stringify(record)},process.cwd());
fs.mkdirSync('node_modules/nx',{recursive:true});
fs.writeFileSync('node_modules/nx/package.json',JSON.stringify({version:'23.2.1',bin:{nx:'cli.cjs'}}));
fs.writeFileSync('node_modules/nx/cli.cjs',${JSON.stringify(cli)});
`;
    f.write('bin/npm', npm);
    require('node:fs').chmodSync(join(f.cwd, 'bin/npm'), 0o755);
    const previousPath = process.env.PATH;
    try {
        process.env.PATH = `${join(f.cwd, 'bin')}:${previousPath}`;
        assert.deepEqual(loadNxGraph(f.cwd), projectGraph());
    } finally {
        process.env.PATH = previousPath;
    }
    assert.equal(require('node:fs').existsSync(readFileSync(record, 'utf8')), false);
    assert.equal(require('node:fs').existsSync(join(f.cwd, 'node_modules')), false);
});

test('summaries distinguish skipped checks, requested suites and conservative fallback reasons', () => {
    assert.match(
        eligibilitySummary({ run: false, reason: 'unrelated-projects' }),
        /Not applicable.*suite skipped/
    );
    assert.match(
        eligibilitySummary({ run: true, reason: 'graph-unavailable' }),
        /Full suite requested[\s\S]*`graph-unavailable`/
    );
});

const identity = {
    version: '1.62.1',
    manifest: JSON.stringify({
        browsers: [
            { name: 'firefox', revision: '1538' },
            { name: 'ffmpeg', revision: '1011' },
        ],
    }),
    osRelease: 'ID=ubuntu\nVERSION_ID="24.04"\n',
    hostPlatform: 'linux',
    hostArch: 'x64',
};

test('browser identity is stable and changes with every compatibility input', () => {
    const key = browserCacheKey(identity);
    assert.equal(browserCacheKey({ ...identity }), key);
    assert.ok(key.length < 512);
    for (const change of [
        { version: '1.63.0' },
        { osRelease: 'ID=ubuntu\nVERSION_ID="26.04"\n' },
        { hostPlatform: 'darwin' },
        { hostArch: 'arm64' },
        { manifest: identity.manifest.replace('1538', '1539') },
        { manifest: identity.manifest.replace('1011', '1012') },
        {
            manifest: JSON.stringify({
                browsers: [
                    {
                        name: 'firefox',
                        revision: '1538',
                        revisionOverrides: { 'ubuntu24.04-x64': '1539' },
                    },
                ],
            }),
        },
    ])
        assert.notEqual(browserCacheKey({ ...identity, ...change }), key);
    assert.throws(() => browserCacheKey({ ...identity, manifest: '{bad json' }));
    assert.throws(() => browserCacheKey({ ...identity, manifest: '{"browsers":[]}' }));
    assert.throws(() => browserCacheKey({ ...identity, osRelease: '' }));
});

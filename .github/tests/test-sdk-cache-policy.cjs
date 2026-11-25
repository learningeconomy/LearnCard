const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const {
    existsSync,
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    symlinkSync,
    writeFileSync,
} = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const test = require('node:test');

const repo = path.resolve(__dirname, '../..');
const json = file => JSON.parse(readFileSync(file, 'utf8'));
const projects = {
    types: 'packages/learn-card-types',
    helpers: 'packages/learn-card-helpers',
    core: 'packages/learn-card-core',
    'nx-run-command': 'tools/executors/workspace/run-command',
};
const cached = ['core', 'helpers', 'types'];

test('native Nx honors the SDK build policy and invalidates all declared build inputs', t => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'learncard-sdk-cache-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    const put = (file, contents) => {
        const target = path.join(cwd, file);
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, contents);
    };
    const mutate = (file, transform) => {
        const original = readFileSync(path.join(cwd, file), 'utf8');
        put(file, transform(original));
        return () => put(file, original);
    };
    symlinkSync(path.join(repo, 'node_modules'), path.join(cwd, 'node_modules'), 'dir');
    put('.gitignore', 'node_modules\n.nx\n.nx-cache\n.observations\n**/dist\n');
    put(
        'package.json',
        JSON.stringify({ private: true, workspaces: ['packages/*', 'tools/executors/workspace/*'] })
    );
    for (const file of [
        'bun.lock',
        'bunfig.toml',
        '.nvmrc',
        'tsconfig.base.json',
        'tsconfig.library.json',
    ])
        put(file, readFileSync(path.join(repo, file)));
    // Use the shipped policy and actual dependency edges, but tiny build/test
    // commands. This tests native hashing/restoration, not compiler performance.
    const config = json(path.join(repo, 'nx.json'));
    config.plugins = [...(config.plugins ?? []), './observe.cjs'];
    put('nx.json', JSON.stringify(config));
    put(
        'observe.cjs',
        `exports.postTasksExecution = async (_, context) => {
            require('node:fs').writeFileSync('.observations/tasks.json', JSON.stringify(
                Object.values(context.taskResults).map(r => ({ id: r.task.id, status: r.status, cache: r.task.cache, hash: r.task.hash, code: r.code }))
            ));
        };`
    );
    const probe = `
        const fs = require('node:fs');
        const path = require('node:path');
        const action = process.argv[2];
        const name = JSON.parse(fs.readFileSync('project.json')).name;
        let root = process.cwd();
        while (!fs.existsSync(path.join(root, 'nx.json'))) root = path.dirname(root);
        const count = path.join(root, '.observations', name + '-' + action);
        fs.writeFileSync(count, String(fs.existsSync(count) ? Number(fs.readFileSync(count)) + 1 : 1));
        if (action === 'build') {
            fs.mkdirSync('dist', { recursive: true });
            fs.writeFileSync('dist/result.txt', fs.readFileSync('src/index.ts'));
        } else {
            require('node:assert/strict').equal(fs.readFileSync('dist/result.txt', 'utf8'), fs.readFileSync('src/index.ts', 'utf8'));
        }
    `;
    for (const [name, root] of Object.entries(projects)) {
        const project = json(path.join(repo, root, 'project.json'));
        const manifest = json(path.join(repo, root, 'package.json'));
        manifest.scripts = {
            build: 'node scripts/probe.cjs build',
            test: 'node scripts/probe.cjs test',
        };
        if (name !== 'nx-run-command')
            project.targets.test = {
                executor: 'nx:run-script',
                dependsOn: ['build', '^build'],
                options: { script: 'test' },
            };
        put(`${root}/project.json`, JSON.stringify(project));
        put(`${root}/package.json`, JSON.stringify(manifest));
        put(`${root}/src/index.ts`, `export const name = '${name}';\n`);
        put(`${root}/scripts/probe.cjs`, probe);
        put(`${root}/tsconfig.json`, '{"compilerOptions":{}}');
    }
    put(`${projects.core}/tsconfig.build.json`, '{"extends":"./tsconfig.json"}');
    put(`${projects['nx-run-command']}/esbuild.mjs`, '// dependency build configuration\n');
    mkdirSync(path.join(cwd, '.observations'));
    const env = {
        ...process.env,
        NX_DAEMON: 'false',
        NX_ISOLATE_PLUGINS: 'false',
        NX_NO_CLOUD: 'true',
        NX_TUI: 'false',
    };
    for (const key of [
        'NX_SKIP_NX_CACHE',
        'NX_CACHE_DIRECTORY',
        'NX_WORKSPACE_DATA_DIRECTORY',
        'NX_SELF_HOSTED_REMOTE_CACHE_SERVER',
        'NX_SELF_HOSTED_REMOTE_CACHE_ACCESS_TOKEN',
    ])
        delete env[key];
    const run = (overrides = {}) => {
        execFileSync(
            process.execPath,
            [
                require.resolve('nx/bin/nx'),
                'run-many',
                '-t',
                'test',
                '-p',
                cached.join(','),
                '--parallel=1',
            ],
            {
                cwd,
                env: { ...env, ...overrides },
                encoding: 'utf8',
                stdio: 'pipe',
                timeout: 60_000,
            }
        );
        const tasks = json(path.join(cwd, '.observations/tasks.json'));
        assert.deepEqual(
            tasks.map(row => row.id).sort(),
            [
                ...Object.keys(projects).map(name => `${name}:build`),
                ...cached.map(name => `${name}:test`),
            ].sort()
        );
        for (const row of tasks) {
            assert.equal(row.code, 0, row.id);
            if (row.id.endsWith(':test') || row.id === 'nx-run-command:build') {
                assert.equal(row.cache, false, row.id);
                assert.equal(row.status, 'success', row.id);
            }
        }
        return Object.fromEntries(
            tasks.filter(row => row.id.endsWith(':build')).map(row => [row.id.split(':')[0], row])
        );
    };
    const expectBuilds = (rows, misses) => {
        for (const name of cached)
            assert.equal(
                rows[name].status,
                misses.includes(name) ? 'success' : 'local-cache',
                name
            );
    };
    const initial = run();
    expectBuilds(initial, cached);
    for (const name of cached) rmSync(path.join(cwd, projects[name], 'dist'), { recursive: true });
    const warm = run();
    expectBuilds(warm, []);
    for (const name of cached) {
        assert.equal(readFileSync(path.join(cwd, '.observations', `${name}-build`), 'utf8'), '1');
        assert.equal(readFileSync(path.join(cwd, '.observations', `${name}-test`), 'utf8'), '2');
        assert.ok(existsSync(path.join(cwd, projects[name], 'dist/result.txt')));
    }
    const controls = [
        [
            'source and transitive dependency',
            `${projects.types}/src/index.ts`,
            cached,
            value => `${value}// changed\n`,
        ],
        [
            'project TypeScript configuration',
            `${projects.core}/tsconfig.json`,
            ['core'],
            value => `${value}\n`,
        ],
        [
            'build TypeScript configuration',
            `${projects.core}/tsconfig.build.json`,
            ['core'],
            value => `${value}\n`,
        ],
        [
            'package metadata and transitive dependency',
            `${projects.types}/package.json`,
            cached,
            value => JSON.stringify({ ...JSON.parse(value), description: 'changed' }),
        ],
        ['shared TypeScript configuration', 'tsconfig.base.json', cached, value => `${value}\n`],
        ['root lockfile', 'bun.lock', cached, value => `${value}\n`],
        [
            'dependency build script',
            `${projects['nx-run-command']}/esbuild.mjs`,
            ['core', 'helpers'],
            value => `${value}// changed\n`,
        ],
    ];
    for (const [label, file, misses, transform] of controls) {
        const restore = mutate(file, transform);
        try {
            const rows = run();
            expectBuilds(rows, misses);
            for (const name of misses) assert.notEqual(rows[name].hash, initial[name].hash, label);
        } finally {
            restore();
        }
        expectBuilds(run(), []);
    }
    expectBuilds(run({ NODE_ENV: 'cache-policy-probe' }), cached);
    put('unrelated.txt', 'an unrelated repository edit');
    expectBuilds(run(), []);
});

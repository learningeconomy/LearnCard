// SDK-only adoption of the verified-output experiment in PR #1681.
// Native Nx databases, test results, the SPA, and Docker layers are never shared.
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOTS = { browser: 'learn-card-app:docker-build', service: 'e2e:test:e2e' };
const digest = value => createHash('sha256').update(value).digest('hex');
const json = value => JSON.stringify(value);

export const safeOutput = value => {
    if (
        typeof value !== 'string' ||
        !/^(packages|services|tools)\//.test(value) ||
        value.split('/').some(part => !part || part === '.' || part === '..') ||
        /[*{}\\]/.test(value) ||
        !(
            value.endsWith('/dist') ||
            value === 'services/learn-card-network/learn-cloud-service/generated/swagger-ui'
        )
    ) {
        throw new Error(`Unaudited SDK output: ${value}`);
    }
    return value;
};

const noLinks = (root, relative) => {
    if (fs.lstatSync(root).isSymbolicLink()) throw new Error('Linked cache/workspace root');
    let current = root;
    for (const part of relative.split('/')) {
        current = path.join(current, part);
        try {
            if (fs.lstatSync(current).isSymbolicLink())
                throw new Error('Linked cache/workspace path');
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
    }
};

const separateCache = (workspace, cache) => {
    const a = path.resolve(workspace),
        b = path.resolve(cache);
    if (a === b || a.startsWith(`${b}${path.sep}`) || b.startsWith(`${a}${path.sep}`)) {
        throw new Error('Snapshot storage must be separate from the workspace');
    }
};

export const inventory = directory => {
    const entries = {};
    const visit = relative => {
        const location = path.join(directory, relative);
        const stat = fs.lstatSync(location);
        if (stat.isDirectory()) {
            if (relative) entries[relative] = { type: 'directory', mode: stat.mode & 0o777 };
            for (const name of fs.readdirSync(location).sort())
                visit(relative ? `${relative}/${name}` : name);
        } else if (stat.isFile()) {
            entries[relative] = {
                type: 'file',
                mode: stat.mode & 0o777,
                bytes: stat.size,
                sha256: digest(fs.readFileSync(location)),
            };
        } else throw new Error('SDK output must be a plain file or directory');
    };
    visit('');
    return entries;
};

const validateRoots = roots => {
    if (
        !Array.isArray(roots) ||
        !roots.length ||
        json(roots) !== json([...new Set(roots)].sort())
    ) {
        throw new Error('Invalid SDK output inventory');
    }
    roots.forEach(safeOutput);
    for (const root of roots)
        if (roots.some(other => root.startsWith(`${other}/`))) {
            throw new Error('Overlapping SDK outputs');
        }
};

export const snapshot = (workspace, cache, spec) => {
    separateCache(workspace, cache);
    validateRoots(spec.roots);
    const original = {};
    for (const root of spec.roots) {
        noLinks(workspace, root);
        original[root] = inventory(path.join(workspace, root));
    }
    fs.rmSync(cache, { recursive: true, force: true });
    const payload = path.join(cache, 'payload');
    for (const root of spec.roots) {
        noLinks(workspace, root);
        // Inventory before copying: cp must never dereference an output link.
        inventory(path.join(workspace, root));
        fs.mkdirSync(path.dirname(path.join(payload, root)), { recursive: true });
        fs.cpSync(path.join(workspace, root), path.join(payload, root), { recursive: true });
    }
    const entries = inventory(payload);
    for (const root of spec.roots) {
        if (
            json(original[root]) !== json(inventory(path.join(payload, root))) ||
            json(original[root]) !== json(inventory(path.join(workspace, root)))
        ) {
            throw new Error('SDK output changed during snapshot');
        }
    }
    fs.writeFileSync(
        path.join(cache, 'manifest.json'),
        json({ schema: 1, key: spec.key, roots: spec.roots, entries })
    );
    return entries;
};

export const restore = (workspace, cache, spec) => {
    separateCache(workspace, cache);
    validateRoots(spec.roots);
    noLinks(cache, 'manifest.json');
    noLinks(cache, 'payload');
    const manifest = JSON.parse(fs.readFileSync(path.join(cache, 'manifest.json'), 'utf8'));
    if (
        manifest.schema !== 1 ||
        manifest.key !== spec.key ||
        json(manifest.roots) !== json(spec.roots)
    ) {
        throw new Error('SDK snapshot identity mismatch');
    }
    const payload = path.join(cache, 'payload');
    if (json(inventory(payload)) !== json(manifest.entries))
        throw new Error('SDK snapshot integrity failed');
    // All inventory/path checks complete before modifying any workspace output.
    for (const root of spec.roots) {
        noLinks(workspace, root);
        if (!fs.lstatSync(path.join(payload, root)).isDirectory())
            throw new Error('Missing SDK directory');
    }
    try {
        for (const root of spec.roots) {
            fs.rmSync(path.join(workspace, root), { recursive: true, force: true });
            fs.mkdirSync(path.dirname(path.join(workspace, root)), { recursive: true });
            fs.cpSync(path.join(payload, root), path.join(workspace, root), { recursive: true });
        }
    } catch (error) {
        // A partial copy cannot authorize dependency skipping.
        for (const root of spec.roots)
            fs.rmSync(path.join(workspace, root), { recursive: true, force: true });
        throw error;
    }
};

export const plan = graphs => {
    const builds = new Map();
    const consumers = {};
    const sourceRoots = new Set();
    for (const [role, rootId] of Object.entries(ROOTS)) {
        const { graph, tasks: taskGraph } = graphs[role];
        const tasks = taskGraph.tasks;
        if (!tasks[rootId]) throw new Error('Missing E2E root task');
        const selected = [];
        const visit = (name, seen = new Set()) => {
            if (seen.has(name)) return;
            seen.add(name);
            const node = graph.nodes[name];
            if (!node) throw new Error('Missing SDK source project');
            const root = node.data.root;
            if (!/^(packages|services|tools)\//.test(root))
                throw new Error('SDK reads unaudited source root');
            sourceRoots.add(root);
            for (const edge of graph.dependencies[name] ?? []) {
                if (graph.nodes[edge.target]) visit(edge.target, seen);
                else if (!edge.target.startsWith('npm:')) throw new Error('Unknown SDK dependency');
            }
        };
        for (const task of Object.values(tasks)) {
            if (!Array.isArray(taskGraph.dependencies[task.id]))
                throw new Error('Missing task dependencies');
            if (task.id === rootId) continue;
            if (
                task.target.target !== 'build' ||
                task.target.configuration ||
                task.continuous ||
                Object.entries(task.overrides ?? {}).some(
                    ([key, value]) =>
                        key !== '__overrides_unparsed__' || !Array.isArray(value) || value.length
                )
            ) {
                throw new Error('Unaudited E2E prerequisite');
            }
            if (!task.outputs?.length) throw new Error('Missing SDK outputs');
            const outputs = [...new Set(task.outputs)].sort().map(safeOutput);
            const build = { id: task.id, project: task.target.project, outputs };
            if (builds.has(task.id) && json(builds.get(task.id)) !== json(build))
                throw new Error('Conflicting task plans');
            builds.set(task.id, build);
            selected.push(build);
            visit(task.target.project);
        }
        for (const dependencies of Object.values(taskGraph.dependencies)) {
            for (const id of dependencies)
                if (!tasks[id] || tasks[id].target.target !== 'build') {
                    throw new Error('Non-build dependency requires ordinary Nx execution');
                }
        }
        consumers[role] = {
            projects: selected.map(task => task.project).sort(),
            roots: [...new Set(selected.flatMap(task => task.outputs))].sort(),
        };
        validateRoots(consumers[role].roots);
    }
    const sorted = [...builds.values()].sort((a, b) => a.id.localeCompare(b.id));
    const roots = [...new Set(sorted.flatMap(task => task.outputs))].sort();
    validateRoots(roots);
    return {
        projects: sorted.map(task => task.project).sort(),
        roots,
        builds: sorted,
        sourceRoots: [...sourceRoots].sort(),
        consumers,
    };
};

// Only this environment reaches SDK compilers. Runtime test/SPA environments
// remain untouched; new build-time requirements must be added here and audited.
export const compilerEnvironment = (workspace, identity, release) => ({
    PATH: [
        path.join(workspace, 'node_modules/.bin'),
        path.dirname(process.execPath),
        path.dirname(identity.bunPath),
        '/usr/local/bin',
        '/usr/bin',
        '/bin',
    ].join(':'),
    ...(process.env.HOME ? { HOME: process.env.HOME } : {}),
    ...(process.env.TMPDIR ? { TMPDIR: process.env.TMPDIR } : {}),
    CI: 'true',
    LANG: 'C.UTF-8',
    LC_ALL: 'C.UTF-8',
    NODE_ENV: process.env.NODE_ENV ?? '',
    NODE_OPTIONS: process.env.NODE_OPTIONS ?? '',
    SKIP_DIDKIT_NAPI: '1',
    NX_DAEMON: 'false',
    NX_ISOLATE_PLUGINS: 'false',
    SENTRY_BUILD_TELEMETRY: 'false',
    SENTRY_RELEASE: release,
});

export const inputKey = (workspace, files, configuration) => {
    const hash = createHash('sha256');
    const append = value => {
        const bytes = Buffer.from(value);
        hash.update(`${bytes.length}:`).update(bytes);
    };
    append(json(configuration));
    for (const file of [...new Set(files)].sort()) {
        const location = path.join(workspace, file);
        const stat = fs.lstatSync(location);
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Unaudited SDK source input');
        append(file);
        append(String(stat.mode & 0o777));
        append(fs.readFileSync(location));
    }
    return `e2e-sdk-shared-v1-${hash.digest('hex')}`;
};

const run = (command, args, workspace, env = process.env) =>
    execFileSync(command, args, {
        cwd: workspace,
        env,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();

export const specification = workspace => {
    if (process.env.BUILD_DIDKIT_NAPI) throw new Error('Native DIDKit output reuse is not audited');
    const nxPackage = requireResolve('nx/package.json', workspace);
    const nx = JSON.parse(fs.readFileSync(nxPackage));
    const nxBin = path.resolve(path.dirname(nxPackage), nx.bin.nx);
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-plan-'));
    let builtPlan;
    try {
        const graphs = {};
        for (const [role, target] of Object.entries(ROOTS)) {
            const file = path.join(temp, `${role}.json`);
            run(process.execPath, [nxBin, 'run', target, `--graph=${file}`], workspace, {
                ...process.env,
                NX_DAEMON: 'false',
                NX_ISOLATE_PLUGINS: 'false',
                NX_CACHE_PROJECT_GRAPH: 'false',
            });
            graphs[role] = JSON.parse(fs.readFileSync(file));
        }
        builtPlan = plan(graphs);
    } finally {
        fs.rmSync(temp, { recursive: true, force: true });
    }
    const tracked = run('git', ['ls-files', '-z'], workspace).split('\0').filter(Boolean);
    const selected = file =>
        (!file.includes('/') ||
            /^(packages|services|tools|scripts|patches)\//.test(file) ||
            file.startsWith('docs/snippets/') ||
            file.endsWith('/package.json') ||
            file.startsWith('.github/actions/sdk-build-cache/') ||
            file === '.github/workflows/sdk-build-cache.yml') &&
        !builtPlan.roots.some(root => file === root || file.startsWith(`${root}/`));
    if (
        run('git', ['ls-files', '--others', '--exclude-standard', '-z'], workspace)
            .split('\0')
            .filter(Boolean)
            .some(selected)
    ) {
        throw new Error('Untracked SDK cache input');
    }
    const files = tracked.filter(selected);
    const trackedSet = new Set(tracked);
    for (const directory of ['', ...builtPlan.sourceRoots]) {
        for (const name of fs.readdirSync(path.join(workspace, directory))) {
            if (/^\.env($|\.)/.test(name) && !trackedSet.has(path.posix.join(directory, name))) {
                throw new Error('Untracked build environment file; rebuild normally');
            }
        }
    }
    const bunPath = fs.realpathSync(run('/bin/sh', ['-c', 'command -v bun'], workspace));
    const identity = {
        schema: 1,
        workspace: fs.realpathSync(workspace),
        node: process.version,
        bun: run(bunPath, ['--version'], workspace),
        bunPath,
        nx: nx.version,
        nxBin,
        architecture: process.arch,
        platform: process.platform,
        abi: process.versions.modules,
        os:
            process.platform === 'linux'
                ? fs.readFileSync('/etc/os-release', 'utf8')
                : os.release(),
        libc: process.report.getReport().header.glibcVersionRuntime ?? '',
    };
    const environmentHash = digest(
        json(compilerEnvironment(workspace, identity, '<sdk-input-key>'))
    );
    return {
        ...builtPlan,
        identity,
        environmentHash,
        key: inputKey(workspace, files, { ...builtPlan, identity, environmentHash }),
    };
};

// Resolve from the tested checkout, not this script's caller or a global Nx.
import { createRequire } from 'node:module';
const requireResolve = (name, workspace) =>
    createRequire(path.join(workspace, 'package.json')).resolve(name);

export const build = (workspace, spec, role = 'producer') => {
    const selection = role === 'producer' ? spec : spec.consumers[role];
    if (!selection) throw new Error('Unknown SDK consumer');
    if (
        digest(json(compilerEnvironment(workspace, spec.identity, '<sdk-input-key>'))) !==
        spec.environmentHash
    ) {
        throw new Error('SDK compiler environment changed after key calculation');
    }
    for (const root of selection.roots) {
        safeOutput(root);
        noLinks(workspace, root);
        fs.rmSync(path.join(workspace, root), { recursive: true, force: true });
    }
    const started = Date.now();
    const result = spawnSync(
        process.execPath,
        [
            spec.identity.nxBin,
            'run-many',
            '-t',
            'build',
            '-p',
            selection.projects.join(','),
            '--parallel=3',
            '--skip-nx-cache',
            '--output-style=stream',
        ],
        {
            cwd: workspace,
            env: compilerEnvironment(workspace, spec.identity, spec.key),
            stdio: 'inherit',
        }
    );
    if (result.error || result.status !== 0) throw new Error('SDK compilation failed');
    for (const root of selection.roots) inventory(path.join(workspace, root));
    console.log(
        `SDK compilation completed in ${Date.now() - started}ms (${selection.projects.length} builds)`
    );
};

if (
    process.argv[1] &&
    fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))
) {
    const [command, specFile, cache, role] = process.argv.slice(2);
    if (command === 'key') {
        const spec = specification(process.cwd());
        fs.writeFileSync(specFile, json(spec));
        console.log(spec.key);
    } else {
        const spec = JSON.parse(fs.readFileSync(specFile));
        if (command === 'build') build(process.cwd(), spec, role);
        else if (command === 'snapshot') snapshot(process.cwd(), cache, spec);
        else if (command === 'restore') {
            restore(process.cwd(), cache, spec);
            console.log(`Restored ${spec.roots.length} verified SDK outputs`);
        } else throw new Error('Unknown SDK cache command');
    }
}

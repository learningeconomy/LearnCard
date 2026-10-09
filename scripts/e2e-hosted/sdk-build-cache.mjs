import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const canonical = value => JSON.stringify(value);
const safePath = value => {
    if (
        !value ||
        path.isAbsolute(value) ||
        value.split('/').some(part => !part || part === '.' || part === '..')
    ) {
        throw new Error(`Unsafe output path: ${value}`);
    }
    return value;
};

export const inputKey = (root, files, configuration, prefix = 'e2e-sdk-outputs-v2') => {
    const hash = createHash('sha256');
    const append = value => {
        const bytes = Buffer.from(value);
        hash.update(`${bytes.length}:`).update(bytes);
    };
    append(canonical(configuration));
    for (const file of [...files].sort()) {
        const location = path.join(root, file);
        let bytes;
        if (!fs.existsSync(location) || fs.lstatSync(location).isDirectory()) {
            // git ls-files includes submodule entries even without initialized contents.
            const entry = execFileSync('git', ['ls-files', '--stage', '--', file], {
                cwd: root,
            }).toString();
            if (!entry.startsWith('160000 ')) throw new Error(`Missing tracked input: ${file}`);
            bytes = entry;
        } else {
            bytes = fs.readFileSync(location);
        }
        append(file);
        append(bytes);
    }
    return `${prefix}-${hash.digest('hex')}`;
};

// Walk without following links; cached outputs must be ordinary files/directories.
const inventory = (base, roots) => {
    const result = {};
    const visit = relative => {
        safePath(relative);
        const location = path.join(base, relative);
        const stat = fs.lstatSync(location);
        if (stat.isDirectory()) {
            result[relative] = { type: 'directory', mode: stat.mode & 0o777 };
            for (const name of fs.readdirSync(location).sort()) visit(`${relative}/${name}`);
        } else if (stat.isFile()) {
            result[relative] = {
                type: 'file',
                mode: stat.mode & 0o777,
                bytes: stat.size,
                sha256: digest(fs.readFileSync(location)),
            };
        } else {
            throw new Error(`Unsupported output: ${relative}`);
        }
    };
    for (const root of roots) visit(root);
    return result;
};

export const snapshot = (workspace, cache, spec) => {
    const entries = inventory(workspace, spec.roots);
    fs.rmSync(cache, { recursive: true, force: true });
    const payload = path.join(cache, 'payload');
    for (const root of spec.roots) {
        fs.mkdirSync(path.dirname(path.join(payload, root)), { recursive: true });
        fs.cpSync(path.join(workspace, root), path.join(payload, root), { recursive: true });
    }
    if (canonical(inventory(payload, spec.roots)) !== canonical(entries))
        throw new Error('Output changed during snapshot');
    fs.writeFileSync(
        path.join(cache, 'manifest.json'),
        canonical({ version: 1, key: spec.key, roots: spec.roots, entries })
    );
    console.log(
        `Snapshot: ${Object.values(entries).filter(entry => entry.type === 'file').length} files, ${Object.values(entries).reduce((sum, entry) => sum + (entry.bytes || 0), 0)} bytes`
    );
};

export const restore = (workspace, cache, spec) => {
    const manifest = JSON.parse(fs.readFileSync(path.join(cache, 'manifest.json'), 'utf8'));
    if (
        manifest.version !== 1 ||
        manifest.key !== spec.key ||
        canonical(manifest.roots) !== canonical(spec.roots)
    ) {
        throw new Error('Build cache identity does not match');
    }
    const payload = path.join(cache, 'payload');
    // Verify every file, permissions, and membership before changing the workspace.
    if (canonical(inventory(payload, spec.roots)) !== canonical(manifest.entries))
        throw new Error('Build cache integrity failed');
    for (const root of spec.roots) {
        fs.rmSync(path.join(workspace, root), { recursive: true, force: true });
        fs.mkdirSync(path.dirname(path.join(workspace, root)), { recursive: true });
        fs.cpSync(path.join(payload, root), path.join(workspace, root), { recursive: true });
    }
    console.log(`Verified and restored ${spec.roots.length} build output directories`);
};

const rootTargets = ['learn-card-app:docker-build', 'e2e:test:e2e'];

export const buildOutputs = tasks => {
    for (const task of Object.values(tasks)) {
        if (task.target.target !== 'build' && !rootTargets.includes(task.id))
            throw new Error(`Unaudited build dependency: ${task.id}`);
    }
    const builds = Object.values(tasks).filter(task => task.target.target === 'build');
    const projects = builds.map(task => task.target.project).sort();
    const roots = [...new Set(builds.flatMap(task => task.outputs))].sort().map(safePath);
    for (const root of roots) {
        if (!/^(packages|services|tools)\//.test(root) || /[*{}]/.test(root))
            throw new Error(`Unaudited build output: ${root}`);
    }
    return { projects, roots };
};

const specification = workspace => {
    if (process.env.BUILD_DIDKIT_NAPI)
        throw new Error('Native DIDKit caching requires a separate output contract');
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-sdk-graph-'));
    const tasks = {};
    try {
        for (const target of rootTargets) {
            const graphFile = path.join(directory, `${target.split(':')[0]}.json`);
            execFileSync(
                process.execPath,
                [
                    path.join(workspace, 'node_modules/nx/dist/bin/nx.js'),
                    'run',
                    target,
                    `--graph=${graphFile}`,
                ],
                {
                    cwd: workspace,
                    env: { ...process.env, NX_DAEMON: 'false', NX_CACHE_PROJECT_GRAPH: 'false' },
                    stdio: 'pipe',
                }
            );
            Object.assign(tasks, JSON.parse(fs.readFileSync(graphFile)).tasks.tasks);
        }
    } finally {
        fs.rmSync(directory, { recursive: true, force: true });
    }
    const { projects, roots } = buildOutputs(tasks);
    const files = execFileSync('git', ['ls-files', '-z'], { cwd: workspace })
        .toString()
        .split('\0')
        .filter(Boolean)
        .filter(
            file =>
                !file.includes('/') ||
                /^(packages|services|tools|scripts|patches)\//.test(file) ||
                file.startsWith('docs/snippets/') ||
                file.endsWith('/package.json')
        );
    const environment = Object.fromEntries(
        [
            'NODE_ENV',
            'NODE_OPTIONS',
            'CI',
            'BUILD_DIDKIT_NAPI',
            'SENTRY_ORG',
            'SENTRY_PROJECT',
            'SENTRY_AUTH_TOKEN',
        ].map(name => [name, process.env[name] || ''])
    );
    const configuration = {
        schema: 2,
        // Sentry otherwise injects the event SHA into service bundles. These test
        // prerequisites use their source identity so frontend commits can reuse them.
        releaseIdentity: 'sdk-input-key',
        projects,
        roots,
        environment,
        skipDidkitNapi: '1',
        buildTelemetry: false,
        node: process.version,
        bun: execFileSync('bun', ['--version']).toString().trim(),
        nx: JSON.parse(fs.readFileSync(path.join(workspace, 'node_modules/nx/package.json')))
            .version,
        platform: process.platform,
        architecture: process.arch,
        abi: process.versions.modules,
        osDistribution:
            process.platform === 'linux'
                ? fs.readFileSync('/etc/os-release', 'utf8')
                : os.release(),
        libc: process.report.getReport().header.glibcVersionRuntime || '',
    };
    return { key: inputKey(workspace, files, configuration), projects, roots };
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const [command, specFile, cache] = process.argv.slice(2);
    if (command === 'key') {
        const spec = specification(process.cwd());
        fs.writeFileSync(specFile, canonical(spec));
        console.log(spec.key);
    } else if (command === 'key-spa') {
        const workspace = process.cwd();
        const files = execFileSync('git', ['ls-files', '-z'], { cwd: workspace })
            .toString()
            .split('\0')
            .filter(Boolean);
        // Vite also loads dotenv files; include their content if a local probe has them.
        for (const directory of ['', 'apps/learn-card-app']) {
            for (const name of fs.readdirSync(path.join(workspace, directory))) {
                if (
                    /^\.env($|\.)/.test(name) &&
                    fs.statSync(path.join(workspace, directory, name)).isFile()
                ) {
                    files.push(directory ? `${directory}/${name}` : name);
                }
            }
        }
        const environment = Object.fromEntries(
            Object.keys(process.env)
                .filter(
                    name =>
                        name.startsWith('VITE_') ||
                        [
                            'MODE',
                            'ANALYZE',
                            'NODE_OPTIONS',
                            'NODE_ENV',
                            'CHOKIDAR_USEPOLLING',
                            'CHOKIDAR_INTERVAL',
                        ].includes(name)
                )
                .sort()
                .map(name => [name, process.env[name]])
        );
        const configuration = {
            schema: 2,
            sdk: JSON.parse(fs.readFileSync(cache)).key,
            environment,
            testedSha: execFileSync('git', ['rev-parse', 'HEAD']).toString().trim(),
        };
        const spec = {
            key: inputKey(workspace, [...new Set(files)], configuration, 'e2e-spa-outputs-v2'),
            roots: ['apps/learn-card-app/build'],
        };
        fs.writeFileSync(specFile, canonical(spec));
        console.log(spec.key);
    } else {
        const spec = JSON.parse(fs.readFileSync(specFile));
        if (command === 'projects') console.log(spec.projects.join(','));
        else if (command === 'release') console.log(spec.key);
        else if (command === 'clean') {
            for (const root of spec.roots)
                fs.rmSync(path.join(process.cwd(), safePath(root)), {
                    recursive: true,
                    force: true,
                });
        } else if (command === 'snapshot') snapshot(process.cwd(), cache, spec);
        else if (command === 'restore') restore(process.cwd(), cache, spec);
        else throw new Error(`Unknown command: ${command}`);
    }
}

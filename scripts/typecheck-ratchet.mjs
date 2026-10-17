#!/usr/bin/env node
// Typecheck ratchet. Runs tsc for every Nx project with a tsconfig and compares each project's
// error count with scripts/typecheck-baseline.json ({ "<project>": <count> }).
//   - A count above its baseline fails (a project missing from the baseline is allowed 0).
//   - A count below its baseline passes and asks for the lower baseline to be committed.
//   - `--update` (bun run typecheck:baseline) rewrites the baseline from the current counts.
// Counts depend on build state, so run it the way CI does: install, build the libraries
// (`nx run-many -t build` over lib projects), compile Paraglide messages, then this script.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { cpus } from 'node:os';
import ts from 'typescript';

const BASELINE = 'scripts/typecheck-baseline.json';
const update = process.argv.includes('--update');
const only = process.argv.filter(a => a.startsWith('--project=')).map(a => a.slice(10));
const SKIP = new Set(['node_modules', 'dist', 'build', '.git', '.nx', 'coverage', 'lib']);

const walk = dir =>
    readdirSync(dir, { withFileTypes: true }).flatMap(e =>
        e.isDirectory() && !SKIP.has(e.name)
            ? walk(join(dir, e.name))
            : e.isFile() && e.name === 'project.json'
              ? [dir]
              : []
    );

const readJson = path => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {});

const projects = walk('.')
    .map(root => ({
        root,
        name: readJson(join(root, 'project.json')).name ?? root,
        tsconfig: ['tsconfig.app.json', 'tsconfig.json'].map(f => join(root, f)).find(existsSync),
        // A project's own `typecheck` script wins: it names the tsconfigs that matter there.
        ownScript: Boolean(readJson(join(root, 'package.json')).scripts?.typecheck),
    }))
    .filter(p => p.tsconfig && (only.length === 0 || only.includes(p.name)));

const command = p => {
    if (p.ownScript) return ['bun', ['run', 'typecheck'], p.root];

    // Check workspace dependencies from source (`development` export condition) when the
    // project's module resolution supports custom conditions.
    const { options } = ts.getParsedCommandLineOfConfigFile(
        p.tsconfig,
        {},
        {
            ...ts.sys,
            onUnRecoverableConfigFileDiagnostic: () => {},
        }
    ) ?? { options: {} };
    const conditions = [
        ts.ModuleResolutionKind.Bundler,
        ts.ModuleResolutionKind.Node16,
        ts.ModuleResolutionKind.NodeNext,
    ].includes(options.moduleResolution);

    return [
        'node_modules/.bin/tsc',
        ['--noEmit', '-p', p.tsconfig, '--rootDir', '.', '--pretty', 'false'].concat(
            conditions ? ['--customConditions', 'development'] : []
        ),
        '.',
    ];
};

const typecheck = p =>
    new Promise(resolve => {
        const [cmd, args, cwd] = command(p);
        const child = spawn(cmd, args, {
            cwd,
            env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=6144' },
        });
        let output = '';
        child.stdout.on('data', d => (output += d));
        child.stderr.on('data', d => (output += d));
        child.on('close', () => {
            const errors = output.split('\n').filter(line => /error TS\d+/.test(line));
            resolve({ ...p, count: errors.length, errors });
        });
    });

const queue = [...projects];
const results = [];
const workers = Math.max(1, Math.min(4, cpus().length - 1));
await Promise.all(
    Array.from({ length: workers }, async () => {
        while (queue.length) results.push(await typecheck(queue.shift()));
    })
);
results.sort((a, b) => a.name.localeCompare(b.name));

const baseline = readJson(BASELINE);
const raised = results.filter(r => r.count > (baseline[r.name] ?? 0));
const lowered = results.filter(r => r.count < (baseline[r.name] ?? 0));

for (const r of results) {
    const allowed = baseline[r.name] ?? 0;
    const status = r.count > allowed ? 'UP' : r.count < allowed ? 'down' : 'ok';
    console.log(`${status.padEnd(4)} ${r.name}: ${r.count} (baseline ${allowed})`);
}
const total = results.reduce((sum, r) => sum + r.count, 0);
console.log(`\n${results.length} projects, ${total} type errors`);

if (update) {
    const next = only.length ? { ...baseline } : {};
    for (const r of results) next[r.name] = r.count;
    const sorted = Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
    writeFileSync(BASELINE, `${JSON.stringify(sorted, null, 4)}\n`);
    console.log(`Wrote ${BASELINE}`);
    process.exit(0);
}

if (lowered.length) {
    console.log(
        `\nType errors went down in ${lowered.map(r => r.name).join(', ')}. ` +
            'Run `bun run typecheck:baseline` and commit scripts/typecheck-baseline.json to lock it in.'
    );
}

if (raised.length) {
    for (const r of raised) {
        console.error(`\n${r.name}: ${r.count} type errors, baseline ${baseline[r.name] ?? 0}.`);
        for (const line of r.errors.slice(0, 30)) console.error(`  ${line}`);
    }
    console.error('\nFix the new type errors. Do not raise the baseline to make this pass.');
    process.exit(1);
}

#!/usr/bin/env node
// Typecheck ratchet. Typechecks every Nx project and compares each project's error count with
// scripts/typecheck-baseline.json ({ "<project>": <count> }).
//   - A count above its baseline fails (a project missing from the baseline is allowed 0).
//   - A count below its baseline passes and asks for the lower baseline to be committed.
//   - A check that doesn't finish normally (spawn failure, signal, OOM, odd exit code) fails,
//     and `--update` refuses to write a baseline from it.
//   - `--update` (bun run typecheck:baseline) rewrites the baseline from the current counts.
//   - `--report=PATH` writes full diagnostics for an advisory PR-base comparison.
// Counts depend on build state, so run it the way CI does: install, build the libraries
// (`nx run-many -t build` over lib projects), compile Paraglide messages, then this script.
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir, cpus } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { createDiagnosticReport } from './typecheck-diagnostics.mjs';

// Data shapes:
//   Project = { name, root, checks: Check[], incomplete?: string }   Check = { cmd, args, cwd }
//   Result  = { name, count, errors: string[], incomplete: string | null, tail: string[],
//               configErrors: number }

const readJson = path => (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {});

// Every project in the Nx graph, including package.json-only workspace projects.
export const nxProjects = repo => {
    const dir = mkdtempSync(join(tmpdir(), 'typecheck-ratchet-'));
    try {
        const file = join(dir, 'graph.json');
        const nx = spawnSync(join(repo, 'node_modules/.bin/nx'), ['graph', `--file=${file}`], {
            cwd: repo,
            encoding: 'utf8',
        });
        if (nx.status !== 0) throw new Error(`nx graph failed:\n${nx.stdout}${nx.stderr}`);
        const { nodes } = JSON.parse(readFileSync(file, 'utf8')).graph;
        return Object.values(nodes).map(n => ({ name: n.name, root: n.data.root }));
    } finally {
        rmSync(dir, { recursive: true, force: true });
    }
};

// A solution tsconfig (`files: []`, no `include`, only `references`) checks nothing by itself,
// so follow its references down to the leaf configs.
export const leafConfigs = (path, seen = new Set()) => {
    if (seen.has(path)) return [];
    seen.add(path);
    const { config = {} } = ts.readConfigFile(path, ts.sys.readFile);
    const solution =
        config.references?.length &&
        Array.isArray(config.files) &&
        config.files.length === 0 &&
        !config.include?.length;
    if (!solution) return [path];
    return config.references.flatMap(ref => {
        const target = join(dirname(path), ref.path);
        // Same rule as tsc: a reference that isn't a .json file names a directory.
        return leafConfigs(target.endsWith('.json') ? target : join(target, 'tsconfig.json'), seen);
    });
};

const tscCheck = (repo, tsconfig) => {
    // Check workspace dependencies from source (`development` export condition) when the
    // config's module resolution supports custom conditions.
    const { options } = ts.getParsedCommandLineOfConfigFile(
        join(repo, tsconfig),
        {},
        { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} }
    ) ?? { options: {} };
    const conditions = [
        ts.ModuleResolutionKind.Bundler,
        ts.ModuleResolutionKind.Node16,
        ts.ModuleResolutionKind.NodeNext,
    ].includes(options.moduleResolution);
    return {
        cmd: join(repo, 'node_modules/.bin/tsc'),
        // `--rootDir .` stops a narrow rootDir (e.g. core's `src` while it also includes `test`)
        // from ending the check at one TS6059 before the real errors are reported.
        args: ['--noEmit', '-p', tsconfig, '--rootDir', '.', '--pretty', 'false'].concat(
            conditions ? ['--customConditions', 'development'] : []
        ),
        cwd: repo,
    };
};

export const toProjects = (repo, list) =>
    list
        .filter(({ root }) => root && root !== '.')
        .map(({ name, root }) => {
            // A project's own `typecheck` script wins: it names the tsconfigs that matter there.
            if (readJson(join(repo, root, 'package.json')).scripts?.typecheck) {
                return {
                    name,
                    root,
                    checks: [{ cmd: 'bun', args: ['run', 'typecheck'], cwd: join(repo, root) }],
                };
            }
            const tsconfig = ['tsconfig.app.json', 'tsconfig.json']
                .map(f => join(repo, root, f))
                .find(existsSync);
            if (!tsconfig) return { name, root, checks: [] };
            // A missing reference or a solution with no leaves is a coverage gap, not a clean
            // project, so it fails like any other check that didn't finish.
            const leaves = leafConfigs(tsconfig);
            const missing = leaves
                .filter(leaf => !existsSync(leaf))
                .map(leaf => relative(repo, leaf));
            if (missing.length) {
                return {
                    name,
                    root,
                    checks: [],
                    incomplete: `missing referenced tsconfig ${missing.join(', ')}`,
                };
            }
            if (!leaves.length) {
                return {
                    name,
                    root,
                    checks: [],
                    incomplete: `${relative(repo, tsconfig)} references no checkable tsconfig`,
                };
            }
            return { name, root, checks: leaves.map(leaf => tscCheck(repo, relative(repo, leaf))) };
        })
        .filter(p => p.checks.length || p.incomplete);

export const run = ({ cmd, args, cwd }) =>
    new Promise(resolve => {
        let output = '';
        let done = false;
        const finish = result => {
            if (done) return;
            done = true;
            resolve({ output, ...result });
        };
        const child = spawn(cmd, args, {
            cwd,
            env: {
                ...process.env,
                NODE_OPTIONS: [process.env.NODE_OPTIONS, '--max-old-space-size=6144']
                    .filter(Boolean)
                    .join(' '),
            },
        });
        child.stdout.on('data', d => (output += d));
        child.stderr.on('data', d => (output += d));
        child.on('error', error => finish({ code: null, signal: null, spawnError: error.message }));
        child.on('close', (code, signal) => finish({ code, signal, spawnError: null }));
    });

// tsc exits 0 when clean and 1 or 2 when it reports diagnostics. Anything else, or a diagnostics
// exit with no diagnostics in the output, means the check didn't finish and its count can't be trusted.
export const incompleteReason = ({ code, signal, spawnError, errors }) => {
    if (spawnError) return `could not start: ${spawnError}`;
    if (signal) return `killed by ${signal} after ${errors.length} type errors`;
    if (code === 0) return null;
    if ((code === 1 || code === 2) && errors.length) return null;
    return `exited with code ${code} after ${errors.length} type errors`;
};

// tsc skips semantic checking when a config has errors (missing `files`, bad options), so a
// project with any of these only counts its config errors. Worth fixing, but stable.
export const isConfigError = line =>
    !/^[^(]+\(\d+,\d+\): error/.test(line) || /tsconfig[^/]*\.json\(/.test(line);

export const checkProject = async project => {
    if (project.incomplete) {
        return {
            name: project.name,
            count: null,
            errors: [],
            incomplete: project.incomplete,
            tail: [],
            configErrors: 0,
        };
    }
    const errors = new Set();
    for (const check of project.checks) {
        const ran = await run(check);
        const lines = ran.output.split('\n');
        const found = lines.filter(line => /error TS\d+/.test(line));
        const incomplete = incompleteReason({ ...ran, errors: found });
        if (incomplete) {
            return {
                name: project.name,
                count: null,
                errors: found,
                incomplete,
                tail: lines.slice(-20),
                configErrors: 0,
            };
        }
        for (const line of found) errors.add(line);
    }
    return {
        name: project.name,
        count: errors.size,
        errors: [...errors],
        incomplete: null,
        tail: [],
        configErrors: [...errors].filter(isConfigError).length,
    };
};

export const verdict = (results, baseline) => {
    const allowed = r => baseline[r.name] ?? 0;
    const incomplete = results.filter(r => r.incomplete);
    const raised = results.filter(r => !r.incomplete && r.count > allowed(r));
    const lowered = results.filter(r => !r.incomplete && r.count < allowed(r));
    return { incomplete, raised, lowered, pass: !incomplete.length && !raised.length };
};

// The next baseline, or null when any check didn't finish (never write partial counts).
export const nextBaseline = (results, baseline, only) => {
    if (results.some(r => r.incomplete)) return null;
    const next = only.length ? { ...baseline } : {};
    for (const r of results) next[r.name] = r.count;
    return Object.fromEntries(Object.entries(next).sort(([a], [b]) => a.localeCompare(b)));
};

const main = async () => {
    const BASELINE = 'scripts/typecheck-baseline.json';
    const update = process.argv.includes('--update');
    const reportFile = process.argv.find(a => a.startsWith('--report='))?.slice('--report='.length);
    const only = process.argv.filter(a => a.startsWith('--project=')).map(a => a.slice(10));

    const projects = toProjects('.', nxProjects('.')).filter(
        p => only.length === 0 || only.includes(p.name)
    );
    const queue = [...projects];
    const results = [];
    const workers = Math.max(1, Math.min(4, cpus().length - 1));
    await Promise.all(
        Array.from({ length: workers }, async () => {
            while (queue.length) results.push(await checkProject(queue.shift()));
        })
    );
    results.sort((a, b) => a.name.localeCompare(b.name));

    const baseline = readJson(BASELINE);
    const { incomplete, raised, lowered, pass } = verdict(results, baseline);
    if (reportFile) {
        mkdirSync(dirname(reportFile), { recursive: true });
        writeFileSync(
            reportFile,
            JSON.stringify(createDiagnosticReport(results, baseline, '.'), null, 2) + '\n'
        );
        console.log(`Diagnostic report: ${reportFile}`);
    }

    for (const r of results) {
        const allowed = baseline[r.name] ?? 0;
        if (r.incomplete) {
            console.log(
                `FAIL ${r.name}: check did not finish, ${r.incomplete} (baseline ${allowed})`
            );
            continue;
        }
        const status = r.count > allowed ? 'UP' : r.count < allowed ? 'down' : 'ok';
        console.log(`${status.padEnd(4)} ${r.name}: ${r.count} (baseline ${allowed})`);
    }
    const total = results.reduce((sum, r) => sum + (r.count ?? 0), 0);
    console.log(`\n${results.length} projects, ${total} type errors`);

    for (const r of results.filter(result => result.configErrors)) {
        console.log(
            `note ${r.name}: ${r.configErrors} tsconfig errors, so tsc skipped checking its source files.`
        );
    }

    for (const r of incomplete) {
        console.error(
            `\n${r.name}: typecheck did not finish (${r.incomplete}).${r.tail.length ? ' Last output:' : ''}`
        );
        for (const line of r.tail) console.error(`  ${line}`);
    }

    if (update) {
        const next = nextBaseline(results, baseline, only);
        if (!next) {
            console.error('\nNot writing the baseline: some checks did not finish.');
            process.exit(1);
        }
        writeFileSync(BASELINE, `${JSON.stringify(next, null, 4)}\n`);
        console.log(`Wrote ${BASELINE}`);
        process.exit(0);
    }

    if (lowered.length) {
        console.log(
            `\nType errors went down in ${lowered.map(r => r.name).join(', ')}. ` +
                'Run `bun run typecheck:baseline` and commit scripts/typecheck-baseline.json to lock it in.'
        );
    }

    for (const r of raised) {
        console.error(`\n${r.name}: ${r.count} type errors, baseline ${baseline[r.name] ?? 0}.`);
        if (reportFile)
            console.error(
                `  Full diagnostics saved in ${reportFile}; the PR comparison reports added diagnostics separately.`
            );
        else {
            console.error(
                '  Current diagnostic sample (first 30; not necessarily introduced by this branch):'
            );
            for (const line of r.errors.slice(0, 30)) console.error(`  ${line}`);
        }
    }
    if (raised.length)
        console.error(
            '\nFix the errors above allowance; use the PR comparison to identify additions. Do not raise the baseline to make this pass.'
        );
    if (incomplete.length) console.error('\nA typecheck that does not finish counts as a failure.');
    process.exit(pass ? 0 : 1);
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();

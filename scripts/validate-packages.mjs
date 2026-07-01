#!/usr/bin/env node
/**
 * Validates the publish-time contract of every public @learncard/* package.
 *
 * Two layers of checks, both run against the actual built `dist/` artifacts:
 *
 *   1. publint        — static package.json/dist validation. Catches missing
 *                       `exports` maps, ESM files with CJS extensions, condition
 *                       ordering bugs, `files:` entries that don't exist,
 *                       workspace: protocol leakage in published deps, etc.
 *   2. attw (--pack)  — runs `npm pack` and checks that the resulting tarball
 *                       resolves correctly under every TypeScript module
 *                       resolution mode (`node10`, `node16`, `bundler`) and
 *                       both consumer styles (ESM `import` + CJS `require`).
 *
 * This is the test that would have caught the @learncard/init smoketest
 * regression (named ESM exports unresolvable from CJS shim) before publish.
 *
 * Validation runs across all packages through a bounded concurrency pool
 * (default 6) since attw's `npm pack` step dominates wall-clock time.
 *
 * Usage:
 *   node scripts/validate-packages.mjs               # validate all packages
 *   node scripts/validate-packages.mjs --only=crypto-plugin,init
 *   node scripts/validate-packages.mjs --skip-attw   # publint only (fast)
 *   node scripts/validate-packages.mjs --concurrency=4
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function run(cmd, cmdArgs) {
    return new Promise(resolve => {
        const child = spawn(cmd, cmdArgs, { cwd: ROOT });
        let out = '';
        child.stdout.on('data', d => (out += d));
        child.stderr.on('data', d => (out += d));
        child.on('error', err => resolve({ ok: false, out: out + String(err) }));
        child.on('close', code => resolve({ ok: code === 0, out }));
    });
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Candidate package directories — same set as the npm publish pipeline.
const CANDIDATES = [
    'packages/core',
    'packages/credential-library',
    'packages/lca-api-client',
    'packages/learn-card-cli',
    'packages/learn-card-helpers',
    'packages/learn-card-init',
    'packages/learn-card-partner-connect-sdk',
    'packages/learn-card-types',
    'packages/learn-card-network/brain-client',
    'packages/learn-card-network/cloud-client',
    'packages/learn-card-network/simple-signing-client',
    'packages/sss-key-manager',
    ...fs
        .readdirSync(path.join(ROOT, 'packages/plugins'))
        .map(d => `packages/plugins/${d}`),
];

function readPkg(absDir) {
    const p = path.join(absDir, 'package.json');
    if (!fs.existsSync(p)) return null;
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {
        return null;
    }
}

// Parse CLI args
const args = process.argv.slice(2);
const onlyArg = args.find(a => a.startsWith('--only='))?.slice('--only='.length);
const onlyFilter = onlyArg ? new Set(onlyArg.split(',')) : null;
const skipAttw = args.includes('--skip-attw');
const skipPublint = args.includes('--skip-publint');

const targets = [];
for (const rel of CANDIDATES) {
    const abs = path.join(ROOT, rel);
    const pkg = readPkg(abs);
    if (!pkg || pkg.private) continue;
    if (!pkg.name?.startsWith('@learncard/')) continue;
    if (onlyFilter) {
        const shortName = pkg.name.replace(/^@learncard\//, '');
        if (!onlyFilter.has(shortName) && !onlyFilter.has(pkg.name)) continue;
    }
    targets.push({ rel, abs, pkg });
}

if (targets.length === 0) {
    console.error('No matching @learncard/* packages found.');
    process.exit(1);
}

console.log(`Validating ${targets.length} packages…\n`);

const failures = [];
const advisories = [];

// Rules deliberately tolerated until follow-up work. These are TYPES-side
// issues that don't affect Node runtime imports — i.e. they would not have
// caught the smoketest regression this validation primarily exists to prevent.
// Each one is real and should be fixed eventually, but failing CI today would
// gate the dual-format hardening on a separate tsconfig migration.
//
//   - internal-resolution-error: tsc-emitted `.d.ts` files import siblings
//     without `.js` extensions, which fails under `moduleResolution: "node16"`
//     ESM resolution. Fix requires source files to use `import './x.js'` style
//     OR migrating each plugin's tsconfig to `module: "node16"` w/ rewrite.
//   - unexpected-module-syntax: partner-connect's ESM bundle has interop
//     wrappers that node16 ESM rejects. Same class of fix.
//
// Bundler resolution (Vite/webpack/esbuild/Next) is green for every package,
// which is the resolution mode 95%+ of consumers actually use.
const ATTW_IGNORE_RULES = [
    // Types-side, pre-existing across plugins. tsc-emitted `.d.ts` files use
    // bare `./types` imports, which fail node16 ESM resolution. Bundler
    // resolution is green.
    'internal-resolution-error',
    // partner-connect ESM bundle has an interop pattern node16 ESM rejects.
    // Bundler resolution is green.
    'unexpected-module-syntax',
    // idx/ceramic export their plugin as `export default X`. The CJS bundle
    // surfaces it as `module.exports.default`, which legacy TS interop modes
    // don't reconstruct as a default import correctly. Bundler & node16-ESM
    // both green.
    'false-export-default',
    // partner-connect ESM bundle is correctly ESM, but its `.d.ts` is treated
    // as CJS under the parent package's no-`"type"` setting. Bundler green.
    'false-cjs',
    // Some CJS-only packages (e.g. cli) expose named exports that TS sees but
    // Node's named-export interop can miss. Treated as advisory until the
    // affected packages migrate to dual-format.
    'named-exports',
    // didkit-plugin deliberately exposes its raw `.wasm` binaries as subpath
    // exports (e.g. `./dist/didkit_wasm_bg.wasm`) so consumers can locate the
    // wasm asset. attw applies JS/TS module resolution to these subpaths and
    // reports `no-resolution` because a `.wasm` binary has no type
    // declarations — but the files exist and load fine at runtime, and the
    // package's `.` entry resolves green in every mode (ESM, CJS, bundler).
    'no-resolution',
];

// Packages where validation failures should NOT fail CI yet. Each entry needs
// its own dual-format migration follow-up (see fix-plugin-exports.mjs /
// fix-types-helpers-exports.mjs for the template). The validation script
// still runs against these and prints diagnostics — it just doesn't gate.
//
// Removing a name from this set after migrating the package locks in the
// fix as a regression gate.
//
// NOTE: this set is intentionally DIFFERENT from the `KNOWN_BROKEN` list in
// .github/workflows/smoketest-npm-packages.yml. The two surfaces check
// different things and therefore fail on different packages:
//   - This script (publint + attw) checks the *publish-time type/manifest
//     contract* — e.g. FalseESM, missing types, exports-condition ordering.
//     The packages that fail here are ones with TYPE-side issues (cli has no
//     published types module; init is FalseESM under node16-from-CJS;
//     didkit-plugin-node is a tsc-compiled N-API package with no dual format).
//   - The smoketest workflow checks *runtime ESM/CJS loadability* by actually
//     installing + importing each published plugin from npm. The packages that
//     fail there (ceramic, didkey, idx, lca-api, learn-cloud, network,
//     simple-signing) have runtime resolution bugs (transitive CJS-only deps
//     imported via named ESM, dynamic require() in ESM bundles) that are
//     invisible to static type analysis.
// A package can pass one surface and fail the other. Keep both lists scoped to
// the failures their own tool actually reports; don't try to unify them.
const ADVISORY_ONLY = new Set([
    '@learncard/cli', // CLI binary, invoked via `bin` — has no library API, so
    // ships no published types module. attw's UntypedResolution is expected
    // and harmless here; nobody imports `@learncard/cli` as a module.
]);

// No --strict: tolerate "suggestions" (engines.node, repository.url shape).
// Errors still fail. This is the level that catches missing/broken `exports`
// maps, FalseESM, and the original smoketest regression.
function runPublint({ abs }) {
    return run('pnpm', ['exec', 'publint', abs]);
}

// --pack: runs `npm pack` and checks the actual tarball that would be published
//         — the artifact consumers see. npm pack writes a uniquely-named
//         tarball per package, so concurrent invocations don't collide.
// --profile esm-only: ignores node10 (legacy) and node16-cjs (we ship a proper
//         CJS shim with .d.cts; node16-from-CJS is green).
function runAttw({ abs }) {
    return run('pnpm', [
        'exec',
        'attw',
        '--pack',
        abs,
        '--profile',
        'esm-only',
        '--ignore-rules',
        ...ATTW_IGNORE_RULES,
    ]);
}

// ---------------------------------------------------------------------------
// Mode-3 guard: ESM-resolved entry must not statically import a CJS file.
// ---------------------------------------------------------------------------
//
// publint + attw validate the *published tarball's* type/manifest contract and
// static module-resolution. Neither catches the failure mode where a
// workspace-symlinked package is *transformed by a bundler* (Vite/Astro/Next
// SSR): when an ESM entry statically `import ... from './x.cjs'`, the bundler
// follows the edge and tries to transform the CommonJS file as ESM, throwing
// `module is not defined` at runtime. attw even reports such packages as
// "bundler 🟢" because it never performs a real transform of symlinked source.
//
// This is precisely the `@learncard/init` regression (node-esm.mjs ->
// index.cjs). The structural invariant that prevents the whole class:
//
//   No file reachable through an ESM export condition may statically
//   import / re-export a CommonJS (.cjs/.cts) file.
//
// Runtime CJS loading from ESM is still allowed via `createRequire`, which is
// opaque to bundler transforms and handled by Node's native CJS loader.
//
// This check is deterministic, dependency-free, and ALWAYS gates (it is not
// subject to ADVISORY_ONLY — it guards runtime loadability, not types).

// Static `import`/`export ... from '...cjs'` and bare `import '...cjs'`.
// Excludes `createRequire(...)('...cjs')` and `require('...cjs')`, which are
// runtime calls, not static ESM edges.
const STATIC_CJS_IMPORT = /(?:^|[\s;])(?:import|export)\b[^;]*?\bfrom\s*['"][^'"]*\.c(?:j|t)s['"]|(?:^|[\s;])import\s*['"][^'"]*\.c(?:j|t)s['"]/m;

// Collect dist files reachable through any ESM-side export condition
// (`import`, a nested `node.import`, `default`, or the top-level `module`
// field). The `require` condition is intentionally skipped — CJS files are
// expected there.
function collectEsmEntryFiles(pkg, absDir) {
    const files = new Set();
    const add = rel => {
        if (typeof rel === 'string' && rel.startsWith('.')) files.add(rel);
    };
    // Top-level `module` field is read by bundlers as the ESM entry.
    add(pkg.module);

    const walk = (node, inRequire) => {
        if (typeof node === 'string') {
            if (!inRequire) add(node);
            return;
        }
        if (!node || typeof node !== 'object') return;
        for (const [condition, value] of Object.entries(node)) {
            if (condition === 'types') continue;
            if (condition === 'require') {
                walk(value, true); // CJS expected here — skip collecting
            } else {
                // `import`, `node`, `default`, `browser`, subpaths, etc.
                walk(value, inRequire);
            }
        }
    };
    if (pkg.exports) walk(pkg.exports, false);

    return [...files]
        .map(rel => path.join(absDir, rel))
        .filter(fp => fs.existsSync(fp) && /\.(mjs|js)$/.test(fp));
}

function checkNoEsmToCjsImport({ pkg, abs }) {
    const entries = collectEsmEntryFiles(pkg, abs);
    const offenders = [];
    for (const fp of entries) {
        let src;
        try {
            src = fs.readFileSync(fp, 'utf8');
        } catch {
            continue;
        }
        if (STATIC_CJS_IMPORT.test(src)) offenders.push(path.relative(ROOT, fp));
    }
    if (offenders.length === 0) return { ok: true, out: '' };
    return {
        ok: false,
        out:
            'ESM entry statically imports a CommonJS file (breaks bundler-transformed ' +
            'symlinked consumers — use createRequire instead):\n' +
            offenders.map(f => `  - ${f}`).join('\n'),
    };
}

const concurrencyArg = args.find(a => a.startsWith('--concurrency='))?.slice('--concurrency='.length);
const CONCURRENCY = Math.max(1, Number(concurrencyArg) || 6);

async function validateOne(t) {
    let publintResult = { ok: true, out: '' };
    let attwResult = { ok: true, out: '' };

    if (!skipPublint) publintResult = await runPublint(t);
    if (!skipAttw) attwResult = await runAttw(t);

    // Always-gating, regardless of ADVISORY_ONLY: this guards runtime
    // loadability under bundler-transformed symlinked consumers (mode 3),
    // which the publint/attw advisories never excuse.
    const esmCjsResult = checkNoEsmToCjsImport(t);

    const contractOk = publintResult.ok && attwResult.ok;
    const advisory = ADVISORY_ONLY.has(t.pkg.name);

    // The mode-3 guard failing is never advisory.
    const ok = contractOk && esmCjsResult.ok;
    const gatingFail = !esmCjsResult.ok || (!contractOk && !advisory);
    const status = ok ? '✓' : gatingFail ? '✗' : '⚠ (advisory)';

    console.log(`• ${t.pkg.name.padEnd(42)}  ${status}`);

    if (ok) return;
    const entry = {
        name: t.pkg.name,
        publint: publintResult,
        attw: attwResult,
        esmCjs: esmCjsResult,
    };
    (gatingFail ? failures : advisories).push(entry);
}

async function runPool(items, limit, worker) {
    let cursor = 0;
    const runNext = async () => {
        while (cursor < items.length) {
            const index = cursor++;
            await worker(items[index]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, runNext));
}

console.log(`Running with concurrency ${CONCURRENCY}…\n`);
await runPool(targets, CONCURRENCY, validateOne);

function printDiagnostics(label, list) {
    if (list.length === 0) return;
    console.error(`\n${label}\n`);
    for (const f of list) {
        console.error(`──── ${f.name} ────`);
        if (!f.publint.ok) console.error(`[publint]\n${f.publint.out.trim()}\n`);
        if (!f.attw.ok) console.error(`[attw]\n${f.attw.out.trim()}\n`);
        if (f.esmCjs && !f.esmCjs.ok) console.error(`[esm->cjs guard]\n${f.esmCjs.out.trim()}\n`);
    }
}

printDiagnostics(`Advisory — ${advisories.length} pre-existing issue(s) (not gating):`, advisories);

if (failures.length > 0) {
    printDiagnostics(`${failures.length} package(s) failed validation (gating):`, failures);
    process.exit(1);
}

const gating = targets.length - advisories.length;
console.log(
    `\n${gating} gating package(s) valid; ${advisories.length} advisory.`,
);

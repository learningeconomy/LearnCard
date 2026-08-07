/**
 * Guard against references to Paraglide message keys that don't exist.
 *
 * Components access messages as `m['namespace.key']()`. If the key isn't in the
 * catalogs, `m['namespace.key']` is `undefined` and calling it throws a
 * TypeError at runtime (white-screens the route). Paraglide IS type-safe, but
 * nothing in this repo runs `tsc`, so the type error never surfaces.
 *
 * The build-time guard (`paraglideOnWarn.ts`) catches these too, but only for
 * components that actually get bundled — on a PR that's just the Storybook/
 * Chromatic build, which only bundles story-reachable components. This static
 * check needs no build: it scans every source file and diffs the `m['…']`
 * literals against the leaf keys in `en/translation.json`, so it gives full
 * coverage on every PR in seconds.
 *
 * Only string-literal keys are checked; dynamic `m[expr]` access is skipped.
 *
 * Run: `node scripts/check-i18n-keys.mjs` (or `pnpm i18n:check-keys`).
 * Exit code: 0 = clean, 1 = missing key(s) found.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(APP_ROOT, 'src');
const EN_CATALOG = join(APP_ROOT, 'public', 'locales', 'en', 'translation.json');

// `m['key']` / `m["key"]`, not preceded by an identifier char or `.`
// (so `form['x']` / `obj.m['x']` don't match). Captures the literal key.
const M_KEY = /(?<![\w$.])m\[\s*['"]([^'"]+)['"]\s*\]/g;

/**
 * True if the source imports the Paraglide message object `m`. Accepts BOTH
 * styles used in this repo: `import * as m from '…/paraglide/messages.js'` and
 * `import { m } from '…/paraglide/messages.js'` (m may sit among other named
 * imports). A file that uses `m['…']` without one of these throws
 * `ReferenceError: m is not defined` at runtime — which the key check above
 * (keys exist, but `m` itself is undefined) and the esbuild build (treats `m`
 * as a global) both miss.
 */
const hasMImport = src =>
    /import\s+\*\s+as\s+m\s+from\s+['"][^'"]*paraglide\/messages(?:\.js)?['"]/.test(src) ||
    /import\s*\{[^}]*\bm\b[^}]*\}\s*from\s+['"][^'"]*paraglide\/messages(?:\.js)?['"]/.test(src);

/**
 * Flatten a nested catalog into a Set of dotted leaf keys. Arrays flatten to
 * numeric-index keys (`loaderText.0`, `loaderText.1`, …) — the inlang i18next
 * plugin exposes array entries that way, and components access them as such.
 */
const flatten = (obj, prefix = '', out = new Set()) => {
    const entries = Array.isArray(obj) ? obj.map((v, i) => [String(i), v]) : Object.entries(obj);
    for (const [k, v] of entries) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object') flatten(v, key, out);
        else out.add(key);
    }
    return out;
};

/**
 * Blank out comments while preserving byte/line positions (so reported line
 * numbers stay accurate), so illustrative `m['key']` snippets in JSDoc/`//`
 * comments aren't flagged. URL `//` (preceded by `:`) is left intact.
 */
const stripComments = src =>
    src
        .replace(/\/\*[\s\S]*?\*\//g, block => block.replace(/[^\n]/g, ' '))
        .replace(/(^|[^:])\/\/[^\n]*/g, (full, pre) => pre + ' '.repeat(full.length - pre.length));

/** @returns {string[]} absolute paths of all .ts/.tsx files under src */
const walk = dir => {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        if (statSync(p).isDirectory()) {
            if (entry === 'paraglide' || entry === 'node_modules') continue;
            out.push(...walk(p));
        } else if (/\.tsx?$/.test(entry)) {
            out.push(p);
        }
    }
    return out;
};

const knownKeys = flatten(JSON.parse(readFileSync(EN_CATALOG, 'utf8')));

const offenders = [];
const missingImports = [];
for (const file of walk(SRC)) {
    const raw = readFileSync(file, 'utf8');
    const source = stripComments(raw);
    let usesM = false;
    for (const match of source.matchAll(M_KEY)) {
        usesM = true;
        const key = match[1];
        if (knownKeys.has(key)) continue;
        const line = source.slice(0, match.index).split('\n').length;
        offenders.push({ file: relative(APP_ROOT, file), line, key });
    }
    if (usesM && !hasMImport(raw)) {
        missingImports.push(relative(APP_ROOT, file));
    }
}

let failed = false;

if (missingImports.length) {
    failed = true;
    console.error(
        `\n✗ i18n guard: ${missingImports.length} file(s) use m['…'] without importing the ` +
            `Paraglide message object — this throws "ReferenceError: m is not defined" at runtime:\n`
    );
    for (const f of missingImports) console.error(`  ${f}`);
    console.error(
        `\n  Fix: add \`import * as m from '<rel>/paraglide/messages.js';\` ` +
            `(or \`import { m } from …\`) to each file.\n`
    );
}

if (offenders.length) {
    failed = true;
    console.error(
        `\n✗ i18n guard: ${offenders.length} reference(s) to Paraglide message key(s) ` +
            `not present in en/translation.json:\n`
    );
    for (const o of offenders) {
        console.error(`  ${o.file}:${o.line}  →  m['${o.key}']`);
    }
    console.error(
        `\n  Fix: add the key to public/locales/{en,es,fr,ar}/translation.json, ` +
            `or correct the key/typo.\n`
    );
}

if (failed) process.exit(1);

console.log(`✓ i18n guard: all m['…'] keys exist in en/translation.json and m is imported where used`);

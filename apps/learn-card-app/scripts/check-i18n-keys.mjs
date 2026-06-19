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
for (const file of walk(SRC)) {
    const source = stripComments(readFileSync(file, 'utf8'));
    for (const match of source.matchAll(M_KEY)) {
        const key = match[1];
        if (knownKeys.has(key)) continue;
        const line = source.slice(0, match.index).split('\n').length;
        offenders.push({ file: relative(APP_ROOT, file), line, key });
    }
}

if (offenders.length) {
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
    process.exit(1);
}

console.log(`✓ i18n guard: all m['…'] keys exist in en/translation.json`);

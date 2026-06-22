/**
 * ADVISORY i18n completeness scan for the Developer Portal guides.
 *
 * The guides (`pages/appStoreDeveloper/guides/**`) mix UI prose (must be
 * localized via `m['…']`) with large code samples (must NOT be touched). This
 * script estimates how many user-facing strings are still hardcoded, so a
 * reviewer can see translation completeness at a glance.
 *
 * HEURISTIC, not a hard gate: it blanks out code samples (backtick template
 * literals) and comments, then flags JSX text nodes and common UI string props
 * that contain English and aren't already wrapped in `m['…']`. Expect some
 * false positives/negatives — use it to measure, not to block CI.
 *
 * Run: `node scripts/check-i18n-guides.mjs` (or `pnpm i18n:check-guides`).
 * Flags: `--json` (machine-readable), `--strict` (exit 1 if any found).
 * Default exit code: 0 (advisory).
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GUIDES = join(APP_ROOT, 'src', 'pages', 'appStoreDeveloper', 'guides');

const asJson = process.argv.includes('--json');
const strict = process.argv.includes('--strict');

const walk = dir => {
    const out = [];
    for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) out.push(...walk(p));
        else if (/\.tsx$/.test(e)) out.push(p);
    }
    return out;
};

/** Blank code samples (backtick literals) + comments so we don't flag code. */
const stripCode = src =>
    src
        .replace(/`[^`]*`/gs, '``')
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

const JSX_TEXT = />\s*([A-Za-z][A-Za-z0-9 ,.'!?:&/()\-]{2,})\s*</g;
const UI_PROP = /(?:title|label|placeholder|description|alt|aria-label)\s*=\s*"([A-Z][^"]{3,})"/g;

const scan = file => {
    const s = stripCode(readFileSync(file, 'utf8'));
    const found = new Set();
    for (const m of s.matchAll(JSX_TEXT)) {
        const t = m[1].trim();
        if (/[a-z]/.test(t) && t.includes(' ') && !t.startsWith('http')) found.add(t);
    }
    for (const m of s.matchAll(UI_PROP)) found.add(m[1].trim());
    return [...found];
};

const report = {};
let total = 0;
for (const file of walk(GUIDES)) {
    const hits = scan(file);
    if (hits.length) {
        report[relative(APP_ROOT, file)] = hits;
        total += hits.length;
    }
}

if (asJson) {
    console.log(JSON.stringify({ total, files: report }, null, 2));
} else if (total === 0) {
    console.log('✓ i18n guides: no obvious untranslated UI strings found');
} else {
    console.log(`\n⚠ i18n guides: ~${total} likely-untranslated UI string(s) (heuristic):\n`);
    for (const [f, hits] of Object.entries(report)) {
        console.log(`  ${f}  (${hits.length})`);
        for (const h of hits.slice(0, 8)) console.log(`      ${h.length > 72 ? h.slice(0, 69) + '…' : h}`);
        if (hits.length > 8) console.log(`      … +${hits.length - 8} more`);
    }
    console.log('');
}

process.exit(strict && total > 0 ? 1 : 0);

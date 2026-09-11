/**
 * Locale-parity guard: every target locale catalog must contain EXACTLY the
 * same set of leaf keys as the base `en` catalog. A key added to `en` but
 * forgotten in es/fr/ar (or an extra/renamed key in a target locale) fails the
 * build — this is the guard that keeps machine-translated catalogs in lockstep
 * with the source of truth after each dispatch task.
 *
 * Mirrors the flatten() semantics of check-i18n-keys.mjs (arrays → numeric-index
 * keys), so it agrees with what the runtime key check considers a leaf.
 *
 * Run: `node scripts/check-i18n-parity.mjs` (or `bun run i18n:check-parity`).
 * Exit code: 0 = all locales in parity, 1 = missing/extra key(s) found.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES_DIR = join(APP_ROOT, 'public', 'locales');
const BASE_LOCALE = 'en';
const TARGET_LOCALES = ['es', 'fr', 'ar'];

/** Flatten a nested catalog into a Set of dotted leaf keys (arrays → indexes). */
const flatten = (obj, prefix = '', out = new Set()) => {
    const entries = Array.isArray(obj) ? obj.map((v, i) => [String(i), v]) : Object.entries(obj);
    for (const [k, v] of entries) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object') flatten(v, key, out);
        else out.add(key);
    }
    return out;
};

const load = locale =>
    flatten(JSON.parse(readFileSync(join(LOCALES_DIR, locale, 'translation.json'), 'utf8')));

const base = load(BASE_LOCALE);
let failed = false;

for (const locale of TARGET_LOCALES) {
    const keys = load(locale);
    const missing = [...base].filter(k => !keys.has(k));
    const extra = [...keys].filter(k => !base.has(k));
    if (missing.length || extra.length) {
        failed = true;
        console.error(
            `\n✗ i18n parity: ${locale} differs from ${BASE_LOCALE} ` +
                `(missing=${missing.length} extra=${extra.length}):`
        );
        for (const k of missing.slice(0, 50)) console.error(`  missing in ${locale}: ${k}`);
        for (const k of extra.slice(0, 50)) console.error(`  extra in ${locale}:   ${k}`);
        if (missing.length > 50 || extra.length > 50) console.error('  … (truncated)');
    }
}

if (failed) {
    console.error(
        `\n  Fix: add the missing key(s) to public/locales/<locale>/translation.json ` +
            `(use the English value as a placeholder until translated), or remove the extra key(s).\n`
    );
    process.exit(1);
}

console.log(`✓ i18n parity: ${TARGET_LOCALES.join('/')} all match ${BASE_LOCALE} key-for-key`);

/**
 * Guard against "English-fallback" translations — locale values that were never
 * actually translated.
 *
 * The parity guard (`check-i18n-keys.mjs` / the inlang plugin) only checks that
 * every key PRESENT in `en/translation.json` also exists in es/fr/ar. It passes
 * even when a locale's *value* is a verbatim copy of the English source, because
 * the key is technically there. When that happens Paraglide renders the English
 * string under a non-English UI — the exact bug seen across the Developer Portal
 * guides (whole screens of English text with French chrome).
 *
 * This check flattens each catalog and flags leaf keys whose es/fr/ar value is
 * byte-identical (trimmed) to the English value, i.e. untranslated. It filters
 * out values that are *legitimately* identical across languages so those don't
 * create noise:
 *   - placeholder-only values (URLs, emails, or strings that are nothing but
 *     `{{interpolation}}` / `<0>…</0>` markers once the letters are stripped)
 *   - short brand / technical tokens (LearnCard, API, DID, …)
 *   - anything listed in `scripts/i18n-untranslated-allowlist.json` (intentional
 *     identical values, e.g. genuine French/Spanish cognates like "Description")
 *
 * ADVISORY by default (exit 0) so it can be adopted while a translation backlog
 * is worked down. Pass `--strict` to gate CI (exit 1 on any non-allowlisted
 * offender). Pass `--json` for machine-readable output (feeds the translation
 * dispatch — the offender list IS the to-translate work list).
 *
 * Run:   node scripts/check-i18n-untranslated.mjs [--strict] [--json] [--locale fr]
 * Exit:  0 = clean (or advisory), 1 = offenders found under --strict.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES_DIR = join(APP_ROOT, 'public', 'locales');
const BASE_LOCALE = 'en';
const TARGET_LOCALES = ['es', 'fr', 'ar'];
const ALLOWLIST_PATH = join(APP_ROOT, 'scripts', 'i18n-untranslated-allowlist.json');

const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const strict = argv.includes('--strict');
const localeFilter = (() => {
    const i = argv.indexOf('--locale');
    return i !== -1 ? argv[i + 1] : null;
})();

/**
 * Flatten a nested catalog to dotted leaf keys. Arrays flatten to numeric-index
 * keys (`loaderText.0`) — matching how the inlang i18next plugin exposes them.
 */
const flatten = (obj, prefix = '', out = {}) => {
    const entries = Array.isArray(obj) ? obj.map((v, i) => [String(i), v]) : Object.entries(obj);
    for (const [k, v] of entries) {
        const key = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object') flatten(v, key, out);
        else out[key] = v;
    }
    return out;
};

const loadCatalog = locale =>
    flatten(JSON.parse(readFileSync(join(LOCALES_DIR, locale, 'translation.json'), 'utf8')));

// Short brand / technical tokens that are the SAME in every language. A value
// equal (case-insensitively) to one of these on its own is never a miss.
const BRAND = new Set(
    [
        'LearnCard',
        'API',
        'URL',
        'DID',
        'VC',
        'VP',
        'JSON',
        'OK',
        'ID',
        'TypeScript',
        'Python',
        'cURL',
        'OIDC',
        'W3C',
        'ConsentFlow',
        'Boost',
        'npm',
        'SDK',
        'HTTP',
        'HTTPS',
        'OAuth',
        'UUID',
        'PIN',
        'QR',
        'CSV',
        'PDF',
        'SVG',
        'LC',
        'AI',
    ].map(s => s.toLowerCase())
);

/**
 * A value that is legitimately identical across languages and should never be
 * flagged: URLs, emails, or a string that has no translatable letters left once
 * `{{vars}}` and `<n>…</n>` markup markers are removed. Also bare brand tokens.
 */
const isNonTranslatable = value => {
    const s = String(value).trim();
    if (!s) return true;
    if (/^(https?:\/\/|lc:|did:)/.test(s)) return true; // url / uri
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) return true; // email
    const stripped = s
        .replace(/\{\{[^}]*\}\}/g, '') // interpolation
        .replace(/<\/?\d+>/g, '') // <0> </0> markup markers
        .trim();
    if (!/[A-Za-zÀ-ɏ]/.test(stripped)) return true; // nothing but vars/nums/symbols
    if (BRAND.has(s.toLowerCase())) return true; // bare brand token
    return false;
};

const allowlist = existsSync(ALLOWLIST_PATH)
    ? new Set(JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8')))
    : new Set();

const en = loadCatalog(BASE_LOCALE);
const locales = (localeFilter ? [localeFilter] : TARGET_LOCALES).filter(l => l !== BASE_LOCALE);

const report = {};
for (const locale of locales) {
    const cat = loadCatalog(locale);
    const offenders = [];
    for (const [key, enVal] of Object.entries(en)) {
        if (typeof enVal !== 'string') continue;
        if (isNonTranslatable(enVal)) continue;
        const locVal = cat[key];
        if (typeof locVal !== 'string') continue; // missing key is parity's job, not ours
        if (locVal.trim() !== enVal.trim()) continue; // translated — good
        if (allowlist.has(`${locale}:${key}`) || allowlist.has(key)) continue;
        offenders.push({ key, en: enVal });
    }
    report[locale] = offenders;
}

if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    const total = Object.values(report).reduce((n, o) => n + o.length, 0);
    process.exit(strict && total > 0 ? 1 : 0);
}

let total = 0;
for (const locale of locales) {
    const offenders = report[locale];
    total += offenders.length;
    if (!offenders.length) {
        console.log(`✓ ${locale}: no untranslated (English-fallback) values`);
        continue;
    }
    console.error(`\n✗ ${locale}: ${offenders.length} untranslated value(s) (identical to English):`);
    // Group by top-2 namespace segments so the scope is legible at a glance.
    const byNs = new Map();
    for (const o of offenders) {
        const ns = o.key.split('.').slice(0, 2).join('.');
        byNs.set(ns, (byNs.get(ns) || 0) + 1);
    }
    const top = [...byNs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    for (const [ns, n] of top) console.error(`    ${String(n).padStart(4)}  ${ns}`);
    if (byNs.size > top.length) console.error(`    …and ${byNs.size - top.length} more namespaces`);
}

if (total === 0) {
    console.log('\n✓ i18n guard: no English-fallback values in es/fr/ar');
    process.exit(0);
}

console.error(
    `\n${total} untranslated value(s) across ${locales.join('/')}. ` +
        `These render English under a non-English UI.\n` +
        `  • Full list:   node scripts/check-i18n-untranslated.mjs --json\n` +
        `  • Intentional? add the dotted key (or "locale:key") to scripts/i18n-untranslated-allowlist.json\n`
);
process.exit(strict ? 1 : 0);

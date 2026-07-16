/**
 * Guard against interpolation/markup corruption introduced by translation.
 *
 * A translated value must carry the SAME `{{variable}}` placeholders and
 * `<0>…</0>` markup markers as its English source. Machine translation (and the
 * occasional human) breaks this in three ways, all of which render wrong at
 * runtime:
 *   1. RENAMED var  — `{{brand}}` becomes `{{marca}}` / `{{marque}}` /
 *      `{{العلامة}}`. i18next looks up the value by name, so a translated name
 *      never resolves and the literal `{{marca}}` shows on screen. Also catches
 *      hallucinated names (`{{invalid}}` where en had `{{summary}}`).
 *   2. DROPPED var  — `Slug: {{slug}}` → `المعرّف` drops `{{slug}}`, so the slug
 *      value silently never appears.
 *   3. MARKUP drift — `<0>…</0>` count differs, breaking <Trans> component
 *      indexing.
 *
 * Renamed vars and markup drift are ALWAYS bugs → hard errors. Dropped vars are
 * usually bugs but sometimes correct (e.g. Arabic has no indefinite `{{article}}`;
 * i18next `*One` plural forms may inline the count) → reported as advisories and
 * silenced per-entry via `scripts/i18n-marker-allowlist.json`. EXTRA copies of a
 * valid var are allowed (plural agreement: "Posible{{plural}} culpable{{plural}}").
 *
 * Run:   node scripts/check-i18n-markers.mjs [--strict] [--locale fr]
 * Exit:  0 = clean/advisory, 1 = renamed/markup error (always) or any dropped
 *        var under --strict.
 */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES_DIR = join(APP_ROOT, 'public', 'locales');
const BASE_LOCALE = 'en';
const TARGET_LOCALES = ['es', 'fr', 'ar'];
const ALLOWLIST_PATH = join(APP_ROOT, 'scripts', 'i18n-marker-allowlist.json');

const argv = process.argv.slice(2);
const strict = argv.includes('--strict');
const localeFilter = (() => {
    const i = argv.indexOf('--locale');
    return i !== -1 ? argv[i + 1] : null;
})();

// Grammatical-particle vars that are legitimately droppable in some languages.
const DROPPABLE_VARS = new Set(['article']);

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

/** Multiset of `{{var}}` names in a string (ignores whitespace inside braces). */
const varNames = s => (s.match(/\{\{\s*([^}]*?)\s*\}\}/g) || []).map(m => m.replace(/[{}]/g, '').trim());
/** Multiset of `<0>` / `</0>` markup markers. */
const markup = s => (s.match(/<\/?\d+>/g) || []).slice().sort();

const counts = arr => arr.reduce((m, x) => m.set(x, (m.get(x) || 0) + 1), new Map());

const allowlist = existsSync(ALLOWLIST_PATH)
    ? new Set(JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8')))
    : new Set();
const allowed = (locale, key) => allowlist.has(`${locale}:${key}`) || allowlist.has(key);

const en = loadCatalog(BASE_LOCALE);
const locales = (localeFilter ? [localeFilter] : TARGET_LOCALES).filter(l => l !== BASE_LOCALE);

const errors = []; // renamed var / markup drift — always fail
const dropped = []; // missing var — advisory unless --strict

for (const locale of locales) {
    const cat = loadCatalog(locale);
    for (const [key, enVal] of Object.entries(en)) {
        if (typeof enVal !== 'string') continue;
        const locVal = cat[key];
        if (typeof locVal !== 'string') continue;

        const enVars = counts(varNames(enVal));
        const locVars = counts(varNames(locVal));

        // 1. RENAMED / HALLUCINATED: a var name in the locale that en never had.
        for (const name of locVars.keys()) {
            if (!enVars.has(name)) {
                errors.push({ locale, key, kind: 'renamed/unknown var', detail: `{{${name}}}` });
            }
        }
        // 2. MARKUP drift.
        const enMk = markup(enVal).join(' ');
        const locMk = markup(locVal).join(' ');
        if (enMk !== locMk) {
            errors.push({ locale, key, kind: 'markup drift', detail: `en[${enMk}] ${locale}[${locMk}]` });
        }
        // 3. DROPPED var (en had it, locale lost all copies) — advisory.
        for (const name of enVars.keys()) {
            if (!locVars.has(name) && !DROPPABLE_VARS.has(name) && !allowed(locale, key)) {
                dropped.push({ locale, key, kind: 'dropped var', detail: `{{${name}}}` });
            }
        }
    }
}

let failed = false;

if (errors.length) {
    failed = true;
    console.error(`\n✗ i18n markers: ${errors.length} renamed-var / markup error(s) (always bugs):`);
    for (const e of errors) console.error(`    ${e.locale}  ${e.key}  —  ${e.kind}: ${e.detail}`);
}

if (dropped.length) {
    console.error(`\n${strict ? '✗' : '⚠'} i18n markers: ${dropped.length} dropped-variable warning(s):`);
    for (const d of dropped) console.error(`    ${d.locale}  ${d.key}  —  lost ${d.detail}`);
    console.error(
        `  If a drop is correct for the language, add "${dropped[0].locale}:${dropped[0].key}" ` +
            `to scripts/i18n-marker-allowlist.json.`
    );
    if (strict) failed = true;
}

if (!errors.length && !dropped.length) {
    console.log(`✓ i18n markers: {{vars}} and <n> markup intact across ${locales.join('/')}`);
}

process.exit(failed ? 1 : 0);

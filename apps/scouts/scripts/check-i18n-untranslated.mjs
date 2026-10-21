import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['es', 'fr', 'ar'];
const strict = process.argv.includes('--strict');
const asJson = process.argv.includes('--json');
const allowlistPath = join(root, 'scripts', 'i18n-untranslated-allowlist.json');
const allowlist = new Set(existsSync(allowlistPath) ? JSON.parse(readFileSync(allowlistPath)) : []);
const brands = new Set([
    'learncard',
    'scoutpass',
    'api',
    'url',
    'did',
    'vc',
    'json',
    'ok',
    'id',
    'boost',
    'sdk',
    'oauth',
    'qr',
    'csv',
    'pdf',
    'ai',
]);

const flatten = (value, prefix = '', output = {}) => {
    for (const [key, child] of Object.entries(value)) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (child && typeof child === 'object') flatten(child, path, output);
        else output[path] = child;
    }
    return output;
};

const load = locale =>
    flatten(JSON.parse(readFileSync(join(root, 'public', 'locales', locale, 'translation.json'))));
const nonTranslatable = value => {
    const text = String(value).trim();
    const stripped = text
        .replace(/\{\{?[^{}]+\}\}?/g, '')
        .replace(/<\/?\d+>/g, '')
        .trim();
    return (
        !text ||
        /^(https?:\/\/|did:|lc:)/.test(text) ||
        !/[A-Za-zÀ-ɏ]/.test(stripped) ||
        brands.has(text.toLowerCase())
    );
};

const base = load('en');
const report = {};
for (const locale of locales) {
    const catalog = load(locale);
    report[locale] = Object.entries(base)
        .filter(
            ([key, value]) =>
                typeof value === 'string' &&
                catalog[key] === value &&
                !nonTranslatable(value) &&
                !allowlist.has(key) &&
                !allowlist.has(`${locale}:${key}`)
        )
        .map(([key, en]) => ({ key, en }));
}

if (asJson) console.log(JSON.stringify(report, null, 2));
const total = Object.values(report).reduce((count, entries) => count + entries.length, 0);
if (!asJson && total) {
    console.error(`✗ i18n untranslated: ${total} English-fallback value(s)`);
    for (const [locale, entries] of Object.entries(report)) {
        entries.forEach(entry => console.error(`${locale}:${entry.key} = ${entry.en}`));
    }
}
if (!total) console.log('✓ i18n untranslated: no English-fallback values');
process.exit(strict && total ? 1 : 0);

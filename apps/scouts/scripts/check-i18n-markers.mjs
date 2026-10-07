import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import {
    interpolationVariables,
    malformedInterpolations,
    markupMarkers,
} from './i18n-marker-validation.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['es', 'fr', 'ar'];
const strict = process.argv.includes('--strict');
const allowlistPath = join(root, 'scripts', 'i18n-marker-allowlist.json');
const allowlist = new Set(existsSync(allowlistPath) ? JSON.parse(readFileSync(allowlistPath)) : []);

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
const base = load('en');
const failures = [];

for (const [key, source] of Object.entries(base)) {
    if (typeof source !== 'string') continue;
    const malformed = malformedInterpolations(source);
    if (malformed.length) {
        failures.push({
            locale: 'en',
            key,
            malformed,
            unknown: [],
            dropped: [],
            markerMismatch: false,
        });
    }
}

for (const locale of locales) {
    const catalog = load(locale);
    for (const [key, source] of Object.entries(base)) {
        if (typeof source !== 'string' || typeof catalog[key] !== 'string') continue;
        const sourceVariables = new Set(interpolationVariables(source));
        const translatedVariables = new Set(interpolationVariables(catalog[key]));
        const malformed = malformedInterpolations(catalog[key]);
        const markerMismatch =
            markupMarkers(source).join('|') !== markupMarkers(catalog[key]).join('|');
        const unknown = [...translatedVariables].filter(variable => !sourceVariables.has(variable));
        const dropped = [...sourceVariables].filter(variable => !translatedVariables.has(variable));
        const allowed = allowlist.has(key) || allowlist.has(`${locale}:${key}`);

        if (
            malformed.length ||
            unknown.length ||
            markerMismatch ||
            (strict && dropped.length && !allowed)
        ) {
            failures.push({ locale, key, malformed, unknown, dropped, markerMismatch });
        }
    }
}

if (failures.length) {
    console.error(`✗ i18n markers: ${failures.length} mismatch(es)`);
    failures.forEach(failure => console.error(JSON.stringify(failure)));
    process.exit(1);
}

console.log('✓ i18n markers: interpolation variables and markup are intact');

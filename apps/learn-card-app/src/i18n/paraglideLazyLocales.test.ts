import * as fs from 'fs';
import { join } from 'path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { renderLocaleTable, transformParaglideIndex } from './paraglideLazyLocales';

// The app's ambient Node typings predate fs.rmSync (Node >= 14.14); it exists at runtime.
const { mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } =
    fs as typeof fs & {
        rmSync: (path: string, options: { recursive: boolean; force: boolean }) => void;
    };

// Exercise the transform on the REAL generated Paraglide output (compiled by the paraglide
// vite plugin before tests run), executed as a module graph of its own.
const generated = join(__dirname, '../paraglide');

type Messages = Record<string, (inputs?: Record<string, unknown>) => string> & {
    $loadLocaleMessages: (locale: string) => Promise<void>;
    $isLocaleMessagesLoaded: (locale: string) => boolean;
};
type Runtime = { setLocale: (locale: string, options: { reload: boolean }) => void };

let dir: string;
let messages: Messages;
let runtime: Runtime;
let keys: string[];
let lazyLocales: string[];

beforeAll(async () => {
    // Inside the app so Vite may serve it (gitignored, like the generated catalog).
    const cache = join(__dirname, '../../node_modules/.cache');
    mkdirSync(cache, { recursive: true });
    dir = mkdtempSync(join(cache, 'paraglide-lazy-'));
    mkdirSync(join(dir, 'messages'));
    for (const file of ['runtime.js', 'registry.js']) {
        copyFileSync(join(generated, file), join(dir, file));
    }
    for (const locale of ['en', 'es', 'fr', 'ar']) {
        copyFileSync(
            join(generated, 'messages', `${locale}.js`),
            join(dir, 'messages', `${locale}.js`)
        );
    }
    const index = readFileSync(join(generated, 'messages/_index.js'), 'utf8');
    const tableFile = (locale: string) => `__table_${locale}.js`;
    const result = transformParaglideIndex(index, 'en', locale => `./${tableFile(locale)}`);
    writeFileSync(join(dir, 'messages/_index.js'), result.code);
    for (const locale of result.lazyLocales) {
        writeFileSync(
            join(dir, 'messages', tableFile(locale)),
            renderLocaleTable(`./${locale}.js`, result.keys)
        );
    }
    keys = result.keys;
    lazyLocales = result.lazyLocales;

    runtime = await import(/* @vite-ignore */ join(dir, 'runtime.js'));
    messages = await import(/* @vite-ignore */ join(dir, 'messages/_index.js'));
}, 120_000);

afterAll(() => rmSync(dir, { recursive: true, force: true }));

// Present in en/es/fr; missing from es (es.js re-exports it from en.js).
const TRANSLATED = 'classlinkPersonalEmail.title';
const MISSING_IN_ES = 'transcriptOptIn.finishingUp';

describe('paraglide lazy locales (real generated catalog)', () => {
    it('renders base-locale text for a locale that has not loaded, then its own after loading', async () => {
        runtime.setLocale('en', { reload: false });
        const english = messages[TRANSLATED]();

        runtime.setLocale('es', { reload: false });
        expect(messages.$isLocaleMessagesLoaded('es')).toBe(false);
        expect(messages[TRANSLATED]()).toBe(english);

        await messages.$loadLocaleMessages('es');
        expect(messages.$isLocaleMessagesLoaded('es')).toBe(true);
        expect(messages[TRANSLATED]()).toBe('Añade un correo personal');
        expect(messages[TRANSLATED]()).not.toBe(english);
    });

    it('falls back to the base locale for a key the loaded locale lacks', async () => {
        await messages.$loadLocaleMessages('es');
        runtime.setLocale('en', { reload: false });
        const english = messages[MISSING_IN_ES]();
        runtime.setLocale('es', { reload: false });
        expect(messages[MISSING_IN_ES]()).toBe(english);
    });

    it('switches between lazily loaded locales and keeps the base locale static', async () => {
        expect(messages.$isLocaleMessagesLoaded('en')).toBe(true);
        await expect(messages.$loadLocaleMessages('en')).resolves.toBeUndefined();

        await messages.$loadLocaleMessages('fr');
        runtime.setLocale('fr', { reload: false });
        const french = messages[TRANSLATED]();
        runtime.setLocale('es', { reload: false });
        expect(messages[TRANSLATED]()).toBe('Añade un correo personal');
        expect(french).not.toBe('Añade un correo personal');
        runtime.setLocale('en', { reload: false });
    });

    it('builds complete tables: every message resolves in the base and every lazy locale', async () => {
        expect([...lazyLocales].sort()).toEqual(['ar', 'es', 'fr']);
        expect(keys.length).toBeGreaterThan(8000);
        const en = await import(/* @vite-ignore */ join(dir, 'messages/en.js'));
        expect(keys.filter(key => typeof en[key] !== 'function')).toEqual([]);
        for (const locale of lazyLocales) {
            const { default: table } = (await import(
                /* @vite-ignore */ join(dir, 'messages', `__table_${locale}.js`)
            )) as { default: unknown[] };
            const module = await import(/* @vite-ignore */ join(dir, 'messages', `${locale}.js`));
            expect(table).toHaveLength(keys.length);
            // Same function objects, in table order (keeps `.parts` on markup messages too).
            expect(keys.filter((key, index) => table[index] !== module[key])).toEqual([]);
            expect(table.filter(entry => typeof entry !== 'function')).toEqual([]);
        }
    });

    it('ignores locales it does not know', async () => {
        expect(messages.$isLocaleMessagesLoaded('xx')).toBe(true);
        await expect(messages.$loadLocaleMessages('xx')).resolves.toBeUndefined();
    });
});

describe('transformParaglideIndex', () => {
    const sample = [
        'import { getLocale } from "../runtime.js"',
        'import * as __en from "./en.js"',
        'import * as __es from "./es.js"',
        'const hi = (i) => (getLocale() === "es" ? __es.hi(i) : __en.hi(i))',
        'const bye = (i) => (getLocale() === "es" ? __es.bye(i) : __en.bye(i))',
        'const rich = (i) => (typeof __es.rich.parts === "function" ? __es.rich.parts(i) : __es.rich(i))',
    ].join('\n');
    const table = (locale: string) => `virtual:table/${locale}`;

    it('keeps the base import and turns other locales into index tables with loaders', () => {
        const result = transformParaglideIndex(sample, 'en', table);
        const { code } = result;
        expect(result.keys).toEqual(['hi', 'bye', 'rich']);
        expect(result.lazyLocales).toEqual(['es']);
        expect(code).toContain('import * as __en from "./en.js"');
        expect(code).not.toContain('import * as __es');
        expect(code).toContain('__es[0](i)');
        expect(code).toContain('__es[1](i)');
        expect(code).toContain(
            'typeof __es[2].parts === "function" ? __es[2].parts(i) : __es[2](i)'
        );
        expect(code).toContain('const __lazyBaseTable = [__en.hi, __en.bye, __en.rich];');
        expect(code).toContain('let __es = __lazyBaseTable;');
        expect(code).toContain('import("virtual:table/es")');
        expect(renderLocaleTable('/m/es.js', result.keys)).toBe(
            'import * as __locale from "/m/es.js";\nexport default [__locale.hi, __locale.bye, __locale.rich];\n'
        );
    });

    it('fails loudly when Paraglide output no longer matches', () => {
        expect(() => transformParaglideIndex('export const x = 1', 'en', table)).toThrow(
            /Paraglide output changed/
        );
        expect(() =>
            transformParaglideIndex('import * as __en from "./en.js"\n', 'en', table)
        ).toThrow(/Paraglide output changed/);
        // A non-call use of a lazy namespace would escape the table swap.
        expect(() =>
            transformParaglideIndex(`${sample}\nexport const ns = __es`, 'en', table)
        ).toThrow(/Paraglide output changed/);
    });
});

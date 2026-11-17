import path from 'path';
import type { Plugin } from 'vite';

/**
 * Code-splits Paraglide's non-base locale modules out of the startup chunk (hillclimb H4, LC-2415).
 *
 * Paraglide's `locale-modules` output has one dispatcher per message in `messages/_index.js`, and
 * every dispatcher calls into every locale module (`__es.key(inputs)`) through static
 * `import * as __es from "./es.js"` lines, so every language's strings ship in the entry chunk.
 *
 * In production builds the transform keeps the base locale static and rewrites each other locale to an
 * index-based table: `__es[17](inputs)` (and `__es[17].parts` for markup messages). Each table starts as the base locale's table, and
 * `$loadLocaleMessages(locale)` swaps in the locale's real table from a lazily imported table module
 * (`export default [l.key0, l.key1, ...]`). Dispatchers read the table at call time, so before a locale
 * loads it renders base-locale text: the same fallback Paraglide compiles in for keys a locale lacks
 * (its modules re-export those from the base module). The app loads the active locale before the first
 * render and before every switch (see ./localeMessages and ./index.tsx).
 *
 * Tables are indexed rather than name-keyed on purpose: name-keyed namespace access keeps all ~8k full
 * message names in the entry and in every locale chunk, which costs back about what the split saves.
 *
 * The transform throws if Paraglide's output no longer has the expected shape, so a Paraglide upgrade
 * fails the build instead of silently shipping a broken split. Dev and tests keep Paraglide's static
 * output; there `loadLocaleMessages` is a no-op.
 */
export const LOAD_LOCALE_EXPORT = '$loadLocaleMessages';
export const IS_LOADED_EXPORT = '$isLocaleMessagesLoaded';

/** What app code imports: `loadLocaleMessages` and `isLocaleMessagesLoaded`. */
export const LOCALE_LOADER_MODULE = 'virtual:paraglide-lazy-locales';
const TABLE_MODULE_PREFIX = 'virtual:paraglide-lazy-table/';

const LOCALE_IMPORT = /^import \* as __([A-Za-z0-9_]+) from "\.\/([A-Za-z0-9_-]+)\.js"$/gm;
const IDENTIFIER = '[A-Za-z_$][A-Za-z0-9_$]*';

export const PARAGLIDE_INDEX_ID = /[\\/]paraglide[\\/]messages[\\/]_index\.js$/;

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const drift = (detail: string): Error =>
    new Error(`[paraglide-lazy-locales] ${detail}; Paraglide output changed`);

export interface ParaglideIndexTransform {
    code: string;
    /** Message export names, in table order. Every lazy locale's table uses this order. */
    keys: string[];
    lazyLocales: string[];
}

// One plain dispatcher as Paraglide emits it, after the lazy-locale member rewrite above:
//   ((inputs = {}, options = {}) => {
//   \tconst locale = experimentalStaticLocale ?? options.locale ?? getLocale()
//   \tif (locale === "en") return __en.key(inputs)
//   \tif (locale === "es") return __es[17](inputs)
//   \treturn __ar[17](inputs)
//   })
const DISPATCHER = new RegExp(
    String.raw`\(\(inputs = \{\}, options = \{\}\) => \{\n\tconst locale = experimentalStaticLocale \?\? options\.locale \?\? getLocale\(\)\n` +
        String.raw`((?:\tif \(locale === "[A-Za-z0-9_-]+"\) return __[A-Za-z0-9_]+(?:\.${IDENTIFIER}|\[\d+\])\(inputs\)\n)+)` +
        String.raw`\treturn __([A-Za-z0-9_]+)\[(\d+)\]\(inputs\)\n\}\)`,
    'g'
);
const DISPATCH_LINE = new RegExp(
    String.raw`\tif \(locale === "([A-Za-z0-9_-]+)"\) return __([A-Za-z0-9_]+)(?:\.(${IDENTIFIER})|\[(\d+)\])\(inputs\)`,
    'g'
);
export const COMPACT_DISPATCHER = '__lazyMsg';

/**
 * Replaces each plain message dispatcher (~170 B minified, ~8k of them) with a call to one shared
 * dispatcher factory: `/* @__PURE__ *\/ __lazyMsg(17)` (~20 B). Only dispatchers whose branches all point
 * at the same table index, in the same locale order, are replaced; anything else (markup `.parts`
 * messages, unexpected shapes) stays as Paraglide wrote it. Behavior is the same: the factory reads the
 * locale per call, picks the locale's table (base table for the base locale, which holds the same
 * functions as the base namespace), and falls through to the last locale like the original.
 */
export const compactDispatchers = (
    code: string,
    baseLocale: string,
    keyIndex: Map<string, number>
): string => {
    let order: string[] | undefined;
    let replaced = 0;
    const out = code.replace(
        DISPATCHER,
        (whole, lines: string, last: string, lastIndex: string) => {
            const index = Number(lastIndex);
            const branches = [...lines.matchAll(DISPATCH_LINE)];
            const locales: string[] = [];
            for (const [, locale, binding, key, tableIndex] of branches) {
                const ok =
                    binding === locale &&
                    (locale === baseLocale
                        ? key !== undefined && keyIndex.get(key) === index
                        : tableIndex !== undefined && Number(tableIndex) === index);
                if (!ok) return whole;
                locales.push(locale);
            }
            locales.push(last);
            if (!locales.includes(baseLocale)) return whole;
            order ??= locales;
            if (order.join() !== locales.join()) return whole;
            replaced++;
            return `/* @__PURE__ */ ${COMPACT_DISPATCHER}(${index})`;
        }
    );
    if (!order || replaced === 0) return code;
    const table = (locale: string) => (locale === baseLocale ? '__lazyBaseTable' : `__${locale}`);
    const pick = order
        .slice(0, -1)
        .map(locale => `locale === ${JSON.stringify(locale)} ? ${table(locale)} : `)
        .join('');
    return (
        out +
        `
function ${COMPACT_DISPATCHER}(i) {
\treturn (inputs = {}, options = {}) => {
\t\tconst locale = experimentalStaticLocale ?? options.locale ?? getLocale()
\t\treturn (${pick}${table(order[order.length - 1]!)})[i](inputs)
\t}
}
`
    );
};

export const transformParaglideIndex = (
    code: string,
    baseLocale: string,
    tableSpecifier: (locale: string) => string
): ParaglideIndexTransform => {
    const imports = [...code.matchAll(LOCALE_IMPORT)].map(match => ({
        line: match[0],
        binding: match[1],
        file: match[2],
    }));
    if (!imports.some(entry => entry.binding === baseLocale && entry.file === baseLocale)) {
        throw drift(
            `base locale import "import * as __${baseLocale} from "./${baseLocale}.js"" not found`
        );
    }
    const lazy = imports.filter(entry => entry.binding !== baseLocale);
    if (lazy.length === 0 || lazy.some(entry => entry.binding !== entry.file)) {
        throw drift('unexpected locale import shape');
    }

    const keyIndex = new Map<string, number>();
    const indexOf = (key: string): number => {
        let index = keyIndex.get(key);
        if (index === undefined) {
            index = keyIndex.size;
            keyIndex.set(key, index);
        }
        return index;
    };

    let out = code;
    for (const { line, binding } of lazy) {
        // `__es.key(inputs)`, and `__es.key.parts` for markup messages: any member access is a message.
        const member = new RegExp(`\\b__${escapeRegExp(binding)}\\.(${IDENTIFIER})\\b`, 'g');
        out = out.replace(member, (_match, key: string) => `__${binding}[${indexOf(key)}]`);
        out = out.replace(line, '');
        // Any other use left over (e.g. the namespace passed around) would escape the table swap.
        if (new RegExp(`\\b__${escapeRegExp(binding)}\\b(?!\\[\\d+\\])`).test(out)) {
            throw drift(`unexpected use of __${binding} besides message access`);
        }
    }
    if (keyIndex.size === 0) throw drift('no locale message access found');

    const keys = [...keyIndex.keys()];
    out = compactDispatchers(out, baseLocale, keyIndex);
    const baseTable = keys.map(key => `__${baseLocale}.${key}`).join(', ');
    const bindings = lazy.map(({ binding }) => `let __${binding} = __lazyBaseTable;`).join('\n');
    const loaders = lazy
        .map(
            ({ binding }) =>
                `${JSON.stringify(binding)}: () => import(${JSON.stringify(
                    tableSpecifier(binding)
                )}).then(mod => { __${binding} = mod.default; })`
        )
        .join(',\n\t');
    out += `
const __lazyBaseTable = [${baseTable}];
${bindings}
const __lazyLocaleLoaders = {
\t${loaders}
};
const __lazyLocaleLoads = {};
const __lazyLocaleLoaded = new Set([${JSON.stringify(baseLocale)}]);
export const ${IS_LOADED_EXPORT} = locale => !(locale in __lazyLocaleLoaders) || __lazyLocaleLoaded.has(locale);
export const ${LOAD_LOCALE_EXPORT} = locale => {
\tconst load = __lazyLocaleLoaders[locale];
\tif (!load || __lazyLocaleLoaded.has(locale)) return Promise.resolve();
\treturn (__lazyLocaleLoads[locale] ??= load().then(
\t\t() => { __lazyLocaleLoaded.add(locale); },
\t\terror => { delete __lazyLocaleLoads[locale]; throw error; }
\t));
};
`;
    return { code: out, keys, lazyLocales: lazy.map(({ binding }) => binding) };
};

/** A locale's table module: its messages in `keys` order. */
export const renderLocaleTable = (localeModuleSpecifier: string, keys: string[]): string =>
    `import * as __locale from ${JSON.stringify(localeModuleSpecifier)};\n` +
    `export default [${keys.map(key => `__locale.${key}`).join(', ')}];\n`;

/**
 * Splits locales in production builds. In dev and tests it only serves the loader module as no-ops,
 * so app code imports one module everywhere and Paraglide's output stays untouched.
 */
export const paraglideLazyLocales = (baseLocale: string, messagesDir: string): Plugin => {
    let isBuild = false;
    let keys: string[] | undefined;
    const resolvedLoader = `\0${LOCALE_LOADER_MODULE}`;
    const resolvedTablePrefix = `\0${TABLE_MODULE_PREFIX}`;

    return {
        name: 'paraglide-lazy-locales',
        configResolved(config) {
            isBuild = config.command === 'build' && !config.build.ssr;
        },
        resolveId(id) {
            if (id === LOCALE_LOADER_MODULE) return resolvedLoader;
            if (isBuild && id.startsWith(TABLE_MODULE_PREFIX)) return `\0${id}`;
            return undefined;
        },
        load(id) {
            if (id === resolvedLoader) {
                if (!isBuild) {
                    return 'export const loadLocaleMessages = () => Promise.resolve();\nexport const isLocaleMessagesLoaded = () => true;\n';
                }
                const index = JSON.stringify(path.join(messagesDir, '_index.js'));
                return `export { ${LOAD_LOCALE_EXPORT} as loadLocaleMessages, ${IS_LOADED_EXPORT} as isLocaleMessagesLoaded } from ${index};\n`;
            }
            if (id.startsWith(resolvedTablePrefix)) {
                if (!keys)
                    throw new Error(
                        '[paraglide-lazy-locales] locale table requested before messages/_index.js was transformed'
                    );
                const locale = id.slice(resolvedTablePrefix.length);
                return renderLocaleTable(path.join(messagesDir, `${locale}.js`), keys);
            }
            return undefined;
        },
        transform(code, id) {
            if (!isBuild || !PARAGLIDE_INDEX_ID.test(id)) return undefined;
            const result = transformParaglideIndex(
                code,
                baseLocale,
                locale => `${TABLE_MODULE_PREFIX}${locale}`
            );
            keys = result.keys;
            return { code: result.code, map: null };
        },
    };
};

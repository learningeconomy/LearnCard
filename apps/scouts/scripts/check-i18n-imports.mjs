/**
 * Guard against duplicate Paraglide message imports.
 *
 * `src/paraglide/messages.js` re-exports BOTH forms:
 *   export *            from './messages/_index.js'   // enables `import * as m`
 *   export * as m       from './messages/_index.js'   // enables `import { m }`
 *
 * Either import alone works for `m['key']()`, but having BOTH in one file
 * declares the identifier `m` twice → runtime
 *   `SyntaxError: Identifier 'm' has already been declared`
 * which white-screens the whole route. (Hit on the AI Pathways / Insights
 * routes in LC-1831 when an automated i18n sweep added `import { m }` to files
 * that already had `import * as m`.)
 *
 * ESLint's `import/no-duplicates` covers this conceptually, but lint is not in
 * the `vite build` path, so a build can ship the bug. This check runs as a Vite
 * plugin (see vite.config.ts) on every build + dev start, and standalone via
 * `node scripts/check-i18n-imports.mjs`.
 *
 * Exit code: 0 = clean, 1 = duplicate import(s) found.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
// Any import statement whose source path ends in paraglide/messages(.js)
const MESSAGES_IMPORT =
    /^\s*import\s+(?:\*\s+as\s+\w+|\{[^}]*\})\s+from\s+['"][^'"]*paraglide\/messages(?:\.js)?['"]/gm;

/** @returns {string[]} absolute paths of all .ts/.tsx files under src */
const walk = dir => {
    const out = [];
    for (const entry of readdirSync(dir)) {
        const p = join(dir, entry);
        const s = statSync(p);
        if (s.isDirectory()) {
            if (entry === 'paraglide' || entry === 'node_modules') continue;
            out.push(...walk(p));
        } else if (/\.tsx?$/.test(entry)) {
            out.push(p);
        }
    }
    return out;
};

export const findDuplicateMessageImports = () => {
    const offenders = [];
    for (const file of walk(SRC)) {
        const matches = readFileSync(file, 'utf8').match(MESSAGES_IMPORT);
        if (matches && matches.length > 1) {
            offenders.push({ file, lines: matches.map(m => m.trim()) });
        }
    }
    return offenders;
};

const offenders = findDuplicateMessageImports();
if (offenders.length) {
    console.error(
        '\n✗ i18n guard: duplicate paraglide/messages.js import(s) — this causes ' +
            '"Identifier \'m\' has already been declared" at runtime:\n'
    );
    for (const o of offenders) {
        console.error(`  ${o.file}`);
        for (const l of o.lines) console.error(`      ${l}`);
    }
    console.error('\n  Fix: keep ONE import per file (either `import * as m` OR `import { m }`).\n');
    process.exit(1);
}
console.log('✓ i18n guard: no duplicate paraglide/messages.js imports');

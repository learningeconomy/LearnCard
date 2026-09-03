#!/usr/bin/env node
/**
 * Keep code blocks in docs/ identical to the runnable files in docs/snippets/.
 *
 * Why: a code sample in Markdown cannot be executed, so it rots silently. The files in
 * docs/snippets/ are real programs that tests/e2e runs against a live LearnCard Network
 * on every PR. This script guarantees the Markdown shows exactly those files.
 *
 * Markup (HTML comments are invisible in GitBook):
 *
 *   <!-- snippet: quickstart/send.mjs -->
 *   ```javascript
 *   ...contents of docs/snippets/quickstart/send.mjs...
 *   ```
 *   <!-- /snippet -->
 *
 * Usage:
 *   node scripts/check-docs-snippets.mjs          # verify; exit 1 on drift or missing files
 *   node scripts/check-docs-snippets.mjs --fix    # rewrite the Markdown blocks from the files
 *
 * The fence language is preserved from the Markdown; only the body is replaced. Every file in
 * docs/snippets/ must be referenced by at least one doc, so nothing is tested but unpublished.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');
const SNIPPETS = join(DOCS, 'snippets');
const FIX = process.argv.includes('--fix');

const walk = dir =>
    readdirSync(dir).flatMap(name => {
        const full = join(dir, name);
        if (name === '.git' || name === 'archive' || name === 'snippets') return [];
        return statSync(full).isDirectory() ? walk(full) : [full];
    });

// Prettier puts a blank line between an HTML comment and a fence; tolerate and emit that.
const BLOCK =
    /<!--\s*snippet:\s*([^\s]+)\s*-->\s*\n```([^\n]*)\r?\n([\s\S]*?)```\s*\n<!--\s*\/snippet\s*-->/g;

const errors = [];
const referenced = new Set();
let fixed = 0;

for (const file of walk(DOCS).filter(f => f.endsWith('.md'))) {
    const rel = relative(ROOT, file).split(sep).join('/');
    const original = readFileSync(file, 'utf8');
    let changed = false;

    const updated = original.replace(BLOCK, (whole, snippetPath, lang, body) => {
        const snippetFile = join(SNIPPETS, snippetPath);
        referenced.add(snippetPath);
        if (!existsSync(snippetFile)) {
            errors.push(`${rel}: snippet file missing -> docs/snippets/${snippetPath}`);
            return whole;
        }
        const expected = readFileSync(snippetFile, 'utf8').replace(/\r\n/g, '\n');
        const expectedBody = expected.endsWith('\n') ? expected : `${expected}\n`;
        if (body === expectedBody) return whole;
        if (FIX) {
            changed = true;
            return `<!-- snippet: ${snippetPath} -->\n\n\`\`\`${lang}\n${expectedBody}\`\`\`\n\n<!-- /snippet -->`;
        }
        errors.push(
            `${rel}: code block out of sync with docs/snippets/${snippetPath} (run: node scripts/check-docs-snippets.mjs --fix)`
        );
        return whole;
    });

    if (changed) {
        writeFileSync(file, updated);
        fixed++;
    }
}

for (const file of walk(SNIPPETS)) {
    const rel = relative(SNIPPETS, file).split(sep).join('/');
    if (!referenced.has(rel)) errors.push(`docs/snippets/${rel}: not embedded in any doc page`);
}

if (errors.length) {
    console.error(`\n${errors.length} snippet error(s):`);
    errors.forEach(e => console.error(`  ERROR: ${e}`));
    process.exit(1);
}

console.log(
    FIX
        ? `Snippets synced: ${fixed} file(s) rewritten, ${referenced.size} snippet(s) embedded.`
        : `Snippets OK: ${referenced.size} embedded, all in sync.`
);

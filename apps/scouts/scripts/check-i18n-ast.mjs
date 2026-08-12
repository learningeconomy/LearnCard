import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ESLint } = require('eslint');
const minimatch = require('minimatch');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = join(root, 'scripts', 'i18n-ast-baseline.json');
const writeBaseline = process.argv.includes('--write-baseline');

const eslint = new ESLint({
    cwd: root,
    useEslintrc: false,
    overrideConfigFile: join(root, '.eslintrc-i18n.cjs'),
    allowInlineConfig: false,
    rulePaths: [join(root, 'eslint-rules')],
});

// Only user-facing source counts toward untranslated-literal debt. Test modules
// and the development-only debug widgets are not shipped copy, so exclude them.
// (ESLint v8's lintFiles silently ignores `!` negation globs, so the exclude
// patterns are enforced explicitly below via minimatch.)
const lintPatterns = [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/components/debug/**/*.{ts,tsx}',
];
const includes = lintPatterns.filter(pattern => !pattern.startsWith('!'));
const excludes = lintPatterns
    .filter(pattern => pattern.startsWith('!'))
    .map(pattern => pattern.slice(1));
const isExcluded = filePath =>
    excludes.some(pattern => minimatch(relative(root, filePath), pattern));

const results = (await eslint.lintFiles(includes)).filter(
    result => !isExcluded(result.filePath)
);
const sourceLineFor = (result, message) => {
    const source = result.source ?? readFileSync(result.filePath, 'utf8');
    return source.split(/\r?\n/)[message.line - 1]?.trim().replace(/\s+/g, ' ');
};
const fingerprint = (result, message) =>
    [
        relative(root, result.filePath),
        message.ruleId,
        message.message,
        sourceLineFor(result, message),
    ].join('::');
const findings = results
    .flatMap(result => result.messages.map(message => fingerprint(result, message)))
    .sort();
const uniqueFindings = [...new Set(findings)];

if (writeBaseline) {
    writeFileSync(baselinePath, `${JSON.stringify(uniqueFindings, null, 4)}\n`);
    console.log(`✓ i18n AST baseline updated: ${uniqueFindings.length} known finding(s)`);
    process.exit(0);
}

const baseline = new Set(
    existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : []
);
const newFindings = new Set(uniqueFindings.filter(finding => !baseline.has(finding)));
const newResults = results
    .map(result => ({
        ...result,
        messages: result.messages.filter(message => newFindings.has(fingerprint(result, message))),
    }))
    .filter(result => result.messages.length > 0);

if (newResults.length) {
    const formatter = await eslint.loadFormatter('stylish');
    console.error(await formatter.format(newResults));
    console.error(`✗ i18n AST guard: ${newFindings.size} new untranslated literal(s)`);
    process.exit(1);
}

console.log(
    `✓ i18n AST guard: no new literals (${uniqueFindings.length} known baseline finding(s))`
);

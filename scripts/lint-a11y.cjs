const path = require('path');
const { ESLint } = require('eslint');

const ROOT_DIR = path.resolve(__dirname, '..');
const APP_SOURCE_PATTERN = 'apps/learn-card-app/src/**/*.{ts,tsx}';
const BASE_SOURCE_PATTERN = 'packages/learn-card-base/src/**/*.{ts,tsx}';
const A11Y_WARNING_BASELINE = 327;
const A11Y_RULE_PREFIX = 'jsx-a11y/';

// Lint the LearnCard app and shared component library by default. Passing
// file/glob arguments makes this script useful for reviewing a smaller set
// of changed files locally.
const requestedPatterns = process.argv.slice(2);
const lintPatterns =
    requestedPatterns.length > 0 ? requestedPatterns : [APP_SOURCE_PATTERN, BASE_SOURCE_PATTERN];

// Keep the repository-wide warning baseline compact in normal runs, while
// showing actionable locations for explicitly requested files or verbose runs.
const showWarnings = process.env.A11Y_VERBOSE === '1' || requestedPatterns.length > 0;

// Run an isolated ESLint instance so unrelated legacy lint findings do not
// hide accessibility regressions or prevent the warning-first rollout.
const eslint = new ESLint({
    cwd: ROOT_DIR,
    overrideConfigFile: path.join(ROOT_DIR, 'eslint.a11y.config.mjs'),
});

const run = async () => {
    const results = await eslint.lintFiles(lintPatterns);

    // ESLint can still return parser/configuration failures without a rule ID;
    // retain those fatal messages alongside the scoped jsx-a11y results.
    const messages = results.flatMap(result =>
        result.messages
            .filter(message => message.fatal || message.ruleId?.startsWith(A11Y_RULE_PREFIX))
            .map(message => ({ ...message, filePath: result.filePath }))
    );

    const fatalMessages = messages.filter(message => message.fatal);
    const a11yMessages = messages.filter(message => !message.fatal);
    const errorMessages = a11yMessages.filter(message => message.severity === 2);
    const warningMessages = a11yMessages.filter(message => message.severity === 1);

    // Summarize warnings by rule so the remaining baseline is visible without
    // flooding CI output with hundreds of individual legacy findings.
    const warningCounts = warningMessages.reduce((counts, message) => {
        const ruleName = message.ruleId ?? 'unknown';
        counts.set(ruleName, (counts.get(ruleName) ?? 0) + 1);
        return counts;
    }, new Map());

    console.log(
        `jsx-a11y: ${errorMessages.length} error(s), ${warningMessages.length} warning(s) across ${results.length} source file(s).`
    );

    if (warningCounts.size > 0) {
        console.log('\nWarning baseline:');
        [...warningCounts.entries()]
            .sort(([leftRule], [rightRule]) => leftRule.localeCompare(rightRule))
            .forEach(([ruleName, count]) => console.log(`  ${ruleName}: ${count}`));
    }

    if (showWarnings && warningMessages.length > 0) {
        console.log('\nWarnings:');
        warningMessages.forEach(message => {
            const relativePath = path.relative(ROOT_DIR, message.filePath);
            const location = `${relativePath}:${message.line ?? 0}:${message.column ?? 0}`;
            console.log(`  ${location} ${message.message} (${message.ruleId})`);
        });
    }

    const warningBaselineExceeded =
        requestedPatterns.length === 0 && warningMessages.length > A11Y_WARNING_BASELINE;
    const warningBaselineImproved =
        requestedPatterns.length === 0 && warningMessages.length < A11Y_WARNING_BASELINE;

    if (warningBaselineImproved) {
        console.log(
            `\nWarning baseline improved: ${A11Y_WARNING_BASELINE} → ${warningMessages.length}. ` +
                'Lower A11Y_WARNING_BASELINE to preserve the improvement.'
        );
    }

    if (warningBaselineExceeded) {
        console.error(
            `\nWarning baseline exceeded: ${warningMessages.length} > ${A11Y_WARNING_BASELINE}.`
        );
    }

    // Warnings remain non-blocking up to the recorded baseline. Promoted
    // rules in eslint.a11y.config.mjs, fatal failures, and baseline growth
    // determine the exit code.
    if (errorMessages.length > 0 || fatalMessages.length > 0) {
        console.error('\nErrors:');
        [...fatalMessages, ...errorMessages].forEach(message => {
            const relativePath = path.relative(ROOT_DIR, message.filePath);
            const location = `${relativePath}:${message.line ?? 0}:${message.column ?? 0}`;
            console.error(`  ${location} ${message.message} (${message.ruleId ?? 'parse-error'})`);
        });
    }

    process.exitCode =
        errorMessages.length > 0 || fatalMessages.length > 0 || warningBaselineExceeded ? 1 : 0;
};

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});

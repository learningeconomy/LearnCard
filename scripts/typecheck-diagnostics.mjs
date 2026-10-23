#!/usr/bin/env node
// Advisory base/head diagnostics for the count ratchet. This never changes its verdict.
// Prepare both checkouts as CI does (frozen dependencies, built libraries, generated messages):
//   node scripts/typecheck-ratchet.mjs --report=/tmp/head.json
//   node /path/to/head/scripts/typecheck-diagnostics.mjs base /tmp/head.json /prepared/base /tmp/base.json
//   node scripts/typecheck-diagnostics.mjs render /tmp/head.json /tmp/base.json
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const slash = value => value.replaceAll('\\', '/');
const within = file => !isAbsolute(file) && file !== '..' && !file.startsWith('../');
const normalizeMessage = (message, root) => slash(message).replaceAll(slash(root), '<repo>');

export const parseDiagnostic = (text, root) => {
    const located = /^(.*?)\((\d+),(\d+)\): error (TS\d+): (.*)$/.exec(text);
    const plain = /^error (TS\d+): (.*)$/.exec(text);
    if (!located && !plain)
        return {
            file: null,
            line: null,
            column: null,
            code: '',
            message: normalizeMessage(text, root),
        };
    return {
        file: located ? slash(relative(root, resolve(root, located[1]))) : null,
        line: located ? Number(located[2]) : null,
        column: located ? Number(located[3]) : null,
        code: located?.[4] ?? plain[1],
        message: normalizeMessage(located?.[5] ?? plain[2], root),
    };
};

export const createDiagnosticReport = (results, baseline, root) => {
    root = resolve(root);
    const files = new Map();
    const git = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
    return {
        schemaVersion: 1,
        revision: git.status === 0 ? git.stdout.trim() : null,
        root,
        results: results.map(result => ({
            ...result,
            allowance: baseline[result.name] ?? 0,
            raised: !result.incomplete && result.count > (baseline[result.name] ?? 0),
            diagnostics: result.errors.map(error => {
                const diagnostic = parseDiagnostic(error, root);
                if (diagnostic.file && within(diagnostic.file)) {
                    if (!files.has(diagnostic.file)) {
                        try {
                            files.set(
                                diagnostic.file,
                                readFileSync(resolve(root, diagnostic.file), 'utf8').split(/\r?\n/)
                            );
                        } catch {
                            files.set(diagnostic.file, []);
                        }
                    }
                    diagnostic.sourceLine = files
                        .get(diagnostic.file)
                        [diagnostic.line - 1]?.trim()
                        .replace(/\s+/g, ' ')
                        .slice(0, 500);
                }
                return diagnostic;
            }),
        })),
    };
};

const identity = d => JSON.stringify([d.file, d.code, d.message]);

/** Ignore position-only shifts; use source text to disambiguate repeated same-message errors. */
export const addedDiagnostics = (head, base) => {
    const groups = new Map();
    for (const diagnostic of base) {
        const key = identity(diagnostic);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(diagnostic);
    }
    const pending = [];
    for (const diagnostic of head) {
        const candidates = groups.get(identity(diagnostic)) ?? [];
        const match =
            diagnostic.sourceLine === undefined
                ? -1
                : candidates.findIndex(d => d.sourceLine === diagnostic.sourceLine);
        if (match >= 0) candidates.splice(match, 1);
        else pending.push(diagnostic);
    }
    return pending.filter(diagnostic => {
        const candidates = groups.get(identity(diagnostic)) ?? [];
        if (!candidates.length) return true;
        candidates.pop();
        return false;
    });
};

export const compareReports = (head, base) =>
    head.results
        .filter(r => r.raised)
        .map(current => {
            const previous = base?.results.find(r => r.name === current.name);
            const reason = !previous
                ? 'No completed base report for this project.'
                : previous.incomplete
                  ? `Base typecheck did not finish: ${previous.incomplete}`
                  : previous.configErrors || current.configErrors
                    ? 'Compiler configuration errors prevented complete semantic checking.'
                    : null;
            return {
                name: current.name,
                count: current.count,
                allowance: current.allowance,
                baseCount: previous?.count ?? null,
                unavailable: reason,
                added: reason ? null : addedDiagnostics(current.diagnostics, previous.diagnostics),
            };
        });

const escapeData = text =>
    String(text).replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
const escapeProperty = text => escapeData(text).replaceAll(',', '%2C').replaceAll(':', '%3A');
const md = text =>
    String(text)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('|', '&#124;')
        .replaceAll('`', '&#96;')
        .replaceAll('\n', ' ');

export const formatComparison = comparisons => {
    const lines = [
        '## TypeScript diagnostics compared with the PR base',
        '',
        'The saved count allowance still controls pass/fail. This comparison is advisory; position-only shifts are ignored. Changes in source, compiler configuration or dependencies may produce diagnostics outside edited files.',
        '',
    ];
    const annotations = [];
    for (const project of comparisons) {
        lines.push(
            `### ${md(project.name)}`,
            '',
            `Head: **${project.count}** · allowance: **${project.allowance}** · base: **${project.baseCount ?? 'unavailable'}**`,
            ''
        );
        if (project.unavailable) {
            lines.push(
                `**Comparison unavailable:** ${md(project.unavailable)} No claim about newly introduced diagnostics can be made. The original ratchet failure remains.`,
                ''
            );
            continue;
        }
        lines.push(
            `**${project.added.length} added diagnostic(s)**; ${project.count - project.added.length} match base diagnostics.`,
            ''
        );
        if (!project.added.length)
            lines.push(
                'No added diagnostics were identified. Check whether the base already exceeds the allowance or preparation/toolchain state differs.',
                ''
            );
        for (const d of project.added.slice(0, 50)) {
            lines.push(
                `- \`${md(d.file ?? '(configuration)')}${d.line ? `:${d.line}:${d.column}` : ''}\` — **${d.code}**: ${md(d.message)}`
            );
            if (d.file && within(d.file) && d.line)
                annotations.push(
                    `::error file=${escapeProperty(d.file)},line=${d.line},col=${d.column},title=${escapeProperty(`Added ${d.code} (${project.name})`)}::${escapeData(d.message)}`
                );
        }
        if (project.added.length > 50)
            lines.push(
                `Showing 50 of ${project.added.length}; the uploaded diagnostic reports contain every entry.`
            );
        lines.push('');
    }
    return { markdown: lines.join('\n'), annotations };
};

const readReport = file => {
    const report = JSON.parse(readFileSync(file, 'utf8'));
    if (
        report.schemaVersion !== 1 ||
        typeof report.root !== 'string' ||
        !Array.isArray(report.results) ||
        report.results.some(
            r =>
                typeof r.name !== 'string' ||
                typeof r.raised !== 'boolean' ||
                !Array.isArray(r.errors) ||
                !Array.isArray(r.diagnostics) ||
                r.errors.length !== r.diagnostics.length ||
                (!r.incomplete && r.count !== r.diagnostics.length) ||
                r.diagnostics.some(d => typeof d.message !== 'string' || typeof d.code !== 'string')
        )
    )
        throw new Error('Unsupported or incomplete diagnostic report');
    return report;
};

const main = async () => {
    const [mode, headFile, baseDirectoryOrReport, outputFile] = process.argv.slice(2);
    if (mode === '--help') {
        console.log(
            'Usage: typecheck-diagnostics.mjs select HEAD_REPORT | base HEAD_REPORT PREPARED_BASE_DIR OUTPUT_REPORT | render HEAD_REPORT BASE_REPORT'
        );
        return;
    }
    const head = readReport(headFile);
    const names = head.results.filter(r => r.raised).map(r => r.name);
    if (mode === 'select') {
        if (process.env.GITHUB_OUTPUT)
            appendFileSync(process.env.GITHUB_OUTPUT, `needed=${names.length > 0}\n`);
        console.log(`${names.length} project(s) above allowance: ${names.join(', ')}`);
    } else if (mode === 'base') {
        const destination = resolve(outputFile);
        // Run the current ratchet implementation against the prepared base's own source,
        // configs and dependencies. Older base revisions need not support JSON reporting.
        const { nxProjects, toProjects, checkProject } = await import('./typecheck-ratchet.mjs');
        process.chdir(resolve(baseDirectoryOrReport));
        const projects = toProjects('.', nxProjects('.')).filter(p => names.includes(p.name));
        const results = [];
        for (const project of projects) results.push(await checkProject(project));
        const report = createDiagnosticReport(results, {}, '.');
        writeFileSync(destination, JSON.stringify(report, null, 2) + '\n');
        console.log(`Compared ${results.length} project(s) at base ${report.revision}`);
        if (results.some(r => r.incomplete)) process.exitCode = 1;
    } else if (mode === 'render') {
        let base;
        try {
            base = readReport(baseDirectoryOrReport);
        } catch (error) {
            console.log(`Base comparison unavailable: ${error.message}`);
        }
        const { markdown, annotations } = formatComparison(compareReports(head, base));
        console.log(markdown);
        if (process.env.GITHUB_STEP_SUMMARY)
            appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + '\n');
        if (process.env.GITHUB_ACTIONS === 'true')
            for (const annotation of annotations) console.log(annotation);
    } else throw new Error('Unknown mode; use --help');
};
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });

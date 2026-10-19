#!/usr/bin/env bun
import { S3Client } from 'bun';
import { existsSync } from 'node:fs';
import {
    copyFile,
    lstat,
    mkdir,
    mkdtemp,
    readFile,
    readdir,
    realpath,
    rm,
    writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, join, parse, relative, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

const START = '<!-- proof:start -->';
const END = '<!-- proof:end -->';
const MAX_BYTES = 50_000_000;
const MEDIA_DISABLED =
    'Screenshots/videos: not attached from this machine; the LearnCard Verification CI run attaches them when the PR is ready for review.';
const uploadConfigured = (): boolean =>
    Object.keys(process.env).some(key => /^(PROOF_S3_|PROOF_AWS_)/.test(key));
const CONTENT_TYPES: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.webm': 'video/webm',
    '.mp4': 'video/mp4',
};

interface Result {
    feature: string;
    status: string;
    requiredEntries: string[];
    entries?: string[];
    startedAt?: string;
    finishedAt?: string;
    error?: string;
    evidenceError?: string;
    cleanupError?: string;
    durationMs?: number;
    hasError?: boolean;
}

interface Report {
    status: string;
    results: Result[];
    notRun: string[];
    notSelected: string[];
    script: boolean;
}

interface Media {
    path: string;
    feature: string;
    type: string;
}

interface Upload extends Media {
    key: string;
    url: string;
}

const object = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Invalid report.json object; use the evidence directory from lc verify.');
    }
    return value as Record<string, unknown>;
};

const strings = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every(item => typeof item === 'string');

export const parseReport = (value: unknown): Report => {
    const raw = object(value);
    const script = typeof raw.script === 'string' || raw.script === true;
    const rows =
        typeof raw.script === 'string'
            ? [{ ...raw, feature: 'script', requiredEntries: [] }]
            : raw.results;
    if (
        typeof raw.status !== 'string' ||
        !['passed', 'failed', 'interrupted', 'running'].includes(raw.status) ||
        !Array.isArray(rows)
    ) {
        throw new Error(
            'Invalid report.json: expected status and results; point --from-run at a run or script directory, not the stack directory.'
        );
    }
    const results = rows.map(row => {
        const entry = object(row);
        if (
            typeof entry.feature !== 'string' ||
            !/^[a-zA-Z0-9_-]+$/.test(entry.feature) ||
            !['passed', 'failed', 'interrupted', 'running'].includes(String(entry.status)) ||
            !strings(entry.requiredEntries) ||
            (entry.entries !== undefined && !strings(entry.entries)) ||
            (entry.durationMs !== undefined &&
                (typeof entry.durationMs !== 'number' ||
                    !Number.isFinite(entry.durationMs) ||
                    entry.durationMs < 0)) ||
            (entry.hasError !== undefined && typeof entry.hasError !== 'boolean') ||
            ['startedAt', 'finishedAt', 'error', 'evidenceError', 'cleanupError'].some(
                key => entry[key] !== undefined && typeof entry[key] !== 'string'
            )
        ) {
            throw new Error(
                'Invalid feature result in report.json; rerun lc verify to produce a complete report.'
            );
        }
        return entry as unknown as Result;
    });
    if (new Set(results.map(row => row.feature)).size !== results.length) {
        throw new Error('Duplicate features in report.json; use an unmodified lc verify report.');
    }
    for (const key of ['notRun', 'notSelected']) {
        if (
            raw[key] !== undefined &&
            (!strings(raw[key]) || !raw[key].every(item => /^[a-zA-Z0-9_-]+$/.test(item)))
        ) {
            throw new Error(`Invalid ${key} in report.json; use an unmodified lc verify report.`);
        }
    }
    return {
        status: raw.status,
        results,
        notRun: strings(raw.notRun) ? raw.notRun : [],
        notSelected: strings(raw.notSelected) ? raw.notSelected : [],
        script,
    };
};

export const allowedMedia = (path: string): boolean => {
    // Sessions contain private seeds. Check both lexical and resolved paths, even for media.
    const parts = path.toLowerCase().split(/[\\/]/);
    return (
        !parts.includes('sessions') &&
        !parts.some(part => part === '.env' || part.startsWith('.env.')) &&
        Boolean(CONTENT_TYPES[extname(path).toLowerCase()])
    );
};

const hasSymlink = async (path: string): Promise<boolean> => {
    const absolute = resolve(path);
    let current = parse(absolute).root;
    for (const part of absolute.slice(current.length).split(sep)) {
        current = join(current, part);
        if (!(await lstat(current)).isSymbolicLink()) continue;
        // macOS exposes its OS-owned temporary directories through these fixed aliases.
        if (
            process.platform === 'darwin' &&
            ['/tmp', '/var'].includes(current) &&
            (await realpath(current)) === `/private${current}`
        )
            continue;
        return true;
    }
    return false;
};

const safeMedia = async (path: string, warnings: string[]): Promise<string | undefined> => {
    if (!allowedMedia(path)) {
        warnings.push(`Skipped excluded file: ${path}`);
        return;
    }
    if (await hasSymlink(path)) {
        warnings.push(`Skipped symlink path: ${path}`);
        return;
    }
    const canonical = await realpath(path);
    const info = await lstat(path);
    if (!allowedMedia(canonical) || !info.isFile()) {
        warnings.push(`Skipped unsafe path (sessions, symlink, or non-file): ${path}`);
        return;
    }
    if (info.size > MAX_BYTES) {
        warnings.push(`Skipped file over 50 MB: ${path}. Trim or compress it and publish again.`);
        return;
    }
    return canonical;
};

export const selectFeatureMedia = (paths: string[]): string[] => {
    const images = paths.filter(
        path =>
            allowedMedia(path) && CONTENT_TYPES[extname(path).toLowerCase()]?.startsWith('image/')
    );
    const ordered = images.sort((a, b) =>
        basename(a).localeCompare(basename(b), 'en', { numeric: true })
    );
    const after = ordered.filter(path => /(?:after|final)(?:-|\.)/i.test(basename(path)));
    const final = after.at(-1) ?? ordered.at(-1);
    return [
        ...new Set([
            ...(final ? [final] : []),
            ...ordered.filter(path => /(?:failure|interrupted)(?:-|\.)/i.test(basename(path))),
            ...paths.filter(path => allowedMedia(path) && extname(path).toLowerCase() === '.webm'),
        ]),
    ];
};

export const collectMedia = async (
    files: string[],
    run?: string
): Promise<{
    media: Media[];
    report?: Report;
    warnings: string[];
}> => {
    const warnings: string[] = [];
    const media: Media[] = [];
    const add = async (path: string, feature: string): Promise<void> => {
        const canonical = await safeMedia(path, warnings);
        if (canonical && !media.some(item => item.path === canonical)) {
            media.push({
                path: canonical,
                feature,
                type: CONTENT_TYPES[extname(canonical).toLowerCase()]!,
            });
        }
    };
    let report: Report | undefined;
    if (run) {
        if (await hasSymlink(run))
            throw new Error(
                'Run directory contains a symlink. Use the original evidence directory, outside sessions/.'
            );
        const root = await realpath(run);
        if (
            root.toLowerCase().split(sep).includes('sessions') ||
            resolve(run).toLowerCase().split(sep).includes('sessions')
        ) {
            throw new Error(
                'Do not publish sessions. Use a runs/<runId> or scripts/<runId-name> evidence directory.'
            );
        }
        const reportPath = join(root, 'report.json');
        if (await hasSymlink(reportPath)) throw new Error('Report must not be a symlink.');
        report = parseReport(JSON.parse(await readFile(reportPath, 'utf8')));
        for (const result of report.results) {
            const directory = report.script ? root : join(root, result.feature);
            if (!existsSync(directory)) {
                warnings.push(
                    `No media directory for ${result.feature}; result retained without images.`
                );
                continue;
            }
            if ((await lstat(directory)).isSymbolicLink()) {
                warnings.push(`Skipped symlink feature directory: ${directory}`);
                continue;
            }
            const candidates: string[] = [];
            for (const entry of await readdir(directory, { withFileTypes: true })) {
                const path = join(directory, entry.name);
                if (entry.isFile()) candidates.push(path);
                else if (entry.isDirectory() && /^\d+-.+-video$/.test(entry.name)) {
                    for (const video of await readdir(path, { withFileTypes: true })) {
                        if (video.isFile()) candidates.push(join(path, video.name));
                    }
                }
            }
            for (const path of selectFeatureMedia(candidates)) await add(path, result.feature);
        }
    }
    for (const file of files) await add(resolve(file), 'files');
    return { media, report, warnings };
};

export const buildKey = (pr: string, sha: string, feature: string, filename: string): string => {
    if (
        !/^[1-9]\d*$/.test(pr) ||
        !/^[a-f0-9]+$/i.test(sha) ||
        !/^[\w-]+$/.test(feature) ||
        !filename ||
        filename !== basename(filename) ||
        /[\\\r\n]/.test(filename)
    ) {
        throw new Error(
            'Invalid proof key; use a positive PR number, Git head SHA, feature ID, and plain filename.'
        );
    }
    return `pr-${pr}/${sha}/${feature}/${filename}`;
};

const durationOf = (result: Result): number =>
    result.durationMs ?? Date.parse(result.finishedAt ?? '') - Date.parse(result.startedAt ?? '');
const errorRecorded = (result: Result): boolean =>
    Boolean(result.hasError || result.error || result.evidenceError || result.cleanupError);

export const stage = async (run: string, out: string): Promise<void> => {
    const { media, report } = await collectMedia([], run);
    if (!report) throw new Error('Staging requires a report.');
    const root = await realpath(run);
    let destination = resolve(out);
    if (destination === root || destination.startsWith(root + sep) || existsSync(destination))
        throw new Error('Stage --out must be a new directory outside the run.');
    await mkdir(dirname(destination), { recursive: true });
    if (await hasSymlink(dirname(destination))) throw new Error('Stage output contains a symlink.');
    destination = join(await realpath(dirname(destination)), basename(destination));
    if (destination === root || destination.startsWith(root + sep))
        throw new Error('Stage --out must be a new directory outside the run.');
    await mkdir(destination, { mode: 0o700 });
    try {
        for (const item of media) {
            const target = join(destination, relative(root, item.path));
            if (!(await safeMedia(item.path, [])))
                throw new Error('Evidence changed during staging.');
            await mkdir(dirname(target), { recursive: true, mode: 0o700 });
            await copyFile(item.path, target);
        }
        const sanitized = {
            status: report.status,
            script: report.script,
            results: report.results.map(result => ({
                feature: result.feature,
                status: result.status,
                requiredEntries: result.requiredEntries.map((_, index) => `entry-${index + 1}`),
                entries: result.entries?.map((_, index) => `entry-${index + 1}`),
                durationMs:
                    Number.isFinite(durationOf(result)) && durationOf(result) >= 0
                        ? durationOf(result)
                        : undefined,
                hasError: errorRecorded(result),
            })),
            notRun: report.notRun,
            notSelected: report.notSelected,
        };
        await writeFile(
            join(destination, 'report.json'),
            JSON.stringify(sanitized, null, 2) + '\n',
            { mode: 0o600 }
        );
    } catch (error) {
        await rm(destination, { recursive: true, force: true });
        throw error;
    }
};

const text = (value: string): string =>
    value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replace(/[\\`*_[\]#|]/g, char => `&#${char.charCodeAt(0)};`)
        .replace(/\r?\n/g, ' ');

export const renderProof = (options: {
    sha: string;
    timestamp: string;
    uploads: Upload[];
    report?: Report;
    note?: string;
    notVerified?: string;
    mediaDisabled?: boolean;
}): string => {
    const { sha, timestamp, uploads, report, note, notVerified } = options;
    const lines = [
        START,
        `### Proof — head ${text(sha)} · ${text(timestamp)}`,
        '',
        'Head at publication time; lc verify reports do not record the tested commit. Confirm the run matches this head.',
        '',
    ];
    if (report) {
        lines.push(
            `Run result: **${text(report.status)}**`,
            '',
            '| Feature | Result | Entries | Duration |',
            '| --- | --- | --- | --- |'
        );
        for (const result of report.results) {
            const duration = durationOf(result);
            const entries = result.entries
                ? `${result.entries.length}/${result.requiredEntries.length}`
                : `unknown/${result.requiredEntries.length}`;
            lines.push(
                `| ${text(result.feature)} | ${text(result.status)} | ${report.script ? 'not cataloged' : entries} | ${Number.isFinite(duration) && duration >= 0 ? `${(duration / 1000).toFixed(1)}s` : 'unknown'} |`
            );
            // Raw error strings may contain seeds or bearer URLs; keep them local like the report.
            if (errorRecorded(result)) {
                lines.push(
                    `| ${text(result.feature)} details | Error recorded locally; inspect report.json | — | — |`
                );
            }
        }
        if (report.notRun.length) lines.push('', `Not run: ${report.notRun.map(text).join(', ')}`);
        if (report.notSelected.length)
            lines.push('', `Not selected: ${report.notSelected.map(text).join(', ')}`);
    } else
        lines.push(
            'No lc verify report supplied; attached media alone does not establish a passing result.'
        );
    for (const upload of uploads) {
        lines.push(
            '',
            upload.type.startsWith('image/')
                ? `![${text(upload.feature)}](<${upload.url}>)`
                : `[${text(upload.feature)} video — ${text(basename(upload.path))}](<${upload.url}>)`
        );
    }
    if (options.mediaDisabled) lines.push('', MEDIA_DISABLED);
    if (note) lines.push('', `Note: ${text(note)}`);
    if (notVerified !== undefined)
        lines.push(
            '',
            `Not verified: ${text(notVerified) || 'Describe remaining gaps before review.'}`
        );
    lines.push('', END);
    return lines.join('\n');
};

const markerLines = (lines: string[], marker: string): number[] =>
    lines.flatMap((line, index) => (line.trim() === marker ? [index] : []));

// Markers count only on their own line, so prose or code that mentions them is left alone.
export const replaceProof = (body: string, block: string): string => {
    const lines = body.split('\n');
    const starts = markerLines(lines, START);
    const ends = markerLines(lines, END);
    if (starts.length === 0 && ends.length === 0)
        return `${body.trimEnd()}${body.trim() ? '\n\n' : ''}${block}\n`;
    if (starts.length !== 1 || ends.length !== 1 || ends[0]! < starts[0]!) {
        throw new Error(
            'PR has malformed or duplicate proof markers. Keep exactly one ordered proof:start/proof:end pair, each on its own line, and retry.'
        );
    }
    return [...lines.slice(0, starts[0]), block, ...lines.slice(ends[0]! + 1)].join('\n');
};

const command = (args: string[], remedy: string, trim = true): string => {
    const result = Bun.spawnSync(args, {
        stdout: 'pipe',
        stderr: 'pipe',
        env: { ...process.env, GIT_MASTER: '1' },
    });
    if (result.exitCode !== 0) throw new Error(`${args.slice(0, 3).join(' ')} failed. ${remedy}`);
    const output = result.stdout.toString();
    return trim ? output.trim() : output;
};

const readPrBody = (pr: string): string => {
    const response = object(
        JSON.parse(
            command(
                ['gh', 'pr', 'view', pr, '--json', 'body'],
                'Run gh auth login and check the PR number.',
                false
            )
        )
    );
    if (typeof response.body !== 'string')
        throw new Error('GitHub did not return a PR body. Check gh authentication and retry.');
    return response.body;
};

const checkRepo = (): void => {
    const root = command(
        ['git', 'rev-parse', '--show-toplevel'],
        'Run from the LearnCard repository root.'
    );
    if (
        resolve(root) !== resolve(process.cwd()) ||
        !existsSync('apps/learn-card-app/scripts/verification/cli.ts')
    ) {
        throw new Error(
            'Run from the LearnCard repository root (the worktree you intend to publish).'
        );
    }
};

const configuration = (dryRun: boolean): { bucket: string; region: string; base: string } => {
    const bucket = process.env.PROOF_S3_BUCKET || (dryRun ? 'proof-bucket-placeholder' : '');
    const region = process.env.PROOF_S3_REGION || (dryRun ? 'us-east-1' : '');
    if (!bucket || !region)
        throw new Error(
            'Set PROOF_S3_BUCKET and PROOF_S3_REGION; use --dry-run to preview without credentials.'
        );
    if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(bucket) || !/^[a-z0-9-]+$/.test(region)) {
        throw new Error(
            'Invalid S3 bucket or region. Set PROOF_S3_BUCKET to a DNS bucket name and PROOF_S3_REGION to its AWS region.'
        );
    }
    const base =
        process.env.PROOF_PUBLIC_BASE_URL || `https://${bucket}.s3.${region}.amazonaws.com`;
    const url = new URL(base);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
        throw new Error(
            'Set PROOF_PUBLIC_BASE_URL to a public HTTPS base URL without credentials, query, or fragment.'
        );
    }
    return { bucket, region, base: url.href.replace(/\/$/, '') };
};

const checkCredentials = (): void => {
    const missing = ['PROOF_AWS_ACCESS_KEY_ID', 'PROOF_AWS_SECRET_ACCESS_KEY'].filter(
        key => !process.env[key]
    );
    if (missing.length)
        throw new Error(
            `Set ${missing.join(' and ')} (temporary credentials also require PROOF_AWS_SESSION_TOKEN; a token alone is insufficient). Use --dry-run until credentials are injected.`
        );
};

const help = (subcommand: string): string => `LearnCard proof publisher (Bun 1.4.x, repository root)

Usage: bun scripts/proof.ts ${subcommand === 'doctor' ? 'doctor [--json]' : subcommand === 'publish' ? 'publish --pr <n> [--from-run <dir>] [files...] [options]' : '<doctor|publish|stage> [options]'}

doctor   Check cwd, S3 configuration/credentials, and gh auth status (no upload).
publish  Publish only .png .jpg .jpeg .gif .webp .webm .mp4, at most 50 MB each.
stage    --from-run <dir> --out <new directory> [--json]: selected media and sanitized report only.

Publish options:
  --pr <n>              Required positive PR number; keys: pr-<n>/<short HEAD>/<feature|files>/<filename>
  --head-sha <sha>      Override head label/key with a 7–40 character hex SHA (first 9 characters).
  --from-run <dir>      Read report.json locally from runs/<runId> or scripts/<runId-name>.
                        Select final/after screenshot, failure/interruption screenshots, WebM videos.
  files...             Additional media files; no directory recursion. Use -- before dash-prefixed paths.
  --note <text>         Add a plain-text note to the generated Proof section.
  --not-verified <text> Explicit remaining coverage gaps (empty string adds a placeholder).
  --update-pr          Replace/append marked proof via gh pr view/edit --body-file.
  --dry-run            NO network, uploads, or PR edits, even with --update-pr.
                        Print local path -> key and would-be URLs; missing S3 env uses labeled placeholders.
  --json               One JSON object (markdown included); errors also JSON, exit nonzero.
  --help, -h           Show this help; no environment or network required.

Environment: PROOF_S3_BUCKET, PROOF_S3_REGION, PROOF_AWS_ACCESS_KEY_ID, PROOF_AWS_SECRET_ACCESS_KEY;
PROOF_AWS_SESSION_TOKEN additionally for temporary credentials. PROOF_PUBLIC_BASE_URL optionally overrides
https://<bucket>.s3.<region>.amazonaws.com. Bucket policy must allow public reads (no object ACLs set).
Reports, sessions/, traces, JSON, logs, .env files and symlinks are never uploaded.
With no PROOF_S3_* or PROOF_AWS_* configuration, publish writes table-only proof; CI attaches media.
Inspect screenshots/videos for sensitive content before publishing; public URLs expire with bucket lifecycle.
Raw report errors stay local because they may contain secrets. A report is not cryptographically bound to HEAD.

Examples:
  bun scripts/proof.ts doctor --json
  bun scripts/proof.ts publish --pr 1741 --from-run /tmp/lcv/runs/<runId> --dry-run
  bun scripts/proof.ts publish --pr 1741 screenshot.png --note 'Manual check' --update-pr
`;

export const main = async (args: string[]): Promise<void> => {
    const { values, positionals } = parseArgs({
        args,
        allowPositionals: true,
        strict: true,
        options: {
            pr: { type: 'string' },
            'from-run': { type: 'string' },
            out: { type: 'string' },
            'head-sha': { type: 'string' },
            note: { type: 'string' },
            'not-verified': { type: 'string' },
            'update-pr': { type: 'boolean' },
            'dry-run': { type: 'boolean' },
            json: { type: 'boolean' },
            help: { type: 'boolean', short: 'h' },
        },
    });
    const [subcommand = 'help', ...files] = positionals;
    if (values.help || subcommand === 'help') {
        console.log(values.json ? JSON.stringify({ help: help(subcommand) }) : help(subcommand));
        return;
    }
    if (subcommand === 'doctor') {
        if (files.length || Object.keys(values).some(key => key !== 'json'))
            throw new Error('doctor accepts only --json or --help. Use publish for media.');
        const checks: Array<{ check: string; ok: boolean; message: string }> = [];
        for (const [name, check] of [
            ['repository', checkRepo],
            [
                'S3 configuration',
                () => {
                    if (uploadConfigured()) {
                        configuration(false);
                        checkCredentials();
                    }
                },
            ],
            [
                'GitHub auth',
                () => {
                    command(['gh', 'auth', 'status'], 'Install gh and run gh auth login.');
                },
            ],
        ] as const) {
            try {
                check();
                checks.push({
                    check: name,
                    ok: true,
                    message:
                        name === 'S3 configuration' && !uploadConfigured()
                            ? 'WARNING: media upload disabled; CI will attach media'
                            : 'OK',
                });
            } catch (error) {
                checks.push({
                    check: name,
                    ok: false,
                    message: error instanceof Error ? error.message : String(error),
                });
            }
        }
        const ok = checks.every(check => check.ok);
        console.log(
            values.json
                ? JSON.stringify({ ok, checks })
                : checks
                      .map(check => `${check.ok ? 'OK' : 'FAIL'} ${check.check}: ${check.message}`)
                      .join('\n')
        );
        if (!ok) process.exitCode = 1;
        return;
    }
    if (subcommand === 'stage') {
        if (
            !values['from-run'] ||
            !values.out ||
            files.length ||
            Object.keys(values).some(key => !['from-run', 'out', 'json'].includes(key))
        )
            throw new Error('stage requires --from-run <dir> --out <new directory> [--json].');
        await stage(values['from-run'], values.out);
        console.log(
            values.json
                ? JSON.stringify({ ok: true, out: resolve(values.out) })
                : `Staged proof: ${resolve(values.out)}`
        );
        return;
    }
    if (subcommand !== 'publish')
        throw new Error('Unknown command. Use bun scripts/proof.ts --help.');
    if (!values.pr || !/^[1-9]\d*$/.test(values.pr))
        throw new Error(
            'publish requires --pr <positive number>. Use an existing draft PR number.'
        );
    if (!files.length && !values['from-run'])
        throw new Error(
            'Supply --from-run <evidence directory> and/or media files. Run lc verify first.'
        );
    checkRepo();
    if (values['head-sha'] !== undefined && !/^[a-f0-9]{7,40}$/i.test(values['head-sha']))
        throw new Error('--head-sha must be 7–40 hexadecimal characters.');
    const sha =
        values['head-sha']?.slice(0, 9) ??
        command(
            ['git', 'rev-parse', '--short=9', 'HEAD'],
            'Commit your work in this worktree first.'
        );
    const dryRun = Boolean(values['dry-run']);
    const mediaDisabled = !dryRun && !uploadConfigured();
    const config = mediaDisabled ? undefined : configuration(dryRun);
    if (!dryRun && config) checkCredentials();
    const { media, report, warnings } = await collectMedia(files, values['from-run']);
    if (mediaDisabled)
        warnings.push('Media upload disabled; CI will attach media. ' + MEDIA_DISABLED);
    if (dryRun && (!process.env.PROOF_S3_BUCKET || !process.env.PROOF_S3_REGION))
        warnings.push(
            'S3 env missing: preview uses placeholder bucket/region, not a real upload destination.'
        );
    if (!media.length && !report)
        throw new Error(
            'No publishable media remains. Supply allowlisted files outside sessions/, each at most 50 MB.'
        );
    const uploads = config
        ? media.map(item => {
              const key = buildKey(values.pr!, sha, item.feature, basename(item.path));
              return {
                  ...item,
                  key,
                  url: `${config.base}/${key
                      .split('/')
                      .map(part =>
                          encodeURIComponent(part).replace(
                              /[!'()*]/g,
                              char => `%${char.charCodeAt(0).toString(16)}`
                          )
                      )
                      .join('/')}`,
              };
          })
        : [];
    if (new Set(uploads.map(item => item.key)).size !== uploads.length)
        throw new Error(
            'Media filenames collide within a feature. Rename the duplicate files before publishing; no uploads performed.'
        );
    const markdown = renderProof({
        sha,
        timestamp: new Date().toISOString(),
        uploads,
        report,
        note: values.note,
        notVerified: values['not-verified'],
        mediaDisabled,
    });
    if (!dryRun) {
        if (values['update-pr']) {
            replaceProof(readPrBody(values.pr), markdown);
        }
        const client = config
            ? new S3Client({
                  bucket: config.bucket,
                  region: config.region,
                  endpoint: `https://s3.${config.region}.amazonaws.com`,
                  accessKeyId: process.env.PROOF_AWS_ACCESS_KEY_ID,
                  secretAccessKey: process.env.PROOF_AWS_SECRET_ACCESS_KEY,
                  sessionToken: process.env.PROOF_AWS_SESSION_TOKEN ?? '',
              })
            : undefined;
        for (const upload of uploads) {
            if (!(await safeMedia(upload.path, warnings)))
                throw new Error(
                    'Evidence changed during publishing. Stop editing it and rerun publish.'
                );
            try {
                await client!.write(upload.key, Bun.file(upload.path), { type: upload.type });
            } catch {
                throw new Error(
                    `Upload failed for ${basename(upload.path)}. Check S3 credentials, bucket region and PutObject permissions; rerun publish. PR was not updated.`
                );
            }
        }
        if (values['update-pr']) {
            let body: string;
            try {
                body = replaceProof(readPrBody(values.pr), markdown);
            } catch {
                throw new Error(
                    'Uploads retained, but the latest PR body could not be merged. Check gh auth and keep exactly one ordered proof marker pair, then rerun publish.'
                );
            }
            const directory = await mkdtemp(join(tmpdir(), 'learncard-proof-'));
            try {
                const file = join(directory, 'body.md');
                await writeFile(file, body, { mode: 0o600 });
                command(
                    ['gh', 'pr', 'edit', values.pr, '--body-file', file],
                    'Uploads are retained. Check gh authentication/PR permissions and rerun publish.'
                );
            } finally {
                await rm(directory, { recursive: true, force: true });
            }
        }
    }
    if (values.json)
        console.log(
            JSON.stringify({
                ok: true,
                dryRun,
                sha,
                uploads,
                warnings,
                markdown,
                updatedPr: !dryRun && Boolean(values['update-pr']),
            })
        );
    else {
        for (const warning of warnings) console.error(`Warning: ${warning}`);
        if (dryRun) for (const upload of uploads) console.log(`${upload.path} -> ${upload.key}`);
        console.log(markdown);
    }
};

if (import.meta.main) {
    main(process.argv.slice(2)).catch(error => {
        const message = `${error instanceof Error ? error.message : String(error)} See bun scripts/proof.ts --help for usage.`;
        if (process.argv.includes('--json'))
            console.log(JSON.stringify({ ok: false, error: message }));
        else console.error(`proof: ${message}`);
        process.exitCode = 1;
    });
}

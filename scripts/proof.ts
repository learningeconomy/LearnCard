#!/usr/bin/env bun
import { S3Client } from 'bun';
import { existsSync } from 'node:fs';
import { lstat, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, extname, join, parse, resolve, sep } from 'node:path';
import { parseArgs } from 'node:util';

const START = '<!-- proof:start -->';
const END = '<!-- proof:end -->';
const MAX_BYTES = 50_000_000;
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
    const script = typeof raw.script === 'string';
    const rows = script ? [{ ...raw, feature: 'script', requiredEntries: [] }] : raw.results;
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
        if (raw[key] !== undefined && !strings(raw[key])) {
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
        report = parseReport(JSON.parse(await readFile(join(root, 'report.json'), 'utf8')));
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
            const duration =
                Date.parse(result.finishedAt ?? '') - Date.parse(result.startedAt ?? '');
            const entries = result.entries
                ? `${result.entries.length}/${result.requiredEntries.length}`
                : `unknown/${result.requiredEntries.length}`;
            lines.push(
                `| ${text(result.feature)} | ${text(result.status)} | ${report.script ? 'not cataloged' : entries} | ${Number.isFinite(duration) && duration >= 0 ? `${(duration / 1000).toFixed(1)}s` : 'unknown'} |`
            );
            // Raw error strings may contain seeds or bearer URLs; keep them local like the report.
            if (result.error || result.evidenceError || result.cleanupError) {
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
    if (note) lines.push('', `Note: ${text(note)}`);
    if (notVerified !== undefined)
        lines.push(
            '',
            `Not verified: ${text(notVerified) || 'Describe remaining gaps before review.'}`
        );
    lines.push('', END);
    return lines.join('\n');
};

export const replaceProof = (body: string, block: string): string => {
    const starts = body.split(START).length - 1;
    const ends = body.split(END).length - 1;
    if (starts === 0 && ends === 0)
        return `${body.trimEnd()}${body.trim() ? '\n\n' : ''}${block}\n`;
    if (starts !== 1 || ends !== 1 || body.indexOf(END) < body.indexOf(START)) {
        throw new Error(
            'PR has malformed or duplicate proof markers. Keep exactly one ordered proof:start/proof:end pair and retry.'
        );
    }
    return body.slice(0, body.indexOf(START)) + block + body.slice(body.indexOf(END) + END.length);
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
    const missing = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'].filter(key => !process.env[key]);
    if (missing.length)
        throw new Error(
            `Set ${missing.join(' and ')} (temporary credentials also require AWS_SESSION_TOKEN; a token alone is insufficient). Use --dry-run until credentials are injected.`
        );
};

const help = (subcommand: string): string => `LearnCard proof publisher (Bun 1.4.x, repository root)

Usage: bun scripts/proof.ts ${subcommand === 'doctor' ? 'doctor [--json]' : subcommand === 'publish' ? 'publish --pr <n> [--from-run <dir>] [files...] [options]' : '<doctor|publish> [options]'}

doctor   Check cwd, S3 configuration/credentials, and gh auth status (no upload).
publish  Publish only .png .jpg .jpeg .gif .webp .webm .mp4, at most 50 MB each.

Publish options:
  --pr <n>              Required positive PR number; keys: pr-<n>/<short HEAD>/<feature|files>/<filename>
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

Environment: PROOF_S3_BUCKET, PROOF_S3_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY;
AWS_SESSION_TOKEN additionally for temporary credentials. PROOF_PUBLIC_BASE_URL optionally overrides
https://<bucket>.s3.<region>.amazonaws.com. Bucket policy must allow public reads (no object ACLs set).
Reports, sessions/, traces, JSON, logs, .env files and symlinks are never uploaded.
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
                    configuration(false);
                },
            ],
            ['AWS credentials', checkCredentials],
            [
                'GitHub auth',
                () => {
                    command(['gh', 'auth', 'status'], 'Install gh and run gh auth login.');
                },
            ],
        ] as const) {
            try {
                check();
                checks.push({ check: name, ok: true, message: 'OK' });
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
    const sha = command(
        ['git', 'rev-parse', '--short', 'HEAD'],
        'Commit your work in this worktree first.'
    );
    const dryRun = Boolean(values['dry-run']);
    const config = configuration(dryRun);
    const { media, report, warnings } = await collectMedia(files, values['from-run']);
    if (dryRun && (!process.env.PROOF_S3_BUCKET || !process.env.PROOF_S3_REGION))
        warnings.push(
            'S3 env missing: preview uses placeholder bucket/region, not a real upload destination.'
        );
    if (!media.length && !report)
        throw new Error(
            'No publishable media remains. Supply allowlisted files outside sessions/, each at most 50 MB.'
        );
    const uploads = media.map(item => {
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
    });
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
    });
    if (!dryRun) {
        checkCredentials();
        if (values['update-pr']) {
            replaceProof(readPrBody(values.pr), markdown);
        }
        const client = new S3Client({
            bucket: config.bucket,
            region: config.region,
            endpoint: `https://s3.${config.region}.amazonaws.com`,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN ?? '',
        });
        for (const upload of uploads) {
            if (!(await safeMedia(upload.path, warnings)))
                throw new Error(
                    'Evidence changed during publishing. Stop editing it and rerun publish.'
                );
            try {
                await client.write(upload.key, Bun.file(upload.path), { type: upload.type });
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

/**
 * `learncard skill install`: write the LearnCard agent skill (docs/snippets/agents/learncard-skill.md,
 * embedded at build time) where coding agents look for it. Purely local: never reads the
 * folder identity and never touches the network.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Command } from 'commander';
import { parse as parseYaml } from 'yaml';

import { AGENT_SKILL_MD } from './generated/snippets';
import { CliError, UsageError } from './errors';
import { out } from './out';
import type { RunCommand } from './doctor';

export type SkillTarget = 'claude' | 'cursor' | 'agents';

export interface SkillTargetInfo {
    /** Directory whose presence in `--dir` marks this agent as in use (auto-detect). */
    marker: string;
    /** File written, relative to `--dir`. */
    file: string;
}

export const SKILL_TARGETS: Record<SkillTarget, SkillTargetInfo> = {
    claude: { marker: '.claude', file: '.claude/skills/learncard/SKILL.md' },
    cursor: { marker: '.cursor', file: '.cursor/rules/learncard.mdc' },
    agents: { marker: '.agents', file: '.agents/skills/learncard/SKILL.md' },
};

const TARGET_NAMES = Object.keys(SKILL_TARGETS) as SkillTarget[];

export interface SkillFrontmatter {
    data: Record<string, unknown>;
    body: string;
}

/** Split a Markdown file into its YAML frontmatter and body. No frontmatter → empty data. */
export const parseFrontmatter = (markdown: string): SkillFrontmatter => {
    const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(markdown);
    if (!match) return { data: {}, body: markdown };
    const data = parseYaml(match[1]!) as unknown;
    return {
        data: data && typeof data === 'object' ? (data as Record<string, unknown>) : {},
        body: markdown.slice(match[0].length),
    };
};

/** A YAML scalar that is safe to write unquoted, else a double-quoted (JSON) string. */
const yamlScalar = (value: string): string =>
    /^[\w(][^\n]*$/.test(value) && !/:\s|\s#|:$/.test(value) ? value : JSON.stringify(value);

/**
 * Convert the skill (Agent Skills frontmatter: name, description) to a Cursor project rule:
 * `description`, empty `globs`, `alwaysApply: false`, so Cursor attaches it when relevant.
 */
export const toCursorRule = (markdown: string): string => {
    const { data, body } = parseFrontmatter(markdown);
    const description = typeof data.description === 'string' ? data.description.trim() : '';
    return [
        '---',
        `description: ${yamlScalar(description)}`,
        'globs:',
        'alwaysApply: false',
        '---',
        body,
    ].join('\n');
};

/** The file content for a target. Claude and Agents use the skill as-is. */
export const renderSkill = (target: SkillTarget, source: string = AGENT_SKILL_MD): string =>
    target === 'cursor' ? toCursorRule(source) : source;

const isDirectory = async (candidate: string): Promise<boolean> => {
    try {
        return (await fs.stat(candidate)).isDirectory();
    } catch {
        return false;
    }
};

/** Targets whose marker directory (.claude, .cursor, .agents) exists in `dir`. */
export const detectTargets = async (dir: string): Promise<SkillTarget[]> => {
    const found = await Promise.all(
        TARGET_NAMES.map(async target =>
            (await isDirectory(path.join(dir, SKILL_TARGETS[target].marker))) ? target : null
        )
    );
    return found.filter((target): target is SkillTarget => target !== null);
};

/** Validate `--target` (claude|cursor|agents|all) before any I/O. Undefined means auto-detect. */
export const parseTarget = (target: string | undefined): SkillTarget[] | undefined => {
    if (target === undefined) return undefined;
    if (target === 'all') return [...TARGET_NAMES];
    if ((TARGET_NAMES as string[]).includes(target)) return [target as SkillTarget];
    throw new UsageError(
        `Unknown --target "${target}". Use one of: ${[...TARGET_NAMES, 'all'].join(', ')}.`
    );
};

/** Explicit targets, else every detected agent directory in `dir`, else Claude Code. */
export const resolveTargets = async (
    target: string | undefined,
    dir: string
): Promise<SkillTarget[]> => {
    const explicit = parseTarget(target);
    if (explicit) return explicit;
    const detected = await detectTargets(dir);
    return detected.length ? detected : ['claude'];
};

export type SkillFileStatus = 'created' | 'updated' | 'unchanged';

export interface SkillFileResult {
    target: SkillTarget;
    /** Absolute path of the file. */
    path: string;
    status: SkillFileStatus;
}

export interface InstallSkillOptions {
    dir: string;
    targets: SkillTarget[];
    force?: boolean;
    /** Skill source; defaults to the embedded docs/snippets/agents/learncard-skill.md. */
    source?: string;
}

const errnoCode = (error: unknown): string | undefined => (error as NodeJS.ErrnoException)?.code;

const unsafePath = (dir: string, candidate: string, reason: string): CliError =>
    new CliError(
        `Refusing to write the skill through ${path.relative(dir, candidate) || candidate}: ${reason}.`,
        {
            code: 'UNSAFE_PATH',
            hint: 'Replace it with a real directory/file inside --dir (or remove it), then re-run.',
            detail: candidate,
        }
    );

/**
 * Check every path component from `dir` (exclusive; the caller chose it) down to `file`
 * with `lstat`, so the install can never be redirected outside `dir`. A symlink anywhere,
 * a non-directory parent or a non-file target throws `UNSAFE_PATH`. Returns whether `file`
 * exists (a missing component means it does not; mkdir and `wx` create the rest).
 */
export const inspectSkillPath = async (dir: string, file: string): Promise<boolean> => {
    const parts = path.relative(dir, file).split(path.sep);
    if (!parts.length || parts.some(part => part === '' || part === '..'))
        throw unsafePath(dir, file, 'it is not inside --dir');
    let current = dir;
    for (const [index, part] of parts.entries()) {
        current = path.join(current, part);
        let stats;
        try {
            stats = await fs.lstat(current);
        } catch (error) {
            if (errnoCode(error) === 'ENOENT') return false;
            throw error;
        }
        if (stats.isSymbolicLink()) throw unsafePath(dir, current, 'it is a symbolic link');
        const last = index === parts.length - 1;
        if (last && !stats.isFile()) throw unsafePath(dir, current, 'it is not a regular file');
        if (!last && !stats.isDirectory()) throw unsafePath(dir, current, 'it is not a directory');
    }
    return true;
};

/** Create the parent directories of `file` one at a time, refusing symlinked components. */
const makeParents = async (dir: string, file: string): Promise<void> => {
    let current = dir;
    for (const part of path.relative(dir, path.dirname(file)).split(path.sep)) {
        if (!part) continue;
        current = path.join(current, part);
        try {
            await fs.mkdir(current);
        } catch (error) {
            if (errnoCode(error) !== 'EEXIST') throw error;
            const stats = await fs.lstat(current);
            if (stats.isSymbolicLink()) throw unsafePath(dir, current, 'it is a symbolic link');
            if (!stats.isDirectory()) throw unsafePath(dir, current, 'it is not a directory');
        }
    }
};

/**
 * Write one skill file without ever following a link. A new file is created exclusively
 * (`wx`: fails if anything, even a dangling symlink, appeared at the path). An overwrite
 * (`--force`) goes to a temp file in the same directory, then `rename`, which replaces the
 * directory entry itself and never writes through it.
 */
const writeSkillFile = async (
    dir: string,
    file: string,
    content: string,
    status: SkillFileStatus
): Promise<void> => {
    await makeParents(dir, file);
    const exists = await inspectSkillPath(dir, file);
    if (status === 'created' || !exists) {
        try {
            await fs.writeFile(file, content, { encoding: 'utf8', flag: 'wx' });
        } catch (error) {
            if (errnoCode(error) === 'EEXIST')
                throw unsafePath(dir, file, 'something was created there during the install');
            throw error;
        }
        return;
    }
    const temp = path.join(
        path.dirname(file),
        `.${path.basename(file)}.${process.pid}.${Date.now().toString(36)}.tmp`
    );
    await fs.writeFile(temp, content, { encoding: 'utf8', flag: 'wx' });
    try {
        await inspectSkillPath(dir, file);
        await fs.rename(temp, file);
    } catch (error) {
        await fs.rm(temp, { force: true });
        throw error;
    }
};

/**
 * Write the skill for each target. All targets are checked first: a symlink or non-file
 * anywhere under `dir` on a target path throws `UNSAFE_PATH`, and if any target holds a
 * different file and `force` is not set, `EXISTS` is thrown; either way nothing is written.
 * An identical file is left alone (`unchanged`).
 */
export const installSkill = async ({
    dir,
    targets,
    force = false,
    source = AGENT_SKILL_MD,
}: InstallSkillOptions): Promise<SkillFileResult[]> => {
    const plan = await Promise.all(
        [...new Set(targets)].map(async target => {
            const file = path.join(dir, SKILL_TARGETS[target].file);
            const content = renderSkill(target, source);
            const existing = (await inspectSkillPath(dir, file))
                ? await fs.readFile(file, 'utf8')
                : undefined;
            const status: SkillFileStatus =
                existing === undefined ? 'created' : existing === content ? 'unchanged' : 'updated';
            return { target, file, content, status };
        })
    );

    const conflicts = plan.filter(entry => entry.status === 'updated');
    if (conflicts.length && !force) {
        const files = conflicts.map(entry => path.relative(dir, entry.file) || entry.file);
        throw new CliError(`A different LearnCard skill already exists: ${files.join(', ')}.`, {
            code: 'EXISTS',
            hint: 'Re-run with --force to overwrite it, or --print to see the new version.',
            detail: conflicts.map(entry => entry.file).join('\n'),
        });
    }

    for (const entry of plan) {
        if (entry.status === 'unchanged') continue;
        await writeSkillFile(dir, entry.file, entry.content, entry.status);
    }

    return plan.map(({ target, file, status }) => ({ target, path: file, status }));
};

export interface SkillInstallCliOptions {
    target?: string;
    dir?: string;
    force?: boolean;
    print?: boolean;
    json?: boolean;
}

/** Action for `skill install`. Validates flags before touching the file system. */
export const runSkillInstall = async (options: SkillInstallCliOptions): Promise<void> => {
    const explicit = parseTarget(options.target);

    if (options.print) {
        const target = explicit?.length === 1 ? explicit[0]! : 'claude';
        if (explicit && explicit.length > 1)
            throw new UsageError('--print takes a single --target (claude, cursor or agents).');
        const content = renderSkill(target);
        if (out.json) out.set({ target, content });
        else process.stdout.write(content);
        return;
    }

    const dir = path.resolve(process.cwd(), options.dir ?? '.');
    if (!(await isDirectory(dir)))
        throw new UsageError(
            `--dir ${options.dir ?? dir} is not a directory.`,
            'Pass an existing project directory.'
        );

    const targets = explicit ?? (await resolveTargets(undefined, dir));
    const files = await installSkill({ dir, targets, force: options.force });

    for (const file of files) {
        const label =
            file.status === 'created'
                ? 'Wrote'
                : file.status === 'updated'
                  ? 'Updated'
                  : 'Unchanged';
        // Show a short path when the file is under cwd; otherwise (e.g. /var vs /private/var
        // on macOS, or --dir elsewhere) the absolute path reads better than ../../..
        const relative = path.relative(process.cwd(), file.path);
        const shown = relative && !relative.startsWith('..') ? relative : file.path;
        out.log(`${label} ${shown} (${file.target})`);
    }
    if (files.some(file => file.status !== 'unchanged'))
        out.log(
            'Your coding agent will load it for LearnCard tasks. Discover more: npx @learncard/cli commands --json'
        );
    out.set({ dir, targets, files });
};

export type SkillCommandDeps = RunCommand | { run: RunCommand };

/**
 * Register `skill install`. `deps` is the shared runner (or `{ run }`), so tests can
 * inject it the same way as every other command.
 */
export const registerSkillCommands = (program: Command, deps: SkillCommandDeps): void => {
    const run = typeof deps === 'function' ? deps : deps.run;
    const skill = program
        .command('skill')
        .description('Install the LearnCard skill for coding agents (Claude Code, Cursor, ...).');

    skill
        .command('install')
        .description(
            'Write the LearnCard agent skill into a project: .claude/skills, .cursor/rules or .agents/skills. Local only.'
        )
        .option(
            '--target <agent>',
            'claude|cursor|agents|all (default: every agent directory found in --dir, else claude)'
        )
        .option('--dir <path>', 'project directory to install into (default: current folder)')
        .option('--force', 'overwrite a different existing skill file')
        .option('--print', 'print the skill to stdout instead of writing files')
        .option('--json', 'print a single JSON result on stdout')
        .action((options: SkillInstallCliOptions) =>
            run('skill install', options, async () => {
                await runSkillInstall(options);
            })
        );
};

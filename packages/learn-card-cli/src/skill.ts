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

const readIfExists = async (file: string): Promise<string | undefined> => {
    try {
        return await fs.readFile(file, 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
        throw error;
    }
};

/**
 * Write the skill for each target. All targets are checked first: if any target holds a
 * different file and `force` is not set, nothing is written and `EXISTS` is thrown.
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
            const existing = await readIfExists(file);
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
        await fs.mkdir(path.dirname(entry.file), { recursive: true });
        await fs.writeFile(entry.file, entry.content, 'utf8');
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

/**
 * `skill install`: targets, auto-detect, idempotency, EXISTS without --force, --print, the
 * Cursor rule conversion, and a guard that every `npx @learncard/cli ...` line in the skill
 * is a real command with real flags. Nothing here touches a network or an identity.
 */
import { readFileSync, readdirSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Command, type Option } from 'commander';
import { parse as parseYaml } from 'yaml';

const mocks = vi.hoisted(() => ({ initLearnCard: vi.fn() }));
vi.mock('@learncard/init', () => ({ initLearnCard: mocks.initLearnCard }));

import { AGENT_SKILL_MD } from './generated/snippets';
import { CliError } from './errors';
import { out } from './out';
import { applyGlobalOptions, buildProgram, hoistGlobalFlags, leafCommands } from './program';
import type { RunCommand } from './doctor';
import {
    SKILL_TARGETS,
    detectTargets,
    installSkill,
    parseFrontmatter,
    registerSkillCommands,
    renderSkill,
    resolveTargets,
    runSkillInstall,
    toCursorRule,
} from './skill';

let cwd: string;

beforeEach(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-skill-'));
    vi.spyOn(process, 'cwd').mockReturnValue(cwd);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.initLearnCard.mockImplementation(() => {
        throw new Error('skill install must never build a wallet');
    });
    out.json = false;
    out.result = {};
});

afterEach(async () => {
    vi.restoreAllMocks();
    mocks.initLearnCard.mockReset();
    await fs.rm(cwd, { recursive: true, force: true });
});

const read = (relative: string): Promise<string> => fs.readFile(path.join(cwd, relative), 'utf8');

const listFiles = async (dir: string, prefix = ''): Promise<string[]> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const nested = await Promise.all(
        entries.map(entry =>
            entry.isDirectory()
                ? listFiles(path.join(dir, entry.name), `${prefix}${entry.name}/`)
                : [`${prefix}${entry.name}`]
        )
    );
    return nested.flat().sort();
};

describe('the skill source', () => {
    it('has Agent Skills frontmatter named learncard with a description', () => {
        const { data, body } = parseFrontmatter(AGENT_SKILL_MD);
        expect(data.name).toBe('learncard');
        expect(typeof data.description).toBe('string');
        expect((data.description as string).length).toBeGreaterThan(50);
        // Claude Skills limit descriptions to 1024 characters.
        expect((data.description as string).length).toBeLessThanOrEqual(1024);
        expect(body.trimStart().startsWith('# LearnCard')).toBe(true);
    });

    it('stays concise (under 250 lines)', () => {
        expect(AGENT_SKILL_MD.split('\n').length).toBeLessThan(250);
    });

    it('does not claim an MCP server', () => {
        expect(AGENT_SKILL_MD).not.toMatch(/\bmcp\b/i);
    });
});

describe('toCursorRule', () => {
    it('converts to a Cursor rule: description, empty globs, alwaysApply false', () => {
        const rule = toCursorRule(AGENT_SKILL_MD);
        const { data, body } = parseFrontmatter(rule);
        expect(Object.keys(data)).toEqual(['description', 'globs', 'alwaysApply']);
        expect(data.description).toBe(parseFrontmatter(AGENT_SKILL_MD).data.description);
        expect(data.globs).toBeNull();
        expect(data.alwaysApply).toBe(false);
        expect(rule).toMatch(
            /^---\ndescription: .+\nglobs:\nalwaysApply: false\n---\n\n# LearnCard/
        );
        expect(body).toBe(parseFrontmatter(AGENT_SKILL_MD).body);
    });

    it('quotes a description that is not a safe plain YAML scalar', () => {
        const rule = toCursorRule('---\nname: x\ndescription: "Use when: always"\n---\n# X\n');
        expect(rule).toContain('description: "Use when: always"\n');
        expect(parseYaml(rule.split('---')[1]!)).toMatchObject({ description: 'Use when: always' });
    });

    it('renderSkill only converts for cursor', () => {
        expect(renderSkill('claude')).toBe(AGENT_SKILL_MD);
        expect(renderSkill('agents')).toBe(AGENT_SKILL_MD);
        expect(renderSkill('cursor')).toBe(toCursorRule(AGENT_SKILL_MD));
    });
});

describe('target resolution', () => {
    it('defaults to claude when no agent directory exists', async () => {
        expect(await detectTargets(cwd)).toEqual([]);
        expect(await resolveTargets(undefined, cwd)).toEqual(['claude']);
    });

    it('auto-detects every existing agent directory', async () => {
        await fs.mkdir(path.join(cwd, '.cursor'));
        await fs.mkdir(path.join(cwd, '.agents'));
        expect(await resolveTargets(undefined, cwd)).toEqual(['cursor', 'agents']);
    });

    it('an explicit target wins over detection; all means every target', async () => {
        await fs.mkdir(path.join(cwd, '.cursor'));
        expect(await resolveTargets('claude', cwd)).toEqual(['claude']);
        expect(await resolveTargets('all', cwd)).toEqual(['claude', 'cursor', 'agents']);
    });

    it('rejects an unknown target as USAGE', async () => {
        await expect(resolveTargets('vscode', cwd)).rejects.toMatchObject({ code: 'USAGE' });
    });
});

describe('installSkill', () => {
    it('writes each target to its documented path', async () => {
        const files = await installSkill({ dir: cwd, targets: ['claude', 'cursor', 'agents'] });
        expect(files.map(file => [file.target, file.status])).toEqual([
            ['claude', 'created'],
            ['cursor', 'created'],
            ['agents', 'created'],
        ]);
        expect(await listFiles(cwd)).toEqual(
            [
                '.agents/skills/learncard/SKILL.md',
                '.claude/skills/learncard/SKILL.md',
                '.cursor/rules/learncard.mdc',
            ].sort()
        );
        expect(await read(SKILL_TARGETS.claude.file)).toBe(AGENT_SKILL_MD);
        expect(await read(SKILL_TARGETS.agents.file)).toBe(AGENT_SKILL_MD);
        expect(await read(SKILL_TARGETS.cursor.file)).toBe(toCursorRule(AGENT_SKILL_MD));
        expect(files[0]!.path).toBe(path.join(cwd, '.claude/skills/learncard/SKILL.md'));
    });

    it('is idempotent: an identical file is unchanged', async () => {
        await installSkill({ dir: cwd, targets: ['claude'] });
        const before = await fs.stat(path.join(cwd, SKILL_TARGETS.claude.file));
        const files = await installSkill({ dir: cwd, targets: ['claude'] });
        expect(files).toEqual([
            {
                target: 'claude',
                path: path.join(cwd, SKILL_TARGETS.claude.file),
                status: 'unchanged',
            },
        ]);
        const after = await fs.stat(path.join(cwd, SKILL_TARGETS.claude.file));
        expect(after.mtimeMs).toBe(before.mtimeMs);
    });

    it('refuses to overwrite a different file without --force and writes nothing', async () => {
        const file = path.join(cwd, SKILL_TARGETS.claude.file);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, 'my edited skill\n');

        const error = await installSkill({ dir: cwd, targets: ['claude', 'agents'] }).catch(
            (caught: unknown) => caught
        );
        expect(error).toBeInstanceOf(CliError);
        expect(error).toMatchObject({ code: 'EXISTS' });
        expect((error as CliError).hint).toContain('--force');
        expect(await read(SKILL_TARGETS.claude.file)).toBe('my edited skill\n');
        // Checked before writing anything: the other target was not created either.
        expect(await listFiles(cwd)).toEqual(['.claude/skills/learncard/SKILL.md']);
    });

    it('overwrites a different file with --force and reports updated', async () => {
        const file = path.join(cwd, SKILL_TARGETS.cursor.file);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, 'old rule\n');
        const files = await installSkill({ dir: cwd, targets: ['cursor'], force: true });
        expect(files[0]!.status).toBe('updated');
        expect(await read(SKILL_TARGETS.cursor.file)).toBe(toCursorRule(AGENT_SKILL_MD));
    });
});

describe('installSkill stays inside --dir', () => {
    let outside: string;

    beforeEach(async () => {
        outside = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-skill-outside-'));
    });

    afterEach(async () => {
        await fs.rm(outside, { recursive: true, force: true });
    });

    const exists = (file: string): Promise<boolean> =>
        fs.lstat(file).then(
            () => true,
            () => false
        );

    const expectUnsafe = async (promise: Promise<unknown>): Promise<CliError> => {
        const error = await promise.catch((caught: unknown) => caught);
        expect(error).toBeInstanceOf(CliError);
        expect(error).toMatchObject({ code: 'UNSAFE_PATH' });
        return error as CliError;
    };

    it.each([false, true])(
        'refuses a dangling SKILL.md symlink to an outside path (force: %s)',
        async force => {
            const file = path.join(cwd, SKILL_TARGETS.claude.file);
            const target = path.join(outside, 'pwned.md');
            await fs.mkdir(path.dirname(file), { recursive: true });
            await fs.symlink(target, file);

            await expectUnsafe(installSkill({ dir: cwd, targets: ['claude'], force }));
            expect(await exists(target)).toBe(false);
            expect((await fs.lstat(file)).isSymbolicLink()).toBe(true);
        }
    );

    it('--force does not write through a symlink to an existing outside file', async () => {
        const file = path.join(cwd, SKILL_TARGETS.cursor.file);
        const target = path.join(outside, 'important.txt');
        await fs.writeFile(target, 'keep me\n');
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.symlink(target, file);

        await expectUnsafe(installSkill({ dir: cwd, targets: ['cursor'], force: true }));
        expect(await fs.readFile(target, 'utf8')).toBe('keep me\n');
    });

    it.each(['.claude', '.claude/skills', '.claude/skills/learncard'])(
        'refuses a symlinked parent directory (%s) and writes nothing outside',
        async link => {
            await fs.mkdir(path.dirname(path.join(cwd, link)), { recursive: true });
            await fs.symlink(outside, path.join(cwd, link));

            const error = await expectUnsafe(installSkill({ dir: cwd, targets: ['claude'] }));
            expect(error.detail).toBe(path.join(cwd, link));
            expect(await fs.readdir(outside)).toEqual([]);
        }
    );

    it('checks every target before writing any', async () => {
        await fs.symlink(outside, path.join(cwd, '.cursor'));
        await expectUnsafe(installSkill({ dir: cwd, targets: ['claude', 'cursor'] }));
        expect(await exists(path.join(cwd, '.claude'))).toBe(false);
        expect(await fs.readdir(outside)).toEqual([]);
    });

    it('refuses a target that is not a regular file', async () => {
        await fs.mkdir(path.join(cwd, SKILL_TARGETS.claude.file), { recursive: true });
        await expectUnsafe(installSkill({ dir: cwd, targets: ['claude'], force: true }));
    });

    it('creates new files exclusively: a symlink planted after the check is not followed', async () => {
        const file = path.join(cwd, SKILL_TARGETS.claude.file);
        const target = path.join(outside, 'raced.md');
        const realLstat = fs.lstat;
        let checks = 0;
        // Plant the dangling link right after the write-time existence check reports "missing",
        // i.e. between the check and the write. Only the exclusive (wx) open can catch it.
        vi.spyOn(fs, 'lstat').mockImplementation((async (candidate: string) => {
            try {
                return await realLstat(candidate);
            } catch (error) {
                if (candidate === file && ++checks === 1) await fs.symlink(target, file);
                throw error;
            }
        }) as typeof fs.lstat);

        await expectUnsafe(installSkill({ dir: cwd, targets: ['claude'] }));
        expect(await exists(target)).toBe(false);
    });

    it('--force replaces the file atomically and leaves no temp file behind', async () => {
        const file = path.join(cwd, SKILL_TARGETS.claude.file);
        await fs.mkdir(path.dirname(file), { recursive: true });
        await fs.writeFile(file, 'old\n');
        await installSkill({ dir: cwd, targets: ['claude'], force: true });
        expect(await read(SKILL_TARGETS.claude.file)).toBe(AGENT_SKILL_MD);
        expect(await fs.readdir(path.dirname(file))).toEqual(['SKILL.md']);
    });

    it('runSkillInstall --json reports UNSAFE_PATH', async () => {
        await fs.symlink(outside, path.join(cwd, '.claude'));
        await expectUnsafe(runSkillInstall({ target: 'claude', json: true }));
        expect(await fs.readdir(outside)).toEqual([]);
    });
});

describe('runSkillInstall', () => {
    it('installs for Claude by default in the current folder and reports files', async () => {
        out.json = true;
        await runSkillInstall({ json: true });
        expect(out.result).toEqual({
            dir: cwd,
            targets: ['claude'],
            files: [
                {
                    target: 'claude',
                    path: path.join(cwd, SKILL_TARGETS.claude.file),
                    status: 'created',
                },
            ],
        });
    });

    it('installs into --dir relative to the current folder', async () => {
        await fs.mkdir(path.join(cwd, 'app', '.cursor'), { recursive: true });
        await runSkillInstall({ dir: 'app' });
        expect(await listFiles(path.join(cwd, 'app'))).toEqual(['.cursor/rules/learncard.mdc']);
    });

    it('rejects a --dir that does not exist without creating it', async () => {
        await expect(runSkillInstall({ dir: 'missing' })).rejects.toMatchObject({ code: 'USAGE' });
        expect(await fs.readdir(cwd)).toEqual([]);
    });

    it('validates --target before touching the file system', async () => {
        await expect(runSkillInstall({ target: 'nope', dir: 'missing' })).rejects.toMatchObject({
            code: 'USAGE',
            message: expect.stringContaining('--target'),
        });
    });

    it('--print writes the raw skill to stdout and no files', async () => {
        const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        await runSkillInstall({ print: true });
        expect(write).toHaveBeenCalledWith(AGENT_SKILL_MD);
        expect(await fs.readdir(cwd)).toEqual([]);
    });

    it('--print --target cursor prints the Cursor rule', async () => {
        const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        await runSkillInstall({ print: true, target: 'cursor' });
        expect(write).toHaveBeenCalledWith(toCursorRule(AGENT_SKILL_MD));
    });

    it('--print --json puts the content in the result', async () => {
        out.json = true;
        const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
        await runSkillInstall({ print: true, json: true });
        expect(write).not.toHaveBeenCalled();
        expect(out.result).toEqual({ target: 'claude', content: AGENT_SKILL_MD });
        expect(await fs.readdir(cwd)).toEqual([]);
    });

    it('--print rejects --target all', async () => {
        await expect(runSkillInstall({ print: true, target: 'all' })).rejects.toMatchObject({
            code: 'USAGE',
        });
    });
});

describe('registerSkillCommands', () => {
    const parse = (argv: string[], deps: 'fn' | 'object' = 'fn') => {
        const seen: { command: string; options: Record<string, unknown> }[] = [];
        const run: RunCommand = async (command, options) => {
            seen.push({ command, options: options as Record<string, unknown> });
        };
        const program = new Command().exitOverride();
        registerSkillCommands(program, deps === 'fn' ? run : { run });
        applyGlobalOptions(program);
        program.parse(['node', 'learncard', ...argv]);
        return seen;
    };

    it('parses skill install flags and accepts the global flags', () => {
        expect(
            parse([
                'skill',
                'install',
                '--target',
                'cursor',
                '--dir',
                'x',
                '--force',
                '-y',
                '--json',
                '--network',
                'staging',
            ])
        ).toEqual([
            {
                command: 'skill install',
                options: {
                    target: 'cursor',
                    dir: 'x',
                    force: true,
                    yes: true,
                    json: true,
                    network: 'staging',
                },
            },
        ]);
    });

    it('accepts { run } as deps', () => {
        expect(parse(['skill', 'install', '--print'], 'object')[0]!.options).toEqual({
            print: true,
        });
    });
});

/** Minimal shell word splitter: quotes and backslashes; stops at pipes, redirects, comments. */
const shellWords = (line: string): string[] => {
    const words: string[] = [];
    let current = '';
    let quote: '"' | "'" | null = null;
    let started = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i]!;
        if (quote) {
            if (char === quote) quote = null;
            else current += char;
            continue;
        }
        if (char === '"' || char === "'") {
            quote = char;
            started = true;
        } else if (char === '\\' && i + 1 < line.length) {
            current += line[++i];
            started = true;
        } else if (/\s/.test(char)) {
            if (started) words.push(current);
            current = '';
            started = false;
        } else {
            current += char;
            started = true;
        }
    }
    if (started) words.push(current);
    const stop = words.findIndex(word => /^(\||\|\||&&|;|>|>>|2>.*|#.*)$/.test(word));
    return stop === -1 ? words : words.slice(0, stop);
};

/** Problems with one `npx @learncard/cli <words>` invocation, checked against commander. */
const checkInvocation = (program: Command, rawWords: string[]): string[] => {
    // The CLI moves leading --json/-y/--network after the command; check what it parses.
    const words = hoistGlobalFlags(['node', 'learncard', ...rawWords]).slice(2);
    let command = program;
    let index = 0;
    while (index < words.length && command.commands.length) {
        const sub = command.commands.find(
            c => c.name() === words[index] || c.aliases().includes(words[index]!)
        );
        if (!sub) break;
        command = sub;
        index++;
    }
    const rest = words.slice(index);
    if (command === program)
        return rest.every(word => ['--help', '-h', '--version', '-V'].includes(word))
            ? []
            : [`unknown command "${rest[0]}"`];
    if (command.commands.length)
        return rest.every(word => ['--help', '-h'].includes(word))
            ? []
            : [`"${command.name()}" needs a subcommand`];

    const { options, _args: args } = command as unknown as {
        options: Option[];
        _args: { required: boolean; variadic: boolean }[];
    };
    const problems: string[] = [];
    const positionals: string[] = [];
    for (let i = 0; i < rest.length; i++) {
        const word = rest[i]!;
        if (word === '-' || !word.startsWith('-')) {
            positionals.push(word);
            continue;
        }
        if (word === '--help' || word === '-h') continue;
        const flag = word.split('=')[0]!;
        const option = options.find(o => o.long === flag || o.short === flag);
        if (!option) {
            problems.push(`unknown option ${flag}`);
            continue;
        }
        if ((option.required || option.optional) && !word.includes('=')) {
            if (option.required) i++;
            else if (i + 1 < rest.length && !rest[i + 1]!.startsWith('-')) i++;
            if (option.variadic) while (i + 1 < rest.length && !rest[i + 1]!.startsWith('-')) i++;
        }
    }
    const required = args.filter(arg => arg.required).length;
    const variadic = args.some(arg => arg.variadic);
    if (positionals.length < required)
        problems.push(`expects ${required} argument(s), got ${positionals.length}`);
    if (!variadic && positionals.length > args.length)
        problems.push(`expects at most ${args.length} argument(s), got ${positionals.length}`);
    return problems;
};

describe('every CLI line in the skill is a real command', () => {
    // The real tree: buildProgram() registers skill, commands, capabilities, call and api.
    const program = buildProgram({ runRepl: () => {} });

    const invocations = [
        ...parseFrontmatter(AGENT_SKILL_MD).body.matchAll(/npx @learncard\/cli([^`\n]*)/g),
    ].map(match => match[1]!.trim());

    it('finds the invocations', () => {
        expect(invocations.length).toBeGreaterThan(20);
        const used = new Set(invocations.map(line => shellWords(line).slice(0, 2).join(' ')));
        for (const expected of ['commands --json', 'capabilities --json', 'skill install'])
            expect([...used]).toContain(expected);
    });

    it.each(invocations)('npx @learncard/cli %s', line => {
        expect(checkInvocation(program, shellWords(line))).toEqual([]);
    });

    it('the checker catches a bad flag, a missing argument and an unknown command', () => {
        expect(checkInvocation(program, shellWords('send --nope'))).toEqual([
            'unknown option --nope',
        ]);
        expect(checkInvocation(program, shellWords('verify --json'))).toEqual([
            'expects 1 argument(s), got 0',
        ]);
        expect(checkInvocation(program, shellWords('export --json'))).toEqual([
            'unknown command "export"',
        ]);
        expect(checkInvocation(program, shellWords('org --json'))).toEqual([
            '"org" needs a subcommand',
        ]);
    });

    it('skill install is a leaf command of the full program', () => {
        expect(leafCommands(program).map(({ path: p }) => p.join(' '))).toContain('skill install');
    });
});

describe('CLI lines in the docs are real commands', () => {
    const program = buildProgram({ runRepl: () => {} });
    const REPO = path.resolve(__dirname, '../../..');
    const markdownUnder = (dir: string): string[] =>
        readdirSync(path.join(REPO, dir), { recursive: true, encoding: 'utf8' })
            .filter(file => file.endsWith('.md'))
            .map(file => path.join(dir, file));
    // Every docs page plus the READMEs and AGENTS.md: any page that shows a CLI command.
    const pages = [
        ...markdownUnder('docs'),
        'packages/learn-card-cli/README.md',
        'README.md',
        'AGENTS.md',
    ];
    const COMMAND_NAMES = new Set(program.commands.map(command => command.name()));
    const cases = pages.flatMap(page =>
        [
            // Only code: a line start (code blocks, optionally after `VAR=value`), inline code or a
            // `$ ` prompt. Prose such as an image caption ("npx @learncard/cli to boot up") is not
            // an invocation. A bare `learncard <command>` (global install) counts too.
            ...readFileSync(path.join(REPO, page), 'utf8').matchAll(
                /(?:^|`|\$ |^[A-Z_]+=\S+ )\s*(npx @learncard\/cli|learncard)\b([^`\n|]*)/gm
            ),
        ]
            .map(match => ({ bare: match[1] === 'learncard', line: match[2]!.trim() }))
            // Prose (`npx @learncard/cli`).` and placeholders such as `<command> --help`
            // mention the CLI rather than invoke a command.
            .filter(({ line }) => /^[a-z-]/.test(line))
            .filter(({ bare, line }) => !bare || COMMAND_NAMES.has(shellWords(line)[0]!))
            .map(({ line }) => [page, line] as const)
    );

    it('scans the whole docs tree', () => {
        expect(pages.length).toBeGreaterThan(50);
        for (const page of [
            'docs/introduction/for-ai-agents.md',
            'docs/how-to-guides/use-learncard-with-coding-agents.md',
            'docs/sdks/learncard-cli.md',
            'docs/quick-start/your-first-integration.md',
            'packages/learn-card-cli/README.md',
        ])
            expect(
                cases.some(([p]) => p === page),
                page
            ).toBe(true);
        expect(cases.length).toBeGreaterThan(150);
    });

    it.each(cases)('%s: npx @learncard/cli %s', (_page, line) => {
        expect(checkInvocation(program, shellWords(line))).toEqual([]);
    });
});

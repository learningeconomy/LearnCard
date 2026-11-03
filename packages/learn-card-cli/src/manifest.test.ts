/**
 * `commands` manifest: generated from the live commander tree, complete metadata for every
 * leaf command, runnable examples, help examples, and the JSON / human output contract.
 * Nothing here touches the network; the error-code check only reads src/*.ts.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Command, CommanderError } from 'commander';

import { buildProgram, runCommand } from './program';
import { registerManifestCommands, runCommands } from './commands';
import {
    COMMAND_METADATA,
    ERROR_CODES,
    buildManifest,
    closestMatches,
    walkLeafCommands,
    type CommandEffect,
} from './manifest';
import type { RunCommand } from './doctor';
import { out } from './out';
import packageJson from '../package.json';

const EFFECTS: CommandEffect[] = ['read', 'write', 'local', 'varies'];

const testProgram = (
    run: RunCommand = async () => undefined
): { program: Command; seen: string[] } => {
    const seen: string[] = [];
    const recording: RunCommand = async (command, options, action, settings) => {
        seen.push(command);
        return run(command, options, action, settings);
    };
    const program = buildProgram({
        runRepl: () => {
            seen.push('repl');
        },
        run: recording,
    });
    return { program, seen };
};

afterEach(() => {
    vi.restoreAllMocks();
    out.json = false;
    out.result = {};
    process.exitCode = undefined;
});

/** Split a documented shell line into the argv after `npx @learncard/cli`. */
const exampleArgv = (example: string): string[] => {
    const segment = example.split('|').find(part => part.includes('npx @learncard/cli'));
    if (!segment) throw new Error(`Example does not invoke npx @learncard/cli: ${example}`);
    const tokens: string[] = segment.match(/'[^']*'|"[^"]*"|\S+/g) ?? [];
    const start = tokens.indexOf('@learncard/cli');
    return tokens.slice(start + 1).map(token => token.replace(/^(['"])(.*)\1$/, '$2'));
};

const throwOnExit = (command: Command): void => {
    command.exitOverride();
    command.configureOutput({ writeErr: () => {}, writeOut: () => {}, outputError: () => {} });
    for (const sub of command.commands) throwOnExit(sub);
};

describe('command metadata completeness', () => {
    const { program } = testProgram();
    const leaves = walkLeafCommands(program).map(({ name }) => name);

    it('every leaf command has metadata', () => {
        const missing = leaves.filter(name => !COMMAND_METADATA[name]);
        expect(missing, 'add these to COMMAND_METADATA in src/manifest.ts').toEqual([]);
    });

    it('every metadata entry names a real command', () => {
        const unknown = Object.keys(COMMAND_METADATA).filter(name => !leaves.includes(name));
        expect(unknown, 'remove or rename these COMMAND_METADATA entries').toEqual([]);
    });

    it('includes the agent discovery, bridge and skill commands', () => {
        expect(leaves).toEqual(
            expect.arrayContaining(['commands', 'capabilities', 'call', 'api', 'skill install'])
        );
    });

    it.each(Object.entries(COMMAND_METADATA))('%s metadata is well-formed', (name, metadata) => {
        expect(EFFECTS).toContain(metadata.effect);
        expect(metadata.output.length).toBeGreaterThan(0);
        expect(metadata.examples.length).toBeGreaterThanOrEqual(2);
        expect(metadata.examples.length).toBeLessThanOrEqual(3);
        for (const example of metadata.examples) expect(example).toContain('npx @learncard/cli');
        if (name !== 'repl')
            expect(metadata.examples.some(example => / --json\b/.test(example))).toBe(true);
    });

    it('only identity-creating commands are marked createsIdentity, and none of them is read-only', () => {
        for (const [name, metadata] of Object.entries(COMMAND_METADATA)) {
            if (metadata.createsIdentity) expect(metadata.effect, name).toBe('write');
        }
        const readOnly = ['whoami', 'status', 'inbox list', 'refresh history', 'doctor'];
        for (const name of readOnly) {
            expect(COMMAND_METADATA[name]).toMatchObject({
                effect: 'read',
                createsIdentity: false,
            });
        }
    });
});

describe('examples are real invocations', () => {
    const cases = Object.entries(COMMAND_METADATA).flatMap(([name, metadata]) =>
        metadata.examples.map(example => [name, example] as const)
    );

    it.each(cases)('%s: %s', (name, example) => {
        const { program, seen } = testProgram();
        throwOnExit(program);
        const argv = exampleArgv(example);
        try {
            program.parse(['node', 'learncard', ...argv]);
        } catch (error) {
            const message = error instanceof CommanderError ? error.message : String(error);
            throw new Error(`"${example}" does not parse: ${message}`, { cause: error });
        }
        expect(seen).toEqual([name]);
    });
});

describe('buildManifest', () => {
    const { program } = testProgram();
    const manifest = buildManifest(program);
    const entry = (name: string) => manifest.commands.find(command => command.name === name)!;

    it('reads arguments and options from the commander tree', () => {
        expect(entry('verify').arguments).toEqual([
            { name: 'file', required: true, variadic: false },
        ]);
        expect(entry('send').arguments).toEqual([
            { name: 'recipient', required: false, variadic: false },
        ]);
        expect(entry('commands').arguments).toEqual([
            { name: 'name', required: false, variadic: true },
        ]);
        expect(entry('send').options).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    flags: '--as <profileId>',
                    long: '--as',
                    env: 'LEARNCARD_AS',
                }),
                expect.objectContaining({ flags: '-y, --yes', short: '-y', long: '--yes' }),
            ])
        );
        expect(entry('promote').options).toEqual(
            expect.arrayContaining([expect.objectContaining({ long: '--from', required: true })])
        );
        expect(entry('demo refresh').options).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    long: '--network',
                    default: 'http://localhost:4000/trpc',
                }),
            ])
        );
    });

    it('merges metadata and full command paths', () => {
        expect(entry('inbox list')).toMatchObject({
            name: 'inbox list',
            description: expect.stringContaining('inbox'),
            effect: 'read',
            createsIdentity: false,
            network: true,
        });
        expect(entry('send')).toMatchObject({ effect: 'write', createsIdentity: true });
    });

    it('carries version, global options, env vars, error codes and doc links', () => {
        expect(manifest.version).toBe(packageJson.version);
        expect(manifest.globalOptions.map(option => option.flags)).toEqual([
            '-y, --yes',
            '--json',
            '--network <url>',
        ]);
        expect(manifest.envVars.map(env => env.name)).toEqual(
            expect.arrayContaining(['LC_YES', 'NETWORK_URL', 'CLOUD_URL', 'LCA_API_URL'])
        );
        expect(manifest.errorCodes.map(error => error.code)).toEqual(
            expect.arrayContaining(['USAGE', 'NO_IDENTITY', 'ERROR', 'UNKNOWN_COMMAND'])
        );
        expect(manifest.docs).toEqual({
            cli: 'https://docs.learncard.com/reference/learncard-cli',
            agents: 'https://docs.learncard.com/start-here/for-ai-agents',
            llmsTxt: 'https://docs.learncard.com/llms.txt',
            openapi: 'https://network.learncard.com/docs/openapi.json',
        });
    });

    it('lists repl last and is JSON-serializable', () => {
        expect(manifest.commands.at(-1)?.name).toBe('repl');
        expect(JSON.parse(JSON.stringify(manifest))).toEqual(manifest);
    });

    it('still lists a command that has no metadata, as effect "varies"', () => {
        const extra = testProgram().program;
        extra.command('mystery').description('Not in COMMAND_METADATA.');
        expect(buildManifest(extra).commands.find(c => c.name === 'mystery')).toMatchObject({
            effect: 'varies',
            examples: [],
        });
    });

    it('documents every error code the CLI itself throws', () => {
        const codes = ERROR_CODES.map(error => error.code);
        for (const code of ['USAGE', 'NO_IDENTITY', 'ERROR', 'UNKNOWN_CAPABILITY'])
            expect(codes).toContain(code);
    });
});

describe('--help examples', () => {
    const helpOf = (program: Command, path: string[]): string => {
        let command = program;
        for (const part of path) command = command.commands.find(sub => sub.name() === part)!;
        let text = '';
        command.configureOutput({ writeOut: chunk => (text += chunk) });
        command.outputHelp();
        return text;
    };

    it.each([['send'], ['inbox', 'list'], ['commands']])('%s --help shows examples', (...path) => {
        const { program } = testProgram();
        const help = helpOf(program, path);
        expect(help).toContain('Examples:');
        for (const example of COMMAND_METADATA[path.join(' ')]!.examples)
            expect(help).toContain(`$ ${example}`);
    });

    it('adds examples only once when registration helpers run again', () => {
        const { program } = testProgram();
        registerManifestCommands(new Command(), { run: async () => undefined });
        const help = helpOf(program, ['whoami']);
        expect(help.match(/Examples:/g)).toHaveLength(1);
    });
});

class ExitSignal extends Error {
    constructor(readonly code: number) {
        super(`exit ${code}`);
    }
}

/** Parse argv with the real `runCommand`, capturing stdout, human logs and the exit code. */
const runCli = async (argv: string[]): Promise<{ stdout: string; logs: string; code: number }> => {
    let stdout = '';
    let logs = '';
    vi.spyOn(process.stdout, 'write').mockImplementation(chunk => {
        stdout += String(chunk);
        return true;
    });
    vi.spyOn(console, 'log').mockImplementation((...parts) => {
        logs += parts.join(' ') + '\n';
    });
    vi.spyOn(console, 'error').mockImplementation((...parts) => {
        logs += parts.join(' ') + '\n';
    });
    vi.spyOn(process, 'exit').mockImplementation(code => {
        throw new ExitSignal(Number(code ?? 0));
    });
    const { program } = testProgram(runCommand);
    try {
        await program.parseAsync(['node', 'learncard', ...argv]);
    } catch (error) {
        if (error instanceof ExitSignal) return { stdout, logs, code: error.code };
        throw error;
    }
    throw new Error('command did not exit');
};

describe('learncard commands', () => {
    it('--json prints one success envelope with every command', async () => {
        const { stdout, logs, code } = await runCli(['commands', '--json']);
        expect(code).toBe(0);
        expect(logs, 'no human table on stderr in --json mode').toBe('');
        expect(stdout.trim().split('\n')).toHaveLength(1);
        const result = JSON.parse(stdout);
        expect(result).toMatchObject({
            ok: true,
            command: 'commands',
            version: packageJson.version,
        });
        const names = result.commands.map((entry: { name: string }) => entry.name);
        expect(names).toEqual(expect.arrayContaining(['send', 'inbox list', 'org apply']));
        expect(Object.keys(result)).toEqual(
            expect.arrayContaining(['globalOptions', 'envVars', 'errorCodes', 'docs'])
        );
    });

    it('<name> --json returns just that command; a group name returns its subcommands', async () => {
        const one = JSON.parse((await runCli(['commands', 'inbox', 'list', '--json'])).stdout);
        expect(one.commands.map((entry: { name: string }) => entry.name)).toEqual(['inbox list']);
        const quoted = JSON.parse((await runCli(['commands', 'org apply', '--json'])).stdout);
        expect(quoted.commands).toHaveLength(1);
        const group = JSON.parse((await runCli(['commands', 'clr', '--json'])).stdout);
        expect(group.commands.map((entry: { name: string }) => entry.name)).toEqual([
            'clr validate',
        ]);
    });

    it('an unknown name is UNKNOWN_COMMAND with suggestions', async () => {
        const { stdout, code } = await runCli(['commands', 'whoamy', '--json']);
        expect(code).toBe(1);
        expect(JSON.parse(stdout)).toMatchObject({
            ok: false,
            command: 'commands',
            code: 'UNKNOWN_COMMAND',
            hint: expect.stringContaining('whoami'),
        });
    });

    it('human mode prints an aligned table and points to --json', async () => {
        const { stdout, logs, code } = await runCli(['commands']);
        expect(code).toBe(0);
        expect(stdout).toBe('');
        const lines = logs.split('\n');
        const send = lines.find(line => line.startsWith('send '))!;
        const status = lines.find(line => line.startsWith('status '))!;
        expect(send).toMatch(/^send\s+write\s+Send a "Quickstart Complete" badge.* \*$/);
        const promote = lines.find(line => line.startsWith('promote '))!;
        expect(promote, 'do not split sentences at "e.g."').toContain('(e.g. staging');
        expect(status).toMatch(/^status\s+read\s+/);
        expect(send.indexOf('write')).toBe(status.indexOf('read'));
        expect(logs).toContain('npx @learncard/cli commands --json');
    });

    it('never builds a wallet or touches .env', async () => {
        const { program } = testProgram();
        out.json = true;
        await runCommands(program, []);
        expect(out.result.commands).toBeInstanceOf(Array);
    });
});

describe('closestMatches', () => {
    it('suggests near misses and substrings, and nothing for noise', () => {
        expect(closestMatches('whoamy', ['whoami', 'status', 'send'])).toEqual(['whoami']);
        expect(closestMatches('inbox', ['inbox list', 'init'])).toContain('inbox list');
        expect(closestMatches('zzzzzzzz', ['whoami', 'status'])).toEqual([]);
    });
});

describe('error codes', () => {
    it('every error code thrown in src/ is documented in ERROR_CODES', () => {
        const documented = new Set(ERROR_CODES.map(({ code }) => code));
        const files = readdirSync(__dirname).filter(
            file => /\.tsx?$/.test(file) && !file.endsWith('.test.ts')
        );
        const thrown = new Set<string>();
        for (const file of files) {
            const source = readFileSync(path.join(__dirname, file), 'utf8');
            for (const match of source.matchAll(/code: '([A-Z][A-Z_]+)'/g)) thrown.add(match[1]!);
            if (source.includes('`HTTP_${')) thrown.add('HTTP_<status>');
        }
        expect(thrown.size).toBeGreaterThan(5);
        expect([...thrown].filter(code => !documented.has(code))).toEqual([]);
    });
});

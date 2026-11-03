/**
 * `learncard commands [name...]` and the registration entry point for the agent
 * discovery commands (`commands`, `capabilities`).
 */
import type { Command } from 'commander';

import { CliError } from './errors';
import { out } from './out';
import type { RunCommand } from './doctor';
import { addHelpExamples, buildManifest, closestMatches, type ManifestEntry } from './manifest';
import { registerCapabilitiesCommand } from './capabilities';

export interface CommandsOptions {
    json?: boolean;
}

const MAX_DESCRIPTION = 72;

const firstSentence = (text: string): string => {
    const sentence = text.split(/(?<=\.)\s+(?=[A-Z])/)[0] ?? text;
    return sentence.length > MAX_DESCRIPTION
        ? `${sentence.slice(0, MAX_DESCRIPTION - 1).trimEnd()}…`
        : sentence;
};

/** `name` matches a command exactly, or a group prefix (`inbox` → `inbox list`). */
const selectCommands = (commands: ManifestEntry[], name: string): ManifestEntry[] => {
    const exact = commands.filter(entry => entry.name === name);
    if (exact.length) return exact;
    return commands.filter(entry => entry.name.startsWith(`${name} `));
};

/**
 * Print the command manifest. Human mode: an aligned name / effect / description table.
 * `--json`: `{ok:true, command:'commands', version, commands, globalOptions, envVars,
 * errorCodes, docs}`; with a name, `commands` holds only the matching entries.
 */
export const runCommands = async (
    program: Command,
    nameParts: string[] = [],
    _options: CommandsOptions = {}
): Promise<void> => {
    const manifest = buildManifest(program);
    const name = nameParts.join(' ').trim().replace(/\s+/g, ' ');
    let commands = manifest.commands;
    if (name) {
        commands = selectCommands(manifest.commands, name);
        if (!commands.length) {
            const suggestions = closestMatches(
                name,
                manifest.commands.map(entry => entry.name)
            );
            throw new CliError(`Unknown command "${name}".`, {
                code: 'UNKNOWN_COMMAND',
                hint: suggestions.length
                    ? `Did you mean: ${suggestions.join(', ')}? Run \`npx @learncard/cli commands\` for the full list.`
                    : 'Run `npx @learncard/cli commands` for the full list.',
            });
        }
    }

    out.set({ ...manifest, commands });
    // The table is for humans; in --json mode stdout already carries everything.
    if (out.json) return;

    const nameWidth = Math.max(...commands.map(entry => entry.name.length));
    const effectWidth = Math.max(...commands.map(entry => entry.effect.length));
    for (const entry of commands) {
        const marker = entry.createsIdentity ? ' *' : '';
        out.log(
            `${entry.name.padEnd(nameWidth)}  ${entry.effect.padEnd(effectWidth)}  ${firstSentence(entry.description)}${marker}`
        );
    }
    out.log('');
    if (commands.some(entry => entry.createsIdentity))
        out.log('* may create an identity (seed + profile) in this folder');
    out.log(
        'effect (upper bound over flags): read = reads remote state, write = changes network state, local = no remote state, varies = depends on arguments'
    );
    out.log(
        'Machine-readable (options, output fields, examples, error codes): npx @learncard/cli commands --json'
    );
};

export interface ManifestCommandDeps {
    /** The shared runner (`runCommand` from program.ts, or a test double). */
    run: RunCommand;
}

/**
 * Add `commands [name...]` and `capabilities [id]` to `program` (both accept the global
 * `-y`/`--json`/`--network` flags) and append metadata examples to every leaf command's
 * `--help`. Call it after all other commands are registered so their help gets examples
 * too (or call `addHelpExamples(program)` again at the end; it is idempotent).
 */
export const registerManifestCommands = (program: Command, { run }: ManifestCommandDeps): void => {
    program
        .command('commands [name...]')
        .description(
            'List every command with its effect (read/write/local), options, output fields and examples; use --json for agents.'
        )
        .option('--json', 'print a single JSON result on stdout')
        .option('-y, --yes', 'accepted for consistency; this command never prompts')
        .option('--network <url>', 'accepted for consistency; this command does not use it')
        .action((name: string[] | undefined, options: CommandsOptions) =>
            run('commands', options, async () => {
                await runCommands(program, name ?? [], options);
            })
        );

    registerCapabilitiesCommand(program, run);
    addHelpExamples(program);
};

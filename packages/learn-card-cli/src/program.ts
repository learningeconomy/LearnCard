import fs from 'node:fs/promises';
import { Command, Option, type CommanderError } from 'commander';

import { out } from './out';
import { errorEnvelope, humanErrorLines, CliError } from './errors';
import { LOCAL_NETWORK, validateNetwork } from './project';
import { registerOrgCommand } from './org';
import { registerDoctorCommand, type RunCommand } from './doctor';
import { registerClrCommand } from './clr';
import { registerInboxCommand } from './inbox';
import { registerRefreshCommand } from './refresh';
import { registerWhoamiCommand } from './whoami';
import { registerPromoteCommand } from './promote';

import packageJson from '../package.json';

const NETWORK_HELP = 'production|staging|local or a tRPC URL (default: production)';

const readDidkit = (): Promise<Buffer> => {
    const didkit = fs.readFile(
        require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
    );
    // Commands that never sign never await this; don't let a missing file become an unhandled rejection.
    didkit.catch(() => {});
    return didkit;
};

/**
 * Shared runner for every subcommand. Sets up `out` for this run, validates `--network`
 * before any I/O, and in `--json` mode prints exactly one line on stdout: the success
 * result or the error envelope `{ok:false, command, error, code, hint?, detail?}` (plus
 * `identityCreated` when the command created a new identity before failing).
 * Exits with `process.exitCode` (e.g. 1 for an unverified credential) on success, 1 on error.
 */
export const runCommand: RunCommand = async (command, options, action, settings = {}) => {
    out.json = !!options.json;
    out.result = {};
    let failure: { error: unknown } | undefined;
    try {
        if (options.network) validateNetwork(options.network);
        await action(readDidkit());
    } catch (error) {
        failure = { error };
    }
    if (!failure) {
        if (out.json)
            process.stdout.write(JSON.stringify({ ok: true, command, ...out.result }) + '\n');
        return process.exit(process.exitCode || 0);
    }
    if (out.json) {
        // A create-capable command may have written a new identity before failing later
        // (network error, failed send): report it so agents know the folder changed.
        const identityCreated = out.result.identityCreated;
        const envelope = {
            ...errorEnvelope(command, failure.error),
            ...(identityCreated ? { identityCreated } : {}),
        };
        process.stdout.write(JSON.stringify(envelope) + '\n');
        return process.exit(1);
    }
    const lines = humanErrorLines(failure.error);
    for (const line of lines) console.error(line);
    const footer =
        failure.error instanceof CliError ? undefined : settings.humanFooter?.(lines[0]!);
    if (footer) console.error(footer);
    return process.exit(1);
};

const GLOBAL_OPTION_DEFAULTS = [
    {
        long: '--yes',
        flags: '-y, --yes',
        description: 'accepted for consistency; this command never prompts',
    },
    { long: '--json', flags: '--json', description: 'print a single JSON result on stdout' },
    {
        long: '--network',
        flags: '--network <url>',
        description: 'accepted for consistency; this command does not use it',
    },
] as const;

/** Commands that take none of the global flags (the interactive console). */
const GLOBAL_OPTION_EXCLUDED = new Set(['repl']);

/** Every leaf command under `command`, with its space-separated path (e.g. `inbox list`). */
export const leafCommands = (
    command: Command,
    prefix: string[] = []
): { path: string[]; command: Command }[] =>
    command.commands.flatMap(sub => {
        const path = [...prefix, sub.name()];
        return sub.commands.length ? leafCommands(sub, path) : [{ path, command: sub }];
    });

/**
 * Make the help footer true: every leaf command (except `repl`) accepts `-y`, `--json`
 * and `--network`. Commands for which a flag is meaningless accept and ignore it.
 */
export const applyGlobalOptions = (program: Command): void => {
    for (const { path, command } of leafCommands(program)) {
        if (GLOBAL_OPTION_EXCLUDED.has(path.join(' '))) continue;
        // commander 9's typings omit `options`; it is public at runtime.
        const { options } = command as unknown as { options: Option[] };
        for (const option of GLOBAL_OPTION_DEFAULTS) {
            if (!options.some(existing => existing.long === option.long))
                command.option(option.flags, option.description);
        }
    }
};

export interface UsageErrorIo {
    write: (line: string) => void;
    exit: (code: number) => never;
}

const defaultIo: UsageErrorIo = {
    write: line => {
        process.stdout.write(line);
    },
    exit: code => process.exit(code),
};

/**
 * With `--json` anywhere in argv, commander usage errors (unknown command or option,
 * missing argument or required option, missing subcommand) print one JSON line on stdout
 * — `{ok:false, command, code:'USAGE', error}` — and exit with commander's (non-zero)
 * code. Help and version output are unchanged. Human mode is untouched.
 */
export const configureJsonUsageErrors = (
    program: Command,
    argv: string[],
    io: UsageErrorIo = defaultIo
): void => {
    if (!argv.includes('--json')) return;
    const visit = (command: Command, name: string | null): void => {
        command.configureOutput({ outputError: () => {} });
        command.exitOverride((error: CommanderError) => {
            if (error.exitCode === 0) return io.exit(0);
            // A group (`inbox`, `org`, or the bare program) reports a missing subcommand as
            // help-with-error, or as "unknown option '--json'" because groups don't define it.
            const groupJson =
                error.code === 'commander.unknownOption' &&
                command.commands.length > 0 &&
                error.message.includes("'--json'");
            // `--json whoami`: the subcommand is there, but the flag came before it.
            const jsonBeforeSubcommand =
                groupJson &&
                command.commands.some(sub =>
                    [sub.name(), ...sub.aliases()].some(alias => argv.includes(alias))
                );
            const missingSubcommand =
                error.code === 'commander.help' || (groupJson && !jsonBeforeSubcommand);
            const prefix = name ? `${name} ` : '';
            const usageError = jsonBeforeSubcommand
                ? new CliError(
                      `--json must come after the command (e.g. npx @learncard/cli ${prefix}<command> --json).`,
                      { code: 'USAGE' }
                  )
                : missingSubcommand
                  ? new CliError(
                        `A subcommand is required. Run \`npx @learncard/cli ${prefix}--help\`.`,
                        { code: 'USAGE' }
                    )
                  : new CliError(error.message.replace(/^error:\s*/, '').trim(), {
                        code: 'USAGE',
                    });
            // Same envelope as runCommand: `error` is the first line, `detail` the full message.
            io.write(JSON.stringify(errorEnvelope(name, usageError)) + '\n');
            return io.exit(error.exitCode || 1);
        });
        for (const sub of command.commands) visit(sub, name ? `${name} ${sub.name()}` : sub.name());
    };
    visit(program, null);
};

const JOURNEY = [
    'send',
    'status',
    'whoami',
    'setup-signing',
    'token',
    'webhook',
    'consent-contract',
    'embed',
    'verify',
    'revoke',
    'open',
    'org',
    'doctor',
    'promote',
    'clr',
    'inbox',
    'refresh',
    'init',
    'repl',
];

export interface BuildProgramOptions {
    /** Action for `repl [seed]`; lives in index.tsx with the rest of the console. */
    runRepl: (seed?: string) => Promise<void> | void;
    /** Injected in tests so parsing can be checked without running a command. */
    run?: RunCommand;
}

/** Build the full `learncard` command tree. Parsing is left to the caller. */
export const buildProgram = ({ runRepl, run = runCommand }: BuildProgramOptions): Command => {
    const program = new Command();

    const commandOptions = (command: Command): Command =>
        command
            .option('-y, --yes', 'accept defaults without prompting')
            .option('--profile-id <id>', 'public handle for your issuer profile')
            .option('--network <url>', NETWORK_HELP)
            .option('--json', 'print a single JSON result on stdout');

    program
        .command('send [recipient]')
        .description(
            'Send a "Quickstart Complete" badge to an email, phone number, profile ID, or DID (prompts if omitted). Creates .env and send.mjs in the current folder.'
        )
        .option('-y, --yes', 'accept defaults without prompting')
        .option('--name <displayName>', 'display name for your issuer profile')
        .option('--badge <name>', 'name of the badge to send (default: "Quickstart Complete")')
        .option('--description <text>', 'badge description')
        .option(
            '--profile-id <id>',
            'public handle for your profile (default: derived from the display name)'
        )
        .option('--network <url>', NETWORK_HELP)
        .addOption(
            new Option(
                '--as <profileId>',
                'send as a profile you manage (from `org apply`), signed with its did:web'
            ).env('LEARNCARD_AS')
        )
        .option(
            '--template',
            'send using a reusable template and hosted signing authority (default once setup-signing or org apply has run)'
        )
        .option(
            '--no-template',
            'sign with the local key even if a signing authority is registered'
        )
        .option('--template-uri <uri>', 'send from a specific template (implies --template)')
        .option('--webhook-url <url>', 'receive ISSUANCE_DELIVERED / ISSUANCE_CLAIMED at this URL')
        .option('--suppress-delivery', 'skip the claim email; you deliver inbox.claimUrl yourself')
        .option(
            '--guardian-email <email>',
            "require a guardian's approval before the recipient can claim"
        )
        .option('--json', 'print a single JSON result on stdout')
        .action((recipient: string | undefined, options) =>
            run(
                'send',
                options,
                async didkit => {
                    const { runSend } = await import('./send');
                    await runSend(recipient, { ...options, didkit });
                },
                {
                    // Input mistakes are UsageErrors (CliError), which never get a footer;
                    // keep the docs link for unexpected network/auth failures.
                    humanFooter: () =>
                        'Troubleshooting: https://docs.learncard.com/start-here/your-first-integration#if-something-goes-wrong',
                }
            )
        );

    program
        .command('demo')
        .description('Guided demonstrations using real LearnCard credentials.')
        .command('refresh')
        .description('Send a demo badge, publish an update, and refresh the recipient’s copy.')
        .option('--inbox', 'use Universal Inbox deferred issuance for an address with no account')
        .option('--ui', 'claim and refresh in the local LearnCard app (interactive only)')
        .option(
            '--app-url <url>',
            'local LearnCard app URL for --ui (default: http://localhost:3000)'
        )
        .option(
            '--lca-url <url>',
            'local LCA URL for --inbox terminal mode (default: http://localhost:5100/trpc)'
        )
        .option(
            '--email [address]',
            'real-email mode: request a provisional claim email to your own address (requires --inbox --ui; prompts when omitted)'
        )
        .option('-y, --yes', 'run all steps without pausing')
        .option('--network <url>', 'local|staging or a tRPC URL', LOCAL_NETWORK)
        .option('--json', 'print a single JSON result on stdout (no pauses)')
        .action(options =>
            run('demo refresh', options, async didkit => {
                const { runDemoRefreshCommand } = await import('./demo-refresh-command');
                await runDemoRefreshCommand({ ...options, didkit });
            })
        );

    commandOptions(
        program
            .command('consent-contract')
            .description("Connect a user's LearnCard to your platform.")
    )
        .option('--name <name>', 'contract name (default: issuer display name)')
        .option(
            '--redirect-url <url>',
            'callback URL (default: http://localhost:3000/consent-callback)'
        )
        .option('--description <text>', 'what users see when asked to consent')
        .option(
            '--needs-guardian-consent',
            'GameFlow: minors need a guardian to approve the connection'
        )
        .action(options =>
            run('consent-contract', options, async didkit => {
                const { runConsentContract } = await import('./consent-contract');
                await runConsentContract({ ...options, didkit });
            })
        );

    commandOptions(program.command('embed').description('Put a Claim button on your site.'))
        .option('--name <name>', 'integration name (default: issuer display name)')
        .option(
            '--domains <origins>',
            'comma-separated origins (default: http://localhost:3000,http://localhost:5173)'
        )
        .option('--rotate-key', 'rotate the integration publishable key')
        .action(options =>
            run('embed', options, async didkit => {
                const { runEmbed } = await import('./embed');
                await runEmbed({ ...options, didkit });
            })
        );

    commandOptions(
        program
            .command('setup-signing')
            .description('Set up LearnCard to sign credentials for your project.')
    )
        .option('--name <name>', 'signing authority name (default: default-issuer)')
        .option('--endpoint <url>', 'register your own VC-API signing service instead (with --did)')
        .option('--did <did>', 'DID of your own signing service (with --endpoint)')
        .action(options =>
            run('setup-signing', options, async didkit => {
                const { runSetupSigning } = await import('./setup-signing');
                await runSetupSigning({ ...options, didkit });
            })
        );

    commandOptions(
        program.command('token').description('Create a scoped API token and reusable send.sh.')
    )
        .option('--name <name>', 'auth grant name (default: cli-<date>)')
        .option('--scope <scope>', 'space-separated permissions (default: boosts:write)')
        .option('--revoke <grantId>', 'revoke an existing auth grant')
        .option('--expires <days>', 'token lifetime in days (default: no expiry)')
        .option('--list', 'list your auth grants')
        .option('--show-secret', 'include the raw API token in --json output (default: omitted)')
        .action(options =>
            run('token', options, async didkit => {
                const { runToken } = await import('./token');
                await runToken({ ...options, didkit });
            })
        );

    program
        .command('verify <file>')
        .description('Verify a credential or presentation JSON file; use - for stdin.')
        .option(
            '--json',
            'print one JSON line: {ok, command, verified, result} (exit 1 when not verified)'
        )
        .action((file, options) =>
            run('verify', options, async didkit => {
                const { runVerify } = await import('./verify');
                await runVerify(file, { json: options.json, didkit });
            })
        );

    commandOptions(
        program
            .command('revoke <credentialUri>')
            .description('Revoke or suspend an issued credential on the network.')
    )
        .option('--suspend', 'suspend instead of permanently revoking')
        .option('--template-uri <uri>', 'template URI if it cannot be read from the credential')
        .option(
            '--recipient <profileId>',
            'recipient profile ID if it cannot be read from the credential'
        )
        .action((uri, options) =>
            run('revoke', options, async didkit => {
                const { runRevoke } = await import('./revoke');
                await runRevoke(uri, { ...options, didkit });
            })
        );

    commandOptions(
        program
            .command('status [activityId]')
            .description('What happened to a credential you sent: created, delivered, claimed.')
    )
        .option('--limit <n>', 'how many recent sends to list, 1–100 (default: 20)')
        .option(
            '--event <type>',
            'only list sends whose latest event is this: created|delivered|claimed|expired|failed'
        )
        .action((activityId, options) =>
            run('status', options, async didkit => {
                const { runStatus } = await import('./status');
                await runStatus(activityId, { ...options, didkit });
            })
        );

    program
        .command('open [target]')
        .description(
            'Open the LearnCard app signed in as this project. Targets: portal (default), wallet, template, contract, integration.'
        )
        .option('-y, --yes', 'accept defaults without prompting')
        .option('--network <url>', NETWORK_HELP)
        .option('--app-url <url>', 'LearnCard app URL for self-hosted or local networks')
        .option('--url-fragment', 'pass the seed in the URL fragment instead of the clipboard')
        .option('--no-browser', 'print the URL without opening a browser')
        .option('--show-secret', 'with --url-fragment, print the full URL including the seed')
        .option('--json', 'print a single JSON result on stdout')
        .action((target, options) =>
            run('open', options, async () => {
                const { runOpen, OPEN_TARGETS } = await import('./open');
                if (target && !(target in OPEN_TARGETS))
                    throw new CliError(
                        `Unknown target "${target}". Use one of: ${Object.keys(OPEN_TARGETS).join(', ')}.`,
                        { code: 'USAGE' }
                    );
                await runOpen(target, options);
            })
        );

    commandOptions(
        program.command('webhook [email]').description('Know when your credential was claimed.')
    )
        .option('--to <email>', 'recipient email')
        .option('--url <publicUrl>', 'public HTTPS webhook URL')
        .option('--port <n>', 'receiver port (default: 8787)')
        .option('--name <name>', 'display name for your issuer profile')
        .option(
            '--timeout <seconds>',
            'seconds to wait for webhook events in --json mode or without a terminal (default: 60)'
        )
        .option('--wait-for-claim', 'in --json mode, also wait for ISSUANCE_CLAIMED before exiting')
        .action((email, options) =>
            run('webhook', options, async didkit => {
                const { runWebhook } = await import('./webhook');
                await runWebhook(email, { ...options, didkit });
            })
        );

    registerOrgCommand(program, run);
    registerDoctorCommand(program, run);
    registerClrCommand(program, run);
    registerInboxCommand(program, run);
    registerRefreshCommand(program, run);
    registerWhoamiCommand(program, run);
    registerPromoteCommand(program, run);

    commandOptions(
        program
            .command('init')
            .description(
                "Create this folder's issuer identity and profile without sending anything."
            )
            .option('--name <displayName>', 'display name for your issuer profile')
    ).action(options =>
        run('init', options, async didkit => {
            const { runInit } = await import('./init');
            await runInit({ ...options, didkit });
        })
    );

    program
        .command('repl [seed]')
        .description('Interactive JavaScript console with a LearnCard preloaded (advanced).')
        .action(runRepl);

    applyGlobalOptions(program);

    program
        .name('learncard')
        .description(
            'Issue, track, and verify credentials from the terminal. Every command shares the .env in the current folder.'
        )
        .showSuggestionAfterError()
        .configureHelp({
            sortSubcommands: false,
            visibleCommands: cmd =>
                [...cmd.commands].sort(
                    (a, b) => JOURNEY.indexOf(a.name()) - JOURNEY.indexOf(b.name())
                ),
        })
        .addHelpText(
            'before',
            '\nStart here:  npx @learncard/cli send\nThen:        npx @learncard/cli status\n'
        )
        .addHelpText(
            'after',
            '\nEvery command except repl: -y skips prompts, --json prints one machine-readable result, --network production|staging|local|<url> picks the network.\n' +
                'Commands that only read (whoami, status, inbox list, doctor, ...) never create an identity; init, send, and org apply do.\n' +
                'Environment:\n' +
                '  LC_YES=1  Same as passing -y to every command.\n' +
                '  LCA_API_URL, NETWORK_URL  Override service URLs for self-hosted networks.\n'
        );

    program.version(packageJson.version);

    return program;
};

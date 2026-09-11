import fs from 'fs/promises';
import dns from 'node:dns';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { inspect } from 'node:util';

import { getTestCache } from '@learncard/core';
import { initLearnCard, emptyLearnCard, learnCardFromSeed } from '@learncard/init';
import { getLCAPlugin } from '@learncard/lca-api-plugin';
import { openBadgeV2Plugin } from '@learncard/open-badge-v2-plugin';
import * as types from '@learncard/types';
import { getLinkedClaimsPlugin } from '@learncard/linked-claims-plugin';
import gradient from 'gradient-string';
import figlet from 'figlet';
import { program } from 'commander';
import clipboard from 'clipboardy';

import { getLerRsPlugin } from '@learncard/ler-rs-plugin';
import { getRenderMethodPlugin } from '@learncard/render-method-plugin';

import { generateRandomSeed } from './random';
import { runSend } from './send';
import { out } from './out';
import {
    createLearnCardBundle,
    exportLearnCardBundle as writeLearnCardBundle,
    importLearnCardBundle,
    readLearnCardBundle,
    restoreLearnCardFromBundle as restoreBundle,
} from '@learncard/holder-continuity';
import {
    createExportLearnCardBundleHelper,
    createRestoreLearnCardFromBundleHelper,
} from './replHelpers';

import packageJson from '../package.json';

dns.setDefaultResultOrder('ipv4first');

type CliGlobals = {
    seed: string;
    generateRandomSeed: typeof generateRandomSeed;
    emptyLearnCard: typeof emptyLearnCard;
    learnCardFromSeed: typeof learnCardFromSeed;
    initLearnCard: typeof initLearnCard;
    learnCard: any;
    types: typeof types;
    getTestCache: typeof getTestCache;
    copy: typeof copyFunction;
    getLearnCardBundlePassword: typeof getLearnCardBundlePassword;
    exportLearnCardBundle: ReturnType<typeof createExportLearnCardBundleHelper>;
    importLearnCardBundle: typeof importLearnCardBundle;
    createLearnCardBundle: typeof createLearnCardBundle;
    readLearnCardBundle: typeof readLearnCardBundle;
    restoreLearnCardFromBundle: ReturnType<typeof createRestoreLearnCardFromBundleHelper>;
};

const cliGlobals = globalThis as typeof globalThis & CliGlobals;

type ReplCompletion = [string[], string];

const replGlobals = [
    'learnCard',
    'emptyLearnCard',
    'learnCardFromSeed',
    'initLearnCard',
    'seed',
    'generateRandomSeed',
    'types',
    'getTestCache',
    'copy',
    'getLearnCardBundlePassword',
    'exportLearnCardBundle',
    'importLearnCardBundle',
    'createLearnCardBundle',
    'readLearnCardBundle',
    'restoreLearnCardFromBundle',
];

const replCommands = ['.exit'];

const identifierPattern = /^[A-Za-z_$][\w$]*$/;

const colorizeName = (name: string): string => {
    const colorizedName = gradient(['cyan', 'green'])(name);

    if (colorizedName !== name || !process.stdout.isTTY) return colorizedName;

    return `\x1b[36m${name}\x1b[39m`;
};

const g = {
    learnCard: colorizeName('learnCard'),
    emptyLearnCard: colorizeName('emptyLearnCard'),
    learnCardFromSeed: colorizeName('learnCardFromSeed'),
    initLearnCard: colorizeName('initLearnCard'),
    seed: colorizeName('seed'),
    generateRandomSeed: colorizeName('generateRandomSeed'),
    types: colorizeName('types'),
    getTestCache: colorizeName('getTestCache'),
    getLearnCardBundlePassword: colorizeName('getLearnCardBundlePassword'),
    copy: colorizeName('copy'),
    exportLearnCardBundle: colorizeName('exportLearnCardBundle'),
    importLearnCardBundle: colorizeName('importLearnCardBundle'),
    createLearnCardBundle: colorizeName('createLearnCardBundle'),
    readLearnCardBundle: colorizeName('readLearnCardBundle'),
    restoreLearnCardFromBundle: colorizeName('restoreLearnCardFromBundle'),
};

const colorizeReplInput = (input: string): string => {
    return [...replGlobals]
        .sort((a, b) => b.length - a.length)
        .reduce((output, name) => {
            const colorizedName = g[name as keyof typeof g];

            if (!colorizedName) return output;

            return output.replace(new RegExp(`\\b${name}\\b`, 'g'), colorizedName);
        }, input);
};

const copyFunction = (text: string | object | number) => {
    if (typeof text === 'object') {
        text = JSON.stringify(text);
    }
    if (typeof text === 'number') {
        text = text.toString();
    }
    try {
        clipboard.writeSync(text);
        console.log('Copied to clipboard!');
    } catch (error) {
        console.error(
            'Failed to copy to clipboard:',
            error instanceof Error ? error.message : 'Unknown error'
        );
    }
};

const getLearnCardBundlePassword = async (prompt = 'Bundle password: '): Promise<string> => {
    process.stdout.write(prompt);

    const mutedOutput = new Writable({
        write(_chunk, _encoding, callback) {
            callback();
        },
    });
    const rl = createInterface({ input: process.stdin, output: mutedOutput, terminal: true });

    try {
        return await rl.question('');
    } finally {
        rl.close();
        process.stdout.write('\n');
    }
};

const globalAssignmentPattern = /^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*([\s\S]*?);?\s*$/;

const parseGlobalAssignment = (
    source: string
): { name: string; initializer: string } | undefined => {
    const match = source.match(globalAssignmentPattern);

    if (!match) return;

    const name = match[1];
    const initializer = match[2];

    if (!name || !initializer) return;

    return { name, initializer };
};

const getCurrentToken = (line: string): string => {
    return line.match(/(?:[A-Za-z_$][\w$]*\.)*[A-Za-z_$][\w$]*\.?$/)?.[0] ?? '';
};

const getCompletionBase = (token: string): string | undefined => {
    const lastDotIndex = token.lastIndexOf('.');

    if (lastDotIndex === -1) return;

    return token.slice(0, lastDotIndex);
};

const getCompletionPrefix = (token: string): string => {
    const lastDotIndex = token.lastIndexOf('.');

    if (lastDotIndex === -1) return token;

    return token.slice(lastDotIndex + 1);
};

const getOwnPropertyNames = (value: unknown): string[] => {
    if (value === null || value === undefined) return [];

    const names = new Set<string>();

    let current: unknown = Object(value);

    while (current && current !== Object.prototype) {
        for (const name of Object.getOwnPropertyNames(current)) names.add(name);

        current = Object.getPrototypeOf(current);
    }

    return [...names];
};

const completeBunReplInput = (line: string): ReplCompletion => {
    const token = getCurrentToken(line);

    if (!token) return [replCommands, ''];

    const base = getCompletionBase(token);
    const prefix = getCompletionPrefix(token);

    if (!base) {
        const completions = [...replCommands, ...replGlobals].filter(name =>
            name.startsWith(prefix)
        );

        return [completions.length ? completions : replGlobals, token];
    }

    try {
        const target = globalThis.eval(base) as unknown;
        const completions = getOwnPropertyNames(target)
            .filter(name => identifierPattern.test(name))
            .filter(name => name.startsWith(prefix))
            .map(name => `${base}.${name}`);

        return [completions, token];
    } catch {
        return [[], token];
    }
};

const evaluateBunReplInput = async (source: string): Promise<unknown> => {
    const trimmedSource = source.trim();
    const expressionSource = trimmedSource.replace(/;+\s*$/, '');
    const statements = trimmedSource
        .split(';')
        .map(statement => statement.trim())
        .filter(Boolean);

    try {
        return await globalThis.eval(`(async () => (${expressionSource}))()`);
    } catch {
        if (statements.length > 1) {
            const lastStatement = statements[statements.length - 1];

            if (lastStatement && !/^(?:const|let|var)\b/.test(lastStatement)) {
                const body = statements.slice(0, -1).join(';\n');
                const wrappedSource = `${body ? `${body};\n` : ''}return (${lastStatement});`;

                return await globalThis.eval(`(async () => { ${wrappedSource} })()`);
            }
        }

        const globalAssignment = parseGlobalAssignment(trimmedSource);

        if (globalAssignment) {
            const value = await globalThis.eval(
                `(async () => (${globalAssignment.initializer}))()`
            );
            (globalThis as Record<string, unknown>)[globalAssignment.name] = value;
            return value;
        }

        return await globalThis.eval(`(async () => { ${trimmedSource} })()`);
    }
};

const startReadlineRepl = async (colorize?: (input: string) => string): Promise<void> => {
    const rl = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: colorize ? colorize('> ') : '> ',
        completer: completeBunReplInput,
    });

    rl.prompt();

    for await (const line of rl) {
        const source = line.trim();

        if (source === '.exit') break;

        if (!source) {
            rl.prompt();

            continue;
        }

        try {
            const result = await evaluateBunReplInput(source);

            process.stdout.write(
                `${inspect(result, { depth: 6, colors: process.stdout.isTTY })}\n`
            );
        } catch (error) {
            process.stdout.write(
                `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`
            );
        }

        rl.prompt();
    }

    rl.close();
};

const startBunRepl = async (colorize: (input: string) => string): Promise<void> => {
    await startReadlineRepl(colorize);
};

const startCliRepl = async (colorize: (input: string) => string): Promise<void> => {
    if (!('Bun' in globalThis)) {
        const repl = await import('pretty-repl');

        repl.default.start();

        return;
    }

    await startBunRepl(colorize);
};

program
    .command('send <email>')
    .description(
        'Send a "Quickstart Complete" badge to an email address. Creates .env and send.mjs in the current folder.'
    )
    .option('-y, --yes', 'accept defaults without prompting')
    .option('--name <displayName>', 'display name for your issuer profile')
    .option('--badge <name>', 'name of the badge to send (default: "Quickstart Complete")')
    .option('--description <text>', 'badge description')
    .option(
        '--profile-id <id>',
        'public handle for your profile (default: derived from the display name)'
    )
    .option('--network <url>', 'network tRPC URL (default: production)')
    .option('--template', 'send using a reusable template and hosted signing authority')
    .option('--template-uri <uri>', 'send from a specific template (implies --template)')
    .option('--webhook-url <url>', 'receive ISSUANCE_DELIVERED / ISSUANCE_CLAIMED at this URL')
    .option('--suppress-delivery', 'skip the claim email; you deliver inbox.claimUrl yourself')
    .option(
        '--guardian-email <email>',
        "require a guardian's approval before the recipient can claim"
    )
    .option('--json', 'print a single JSON result on stdout')
    .action(
        async (
            email: string,
            opts: {
                yes?: boolean;
                name?: string;
                badge?: string;
                description?: string;
                profileId?: string;
                network?: string;
                template?: boolean;
                json?: boolean;
            }
        ) => {
            out.json = !!opts.json;
            out.result = {};
            const didkit = fs.readFile(
                require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
            );
            try {
                await runSend(email, { ...opts, didkit });
                if (out.json) {
                    process.stdout.write(
                        JSON.stringify({ ok: true, command: 'send', ...out.result }) + '\n'
                    );
                }
                process.exit(0);
            } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                const firstLine = message.split('\n')[0]!;
                if (out.json) {
                    process.stdout.write(
                        JSON.stringify({ ok: false, command: 'send', error: firstLine }) + '\n'
                    );
                    process.exit(1);
                }
                console.error(`\n${firstLine}`);
                // Input mistakes explain themselves; keep the docs link for network/auth failures.
                if (!/is not an email address/.test(firstLine))
                    console.error(
                        'Troubleshooting: https://docs.learncard.com/start-here/your-first-integration#if-something-goes-wrong'
                    );
                process.exit(1);
            }
        }
    );

const commandOptions = (command: ReturnType<typeof program.command>) =>
    command
        .option('-y, --yes', 'accept defaults without prompting')
        .option('--profile-id <id>', 'public handle for your issuer profile')
        .option('--network <url>', 'network tRPC URL or staging (default: production)')
        .option('--json', 'print a single JSON result on stdout');

/**
 * Shared runner for every subcommand except `send` (which has its own didkit/error
 * formatting). Sets up `out` for this run and, in `--json` mode, prints exactly one
 * envelope on stdout instead of the human-mode stderr message. Pass `wrap: false` for
 * commands (only `verify` today) that already print their own `--json` output.
 */
const runCommand = async (
    command: string,
    options: { json?: boolean },
    action: (didkit: Promise<Buffer>) => Promise<void>,
    wrap: boolean = true
) => {
    out.json = !!options.json;
    out.result = {};
    try {
        await action(
            fs.readFile(require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm'))
        );
        if (out.json && wrap) {
            process.stdout.write(JSON.stringify({ ok: true, command, ...out.result }) + '\n');
        }
        process.exit(process.exitCode || 0);
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message.split('\n')[0]!
                : 'Command failed. Please try again.';
        if (out.json && wrap) {
            process.stdout.write(JSON.stringify({ ok: false, command, error: message }) + '\n');
            process.exit(1);
        }
        console.error(message);
        process.exit(1);
    }
};

commandOptions(
    program.command('consent-contract').description("Connect a user's LearnCard to your platform.")
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
        runCommand('consent-contract', options, async didkit => {
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
        runCommand('embed', options, async didkit => {
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
        runCommand('setup-signing', options, async didkit => {
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
    .action(options =>
        runCommand('token', options, async didkit => {
            const { runToken } = await import('./token');
            await runToken({ ...options, didkit });
        })
    );

program
    .command('verify <file>')
    .description('Verify a credential or presentation JSON file; use - for stdin.')
    .option('--json', 'print the raw verification result')
    .action((file, options) =>
        runCommand(
            'verify',
            options,
            async didkit => {
                const { runVerify } = await import('./verify');
                await runVerify(file, { ...options, didkit });
            },
            false
        )
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
        runCommand('revoke', options, async didkit => {
            const { runRevoke } = await import('./revoke');
            await runRevoke(uri, { ...options, didkit });
        })
    );

commandOptions(
    program
        .command('status [activityId]')
        .description('What happened to a credential you sent: created, delivered, claimed.')
)
    .option('--limit <n>', 'how many recent sends to list (default: 20)')
    .option(
        '--event <type>',
        'only list sends whose latest event is this: created|delivered|claimed|expired|failed'
    )
    .action((activityId, options) =>
        runCommand('status', options, async didkit => {
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
    .option('--network <url>', 'network tRPC URL or staging (default: production)')
    .option('--app-url <url>', 'LearnCard app URL for self-hosted or local networks')
    .option('--url-fragment', 'pass the seed in the URL fragment instead of the clipboard')
    .option('--no-browser', 'print the URL without opening a browser')
    .option('--json', 'print a single JSON result on stdout')
    .action((target, options) =>
        runCommand('open', options, async () => {
            const { runOpen, OPEN_TARGETS } = await import('./open');
            if (target && !(target in OPEN_TARGETS))
                throw new Error(
                    `Unknown target "${target}". Use one of: ${Object.keys(OPEN_TARGETS).join(', ')}.`
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
        'in --json mode, seconds to wait for webhook events (default: 60)'
    )
    .option('--wait-for-claim', 'in --json mode, also wait for ISSUANCE_CLAIMED before exiting')
    .action((email, options) =>
        runCommand('webhook', options, async didkit => {
            const { runWebhook } = await import('./webhook');
            await runWebhook(email, { ...options, didkit });
        })
    );

const JOURNEY = [
    'send',
    'status',
    'setup-signing',
    'token',
    'webhook',
    'consent-contract',
    'embed',
    'verify',
    'revoke',
    'open',
    'init',
    'repl',
];

program
    .name('learncard')
    .description(
        'Issue, track, and verify credentials from the terminal. Every command shares the .env in the current folder.'
    )
    .showSuggestionAfterError()
    .configureHelp({
        sortSubcommands: false,
        visibleCommands: cmd =>
            [...cmd.commands].sort((a, b) => JOURNEY.indexOf(a.name()) - JOURNEY.indexOf(b.name())),
    })
    .addHelpText(
        'before',
        '\nStart here:  npx @learncard/cli send you@example.com\nThen:        npx @learncard/cli status\n'
    )
    .addHelpText(
        'after',
        '\nEvery command: -y skips prompts, --json prints one machine-readable result, --network staging|<url> picks the network.\n' +
            'Environment:\n' +
            '  LC_YES=1  Same as passing -y to every command.\n' +
            '  LCA_API_URL, NETWORK_URL  Override service URLs for self-hosted networks.\n'
    );

const runRepl = async (_seed: string = generateRandomSeed()) => {
    console.clear();

    const envSeed = process.env.LEARNCARD_CLI_SEED ?? process.env.SEED;
    const seedInput = envSeed ?? _seed;
    const seed = seedInput.padStart(64, '0');

    console.log(
        gradient(['cyan', 'green'])(figlet.textSync('Learn Card', { font: 'Big Money-ne' }))
    );
    console.log('Welcome to the Learn Card CLI!\n');

    console.log(`Your seed is ${seed}\n`);

    if (envSeed) {
        console.log('Using seed from LEARNCARD_CLI_SEED / SEED.\n');
    }

    console.log('Creating wallet...');

    cliGlobals.seed = seed;
    cliGlobals.generateRandomSeed = generateRandomSeed;
    cliGlobals.emptyLearnCard = emptyLearnCard;
    cliGlobals.learnCardFromSeed = learnCardFromSeed;
    cliGlobals.initLearnCard = initLearnCard;

    const didkit = fs.readFile(
        require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
    );

    const _learnCard = await initLearnCard({
        seed,
        network: true,
        allowRemoteContexts: true,
        didkit,
    });

    const lcaApiLc = await _learnCard.addPlugin(
        await getLCAPlugin(_learnCard, 'https://api.learncard.app/trpc')
    );

    cliGlobals.learnCard = await lcaApiLc.addPlugin(getLerRsPlugin(lcaApiLc));
    // Add LinkedClaims plugin so endorse/verify/store/getEndorsements are available in the CLI
    cliGlobals.learnCard = await cliGlobals.learnCard.addPlugin(
        getLinkedClaimsPlugin(cliGlobals.learnCard)
    );

    // Add OpenBadge v2 wrapper plugin for backwards-compatible OBv2 -> VC wrapping
    cliGlobals.learnCard = await cliGlobals.learnCard.addPlugin(
        openBadgeV2Plugin(cliGlobals.learnCard)
    );

    // Add Render Method plugin for attaching W3C renderMethod to VCs
    cliGlobals.learnCard = await cliGlobals.learnCard.addPlugin(
        getRenderMethodPlugin(cliGlobals.learnCard)
    );

    cliGlobals.types = types;
    cliGlobals.getTestCache = getTestCache;

    cliGlobals.copy = copyFunction;
    cliGlobals.getLearnCardBundlePassword = getLearnCardBundlePassword;
    cliGlobals.exportLearnCardBundle = createExportLearnCardBundleHelper(
        writeLearnCardBundle,
        cliGlobals.learnCard
    );

    cliGlobals.restoreLearnCardFromBundle = createRestoreLearnCardFromBundleHelper(restoreBundle, {
        network: true,
        allowRemoteContexts: true,
        didkit,
    });
    cliGlobals.importLearnCardBundle = importLearnCardBundle;
    cliGlobals.createLearnCardBundle = createLearnCardBundle;
    cliGlobals.readLearnCardBundle = readLearnCardBundle;

    // delete 'Creating wallet...' message
    process.stdout.moveCursor?.(0, -1);
    process.stdout.clearLine?.(1);

    console.log('Wallet created!\n');

    console.log('┌───────────────────────────────────────────────────────────────┐');
    console.log('│                        Variables Available                    │');
    console.log('├────────────────────────────┬──────────────────────────────────┤');
    console.log('│      Variable              │             Description          │');
    console.log('├────────────────────────────┼──────────────────────────────────┤');
    console.log(`│                  ${g.learnCard} │ Learn Card Wallet                │`);
    console.log(`│              ${g.initLearnCard} │ Wallet Instantiation Function    │`);
    console.log(`│                       ${g.seed} │ Seed used to generate wallet     │`);
    console.log(`│         ${g.generateRandomSeed} │ Generates a random seed          │`);
    console.log(`│                      ${g.types} │ Helpful zod validators           │`);
    console.log(`│                       ${g.copy} │ Copy text to clipboard           │`);
    console.log(`│ ${g.getLearnCardBundlePassword} │ Prompt for bundle password      │`);
    console.log(`│      ${g.exportLearnCardBundle} │ Export wallet continuity ZIP     │`);
    console.log(`│      ${g.importLearnCardBundle} │ Import continuity ZIP            │`);
    console.log(`│ ${g.restoreLearnCardFromBundle} │ Restore original wallet from ZIP │`);
    console.log('└────────────────────────────┴──────────────────────────────────┘');

    console.log('');

    console.log('For help/documentation regarding your wallet, please read the documentation at\n');

    console.log('https://docs.learncard.com/sdks/learncard-core/construction\n');

    console.log("To get a feel for what's possible, try some of the following commands\n");

    console.log(
        '┌─────────────────────────┬───────────────────────────────────────────────────────────────────────────────────┐'
    );
    console.log(
        '│        Description      │                       Command                                                     │'
    );
    console.log(
        '├─────────────────────────┼───────────────────────────────────────────────────────────────────────────────────┤'
    );
    console.log(
        `│           View your did │ ${g.learnCard}.id.did();                                                               │`
    );
    console.log(
        `│ Generate an unsigned VC │ ${g.learnCard}.invoke.getTestVc();                                                     │`
    );
    console.log(
        `│       Issue a signed VC │ await ${g.learnCard}.invoke.issueCredential(uvc);                                      │`
    );
    console.log(
        `│      Verify a signed VC │ await ${g.learnCard}.invoke.verifyCredential(vc);                                      │`
    );
    console.log(
        `│       Issue a signed VP │ await ${g.learnCard}.invoke.issuePresentation(vc);                                     │`
    );
    console.log(
        `│      Verify a signed VP │ await ${g.learnCard}.invoke.verifyPresentation(vp);                                    │`
    );
    console.log(
        `│  Prompt bundle password │ const password = await ${g.getLearnCardBundlePassword}();                         │`
    );
    console.log(
        `│       Export wallet ZIP │ await ${g.exportLearnCardBundle}(${g.learnCard}, { out: './export.zip', password }); │`
    );
    console.log(
        `│ Restore original wallet │ await ${g.restoreLearnCardFromBundle}('./export.zip', { password });                │`
    );
    console.log(
        '└─────────────────────────┴───────────────────────────────────────────────────────────────────────────────────┘'
    );

    console.log('');

    await startCliRepl(colorizeReplInput);
};

commandOptions(
    program
        .command('init')
        .description("Create this folder's issuer identity and profile without sending anything.")
        .option('--name <displayName>', 'display name for your issuer profile')
).action(options =>
    runCommand('init', options, async didkit => {
        const { runInit } = await import('./init');
        await runInit({ ...options, didkit });
    })
);

program
    .command('repl [seed]')
    .description('Interactive JavaScript console with a LearnCard preloaded (advanced).')
    .action(runRepl);

program.version(packageJson.version);

// Bare `learncard` with a TTY opens the console, as it always has; anything else is a command.
if (process.argv.length <= 2 && process.stdin.isTTY) {
    runRepl();
} else {
    program.parse(process.argv);
}

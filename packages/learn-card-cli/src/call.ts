import { Option, type Command } from 'commander';

import { out } from './out';
import { CliError, UsageError } from './errors';
import {
    connect,
    connectAsManaged,
    loadProject,
    networkLabel,
    requireIdentity,
    resolveServices,
    type ProjectOptions,
} from './project';
import { seedRedactions, toJsonSafe, type JsonValue } from './serialize';
import { defaultJsonInputIo, readJsonInput, type JsonInputIo } from './json-input';
import {
    CHAIN_METHODS,
    ETHEREUM_DEFAULT_CHAIN,
    STATIC_INVOKE_METHODS,
    classifyMethod,
    suggestMethods,
    type MethodEffect,
} from './method-catalog';
import type { RunCommand } from './doctor';

export interface CallOptions extends ProjectOptions {
    /** JSON: an array is the positional arguments; any other value is the single argument. */
    args?: string;
    /** Act as a profile this folder manages (from `org apply`). */
    as?: string;
    /** Allow a method classified as write. `-y` never implies this. */
    write?: boolean;
    /** Print what would be called without loading a wallet or touching the network. */
    dryRun?: boolean;
    /** List invoke methods instead of calling one. */
    list?: boolean;
    /** Allow methods whose result is a secret (keys, API tokens, DID-Auth VPs). */
    showSecret?: boolean;
    /**
     * Ethereum chain for the Ethereum plugin (e.g. `sepolia`, `mainnet`). Required for
     * on-chain methods (CHAIN_METHODS); never inferred from `--network`.
     */
    chain?: string;
}

const MAINNET_ALIASES: ReadonlySet<string> = new Set(['mainnet', 'homestead', 'ethereum']);
const CHAIN_NAME = /^[a-z][a-z0-9-]{0,63}$/;

/**
 * Validate a `--chain` value and canonicalize it: lower case, and the ethers aliases of
 * Ethereum mainnet (`homestead`, `ethereum`) become `mainnet`.
 */
export const normalizeChain = (chain: string): string => {
    const name = chain.trim().toLowerCase();
    if (!CHAIN_NAME.test(name))
        throw new UsageError(
            `--chain "${chain}" is not a chain name. Use an ethers network name such as sepolia or mainnet.`
        );
    return MAINNET_ALIASES.has(name) ? 'mainnet' : name;
};

/**
 * The chain an Ethereum plugin reports from `getCurrentNetwork()` (an ethers Networkish:
 * a name, a chain id, or `{ name, chainId }`), canonicalized like `normalizeChain`;
 * `undefined` when it cannot be read.
 */
export const effectiveChainOf = (network: unknown): string | undefined => {
    if (typeof network === 'string') {
        const name = network.trim().toLowerCase();
        return MAINNET_ALIASES.has(name) ? 'mainnet' : name || undefined;
    }
    if (typeof network === 'number') return network === 1 ? 'mainnet' : String(network);
    if (network && typeof network === 'object') {
        const { name, chainId } = network as { name?: unknown; chainId?: unknown };
        return effectiveChainOf(name) ?? effectiveChainOf(chainId);
    }
    return undefined;
};

/**
 * Read the Ethereum plugin's effective chain from the connected wallet and refuse unless
 * it is exactly the chain `--chain` asked for. Runs before any on-chain method is invoked.
 */
export const assertEffectiveChain = async (
    invoke: Record<string, unknown>,
    chain: string
): Promise<void> => {
    const getCurrentNetwork = Object.prototype.hasOwnProperty.call(invoke, 'getCurrentNetwork')
        ? invoke.getCurrentNetwork
        : undefined;
    const effective =
        typeof getCurrentNetwork === 'function'
            ? effectiveChainOf(await (getCurrentNetwork as () => unknown)())
            : undefined;
    if (effective !== chain)
        throw new CliError(
            effective
                ? `The wallet's Ethereum plugin is on ${effective}, not --chain ${chain}; nothing was submitted.`
                : `Could not confirm the wallet's Ethereum chain is ${chain}; nothing was submitted.`,
            {
                code: 'CHAIN_MISMATCH',
                hint: 'Re-run with the --chain the wallet is on only if that is the chain you intend (check with --dry-run).',
            }
        );
};

const METHOD_NAME = /^[A-Za-z_$][\w$]*$/;

/** Accept `getProfile` and `invoke.getProfile` / `learnCard.invoke.getProfile`. */
export const normalizeMethodName = (method: string): string => {
    const name = method.trim().replace(/^(?:learnCard\.)?invoke\./, '');
    if (!METHOD_NAME.test(name))
        throw new UsageError(
            `"${method}" is not a method name. Pass an invoke method such as getProfile.`,
            'List methods with `npx @learncard/cli call --list`.'
        );
    return name;
};

/**
 * Turn `--args` into the positional argument list: a JSON array is spread as the
 * arguments, any other JSON value is passed as the single argument, no `--args` means none.
 */
export const parseCallArgs = async (
    args: string | undefined,
    io: JsonInputIo = defaultJsonInputIo
): Promise<unknown[]> => {
    if (args === undefined) return [];
    const parsed = await readJsonInput(args, '--args', io);
    return Array.isArray(parsed) ? parsed : [parsed];
};

const flagHint = (method: string, flag: string, args: string | undefined): string =>
    `Re-run with ${flag} if you intend this: npx @learncard/cli call ${method}${args !== undefined ? ' --args ...' : ''} ${flag}`;

/** Refuse a write or secret method unless the matching flag was passed. Pure; no I/O. */
export const assertCallAllowed = (
    method: string,
    options: Pick<CallOptions, 'write' | 'showSecret' | 'args' | 'chain'>
): void => {
    const { effect, secret } = classifyMethod(method);
    if (effect === 'write' && !options.write)
        throw new CliError(
            `${method} can change data on the LearnCard Network, so it needs --write.`,
            {
                code: 'WRITE_REQUIRES_FLAG',
                hint: `${flagHint(method, '--write', options.args)} (check first with --dry-run). -y does not imply --write.`,
            }
        );
    if (secret && !options.showSecret)
        throw new CliError(`${method} returns a secret, so it needs --show-secret.`, {
            code: 'SECRET_REQUIRES_FLAG',
            hint: `${flagHint(method, '--show-secret', options.args)}. Do not paste the output into logs or chats.`,
        });
    if (CHAIN_METHODS.has(method) && !options.chain)
        throw new CliError(
            `${method} submits an Ethereum transaction, so it needs --chain naming the chain you intend.`,
            {
                code: 'CHAIN_REQUIRED',
                hint: `The Ethereum plugin defaults to ${ETHEREUM_DEFAULT_CHAIN} (real funds) regardless of --network. Pass a testnet such as --chain sepolia; any mainnet (Ethereum, Polygon, Arbitrum, Optimism, ...) moves real funds, so name it only if you mean that, and check first with --dry-run.`,
            }
        );
};

type Invoke = Record<string, unknown>;

const invokeMethods = (invoke: Invoke): string[] =>
    Object.keys(invoke)
        .filter(name => typeof invoke[name] === 'function')
        .sort();

export interface CallListEntry {
    name: string;
    effect: MethodEffect;
    secret?: true;
    /** Submits an on-chain transaction; needs --chain. */
    chain?: true;
}

const listEntries = (names: readonly string[]): CallListEntry[] =>
    names.map(name => {
        const { effect, secret } = classifyMethod(name);
        return {
            name,
            effect,
            ...(secret ? { secret: true as const } : {}),
            ...(CHAIN_METHODS.has(name) ? { chain: true as const } : {}),
        };
    });

/**
 * `call --list`: with an identity, the methods the live wallet exposes (read-only connect);
 * without one, or with `--dry-run`, the static catalog without connecting. Never creates
 * an identity.
 */
export const runCallList = async (options: CallOptions): Promise<void> => {
    const project = await loadProject(process.cwd());
    let names: readonly string[];
    let source: 'wallet' | 'static';
    if (project.env.SECURE_SEED && !options.dryRun) {
        // Enumerating must not write: no .env rewrite and no LearnCloud DID association.
        const readOnly = { ...options, readOnly: true, associateDids: false };
        const learnCard = options.as
            ? await connectAsManaged(project, readOnly, options.as)
            : await connect(project, readOnly);
        names = invokeMethods(learnCard.invoke as unknown as Invoke);
        source = 'wallet';
    } else {
        names = STATIC_INVOKE_METHODS;
        source = 'static';
        out.log(
            options.dryRun
                ? '--dry-run: showing the built-in method list without connecting.'
                : 'No identity in this folder; showing the built-in method list (run `init` to list the live wallet).'
        );
    }
    const methods = listEntries(names);
    const width = Math.max(...methods.map(entry => entry.name.length), 4);
    for (const entry of methods)
        out.log(
            `${entry.name.padEnd(width)}  ${entry.effect}${entry.secret ? ' (secret)' : ''}${entry.chain ? ' (on-chain)' : ''}`
        );
    out.log(
        '\nread methods run as-is; write methods need --write; secret methods need --show-secret; on-chain methods need --chain.'
    );
    out.set({ source, ...(options.dryRun ? { dryRun: true } : {}), methods });
};

/**
 * Catch a likely typo before the write gate: a name that is not in the static catalog
 * but is close to names that are gets UNKNOWN_METHOD with suggestions instead of a
 * WRITE_REQUIRES_FLAG hint that would ask the user to approve a write to a method that
 * does not exist. Names with no close match fall through: the live wallet may expose
 * methods the catalog lacks, and the authoritative check runs after connecting.
 */
export const assertLikelyKnownMethod = (method: string): void => {
    if (STATIC_INVOKE_METHODS.includes(method)) return;
    if (classifyMethod(method).effect === 'read') return;
    const suggestions = suggestMethods(method, STATIC_INVOKE_METHODS);
    if (suggestions.length === 0) return;
    throw new CliError(`Unknown method "${method}".`, {
        code: 'UNKNOWN_METHOD',
        hint: `Did you mean ${suggestions.join(', ')}? List all with \`npx @learncard/cli call --list\` (if it lists "${method}", re-run with --write).`,
    });
};

/**
 * `learncard call <method>`: invoke `learnCard.invoke[method](...args)` as this folder's
 * identity (or a managed profile with `--as`) and print the JSON-safe result.
 * Never creates an identity, never rewrites `.env`, never prints the seed.
 */
export const runCall = async (
    method: string | undefined,
    options: CallOptions,
    io: JsonInputIo = defaultJsonInputIo
): Promise<void> => {
    if (options.list) return runCallList(options);
    if (!method)
        throw new UsageError(
            'A method name is required, e.g. `npx @learncard/cli call getProfile`.',
            'List methods with `npx @learncard/cli call --list`.'
        );
    const name = normalizeMethodName(method);
    const chain = options.chain === undefined ? undefined : normalizeChain(options.chain);
    const args = await parseCallArgs(options.args, io);
    const { effect, secret } = classifyMethod(name);
    const onChain = CHAIN_METHODS.has(name);

    if (options.dryRun) {
        // Reads .env only to report the network; never connects or writes.
        const project = await loadProject(process.cwd());
        const { network } = resolveServices(project.env, options.network);
        const missing = [
            ...(effect === 'write' && !options.write ? ['--write'] : []),
            ...(secret && !options.showSecret ? ['--show-secret'] : []),
            ...(onChain && !chain ? ['--chain <name>'] : []),
        ];
        const allowed = missing.length === 0;
        const preview = {
            dryRun: true,
            method: name,
            args: toJsonSafe(args, { redact: seedRedactions(project.env.SECURE_SEED) }),
            effect,
            // Alias of `effect`, the field name used by the design spec.
            classification: effect,
            ...(secret ? { secret: true } : {}),
            as: options.as ?? null,
            network,
            identity: !!project.env.SECURE_SEED,
            known: STATIC_INVOKE_METHODS.includes(name),
            allowed,
            // Dry-run never connects: `effective` is what --chain will require the wallet
            // to report, or the plugin default when --chain is missing.
            ...((onChain || chain) && {
                chain: {
                    effective: chain ?? ETHEREUM_DEFAULT_CHAIN,
                    requested: chain ?? null,
                    pluginDefault: ETHEREUM_DEFAULT_CHAIN,
                    required: onChain,
                },
            }),
        };
        out.log(
            `Would call ${name}(${args.length} arg${args.length === 1 ? '' : 's'}) as ${options.as ?? 'this folder'} on ${networkLabel(network)} [${effect}${secret ? ', secret' : ''}].`
        );
        if (onChain || chain)
            out.log(
                chain
                    ? `Ethereum chain: ${chain} (checked against the wallet before submitting).`
                    : `Ethereum chain: ${ETHEREUM_DEFAULT_CHAIN} by default, independent of --network; --chain is required to run it.`
            );
        if (!allowed) out.log(`Not allowed yet: add ${missing.join(' and ')} to run it.`);
        if (!preview.identity) out.log('No identity in this folder: the real call would fail.');
        out.set(preview);
        return;
    }

    if (!options.write) assertLikelyKnownMethod(name);
    assertCallAllowed(name, options);

    const project = await loadProject(process.cwd());
    const seed = requireIdentity(project);
    // Never rewrite .env. Read calls must not write anything: with association off,
    // LearnCloud cannot addDid / setPrimaryDid the profile's did:web the network plugin
    // switches to. Writes (--write) keep the SDK default so LearnCloud data stays on
    // the account the app associates.
    const connectOptions = {
        ...options,
        ...(effect === 'read' && { associateDids: false }),
        ...(chain && { ethereumChain: chain }),
    };
    const learnCard = options.as
        ? await connectAsManaged(
              project,
              { ...connectOptions, readOnly: effect === 'read' },
              options.as
          )
        : await connect(project, { ...connectOptions, readOnly: true });
    const invoke = learnCard.invoke as unknown as Invoke;
    const fn = Object.prototype.hasOwnProperty.call(invoke, name) ? invoke[name] : undefined;
    if (typeof fn !== 'function') {
        const suggestions = suggestMethods(name, invokeMethods(invoke));
        throw new CliError(`Unknown method "${name}" on this wallet.`, {
            code: 'UNKNOWN_METHOD',
            hint: suggestions.length
                ? `Did you mean ${suggestions.join(', ')}? List all with \`npx @learncard/cli call --list\`.`
                : 'List methods with `npx @learncard/cli call --list`.',
        });
    }

    if (chain) await assertEffectiveChain(invoke, chain);

    let result: unknown;
    try {
        result = await (fn as (...input: unknown[]) => unknown)(...args);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const scrubbed = String(toJsonSafe(message, { redact: seedRedactions(seed) }));
        throw new CliError(`${name} failed: ${scrubbed.split('\n')[0]}`, {
            code: 'CALL_FAILED',
            hint: 'Check the arguments against the SDK reference (https://docs.learncard.com/sdks/learncard-core).',
            ...(scrubbed.includes('\n') ? { detail: scrubbed } : {}),
        });
    }

    const safe: JsonValue = toJsonSafe(result, { redact: seedRedactions(seed) });
    out.log(JSON.stringify(safe, null, 2));
    out.set({
        method: name,
        effect,
        ...(options.as ? { as: options.as } : {}),
        ...(chain ? { chain } : {}),
        result: safe,
    });
};

/** Register `learncard call`. */
export const registerCallCommand = (program: Command, run: RunCommand): void => {
    program
        .command('call [method]')
        .description(
            'Call any LearnCard SDK method (learnCard.invoke.<method>) as this folder’s identity. Reads run as-is; writes need --write.'
        )
        .option(
            '--args <json|@file|->',
            'arguments as JSON: an array is spread as positional arguments, any other value is the single argument'
        )
        .addOption(
            new Option('--as <profileId>', 'call as a profile you manage (from `org apply`)').env(
                'LEARNCARD_AS'
            )
        )
        .option('--write', 'allow methods that can change data (-y does not imply this)')
        .option('--show-secret', 'allow methods that return secrets (private keys, API tokens)')
        .option(
            '--chain <name>',
            'Ethereum chain for on-chain methods (required for transferTokens; any mainnet moves real funds)'
        )
        .option('--dry-run', 'print the method, arguments and classification without connecting')
        .option('--list', 'list invoke methods with their read/write classification')
        .option('--network <url>', 'production|staging|local or a tRPC URL (default: production)')
        .option('--json', 'print a single JSON result on stdout')
        .action((method: string | undefined, options: CallOptions) =>
            run('call', options, async didkit => {
                await runCall(method, { ...options, didkit });
            })
        );
};

/**
 * Machine-readable command manifest for `learncard commands --json`.
 *
 * The command list, arguments and options are read at runtime from the commander tree
 * built by `buildProgram()`, so they cannot drift from what the CLI actually accepts.
 * Everything commander cannot know (what a command changes, whether it may create an
 * identity, what its `--json` result contains, examples) lives in `COMMAND_METADATA`;
 * `manifest.test.ts` fails if a leaf command has no entry or an entry names no command.
 */
import type { Argument, Command, Option } from 'commander';

import packageJson from '../package.json';

/**
 * What a command changes.
 * - `read`: reads remote state (network, cloud) and changes nothing there.
 * - `write`: can create or change remote state (profiles, credentials, grants, ...).
 * - `local`: touches only local files, stdout or the browser; no LearnCard state changes.
 * - `varies`: depends on the arguments (e.g. `call <method>`, `api <METHOD>`).
 */
export type CommandEffect = 'read' | 'write' | 'local' | 'varies';

/** Static facts about a command that the commander tree cannot express. */
export interface CommandMetadata {
    effect: CommandEffect;
    /** May write a new seed / `.env` (and usually a network profile) in the current folder. */
    createsIdentity: boolean;
    /** Contacts a LearnCard service (network, LearnCloud, LCA). */
    network: boolean;
    /** Key fields of the `--json` success result. */
    output: string;
    /** 2–3 runnable invocations; at least one uses `--json`. */
    examples: string[];
    /** Caveats an agent should know before running the command. */
    notes?: string;
}

export interface ManifestArgument {
    name: string;
    required: boolean;
    variadic: boolean;
}

export interface ManifestOption {
    flags: string;
    long?: string;
    short?: string;
    description: string;
    default?: unknown;
    required?: boolean;
    env?: string;
}

export interface ManifestEntry extends CommandMetadata {
    /** Full command path, e.g. `inbox list`. */
    name: string;
    description: string;
    arguments: ManifestArgument[];
    options: ManifestOption[];
}

export interface CommandManifest {
    version: string;
    commands: ManifestEntry[];
    globalOptions: { flags: string; description: string; appliesTo: string }[];
    envVars: { name: string; description: string }[];
    errorCodes: { code: string; meaning: string }[];
    docs: { cli: string; agents: string; llmsTxt: string; openapi: string };
}

const CLI = 'npx @learncard/cli';

/**
 * Per-command metadata, keyed by full command path. Includes commands other modules
 * register (`call`, `api`, `skill install`) so the manifest is complete once they are wired.
 */
export const COMMAND_METADATA: Readonly<Record<string, CommandMetadata>> = {
    send: {
        effect: 'write',
        createsIdentity: true,
        network: true,
        output: 'profileId, did, recipient, recipientKind, status (ISSUED|PENDING), activityId, templateUri, credentialUri?, issuanceId?, claimUrl?, files',
        examples: [
            `${CLI} send learner@yourdomain.com --network staging -y --json --suppress-delivery`,
            `${CLI} send learner@yourdomain.com --badge "Course Complete" --description "Finished the course" -y`,
            `${CLI} send learner@yourdomain.com --as district-12 --json`,
        ],
        notes: 'Delivers a real credential (and, without --suppress-delivery, a real claim email). Creates an identity and profile on first run.',
    },
    'demo refresh': {
        effect: 'write',
        createsIdentity: false,
        network: true,
        output: 'network, credentialUri | issuanceId, refreshId, before, after, version',
        examples: [
            `${CLI} demo refresh --network local -y`,
            `${CLI} demo refresh --network staging --json`,
        ],
        notes: 'Uses throwaway demo accounts, not the folder identity. Defaults to --network local.',
    },
    'consent-contract': {
        effect: 'write',
        createsIdentity: true,
        network: true,
        output: 'contractUri, consentUrl, returnTo, files',
        examples: [
            `${CLI} consent-contract --network staging --redirect-url https://app.example.org/callback --json`,
            `${CLI} consent-contract --name "Transcript sync" --description "Share your course credentials" -y`,
        ],
    },
    embed: {
        effect: 'write',
        createsIdentity: true,
        network: true,
        output: 'integrationId, publishableKey, whitelistedDomains, files',
        examples: [
            `${CLI} embed --network staging --domains https://app.example.org --json`,
            `${CLI} embed --rotate-key -y`,
        ],
        notes: 'Also registers a hosted signing authority and makes it primary, so later sends use template signing.',
    },
    'setup-signing': {
        effect: 'write',
        createsIdentity: true,
        network: true,
        output: 'profileId, signingAuthority {name, endpoint, did}, alreadyConfigured',
        examples: [
            `${CLI} setup-signing --network staging --json`,
            `${CLI} setup-signing --endpoint https://signer.example.org --did did:web:signer.example.org -y`,
        ],
    },
    token: {
        effect: 'write',
        createsIdentity: true,
        network: true,
        output: 'grantId, scope, tokenSavedTo, files (token only with --show-secret); --list: grants[]; --revoke: grantId',
        examples: [
            `${CLI} token --scope "boosts:write" --expires 30 --json`,
            `${CLI} token --list --json`,
            `${CLI} token --revoke <grantId> -y`,
        ],
        notes: '--list and --revoke only read/act on an existing identity and never create one. The token is saved to .env as API_TOKEN.',
    },
    verify: {
        effect: 'local',
        createsIdentity: false,
        network: false,
        output: 'verified, result {checks, warnings, errors}',
        examples: [`${CLI} verify credential.json --json`, `cat vp.json | ${CLI} verify -`],
        notes: 'Exits 1 when the credential does not verify. May fetch DID documents and JSON-LD contexts over HTTPS.',
    },
    revoke: {
        effect: 'write',
        createsIdentity: false,
        network: true,
        output: 'credentialUri, templateUri, recipient, action',
        examples: [
            `${CLI} revoke <credentialUri> --json`,
            `${CLI} revoke <credentialUri> --suspend -y`,
        ],
        notes: 'Permanent revocation cannot be undone; use --suspend for a reversible hold.',
    },
    status: {
        effect: 'read',
        createsIdentity: false,
        network: true,
        output: 'with activityId: activityId, state, recipient, ...; without: activities[] {activityId, state, recipient, template, at}',
        examples: [
            `${CLI} status --json`,
            `${CLI} status <activityId> --json`,
            `${CLI} status --event claimed --limit 50`,
        ],
    },
    open: {
        effect: 'local',
        createsIdentity: false,
        network: false,
        output: 'url (without the seed unless --show-secret), target, next, seedDelivery, seedInFragment?',
        examples: [`${CLI} open portal --no-browser --json`, `${CLI} open wallet`],
        notes: 'Hands the folder seed to the LearnCard app (clipboard on a TTY, or URL fragment). Never paste the seed into logs.',
    },
    webhook: {
        effect: 'write',
        createsIdentity: true,
        network: true,
        output: 'port, url, templateUri, issuanceId, events[]',
        examples: [
            `${CLI} webhook learner@yourdomain.com --url https://hooks.example.org/learncard --json --timeout 120`,
            `${CLI} webhook --to learner@yourdomain.com --port 8787`,
        ],
        notes: 'Sends a real credential to the recipient and waits for webhook events (bounded by --timeout without a TTY).',
    },
    'org apply': {
        effect: 'write',
        createsIdentity: true,
        network: true,
        output: 'changes[], outputs',
        examples: [
            `${CLI} org apply org.network.yaml --network staging --dry-run --json`,
            `${CLI} org apply org.network.yaml --network staging --secrets-out secrets.env -y --json`,
        ],
        notes: '--dry-run never writes .env and uses a read-only connection. Idempotent: safe to re-run.',
    },
    doctor: {
        effect: 'read',
        createsIdentity: false,
        network: true,
        output: 'network, checks[] {id, status, detail, fix}, ok (all checks passed)',
        examples: [
            `${CLI} doctor --json`,
            `${CLI} doctor --network staging --scopes "boosts:write" --strict`,
        ],
        notes: 'Exits 1 when a check fails. --webhook-url sends a test ping to that URL.',
    },
    'clr validate': {
        effect: 'local',
        createsIdentity: false,
        network: false,
        output: 'ok (valid), errors[], warnings[], summary; with --dry-run-sign: signed, verification',
        examples: [
            `${CLI} clr validate transcript.json --json`,
            `${CLI} clr validate transcript.json --profile official --dry-run-sign --network staging`,
        ],
        notes: '--dry-run-sign connects read-only to the network and refuses production without --allow-production.',
    },
    'inbox list': {
        effect: 'read',
        createsIdentity: false,
        network: true,
        output: 'records[] {issuanceId, status, recipient, created, name}, hasMore',
        examples: [
            `${CLI} inbox list --json`,
            `${CLI} inbox list --status PENDING --since 7d --limit 20 --json`,
            `${CLI} inbox list --as district-12`,
        ],
    },
    'refresh history': {
        effect: 'read',
        createsIdentity: false,
        network: true,
        output: 'refreshId, versions[] {version, publishedAt, updateSummary}, hasMore',
        examples: [
            `${CLI} refresh history <refreshId> --json`,
            `${CLI} refresh history <refreshId> --limit 5`,
        ],
    },
    whoami: {
        effect: 'read',
        createsIdentity: false,
        network: true,
        output: 'network, profileId, displayName, did, signingAuthority, managerDid, managed[], serviceAccounts[], actingAs',
        examples: [`${CLI} whoami --json`, `${CLI} whoami --network staging`],
    },
    promote: {
        effect: 'write',
        createsIdentity: true,
        network: true,
        output: 'from, to, targetDir, checklist[]',
        examples: [
            `${CLI} promote --from staging --to production --org org.network.yaml --dry-run --json`,
            `${CLI} promote --from staging --to production --org org.network.yaml -y`,
        ],
        notes: 'Writes the carried-over seed into a new target folder and applies the org spec on the target network. Preview with --dry-run first.',
    },
    init: {
        effect: 'write',
        createsIdentity: true,
        network: true,
        output: 'profileId, displayName, did, created, envPath',
        examples: [
            `${CLI} init --network staging --name "Example Academy" -y --json`,
            `${CLI} init --profile-id example-academy`,
        ],
    },
    repl: {
        effect: 'varies',
        createsIdentity: false,
        network: true,
        output: 'none (interactive; does not support --json)',
        examples: [
            `${CLI} repl`,
            // The seed comes from an exported variable (e.g. loaded from a secret store), never typed inline.
            `LEARNCARD_CLI_SEED="$LEARNCARD_CLI_SEED" ${CLI} repl`,
        ],
        notes: 'Interactive only. Uses LEARNCARD_CLI_SEED / SEED or a random seed (not the folder .env) on production. Export the seed from a secret store; never type it on the command line or pass it as the [seed] argument (shell history). Prefer `call` for scripted SDK access.',
    },
    commands: {
        effect: 'local',
        createsIdentity: false,
        network: false,
        output: 'version, commands[] {name, description, arguments, options, effect, createsIdentity, network, output, examples}, globalOptions, envVars, errorCodes, docs',
        examples: [
            `${CLI} commands --json`,
            `${CLI} commands inbox list --json`,
            `${CLI} commands`,
        ],
    },
    capabilities: {
        effect: 'local',
        createsIdentity: false,
        network: false,
        output: 'version, capabilities[] {id, title, summary, cli[], call[], api, docs, snippet?, notes?}',
        examples: [
            `${CLI} capabilities --json`,
            `${CLI} capabilities consentflow --json`,
            `${CLI} capabilities`,
        ],
    },
    call: {
        effect: 'varies',
        createsIdentity: false,
        network: true,
        output: 'method, effect (read|write), as?, result; --list: source, methods[]; --dry-run: dryRun, method, args, effect, secret?, as, network, identity, known, allowed (no connection)',
        examples: [
            `${CLI} call getProfile --args '["example-academy"]' --json`,
            `${CLI} call --list --json`,
            `${CLI} call createBoost --args @boost.json --write --dry-run --json`,
        ],
        notes: 'Methods that are not read-only (get/list/verify/...) require --write; -y does not imply it. Methods that return secrets need --show-secret. Never creates an identity.',
    },
    api: {
        effect: 'varies',
        createsIdentity: false,
        network: true,
        output: 'status, method, path, data; --dry-run: method, path, url, effect, allowed (token masked); --spec: specUrl, docsUrl (+ operations with --fetch)',
        examples: [
            `${CLI} api GET /activity/credentials --query limit=5 --json`,
            `${CLI} api POST /send --data @send.json --write --dry-run --json`,
        ],
        notes: 'Bearer token from LEARNCARD_API_KEY or API_TOKEN in .env (see `token`). Methods other than GET/HEAD require --write.',
    },
    'skill install': {
        effect: 'local',
        createsIdentity: false,
        network: false,
        output: 'dir, targets[], files[] (path, target, status); --print: target, content',
        examples: [
            `${CLI} skill install --json`,
            `${CLI} skill install --target cursor --dir .`,
            `${CLI} skill install --print`,
        ],
        notes: 'Refuses to overwrite a different existing file without --force.',
    },
};

/** Flags every leaf command except `repl` accepts (see `applyGlobalOptions` in program.ts). */
export const GLOBAL_OPTIONS: CommandManifest['globalOptions'] = [
    {
        flags: '-y, --yes',
        description: 'never prompt; accept defaults (same as LC_YES=1)',
        appliesTo: 'every command except repl',
    },
    {
        flags: '--json',
        description:
            'print exactly one JSON line on stdout: {ok:true, command, ...} or {ok:false, command, error, code, hint?, detail?}',
        appliesTo: 'every command except repl',
    },
    {
        flags: '--network <url>',
        description:
            'production|prod|staging|local or a tRPC URL; a folder is bound to the network it was created on',
        appliesTo: 'every command except repl (ignored by commands that do not use the network)',
    },
];

export const ENV_VARS: CommandManifest['envVars'] = [
    { name: 'LC_YES', description: 'Set to 1 to behave as if -y were passed to every command.' },
    {
        name: 'NETWORK_URL',
        description:
            'LearnCard Network tRPC URL (or production|staging|local). Also written to .env for non-production folders.',
    },
    { name: 'CLOUD_URL', description: 'LearnCloud storage URL override (self-hosted networks).' },
    { name: 'LCA_API_URL', description: 'LCA API URL override (self-hosted networks).' },
    {
        name: 'LEARNCARD_AS',
        description: 'Default for --as: act as a managed profile (send, inbox list, call).',
    },
    {
        name: 'LEARNCARD_API_KEY',
        description: 'Bearer token for `api`; overrides API_TOKEN from .env.',
    },
    {
        name: 'LEARNCARD_CLI_SEED',
        description: 'Seed for `repl` (alias SEED). Secret: never log or commit it.',
    },
];

export const ERROR_CODES: CommandManifest['errorCodes'] = [
    {
        code: 'USAGE',
        meaning:
            'Invalid command, flag, argument or missing value. Fix the invocation; nothing ran.',
    },
    {
        code: 'NO_IDENTITY',
        meaning:
            'No LearnCard identity in this folder. Run `init --network staging` (or `org apply`) first, or cd into the right folder.',
    },
    {
        code: 'ERROR',
        meaning: 'Unclassified failure (network, auth, remote rejection). See detail.',
    },
    {
        code: 'UNKNOWN_COMMAND',
        meaning: '`commands <name>` named no command. See hint for close matches.',
    },
    {
        code: 'UNKNOWN_CAPABILITY',
        meaning: '`capabilities <id>` named no capability. See hint for close matches.',
    },
    {
        code: 'WRITE_REQUIRES_FLAG',
        meaning:
            '`call`/`api` would change state; re-run with --write (after confirming with the user).',
    },
    {
        code: 'UNKNOWN_METHOD',
        meaning:
            '`call` method does not exist on this LearnCard. See hint for close matches, or `call --list`.',
    },
    {
        code: 'NO_API_TOKEN',
        meaning: '`api` found no bearer token. Run `token --scope ...` or set LEARNCARD_API_KEY.',
    },
    {
        code: 'HTTP_<status>',
        meaning: '`api` got a non-2xx response; detail holds the (truncated) response body.',
    },
    {
        code: 'SECRET_REQUIRES_FLAG',
        meaning:
            '`call` method returns a secret (key, API token); re-run with --show-secret only if the user wants it printed.',
    },
    {
        code: 'CALL_FAILED',
        meaning: '`call` method threw; detail holds the (scrubbed) error. Check the arguments.',
    },
    {
        code: 'NETWORK_ERROR',
        meaning: '`api` could not reach the network. Check --network and connectivity, then retry.',
    },
    { code: 'TIMEOUT', meaning: '`api` request exceeded --timeout. Retry or raise --timeout.' },
    {
        code: 'NETWORK_MISMATCH',
        meaning:
            "`api` was asked for a different network than the folder's API_TOKEN belongs to. Use a folder per network or LEARNCARD_API_KEY.",
    },
    {
        code: 'BAD_SPEC',
        meaning: '`api --spec --fetch` did not get an OpenAPI JSON document.',
    },
    {
        code: 'EXISTS',
        meaning:
            '`skill install` would overwrite a different file; re-run with --force to replace it.',
    },
];

export const DOCS_LINKS: CommandManifest['docs'] = {
    cli: 'https://docs.learncard.com/reference/learncard-cli',
    agents: 'https://docs.learncard.com/start-here/for-ai-agents',
    llmsTxt: 'https://docs.learncard.com/llms.txt',
    openapi: 'https://network.learncard.com/docs/openapi.json',
};

/** Listed last: interactive, takes no global flags, not part of the agent surface. */
const ORDER_LAST = new Set(['repl']);

/**
 * Every leaf command under `command`, with its space-separated path (e.g. `inbox list`).
 * Same walk as `leafCommands` in program.ts; kept local so this module has no runtime
 * dependency on the program builder.
 */
export const walkLeafCommands = (
    command: Command,
    prefix: string[] = []
): { name: string; command: Command }[] =>
    command.commands.flatMap(sub => {
        const path = [...prefix, sub.name()];
        return sub.commands.length
            ? walkLeafCommands(sub, path)
            : [{ name: path.join(' '), command: sub }];
    });

// commander 9 keeps arguments in `_args` and options in `options` (public at runtime, not typed).
const commandArguments = (command: Command): Argument[] => {
    const internal = command as unknown as { registeredArguments?: Argument[]; _args?: Argument[] };
    return internal.registeredArguments ?? internal._args ?? [];
};

const commandOptions = (command: Command): Option[] =>
    (command as unknown as { options: Option[] }).options;

const toManifestOption = (option: Option): ManifestOption => ({
    flags: option.flags,
    ...(option.long ? { long: option.long } : {}),
    ...(option.short ? { short: option.short } : {}),
    description: option.description,
    ...(option.defaultValue !== undefined ? { default: option.defaultValue } : {}),
    ...(option.mandatory ? { required: true } : {}),
    // commander 9's typings omit `envVar`; it is set by `.env()` at runtime.
    ...((option as Option & { envVar?: string }).envVar
        ? { env: (option as Option & { envVar?: string }).envVar }
        : {}),
});

/**
 * Build the manifest from a commander program. Commands without metadata are still listed
 * (with `effect: 'varies'`) so a missing entry never hides a command at runtime; the unit
 * test is what enforces completeness.
 */
export const buildManifest = (
    program: Command,
    version: string = packageJson.version
): CommandManifest => {
    const leaves = walkLeafCommands(program).filter(({ command }) => !isHidden(command));
    const ordered = [
        ...leaves.filter(({ name }) => !ORDER_LAST.has(name)),
        ...leaves.filter(({ name }) => ORDER_LAST.has(name)),
    ];
    const commands = ordered.map(({ name, command }): ManifestEntry => {
        const metadata: CommandMetadata = COMMAND_METADATA[name] ?? {
            effect: 'varies',
            createsIdentity: false,
            network: true,
            output: 'unknown',
            examples: [],
        };
        return {
            name,
            description: command.description(),
            arguments: commandArguments(command).map(argument => ({
                name: argument.name(),
                required: argument.required,
                variadic: argument.variadic,
            })),
            options: commandOptions(command)
                .filter(option => !option.hidden)
                .map(toManifestOption),
            ...metadata,
        };
    });
    return {
        version,
        commands,
        globalOptions: GLOBAL_OPTIONS,
        envVars: ENV_VARS,
        errorCodes: ERROR_CODES,
        docs: DOCS_LINKS,
    };
};

const isHidden = (command: Command): boolean =>
    !!(command as unknown as { _hidden?: boolean })._hidden;

const helpExamplesAdded = new WeakSet<Command>();

/**
 * Append an "Examples:" block (from `COMMAND_METADATA`) to each leaf command's `--help`.
 * Idempotent; call it after every command is registered.
 */
export const addHelpExamples = (program: Command): void => {
    for (const { name, command } of walkLeafCommands(program)) {
        const examples = COMMAND_METADATA[name]?.examples;
        if (!examples?.length || helpExamplesAdded.has(command)) continue;
        helpExamplesAdded.add(command);
        command.addHelpText('after', `\nExamples:\n${examples.map(e => `  $ ${e}`).join('\n')}\n`);
    }
};

/** Levenshtein distance, for "did you mean" suggestions. */
export const editDistance = (a: string, b: string): number => {
    const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let diagonal = previous[0]!;
        previous[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const above = previous[j]!;
            previous[j] = Math.min(
                above + 1,
                previous[j - 1]! + 1,
                diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
            diagonal = above;
        }
    }
    return previous[b.length]!;
};

/** Up to `limit` candidates closest to `input` (prefix/substring matches first). */
export const closestMatches = (input: string, candidates: string[], limit = 3): string[] => {
    const needle = input.toLowerCase();
    return candidates
        .map(candidate => {
            const lower = candidate.toLowerCase();
            const contains = lower.includes(needle) || needle.includes(lower);
            return { candidate, score: contains ? 0 : editDistance(needle, lower) };
        })
        .filter(({ score }) => score <= Math.max(2, Math.floor(needle.length / 3)))
        .sort((a, b) => a.score - b.score)
        .slice(0, limit)
        .map(({ candidate }) => candidate);
};

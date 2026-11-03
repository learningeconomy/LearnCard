import fs from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { randomUUID } from 'node:crypto';
import {
    initLearnCard,
    type DidWebNetworkLearnCardFromSeed,
    type NetworkLearnCardFromSeed,
} from '@learncard/init';
import { getLCAPlugin, initLCALearnCard, type LCALearnCard } from '@learncard/lca-api-plugin';
import { generateRandomSeed } from './random';
import { out } from './out';
import { CliError, NoIdentityError, UsageError } from './errors';

export const KEYS = {
    SECURE_SEED: 'SECURE_SEED', // Private issuer seed; never regenerate or print.
    PROFILE_ID: 'PROFILE_ID', // Public issuer handle shared by all commands.
    DISPLAY_NAME: 'DISPLAY_NAME', // Issuer display name; set at creation, then synced from the network.
    NETWORK_URL: 'NETWORK_URL', // Non-default network tRPC endpoint.
    SIGNING_AUTHORITY_NAME: 'SIGNING_AUTHORITY_NAME', // Registered primary signer name.
    SIGNING_AUTHORITY_ENDPOINT: 'SIGNING_AUTHORITY_ENDPOINT', // Hosted signing endpoint.
    API_TOKEN: 'API_TOKEN', // Secret bearer token for REST requests.
    API_TOKEN_SCOPE: 'API_TOKEN_SCOPE', // Space-separated permissions granted to the token.
    TEMPLATE_URI: 'TEMPLATE_URI', // Reusable Boost template on this network.
    CONTRACT_URI: 'CONTRACT_URI', // Consent contract for later commands.
    PUBLISHABLE_KEY: 'PUBLISHABLE_KEY', // Public integration client key.
    INTEGRATION_ID: 'INTEGRATION_ID', // Developer integration identifier.
} as const;

export interface Project {
    env: Record<string, string>;
    envPath: string;
    existing: string;
}

export interface ProjectOptions {
    yes?: boolean;
    name?: string;
    profileId?: string;
    network?: string;
    didkit?: Promise<Buffer>;
    json?: boolean;
    readOnly?: boolean;
    /**
     * `false` turns off LearnCloud's automatic DID association, so the wallet never
     * registers a new DID (`addDid` / `setPrimaryDid`) as a side effect of a LearnCloud
     * call. Unset keeps the SDK default (on), except `connectAsDidWeb` with `readOnly`.
     */
    associateDids?: boolean;
    /** Ethereum plugin chain (`ethereumConfig.network`). Unset keeps the SDK default (mainnet). */
    ethereumChain?: string;
}

/**
 * The `cloud` / `ethereumConfig` init fields `options` asks for (omitted when all are
 * defaults). With `readOnlyStopsAssociation`, `readOnly` also turns association off.
 */
const walletConfig = (
    options: ProjectOptions,
    cloudUrl: string | undefined,
    readOnlyStopsAssociation: boolean
): {
    cloud?: { url?: string; automaticallyAssociateDids?: false };
    ethereumConfig?: { network: string };
} => {
    const noAssociation =
        options.associateDids === false || (readOnlyStopsAssociation && !!options.readOnly);
    const cloud = {
        ...(cloudUrl && { url: cloudUrl }),
        ...(noAssociation && { automaticallyAssociateDids: false as const }),
    };
    return {
        ...(Object.keys(cloud).length > 0 && { cloud }),
        ...(options.ethereumChain && { ethereumConfig: { network: options.ethereumChain } }),
    };
};

export type NetworkCard = NetworkLearnCardFromSeed['returnValue'];
export type DidWebCard = DidWebNetworkLearnCardFromSeed['returnValue'];

export const parseEnv = (text: string): Record<string, string> => {
    const env: Record<string, string> = {};
    for (const line of text.split('\n')) {
        const match = line.match(/^\s*(?:export\s+)?([\w]+)\s*=\s*(.*)$/);
        if (!match) continue;
        const key = match[1]!;
        let value = match[2]!.trim();
        if (value.startsWith('"') || value.startsWith("'")) {
            const end = value.indexOf(value[0]!, 1);
            if (end < 0) throw new Error(`Unclosed quote in .env for ${key}.`);
            value = value.slice(1, end);
        } else value = value.split('#')[0]!.trim();
        if (key === 'SECURE_SEED' && env[key] !== undefined && env[key] !== value) {
            throw new Error('Conflicting SECURE_SEED entries in .env. Keep the original identity.');
        }
        Object.defineProperty(env, key, {
            value,
            enumerable: true,
            configurable: true,
            writable: true,
        });
    }
    return env;
};

export const upsertEnv = (text: string, values: Record<string, string>): string => {
    const lines = text ? text.replace(/\n$/, '').split('\n') : [];
    const seen = new Set<string>();
    const out = lines.map(line => {
        const key = line.match(/^\s*(?:export\s+)?([\w]+)\s*=/)?.[1];
        if (key && Object.prototype.hasOwnProperty.call(values, key)) {
            seen.add(key);
            // Quotes make multi-scope values safe in both dotenv and shell scripts.
            const value = values[key]!;
            if (/[\r\n]/.test(value)) throw new Error(`Invalid multiline value for ${key}`);
            return `${key}=${/^[a-zA-Z0-9_./:@*=%+-]*$/.test(value) ? value : JSON.stringify(value)}`;
        }
        return line;
    });
    for (const [key, value] of Object.entries(values)) {
        if (!seen.has(key)) out.push(upsertEnv(`${key}=\n`, { [key]: value }).trimEnd());
    }
    return `${out.join('\n')}\n`;
};

export const toProfileId = (displayName: string): string => {
    const base = displayName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 30);
    return `${base || 'issuer'}-${Math.random().toString(36).slice(2, 6)}`;
};

const readOptional = async (file: string): Promise<string> => {
    try {
        return await fs.readFile(file, 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
        throw error;
    }
};

export const loadProject = async (cwd: string): Promise<Project> => {
    const envPath = path.join(cwd, '.env');
    await assertRegularEnv(envPath);
    const existing = await readOptional(envPath);
    return { env: parseEnv(existing), envPath, existing };
};

const assertRegularEnv = async (envPath: string): Promise<void> => {
    const info = await fs.lstat(envPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return undefined;
        throw error;
    });
    if (info && !info.isFile()) throw new Error('.env must be a regular file, not a symlink.');
};

export const saveProject = async (
    project: Project,
    updates: Record<string, string>
): Promise<void> => {
    // Serialize CLI writers and atomically replace the file so a failed write cannot lose a seed.
    const lockPath = `${project.envPath}.lock`;
    const lock = await fs.open(lockPath, 'wx', 0o600).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'EEXIST')
            throw new Error(
                'Another command is updating .env. Retry when it finishes; remove a stale .env.lock only if no command is running.'
            );
        throw error;
    });
    const temporary = `${project.envPath}.${randomUUID()}.tmp`;
    try {
        await assertRegularEnv(project.envPath);
        const existing = await readOptional(project.envPath);
        const env = parseEnv(existing);
        if (
            env.SECURE_SEED &&
            updates.SECURE_SEED !== undefined &&
            env.SECURE_SEED !== updates.SECURE_SEED
        ) {
            throw new Error('Cannot replace an existing SECURE_SEED.');
        }
        const changed = Object.fromEntries(
            Object.entries(updates).filter(([key, value]) => env[key] !== value)
        );
        project.existing = existing;
        project.env = env;
        if (!Object.keys(changed).length) return;
        const next = upsertEnv(existing, changed);
        await fs.writeFile(temporary, next, { mode: 0o600, flag: 'wx' });
        await fs.rename(temporary, project.envPath);
        project.existing = next;
        Object.assign(project.env, changed);
        const keys = Object.keys(changed);
        const list =
            keys.length > 2
                ? `${keys.slice(0, -1).join(', ')}, and ${keys.at(-1)}`
                : keys.join(' and ');
        out.log(`Wrote ${list} to .env`);
    } finally {
        await fs.rm(temporary, { force: true });
        await lock.close();
        await fs.unlink(lockPath);
    }
};

/**
 * Never block on input from a script, CI job, or agent: only prompt when a human is at a
 * real TTY and neither `-y` nor `--json` was passed. A missing required value in
 * non-interactive mode is a `UsageError` (`code: 'USAGE'`).
 */
export const createPrompts = (yes?: boolean) => {
    // `--json` is non-interactive too: readline would write prompt text onto stdout,
    // which is reserved for the single JSON result line.
    const interactive = !yes && !out.json && !!process.stdin.isTTY && process.env.LC_YES !== '1';
    const rl = interactive
        ? createInterface({ input: process.stdin, output: process.stdout })
        : null;
    return {
        interactive,
        ask: async (question: string, fallback: string): Promise<string> => {
            if (rl) return (await rl.question(`${question} [${fallback}] `)).trim() || fallback;
            if (!fallback)
                throw new UsageError(
                    `${question} is required when running non-interactively. Pass it as an argument or flag.`
                );
            return fallback;
        },
        close: (): void => {
            rl?.close();
        },
    };
};

/** For commands that must never create an identity: fail fast when this folder has none. */
export const requireIdentity = (project: Project, hint?: string): string => {
    const seed = project.env.SECURE_SEED;
    if (!seed) throw new NoIdentityError(hint);
    return seed;
};

/** Profile IDs the network accepts: 3-40 lowercase letters, digits or hyphens. */
export const PROFILE_ID_PATTERN = /^[a-z0-9-]{3,40}$/;

/** Reject a malformed `--profile-id` before anything is written to `.env`. */
export const validateProfileIdOption = (profileId: string | undefined): void => {
    if (profileId !== undefined && !PROFILE_ID_PATTERN.test(profileId))
        throw new UsageError(
            `--profile-id "${profileId}" is invalid. Use 3-40 lowercase letters, digits or hyphens (e.g. acme-academy).`
        );
};

export const ensureIdentity = async (project: Project, options: ProjectOptions) => {
    validateProfileIdOption(options.profileId);
    if (
        project.env.PROFILE_ID &&
        options.profileId &&
        options.profileId !== project.env.PROFILE_ID
    ) {
        throw new Error(
            `This folder's .env is already the profile "${project.env.PROFILE_ID}"; --profile-id ${options.profileId} would not change that. ` +
                `To act as a profile you manage from here, use --as ${options.profileId}. To create a separate identity, run from a new folder.`
        );
    }
    // Validate --network before prompting or writing anything.
    const { network } = resolveServices(project.env, options.network);
    const existingProfileId = project.env.PROFILE_ID || options.profileId;
    let displayName = options.name ?? project.env.DISPLAY_NAME ?? '';
    if (!existingProfileId && !displayName) {
        const prompts = createPrompts(options.yes);
        try {
            displayName = await prompts.ask(
                'Display name for your issuer profile',
                'My Organization'
            );
        } finally {
            prompts.close();
        }
    }
    if (!displayName) displayName = 'My Organization';
    const created = !project.env.SECURE_SEED;
    const seed = project.env.SECURE_SEED || generateRandomSeed();
    const profileId = project.env.PROFILE_ID || options.profileId || toProfileId(displayName);
    await saveProject(project, {
        SECURE_SEED: seed,
        PROFILE_ID: profileId,
        ...(existingProfileId ? {} : { DISPLAY_NAME: displayName }),
    });
    if (created) {
        // Always stderr: creating a new identity (and, on first connect, a public profile)
        // is a side effect a script or agent must be able to see without parsing stdout.
        console.error(
            `Created a new ${networkLabel(network)} identity in ${path.dirname(project.envPath)} (seed saved to .env).`
        );
        out.set({ identityCreated: { profileId, network } });
    }
    await ensureGitignored(path.dirname(project.envPath), '.env');
    return { seed, profileId, displayName, created };
};

export const ensureGitignored = async (dir: string, entry: string): Promise<void> => {
    const gitignorePath = path.join(dir, '.gitignore');
    const gitignore = await readOptional(gitignorePath);
    if (await fs.stat(gitignorePath).catch(() => null)) {
        if (!gitignore.split('\n').some(line => line.trim() === entry)) {
            await fs.writeFile(gitignorePath, `${gitignore.replace(/\n?$/, '\n')}${entry}\n`);
            out.log(`Added ${entry} to .gitignore`);
        }
    } else {
        await fs.writeFile(gitignorePath, `${entry}\n`);
        out.log(`Created .gitignore with ${entry}`);
    }
};

export const PRODUCTION_NETWORK = 'https://network.learncard.com/trpc';
export const STAGING_NETWORK = 'https://staging.network.learncard.com/trpc';
/** A brain service started locally (`docker compose` / `bun dev`); matches `demo refresh`. */
export const LOCAL_NETWORK = 'http://localhost:4000/trpc';

/** Every `--network` (and `NETWORK_URL`) accepts these names as well as a tRPC URL. */
export const NETWORK_ALIASES: Readonly<Record<string, string>> = {
    production: PRODUCTION_NETWORK,
    prod: PRODUCTION_NETWORK,
    staging: STAGING_NETWORK,
    local: LOCAL_NETWORK,
};

/** Map `production|prod|staging|local` to its tRPC URL; anything else is returned unchanged. */
export const resolveNetworkAlias = (network: string): string =>
    NETWORK_ALIASES[network.trim().toLowerCase()] ?? network.trim();

/**
 * Resolve and check a `--network` value before any I/O, so a typo fails fast with a
 * usage error instead of creating an identity or opening a connection first.
 */
export const validateNetwork = (network: string): string => {
    const url = resolveNetworkAlias(network);
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        throw new UsageError(
            `Unknown network "${network}". Use production, staging, local, or an http(s) tRPC URL.`
        );
    }
    if (!['http:', 'https:'].includes(parsed.protocol))
        throw new UsageError(
            `Unknown network "${network}". Use production, staging, local, or an http(s) tRPC URL.`
        );
    return url;
};

/** Short name for a resolved network URL in human-facing messages. */
export const networkLabel = (network: string): string =>
    network === PRODUCTION_NETWORK
        ? 'production'
        : network === STAGING_NETWORK
          ? 'staging'
          : network;

/** Network-bound resources must not be silently reused on another deployment. */
export const assertProjectNetwork = (project: Project, network: string): void => {
    const previous = project.env.NETWORK_URL
        ? resolveNetworkAlias(project.env.NETWORK_URL)
        : PRODUCTION_NETWORK;
    const hasResources = [
        'SIGNING_AUTHORITY_NAME',
        'API_TOKEN',
        'TEMPLATE_URI',
        'CONTRACT_URI',
        'PUBLISHABLE_KEY',
        'INTEGRATION_ID',
    ].some(key => project.env[key]);
    if (previous !== network && hasResources) {
        throw new CliError(
            `This folder is set up for ${networkLabel(previous)}, not ${networkLabel(network)}. Its signing authority, tokens and templates exist only there.`,
            {
                code: 'NETWORK_MISMATCH',
                hint: `Drop --network to use ${networkLabel(previous)}, use a separate folder for ${networkLabel(network)} (e.g. \`npx @learncard/cli init --network ${networkLabel(network)}\` in a new folder), or copy an org spec there with \`npx @learncard/cli promote\`.`,
            }
        );
    }
};

/** Hosted signing service (lca-api) for production; staging has its own default. */
export const PRODUCTION_LCA_API = 'https://api.learncard.app/trpc';

/**
 * The hosted signing service a command will actually use: an explicit LCA_API_URL (or the
 * staging default), else the production service when the network is production. Undefined
 * for local or custom networks without LCA_API_URL. Returns a tRPC URL.
 */
export const signingServiceUrl = (services: {
    network: string;
    lcaAPI?: string;
}): string | undefined => {
    if (services.lcaAPI) return services.lcaAPI.replace(/\/api\/?$/, '/trpc');
    return services.network === PRODUCTION_NETWORK ? PRODUCTION_LCA_API : undefined;
};

/**
 * Resolve the network (aliases included) and its matching services; explicit process
 * variables override project values.
 */
export const resolveServices = (
    env: Record<string, string>,
    network?: string,
    runtime: Record<string, string | undefined> = process.env
) => {
    const requested = network || runtime.NETWORK_URL || env.NETWORK_URL || PRODUCTION_NETWORK;
    const url = validateNetwork(requested);
    const staging = url === STAGING_NETWORK;
    return {
        network: url,
        cloud:
            runtime.CLOUD_URL ||
            env.CLOUD_URL ||
            (staging ? 'https://staging.cloud.learncard.com/trpc' : undefined),
        lcaAPI:
            runtime.LCA_API_URL ||
            env.LCA_API_URL ||
            (staging ? 'https://staging.api.learncard.app/trpc' : undefined),
    };
};

/**
 * Docs snippets target production (`network: true`). When a project points at
 * another network, rewrite that one line in the generated file so the code a
 * developer keeps matches the network their .env is on.
 */
export const PRODUCTION_APP = 'https://learncard.app';
export const STAGING_APP = 'https://staging.learncard.ai';

/** The LearnCard app that pairs with a network. Local networks have no hosted app; callers pass --app-url. */
export const appUrlFor = (network: string, override?: string): string => {
    if (override) return override.replace(/\/$/, '');
    if (network === STAGING_NETWORK) return STAGING_APP;
    if (network === PRODUCTION_NETWORK) return PRODUCTION_APP;
    return PRODUCTION_APP;
};

export const localizeSnippet = (
    source: string,
    services: ReturnType<typeof resolveServices>
): string => {
    if (services.network === PRODUCTION_NETWORK) return source;
    const cloud = services.cloud ? `, cloud: { url: '${services.cloud}' }` : '';
    return source
        .replace(
            /initLearnCard\(\{ seed: process\.env\.SECURE_SEED, network: true \}\)/g,
            `initLearnCard({ seed: process.env.SECURE_SEED, network: '${services.network}'${cloud} })`
        )
        .replace(
            'https://network.learncard.com/api/send',
            `${services.network.replace(/\/trpc$/, '')}/api/send`
        );
};

/**
 * The docs' send.sh reads $TOKEN from the environment, which is right for a
 * doc. The file the CLI writes should just work, so prepend a loader that reads
 * API_TOKEN from .env without sourcing (executing) the file.
 */
export const ENV_TOKEN_LOADER = `#!/bin/sh
set -eu
# Read API_TOKEN from .env without executing it (strips optional quotes).
if [ -f .env ]; then
  API_TOKEN=$(sed -n 's/^API_TOKEN=//p' .env | sed 's/^["'"'"']//; s/["'"'"']$//')
fi
TOKEN=\${TOKEN:-\${API_TOKEN:-}}
: "\${TOKEN:?Run npx @learncard/cli token first}"

`;

export const withEnvTokenLoader = (sendSh: string): string => ENV_TOKEN_LOADER + sendSh;

export function connect(
    project: Project,
    options: ProjectOptions & { lca: true }
): Promise<LCALearnCard>;
export function connect(
    project: Project,
    options: ProjectOptions & { lca?: false }
): Promise<NetworkCard>;
export async function connect(
    project: Project,
    options: ProjectOptions & { lca?: boolean }
): Promise<NetworkCard | LCALearnCard> {
    const seed = project.env.SECURE_SEED;
    if (!seed) throw new NoIdentityError();
    const services = resolveServices(project.env, options.network);
    assertProjectNetwork(project, services.network);
    if (!options.readOnly && (services.network !== PRODUCTION_NETWORK || project.env.NETWORK_URL)) {
        await saveProject(project, {
            NETWORK_URL: services.network === PRODUCTION_NETWORK ? '' : services.network,
        });
    }
    out.log('Connecting to the LearnCard Network...');
    const config = {
        seed,
        network: services.network,
        ...walletConfig(options, services.cloud, false),
        ...(options.didkit && { didkit: options.didkit }),
    };
    const learnCard = options.lca
        ? await initLCALearnCard({
              ...config,
              ...(services.lcaAPI && { lcaAPI: services.lcaAPI.replace(/\/api\/?$/, '/trpc') }),
          })
        : await initLearnCard({
              ...config,
              network: services.network === PRODUCTION_NETWORK ? true : services.network,
          });
    noteCreatedIdentityDid(learnCard.id.did());
    return learnCard;
}

type CreatedIdentity = { profileId: string; network: string; did?: string; keyDid?: string };

/**
 * `ensureIdentity` cannot derive the seed's key DID without a wallet; fill it in on first
 * connect as `keyDid`. `did` is reserved for the profile's DID (the same value as the
 * command result's `did`), recorded once the profile exists.
 */
const noteCreatedIdentityDid = (keyDid: string): void => {
    const created = out.result?.identityCreated as CreatedIdentity | undefined;
    if (!created || created.keyDid) return;
    out.set({ identityCreated: { ...created, keyDid } });
};

/** Record the profile DID on `identityCreated` when this run created the identity. */
export const noteCreatedProfileDid = (did: string | undefined): void => {
    const created = out.result?.identityCreated as CreatedIdentity | undefined;
    if (!created || !did || created.did) return;
    out.set({
        identityCreated: {
            profileId: created.profileId,
            did,
            ...(created.keyDid ? { keyDid: created.keyDid } : {}),
            network: created.network,
        },
    });
};

/**
 * Open a second wallet on the same seed that authenticates as a `did:web` the
 * network issued to this seed (e.g. a profile manager). Manager-only routes
 * reject the seed's base did:key, so `connect()` alone cannot call them.
 *
 * With `readOnly` (or `associateDids: false`), LearnCloud's automatic DID association is
 * turned off, so opening the wallet does not register the did:web with LearnCloud (an
 * `addDid` / `setPrimaryDid` write that otherwise happens the first time a did:web is used).
 */
export const connectAsDidWeb = async (
    project: Project,
    options: ProjectOptions,
    didWeb: string
): Promise<DidWebCard> => {
    const seed = project.env.SECURE_SEED;
    if (!seed) throw new NoIdentityError();
    const services = resolveServices(project.env, options.network);
    return initLearnCard({
        seed,
        network: services.network === PRODUCTION_NETWORK ? true : services.network,
        didWeb,
        ...walletConfig(options, services.cloud, true),
        ...(options.didkit && { didkit: options.didkit }),
    });
};

/**
 * Like `connectAsDidWeb`, plus the LCA plugin so the managed profile can create and
 * register its own hosted signing authority (tokens acting as it have no key to sign with).
 */
export const connectAsDidWebSigner = async (
    project: Project,
    options: ProjectOptions,
    didWeb: string
): Promise<LCALearnCard> => {
    const seed = project.env.SECURE_SEED;
    if (!seed) throw new NoIdentityError();
    const services = resolveServices(project.env, options.network);
    const learnCard = await initLearnCard({
        seed,
        network: services.network === PRODUCTION_NETWORK ? true : services.network,
        didWeb,
        ...(services.cloud && { cloud: { url: services.cloud } }),
        ...(options.didkit && { didkit: options.didkit }),
    });
    return learnCard.addPlugin(
        await getLCAPlugin(
            learnCard as unknown as Parameters<typeof getLCAPlugin>[0],
            signingServiceUrl(services) ?? PRODUCTION_LCA_API
        )
    ) as unknown as LCALearnCard;
};

/**
 * Open a wallet as a profile this folder manages (via the folder's profile manager).
 * `options.readOnly` is forwarded to `connectAsDidWeb` for both wallets.
 */
export const connectAsManaged = async (
    project: Project,
    options: ProjectOptions,
    managedProfileId: string
): Promise<DidWebCard> => {
    const managerDid = project.env.ORG_PROFILE_MANAGER_DID;
    if (!managerDid) {
        throw new Error(
            `--as ${managedProfileId} needs a profile manager in this folder. Run \`org apply\` with a profileManager section first.`
        );
    }
    const manager = await connectAsDidWeb(project, options, managerDid);
    let cursor: string | undefined;
    do {
        const page = await manager.invoke.getManagedProfiles({ limit: 100, cursor });
        const match = page.records.find(record => record.profileId === managedProfileId);
        if (match) return connectAsDidWeb(project, options, match.did);
        cursor = page.hasMore ? (page.cursor ?? undefined) : undefined;
    } while (cursor);
    throw new Error(
        `"${managedProfileId}" is not a profile managed from this folder. Add it under profileManager.managed in your org spec and run \`org apply\`.`
    );
};

export const ensureProfile = async (
    learnCard: { invoke: Pick<NetworkCard['invoke'], 'getProfile' | 'createProfile'> },
    identity: { profileId: string; displayName: string },
    project?: Project
): Promise<void> => {
    const existing = await learnCard.invoke.getProfile();
    if (existing) {
        noteCreatedProfileDid('did' in existing ? existing.did : undefined);
        out.log(`Signed in as "${existing.displayName}" (${existing.profileId})`);
        if (project && project.env.DISPLAY_NAME !== existing.displayName)
            await saveProject(project, { DISPLAY_NAME: existing.displayName });
        return;
    }
    const did = await learnCard.invoke.createProfile({
        profileId: identity.profileId,
        displayName: identity.displayName,
        bio: '',
        shortBio: '',
    });
    noteCreatedProfileDid(typeof did === 'string' ? did : undefined);
    out.log(`Created profile "${identity.displayName}" (${identity.profileId})`);
};

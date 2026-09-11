import fs from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { randomUUID } from 'node:crypto';
import { initLearnCard, type NetworkLearnCardFromSeed } from '@learncard/init';
import { initLCALearnCard, type LCALearnCard } from '@learncard/lca-api-plugin';
import { generateRandomSeed } from './random';
import { out } from './out';

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
}

export type NetworkCard = NetworkLearnCardFromSeed['returnValue'];

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
        out.log(`Wrote ${Object.keys(changed).join(' and ')} to .env`);
    } finally {
        await fs.rm(temporary, { force: true });
        await lock.close();
        await fs.unlink(lockPath);
    }
};

/** Never block on input from a script, CI job, or agent: only prompt when a human is at a real TTY. */
export const createPrompts = (yes?: boolean) => {
    const interactive = !yes && !!process.stdin.isTTY && process.env.LC_YES !== '1';
    const rl = interactive
        ? createInterface({ input: process.stdin, output: process.stdout })
        : null;
    return {
        ask: async (question: string, fallback: string): Promise<string> => {
            if (rl) return (await rl.question(`${question} [${fallback}] `)).trim() || fallback;
            if (!fallback)
                throw new Error(
                    `${question} is required when running non-interactively. Pass it as an argument or flag.`
                );
            return fallback;
        },
        close: (): void => {
            rl?.close();
        },
    };
};

export const ensureIdentity = async (project: Project, options: ProjectOptions) => {
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
    const seed = project.env.SECURE_SEED || generateRandomSeed();
    const profileId = project.env.PROFILE_ID || options.profileId || toProfileId(displayName);
    await saveProject(project, {
        SECURE_SEED: seed,
        PROFILE_ID: profileId,
        ...(existingProfileId ? {} : { DISPLAY_NAME: displayName }),
    });
    const gitignorePath = path.join(path.dirname(project.envPath), '.gitignore');
    const gitignore = await readOptional(gitignorePath);
    if (await fs.stat(gitignorePath).catch(() => null)) {
        if (!gitignore.split('\n').some(line => line.trim() === '.env')) {
            await fs.writeFile(gitignorePath, `${gitignore.replace(/\n?$/, '\n')}.env\n`);
            out.log('Added .env to .gitignore');
        }
    }
    return { seed, profileId, displayName };
};

export const PRODUCTION_NETWORK = 'https://network.learncard.com/trpc';
export const STAGING_NETWORK = 'https://staging.network.learncard.com/trpc';

/** Network-bound resources must not be silently reused on another deployment. */
export const assertProjectNetwork = (project: Project, network: string): void => {
    const previous =
        project.env.NETWORK_URL === 'staging'
            ? STAGING_NETWORK
            : project.env.NETWORK_URL || PRODUCTION_NETWORK;
    const hasResources = [
        'SIGNING_AUTHORITY_NAME',
        'API_TOKEN',
        'TEMPLATE_URI',
        'CONTRACT_URI',
        'PUBLISHABLE_KEY',
        'INTEGRATION_ID',
    ].some(key => project.env[key]);
    if (previous !== network && hasResources) {
        throw new Error(
            'This project has resources on another network. Use a separate folder for staging or another network.'
        );
    }
};

/** Resolve matching staging services; explicit process variables override project values. */
export const resolveServices = (
    env: Record<string, string>,
    network?: string,
    runtime: Record<string, string | undefined> = process.env
) => {
    const requested = network || runtime.NETWORK_URL || env.NETWORK_URL || PRODUCTION_NETWORK;
    const url = requested === 'staging' ? STAGING_NETWORK : requested;
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol))
        throw new Error('Network must be an HTTP(S) tRPC URL or staging.');
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
    if (!seed) throw new Error('Create an identity before connecting.');
    const services = resolveServices(project.env, options.network);
    assertProjectNetwork(project, services.network);
    if (services.network !== PRODUCTION_NETWORK || project.env.NETWORK_URL) {
        await saveProject(project, {
            NETWORK_URL: services.network === PRODUCTION_NETWORK ? '' : services.network,
        });
    }
    out.log('Connecting to the LearnCard Network...');
    const config = {
        seed,
        network: services.network,
        ...(services.cloud && { cloud: { url: services.cloud } }),
        ...(options.didkit && { didkit: options.didkit }),
    };
    return options.lca
        ? initLCALearnCard({
              ...config,
              ...(services.lcaAPI && { lcaAPI: services.lcaAPI.replace(/\/api\/?$/, '/trpc') }),
          })
        : initLearnCard({
              ...config,
              network: services.network === PRODUCTION_NETWORK ? true : services.network,
          });
}

export const ensureProfile = async (
    learnCard: { invoke: Pick<NetworkCard['invoke'], 'getProfile' | 'createProfile'> },
    identity: { profileId: string; displayName: string },
    project?: Project
): Promise<void> => {
    const existing = await learnCard.invoke.getProfile();
    if (existing) {
        out.log(`Signed in as "${existing.displayName}" (${existing.profileId})`);
        if (project && project.env.DISPLAY_NAME !== existing.displayName)
            await saveProject(project, { DISPLAY_NAME: existing.displayName });
        return;
    }
    await learnCard.invoke.createProfile({
        profileId: identity.profileId,
        displayName: identity.displayName,
        bio: '',
        shortBio: '',
    });
    out.log(`Created profile "${identity.displayName}" (${identity.profileId})`);
};

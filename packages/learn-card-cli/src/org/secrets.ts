import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { ensureGitignored, parseEnv, upsertEnv } from '../project';
import { toEnvKey } from './schema';
import { ReferralConfigurationError } from './referral-safety';

const inspectSecrets = async (secretsOut: string) => {
    const info = await fs.lstat(secretsOut).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return undefined;
        throw error;
    });
    if (info && !info.isFile())
        throw new Error('Secrets output must be a regular file, not a symlink.');
    return info;
};

export const hasSecret = async (secretsOut: string, name: string): Promise<boolean> => {
    if (!(await inspectSecrets(secretsOut))) return false;
    const env = parseEnv(await fs.readFile(secretsOut, 'utf8'));
    return !!env[toEnvKey(name)]?.trim();
};

/** Read only a private, owned regular file, without following a final symlink. */
export const hasPrivateSecret = async (file: string, name: string): Promise<boolean> => {
    const handle = await fs
        .open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
        .catch((error: NodeJS.ErrnoException) => {
            if (error.code === 'ENOENT') return undefined;
            throw new ReferralConfigurationError(
                'Cannot securely inspect the private handoff file.'
            );
        });
    if (!handle) return false;
    try {
        const info = await handle.stat();
        if (
            !info.isFile() ||
            info.mode & 0o077 ||
            info.nlink !== 1 ||
            (process.getuid && info.uid !== process.getuid())
        )
            throw new ReferralConfigurationError(
                'The handoff must be an owned private regular file (mode 0600).'
            );
        return !!parseEnv(await handle.readFile('utf8'))[toEnvKey(name)]?.trim();
    } finally {
        await handle.close();
    }
};

/** Replace a token entry without duplicate keys, securing existing files before writing. */
export const writeSecret = async (
    secretsOut: string,
    name: string,
    token: string
): Promise<void> => {
    await fs.mkdir(path.dirname(secretsOut), { recursive: true });
    const info = await inspectSecrets(secretsOut);
    if (info) await fs.chmod(secretsOut, 0o600);
    const existing = info ? await fs.readFile(secretsOut, 'utf8') : '';
    const key = toEnvKey(name);
    const retained = existing
        .split('\n')
        .filter(line => line.match(/^\s*(?:export\s+)?([\w]+)\s*=/)?.[1] !== key)
        .join('\n');
    const next = upsertEnv(retained, { [key]: token });
    // Like saveProject, stage the replacement so a failed write cannot destroy other tokens.
    const temporary = `${secretsOut}.${randomUUID()}.tmp`;
    const handle = await fs.open(temporary, 'wx', 0o600);
    try {
        try {
            await handle.writeFile(next, 'utf8');
        } finally {
            await handle.close();
        }
        await inspectSecrets(secretsOut);
        await fs.rename(temporary, secretsOut);
    } finally {
        await fs.rm(temporary, { force: true });
    }
    await ensureGitignored(path.dirname(secretsOut), path.basename(secretsOut));
};

/**
 * Serialize applies that share a secrets file: two overlapping runs would otherwise
 * both miss the grant, both create one, and overwrite each other's token.
 */
export const withSecretsLock = async <T>(
    secretsOut: string | undefined,
    fn: () => Promise<T>
): Promise<T> => {
    if (!secretsOut) return fn();
    await fs.mkdir(path.dirname(secretsOut), { recursive: true });
    const lockPath = path.join(path.dirname(secretsOut), `.${path.basename(secretsOut)}.lock`);
    const lock = await fs.open(lockPath, 'wx', 0o600).catch((error: NodeJS.ErrnoException) => {
        if (error.code === 'EEXIST')
            throw new Error(
                `Another org apply is reconciling service accounts for ${secretsOut}. Retry when it finishes; remove a stale ${path.basename(lockPath)} only if no command is running.`
            );
        throw error;
    });
    try {
        return await fn();
    } finally {
        await lock.close();
        await fs.rm(lockPath, { force: true });
    }
};

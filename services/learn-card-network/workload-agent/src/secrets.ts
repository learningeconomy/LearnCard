import { randomBytes } from 'node:crypto';
import { constants } from 'node:fs';
import { mkdir, lstat, chmod, open, rename } from 'node:fs/promises';
import { join } from 'node:path';
import type { WorkloadSecretDeclaration } from '../../../../packages/learn-card-types/src/workload';
import { AgentError, type Redactor } from './redact';
import { projectName, safeName, type Spec } from './render';

export const privateDirectory = async (path: string): Promise<void> => {
    await mkdir(path, { recursive: true, mode: 0o700 });
    const stat = await lstat(path);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new AgentError('SECRET_PATH_UNSAFE');
    await chmod(path, 0o700);
};
export const readPrivate = async (path: string): Promise<string> => {
    const file = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW);
    try {
        const stat = await file.stat();
        if (!stat.isFile() || stat.nlink !== 1 || stat.size > 65536)
            throw new AgentError('SECRET_PATH_UNSAFE');
        await file.chmod(0o600);
        return await file.readFile('utf8');
    } finally {
        await file.close();
    }
};
export const provisionSecret = async (
    root: string,
    deployment: string,
    secret: WorkloadSecretDeclaration,
    redactor: Redactor
): Promise<string> => {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(secret.name))
        throw new AgentError('SECRET_PATH_UNSAFE');
    await privateDirectory(root);
    const deploymentDir = join(root, projectName(deployment));
    await privateDirectory(deploymentDir);
    const dir = join(deploymentDir, 'values');
    await privateDirectory(dir);
    const path = join(dir, secret.name);
    try {
        const value = await readPrivate(path);
        if (!value || /[\r\n\0]/.test(value)) throw new AgentError('SECRET_INVALID');
        redactor.add(value);
        return value;
    } catch (error) {
        if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'))
            throw new AgentError('SECRET_PATH_UNSAFE');
    }
    if (secret.provisioning.kind === 'existing-reference') throw new AgentError('SECRET_MISSING');
    const format = secret.provisioning.format;
    const value =
        format === 'ed25519-seed'
            ? randomBytes(32).toString('hex')
            : format === 'password'
              ? randomBytes(18).toString('base64url')
              : randomBytes(32).toString('base64url');
    redactor.add(value);
    try {
        const file = await open(
            path,
            constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
            0o600
        );
        try {
            await file.writeFile(value);
            await file.sync();
        } finally {
            await file.close();
        }
        return value;
    } catch (error) {
        if (error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST') {
            const existing = await readPrivate(path);
            redactor.add(existing);
            return existing;
        }
        throw new AgentError('SECRET_WRITE_FAILED');
    }
};
export const provisionSecrets = async (
    root: string,
    deployment: string,
    spec: Spec,
    redactor: Redactor
): Promise<void> => {
    const values = new Map<string, string>();
    for (const secret of spec.secretRefs)
        values.set(secret.name, await provisionSecret(root, deployment, secret, redactor));
    for (const component of spec.components) {
        const lines: string[] = [];
        for (const entry of component.env)
            if (entry.source.kind === 'secret') {
                const value = values.get(entry.source.name);
                if (value === undefined) throw new AgentError('SECRET_MISSING');
                lines.push(`${entry.name}=${value}`);
            }
        if (!lines.length) continue;
        const content = `${lines.join('\n')}\n`;
        redactor.add(content);
        const path = join(root, projectName(deployment), `${safeName(component.id)}.env`);
        const temp = `${path}.${randomBytes(8).toString('hex')}.tmp`;
        const file = await open(temp, 'wx', 0o600);
        try {
            await file.writeFile(content);
            await file.sync();
        } finally {
            await file.close();
        }
        await rename(temp, path);
    }
};

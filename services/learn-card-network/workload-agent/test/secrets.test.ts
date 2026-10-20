import { mkdtemp, rm, stat, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, expect, it } from 'vitest';
import { provisionSecret } from '../src/secrets';
import { Redactor } from '../src/redact';
import { projectName } from '../src/render';
import { secret } from './fixtures';

const roots: string[] = [];
const root = async (): Promise<string> => {
    const path = await mkdtemp(join(tmpdir(), 'lcnwl-test-'));
    roots.push(path);
    return path;
};
afterEach(async (): Promise<void> => {
    for (const path of roots.splice(0)) await rm(path, { recursive: true, force: true });
});
it('generates idempotently with private permissions', async (): Promise<void> => {
    const path = await root();
    const log = new Redactor();
    const first = await provisionSecret(path, 'id', secret(), log);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
    expect(await provisionSecret(path, 'id', secret(), log)).toBe(first);
    expect((await stat(join(path, projectName('id'), 'values', 'key'))).mode & 0o777).toBe(0o600);
    expect((await stat(join(path, projectName('id')))).mode & 0o777).toBe(0o700);
    expect(log.format(first)).not.toContain(first);
});
it.each(['token', 'password'] as const)(
    'generates correct %s size',
    async (format): Promise<void> => {
        const value = await provisionSecret(
            await root(),
            'id',
            { ...secret(), provisioning: { kind: 'generate', format } },
            new Redactor()
        );
        expect(value.length).toBe(format === 'token' ? 43 : 24);
    }
);
it('fails missing existing references', async (): Promise<void> => {
    await expect(
        provisionSecret(
            await root(),
            'id',
            { ...secret(), provisioning: { kind: 'existing-reference' } },
            new Redactor()
        )
    ).rejects.toThrow('SECRET_MISSING');
});
it('rejects symlink secrets', async (): Promise<void> => {
    const path = await root();
    await provisionSecret(path, 'id', secret(), new Redactor());
    const file = join(path, projectName('id'), 'values', 'key');
    await rm(file);
    await symlink('/etc/passwd', file);
    await expect(provisionSecret(path, 'id', secret(), new Redactor())).rejects.toThrow(
        'SECRET_PATH_UNSAFE'
    );
});
it('redacts token values, secret values and env contents', (): void => {
    const log = new Redactor();
    log.add('secret-value');
    log.add('token-value');
    const result = log.format(
        'secret-value token-value\nPASSWORD=some-other-secret\nx-workload-agent-token: unknown-token'
    );
    for (const value of ['secret-value', 'token-value', 'some-other-secret', 'unknown-token'])
        expect(result).not.toContain(value);
});
it.each(['compose.yaml', 'state.json', 'retired'])(
    'isolates secret %s from metadata',
    async (name): Promise<void> => {
        const path = await root();
        const declaration = { ...secret(), name };
        const first = await provisionSecret(path, 'id', declaration, new Redactor());
        expect(await provisionSecret(path, 'id', declaration, new Redactor())).toBe(first);
        expect((await stat(join(path, projectName('id'), 'values', name))).isFile()).toBe(true);
    }
);

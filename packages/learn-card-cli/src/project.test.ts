import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
    assertProjectNetwork,
    KEYS,
    createPrompts,
    ensureIdentity,
    loadProject,
    parseEnv,
    resolveServices,
    saveProject,
    upsertEnv,
} from './project';

afterEach(() => vi.restoreAllMocks());

describe('createPrompts non-interactive behavior', () => {
    const originalIsTTY = process.stdin.isTTY;
    const originalLcYes = process.env.LC_YES;

    afterEach(() => {
        Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
        if (originalLcYes === undefined) delete process.env.LC_YES;
        else process.env.LC_YES = originalLcYes;
    });

    it('returns the fallback without opening a prompt when yes is true', async () => {
        const prompts = createPrompts(true);
        await expect(prompts.ask('Display name', 'My Organization')).resolves.toBe(
            'My Organization'
        );
        prompts.close();
    });

    it('returns the fallback when stdin is not a TTY, even without --yes', async () => {
        Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
        const prompts = createPrompts(undefined);
        await expect(prompts.ask('Display name', 'My Organization')).resolves.toBe(
            'My Organization'
        );
        prompts.close();
    });

    it('treats LC_YES=1 as non-interactive even when stdin looks like a real TTY', async () => {
        Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
        process.env.LC_YES = '1';
        const prompts = createPrompts(undefined);
        await expect(prompts.ask('Display name', 'My Organization')).resolves.toBe(
            'My Organization'
        );
        prompts.close();
    });

    it('throws a descriptive error when non-interactive and no fallback exists', async () => {
        const prompts = createPrompts(true);
        await expect(prompts.ask('Recipient email (--to <email>)', '')).rejects.toThrow(
            'Recipient email (--to <email>) is required when running non-interactively. Pass it as an argument or flag.'
        );
        prompts.close();
    });
});
describe('project context', () => {
    it('parses exported and commented seeds without changing identity', () => {
        expect(
            parseEnv('export SECURE_SEED="original" # keep\nPROFILE_ID=issuer # comment\n')
        ).toEqual({ SECURE_SEED: 'original', PROFILE_ID: 'issuer' });
        expect(upsertEnv('export PROFILE_ID=old\n', { PROFILE_ID: 'new' })).toBe(
            'PROFILE_ID=new\n'
        );
        expect(() => parseEnv('SECURE_SEED=one\nSECURE_SEED=two\n')).toThrow('Conflicting');
    });
    it('rejects network changes when resources are already saved', () => {
        const project = {
            existing: '',
            envPath: '/unused/.env',
            env: { TEMPLATE_URI: 'lc:template' },
        };
        expect(() =>
            assertProjectNetwork(project, 'https://staging.network.learncard.com/trpc')
        ).toThrow('separate folder');
        expect(() =>
            assertProjectNetwork(project, 'https://network.learncard.com/trpc')
        ).not.toThrow();
    });
    it('documents the stable shared keys', () => {
        expect(Object.keys(KEYS)).toEqual([
            'SECURE_SEED',
            'PROFILE_ID',
            'NETWORK_URL',
            'SIGNING_AUTHORITY_NAME',
            'SIGNING_AUTHORITY_ENDPOINT',
            'API_TOKEN',
            'API_TOKEN_SCOPE',
            'TEMPLATE_URI',
            'CONTRACT_URI',
            'PUBLISHABLE_KEY',
            'INTEGRATION_ID',
        ]);
        expect(Object.values(KEYS)).toEqual(Object.keys(KEYS));
    });
    it('preserves unrelated lines and quotes scope lists', () => {
        const result = upsertEnv('# keep\nOTHER=one\n', {
            API_TOKEN_SCOPE: 'boosts:write inbox:read',
        });
        expect(result).toBe('# keep\nOTHER=one\nAPI_TOKEN_SCOPE="boosts:write inbox:read"\n');
        expect(parseEnv(result).API_TOKEN_SCOPE).toBe('boosts:write inbox:read');
    });
    it('accumulates keys, does not rewrite unchanged values, and never replaces a seed', async () => {
        const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-project-'));
        vi.spyOn(console, 'log').mockImplementation(() => {});
        try {
            await fs.writeFile(
                path.join(cwd, '.env'),
                '# keep\nSECURE_SEED=existing\nPROFILE_ID=issuer\n'
            );
            const project = await loadProject(cwd);
            const identity = await ensureIdentity(project, { yes: true, profileId: 'ignored' });
            expect(identity.seed).toBe('existing');
            expect(identity.profileId).toBe('issuer');
            expect(console.log).not.toHaveBeenCalled();
            await saveProject(project, { TEMPLATE_URI: 'lc:template' });
            await saveProject(project, { API_TOKEN: 'secret' });
            expect((await fs.stat(project.envPath)).mode & 0o777).toBe(0o600);
            expect((await loadProject(cwd)).env).toMatchObject({
                SECURE_SEED: 'existing',
                TEMPLATE_URI: 'lc:template',
                API_TOKEN: 'secret',
            });
            expect(console.log).toHaveBeenCalledWith('Wrote TEMPLATE_URI to .env');
            await expect(saveProject(project, { SECURE_SEED: 'replacement' })).rejects.toThrow(
                'Cannot replace'
            );
        } finally {
            await fs.rm(cwd, { recursive: true, force: true });
        }
    });
    it('refuses stale identity writes and symlinked env files', async () => {
        const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-project-safety-'));
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        try {
            const stale = await loadProject(cwd);
            const current = await loadProject(cwd);
            await saveProject(current, { SECURE_SEED: 'original' });
            await expect(saveProject(stale, { SECURE_SEED: 'different' })).rejects.toThrow(
                'Cannot replace'
            );
            expect((await loadProject(cwd)).env.SECURE_SEED).toBe('original');
            await fs.rename(current.envPath, path.join(cwd, 'target'));
            await fs.symlink(path.join(cwd, 'target'), current.envPath);
            await expect(loadProject(cwd)).rejects.toThrow('symlink');
        } finally {
            log.mockRestore();
            await fs.rm(cwd, { recursive: true, force: true });
        }
    });
    it('resolves staging services together and preserves explicit local LCA URLs', () => {
        expect(resolveServices({}, 'staging', {})).toEqual({
            network: 'https://staging.network.learncard.com/trpc',
            cloud: 'https://staging.cloud.learncard.com/trpc',
            lcaAPI: 'https://staging.api.learncard.app/trpc',
        });
        expect(
            resolveServices({ NETWORK_URL: 'http://localhost:4000/trpc' }, undefined, {
                LCA_API_URL: 'http://localhost:5200/api',
            }).lcaAPI
        ).toBe('http://localhost:5200/api');
        expect(() => resolveServices({}, 'file:///tmp/network', {})).toThrow('HTTP');
    });
});

describe('upsertEnv value quoting', () => {
    it('writes percent-encoded network URIs bare so shell scripts can read them', () => {
        expect(upsertEnv('', { TEMPLATE_URI: 'lc:network:localhost%3A4000/trpc:boost:abc' })).toBe(
            'TEMPLATE_URI=lc:network:localhost%3A4000/trpc:boost:abc\n'
        );
    });

    it('quotes values with spaces or shell-significant characters', () => {
        expect(upsertEnv('', { API_TOKEN_SCOPE: 'boosts:write inbox:read' })).toBe(
            'API_TOKEN_SCOPE="boosts:write inbox:read"\n'
        );
    });
});

import { describe, expect, it, vi } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { authorityName, setupSigning } from './setup-signing';
import { loadProject } from './project';

describe('signing authority setup', () => {
    it('defaults to default-issuer and reuses the project selection', () => {
        const project = { env: {}, existing: '', envPath: '/unused/.env' };
        expect(authorityName(project)).toBe('default-issuer');
        expect(authorityName({ ...project, env: { SIGNING_AUTHORITY_NAME: 'existing' } })).toBe(
            'existing'
        );
        expect(authorityName(project, 'custom')).toBe('custom');
    });
    it('resumes after failed registration and leaves an existing primary untouched', async () => {
        const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-signing-'));
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const authority = {
            name: 'default-issuer',
            endpoint: 'https://issuer.example/api',
            did: 'did:key:issuer',
            ownerDid: 'did:key:owner',
        };
        const invoke = {
            getRegisteredSigningAuthorities: vi.fn().mockResolvedValue([]),
            getSigningAuthorities: vi.fn().mockResolvedValueOnce([]).mockResolvedValue([authority]),
            createSigningAuthority: vi.fn().mockResolvedValue(authority),
            registerSigningAuthority: vi
                .fn()
                .mockRejectedValueOnce(new Error('Connection lost'))
                .mockResolvedValue(true),
            setPrimaryRegisteredSigningAuthority: vi.fn().mockResolvedValue(true),
        };
        try {
            const project = await loadProject(cwd);
            await expect(setupSigning(project, { invoke })).rejects.toThrow('Connection lost');
            await setupSigning(project, { invoke });
            expect(invoke.createSigningAuthority).toHaveBeenCalledTimes(1);
            expect(project.env.SIGNING_AUTHORITY_ENDPOINT).toBe(authority.endpoint);
            invoke.getRegisteredSigningAuthorities.mockResolvedValue([
                {
                    signingAuthority: { endpoint: authority.endpoint },
                    relationship: { name: authority.name, did: authority.did, isPrimary: true },
                },
            ]);
            await setupSigning(project, { invoke });
            expect(invoke.createSigningAuthority).toHaveBeenCalledTimes(1);
            expect(invoke.setPrimaryRegisteredSigningAuthority).toHaveBeenCalledTimes(1);
            expect(log).toHaveBeenCalledWith(
                'Signing authority "default-issuer" is already your primary.'
            );
        } finally {
            log.mockRestore();
            await fs.rm(cwd, { recursive: true, force: true });
        }
    });
});

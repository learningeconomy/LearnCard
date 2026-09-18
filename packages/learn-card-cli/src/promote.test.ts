import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRODUCTION_NETWORK, STAGING_NETWORK } from './project';
import { assertSourceNetwork, planPromotion, PROMOTE_CHECKLIST } from './promote';

describe('planPromotion', () => {
    it('resolves staging -> production and targets a project folder named after it', () => {
        const plan = planPromotion('staging', 'production');
        expect(plan.fromNetwork).toBe(STAGING_NETWORK);
        expect(plan.toNetwork).toBe(PRODUCTION_NETWORK);
        expect(plan.targetDir.endsWith(`${path.sep}production`)).toBe(true);
    });

    it('names the target folder after the hostname for a custom network URL', () => {
        const plan = planPromotion('staging', 'https://network.example.org:8443/trpc');
        expect(plan.toNetwork).toBe('https://network.example.org:8443/trpc');
        expect(plan.targetDir.endsWith(`${path.sep}network.example.org`)).toBe(true);
    });

    it('throws when --from and --to resolve to the same network', () => {
        expect(() => planPromotion('staging', 'staging')).toThrow('same network');
        expect(() => planPromotion('production', PRODUCTION_NETWORK)).toThrow('same network');
    });
});

describe('PROMOTE_CHECKLIST', () => {
    it('lists the per-network resources that must be recreated on the target', () => {
        expect(PROMOTE_CHECKLIST).toContain('API tokens');
        expect(PROMOTE_CHECKLIST).toContain('Signing authority registrations');
    });
});

describe('assertSourceNetwork', () => {
    it('accepts a staging .env for --from staging (alias or full URL)', () => {
        expect(() =>
            assertSourceNetwork({ NETWORK_URL: 'staging' }, 'staging', STAGING_NETWORK)
        ).not.toThrow();
        expect(() =>
            assertSourceNetwork({ NETWORK_URL: STAGING_NETWORK }, 'staging', STAGING_NETWORK)
        ).not.toThrow();
    });

    it('accepts an .env with no NETWORK_URL for --from production', () => {
        expect(() => assertSourceNetwork({}, 'production', PRODUCTION_NETWORK)).not.toThrow();
    });

    it('throws when the source folder is on a different network than --from', () => {
        expect(() => assertSourceNetwork({}, 'staging', STAGING_NETWORK)).toThrow(
            `--from staging does not match this folder's network (${PRODUCTION_NETWORK})`
        );
    });
});

describe('runPromote --dry-run', () => {
    it('leaves the source .env byte-identical and creates no target folder', async () => {
        const fs = await import('node:fs/promises');
        const os = await import('node:os');
        const { vi } = await import('vitest');
        vi.spyOn(console, 'log').mockImplementation(() => {});

        const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-promote-'));
        const before = `SECURE_SEED=${'a'.repeat(64)}\nPROFILE_ID=exde\nNETWORK_URL=http://localhost:4000/trpc\n`;
        await fs.writeFile(path.join(cwd, '.env'), before);
        await fs.writeFile(
            path.join(cwd, 'org.yaml'),
            'issuer:\n  profileId: exde\n  displayName: Ex\n  signingAuthority: { type: learncard-hosted, name: ex }\n'
        );

        vi.doMock('./org', () => ({ runOrgApply: vi.fn().mockResolvedValue(undefined) }));
        vi.doMock('./doctor', () => ({ runDoctor: vi.fn() }));
        const { runPromote } = await import('./promote');

        const previousCwd = process.cwd();
        process.chdir(cwd);
        try {
            await runPromote({
                from: 'http://localhost:4000/trpc',
                to: 'staging',
                org: 'org.yaml',
                dryRun: true,
            });
        } finally {
            process.chdir(previousCwd);
        }

        expect(await fs.readFile(path.join(cwd, '.env'), 'utf8')).toBe(before);
        expect(await fs.readdir(cwd)).toEqual(['.env', 'org.yaml']);
        vi.doUnmock('./org');
        vi.doUnmock('./doctor');
    }, 20_000);
});

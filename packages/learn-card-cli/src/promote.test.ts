import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PRODUCTION_NETWORK, STAGING_NETWORK } from './project';
import { assertSourceNetwork, assertTargetSeed, planPromotion, PROMOTE_CHECKLIST } from './promote';

describe('planPromotion', () => {
    it('places the target under the supplied working directory', () => {
        expect(planPromotion('staging', 'production', '/tmp/source-project').targetDir).toBe(
            path.join('/tmp/source-project', '.learncard', 'production')
        );
    });
    it('defaults the working directory to process.cwd()', () => {
        expect(planPromotion('staging', 'production').targetDir).toBe(
            path.join(process.cwd(), '.learncard', 'production')
        );
    });
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

describe('assertTargetSeed', () => {
    const seed = 'a'.repeat(64);

    it('accepts an empty target or one already bound to the same seed', () => {
        expect(() => assertTargetSeed({}, seed, '/t')).not.toThrow();
        expect(() => assertTargetSeed({ SECURE_SEED: seed }, seed, '/t')).not.toThrow();
    });

    it('rejects a target already bound to a different seed', () => {
        expect(() => assertTargetSeed({ SECURE_SEED: 'b'.repeat(64) }, seed, '/t')).toThrow(
            `${path.join('/t', '.env')} already holds a different SECURE_SEED`
        );
    });
});

describe('runPromote --dry-run', () => {
    it('uses options.cwd without changing process.cwd and leaves the source untouched', async () => {
        const fs = await import('node:fs/promises');
        const os = await import('node:os');
        const { vi } = await import('vitest');
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-promote-'));
        const previousCwd = process.cwd();
        const before = `SECURE_SEED=${'a'.repeat(64)}\nPROFILE_ID=exde\nNETWORK_URL=http://localhost:4000/trpc\n`;
        const runOrgApply = vi.fn().mockResolvedValue(undefined);
        vi.doMock('./org', () => ({ runOrgApply }));
        vi.doMock('./doctor', () => ({ runDoctor: vi.fn() }));
        vi.resetModules();
        try {
            await fs.writeFile(path.join(cwd, '.env'), before);
            const org = path.join(cwd, 'org.yaml');
            await fs.writeFile(
                org,
                'issuer:\n  profileId: exde\n  displayName: Ex\n  signingAuthority: { type: learncard-hosted, name: ex }\n'
            );
            const { runPromote } = await import('./promote');
            await runPromote({
                cwd,
                from: 'http://localhost:4000/trpc',
                to: 'staging',
                org,
                dryRun: true,
            });
            const targetDir = path.join(cwd, '.learncard', 'staging');
            expect(runOrgApply).toHaveBeenCalledWith(
                org,
                expect.objectContaining({
                    project: expect.objectContaining({ envPath: path.join(targetDir, '.env') }),
                    secretsOut: path.join(targetDir, 'secrets.env'),
                })
            );
            expect(process.cwd()).toBe(previousCwd);
            expect(await fs.readFile(path.join(cwd, '.env'), 'utf8')).toBe(before);
            expect(await fs.readdir(cwd)).toEqual(['.env', 'org.yaml']);

            runOrgApply.mockClear();
            await fs.mkdir(targetDir, { recursive: true });
            await fs.writeFile(path.join(targetDir, '.env'), `SECURE_SEED=${'b'.repeat(64)}\n`);
            for (const dryRun of [true, false]) {
                await expect(
                    runPromote({
                        cwd,
                        from: 'http://localhost:4000/trpc',
                        to: 'staging',
                        org,
                        dryRun,
                    })
                ).rejects.toThrow('already holds a different SECURE_SEED');
            }
            expect(runOrgApply).not.toHaveBeenCalled();
        } finally {
            vi.doUnmock('./org');
            vi.doUnmock('./doctor');
            vi.resetModules();
            log.mockRestore();
            await fs.rm(cwd, { recursive: true, force: true });
        }
    }, 20_000);
});

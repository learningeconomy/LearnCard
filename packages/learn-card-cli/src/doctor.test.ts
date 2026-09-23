import { describe, expect, it } from 'vitest';
import { summarize } from './doctor';

const results = (...statuses: Array<'pass' | 'warn' | 'fail' | 'skip'>) =>
    statuses.map(status => ({ status }));

describe('doctor summary', () => {
    it('counts each status independently', () => {
        const summary = summarize(results('pass', 'pass', 'warn', 'fail', 'skip'));
        expect(summary).toMatchObject({ passed: 2, warnings: 1, failed: 1, skipped: 1 });
    });

    it('is ok when nothing failed, even with warnings', () => {
        expect(summarize(results('pass', 'warn')).ok).toBe(true);
    });

    it('is not ok when anything failed', () => {
        expect(summarize(results('pass', 'fail')).ok).toBe(false);
    });

    it('is not ok in strict mode when there are warnings, even with no failures', () => {
        expect(summarize(results('pass', 'warn'), true).ok).toBe(false);
    });

    it('is ok in strict mode with only passes', () => {
        expect(summarize(results('pass', 'pass'), true).ok).toBe(true);
    });
});

describe('runDoctor', () => {
    it('connects read-only so a diagnostic --network never rewrites .env', async () => {
        const fs = await import('node:fs/promises');
        const os = await import('node:os');
        const path = await import('node:path');
        const { vi } = await import('vitest');
        const connect = vi.fn().mockResolvedValue({});
        vi.doMock('./project', async importOriginal => ({
            ...(await importOriginal<typeof import('./project')>()),
            connect,
        }));
        vi.doMock('./doctor/checks', async importOriginal => ({
            ...(await importOriginal<typeof import('./doctor/checks')>()),
            CHECKS: [],
        }));
        vi.resetModules();
        const log = vi.spyOn(console, 'log').mockImplementation(() => {});
        const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'lc-doctor-'));
        const before = `SECURE_SEED=${'a'.repeat(64)}\n`;
        try {
            await fs.writeFile(path.join(cwd, '.env'), before);
            const { runDoctor } = await import('./doctor');
            await runDoctor({ cwd, network: 'staging' });
            expect(connect).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({ network: 'staging', readOnly: true })
            );
            expect(await fs.readFile(path.join(cwd, '.env'), 'utf8')).toBe(before);
        } finally {
            vi.doUnmock('./project');
            vi.doUnmock('./doctor/checks');
            vi.resetModules();
            log.mockRestore();
            process.exitCode = undefined;
            await fs.rm(cwd, { recursive: true, force: true });
        }
    });
});

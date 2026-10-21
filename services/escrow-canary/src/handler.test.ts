import { afterEach, describe, expect, it, vi } from 'vitest';
import { handler } from './handler';
import { loadConfig } from './config';
import { createSdk } from './sdk';
import { runCanary } from './runner';

vi.mock('./config', () => ({ loadConfig: vi.fn() }));
vi.mock('./sdk', () => ({ createSdk: vi.fn() }));
vi.mock('./secrets', () => ({ createSecretStore: vi.fn() }));
vi.mock('./runner', () => ({ runCanary: vi.fn() }));

afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.unstubAllEnvs();
});

describe('handler terminal metrics', () => {
    it.each([1, 2] as const)(
        'reports tier %s configuration failure without exposing the error',
        async tier => {
            vi.stubEnv('CANARY_TIER', String(tier));
            vi.stubEnv('CANARY_ENVIRONMENT', 'production');
            vi.mocked(loadConfig).mockImplementation(() => {
                throw new Error('private secret');
            });
            const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
            await handler({ tier, time: new Date().toISOString() });
            expect(log).toHaveBeenCalledOnce();
            const metric = JSON.parse(log.mock.calls[0][0]);
            expect(metric).toMatchObject({
                Environment: 'production',
                Tier: String(tier),
                Reason: 'config',
                [`Tier${tier}.Success`]: 0,
            });
            expect(JSON.stringify(metric)).not.toContain('private');
            if (tier === 2) expect(['pin-a', 'pin-b']).toContain(metric.Account);
        }
    );
    it.each([null, { tier: 1 }, { tier: 2, time: 'now' }])(
        'reports malformed or mismatched event %s using configured tier',
        async event => {
            vi.stubEnv('CANARY_TIER', '1');
            const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
            await handler(event);
            expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({
                'Tier1.Success': 0,
                Reason: 'config',
            });
            expect(loadConfig).not.toHaveBeenCalled();
        }
    );
    it('covers SDK initialization failure', async () => {
        vi.stubEnv('CANARY_TIER', '2');
        vi.mocked(createSdk).mockImplementation(() => {
            throw new Error('private');
        });
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        await handler({ tier: 2, time: new Date().toISOString() });
        expect(JSON.parse(log.mock.calls[0][0])).toMatchObject({
            'Tier2.Success': 0,
            Reason: 'config',
        });
    });
    it('does not double-report a runner result', async () => {
        vi.stubEnv('CANARY_TIER', '1');
        vi.mocked(runCanary).mockImplementation(async (_event, _config, deps) => {
            deps.emit('Tier1.Success', 1);
        });
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        await handler({ tier: 1, time: new Date().toISOString() });
        expect(log).toHaveBeenCalledOnce();
        expect(JSON.parse(log.mock.calls[0][0])['Tier1.Success']).toBe(1);
    });
});

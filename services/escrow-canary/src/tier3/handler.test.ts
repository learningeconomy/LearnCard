import { afterEach, describe, expect, it, vi } from 'vitest';
import { handler, parseTier } from '../handler';
import { handleTier3 } from './handler';
import { runCanary } from '../runner';
import { loadConfig } from '../config';

vi.mock('./handler', () => ({ handleTier3: vi.fn() }));
vi.mock('../config', () => ({ loadConfig: vi.fn() }));
vi.mock('../sdk', () => ({ createSdk: vi.fn() }));
vi.mock('../secrets', () => ({ createSecretStore: vi.fn() }));
vi.mock('../runner', () => ({ runCanary: vi.fn() }));

afterEach(() => {
    vi.restoreAllMocks();
    vi.resetAllMocks();
    vi.unstubAllEnvs();
});

describe('strict tier dispatch', () => {
    it('parses only 1, 2 and 3', () => {
        expect(['1', '2', '3', '4', '', undefined, ' 1'].map(parseTier)).toEqual([
            1,
            2,
            3,
            undefined,
            undefined,
            undefined,
            undefined,
        ]);
    });

    it.each(['1', '2'])('tier %s keeps its existing path and never reaches tier 3', async tier => {
        vi.stubEnv('CANARY_TIER', tier);
        vi.mocked(runCanary).mockImplementation(async (_event, _config, deps) => {
            deps.emit(`Tier${tier}.Success` as 'Tier1.Success', 1);
        });
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        await handler({ tier: Number(tier), time: new Date().toISOString() });
        expect(runCanary).toHaveBeenCalledOnce();
        expect(handleTier3).not.toHaveBeenCalled();
        expect(log).toHaveBeenCalledOnce();
    });

    it('an invalid CANARY_TIER never runs and reports a configuration failure', async () => {
        vi.stubEnv('CANARY_TIER', 'banana');
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        await handler({ tier: 1, time: new Date().toISOString() });
        expect(loadConfig).not.toHaveBeenCalled();
        expect(runCanary).not.toHaveBeenCalled();
        expect(JSON.parse(log.mock.calls.at(-1)![0])).toMatchObject({
            'Tier1.Success': 0,
            Reason: 'config',
        });
    });

    it.each(['runner', 'evaluator'])('dispatches tier 3 %s with a matching event', async role => {
        vi.stubEnv('CANARY_TIER', '3');
        vi.stubEnv('CANARY_ROLE', role);
        const time = new Date().toISOString();
        await handler({ tier: 3, role, time });
        expect(handleTier3).toHaveBeenCalledWith(role, { time }, expect.any(Function));
    });

    it.each([
        [{ tier: 3, role: 'runner', time: 'x' }, 'evaluator'],
        [{ tier: 3, time: new Date().toISOString() }, 'runner'],
        [{ tier: 2, role: 'runner', time: new Date().toISOString() }, 'runner'],
        [{ tier: 3, role: 'runner', time: new Date().toISOString() }, 'other'],
    ])('rejects mismatched tier 3 event %j (role %s) and emits no metric', async (event, role) => {
        vi.stubEnv('CANARY_TIER', '3');
        vi.stubEnv('CANARY_ROLE', role);
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        await handler(event);
        expect(handleTier3).not.toHaveBeenCalled();
        expect(log).toHaveBeenCalledOnce();
        expect(JSON.parse(log.mock.calls[0][0])).toEqual({
            event: 'escrow-canary.handler.error',
            errorName: 'Error',
        });
    });

    it('a tier 3 failure logs only the constructor name', async () => {
        vi.stubEnv('CANARY_TIER', '3');
        vi.stubEnv('CANARY_ROLE', 'evaluator');
        vi.mocked(handleTier3).mockRejectedValue(new Error('private ledger detail'));
        const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        await handler({ tier: 3, role: 'evaluator', time: new Date().toISOString() });
        expect(JSON.stringify(log.mock.calls)).not.toContain('private');
        expect(log).toHaveBeenCalledOnce();
    });
});

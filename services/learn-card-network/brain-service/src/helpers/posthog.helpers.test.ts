import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('posthog.helpers', () => {
    beforeEach(() => {
        vi.resetModules();
        delete process.env.POSTHOG_API_KEY;
        delete process.env.POSTHOG_HOST;
    });

    it('captureBenchEvent is a no-op when POSTHOG_API_KEY is unset', async () => {
        const mod = await import('./posthog.helpers');
        expect(await mod.captureBenchEvent('bench.appevent.iteration', { foo: 1 })).toBe(false);
    });

    it('captureBenchEvent attempts emission when POSTHOG_API_KEY is set', async () => {
        process.env.POSTHOG_API_KEY = 'phc_test_key';
        const captureSpy = vi.fn();
        vi.doMock('posthog-node', () => ({
            PostHog: vi.fn().mockImplementation(() => ({
                capture: captureSpy,
                shutdown: vi.fn(),
            })),
        }));
        const mod = await import('./posthog.helpers');
        const result = await mod.captureBenchEvent('bench.appevent.iteration', { foo: 1 });
        expect(result).toBe(true);
        expect(captureSpy).toHaveBeenCalledWith({
            distinctId: 'brain-service-bench',
            event: 'bench.appevent.iteration',
            properties: expect.objectContaining({ foo: 1 }),
        });
    });

    it('captureBenchEvent swallows errors thrown by posthog client', async () => {
        process.env.POSTHOG_API_KEY = 'phc_test_key';
        vi.doMock('posthog-node', () => ({
            PostHog: vi.fn().mockImplementation(() => ({
                capture: () => {
                    throw new Error('posthog down');
                },
                shutdown: vi.fn(),
            })),
        }));
        const mod = await import('./posthog.helpers');
        const result = await mod.captureBenchEvent('bench.appevent.iteration', { foo: 1 });
        expect(result).toBe(false);
    });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('posthog.helpers', () => {
    beforeEach(() => {
        vi.resetModules();
        delete process.env.POSTHOG_API_KEY;
        delete process.env.POSTHOG_HOST;
        delete process.env.ENABLE_SEND_CREDENTIAL_TELEMETRY;
    });

    it('captureBenchEvent is a no-op when ENABLE_SEND_CREDENTIAL_TELEMETRY is unset', async () => {
        process.env.POSTHOG_API_KEY = 'phc_test_key';
        const captureSpy = vi.fn();
        vi.doMock('posthog-node', () => ({
            PostHog: class MockPostHog {
                capture = captureSpy;
                shutdown = vi.fn();
            },
        }));
        const mod = await import('./posthog.helpers');
        const result = await mod.captureBenchEvent('bench.appevent.iteration', { foo: 1 });
        expect(result).toBe(false);
        expect(captureSpy).not.toHaveBeenCalled();
    });

    it('fails startup when telemetry is enabled without POSTHOG_API_KEY', async () => {
        process.env.ENABLE_SEND_CREDENTIAL_TELEMETRY = 'true';

        await expect(import('./posthog.helpers')).rejects.toThrow(/POSTHOG_API_KEY/);
    });

    it('captureBenchEvent attempts emission when telemetry is enabled and POSTHOG_API_KEY is set', async () => {
        process.env.POSTHOG_API_KEY = 'phc_test_key';
        process.env.ENABLE_SEND_CREDENTIAL_TELEMETRY = 'true';
        const captureSpy = vi.fn();
        vi.doMock('posthog-node', () => ({
            PostHog: class MockPostHog {
                capture = captureSpy;
                shutdown = vi.fn();
            },
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
        process.env.ENABLE_SEND_CREDENTIAL_TELEMETRY = 'true';
        vi.doMock('posthog-node', () => ({
            PostHog: class MockPostHog {
                capture = () => {
                    throw new Error('posthog down');
                };
                shutdown = vi.fn();
            },
        }));
        const mod = await import('./posthog.helpers');
        const result = await mod.captureBenchEvent('bench.appevent.iteration', { foo: 1 });
        expect(result).toBe(false);
    });

    it('accepts the documented numeric true spelling', async () => {
        process.env.POSTHOG_API_KEY = 'phc_test_key';
        process.env.ENABLE_SEND_CREDENTIAL_TELEMETRY = '1';
        const captureSpy = vi.fn();
        vi.doMock('posthog-node', () => ({
            PostHog: class MockPostHog {
                capture = captureSpy;
                shutdown = vi.fn();
            },
        }));
        const mod = await import('./posthog.helpers');
        const result = await mod.captureBenchEvent('bench.appevent.iteration', { foo: 1 });
        expect(result).toBe(true);
        expect(captureSpy).toHaveBeenCalledOnce();
    });
});

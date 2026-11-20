import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const preload = vi.hoisted(() => ({
    run: vi.fn(async (): Promise<void> => undefined),
}));
const wait = vi.hoisted(() => ({
    run: vi.fn(async (): Promise<void> => undefined),
}));

vi.mock('../../../helpers/prefetchChunk', () => ({
    waitForPrefetch: (...args: unknown[]) => wait.run(...args),
}));
vi.mock('../DashboardPageRoute', () => ({
    preloadDashboardPage: () => preload.run(),
}));

describe('isDashboardDestinationPath', () => {
    it('matches /dashboard with optional query or hash', async () => {
        const { isDashboardDestinationPath } = await import('./primeDashboardPage');
        expect(isDashboardDestinationPath('/dashboard')).toBe(true);
        expect(isDashboardDestinationPath('/dashboard?connected=true')).toBe(true);
        expect(isDashboardDestinationPath('/dashboard#top')).toBe(true);
        expect(isDashboardDestinationPath('/wallet')).toBe(false);
        expect(isDashboardDestinationPath('/')).toBe(false);
        expect(isDashboardDestinationPath('/dashboard/extra')).toBe(false);
    });
});

describe('primeDashboardPageBounded', () => {
    beforeEach(() => {
        preload.run.mockReset();
        wait.run.mockReset();
        wait.run.mockResolvedValue(undefined);
        preload.run.mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('resolves done when wait+import finish before the bound', async () => {
        const { primeDashboardPageBounded, DASHBOARD_BOOT_PRELOAD_TIMEOUT_MS } =
            await import('./primeDashboardPage');
        expect(DASHBOARD_BOOT_PRELOAD_TIMEOUT_MS).toBe(4000);
        await expect(primeDashboardPageBounded()).resolves.toBe('done');
        expect(wait.run).toHaveBeenCalledWith('dashboard');
        expect(preload.run).toHaveBeenCalledOnce();
    });

    it('resolves timeout and releases when import hangs past the bound', async () => {
        vi.useFakeTimers();
        preload.run.mockImplementation(() => new Promise(() => undefined));
        const { primeDashboardPageBounded, DASHBOARD_BOOT_PRELOAD_TIMEOUT_MS } =
            await import('./primeDashboardPage');

        const result = primeDashboardPageBounded();
        await vi.advanceTimersByTimeAsync(DASHBOARD_BOOT_PRELOAD_TIMEOUT_MS - 1);
        let settled: string | undefined;
        void result.then(value => {
            settled = value;
        });
        await Promise.resolve();
        expect(settled).toBeUndefined();

        await vi.advanceTimersByTimeAsync(1);
        await expect(result).resolves.toBe('timeout');
    });
});

describe('primeDashboardIfDestination', () => {
    beforeEach(() => {
        preload.run.mockReset();
        wait.run.mockReset();
        wait.run.mockResolvedValue(undefined);
        preload.run.mockResolvedValue(undefined);
        vi.resetModules();
    });

    it('primes for /dashboard and no-ops for other paths (post-login /login → dashboard)', async () => {
        const { primeDashboardIfDestination } = await import('./primeDashboardPage');

        await primeDashboardIfDestination('/wallet');
        expect(preload.run).not.toHaveBeenCalled();

        await primeDashboardIfDestination('/dashboard');
        expect(wait.run).toHaveBeenCalledWith('dashboard');
        expect(preload.run).toHaveBeenCalledOnce();
    });
});

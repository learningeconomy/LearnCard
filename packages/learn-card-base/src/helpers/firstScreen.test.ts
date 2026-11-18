import { afterEach, describe, expect, it, vi } from 'vitest';

describe('firstScreen', () => {
    afterEach(() => {
        vi.useRealTimers();
        vi.resetModules();
    });

    it('waits for the first screen, or for the timeout', async () => {
        vi.useFakeTimers();
        const { afterFirstScreen, markFirstScreenPainted } = await import('./firstScreen');
        const timedOut = vi.fn();
        afterFirstScreen(1000).then(timedOut);
        await vi.advanceTimersByTimeAsync(999);
        expect(timedOut).not.toHaveBeenCalled();
        await vi.advanceTimersByTimeAsync(1);
        expect(timedOut).toHaveBeenCalled();

        const painted = vi.fn();
        afterFirstScreen(60_000).then(painted);
        markFirstScreenPainted();
        await vi.advanceTimersByTimeAsync(0);
        expect(painted).toHaveBeenCalled();
    });
});

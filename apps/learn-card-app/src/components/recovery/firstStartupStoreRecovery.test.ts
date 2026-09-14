import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('recovery prompt persistence migration', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.resetModules();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('converts the legacy permanent dismissal into a fresh seven-day snooze', async () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-09-01T12:00:00Z'));
        window.localStorage.setItem('lc_recovery_banner_dismissed', 'true');

        const { default: store, RECOVERY_PROMPT_SNOOZE_MS } = await import(
            'learn-card-base/stores/firstStartupStore'
        );

        expect(store.get.recoveryPromptSnoozedUntil()).toBe(Date.now() + RECOVERY_PROMPT_SNOOZE_MS);
        expect(window.localStorage.getItem('lc_recovery_banner_dismissed')).toBeNull();
    });
});

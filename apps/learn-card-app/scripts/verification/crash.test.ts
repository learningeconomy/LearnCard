import { describe, expect, it } from 'bun:test';

import { browserCrashHint } from './crash';

describe('browserCrashHint', () => {
    it('explains Playwright page and target crashes as memory pressure', () => {
        for (const message of ['page.goto: Page crashed', 'Target crashed']) {
            const hint = browserCrashHint(new Error(message), 1.5 * 1024 ** 3);
            expect(hint).toContain('most likely out of memory');
            expect(hint).toContain('1.5 GiB free');
            expect(hint).toContain('--fresh');
        }
    });

    it('leaves other failures alone', () => {
        expect(
            browserCrashHint(new Error('locator.click: Timeout 30000ms exceeded'))
        ).toBeUndefined();
        expect(browserCrashHint('Target closed')).toBeUndefined();
    });
});

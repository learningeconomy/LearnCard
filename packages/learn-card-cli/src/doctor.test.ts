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

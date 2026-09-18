import { describe, expect, it } from 'vitest';
import { formatRefreshVersion, mapRefreshHistoryError } from './refresh';

describe('formatRefreshVersion', () => {
    it('formats version, publishedAt, and summary', () => {
        const line = formatRefreshVersion({
            version: 2,
            publishedAt: '2026-01-01T00:00:00Z',
            updateSummary: 'Finalized grades',
        });
        expect(line).toContain('2');
        expect(line).toContain('2026-01-01T00:00:00Z');
        expect(line).toContain('Finalized grades');
    });

    it('omits the summary column when absent', () => {
        const line = formatRefreshVersion({ version: 1, publishedAt: '2026-01-01T00:00:00Z' });
        expect(line.trim().endsWith('2026-01-01T00:00:00Z')).toBe(true);
    });
});

describe('mapRefreshHistoryError', () => {
    it('rewrites the "not available" failure into an actionable message', () => {
        const mapped = mapRefreshHistoryError(
            new Error('Credential refresh is not available'),
            'https://network.learncard.com/trpc'
        );
        expect(mapped.message).toContain("isn't enabled on this network");
        expect(mapped.message).toContain('https://network.learncard.com/trpc');
        expect(mapped.message).toContain('--network staging');
    });

    it('passes other errors through unchanged', () => {
        const original = new Error('Refresh not found');
        expect(mapRefreshHistoryError(original, 'x')).toBe(original);
    });

    it('wraps non-Error throwables', () => {
        const mapped = mapRefreshHistoryError('boom', 'x');
        expect(mapped).toBeInstanceOf(Error);
        expect(mapped.message).toBe('boom');
    });
});

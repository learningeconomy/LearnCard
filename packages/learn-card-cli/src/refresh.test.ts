import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatRefreshVersion, mapRefreshHistoryError, runRefreshHistory } from './refresh';
import { connect, loadProject } from './project';

const { getCredentialRefreshHistory } = vi.hoisted(() => ({
    getCredentialRefreshHistory: vi.fn(),
}));
vi.mock('./project', () => ({
    loadProject: vi.fn().mockResolvedValue({ env: {} }),
    resolveServices: vi.fn().mockReturnValue({ network: 'https://network.learncard.com/trpc' }),
    connect: vi.fn().mockResolvedValue({ invoke: { getCredentialRefreshHistory } }),
}));
vi.mock('./out', () => ({ out: { log: vi.fn(), set: vi.fn() } }));

describe('refresh history limit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        getCredentialRefreshHistory.mockResolvedValue({ records: [], hasMore: false });
    });

    it.each(['abc', '0', '-1', '1.5', '', 'NaN', 'Infinity'])(
        'rejects %j before connecting',
        async limit => {
            await expect(runRefreshHistory('refresh-1', { limit })).rejects.toThrow(
                'Invalid --limit'
            );
            expect(loadProject).not.toHaveBeenCalled();
            expect(connect).not.toHaveBeenCalled();
            expect(getCredentialRefreshHistory).not.toHaveBeenCalled();
        }
    );

    it.each(['1', '10'])('passes a validated limit of %s', async limit => {
        await runRefreshHistory('refresh-1', { limit });
        expect(getCredentialRefreshHistory).toHaveBeenCalledWith({
            refreshId: 'refresh-1',
            limit: Number(limit),
        });
    });

    it('leaves the server default unchanged when omitted', async () => {
        await runRefreshHistory('refresh-1', {});
        expect(getCredentialRefreshHistory).toHaveBeenCalledWith({ refreshId: 'refresh-1' });
    });
});

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

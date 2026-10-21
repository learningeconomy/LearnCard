import { describe, expect, it, vi } from 'vitest';
import { Command } from 'commander';
import {
    fetchSentInboxCredentials,
    filterSince,
    parseLimit,
    parseSince,
    registerInboxCommand,
    toJsonRecord,
    type SentInboxRecord,
} from './inbox';

const baseRecord = (overrides: Partial<SentInboxRecord> = {}): SentInboxRecord => ({
    id: 'inbox-1',
    isSigned: true,
    currentStatus: 'PENDING',
    expiresAt: '2026-02-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    issuerDid: 'did:example:issuer',
    ...overrides,
});

describe('parseLimit', () => {
    it('defaults to 50', () => {
        expect(parseLimit(undefined)).toBe(50);
    });

    it('accepts positive integers', () => {
        expect(parseLimit('10')).toBe(10);
    });

    it.each(['abc', '0', '-1', '1.5'])('rejects %s', value => {
        expect(() => parseLimit(value)).toThrow('--limit');
    });
});

describe('parseSince', () => {
    const now = new Date('2026-01-10T00:00:00.000Z');

    it('parses day durations', () => {
        expect(parseSince('7d', now).toISOString()).toBe('2026-01-03T00:00:00.000Z');
    });

    it('parses hour durations', () => {
        expect(parseSince('24h', now).toISOString()).toBe('2026-01-09T00:00:00.000Z');
    });

    it('parses minute durations', () => {
        expect(parseSince('30m', now).toISOString()).toBe('2026-01-09T23:30:00.000Z');
    });

    it('parses an ISO timestamp', () => {
        expect(parseSince('2026-01-05T00:00:00.000Z', now).toISOString()).toBe(
            '2026-01-05T00:00:00.000Z'
        );
    });

    it('throws on garbage input', () => {
        expect(() => parseSince('not-a-duration', now)).toThrow(/Invalid --since/);
    });
});

describe('filterSince', () => {
    it('keeps only records at or after the cutoff', () => {
        const records = [
            baseRecord({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z' }),
            baseRecord({ id: 'new', createdAt: '2026-01-09T00:00:00.000Z' }),
        ];
        expect(filterSince(records, new Date('2026-01-05T00:00:00.000Z')).map(r => r.id)).toEqual([
            'new',
        ]);
    });

    it('is a no-op without a cutoff', () => {
        const records = [baseRecord()];
        expect(filterSince(records, undefined)).toBe(records);
    });
});

describe('inbox command registration', () => {
    it('does not advertise or accept the unsupported recipient-type filter', async () => {
        const program = new Command().exitOverride().configureOutput({ writeErr: () => {} });
        const run = vi.fn();
        registerInboxCommand(program, run);
        const list = program.commands[0]!.commands[0]!;
        expect(list.helpInformation()).not.toContain('--recipient-type');
        await expect(
            program.parseAsync(['inbox', 'list', '--recipient-type', 'email'], { from: 'user' })
        ).rejects.toThrow("unknown option '--recipient-type'");
        expect(run).not.toHaveBeenCalled();
    });
});

describe('fetchSentInboxCredentials', () => {
    it.each([false, true])(
        'reports overflow even when server hasMore is %s',
        async serverHasMore => {
            const getMySentInboxCredentials = vi.fn().mockResolvedValue({
                records: [baseRecord({ id: '1' }), baseRecord({ id: '2' })],
                hasMore: serverHasMore,
            });
            const result = await fetchSentInboxCredentials(
                { getMySentInboxCredentials },
                { limit: 1 }
            );
            expect(result.records.map(record => record.id)).toEqual(['1']);
            expect(result.hasMore).toBe(true);
            expect(getMySentInboxCredentials).toHaveBeenCalledExactlyOnceWith({ limit: 1 });
        }
    );

    it('requests the last remaining record and stops at an exact limit', async () => {
        const getMySentInboxCredentials = vi
            .fn()
            .mockResolvedValueOnce({ records: [baseRecord()], hasMore: true, cursor: 'next' })
            .mockResolvedValueOnce({ records: [baseRecord({ id: '2' })], hasMore: false });
        const result = await fetchSentInboxCredentials({ getMySentInboxCredentials }, { limit: 2 });
        expect(getMySentInboxCredentials).toHaveBeenNthCalledWith(2, { limit: 1, cursor: 'next' });
        expect(getMySentInboxCredentials).toHaveBeenCalledTimes(2);
        expect(result.records).toHaveLength(2);
        expect(result.hasMore).toBe(false);
    });

    it('merges cursor-paginated pages up to the requested limit', async () => {
        const page1 = {
            hasMore: true,
            cursor: 'cursor-1',
            records: [baseRecord({ id: '1' }), baseRecord({ id: '2' })],
        };
        const page2 = { hasMore: false, records: [baseRecord({ id: '3' })] };
        const getMySentInboxCredentials = vi
            .fn()
            .mockResolvedValueOnce(page1)
            .mockResolvedValueOnce(page2);

        const { records, hasMore } = await fetchSentInboxCredentials(
            { getMySentInboxCredentials },
            { limit: 10 }
        );

        expect(records.map(r => r.id)).toEqual(['1', '2', '3']);
        expect(hasMore).toBe(false);
        expect(getMySentInboxCredentials).toHaveBeenCalledTimes(2);
        expect(getMySentInboxCredentials).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({ cursor: 'cursor-1', limit: 8 })
        );
    });

    it('stops once the requested limit is reached, reporting more remain', async () => {
        const page1 = {
            hasMore: true,
            cursor: 'cursor-1',
            records: [baseRecord({ id: '1' }), baseRecord({ id: '2' })],
        };
        const getMySentInboxCredentials = vi.fn().mockResolvedValueOnce(page1);

        const { records, hasMore } = await fetchSentInboxCredentials(
            { getMySentInboxCredentials },
            { limit: 1 }
        );

        expect(records.map(r => r.id)).toEqual(['1']);
        expect(hasMore).toBe(true);
    });
});

describe('toJsonRecord', () => {
    it('shapes a record for --json output, omitting an absent recipient', () => {
        const record = baseRecord({ id: 'x' });
        expect(toJsonRecord(record)).toEqual({
            id: 'x',
            status: 'PENDING',
            recipient: undefined,
            createdAt: record.createdAt,
            expiresAt: record.expiresAt,
            credentialName: undefined,
            isSigned: true,
        });
    });

    it('includes the recipient value only when present', () => {
        const withValue = baseRecord({ recipient: { type: 'email', value: 'a@example.com' } });
        expect(toJsonRecord(withValue).recipient).toEqual({
            type: 'email',
            value: 'a@example.com',
        });

        const withoutValue = baseRecord({ recipient: { type: 'phone' } });
        expect(toJsonRecord(withoutValue).recipient).toEqual({ type: 'phone' });
    });
});

describe('inbox list pipeline', () => {
    it('merges two mocked pages, filters by since, and shapes json records', async () => {
        const page1 = {
            hasMore: true,
            cursor: 'c1',
            records: [
                baseRecord({
                    id: '1',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    recipient: { type: 'email', value: 'a@example.com' },
                }),
                baseRecord({
                    id: '2',
                    createdAt: '2026-01-08T00:00:00.000Z',
                    recipient: { type: 'phone' },
                }),
            ],
        };
        const page2 = {
            hasMore: false,
            records: [
                baseRecord({
                    id: '3',
                    createdAt: '2026-01-09T00:00:00.000Z',
                    recipient: { type: 'email' },
                }),
            ],
        };
        const getMySentInboxCredentials = vi
            .fn()
            .mockResolvedValueOnce(page1)
            .mockResolvedValueOnce(page2);

        const { records, hasMore } = await fetchSentInboxCredentials(
            { getMySentInboxCredentials },
            { limit: 10 }
        );
        const since = parseSince('7d', new Date('2026-01-10T00:00:00.000Z'));
        const filtered = filterSince(records, since);

        expect(filtered.map(r => r.id)).toEqual(['2', '3']);
        expect(hasMore).toBe(false);
        expect(filtered.map(toJsonRecord)).toEqual([
            {
                id: '2',
                status: 'PENDING',
                recipient: { type: 'phone' },
                createdAt: '2026-01-08T00:00:00.000Z',
                expiresAt: page1.records[1]!.expiresAt,
                credentialName: undefined,
                isSigned: true,
            },
            {
                id: '3',
                status: 'PENDING',
                recipient: { type: 'email' },
                createdAt: '2026-01-09T00:00:00.000Z',
                expiresAt: page2.records[0]!.expiresAt,
                credentialName: undefined,
                isSigned: true,
            },
        ]);
    });
});

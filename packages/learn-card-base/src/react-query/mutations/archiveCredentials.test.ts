import { InfiniteData, QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

vi.mock('learn-card-base', () => ({
    useWallet: () => ({ initWallet: vi.fn() }),
}));

import { ARCHIVED_CATEGORY, LCR } from '../../types/credential-records';
import {
    getRecordCategory,
    moveCredentialRecordsInCache,
    toArchivedRecord,
    toRestoredRecord,
} from './archiveCredentials';

const did = 'did:web:holder';
const archiveKey = ['useGetCredentialList', did, ARCHIVED_CATEGORY];
const achievementKey = ['useGetCredentialList', did, 'Achievement'];

const record = (uri: string, category = 'Achievement'): LCR =>
    ({
        id: `record:${uri}`,
        uri,
        category,
    }) as LCR;

const list = (records: LCR[]): InfiniteData<{ hasMore: boolean; records: LCR[] }> => ({
    pages: [{ hasMore: false, records }],
    pageParams: [undefined],
});

describe('credential archive cache transitions', () => {
    it('moves a record out of every loaded source page and into Archived', () => {
        const client = new QueryClient();
        const target = record('target');
        const archived = toArchivedRecord(target, '2026-10-29T00:00:00.000Z');
        client.setQueryData(achievementKey, {
            pages: [
                { hasMore: true, records: [target] },
                { hasMore: false, records: [record('later')] },
            ],
            pageParams: [undefined, 'cursor-1'],
        });
        client.setQueryData(archiveKey, list([]));

        moveCredentialRecordsInCache(client, did, [
            { record: target, replacement: archived, from: 'Achievement', to: ARCHIVED_CATEGORY },
        ]);

        const active = client.getQueryData<InfiniteData<{ records: LCR[] }>>(achievementKey);
        const archivedList = client.getQueryData<InfiniteData<{ records: LCR[] }>>(archiveKey);
        expect(active?.pages.flatMap(page => page.records).map(item => item.uri)).toEqual([
            'later',
        ]);
        expect(archivedList?.pages[0]?.records).toEqual([archived]);
        expect(archived.archive).toEqual({
            fromCategory: 'Achievement',
            archivedAt: '2026-10-29T00:00:00.000Z',
        });
    });

    it('restores only a failed archive transition without changing successful records', () => {
        const client = new QueryClient();
        const successful = toArchivedRecord(record('succeeded'));
        const failedOriginal = record('failed');
        const failedArchived = toArchivedRecord(failedOriginal);
        client.setQueryData(achievementKey, list([]));
        client.setQueryData(archiveKey, list([successful, failedArchived]));

        moveCredentialRecordsInCache(client, did, [
            {
                record: failedArchived,
                replacement: failedOriginal,
                from: ARCHIVED_CATEGORY,
                to: 'Achievement',
            },
        ]);

        const active = client.getQueryData<InfiniteData<{ records: LCR[] }>>(achievementKey);
        const archivedList = client.getQueryData<InfiniteData<{ records: LCR[] }>>(archiveKey);
        expect(active?.pages[0]?.records).toEqual([failedOriginal]);
        expect(archivedList?.pages[0]?.records).toEqual([successful]);
    });

    it('restores the original category source and rejects records without archive metadata', () => {
        const archived = toArchivedRecord(
            { ...record('manual'), categorySource: 'manual' } as LCR,
            '2026-10-29T00:00:00.000Z'
        );
        expect(toRestoredRecord(archived)).toMatchObject({
            category: 'Achievement',
            categorySource: 'manual',
            archive: null,
        });
        expect(toRestoredRecord(record('not-archived'))).toBeUndefined();
        expect(getRecordCategory(archived)).toBe(ARCHIVED_CATEGORY);
    });
});

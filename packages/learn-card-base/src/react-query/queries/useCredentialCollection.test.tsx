// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LCR } from '../../types/credential-records';
import type { BespokeLearnCard } from '../../types/learn-card';

const host = vi.hoisted(() => ({
    wallet: null as BespokeLearnCard | null,
    switchedDid: undefined as string | undefined,
    init: vi.fn(),
}));
vi.mock('learn-card-base', async () => ({
    useWallet: () => ({ initWallet: host.init }),
    switchedProfileStore: { use: { switchedDid: () => host.switchedDid } },
    // The mock factory is hoisted before static imports initialize.
    CredentialCategoryEnum: (await import('../../types/boostCategories')).CredentialCategoryEnum,
    categoryMetadata: {},
    newCredsStore: {},
    credentialWithEditsHelper: (vc: unknown) => vc,
}));
vi.mock('../../stores/walletStore', () => ({
    walletStore: { use: { wallet: () => host.wallet } },
    switchedProfileStore: {
        use: { switchedDid: () => host.switchedDid },
        get: { switchedDid: () => host.switchedDid },
    },
}));
vi.mock('../../helpers/credentialHelpers', () => ({
    getCredentialName: (vc: { name?: string }) => vc.name ?? '',
    getIssuanceDate: () => '',
    SELF_ASSIGNED_SKILLS_BOOST_NAME: 'Self-Assigned Skills',
}));
vi.mock('learn-card-base/hooks/useWallet', () => ({ getCategoryForCredential: vi.fn() }));
vi.mock('../mutations/syncConsentFlow', () => ({
    useSyncConsentContractsMutation: vi.fn(),
    useAcceptAndStoreCredentialsMutation: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useConsentedContracts', () => ({
    getOrFetchConsentedContracts: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useGetCredentialRecordForBoost', () => ({
    getOrFetchCredentialRecordForBoost: vi.fn(),
}));
import {
    useCredentialCollection,
    type CredentialCollectionOptions,
} from './useCredentialCollection';
import {
    isInternalCredentialCategory,
    isCredentialCollectionRecordVisible,
} from '../../helpers/credentialCollection';
import { usePrefetchCredentialPage } from './vcQueries';

let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
);
const record = (
    i: number,
    title: string | undefined = `Badge ${i}`,
    category = 'Social Badge'
): LCR => ({ id: String(i), uri: `uri-${i}`, title, category }) as LCR;
const deferred = <T,>() => Promise.withResolvers<T>();
const makeWallet = (rows: LCR[], did = 'account-a') => {
    const getPage = vi.fn(async (query, options) => {
        const eligible = query?.category
            ? rows.filter(row => row.category === query.category)
            : rows;
        const start = Number(options?.cursor ?? 0);
        const end = start + 12;
        return {
            records: eligible.slice(start, end),
            hasMore: end < eligible.length,
            cursor: String(end),
        };
    });
    const read = vi.fn(async (uri: string) => ({ name: `Resolved ${uri}` }));
    host.wallet = {
        id: { did: () => did },
        index: { LearnCloud: { getPage } },
        read: { get: read },
    } as unknown as BespokeLearnCard;
    return { getPage, read };
};
beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    host.switchedDid = undefined;
    host.wallet = null;
    host.init.mockImplementation(async () => host.wallet);
});
afterEach(() => {
    cleanup();
    client.clear();
    vi.clearAllMocks();
});

describe('progressive credential collection', () => {
    it('finds the sole fourth-batch title without resolving every credential', async () => {
        const rows = Array.from({ length: 37 }, (_, i) =>
            record(i, i === 36 ? 'First aid training' : `Badge ${i}`)
        );
        const { getPage, read } = makeWallet(rows);
        const { result } = renderHook(
            () => useCredentialCollection(undefined, { mode: 'search', search: 'FIRST AID' }),
            { wrapper }
        );
        expect(result.current.isComplete).toBe(false);
        await waitFor(() => expect(result.current.isComplete).toBe(true));
        expect(result.current.matches.map(row => row.uri)).toEqual(['uri-36']);
        expect(getPage).toHaveBeenCalledTimes(4);
        expect(read).not.toHaveBeenCalled();
    });
    it('does not finalize absence while a required legacy document is delayed', async () => {
        const { read } = makeWallet([
            record(1, 'First aid indexed'),
            { ...record(2), title: undefined },
        ]);
        const delayed = deferred<{ name: string }>();
        read.mockReturnValue(delayed.promise);
        const { result } = renderHook(
            () => useCredentialCollection(undefined, { mode: 'search', search: 'first aid' }),
            { wrapper }
        );
        await waitFor(() => expect(read).toHaveBeenCalledTimes(1));
        expect(result.current.isComplete).toBe(false);
        expect(result.current.matches.map(row => row.uri)).toEqual(['uri-1']);
        await act(async () => delayed.resolve({ name: 'First aid legacy' }));
        await waitFor(() => expect(result.current.isComplete).toBe(true));
        expect(result.current.matches.map(row => row.uri)).toEqual(['uri-1', 'uri-2']);
    });
    it('bounds missing-title resolution and stops scheduling when search closes', async () => {
        const { read } = makeWallet(
            Array.from({ length: 9 }, (_, i) => ({ ...record(i), title: undefined }))
        );
        const pending = Array.from({ length: 9 }, () => deferred<{ name: string }>());
        read.mockImplementation(uri => pending[Number(uri.split('-')[1])].promise);
        const { result, rerender } = renderHook(
            ({ mode }: CredentialCollectionOptions) =>
                useCredentialCollection(undefined, { mode, search: 'first aid' }),
            { wrapper, initialProps: { mode: 'search' } as CredentialCollectionOptions }
        );
        await waitFor(() => expect(read).toHaveBeenCalledTimes(4));
        expect(result.current.isComplete).toBe(false);
        rerender({ mode: 'browse' });
        await act(async () => pending.forEach(item => item.resolve({ name: 'First aid' })));
        expect(read).toHaveBeenCalledTimes(4);
    });
    it('resolves all legacy batches without exceeding four simultaneous reads', async () => {
        const { read } = makeWallet(
            Array.from({ length: 9 }, (_, i) => ({ ...record(i), title: undefined }))
        );
        let active = 0;
        let maximum = 0;
        read.mockImplementation(async uri => {
            active++;
            maximum = Math.max(maximum, active);
            await new Promise(resolve => setTimeout(resolve, 5));
            active--;
            return { name: uri === 'uri-8' ? 'First aid' : 'Other' };
        });
        const { result } = renderHook(
            () => useCredentialCollection(undefined, { mode: 'search', search: 'first aid' }),
            { wrapper }
        );
        await waitFor(() => expect(result.current.isComplete).toBe(true));
        expect(maximum).toBeLessThanOrEqual(4);
        expect(result.current.matches.map(row => row.uri)).toEqual(['uri-8']);
    });
    it('continues past an internal-only page and stops recent loading at the display limit', async () => {
        const rows = [
            ...Array.from({ length: 12 }, (_, i) => record(i, 'Internal', 'VerifiableData')),
            ...Array.from({ length: 25 }, (_, i) => record(i + 12)),
        ];
        const { getPage, read } = makeWallet(rows);
        const { result } = renderHook(
            () => useCredentialCollection(undefined, { mode: 'recent', limit: 5 }),
            { wrapper }
        );
        await waitFor(() => expect(result.current.records[0]?.uri).toBe('uri-12'));
        expect(result.current.records.slice(0, 5).map(row => row.uri)).toEqual([
            'uri-12',
            'uri-13',
            'uri-14',
            'uri-15',
            'uri-16',
        ]);
        expect(getPage).toHaveBeenCalledTimes(2);
        expect(result.current.isComplete).toBe(false);
        expect(read).not.toHaveBeenCalled();
    });
    it('keeps counts unknown until metadata ends, excludes internal/hidden rows and deduplicates', async () => {
        const rows = [
            ...Array.from({ length: 37 }, (_, i) => record(i)),
            record(0),
            record(40, 'Secret', 'Hidden'),
            record(41, 'System', 'AI Insight'),
            { ...record(42), id: '__verifiable_data_preferences' },
            record(43, 'Self-Assigned Skills'),
        ];
        const { getPage, read } = makeWallet(rows);
        const final = deferred<{ records: LCR[]; hasMore: boolean; cursor: string }>();
        getPage.mockImplementation(async (_query, options) =>
            Number(options.cursor ?? 0) === 36
                ? final.promise
                : {
                      records: rows.slice(
                          Number(options.cursor ?? 0),
                          Number(options.cursor ?? 0) + 12
                      ),
                      hasMore: true,
                      cursor: String(Number(options.cursor ?? 0) + 12),
                  }
        );
        const { result } = renderHook(
            () => useCredentialCollection(undefined, { mode: 'complete' }),
            { wrapper }
        );
        await waitFor(() => expect(getPage).toHaveBeenCalledTimes(4));
        expect(result.current.isComplete).toBe(false);
        await act(async () =>
            final.resolve({ records: rows.slice(36), hasMore: false, cursor: '48' })
        );
        await waitFor(() => expect(result.current.isComplete).toBe(true));
        expect(result.current.records.map(row => row.uri)).toEqual(
            Array.from({ length: 37 }, (_, i) => `uri-${i}`)
        );
        expect(read).not.toHaveBeenCalled();
    });
    it.each(['initial', 'later'] as const)(
        'distinguishes %s page failure and retries without losing cards',
        async failure => {
            const rows = Array.from({ length: 37 }, (_, i) => record(i));
            const { getPage } = makeWallet(rows);
            let fail = true;
            getPage.mockImplementation(async (_query, options) => {
                const start = Number(options.cursor ?? 0);
                if (fail && start === (failure === 'initial' ? 0 : 12)) throw new Error('offline');
                return {
                    records: rows.slice(start, start + 12),
                    hasMore: start + 12 < rows.length,
                    cursor: String(start + 12),
                };
            });
            const { result } = renderHook(
                () => useCredentialCollection(undefined, { mode: 'complete' }),
                { wrapper }
            );
            await waitFor(() => expect(result.current.isError).toBe(true));
            expect(result.current.isComplete).toBe(false);
            expect(result.current.records.map(row => row.uri)).toEqual(
                failure === 'later' ? rows.slice(0, 12).map(row => row.uri) : []
            );
            const failedCalls = getPage.mock.calls.length;
            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 20));
            });
            expect(getPage).toHaveBeenCalledTimes(failedCalls);
            fail = false;
            await act(async () => {
                await result.current.retry();
            });
            await waitFor(() => expect(result.current.isComplete).toBe(true));
            expect(result.current.records.map(row => row.uri)).toEqual(rows.map(row => row.uri));
        }
    );
    it('preserves metadata matches after failed content resolution and retries legacy content', async () => {
        const { read } = makeWallet([record(1, 'First aid'), { ...record(2), title: undefined }]);
        read.mockRejectedValueOnce(new Error('offline')).mockResolvedValue({
            name: 'First aid legacy',
        });
        const { result } = renderHook(
            () => useCredentialCollection(undefined, { mode: 'search', search: 'first aid' }),
            { wrapper }
        );
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.isComplete).toBe(false);
        expect(result.current.matches.map(row => row.uri)).toEqual(['uri-1']);
        await act(async () => {
            await result.current.retry();
        });
        await waitFor(() => expect(result.current.isComplete).toBe(true));
        expect(result.current.matches.map(row => row.uri)).toEqual(['uri-1', 'uri-2']);
    });
    it('never exposes another root account or switched-account records while its reader changes', async () => {
        makeWallet([record(1)], 'account-a');
        const { result, rerender } = renderHook(
            () => useCredentialCollection(undefined, { mode: 'complete' }),
            { wrapper }
        );
        await waitFor(() => expect(result.current.isComplete).toBe(true));
        host.switchedDid = 'account-b';
        rerender();
        expect(result.current.records).toEqual([]);
        expect(result.current.isComplete).toBe(false);
        makeWallet([record(2)], 'account-b');
        rerender();
        await waitFor(() => expect(result.current.records.map(row => row.uri)).toEqual(['uri-2']));
        host.switchedDid = undefined;
        makeWallet([record(3)], 'account-c');
        rerender();
        expect(result.current.records).toEqual([]);
        await waitFor(() => expect(result.current.records.map(row => row.uri)).toEqual(['uri-3']));
    });
    it('does not admit a late response from the previous root account', async () => {
        const first = makeWallet([record(1)], 'account-a');
        const oldPage = deferred<{ records: LCR[]; hasMore: boolean; cursor: string }>();
        first.getPage.mockReturnValue(oldPage.promise);
        const { result, rerender } = renderHook(
            () => useCredentialCollection(undefined, { mode: 'complete' }),
            { wrapper }
        );
        await waitFor(() => expect(first.getPage).toHaveBeenCalledTimes(1));
        makeWallet([record(2)], 'account-b');
        rerender();
        await waitFor(() => expect(result.current.records.map(row => row.uri)).toEqual(['uri-2']));
        await act(async () =>
            oldPage.resolve({ records: [record(1)], hasMore: false, cursor: '12' })
        );
        expect(result.current.records.map(row => row.uri)).toEqual(['uri-2']);
    });
    it('counts only visible records in a requested skills category across pages', async () => {
        const rows = [
            ...Array.from({ length: 13 }, (_, i) => record(i, `Skill evidence ${i}`, 'Skill')),
            { ...record(50, 'Internal', 'Skill'), id: '__verifiable_data_skill' },
            record(51, 'Self-Assigned Skills', 'Skill'),
            record(52, 'Other badge'),
        ];
        const { read } = makeWallet(rows);
        const { result } = renderHook(
            () => useCredentialCollection('Skill', { mode: 'complete' }),
            { wrapper }
        );
        await waitFor(() => expect(result.current.isComplete).toBe(true));
        expect(result.current.records.map(row => row.uri)).toEqual(
            Array.from({ length: 13 }, (_, i) => `uri-${i}`)
        );
        expect(read).not.toHaveBeenCalled();
    });
    it('does not expand browsing or resolve all cards just because another view completed metadata totals', async () => {
        const rows = Array.from({ length: 37 }, (_, i) => record(i));
        const { getPage, read } = makeWallet(rows);
        const { result } = renderHook(
            () => ({
                count: useCredentialCollection(undefined, { mode: 'complete' }),
                browse: useCredentialCollection(),
            }),
            { wrapper }
        );
        await waitFor(() => expect(result.current.count.isComplete).toBe(true));
        expect(result.current.count.records).toEqual(rows);
        expect(result.current.browse.records.map(row => row.uri)).toEqual(
            rows.slice(0, 12).map(row => row.uri)
        );
        expect(result.current.browse.isComplete).toBe(false);
        expect(result.current.browse.hasNextPage).toBe(true);
        await act(async () => {
            await result.current.browse.fetchNextPage();
        });
        expect(result.current.browse.records.map(row => row.uri)).toEqual(
            rows.slice(0, 24).map(row => row.uri)
        );
        await act(async () => {
            await result.current.browse.fetchNextPage();
        });
        await act(async () => {
            await result.current.browse.fetchNextPage();
        });
        expect(result.current.browse.records).toEqual(rows);
        expect(result.current.browse.isComplete).toBe(true);
        expect(getPage).toHaveBeenCalledTimes(4);
        expect(read).not.toHaveBeenCalled();
    });
    it('keeps proactive document prefetch bounded when a shared metadata count reaches the end', async () => {
        const rows = Array.from({ length: 37 }, (_, i) => record(i));
        const { read } = makeWallet(rows);
        const { result } = renderHook(
            () => ({
                count: useCredentialCollection(undefined, { mode: 'complete' }),
                prefetch: usePrefetchCredentialPage(),
            }),
            { wrapper }
        );
        await waitFor(() => expect(result.current.count.isComplete).toBe(true));
        await waitFor(() =>
            expect(result.current.prefetch.every(result => result.isSuccess)).toBe(true)
        );
        expect(read.mock.calls.map(([uri]) => uri)).toEqual(rows.slice(0, 12).map(row => row.uri));
    });
    it.each([{ rows: [] }, { rows: [record(1)] }])(
        'completes true-empty or no-match only at collection end',
        async ({ rows }) => {
            makeWallet(rows);
            const { result } = renderHook(
                () => useCredentialCollection(undefined, { mode: 'search', search: 'absent' }),
                { wrapper }
            );
            expect(result.current.isComplete).toBe(false);
            await waitFor(() => expect(result.current.isComplete).toBe(true));
            expect(result.current.matches).toEqual([]);
            expect(result.current.records).toEqual(rows);
        }
    );
});

describe('consistent visibility', () => {
    it.each([
        'Self-Assigned Skills',
        'selfAssignedSkills',
        'AI Sessions',
        'ai-topic',
        'Goals',
        'Professional Title',
        'Resume',
        'certificate',
    ])('excludes internal category %s', category =>
        expect(isInternalCredentialCategory(category)).toBe(true)
    );
    it.each(['Certificate', 'Transcript', 'Diploma', 'unknown'])(
        'preserves issued category %s',
        category => expect(isInternalCredentialCategory(category)).toBe(false)
    );
    it('hides explicitly hidden records from the visible collection', () =>
        expect(isCredentialCollectionRecordVisible(record(1, 'Secret', 'Hidden'))).toBe(false));
});

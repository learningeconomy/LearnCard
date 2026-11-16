// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LCR } from '../../../../../packages/learn-card-base/src/types/credential-records';
import type { BespokeLearnCard } from '../../../../../packages/learn-card-base/src/types/learn-card';
import * as m from '../../paraglide/messages.js';

/**
 * Passport tiles over the real useVisibleCredentialCount (LC-2412, LC-2413): the index count
 * once the account's visibility backfill is done, one read of the whole index before that. With the
 * index failing, prod list view shows "Count unavailable" and grid shows "—"; both come from
 * `count === null` in WalletPageItemWrapper.
 */
const host = vi.hoisted(() => ({
    wallet: null as BespokeLearnCard | null,
    viewMode: 1,
    init: vi.fn(),
}));
vi.mock('learn-card-base', async () => {
    const { CredentialCategoryEnum } =
        await import('../../../../../packages/learn-card-base/src/types/boostCategories');
    return {
        useWallet: () => ({ initWallet: host.init }),
        switchedProfileStore: { use: { switchedDid: () => undefined } },
        useVisibleCredentialCount: (...args: Parameters<typeof useVisibleCredentialCount>) =>
            useVisibleCredentialCount(...args),
        CredentialCategoryEnum,
        newCredsStore: { use: { hasNewCredentials: () => false } },
        useGetCredentialsForSkills: () => ({ isLoading: false }),
        useGetAllAiTopicCredentials: () => ({ data: undefined, isLoading: false }),
        useAiInsightCredential: () => ({ data: undefined, isLoading: false }),
        categoryMetadata: {},
        credentialWithEditsHelper: (vc: unknown) => vc,
    };
});
vi.mock('../../../../../packages/learn-card-base/src/stores/walletStore', () => ({
    walletStore: { use: { wallet: () => host.wallet } },
    switchedProfileStore: {
        use: { switchedDid: () => undefined },
        get: { switchedDid: () => undefined },
    },
}));
vi.mock('../../../../../packages/learn-card-base/src/stores/NetworkStore', () => ({
    networkStore: { use: { cloudUrl: () => 'cloud' } },
}));
vi.mock('learn-card-base/hooks/useWallet', () => ({ getCategoryForCredential: vi.fn() }));
vi.mock(
    '../../../../../packages/learn-card-base/src/react-query/mutations/syncConsentFlow',
    () => ({
        useSyncConsentContractsMutation: vi.fn(),
        useAcceptAndStoreCredentialsMutation: vi.fn(),
    })
);
vi.mock('learn-card-base/hooks/useConsentedContracts', () => ({
    getOrFetchConsentedContracts: vi.fn(),
}));
vi.mock('learn-card-base/hooks/useGetCredentialRecordForBoost', () => ({
    getOrFetchCredentialRecordForBoost: vi.fn(),
}));
vi.mock('@ionic/react', () => ({
    IonSpinner: (props: { 'aria-label'?: string }) => (
        <span role="status" aria-label={props['aria-label']} />
    ),
    IonSkeletonText: () => null,
}));
vi.mock('../../theme/hooks/useTheme', () => ({
    useTheme: () => ({
        theme: { id: 'colorful' },
        colors: {},
        getStyleSet: () => ({}),
        getThemedCategory: () => ({
            icons: { IconWithShape: () => null, Icon: () => null },
            colors: {},
        }),
    }),
}));
vi.mock('../../theme/styles', () => ({ StyleSetEnum: { wallet: 'wallet' } }));
vi.mock('../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../../stores/passportPageStore', () => ({
    default: { use: { viewMode: () => host.viewMode } },
    PassportPageViewMode: { grid: 0, list: 1 },
}));
vi.mock('../../hooks/useAlignments', () => ({ default: () => ({ alignments: [] }) }));
vi.mock('../ai-insights/ai-insights.helpers', () => ({ quantifyInsights: () => 0 }));

import { useVisibleCredentialCount } from '../../../../../packages/learn-card-base/src/react-query/queries/useVisibleCredentialCount';
import {
    getCredentialVisibilityBackfillKey,
    resetCredentialVisibilityBackfillForTests,
} from '../../../../../packages/learn-card-base/src/helpers/credentialVisibilityBackfill';
import WalletPageItemWrapper from './WalletPageItemWrapper';

const LIST = 1;
const GRID = 0;
const ROWS = Array.from(
    { length: 3 },
    (_, i) =>
        ({ id: String(i), uri: `uri-${i}`, title: `Badge ${i}`, category: 'Social Badge' }) as LCR
);
const SNAPSHOT_KEY = ['useGetCredentialCount', '', '', 'account-a', 'index-snapshot'];
const COUNT_KEY = ['useGetCredentialCount', '', 'Social Badge', 'account-a', 'visible'];
type Page = { records: LCR[]; hasMore: boolean; cursor: string };
const allRows = (): Page => ({ records: ROWS, hasMore: false, cursor: '3' });

let client: QueryClient;
type Source = 'walk' | 'count';
let source: Source = 'walk';
/** The index call that feeds the tile in this mode, as a mock that resolves to all rows. */
const makeWallet = () => {
    const getPage = vi.fn(async (): Promise<Page> => allRows());
    const getCount = vi.fn(async (): Promise<number> => ROWS.length);
    host.wallet = {
        id: { did: () => 'account-a' },
        index: { LearnCloud: { getPage, getCount } },
    } as unknown as BespokeLearnCard;
    if (source === 'count') {
        window.localStorage.setItem(
            getCredentialVisibilityBackfillKey('account-a', 'cloud'),
            'complete'
        );
    }
    const feed = source === 'walk' ? getPage : getCount;
    return {
        feed,
        hold: () => {
            const held = Promise.withResolvers<void>();
            feed.mockImplementationOnce((async () => {
                await held.promise;
                return source === 'walk' ? allRows() : ROWS.length;
            }) as never);
            return held;
        },
        others: source === 'walk' ? getCount : getPage,
    };
};
const feedKey = () => (source === 'walk' ? SNAPSHOT_KEY : COUNT_KEY);
const renderTile = () =>
    render(
        <QueryClientProvider client={client}>
            <WalletPageItemWrapper
                handleClickSquare={vi.fn()}
                walletPageItem={{
                    categoryId: 'Social Badge' as never,
                    labels: { singular: 'Badge', plural: 'Badges' },
                }}
            />
        </QueryClientProvider>
    );
const LIST_COUNT = () => m['wallet.itemCountOther']({ count: 3 });
const UNAVAILABLE = () => m['credentialCollection.countUnavailable']();
const shown = (viewMode: number) => (viewMode === LIST ? LIST_COUNT() : '3');
const unavailable = (viewMode: number) => (viewMode === LIST ? UNAVAILABLE() : '—');

beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    host.wallet = null;
    window.localStorage.clear();
    resetCredentialVisibilityBackfillForTests();
    host.init.mockImplementation(async () => host.wallet);
});
afterEach(() => {
    cleanup();
    client.clear();
    vi.clearAllMocks();
});

describe.each([
    ['list', LIST, 'walk'],
    ['grid', GRID, 'walk'],
    ['list', LIST, 'count'],
    ['grid', GRID, 'count'],
] as const)('WalletPageItemWrapper %s view from the %s', (_label, viewMode, from) => {
    beforeEach(() => {
        host.viewMode = viewMode;
        source = from;
    });

    it('keeps the cached count, not a spinner, while it refetches', async () => {
        const { hold, others } = makeWallet();
        renderTile();
        await screen.findByText(shown(viewMode));

        const held = hold();
        await act(async () => {
            void client.refetchQueries({ queryKey: feedKey() });
        });
        await waitFor(() => expect(client.isFetching({ queryKey: feedKey() })).toBe(1));
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
        });
        expect(screen.getByText(shown(viewMode))).toBeTruthy();
        expect(screen.queryByRole('status')).toBeNull();
        // The count path never reads the index. Before the backfill, the untrusted count goes
        // out with the marker read, and the whole index is read once, in 100-record pages.
        if (source === 'count') expect(others).not.toHaveBeenCalled();
        else expect(others).toHaveBeenCalledTimes(1);

        await act(async () => held.resolve());
    });

    it('keeps the cached count, not the unavailable state, after a failed refresh', async () => {
        const { feed } = makeWallet();
        renderTile();
        await screen.findByText(shown(viewMode));

        feed.mockRejectedValue(new Error('index blocked'));
        await act(async () => {
            await client.invalidateQueries({ queryKey: feedKey() }).catch(() => undefined);
        });
        await waitFor(() => expect(client.getQueryState(feedKey())?.status).toBe('error'));
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
        });
        expect(screen.getByText(shown(viewMode))).toBeTruthy();
        expect(screen.queryByText(unavailable(viewMode))).toBeNull();
    });

    it('shows the unavailable state when there is no count yet and the index fails', async () => {
        const { feed } = makeWallet();
        feed.mockRejectedValue(new Error('index blocked'));
        renderTile();
        await screen.findByText(unavailable(viewMode));
        expect(screen.queryByRole('status')).toBeNull();
    });
});

// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LCR } from '../../../../../packages/learn-card-base/src/types/credential-records';
import type { BespokeLearnCard } from '../../../../../packages/learn-card-base/src/types/learn-card';
import * as m from '../../paraglide/messages.js';

/**
 * Passport tiles over the real useCredentialCollection + useGetCredentialList (LC-2412).
 * With index.get failing, prod list view shows "Count unavailable" and grid shows "—";
 * both come from `count === null` in WalletPageItemWrapper.
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
        useCredentialCollection: (...args: Parameters<typeof useCredentialCollection>) =>
            useCredentialCollection(...args),
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

import { useCredentialCollection } from '../../../../../packages/learn-card-base/src/react-query/queries/useCredentialCollection';
import WalletPageItemWrapper from './WalletPageItemWrapper';

const LIST = 1;
const GRID = 0;
const ROWS = Array.from(
    { length: 3 },
    (_, i) =>
        ({ id: String(i), uri: `uri-${i}`, title: `Badge ${i}`, category: 'Social Badge' }) as LCR
);
const LIST_KEY = ['useGetCredentialList', '', '', 'account-a'];
type Page = { records: LCR[]; hasMore: boolean; cursor: string };
const allRows = (): Page => ({ records: ROWS, hasMore: false, cursor: '3' });

let client: QueryClient;
const makeWallet = () => {
    const getPage = vi.fn(async (): Promise<Page> => allRows());
    host.wallet = {
        id: { did: () => 'account-a' },
        index: { LearnCloud: { getPage } },
    } as unknown as BespokeLearnCard;
    return getPage;
};
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
    host.init.mockImplementation(async () => host.wallet);
});
afterEach(() => {
    cleanup();
    client.clear();
    vi.clearAllMocks();
});

describe.each([
    ['list', LIST],
    ['grid', GRID],
])('WalletPageItemWrapper %s view', (_label, viewMode) => {
    beforeEach(() => {
        host.viewMode = viewMode;
    });

    it('keeps the cached count, not a spinner, while a complete walk refetches', async () => {
        const getPage = makeWallet();
        renderTile();
        await screen.findByText(shown(viewMode));

        const held = Promise.withResolvers<Page>();
        getPage.mockImplementationOnce(() => held.promise);
        await act(async () => {
            void client.refetchQueries({ queryKey: LIST_KEY });
        });
        await waitFor(() => expect(client.isFetching({ queryKey: LIST_KEY })).toBe(1));
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
        });
        expect(screen.getByText(shown(viewMode))).toBeTruthy();
        expect(screen.queryByRole('status')).toBeNull();

        await act(async () => held.resolve(allRows()));
    });

    it('keeps the cached count, not the unavailable state, after a failed refresh', async () => {
        const getPage = makeWallet();
        renderTile();
        await screen.findByText(shown(viewMode));

        getPage.mockRejectedValue(new Error('index.get blocked'));
        await act(async () => {
            await client.invalidateQueries({ queryKey: LIST_KEY }).catch(() => undefined);
        });
        await waitFor(() => expect(client.getQueryState(LIST_KEY)?.status).toBe('error'));
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 20));
        });
        expect(screen.getByText(shown(viewMode))).toBeTruthy();
        expect(screen.queryByText(unavailable(viewMode))).toBeNull();
    });

    it('shows the unavailable state when no walk has completed and the index fails', async () => {
        const getPage = makeWallet();
        getPage.mockRejectedValue(new Error('index.get blocked'));
        renderTile();
        await screen.findByText(unavailable(viewMode));
        expect(screen.queryByRole('status')).toBeNull();
    });
});

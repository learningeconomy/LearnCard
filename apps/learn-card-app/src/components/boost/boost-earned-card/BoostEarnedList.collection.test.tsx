// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LCR } from '../../../../../../packages/learn-card-base/src/types/credential-records';
import type { BespokeLearnCard } from '../../../../../../packages/learn-card-base/src/types/learn-card';
const host = vi.hoisted(() => ({
    wallet: null as BespokeLearnCard | null,
    switchedDid: undefined as string | undefined,
    onScreen: true,
    init: vi.fn(),
}));
vi.mock('learn-card-base', async () => ({
    useWallet: () => ({ initWallet: host.init }),
    switchedProfileStore: { use: { switchedDid: () => host.switchedDid } },
    useCredentialCollection: (...args: Parameters<typeof useCredentialCollection>) =>
        useCredentialCollection(...args),
    CredentialCategoryEnum: (
        await import('../../../../../../packages/learn-card-base/src/types/boostCategories')
    ).CredentialCategoryEnum,
    BoostPageViewMode: { Card: 'card', List: 'list' },
    BrandingEnum: { scoutPass: 'scoutPass' },
    CredentialListSkeleton: () => <div>Loading cards</div>,
    categoryMetadata: {},
    newCredsStore: {},
    credentialWithEditsHelper: (vc: unknown) => vc,
}));
vi.mock('../../../../../../packages/learn-card-base/src/stores/walletStore', () => ({
    walletStore: { use: { wallet: () => host.wallet } },
    switchedProfileStore: {
        use: { switchedDid: () => host.switchedDid },
        get: { switchedDid: () => host.switchedDid },
    },
}));
vi.mock('../../../../../../packages/learn-card-base/src/helpers/credentialHelpers', () => ({
    getCredentialName: (vc: {
        name?: string;
        credentialSubject?: { achievement?: { name?: string } };
    }) => vc.name ?? vc.credentialSubject?.achievement?.name ?? '',
    getCredentialSubjectAchievement: (vc: {
        credentialSubject?: { achievement?: { name?: string } };
    }) => vc.credentialSubject?.achievement,
    getIssuanceDate: () => '',
    SELF_ASSIGNED_SKILLS_BOOST_NAME: 'Self-Assigned Skills',
}));
vi.mock('learn-card-base/hooks/useWallet', () => ({ getCategoryForCredential: vi.fn() }));
vi.mock(
    '../../../../../../packages/learn-card-base/src/react-query/mutations/syncConsentFlow',
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
vi.mock('learn-card-base/hooks/useOnScreen', () => ({ default: () => host.onScreen }));
vi.mock('learn-card-base/stores/credentialSearchStore', () => ({
    default: { use: { isSearchActive: () => false, searchString: () => '' } },
}));
vi.mock('@ionic/react', () => ({
    IonCol: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonGrid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonRow: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    IonIcon: () => null,
    IonSpinner: () => null,
}));
vi.mock('ionicons/icons', () => ({ closeOutline: 'close' }));
vi.mock('../../../stores/loadingStore', () => ({
    useLoadingLine: vi.fn(),
}));
vi.mock('../../main-subheader/MainSubHeader.types', () => ({
    credentialCategoryToSubheaderType: () => 'badge',
    SubheaderContentType: { badge: { bgColor: '' } },
}));
vi.mock('../../empty-placeholder/CategoryEmptyPlaceHolder', () => ({ default: () => null }));
vi.mock('./BoostEarnedCard', () => ({
    default: ({ record }: { record: { uri: string } }) => (
        <article data-credential-uri={record.uri}>{record.uri}</article>
    ),
}));
vi.mock('./BoostEarnedIDCard', () => ({
    default: ({ record }: { record: { uri: string } }) => (
        <article data-credential-uri={record.uri}>{record.uri}</article>
    ),
}));
vi.mock('../../../pages/wallet/activity-feed/PassportCredentialCard', () => ({
    default: ({ record }: { record: { uri: string } }) => (
        <article data-credential-uri={record.uri}>{record.uri}</article>
    ),
}));
import { useCredentialCollection } from '../../../../../../packages/learn-card-base/src/react-query/queries/useCredentialCollection';
import { AllCredentialsModal } from '../../../pages/wallet/activity-feed/AllCredentialsModal';
import LcaBoostEarnedList from './BoostEarnedList';
import BoostEarnedIDList from './BoostEarnedIDList';
let client: QueryClient;
const record = (
    i: number,
    title: string | undefined = `Badge ${i}`,
    category = 'Social Badge'
): LCR => ({ id: String(i), uri: `uri-${i}`, title, category }) as LCR;
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
    const read = vi.fn<(uri: string) => Promise<{ name: string } | undefined>>(async uri => ({
        name: `Resolved ${uri}`,
    }));
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
    host.onScreen = false;
    host.init.mockImplementation(async () => host.wallet);
});
afterEach(() => {
    cleanup();
    client.clear();
    vi.clearAllMocks();
});

describe('buffered collection consumers', () => {
    const CountCompletionConsumer = ({
        category,
    }: {
        category: Parameters<typeof useCredentialCollection>[0];
    }) => {
        const collection = useCredentialCollection(category, { mode: 'complete' });
        return (
            <output data-testid="count-scan" data-complete={String(collection.isComplete)}>
                {collection.records.length}
            </output>
        );
    };

    const scenarios = [
        {
            name: 'AllCredentialsModal',
            category: undefined,
            consumer: () => <AllCredentialsModal onClose={vi.fn()} />,
        },
        {
            name: 'LCA BoostEarnedList',
            category: 'Social Badge' as never,
            consumer: () => (
                <LcaBoostEarnedList
                    category={'Social Badge' as never}
                    viewMode={'list' as never}
                    defaultImg=""
                    title="Badges"
                />
            ),
        },
        {
            name: 'LCA BoostEarnedIDList',
            category: 'ID' as never,
            consumer: () => (
                <BoostEarnedIDList
                    category={'ID' as never}
                    viewMode={'list' as never}
                    defaultImg=""
                    title="IDs"
                />
            ),
        },
    ];

    it.each(scenarios)(
        '$name scrolls all buffered identities after a count consumer exhausts server pages',
        async ({ category, consumer }) => {
            const rows = Array.from({ length: 37 }, (_, index) =>
                record(index, `Credential ${index + 1}`, category ?? 'Social Badge')
            );
            const { getPage } = makeWallet(rows);
            const CountAndBrowse = () => (
                <>
                    <CountCompletionConsumer category={category} />
                    {consumer()}
                </>
            );
            const view = () =>
                render(
                    <QueryClientProvider client={client}>
                        <CountAndBrowse />
                    </QueryClientProvider>
                );

            const rendered = view();
            await waitFor(() => {
                expect(screen.getByTestId('count-scan').getAttribute('data-complete')).toBe('true');
                expect(screen.getByTestId('count-scan').textContent).toBe('37');
            });
            expect(screen.getAllByRole('article')).toHaveLength(12);
            expect(getPage).toHaveBeenCalledTimes(4);

            host.onScreen = true;
            rendered.rerender(
                <QueryClientProvider client={client}>
                    <CountAndBrowse />
                </QueryClientProvider>
            );

            await waitFor(() => {
                expect(screen.getAllByRole('article')).toHaveLength(37);
                expect(
                    screen
                        .getAllByRole('article')
                        .map(card => card.getAttribute('data-credential-uri'))
                ).toEqual(rows.map(row => row.uri));
            });
            expect(getPage).toHaveBeenCalledTimes(4);
        }
    );
});

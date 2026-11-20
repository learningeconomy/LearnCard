// @vitest-environment happy-dom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LCR } from '../../../../../../packages/learn-card-base/src/types/credential-records';
import type { BespokeLearnCard } from '../../../../../../packages/learn-card-base/src/types/learn-card';
import * as m from '../../../paraglide/messages.js';
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
vi.mock('./BoostEarnedCard', () => ({
    default: ({ uri }: { uri: string }) => <article data-credential-uri={uri}>{uri}</article>,
    BoostEarnedCardSkeleton: () => null,
}));
import { useCredentialCollection } from '../../../../../../packages/learn-card-base/src/react-query/queries/useCredentialCollection';
import ScoutsBoostEarnedList from './BoostEarnedList';
let client: QueryClient;
const intersections = new Map<Element, (visible: boolean) => void>();
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
    intersections.clear();
    vi.stubGlobal(
        'IntersectionObserver',
        class {
            constructor(private readonly callback: IntersectionObserverCallback) {}
            observe(target: Element) {
                const emit = (isIntersecting: boolean) =>
                    this.callback(
                        [{ target, isIntersecting } as IntersectionObserverEntry],
                        this as unknown as IntersectionObserver
                    );
                intersections.set(target, emit);
                emit(host.onScreen);
            }
            unobserve(target: Element) {
                intersections.delete(target);
            }
        }
    );
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
    vi.unstubAllGlobals();
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
            name: 'Scouts BoostEarnedList',
            category: 'Social Badge' as never,
            consumer: (viewMode = 'list') => (
                <ScoutsBoostEarnedList
                    category={'Social Badge' as never}
                    viewMode={viewMode as never}
                    defaultImg=""
                    title="Badges"
                />
            ),
        },
    ];

    it.each(
        scenarios.flatMap(scenario =>
            [
                { initialView: 'card', nextView: 'list' },
                { initialView: 'list', nextView: 'card' },
            ].map(views => ({ ...scenario, ...views }))
        )
    )(
        '$name paginates after switching from $initialView to $nextView off-screen',
        async ({ category, consumer, initialView, nextView }) => {
            const rows = Array.from({ length: 37 }, (_, index) =>
                record(index, `Credential ${index + 1}`, category)
            );
            makeWallet(rows);
            const view = (mode: string) => (
                <QueryClientProvider client={client}>{consumer(mode)}</QueryClientProvider>
            );
            const rendered = render(view(initialView));
            await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(12));
            rendered.rerender(view(nextView));
            for (const count of [24, 36, 37]) {
                const sentinel = rendered.container.querySelector('[role="presentation"]');
                act(() => {
                    if (sentinel) intersections.get(sentinel)?.(true);
                });
                await waitFor(() => {
                    const displayed = screen
                        .getAllByRole('article')
                        .map(card => card.getAttribute('data-credential-uri'));
                    expect(displayed).toEqual(rows.slice(0, displayed.length).map(row => row.uri));
                    expect(displayed).toContain(rows[count - 1].uri);
                });
            }
        }
    );

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
            act(() => intersections.forEach(emit => emit(true)));

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
    it.each(scenarios)(
        '$name keeps loaded identities through a failed page and resumes scrolling after retry',
        async ({ category, consumer }) => {
            const rows = Array.from({ length: 37 }, (_, index) =>
                record(index, `Credential ${index + 1}`, category ?? 'Social Badge')
            );
            const { getPage } = makeWallet(rows);
            const page = getPage.getMockImplementation()!;
            let fail = true;
            let retryStarted = false;
            let release: () => void = () => undefined;
            const gate = new Promise<void>(resolve => {
                release = resolve;
            });
            getPage.mockImplementation(async (query, options) => {
                if (options?.cursor === '12') {
                    if (fail) throw new Error('Page unavailable');
                    retryStarted = true;
                    await gate;
                }
                return page(query, options);
            });
            host.onScreen = true;
            render(<QueryClientProvider client={client}>{consumer()}</QueryClientProvider>);
            const status = screen
                .getAllByRole('status')
                .find(element => element.getAttribute('aria-atomic') === 'true');
            expect(status).toBeDefined();
            try {
                const retry = await vi.waitFor(() =>
                    screen.getByRole('button', {
                        name: 'Retry loading credentials',
                    })
                );
                expect(status?.textContent).toBe(
                    m['credentialCollection.loadError']({ count: 12 })
                );
                expect(
                    screen
                        .getAllByRole('article')
                        .map(card => card.getAttribute('data-credential-uri'))
                ).toEqual(rows.slice(0, 12).map(row => row.uri));
                fail = false;
                retry.focus();
                fireEvent.click(retry);
                await vi.waitFor(() => expect(retryStarted).toBe(true));
                expect(document.activeElement).toBe(retry);
            } finally {
                release();
            }
            await vi.waitFor(() =>
                expect(
                    screen
                        .getAllByRole('article')
                        .map(card => card.getAttribute('data-credential-uri'))
                ).toEqual(rows.map(row => row.uri))
            );
            expect(screen.getByRole('status')).toBe(status);
            expect(status?.textContent).toBe('');
        }
    );

    it.each(scenarios)(
        '$name automatically reaches visible records after internal-only pages',
        async ({ category, consumer }) => {
            const visible = Array.from({ length: 13 }, (_, index) =>
                record(index, `Visible ${index}`, category ?? 'Social Badge')
            );
            const internal = Array.from({ length: 24 }, (_, index) => ({
                ...record(index + 13, 'Internal', category ?? 'Social Badge'),
                id: `__verifiable_data_${index}`,
            }));
            makeWallet([...internal, ...visible]);
            host.onScreen = true;
            render(<QueryClientProvider client={client}>{consumer()}</QueryClientProvider>);
            await vi.waitFor(() =>
                expect(
                    screen
                        .getAllByRole('article')
                        .map(card => card.getAttribute('data-credential-uri'))
                ).toEqual(visible.map(row => row.uri))
            );
        }
    );
});

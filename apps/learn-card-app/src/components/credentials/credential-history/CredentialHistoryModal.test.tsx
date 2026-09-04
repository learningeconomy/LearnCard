// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import type { VC } from '@learncard/types';
import type { LCR } from 'learn-card-base/types/credential-records';

/**
 * Credential refresh history + Updated indicator tests (LC-2117/LC-2135/LC-2136 Task 15).
 *
 * Covers:
 * - The emerald `Updated` pill renders while the encrypted index record carries
 *   `refresh.unreadUpdate`, and only clears after the credential detail is successfully
 *   opened AND the cleared flag is persisted back to the same encrypted index record.
 *   The update date remains visible after the pill disappears.
 * - The `View Previous Versions` menu action is offered only when encrypted local
 *   history exists on the record (earned credentials only).
 * - The history modal lists locally retained versions newest to oldest, opens a
 *   read-only detail for resolvable blobs, shows friendly copy for unavailable
 *   historical blobs, and keeps locally stored history for revoked credentials.
 */

const modalHost = vi.hoisted(() => ({
    newModal: vi.fn(),
    closeModal: vi.fn(),
    closeAllModals: vi.fn(),
}));

const walletHost = vi.hoisted(() => ({
    indexUpdate: vi.fn(),
    readGet: vi.fn(),
}));

// The learn-card-base barrel pulls the web3auth stack and cannot load under jsdom;
// stub the exact surface the card, menu, and modal consume.
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    useModal: () => ({
        newModal: modalHost.newModal,
        closeModal: modalHost.closeModal,
        closeAllModals: modalHost.closeAllModals,
    }),
    ModalTypes: { FullScreen: 'FullScreen', Cancel: 'Cancel', Center: 'Center' },
    useWallet: () => ({
        initWallet: async () => ({
            index: { LearnCloud: { update: walletHost.indexUpdate } },
            read: { get: walletHost.readGet },
        }),
    }),
    useToast: () => ({ presentToast: vi.fn() }),
    ToastTypeEnum: { Success: 'success', Error: 'error' },
    useConfirmation: () => vi.fn(),
    useGetRecordForUri: () => ({ data: undefined }),
    useDeleteCredentialRecord: () => ({ mutateAsync: vi.fn() }),
    useDeleteManagedBoostMutation: () => ({ mutateAsync: vi.fn() }),
    CredentialSubjectDisplay: () => null,
    useGetVCInfo: () => ({
        issuerName: 'Example University',
        issueeName: 'Ada Learner',
        title: 'Example Achievement',
        achievementType: 'Achievement',
        formattedAchievementType: 'Achievement',
        badgeThumbnail: undefined,
        isClrCredential: false,
        linkedCredentialCount: 0,
        displayType: 'badge',
        loading: false,
    }),
    useGetResolvedCredential: () => ({ data: undefined, isFetching: false, isLoading: false }),
    useGetCredentialWithEdits: () => ({ credentialWithEdits: undefined }),
    DisplayTypeEnum: { Certificate: 'certificate', ID: 'id', Award: 'award' },
    categoryMetadata: {
        Achievement: {
            walletSubtype: 'achievement',
            color: 'emerald-100',
            darkColor: 'emerald-700',
        },
    },
    BoostPageViewMode: { Card: 'card' },
    BoostGenericCardWrapper: ({
        innerOnClick,
        optionsTriggerOnClick,
        customTitle,
    }: {
        innerOnClick?: () => void;
        optionsTriggerOnClick?: () => void;
        customTitle?: React.ReactNode;
    }) => (
        <div>
            {customTitle}
            <button type="button" onClick={innerOnClick}>
                Open credential
            </button>
            {optionsTriggerOnClick && (
                <button type="button" onClick={optionsTriggerOnClick}>
                    Card options
                </button>
            )}
        </div>
    ),
    resetIonicModalBackground: vi.fn(),
    BoostCategoryOptionsEnum: { family: 'Family' },
    newCredsStore: {
        use: { newCreds: () => ({}) },
        set: { removeCreds: vi.fn(), addNewCreds: vi.fn() },
    },
}));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (vc: unknown) => vc,
    isBoostCredential: () => true,
    getClrLinkedCredentials: () => [],
}));

vi.mock('learn-card-base/components/CredentialBadge/CredentialVerificationDisplay', () => ({
    getInfoFromCredential: () => ({ createdAt: '2026-08-06' }),
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BadgeSkeleton', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons', () => ({
    default: () => null,
}));

vi.mock('learn-card-base/components/id/IDDisplayCard', () => ({ default: () => null }));
vi.mock('learn-card-base/components/CredentialBadge/CredentialBadgeNew', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/svgs/ReplyIcon', () => ({ default: () => null }));
vi.mock('learn-card-base/svgs/TimeCircle', () => ({ default: () => null }));

vi.mock('../../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../../../theme/hooks/useTheme', () => ({
    default: () => ({ getThemedCategory: () => undefined }),
}));
vi.mock('src/hooks/useCredentialStatus', () => ({ useCredentialStatus: () => undefined }));
vi.mock('../../boost/boostHelpers', () => ({ getDefaultDisplayType: () => 'badge' }));
vi.mock('../../boost/clr-transcript', () => ({
    getClrTranscriptKind: () => 'unknown',
    getClrTranscriptIssuerInfo: () => ({}),
}));
vi.mock('../../boost/boostCMS/BoostPreview/BoostPreview', () => ({ default: () => null }));
vi.mock('../../boost/boostCMS/BoostPreview/NonBoostPreview', () => ({ default: () => null }));
vi.mock('../../boost/boost-options-menu/ShareBoostLink', () => ({ default: () => null }));
vi.mock('../../boost/boost-options-menu/JsonPreviewModal', () => ({ default: () => null }));
vi.mock('../../boost/boost-earned-card/helpers/CustomIssuerName', () => ({ default: () => null }));
vi.mock('../../boost/boost-earned-card/helpers/CustomBoostTitleDisplay', () => ({
    default: () => null,
}));
vi.mock('../../boost/boostLinkedCredentials/BoostLinkedCredentialsBox', () => ({
    default: () => null,
}));
vi.mock('../../boost/boostLinkedCredentials/ClrAchievementsSummaryBox', () => ({
    default: () => null,
}));
vi.mock('../../familyCMS/FamilyCard/FamilyCard', () => ({ default: () => null }));
vi.mock('../../boost/claim-boost-card/BoostClaimCard', () => ({ default: () => null }));

vi.mock('../../../paraglide/messages.js', () => ({
    'alerts.updated': () => 'Updated',
    'credentialHistory.title': () => 'Previous Versions',
    'credentialHistory.empty': () => 'No previous versions are stored on this device.',
    'credentialHistory.unavailable': () => "This version isn't available on this device.",
    'credentialHistory.view': () => 'View',
    'credentialHistory.loadingVersion': () => 'Loading version…',
    'credentialHistory.done': () => 'Done',
    'credentialHistory.updatedOn': ({ date }: { date: string }) => `Updated ${date}`,
    'credentialHistory.versionFrom': ({ date }: { date: string }) => `Version from ${date}`,
    'boost.menu.viewPreviousVersions': () => 'View Previous Versions',
    'boost.menu.manageIssuances': () => 'Manage Issuances',
    'boost.menu.viewData': () => 'View Data',
    'boost.confirmDelete': () => 'Are you sure you want to delete?',
    'common.delete': () => 'Delete',
    'common.share': () => 'Share',
    'toasts.boost.deleteCredentialError': () => 'Unable to delete credential',
}));

import BoostEarnedCard from '../../boost/boost-earned-card/BoostEarnedCard';
import BoostOptionsMenu from '../../boost/boost-options-menu/BoostOptionsMenu';
import useBoostMenu, { BoostMenuType } from '../../boost/hooks/useBoostMenu';
import CredentialHistoryModal from './CredentialHistoryModal';

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:credential:achievement',
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-08-06T00:00:00.000Z',
    credentialSubject: {
        id: 'did:example:learner',
        achievement: { name: 'Example Achievement' },
    },
} as unknown as VC;

const HISTORY_V1 = {
    uri: 'lc:cloud:v1',
    managedVersion: 1,
    effectiveAt: '2026-06-01T12:00:00',
    capturedAt: '2026-06-02T12:00:00',
    updateSummary: 'Initial issuance details',
};

const HISTORY_V2 = {
    uri: 'lc:cloud:v2',
    managedVersion: 2,
    effectiveAt: '2026-08-01T12:00:00',
    capturedAt: '2026-08-02T12:00:00',
    updateSummary: 'Updated employer',
};

const HISTORY_V3 = {
    uri: 'lc:cloud:v3',
    managedVersion: 3,
    effectiveAt: '2026-09-05T12:00:00',
    capturedAt: '2026-09-05T12:30:00',
    updateSummary: 'Corrected completion date',
};

const makeRefreshMetadata = (overrides: Record<string, unknown> = {}) => ({
    serviceId: 'https://network.example.com/refresh/refresh-1',
    serviceType: '1EdTechCredentialRefresh',
    credentialId: 'urn:credential:achievement',
    managedVersion: 4,
    lastCheckedAt: '2026-09-02T12:00:00',
    lastUpdatedAt: '2026-09-01T12:00:00',
    unreadUpdate: true,
    history: [] as unknown[],
    ...overrides,
});

const makeRecord = (overrides: Record<string, unknown> = {}): LCR =>
    ({
        id: 'rec-1',
        uri: 'lc:cloud:current',
        category: 'Achievement',
        refresh: makeRefreshMetadata(),
        ...overrides,
    }) as unknown as LCR;

const makeQueryClient = () =>
    new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

const renderWithClient = (ui: React.ReactElement, client = makeQueryClient()) => {
    const view = render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);

    return { client, ...view };
};

const renderEarnedCard = (record: Partial<LCR>, client = makeQueryClient()) =>
    renderWithClient(
        <BoostEarnedCard
            credential={credential}
            record={record}
            categoryType="Achievement"
            useWrapper={false}
        />,
        client
    );

beforeEach(() => {
    vi.clearAllMocks();
    walletHost.indexUpdate.mockResolvedValue(true);
    walletHost.readGet.mockResolvedValue(credential);
});

afterEach(() => cleanup());

describe('Updated indicator on BoostEarnedCard', () => {
    it('shows the Updated pill while the record has an unread refresh update', () => {
        renderEarnedCard(makeRecord());

        expect(screen.getByTestId('credential-updated-pill')).toHaveTextContent('Updated');
        expect(screen.queryByTestId('credential-updated-date')).toBeNull();
    });

    it('shows the update date without unread emphasis once the update has been read', () => {
        renderEarnedCard(makeRecord({ refresh: makeRefreshMetadata({ unreadUpdate: false }) }));

        expect(screen.queryByTestId('credential-updated-pill')).toBeNull();

        const date = screen.getByTestId('credential-updated-date');

        expect(date.textContent).toContain('Updated');
        expect(date.textContent).toContain('Sep 1, 2026');
    });

    it('renders no update indicator when the record has no refresh metadata', () => {
        renderEarnedCard({ id: 'rec-plain', uri: 'lc:cloud:plain', category: 'Achievement' });

        expect(screen.queryByTestId('credential-updated-pill')).toBeNull();
        expect(screen.queryByTestId('credential-updated-date')).toBeNull();
    });

    it('does not clear the unread flag before the credential detail is opened', () => {
        renderEarnedCard(makeRecord());

        expect(screen.getByTestId('credential-updated-pill')).toBeInTheDocument();
        expect(walletHost.indexUpdate).not.toHaveBeenCalled();
    });

    it('clears the pill only after a successful detail open and persisted metadata update', async () => {
        const client = makeQueryClient();
        const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
        const record = makeRecord();

        const view = render(
            <QueryClientProvider client={client}>
                <BoostEarnedCard
                    credential={credential}
                    record={record}
                    categoryType="Achievement"
                    useWrapper={false}
                />
            </QueryClientProvider>
        );

        // Detail open: the credential renders in the preview modal.
        fireEvent.click(screen.getByRole('button', { name: 'Open credential' }));

        expect(modalHost.newModal).toHaveBeenCalledTimes(1);

        // The cleared flag is persisted on the same encrypted index record, preserving
        // the update date and the rest of the refresh metadata.
        await waitFor(() => expect(walletHost.indexUpdate).toHaveBeenCalledTimes(1));

        expect(walletHost.indexUpdate).toHaveBeenCalledWith('rec-1', {
            refresh: expect.objectContaining({
                unreadUpdate: false,
                lastUpdatedAt: '2026-09-01T12:00:00',
                serviceId: 'https://network.example.com/refresh/refresh-1',
            }),
        });

        await waitFor(() => expect(invalidateSpy).toHaveBeenCalled());

        // The refetched record no longer carries the unread flag: the pill disappears
        // but the update date remains.
        view.rerender(
            <QueryClientProvider client={client}>
                <BoostEarnedCard
                    credential={credential}
                    record={makeRecord({
                        refresh: makeRefreshMetadata({ unreadUpdate: false }),
                    })}
                    categoryType="Achievement"
                    useWrapper={false}
                />
            </QueryClientProvider>
        );

        expect(screen.queryByTestId('credential-updated-pill')).toBeNull();

        const date = screen.getByTestId('credential-updated-date');

        expect(date.textContent).toContain('Sep 1, 2026');
    });

    it('keeps the pill when the metadata update cannot be persisted', async () => {
        walletHost.indexUpdate.mockRejectedValue(new Error('offline'));

        const client = makeQueryClient();
        const invalidateSpy = vi.spyOn(client, 'invalidateQueries');
        const record = makeRecord();

        const view = render(
            <QueryClientProvider client={client}>
                <BoostEarnedCard
                    credential={credential}
                    record={record}
                    categoryType="Achievement"
                    useWrapper={false}
                />
            </QueryClientProvider>
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open credential' }));

        // The detail opened, but persistence failed — the indicator must not clear.
        await waitFor(() => expect(walletHost.indexUpdate).toHaveBeenCalledTimes(1));

        expect(invalidateSpy).not.toHaveBeenCalled();

        view.rerender(
            <QueryClientProvider client={client}>
                <BoostEarnedCard
                    credential={credential}
                    record={record}
                    categoryType="Achievement"
                    useWrapper={false}
                />
            </QueryClientProvider>
        );

        expect(screen.getByTestId('credential-updated-pill')).toBeInTheDocument();
    });
});

describe('View Previous Versions menu action', () => {
    const MenuHarness: React.FC<{ record?: Partial<LCR> }> = ({ record }) => {
        const presentMenu = useBoostMenu({
            credential,
            record,
            categoryType: 'Achievement',
            menuType: BoostMenuType.earned,
        });

        return (
            <button type="button" onClick={() => presentMenu()}>
                Open menu
            </button>
        );
    };

    const presentedMenuElement = (): React.ReactElement => {
        expect(modalHost.newModal).toHaveBeenCalled();

        return modalHost.newModal.mock.calls[0][0] as React.ReactElement;
    };

    it('passes a history handler when the earned record has encrypted local history', () => {
        renderWithClient(
            <MenuHarness
                record={makeRecord({ refresh: makeRefreshMetadata({ history: [HISTORY_V1] }) })}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

        expect(typeof presentedMenuElement().props.onViewHistory).toBe('function');
    });

    it('omits the history handler when the record has no local history', () => {
        renderWithClient(<MenuHarness record={makeRecord()} />);

        fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

        expect(presentedMenuElement().props.onViewHistory).toBeUndefined();
    });

    it('omits the history handler when the record has no refresh metadata', () => {
        renderWithClient(
            <MenuHarness
                record={{ id: 'rec-plain', uri: 'lc:cloud:plain', category: 'Achievement' }}
            />
        );

        fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

        expect(presentedMenuElement().props.onViewHistory).toBeUndefined();
    });

    it('opens the history modal through the shared modal surface', () => {
        const record = makeRecord({ refresh: makeRefreshMetadata({ history: [HISTORY_V1] }) });

        renderWithClient(<MenuHarness record={record} />);

        fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));

        const onViewHistory = presentedMenuElement().props.onViewHistory as () => void;

        onViewHistory();

        expect(modalHost.newModal).toHaveBeenCalledTimes(2);

        const historyModal = modalHost.newModal.mock.calls[1][0] as React.ReactElement;

        expect(historyModal.type).toBe(CredentialHistoryModal);
        expect(historyModal.props.record).toEqual(record);
    });

    it('renders the menu entry for earned credentials with a history handler', () => {
        const onViewHistory = vi.fn();
        const handleCloseModal = vi.fn();

        renderWithClient(
            <BoostOptionsMenu
                handleCloseModal={handleCloseModal}
                handleDelete={vi.fn()}
                boost={credential}
                boostUri="lc:cloud:current"
                record={makeRecord({ refresh: makeRefreshMetadata({ history: [HISTORY_V1] }) })}
                menuType={BoostMenuType.earned}
                categoryType="Achievement"
                onViewHistory={onViewHistory}
            />
        );

        fireEvent.click(screen.getByText('View Previous Versions'));

        expect(handleCloseModal).toHaveBeenCalledTimes(1);
        expect(onViewHistory).toHaveBeenCalledTimes(1);
    });

    it('hides the menu entry without a history handler', () => {
        renderWithClient(
            <BoostOptionsMenu
                handleCloseModal={vi.fn()}
                handleDelete={vi.fn()}
                boost={credential}
                boostUri="lc:cloud:current"
                record={makeRecord()}
                menuType={BoostMenuType.earned}
                categoryType="Achievement"
            />
        );

        expect(screen.queryByText('View Previous Versions')).toBeNull();
    });

    it('hides the menu entry for managed boosts even when a handler is provided', () => {
        renderWithClient(
            <BoostOptionsMenu
                handleCloseModal={vi.fn()}
                handleDelete={vi.fn()}
                boost={credential}
                boostUri="lc:cloud:boost"
                menuType={BoostMenuType.managed}
                categoryType="Achievement"
                onViewHistory={vi.fn()}
            />
        );

        expect(screen.queryByText('View Previous Versions')).toBeNull();
    });
});

describe('CredentialHistoryModal', () => {
    const renderModal = (record: LCR) =>
        renderWithClient(<CredentialHistoryModal record={record} handleCloseModal={vi.fn()} />);

    it('lists locally retained versions newest to oldest', () => {
        // Deliberately out-of-order input: the modal owns the ordering.
        const record = makeRecord({
            refresh: makeRefreshMetadata({ history: [HISTORY_V1, HISTORY_V3, HISTORY_V2] }),
        });

        renderModal(record);

        const rows = screen.getAllByTestId('credential-history-entry');

        expect(rows).toHaveLength(3);
        expect(rows[0]).toHaveTextContent('Corrected completion date');
        expect(rows[0]).toHaveTextContent('Sep 5, 2026');
        expect(rows[1]).toHaveTextContent('Updated employer');
        expect(rows[1]).toHaveTextContent('Aug 1, 2026');
        expect(rows[2]).toHaveTextContent('Initial issuance details');
        expect(rows[2]).toHaveTextContent('Jun 1, 2026');
    });

    it('opens a read-only detail for an available historical version', async () => {
        const historicalVc = { ...credential, id: 'urn:credential:achievement?v2' } as VC;

        walletHost.readGet.mockResolvedValue(historicalVc);

        renderModal(
            makeRecord({ refresh: makeRefreshMetadata({ history: [HISTORY_V1, HISTORY_V2] }) })
        );

        const rows = screen.getAllByTestId('credential-history-entry');

        fireEvent.click(within(rows[0]).getByRole('button', { name: 'View' }));

        await waitFor(() => expect(modalHost.newModal).toHaveBeenCalledTimes(1));

        expect(walletHost.readGet).toHaveBeenCalledWith('lc:cloud:v2');

        const detail = modalHost.newModal.mock.calls[0][0] as React.ReactElement;

        expect(detail.props.credential).toEqual(historicalVc);
        expect(detail.props.credentialUri).toBe('lc:cloud:v2');
        // Read-only: no accept/claim footer for historical versions.
        expect(detail.props.showFooter).toBe(false);
    });

    it('offers no restore or share actions for historical versions', () => {
        renderModal(
            makeRecord({ refresh: makeRefreshMetadata({ history: [HISTORY_V1, HISTORY_V2] }) })
        );

        expect(screen.queryByRole('button', { name: /restore/i })).toBeNull();
        expect(screen.queryByRole('button', { name: /share/i })).toBeNull();
        expect(screen.queryByText(/restore/i)).toBeNull();
    });

    it('shows friendly copy when a historical blob is unavailable and keeps the entry listed', async () => {
        walletHost.readGet.mockRejectedValue(new Error('410 Gone'));

        renderModal(
            makeRecord({ refresh: makeRefreshMetadata({ history: [HISTORY_V1, HISTORY_V2] }) })
        );

        const rows = screen.getAllByTestId('credential-history-entry');

        fireEvent.click(within(rows[0]).getByRole('button', { name: 'View' }));

        await waitFor(() =>
            expect(
                screen.getByText("This version isn't available on this device.")
            ).toBeInTheDocument()
        );

        // No detail modal opens, and the entry remains listed with its date.
        expect(modalHost.newModal).not.toHaveBeenCalled();
        expect(screen.getAllByTestId('credential-history-entry')).toHaveLength(2);
        expect(rows[0]).toHaveTextContent('Aug 1, 2026');
    });

    it('retains locally stored history when the managed service is revoked or unreachable', async () => {
        // A revoked managed refresh aggregate stops serving all versions (410); locally
        // retained encrypted history must remain listed and inspectable offline.
        walletHost.readGet.mockRejectedValue(new Error('410 Gone'));

        renderModal(
            makeRecord({ refresh: makeRefreshMetadata({ history: [HISTORY_V1, HISTORY_V2] }) })
        );

        const rows = screen.getAllByTestId('credential-history-entry');

        expect(rows).toHaveLength(2);

        for (const row of rows) {
            fireEvent.click(within(row).getByRole('button', { name: 'View' }));
        }

        await waitFor(() =>
            expect(
                screen.getAllByText("This version isn't available on this device.")
            ).toHaveLength(2)
        );

        expect(screen.getAllByTestId('credential-history-entry')).toHaveLength(2);
        expect(rows[0]).toHaveTextContent('Updated employer');
        expect(rows[1]).toHaveTextContent('Initial issuance details');
        expect(modalHost.newModal).not.toHaveBeenCalled();
    });

    it('shows friendly empty copy when no local history exists', () => {
        renderModal(makeRecord());

        expect(
            screen.getByText('No previous versions are stored on this device.')
        ).toBeInTheDocument();
        expect(screen.queryAllByTestId('credential-history-entry')).toHaveLength(0);
    });
});

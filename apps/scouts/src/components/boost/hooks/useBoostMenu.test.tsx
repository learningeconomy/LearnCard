// @vitest-environment happy-dom

import React, { useSyncExternalStore } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BoostEarnedCard } from '../boost-earned-card/BoostEarnedCard';
import { useTroopIDStatus } from '../../../pages/troop/TroopIdStatusButton';

type RecipientsState = {
    isLoading: boolean;
    claimed: { to: { profileId: string } }[];
    all: { to: { profileId: string } }[];
};

const host = vi.hoisted(() => {
    // Minimal stand-in for the modal stack: newModal() stashes the element, <ModalHost/>
    // renders it. Like the real provider, the element is a snapshot taken at open time.
    let modal: React.ReactNode = null;
    const listeners = new Set<() => void>();
    // Recipient lists live in a tiny store so the mocked query re-renders its subscribers when
    // they change, the way a real React Query observer would.
    let recipients: RecipientsState = { isLoading: false, claimed: [], all: [] };
    const recipientListeners = new Set<() => void>();
    return {
        recipientsStore: {
            get: () => recipients,
            set: (next: RecipientsState) => {
                recipients = next;
                recipientListeners.forEach(listener => listener());
            },
            subscribe: (listener: () => void) => {
                recipientListeners.add(listener);
                return () => recipientListeners.delete(listener);
            },
        },
        useGetBoostRecipients: vi.fn(),
        useGetBoost: vi.fn(),
        modalStore: {
            get: () => modal,
            set: (next: React.ReactNode) => {
                modal = next;
                listeners.forEach(listener => listener());
            },
            subscribe: (listener: () => void) => {
                listeners.add(listener);
                return () => listeners.delete(listener);
            },
        },
    };
});

const TROOP_ID_CATEGORIES = [
    'Global Admin ID',
    'National Network Admin ID',
    'Troop Leader ID',
    'Scout ID',
];

vi.mock('learn-card-base', async () => ({
    // Category normalization checks own keys, so use real metadata rather than an empty proxy.
    ...(await vi.importActual<typeof import('learn-card-base/types/boostAndCredentialMetadata')>(
        'learn-card-base/types/boostAndCredentialMetadata'
    )),
    BoostCategoryOptionsEnum: { achievement: 'Achievement' },
    BoostGenericCardWrapper: ({ optionsTriggerOnClick }: { optionsTriggerOnClick: () => void }) => (
        <button type="button" onClick={optionsTriggerOnClick}>
            open options
        </button>
    ),
    BoostPageViewMode: { Card: 'card', List: 'list' },
    BrandingEnum: { scoutPass: 'scoutPass' },
    ModalTypes: { Cancel: 'cancel', Center: 'center', FullScreen: 'full-screen' },
    resetIonicModalBackground: vi.fn(),
    setIonicModalBackground: vi.fn(),
    useConfirmation: () => vi.fn(),
    useDeleteEarnedBoostMutation: () => ({ mutate: vi.fn() }),
    useDeleteManagedBoostMutation: () => ({ mutate: vi.fn() }),
    useGetBoost: host.useGetBoost,
    useGetBoostParents: () => ({ data: undefined }),
    useGetBoostRecipients: host.useGetBoostRecipients,
    useGetCurrentLCNUser: () => ({ currentLCNUser: { profileId: 'scout' } }),
    useGetIDs: () => ({ data: [] }),
    useGetResolvedCredential: () => ({ data: undefined, isFetching: false, isLoading: false }),
    useGetVCInfo: () => ({ loading: false }),
    useModal: () => ({
        newModal: (element: React.ReactNode) => host.modalStore.set(element),
        closeModal: () => host.modalStore.set(null),
        closeAllModals: () => host.modalStore.set(null),
    }),
    useShareBoostMutation: () => ({ mutate: vi.fn() }),
}));

vi.mock('../../../helpers/troop.helpers', () => ({
    getRoleFromCred: () => undefined,
    getScoutsNounForRole: () => undefined,
    isTroopCategory: (category: string) => TROOP_ID_CATEGORIES.includes(category),
}));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    getCredentialName: () => 'Camping',
    getCredentialSubject: () => undefined,
    getImageUrlFromCredential: () => undefined,
    getUrlFromImage: () => '',
    isBoostCredential: () => true,
    unwrapBoostCredential: (credential: unknown) => credential,
}));

vi.mock('@ionic/react', () => ({
    IonCol: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
}));
vi.mock('learn-card-base/hooks/useVerifyCredential', () => ({
    default: () => ({ verifyCredential: vi.fn(), worstVerificationStatus: undefined }),
}));
vi.mock('learn-card-base/components/CredentialBadge/CredentialBadge', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BadgeSkeleton', () => ({
    default: () => null,
}));
vi.mock('learn-card-base/components/boost/boostSkeletonLoaders/BoostSkeletons', () => ({
    default: () => null,
    BoostSkeleton: () => null,
}));
vi.mock('learn-card-base/svgs/ReplyIcon', () => ({ default: () => null }));
vi.mock('../boostCMS/BoostPreview/BoostPreview', () => ({ default: () => null }));
vi.mock('../boostCMS/BoostPreview/NonBoostPreview', () => ({ default: () => null }));
vi.mock('../boost-options-menu/ShareBoostLink', () => ({ default: () => null }));
vi.mock('../boost-options-menu/ViewJsonModal', () => ({ default: () => null }));
vi.mock('../../../pages/troop/ShareTroopIdModal', () => ({ default: () => null }));
vi.mock('../../svgs/TrashBin', () => ({ default: () => null }));
vi.mock('../../svgs/BracketsIcon', () => ({ default: () => null }));
vi.mock('../boostHelpers', () => ({ isCredentialExpired: () => false }));
vi.mock('../../../stores/loadingStore', () => ({ useLoadingLine: vi.fn() }));
vi.mock('../../../hooks/useHighlightedCredentials', () => ({
    useHighlightedCredentials: () => ({ credentials: [] }),
}));
vi.mock('../../../i18n/formatters', () => ({ formatLocaleDate: () => 'January 01, 2026' }));

const ModalHost: React.FC = () => {
    const modal = useSyncExternalStore(host.modalStore.subscribe, host.modalStore.get);
    return <div data-testid="modal-host">{modal}</div>;
};

const renderEarnedCard = (categoryType: string) =>
    render(
        <>
            <BoostEarnedCard
                credential={{ boostId: 'urn:lc:boost:card', name: 'Camping' } as never}
                uri="urn:lc:credential:card"
                defaultImg=""
                categoryType={categoryType as never}
            />
            <ModalHost />
        </>
    );

/** Calls that would actually reach brain-service (enabled, with a boost URI). */
const liveRecipientCalls = () =>
    host.useGetBoostRecipients.mock.calls.filter(([uri, enabled]) => Boolean(uri) && enabled);

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: 'open options' }));

describe('useBoostMenu recipient lookups', () => {
    beforeEach(() => {
        host.recipientsStore.set({ isLoading: false, claimed: [], all: [] });
        host.modalStore.set(null);
        host.useGetBoost.mockImplementation(() => ({ isLoading: false }));
        host.useGetBoostRecipients.mockImplementation(
            (_uri: string, enabled: boolean, includeUnaccepted: boolean) => {
                const { isLoading, claimed, all } = useSyncExternalStore(
                    host.recipientsStore.subscribe,
                    host.recipientsStore.get
                );
                if (!enabled) return { data: undefined, isLoading: false, isError: false };
                return {
                    data: isLoading ? undefined : includeUnaccepted ? all : claimed,
                    isLoading,
                    isError: false,
                };
            }
        );
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it('renders a merit badge earned card without any getBoostRecipients calls', () => {
        renderEarnedCard('Merit Badge');

        expect(screen.getByRole('button', { name: 'open options' })).toBeTruthy();
        expect(host.useGetBoostRecipients).not.toHaveBeenCalled();
        expect(host.useGetBoost).not.toHaveBeenCalled();

        openMenu();

        // Non-troop boosts can always be deleted; opening the menu still costs nothing.
        expect(screen.getByText('Delete')).toBeTruthy();
        expect(host.useGetBoostRecipients).not.toHaveBeenCalled();
    });

    it('waits until the menu opens before checking a troop ID status', () => {
        renderEarnedCard('Scout ID');

        expect(liveRecipientCalls()).toHaveLength(0);

        openMenu();

        expect(
            liveRecipientCalls().map(([uri, , includeUnaccepted]) => [uri, includeUnaccepted])
        ).toEqual(
            expect.arrayContaining([
                ['urn:lc:boost:card', false],
                ['urn:lc:boost:card', true],
            ])
        );
    });

    it.each([
        [
            'claimed (valid)',
            { claimed: [{ to: { profileId: 'scout' } }], all: [{ to: { profileId: 'scout' } }] },
            false,
        ],
        ['pending', { claimed: [], all: [{ to: { profileId: 'scout' } }] }, true],
        ['revoked', { claimed: [], all: [] }, true],
    ])(
        'shows Delete on a %s troop ID only when it is revoked or pending',
        (_label, lists, expected) => {
            host.recipientsStore.set({ isLoading: false, ...lists });
            renderEarnedCard('Scout ID');
            openMenu();

            expect(screen.queryByText('Delete') !== null).toBe(expected);
            // Share and View Data are always there.
            expect(screen.getByText('Share')).toBeTruthy();
        }
    );

    it('reveals Delete on a troop ID once the status finishes loading after the menu opened', () => {
        host.recipientsStore.set({ isLoading: true, claimed: [], all: [] });
        renderEarnedCard('Troop Leader ID');
        openMenu();

        expect(screen.queryByText('Delete')).toBeNull();

        act(() => {
            host.recipientsStore.set({
                isLoading: false,
                claimed: [],
                all: [{ to: { profileId: 'scout' } }],
            });
        });

        expect(screen.getByText('Delete')).toBeTruthy();
    });

    it('hides Delete on a troop ID while the boost itself is still loading', () => {
        host.useGetBoost.mockImplementation(() => ({ isLoading: true }));
        renderEarnedCard('Scout ID');
        openMenu();

        expect(screen.queryByText('Delete')).toBeNull();
    });

    it('useTroopIDStatus skips the recipient lookups when disabled', () => {
        const StatusProbe: React.FC<{ enabled: boolean }> = ({ enabled }) => {
            const status = useTroopIDStatus(
                { boostId: 'urn:lc:boost:card' } as never,
                undefined,
                undefined,
                enabled
            );
            return <span data-testid="status">{status ?? 'none'}</span>;
        };

        const { rerender } = render(<StatusProbe enabled={false} />);

        expect(screen.getByTestId('status').textContent).toBe('none');
        expect(liveRecipientCalls()).toHaveLength(0);

        rerender(<StatusProbe enabled />);

        expect(screen.getByTestId('status').textContent).toBe('revoked');
        expect(liveRecipientCalls()).toHaveLength(2);
    });
});

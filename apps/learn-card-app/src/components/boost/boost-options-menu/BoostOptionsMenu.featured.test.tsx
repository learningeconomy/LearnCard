// @vitest-environment jsdom

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    act,
    cleanup,
    fireEvent,
    render,
    renderHook,
    screen,
    waitFor,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

import type { VC } from '@learncard/types';
import type { LCR } from 'learn-card-base/types/credential-records';

/**
 * Feature / remove from public profile menu action (LC-2306).
 *
 * Covers the earned credential overflow menu entry: gating, the public-visibility
 * confirmation, cancellation without a write, ordered persistence through
 * `updateProfile`, the five credential limit, cache refresh, and failure feedback.
 */

const SWITCHED_DID = 'did:web:switched';
const OWN_PROFILE_KEY = ['getProfile', SWITCHED_DID, undefined];
const BOOST_URI = 'lc:network:example:boost:featured-me';

const state = vi.hoisted(() => ({
    profile: undefined as Record<string, unknown> | undefined,
    confirm: vi.fn(),
    presentToast: vi.fn(),
    updateProfile: vi.fn(),
    getProfile: vi.fn(),
    persistQueryCacheNow: vi.fn(),
    newModal: vi.fn(),
    closeModal: vi.fn(),
    closeAllModals: vi.fn(),
}));

// The learn-card-base barrel pulls the web3auth stack and cannot load under jsdom;
// stub the exact surface the menu and the featured credentials hook consume.
vi.mock('learn-card-base', () => ({
    getLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
    ModalTypes: { FullScreen: 'FullScreen', Cancel: 'Cancel', Center: 'Center' },
    ToastTypeEnum: { Success: 'success', Error: 'error' },
    useModal: () => ({
        newModal: state.newModal,
        closeModal: state.closeModal,
        closeAllModals: state.closeAllModals,
    }),
    useConfirmation: () => state.confirm,
    useToast: () => ({ presentToast: state.presentToast }),
    useGetRecordForUri: () => ({ data: undefined }),
    useGetProfile: () =>
        useQuery({
            queryKey: OWN_PROFILE_KEY,
            queryFn: async () => state.profile ?? null,
            staleTime: Infinity,
        }),
    useWallet: () => ({
        initWallet: async () => ({
            invoke: { updateProfile: state.updateProfile, getProfile: state.getProfile },
        }),
    }),
    switchedProfileStore: { get: { switchedDid: () => SWITCHED_DID } },
}));

vi.mock('learn-card-base/helpers/credentialHelpers', () => ({
    unwrapBoostCredential: (vc?: VC) =>
        vc?.type?.includes('CertifiedBoostCredential') && vc?.boostCredential
            ? vc.boostCredential
            : vc,
}));

vi.mock('../../../helpers/queryPersistence', () => ({
    persistQueryCacheNow: state.persistQueryCacheNow,
}));

// Keep the share, JSON preview, and credential history import graphs outside these
// menu unit tests; only the menu type enum is needed from the boost menu hook.
vi.mock('./ShareBoostLink', () => ({ default: () => null }));
vi.mock('./JsonPreviewModal', () => ({ default: () => null }));
vi.mock('../../share-links/ShareLinkCreate', () => ({ default: () => null }));
vi.mock('../hooks/useBoostMenu', () => ({
    BoostMenuType: { managed: 'MANAGED', earned: 'EARNED' },
}));
vi.mock('launchdarkly-react-client-sdk', () => ({ useFlags: () => ({}) }));

vi.mock('../../../paraglide/messages.js', () => ({
    'boost.menu.manageIssuances': () => 'Manage Issuances',
    'boost.menu.viewData': () => 'View Data',
    'boost.menu.viewPreviousVersions': () => 'View Previous Versions',
    'boost.menu.featureOnProfile': () => 'Feature on Profile',
    'boost.menu.removeFromProfile': () => 'Remove from Profile',
    'boost.featured.limitHint': ({ max }: { max: number }) =>
        `Your profile already features ${max} credentials`,
    'boost.featured.limitReached': ({ max }: { max: number }) =>
        `You can feature up to ${max} credentials. Remove one from your profile first.`,
    'boost.featured.featureConfirm.title': () => 'Feature on your profile?',
    'boost.featured.featureConfirm.text': () =>
        'This credential will be public. Anyone who views your profile will be able to see it.',
    'boost.featured.featureConfirm.confirm': () => 'Feature',
    'boost.featured.removeConfirm.title': () => 'Remove from your profile?',
    'boost.featured.removeConfirm.text': () =>
        'This credential will no longer be shown on your public profile.',
    'boost.featured.removeConfirm.confirm': () => 'Remove',
    'boost.confirmDelete': () => 'Are you sure you want to delete?',
    'common.delete': () => 'Delete',
    'common.share': () => 'Share',
    'common.cancel': () => 'Cancel',
    'common.updating': () => 'Updating...',
    'toasts.boost.featuredOnProfile': () => 'Featured on your public profile',
    'toasts.boost.removedFromProfile': () => 'Removed from your public profile',
    'toasts.boost.featuredUpdateFailed': () => "We couldn't update your profile. Please try again.",
}));

import BoostOptionsMenu from './BoostOptionsMenu';
import { BoostMenuType } from '../hooks/useBoostMenu';
import useFeaturedCredentials, {
    FeaturedCredentialsLimitError,
} from '../hooks/useFeaturedCredentials';

const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'urn:credential:achievement',
    type: ['VerifiableCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-08-06T00:00:00.000Z',
    credentialSubject: { id: 'did:example:learner' },
    boostId: BOOST_URI,
} as unknown as VC;

const record: Partial<LCR> = {
    id: 'rec-1',
    uri: 'lc:cloud:encrypted-record',
    category: 'Achievement',
};

const makeProfile = (highlightedCredentials?: string[]) => ({
    profileId: 'learner',
    displayName: 'Ada Learner',
    did: 'did:web:learner',
    ...(highlightedCredentials ? { highlightedCredentials } : {}),
});

const makeQueryClient = () =>
    new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

const wrapperFor = (client: QueryClient): React.FC<{ children: React.ReactNode }> => {
    const QueryWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );

    return QueryWrapper;
};

const renderMenu = (
    props: Partial<React.ComponentProps<typeof BoostOptionsMenu>> = {},
    client = makeQueryClient()
) => {
    const handleCloseModal = vi.fn();

    const view = render(
        <QueryClientProvider client={client}>
            <BoostOptionsMenu
                handleCloseModal={handleCloseModal}
                handleDelete={vi.fn()}
                boost={credential}
                boostUri={record.uri}
                record={record}
                menuType={BoostMenuType.earned}
                categoryType="Achievement"
                {...props}
            />
        </QueryClientProvider>
    );

    return { client, handleCloseModal, ...view };
};

const confirmationCopy = (): HTMLElement => {
    expect(state.confirm).toHaveBeenCalledTimes(1);

    const { text } = state.confirm.mock.calls[0][0] as { text: React.ReactElement };

    return render(text).container;
};

beforeEach(() => {
    vi.clearAllMocks();
    state.profile = makeProfile(['lc:boost:first', 'lc:boost:second']);
    state.confirm.mockResolvedValue(true);
    state.updateProfile.mockImplementation(async ({ highlightedCredentials }) => {
        state.profile = makeProfile(highlightedCredentials);
        return true;
    });
    state.getProfile.mockImplementation(async () => state.profile);
    state.persistQueryCacheNow.mockResolvedValue(undefined);
});

afterEach(() => cleanup());

describe('Feature on Profile menu entry', () => {
    it('allows featuring when five stored entries contain only four unique URIs', async () => {
        state.profile = makeProfile([
            'lc:boost:3',
            'lc:boost:1',
            'lc:boost:3',
            'lc:boost:2',
            'lc:boost:4',
        ]);
        const { handleCloseModal } = renderMenu();
        const entry = await screen.findByRole('button', { name: 'Feature on Profile' });
        expect(entry).not.toHaveAttribute('aria-disabled');

        fireEvent.click(entry);

        await waitFor(() => expect(handleCloseModal).toHaveBeenCalledTimes(1));
        expect(state.updateProfile).toHaveBeenCalledWith({
            highlightedCredentials: [
                'lc:boost:3',
                'lc:boost:1',
                'lc:boost:2',
                'lc:boost:4',
                BOOST_URI,
            ],
        });
    });

    it('removes all occurrences of a featured URI and normalizes the remaining selection', async () => {
        state.profile = makeProfile([
            'lc:boost:3',
            BOOST_URI,
            'lc:boost:3',
            'lc:boost:1',
            BOOST_URI,
        ]);
        const { handleCloseModal } = renderMenu();

        fireEvent.click(await screen.findByRole('button', { name: 'Remove from Profile' }));

        await waitFor(() => expect(handleCloseModal).toHaveBeenCalledTimes(1));
        expect(state.updateProfile).toHaveBeenCalledWith({
            highlightedCredentials: ['lc:boost:3', 'lc:boost:1'],
        });
    });

    it('offers to feature an earned boost credential that is not featured yet', async () => {
        renderMenu();

        const entry = await screen.findByRole('button', { name: 'Feature on Profile' });

        expect(entry).not.toHaveAttribute('aria-disabled');
        expect(screen.queryByText('Remove from Profile')).toBeNull();
        expect(screen.queryByText(/already features/)).toBeNull();
    });

    it('offers to remove a credential that is already featured', async () => {
        state.profile = makeProfile(['lc:boost:first', BOOST_URI]);

        renderMenu();

        expect(
            await screen.findByRole('button', { name: 'Remove from Profile' })
        ).toBeInTheDocument();
        expect(screen.queryByText('Feature on Profile')).toBeNull();
    });

    it('hides the entry for managed boosts', async () => {
        renderMenu({ menuType: BoostMenuType.managed, record: undefined, isDraft: true });

        expect(await screen.findByText('View Data')).toBeInTheDocument();
        expect(screen.queryByText('Feature on Profile')).toBeNull();
        expect(screen.queryByText('Remove from Profile')).toBeNull();
    });

    it('hides the entry for earned credentials without a boost URI', async () => {
        renderMenu({ boost: { ...credential, boostId: undefined } as VC });

        expect(await screen.findByText('View Data')).toBeInTheDocument();
        expect(screen.queryByText('Feature on Profile')).toBeNull();
    });

    it('hides the entry when the user has no network profile', async () => {
        state.profile = undefined;

        const { client } = renderMenu();

        await waitFor(() => expect(client.getQueryData(OWN_PROFILE_KEY)).toBeNull());
        expect(screen.queryByText('Feature on Profile')).toBeNull();
    });

    it('explains that featuring makes the credential public before asking to confirm', async () => {
        state.confirm.mockResolvedValue(false);

        renderMenu();

        fireEvent.click(await screen.findByRole('button', { name: 'Feature on Profile' }));

        await waitFor(() => expect(state.confirm).toHaveBeenCalledTimes(1));

        const copy = confirmationCopy();

        expect(copy).toHaveTextContent('Feature on your profile?');
        expect(copy).toHaveTextContent(
            'This credential will be public. Anyone who views your profile will be able to see it.'
        );
        expect(state.confirm.mock.calls[0][0]).toMatchObject({
            confirmText: 'Feature',
            cancelText: 'Cancel',
        });
    });

    it('does not write anything when the confirmation is cancelled', async () => {
        state.confirm.mockResolvedValue(false);

        const { handleCloseModal } = renderMenu();

        fireEvent.click(await screen.findByRole('button', { name: 'Feature on Profile' }));

        await waitFor(() => expect(state.confirm).toHaveBeenCalledTimes(1));

        expect(state.updateProfile).not.toHaveBeenCalled();
        expect(state.presentToast).not.toHaveBeenCalled();
        expect(handleCloseModal).not.toHaveBeenCalled();
        expect(screen.getByRole('button', { name: 'Feature on Profile' })).toBeInTheDocument();
    });

    it('appends the credential to the ordered selection and refreshes the profile cache', async () => {
        const { client, handleCloseModal } = renderMenu();
        const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

        fireEvent.click(await screen.findByRole('button', { name: 'Feature on Profile' }));

        await waitFor(() => expect(handleCloseModal).toHaveBeenCalledTimes(1));

        expect(state.updateProfile).toHaveBeenCalledTimes(1);
        expect(state.updateProfile).toHaveBeenCalledWith({
            highlightedCredentials: ['lc:boost:first', 'lc:boost:second', BOOST_URI],
        });
        expect(state.getProfile).toHaveBeenCalledWith();
        expect(client.getQueryData(OWN_PROFILE_KEY)).toEqual(
            makeProfile(['lc:boost:first', 'lc:boost:second', BOOST_URI])
        );
        expect(invalidateSpy).toHaveBeenCalled();
        expect(state.persistQueryCacheNow).toHaveBeenCalledWith(client);
        expect(state.presentToast).toHaveBeenCalledWith('Featured on your public profile', {
            type: 'success',
            hasDismissButton: true,
        });
    });

    it('removes a featured credential while keeping the remaining order', async () => {
        state.profile = makeProfile(['lc:boost:first', BOOST_URI, 'lc:boost:third']);

        const { client, handleCloseModal } = renderMenu();

        fireEvent.click(await screen.findByRole('button', { name: 'Remove from Profile' }));

        await waitFor(() => expect(handleCloseModal).toHaveBeenCalledTimes(1));

        const copy = confirmationCopy();

        expect(copy).toHaveTextContent('Remove from your profile?');
        expect(copy).toHaveTextContent(
            'This credential will no longer be shown on your public profile.'
        );
        expect(state.updateProfile).toHaveBeenCalledWith({
            highlightedCredentials: ['lc:boost:first', 'lc:boost:third'],
        });
        expect(client.getQueryData(OWN_PROFILE_KEY)).toEqual(
            makeProfile(['lc:boost:first', 'lc:boost:third'])
        );
        expect(state.presentToast).toHaveBeenCalledWith('Removed from your public profile', {
            type: 'success',
            hasDismissButton: true,
        });
    });

    it('explains the limit and writes nothing when five credentials are already featured', async () => {
        state.profile = makeProfile([
            'lc:boost:1',
            'lc:boost:2',
            'lc:boost:3',
            'lc:boost:4',
            'lc:boost:5',
        ]);

        const { handleCloseModal } = renderMenu();

        const entry = await screen.findByRole('button', { name: /Feature on Profile/ });

        expect(entry).toHaveAttribute('aria-disabled', 'true');
        expect(entry).toHaveTextContent('Your profile already features 5 credentials');

        fireEvent.click(entry);

        await waitFor(() =>
            expect(state.presentToast).toHaveBeenCalledWith(
                'You can feature up to 5 credentials. Remove one from your profile first.',
                { type: 'error', hasDismissButton: true }
            )
        );
        expect(state.confirm).not.toHaveBeenCalled();
        expect(state.updateProfile).not.toHaveBeenCalled();
        expect(handleCloseModal).not.toHaveBeenCalled();
    });

    it('still offers removal of a featured credential when the selection is full', async () => {
        state.profile = makeProfile([
            'lc:boost:1',
            'lc:boost:2',
            'lc:boost:3',
            'lc:boost:4',
            BOOST_URI,
        ]);

        renderMenu();

        const entry = await screen.findByRole('button', { name: 'Remove from Profile' });

        expect(entry).not.toHaveAttribute('aria-disabled');
    });

    it('shows the pending state while the profile update is in flight', async () => {
        let resolveUpdate!: (value: boolean) => void;
        state.updateProfile.mockReturnValue(
            new Promise<boolean>(resolve => {
                resolveUpdate = resolve;
            })
        );

        const { handleCloseModal } = renderMenu();

        fireEvent.click(await screen.findByRole('button', { name: 'Feature on Profile' }));

        const pending = await screen.findByRole('button', { name: /Updating\.\.\./ });

        expect(pending).toHaveAttribute('aria-disabled', 'true');

        fireEvent.click(pending);

        expect(state.confirm).toHaveBeenCalledTimes(1);

        await act(async () => resolveUpdate(true));
        await waitFor(() => expect(handleCloseModal).toHaveBeenCalledTimes(1));
        expect(state.updateProfile).toHaveBeenCalledTimes(1);
    });

    it('keeps the menu open and reports a friendly error when the update fails', async () => {
        state.updateProfile.mockRejectedValue(new Error('TRPCClientError: BAD_REQUEST'));

        const { client, handleCloseModal } = renderMenu();

        fireEvent.click(await screen.findByRole('button', { name: 'Feature on Profile' }));

        await waitFor(() =>
            expect(state.presentToast).toHaveBeenCalledWith(
                "We couldn't update your profile. Please try again.",
                { type: 'error', hasDismissButton: true }
            )
        );
        expect(handleCloseModal).not.toHaveBeenCalled();
        expect(state.persistQueryCacheNow).not.toHaveBeenCalled();
        expect(client.getQueryData(OWN_PROFILE_KEY)).toEqual(
            makeProfile(['lc:boost:first', 'lc:boost:second'])
        );
        expect(screen.getByRole('button', { name: 'Feature on Profile' })).toBeInTheDocument();
    });
});

describe('useFeaturedCredentials', () => {
    const renderFeatured = () => {
        const client = makeQueryClient();
        const hook = renderHook(() => useFeaturedCredentials(), { wrapper: wrapperFor(client) });

        return { client, ...hook };
    };

    it('exposes unique URIs in first-occurrence order when the profile contains duplicates', async () => {
        state.profile = makeProfile([
            'lc:boost:3',
            'lc:boost:1',
            'lc:boost:3',
            'lc:boost:2',
            'lc:boost:1',
        ]);
        const { result } = renderFeatured();
        await waitFor(() => expect(result.current.hasProfile).toBe(true));

        const selection = result.current.featuredUris;

        expect(selection).toEqual(['lc:boost:3', 'lc:boost:1', 'lc:boost:2']);
        expect(result.current.canFeatureMore).toBe(true);
    });

    it.each(['featureCredential', 'unfeatureCredential'] as const)(
        'rewrites duplicates when %s would otherwise leave the selection unchanged',
        async action => {
            state.profile = makeProfile(['lc:boost:3', 'lc:boost:1', 'lc:boost:3']);
            const { result } = renderFeatured();
            await waitFor(() => expect(result.current.hasProfile).toBe(true));
            const uri = action === 'featureCredential' ? 'lc:boost:3' : BOOST_URI;

            await act(async () => {
                await result.current[action](uri);
            });

            expect(state.updateProfile).toHaveBeenCalledExactlyOnceWith({
                highlightedCredentials: ['lc:boost:3', 'lc:boost:1'],
            });
        }
    );

    it('exposes the ordered selection from the cached profile', async () => {
        const { result } = renderFeatured();

        await waitFor(() => expect(result.current.hasProfile).toBe(true));

        expect(result.current.featuredUris).toEqual(['lc:boost:first', 'lc:boost:second']);
        expect(result.current.isFeatured('lc:boost:second')).toBe(true);
        expect(result.current.isFeatured(BOOST_URI)).toBe(false);
        expect(result.current.canFeatureMore).toBe(true);
    });

    it('refuses a sixth credential without writing to the profile', async () => {
        state.profile = makeProfile([
            'lc:boost:1',
            'lc:boost:2',
            'lc:boost:3',
            'lc:boost:4',
            'lc:boost:5',
        ]);

        const { result } = renderFeatured();

        await waitFor(() => expect(result.current.canFeatureMore).toBe(false));

        await expect(result.current.featureCredential(BOOST_URI)).rejects.toBeInstanceOf(
            FeaturedCredentialsLimitError
        );
        expect(state.updateProfile).not.toHaveBeenCalled();
    });

    it('does not write when the selection would not change', async () => {
        const { result } = renderFeatured();

        await waitFor(() => expect(result.current.hasProfile).toBe(true));

        await expect(result.current.featureCredential('lc:boost:first')).resolves.toEqual([
            'lc:boost:first',
            'lc:boost:second',
        ]);
        await expect(result.current.unfeatureCredential(BOOST_URI)).resolves.toEqual([
            'lc:boost:first',
            'lc:boost:second',
        ]);
        expect(state.updateProfile).not.toHaveBeenCalled();
        expect(state.persistQueryCacheNow).not.toHaveBeenCalled();
    });
});

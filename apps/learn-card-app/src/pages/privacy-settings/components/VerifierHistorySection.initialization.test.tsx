import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HistoryWallet, loadVerifierHistory } from '../../../helpers/verifier-history/history';

const stores = vi.hoisted(() => {
    const makeStore = (initial: Record<string, unknown>) => {
        let state = initial;
        const listeners = new Set<
            (next: Record<string, unknown>, previous: Record<string, unknown>) => void
        >();
        return {
            get: new Proxy({}, { get: (_, key: string) => () => state[key] }),
            store: {
                subscribe: (
                    listener: (
                        next: Record<string, unknown>,
                        previous: Record<string, unknown>
                    ) => void
                ) => {
                    listeners.add(listener);
                    return () => listeners.delete(listener);
                },
            },
            update: (update: Record<string, unknown>) => {
                const previous = state;
                state = { ...state, ...update };
                listeners.forEach(listener => listener(state, previous));
            },
        };
    };
    return {
        user: makeStore({
            currentUser: { uid: 'holder', privateKey: 'key' },
            currentUserPK: 'key',
        }),
        selected: makeStore({ switchedDid: undefined, profileType: null }),
        wallet: makeStore({ wallet: null }),
    };
});
const mocks = vi.hoisted(() => ({
    initWallet: vi.fn(),
    load: vi.fn(),
    toggle: vi.fn(),
    clear: vi.fn(),
    remove: vi.fn(),
    privacy: vi.fn(),
    modal: vi.fn(),
    close: vi.fn(),
}));
vi.mock('learn-card-base/stores/currentUserStore', () => ({ currentUserStore: stores.user }));
vi.mock('learn-card-base/stores/walletStore', () => ({
    switchedProfileStore: stores.selected,
    walletStore: stores.wallet,
}));
vi.mock('learn-card-base', () => ({
    // The real hook also returns a new initializer function on each render.
    useWallet: () => ({ initWallet: () => mocks.initWallet() }),
    useModal: () => ({ newModalWithToken: mocks.modal, forceCloseModalByToken: mocks.close }),
    ModalTypes: { Center: 'center', FullScreen: 'fullscreen' },
}));
vi.mock('../../../helpers/verifier-history/useEligibility', () => ({
    useVerifierHistoryEligibility: () => () => true,
}));
vi.mock('../../../i18n', () => ({ useLocale: () => 'en' }));
vi.mock('../../../components/share-links/sharePrivacy', () => ({
    enterSharePrivacy: mocks.privacy,
}));
vi.mock('../../../helpers/verifier-history/history', () => ({
    loadVerifierHistory: mocks.load,
    setVerifierHistoryEnabled: mocks.toggle,
    clearVerifierHistory: mocks.clear,
    deleteVerifierReceipt: mocks.remove,
}));

// Keep the real account subscriptions: wallet-only changes do not advance the selected account.
import {
    captureHistoryAccount,
    getHistoryAccountRevision,
} from '../../../helpers/verifier-history/account';
import VerifierHistorySection from './VerifierHistorySection';

type Loaded = Awaited<ReturnType<typeof loadVerifierHistory>>;
const empty: Loaded = { enabled: false, receipts: [], cleanupComplete: true };
const privateHistory: Loaded = {
    ...empty,
    enabled: true,
    receipts: [
        {
            kind: 'receipt',
            version: 1,
            eventId: 'event',
            generation: 'generation',
            sentAt: '2026-10-14T12:00:00.000Z',
            label: 'Previous account verifier',
            titles: ['Previous account credential'],
            protocol: 'chapi',
            outcome: 'handed-off',
        },
    ],
};
const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason: Error) => void;
    const promise = new Promise<T>((done, fail) => {
        resolve = done;
        reject = fail;
    });
    return { promise, resolve, reject };
};
const makeWallet = (did: () => string): HistoryWallet => ({
    id: { did },
    invoke: {
        createDagJwe: vi.fn(),
        decryptDagJwe: vi.fn(),
        learnCloudCreate: vi.fn(),
        learnCloudReadPage: vi.fn(),
        learnCloudDelete: vi.fn(),
    },
});
let wallet: HistoryWallet;
beforeEach(() => {
    vi.resetAllMocks();
    wallet = makeWallet(() => 'did:key:holder');
    stores.user.update({ currentUser: { uid: 'holder', privateKey: 'key' }, currentUserPK: 'key' });
    stores.selected.update({ switchedDid: undefined, profileType: null });
    stores.wallet.update({ wallet });
    mocks.initWallet.mockImplementation(async () => wallet);
    mocks.load.mockResolvedValue(empty);
    mocks.toggle.mockResolvedValue(undefined);
});

describe('verifier history initialization recovery', () => {
    it('loads once when cold initialization registers the wallet before returning', async () => {
        stores.wallet.update({ wallet: null });
        mocks.initWallet.mockImplementationOnce(async () => {
            stores.wallet.update({ wallet });
            return wallet;
        });
        render(<VerifierHistorySection eligible />);
        await screen.findByRole('checkbox');
        expect(mocks.load).toHaveBeenCalledTimes(1);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it.each(['resolve', 'reject'] as const)(
        'reloads after a wallet-only revision invalidates a pending read that will %s',
        async outcome => {
            const first = deferred<Loaded>();
            mocks.load.mockReturnValueOnce(first.promise);
            render(<VerifierHistorySection eligible />);
            await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
            const isSelected = captureHistoryAccount();
            await act(async () => {
                wallet = makeWallet(() => 'did:web:network:holder');
                stores.wallet.update({ wallet });
            });
            expect(isSelected()).toBe(true);
            expect(mocks.load).toHaveBeenCalledTimes(1);
            await act(async () => {
                if (outcome === 'resolve') first.resolve(privateHistory);
                else first.reject(new Error('Obsolete wallet'));
            });
            await screen.findByRole('checkbox');
            expect(mocks.load).toHaveBeenCalledTimes(2);
            expect(screen.getByRole('checkbox')).not.toBeChecked();
            expect(screen.queryByText('Previous account verifier')).not.toBeInTheDocument();
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        }
    );

    it.each(['resolve', 'reject'] as const)(
        'reloads after an in-place DID change invalidates a pending read that will %s',
        async outcome => {
            let did = 'did:key:holder';
            wallet = makeWallet(() => did);
            stores.wallet.update({ wallet });
            const revision = getHistoryAccountRevision();
            const first = deferred<Loaded>();
            mocks.load.mockReturnValueOnce(first.promise);
            render(<VerifierHistorySection eligible />);
            await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
            did = 'did:web:network:holder';
            expect(getHistoryAccountRevision()).toBe(revision);
            await act(async () => {
                if (outcome === 'resolve') first.resolve(privateHistory);
                else first.reject(new Error('Obsolete DID'));
            });
            await screen.findByRole('checkbox');
            expect(mocks.load).toHaveBeenCalledTimes(2);
            expect(screen.queryByText('Previous account verifier')).not.toBeInTheDocument();
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        }
    );

    it('hides loaded history and reloads when a render observes an in-place DID change', async () => {
        let did = 'did:key:holder';
        wallet = makeWallet(() => did);
        stores.wallet.update({ wallet });
        mocks.load.mockResolvedValueOnce(privateHistory);
        const view = render(<VerifierHistorySection eligible />);
        await screen.findByText('Previous account verifier');
        did = 'did:web:network:holder';
        view.rerender(<VerifierHistorySection eligible />);
        expect(screen.queryByText('Previous account verifier')).not.toBeInTheDocument();
        await screen.findByText('No recorded disclosures.');
        expect(mocks.load).toHaveBeenCalledTimes(2);
    });

    it('lets a new selected account load without an old completion releasing its operation', async () => {
        const first = deferred<Loaded>();
        const second = deferred<Loaded>();
        mocks.load.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
        render(<VerifierHistorySection eligible />);
        await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
        await act(async () => {
            stores.user.update({
                currentUser: { uid: 'other', privateKey: 'other' },
                currentUserPK: 'other',
            });
            wallet = makeWallet(() => 'did:key:other');
            stores.wallet.update({ wallet });
        });
        await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(2));
        await act(async () => first.resolve(privateHistory));
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
        expect(mocks.load).toHaveBeenCalledTimes(2);
        await act(async () => second.resolve(empty));
        expect(screen.getByRole('checkbox')).not.toBeChecked();
        expect(screen.queryByText('Previous account verifier')).not.toBeInTheDocument();
    });

    it.each(['logout', 'managed', 'ineligible'] as const)(
        'does not recover private history after %s',
        async change => {
            const first = deferred<Loaded>();
            mocks.load.mockReturnValueOnce(first.promise);
            const view = render(<VerifierHistorySection eligible />);
            await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(1));
            await act(async () => {
                if (change === 'logout') stores.user.update({ currentUser: null });
                else if (change === 'managed') stores.selected.update({ profileType: 'child' });
                else view.rerender(<VerifierHistorySection eligible={false} />);
                first.resolve(privateHistory);
            });
            expect(mocks.load).toHaveBeenCalledTimes(1);
            expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
            expect(screen.queryByText('Previous account verifier')).not.toBeInTheDocument();
        }
    );

    it('requires explicit Retry for a current-account failure', async () => {
        mocks.load.mockRejectedValueOnce(new Error('Connection failed'));
        render(<VerifierHistorySection eligible />);
        await screen.findByRole('alert');
        expect(mocks.load).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByRole('button', { name: 'Retry history' }));
        await screen.findByRole('checkbox');
        expect(mocks.load).toHaveBeenCalledTimes(2);
    });

    it('bounds recovery and offers Retry if the account cannot settle', async () => {
        let generation = 0;
        wallet = makeWallet(() => `did:key:holder-${generation}`);
        stores.wallet.update({ wallet });
        mocks.load.mockImplementation(async () => {
            generation++;
            return privateHistory;
        });
        render(<VerifierHistorySection eligible />);
        await screen.findByRole('alert');
        expect(mocks.load).toHaveBeenCalledTimes(2);
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.queryByText('Previous account verifier')).not.toBeInTheDocument();
        mocks.load
            .mockImplementationOnce(async () => {
                generation++;
                return privateHistory;
            })
            .mockResolvedValue(empty);
        fireEvent.click(screen.getByRole('button', { name: 'Retry history' }));
        await screen.findByRole('checkbox');
        expect(mocks.load).toHaveBeenCalledTimes(4);
    });

    it('offers Retry when initialization repeatedly returns a different registered identity', async () => {
        mocks.initWallet.mockResolvedValue(makeWallet(() => 'did:key:obsolete'));
        render(<VerifierHistorySection eligible />);
        await screen.findByRole('alert');
        expect(mocks.initWallet).toHaveBeenCalledTimes(2);
        expect(mocks.load).not.toHaveBeenCalled();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        mocks.initWallet.mockResolvedValue(wallet);
        fireEvent.click(screen.getByRole('button', { name: 'Retry history' }));
        await screen.findByRole('checkbox');
        expect(mocks.load).toHaveBeenCalledTimes(1);
    });

    it('only rereads history after an interrupted action, without replaying the action', async () => {
        let did = 'did:key:holder';
        wallet = makeWallet(() => did);
        stores.wallet.update({ wallet });
        mocks.toggle.mockImplementation(async () => {
            did = 'did:web:network:holder';
        });
        render(<VerifierHistorySection eligible />);
        await screen.findByRole('checkbox');
        fireEvent.click(screen.getByRole('checkbox'));
        await waitFor(() => expect(mocks.load).toHaveBeenCalledTimes(3));
        await waitFor(() => expect(screen.getByRole('checkbox')).not.toBeDisabled());
        expect(mocks.toggle).toHaveBeenCalledTimes(1);
        expect(mocks.clear).not.toHaveBeenCalled();
        expect(mocks.remove).not.toHaveBeenCalled();
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
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
        user: makeStore({ currentUser: { uid: 'u', privateKey: 'k' }, currentUserPK: 'k' }),
        selected: makeStore({ switchedDid: undefined, profileType: null }),
        wallet: makeStore({ wallet: null }),
    };
});
vi.mock('learn-card-base/stores/currentUserStore', () => ({ currentUserStore: stores.user }));
vi.mock('learn-card-base/stores/walletStore', () => ({
    switchedProfileStore: stores.selected,
    walletStore: stores.wallet,
}));
import { captureResumeAccount } from './account';
beforeEach(() => {
    stores.user.update({ currentUser: { uid: 'u', privateKey: 'k' }, currentUserPK: 'k' });
    stores.selected.update({ switchedDid: undefined, profileType: null });
    stores.wallet.update({ wallet: null });
});
describe('resume account isolation', () => {
    it('rejects captured work after switching away and back', () => {
        const isSelected = captureResumeAccount();
        stores.selected.update({ switchedDid: 'child', profileType: 'child' });
        stores.selected.update({ switchedDid: undefined, profileType: null });
        expect(isSelected()).toBe(false);
        expect(captureResumeAccount()()).toBe(true);
    });
    it('rejects logout and key changes', () => {
        const beforeLogout = captureResumeAccount();
        stores.user.update({ currentUser: null });
        expect(beforeLogout()).toBe(false);
        stores.user.update({ currentUser: { uid: 'u', privateKey: 'k' } });
        const beforeKey = captureResumeAccount();
        stores.user.update({ currentUserPK: 'new' });
        expect(beforeKey()).toBe(false);
    });
    it('permits first wallet initialization but rejects owner replacement and away/back', () => {
        const initial = captureResumeAccount();
        stores.wallet.update({ wallet: { id: { did: () => 'did:key:owner' } } });
        expect(initial()).toBe(true);
        const selected = captureResumeAccount();
        stores.wallet.update({ wallet: { id: { did: () => 'did:key:other' } } });
        stores.wallet.update({ wallet: { id: { did: () => 'did:key:owner' } } });
        expect(selected()).toBe(false);
    });
});

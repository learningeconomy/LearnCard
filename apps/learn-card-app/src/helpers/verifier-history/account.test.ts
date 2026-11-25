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
import { captureHistoryAccount, captureHistoryContext, isHistoryAccountEligible } from './account';
const wallet = { id: { did: () => 'did:key:holder' } };
beforeEach(() => {
    stores.user.update({ currentUser: { uid: 'u', privateKey: 'k' }, currentUserPK: 'k' });
    stores.selected.update({ switchedDid: undefined, profileType: null });
    stores.wallet.update({ wallet });
});
describe('history account isolation', () => {
    it('invalidates a captured identity even after switching away and back', () => {
        const context = captureHistoryContext(wallet as never);
        const isSelected = captureHistoryAccount();
        stores.selected.update({ switchedDid: 'child', profileType: 'child' });
        stores.selected.update({ switchedDid: undefined, profileType: null });
        expect(context.isCurrent()).toBe(false);
        expect(isSelected()).toBe(false);
        expect(captureHistoryContext(wallet as never).isCurrent()).toBe(true);
    });
    it('rejects logout, credential/key changes and wallet identity replacement', () => {
        const logoutContext = captureHistoryContext(wallet as never);
        stores.user.update({ currentUser: null });
        expect(logoutContext.isCurrent()).toBe(false);
        stores.user.update({ currentUser: { uid: 'u', privateKey: 'k' } });
        const keyContext = captureHistoryContext(wallet as never);
        stores.user.update({ currentUserPK: 'new' });
        expect(keyContext.isCurrent()).toBe(false);
        const walletContext = captureHistoryContext(wallet as never);
        stores.wallet.update({ wallet: { id: { did: () => 'did:key:other' } } });
        expect(walletContext.isCurrent()).toBe(false);
    });
    it('rechecks dynamic eligibility after capture', () => {
        let allowed = true;
        const context = captureHistoryContext(wallet as never, () => allowed);
        expect(context.eligible).toBe(true);
        allowed = false;
        expect(context.eligible).toBe(false);
    });
    it('blocks switched, child and service accounts while permitting the primary account', () => {
        expect(isHistoryAccountEligible()).toBe(true);
        for (const state of [
            { switchedDid: 'parent', profileType: 'parent' },
            { switchedDid: undefined, profileType: 'child' },
            { switchedDid: undefined, profileType: 'service' },
        ]) {
            stores.selected.update(state);
            expect(isHistoryAccountEligible()).toBe(false);
            expect(captureHistoryContext(wallet as never).eligible).toBe(false);
        }
    });
});

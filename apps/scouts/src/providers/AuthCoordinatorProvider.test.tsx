// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UnifiedAuthState } from 'learn-card-base';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

const mocks = vi.hoisted(() => ({
    coordinator: {
        state: { status: 'idle' } as UnifiedAuthState,
        hasEndedAuthSession: false,
        keyDerivation: { name: 'web3auth', capabilities: { recovery: false } },
    },
    config: { authProvider: 'firebase', keyDerivation: 'web3auth', providerConfig: {} },
    build: vi.fn(),
    persist: vi.fn(),
    push: vi.fn(),
    setStoredWallet: vi.fn(),
    setUser: vi.fn(),
    setMode: vi.fn(),
    log: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Only the coordinator input/SDK seams are mocked. The exported Scouts provider
// mounts its real AuthSessionManager, initialization effects and enriched context.
vi.mock('learn-card-base', async () => {
    const { useIdleAuthCleanup } =
        await import('../../../../packages/learn-card-base/src/auth-coordinator/useIdleAuthCleanup');
    const passThrough = ({ children }: { children: React.ReactNode }) => children;
    return {
        AuthCoordinatorProvider: passThrough,
        SignInAdapterProvider: passThrough,
        useAuthCoordinator: () => mocks.coordinator,
        useAuthSessionProvider: () => null,
        useAuthCoordinatorAutoSetup: vi.fn(),
        useIdleAuthCleanup,
        useSignInAdapter: () => ({ getCurrentUser: () => null }),
        getAuthConfig: () => mocks.config,
        getSSSConfig: () => ({ serverUrl: 'https://example.test' }),
        getEscrowStrategyConfig: vi.fn(),
        getLogger: () => mocks.log,
        registerKeyDerivationFactory: vi.fn(),
        resolveKeyDerivation: () => mocks.coordinator.keyDerivation,
        resolveAuthProvider: () => null,
        createWeb3AuthStrategy: vi.fn(),
        deriveWeb3AuthKey: vi.fn(),
        authUserStore: {
            use: { currentUser: () => null },
            get: { currentUser: () => null },
            set: { setUser: vi.fn() },
        },
        authStore: { set: { typeOfLogin: vi.fn() } },
        useToast: () => ({ presentToast: vi.fn() }),
        ToastTypeEnum: {},
        SocialLoginTypes: {},
        countConfiguredRecoveryMethods: vi.fn(),
        isEmailRelayConfigured: () => false,
        Overlay: passThrough,
        ErrorOverlay: () => null,
        StalledMigrationOverlay: () => null,
        EmailLinkOverlay: () => null,
        QrLoginApprover: () => null,
    };
});
vi.mock('learn-card-base/helpers/walletHelpers', () => ({
    getBespokeLearnCard: mocks.build,
    getSigningLearnCard: vi.fn(),
}));
vi.mock('learn-card-base/security/platformPrivateKeyStorage', () => ({
    setPlatformPrivateKey: mocks.persist,
    clearPlatformPrivateKey: vi.fn(),
}));
vi.mock('learn-card-base/stores/currentUserStore', () => ({
    default: {
        set: {
            currentUser: mocks.setUser,
            currentUserPK: vi.fn(),
            currentUserIsLoggedIn: vi.fn(),
        },
    },
}));
vi.mock('learn-card-base/stores/walletStore', () => ({
    walletStore: { set: { wallet: mocks.setStoredWallet } },
}));
vi.mock('learn-card-base/stores/walletModeStore', () => ({
    walletModeStore: { set: { mode: mocks.setMode } },
}));
vi.mock('learn-card-base/utils/pushUtilities', () => ({
    pushUtilities: { syncPushToken: mocks.push },
}));
vi.mock('learn-card-base/helpers/colorHelpers', () => ({ getRandomBaseColor: () => 'test' }));
vi.mock('learn-card-base/helpers/privateKeyHelpers', () => ({ getCurrentUserPrivateKey: vi.fn() }));
vi.mock('learn-card-base/helpers/authHelpers', () => ({
    unsetAuthToken: vi.fn(),
    clearAuthServiceProvider: vi.fn(),
}));
vi.mock('learn-card-base/helpers/indexedDBHelpers', () => ({ clearAllIndexedDB: vi.fn() }));
vi.mock('learn-card-base/security/webSecureStorage', () => ({ clearAll: vi.fn() }));
vi.mock('learn-card-base/security/nativeSSSStorage', () => ({ createNativeSSSStorage: vi.fn() }));
vi.mock('learn-card-base/hooks/useSQLiteStorage', () => ({
    default: () => ({ clearDB: vi.fn() }),
}));
vi.mock('learn-card-base/stores/web3AuthStore', () => ({
    default: { set: { web3Auth: vi.fn(), provider: vi.fn() } },
}));
vi.mock('learn-card-base/stores/redirectStore', () => ({
    default: { set: { lcnRedirect: vi.fn() } },
}));
vi.mock('learn-card-base/stores/chapiStore', () => ({
    chapiStore: { set: { isChapiInteraction: vi.fn() } },
}));
vi.mock('learn-card-base/stores/firstStartupStore', () => ({
    default: { set: { introSlidesCompleted: vi.fn(), firstStart: vi.fn() } },
}));
vi.mock('@learncard/sss-key-manager', () => ({
    createSSSStrategy: vi.fn(),
    generateEd25519PrivateKey: vi.fn(),
    createAdaptiveStorage: vi.fn(),
    isPublicComputerMode: () => false,
}));
vi.mock('../auth/firebaseProviderInit', () => ({}));
vi.mock('../components/debug/authDebugEvents', () => ({
    emitAuthDebugEvent: vi.fn(),
    emitAuthSuccess: vi.fn(),
    emitAuthError: vi.fn(),
}));
vi.mock('../components/recovery/RecoveryFlowModal', () => ({ RecoveryFlowModal: () => null }));
vi.mock('../components/recovery/RecoverySetupModal', () => ({ RecoverySetupModal: () => null }));
vi.mock('../components/auth/ReAuthOverlay', () => ({ default: () => null }));
vi.mock('../i18n', () => ({ useLocale: () => 'en' }));
vi.mock('../i18n/preAuthEmail', () => ({ createPreAuthEmailPayload: vi.fn() }));
vi.mock('../i18n/storage', () => ({ clearStoragePreservingLocale: vi.fn() }));
vi.mock('../paraglide/messages.js', () => ({}));

import { AuthCoordinatorProvider, useAppAuth } from './AuthCoordinatorProvider';

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (error: Error) => void;
    const promise = new Promise<T>((yes, no) => {
        resolve = yes;
        reject = no;
    });
    return { promise, resolve, reject };
};
const account = (id: string): BespokeLearnCard =>
    ({
        id: { did: () => id },
        invoke: { getProfile: vi.fn().mockResolvedValue(null) },
    }) as unknown as BespokeLearnCard;
const ready = (): UnifiedAuthState =>
    ({
        status: 'ready',
        privateKey: 'synthetic-key',
        did: 'did:key:test',
        authUser: { id: 'synthetic-user' },
    }) as UnifiedAuthState;
const Probe = () => {
    const { wallet } = useAppAuth();
    return <output data-testid="account">{wallet?.id.did() ?? 'signed-out'}</output>;
};
// This workspace's Testing Library render uses React's legacy root. Use the
// production React 18 root so StrictMode effect cleanup is exercised as well.
const unmounts: Array<() => void> = [];
const render = (element: React.ReactElement) => {
    const container = document.createElement('div');
    document.body.append(container);
    const root = createRoot(container);
    const rerender = (next: React.ReactElement) => act(() => root.render(next));
    unmounts.push(() => {
        act(() => root.unmount());
        container.remove();
    });
    rerender(element);
    return { rerender };
};
const mount = () => {
    const queryClient = new QueryClient();
    const tree = () => (
        <QueryClientProvider client={queryClient}>
            <AuthCoordinatorProvider>
                <Probe />
            </AuthCoordinatorProvider>
        </QueryClientProvider>
    );
    const view = render(tree());
    return (state: UnifiedAuthState) => {
        mocks.coordinator.state = state;
        mocks.coordinator.hasEndedAuthSession = state.status === 'idle';
        view.rerender(tree());
    };
};
const expectAccount = async (id: string) => {
    await act(async () => {});
    await waitFor(() => expect(screen.getByTestId('account').textContent).toBe(id));
};

beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.resetAllMocks();
    mocks.coordinator.state = ready();
    mocks.coordinator.hasEndedAuthSession = false;
    mocks.persist.mockResolvedValue(undefined);
    mocks.push.mockResolvedValue(undefined);
    window.sessionStorage.clear();
});
afterEach(() => {
    unmounts.splice(0).forEach(unmount => unmount());
    vi.unstubAllGlobals();
});

describe('ScoutPass interrupted account initialization', () => {
    it('restarts initialization after StrictMode effect cleanup without accepting the old result', async () => {
        const oldAttempt = deferred<BespokeLearnCard>();
        mocks.build
            .mockReturnValueOnce(oldAttempt.promise)
            .mockResolvedValueOnce(account('current-account'));
        render(
            <React.StrictMode>
                <QueryClientProvider client={new QueryClient()}>
                    <AuthCoordinatorProvider>
                        <Probe />
                    </AuthCoordinatorProvider>
                </QueryClientProvider>
            </React.StrictMode>
        );
        await expectAccount('current-account');
        expect(mocks.build).toHaveBeenCalledTimes(2);
        await act(async () => oldAttempt.resolve(account('old-account')));
        await expectAccount('current-account');
        expect(mocks.setStoredWallet).toHaveBeenCalledExactlyOnceWith(
            expect.objectContaining({ id: expect.any(Object) })
        );
    });

    it.each(['construction', 'secure storage', 'push sync'] as const)(
        'allows another sign-in after logout interrupts %s before local readiness',
        async stage => {
            const first = deferred<BespokeLearnCard>();
            const step = deferred<void>();
            const oldAccount = account('old-account');
            const newAccount = account('new-account');
            mocks.build.mockResolvedValue(newAccount);
            if (stage === 'construction') mocks.build.mockReturnValueOnce(first.promise);
            else mocks.build.mockResolvedValueOnce(oldAccount);
            if (stage === 'secure storage') mocks.persist.mockReturnValueOnce(step.promise);
            if (stage === 'push sync') mocks.push.mockReturnValueOnce(step.promise);
            const changeSession = mount();
            await waitFor(() =>
                expect(
                    stage === 'construction'
                        ? mocks.build
                        : stage === 'secure storage'
                          ? mocks.persist
                          : mocks.push
                ).toHaveBeenCalledOnce()
            );
            await expectAccount('signed-out');
            changeSession({ status: 'idle' });
            await act(async () => {
                first.resolve(oldAccount);
                step.resolve();
            });
            await expectAccount('signed-out');
            changeSession(ready());
            await expectAccount('new-account');
            expect(mocks.build).toHaveBeenCalledTimes(2);
        }
    );

    it.each(['resolve', 'reject'] as const)(
        'ignores an old construction %s after a newer same-account sign-in has started',
        async outcome => {
            const oldAttempt = deferred<BespokeLearnCard>();
            const newAttempt = deferred<BespokeLearnCard>();
            mocks.build
                .mockReturnValueOnce(oldAttempt.promise)
                .mockReturnValueOnce(newAttempt.promise);
            const changeSession = mount();
            await waitFor(() => expect(mocks.build).toHaveBeenCalledOnce());
            changeSession({ status: 'idle' });
            changeSession(ready());
            await waitFor(() => expect(mocks.build).toHaveBeenCalledTimes(2));
            await act(async () => {
                if (outcome === 'resolve') oldAttempt.resolve(account('old-account'));
                else oldAttempt.reject(new Error('Old attempt failed'));
            });
            await expectAccount('signed-out');
            expect(mocks.persist).not.toHaveBeenCalled();
            expect(mocks.setStoredWallet).not.toHaveBeenCalled();
            // A harmless coordinator update must not start a duplicate third attempt.
            changeSession(ready());
            expect(mocks.build).toHaveBeenCalledTimes(2);
            await act(async () => newAttempt.resolve(account('new-account')));
            await expectAccount('new-account');
        }
    );
});

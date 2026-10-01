import create from 'zustand';
import type { SignInAdapter } from '@learncard/types';
import { isPublicComputerMode, setPublicComputerMode } from '@learncard/sss-key-manager';
import { getLogger } from 'learn-card-base';

const log = getLogger('sign-in-persistence');
const failureMessage =
    "We couldn't set up Shared Computer mode. Sign-in was stopped. Please use a private device or reload to try again.";

interface SignInPersistenceState {
    isPublicMode: boolean;
    isUpdating: boolean;
    error: string | null;
}

export const useSignInPersistence = create<SignInPersistenceState>(() => ({
    isPublicMode: isPublicComputerMode(),
    isUpdating: false,
    error: null,
}));

let pendingPersistence: Promise<void> = Promise.resolve();

const applyPersistence = async (adapter: SignInAdapter, sessionOnly: boolean): Promise<void> => {
    try {
        if (!adapter.setSessionPersistence) throw new Error('Session persistence is unavailable');
        await adapter.setSessionPersistence(sessionOnly);
        setPublicComputerMode(sessionOnly);
        if (isPublicComputerMode() !== sessionOnly)
            throw new Error('Session preference was not saved');
        useSignInPersistence.setState({ isPublicMode: sessionOnly });
    } catch (error) {
        setPublicComputerMode(false);
        useSignInPersistence.setState({ isPublicMode: false, error: failureMessage });
        log.warn('Unable to configure sign-in persistence', error);
        throw new Error(failureMessage, { cause: error });
    }
};

/** Keep sign-in behind an in-flight toggle, including native ticket exchanges. */
export const changeSignInPersistence = async (
    adapter: SignInAdapter,
    sessionOnly: boolean
): Promise<void> => {
    if (useSignInPersistence.getState().isUpdating || useSignInPersistence.getState().error) return;
    useSignInPersistence.setState({ isUpdating: true });
    pendingPersistence = applyPersistence(adapter, sessionOnly);
    try {
        await pendingPersistence;
    } catch {
        // applyPersistence publishes the error and blocks subsequent sign-in attempts.
        log.info('Sign-in remains blocked until the page is reloaded');
    } finally {
        useSignInPersistence.setState({ isUpdating: false });
    }
};

/** All Keycloak entry points must await persistence before invoking the SDK. */
export const withSignInPersistence = (adapter: SignInAdapter): SignInAdapter => {
    const prepare = async (): Promise<void> => {
        await pendingPersistence;
        const { error } = useSignInPersistence.getState();
        if (error) throw new Error(error);
        await applyPersistence(adapter, isPublicComputerMode());
    };
    return {
        ...adapter,
        signInWithCustomToken: async (
            ...args
        ): ReturnType<SignInAdapter['signInWithCustomToken']> => {
            await prepare();
            return adapter.signInWithCustomToken(...args);
        },
        signInWithGoogle: async (...args): ReturnType<SignInAdapter['signInWithGoogle']> => {
            await prepare();
            return adapter.signInWithGoogle(...args);
        },
        signInWithApple: async (...args): ReturnType<SignInAdapter['signInWithApple']> => {
            await prepare();
            return adapter.signInWithApple(...args);
        },
        signInWithOidcCredential: async (
            ...args
        ): ReturnType<SignInAdapter['signInWithOidcCredential']> => {
            await prepare();
            return adapter.signInWithOidcCredential(...args);
        },
    };
};

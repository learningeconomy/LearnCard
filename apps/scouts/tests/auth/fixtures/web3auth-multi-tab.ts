import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import {
    createWeb3AuthStrategy,
    deriveWeb3AuthKey,
} from '../../../../../packages/learn-card-base/src/key-derivation/createWeb3AuthStrategy';

const auth = getAuth(
    initializeApp({ apiKey: 'test-api-key', projectId: 'test-project', appId: 'test-app' })
);
const strategyConfig = {
    clientId: 'test-client',
    web3AuthNetwork: 'testnet',
    verifier: 'test-verifier',
    isSessionCurrent: async (uid: string) => auth.currentUser?.uid === uid,
};
const strategy = createWeb3AuthStrategy(strategyConfig);
declare global {
    interface Window {
        web3AuthTabTest: {
            ready: () => Promise<void>;
            signIn: () => Promise<void>;
            status: string;
            error?: string;
            key?: string;
        };
    }
}
window.web3AuthTabTest = {
    ready: () => auth.authStateReady(),
    signIn: async () => {
        await signInWithCustomToken(auth, 'synthetic-custom-token');
    },
    status: 'idle',
};
onAuthStateChanged(auth, async user => {
    if (!user) return;
    window.web3AuthTabTest.status = 'deriving';
    try {
        const idToken = await user.getIdToken();
        await strategy.fetchServerKeyStatus(idToken, 'firebase');
        // Align the four Firebase notifications so the regression exercises
        // overlapping account setup rather than depending on polling timing.
        await fetch('/derivation-start', { method: 'POST' });
        window.web3AuthTabTest.key = new URLSearchParams(location.search).has('upgrade')
            ? await deriveWeb3AuthKey(strategyConfig, idToken)
            : await strategy.reconstructKey('local', 'remote');
        window.web3AuthTabTest.status = 'ready';
    } catch (error) {
        window.web3AuthTabTest.error = error instanceof Error ? error.message : 'unknown';
        window.web3AuthTabTest.status = 'error';
    }
});

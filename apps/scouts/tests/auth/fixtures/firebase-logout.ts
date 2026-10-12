import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signOut } from 'firebase/auth';
import { getId, getInstallations } from 'firebase/installations';

import { clearAllIndexedDB } from '../../../../../packages/learn-card-base/src/helpers/indexedDBHelpers';

export interface FirebaseLogoutHarness {
    ready: () => Promise<void>;
    signIn: () => Promise<string>;
    logout: () => Promise<void>;
    currentUserId: () => string | null;
    installationId: () => Promise<string>;
}

declare global {
    interface Window {
        firebaseLogoutTest: FirebaseLogoutHarness;
    }
}

const app = initializeApp({
    apiKey: 'test-api-key',
    appId: 'test-app',
    projectId: 'test-project',
    authDomain: 'localhost',
});

// Match the apps' web configuration: use real IndexedDB persistence, not memory.
const auth = getAuth(app);

window.firebaseLogoutTest = {
    ready: () => auth.authStateReady(),
    signIn: async () => (await signInWithCustomToken(auth, 'test-custom-token')).user.uid,
    logout: async () => {
        await signOut(auth);
        await clearAllIndexedDB();
    },
    currentUserId: () => auth.currentUser?.uid ?? null,
    installationId: () => getId(getInstallations(app)),
};

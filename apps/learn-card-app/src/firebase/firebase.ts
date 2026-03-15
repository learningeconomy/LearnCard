import { Capacitor } from '@capacitor/core';
import { initializeApp, getApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, deleteUser, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';

export type RawFirebaseConfig = {
    apiKey: string;
    authDomain: string;
    databaseURL?: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
};

export const firebaseConfig: RawFirebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = () => {
    let _auth;
    if (Capacitor.isNativePlatform()) {
        _auth = initializeAuth(getApp(), { persistence: indexedDBLocalPersistence });
    } else {
        _auth = getAuth();
    }
    return _auth;
};

console.debug('auth', auth());
console.debug('learncard 🔥firebase init🔥');

export { auth, deleteUser };

import { Capacitor } from '@capacitor/core';
import { initializeApp, getApp, getApps } from 'firebase/app';
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
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || '',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || '',
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

export { auth, deleteUser };

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
    apiKey: 'AIzaSyDQJcEDxhxdxRAVdIDBzcE1x6D-KOj6N4o',
    authDomain: 'learncard.firebaseapp.com',
    projectId: 'learncard',
    storageBucket: 'learncard.appspot.com',
    messagingSenderId: '776298253175',
    appId: '1:776298253175:web:dd996767bf1a2a37a2ef72',
    measurementId: 'G-XPHGSD6Q59',
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

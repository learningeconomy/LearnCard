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
    apiKey: 'AIzaSyCdh1fKaZgk3lKbMkzmiQ26k8aKRQQemjM',
    authDomain: 'scoutpass-9a67e.firebaseapp.com',
    projectId: 'scoutpass-9a67e',
    storageBucket: 'scoutpass-9a67e.appspot.com',
    messagingSenderId: '792471921493',
    appId: '1:792471921493:web:93ef24f3287ef63faec5dc',
    measurementId: 'G-BJR327CKF8',
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

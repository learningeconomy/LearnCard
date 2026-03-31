import { Capacitor } from '@capacitor/core';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, deleteUser, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';

import type { TenantFirebaseConfig } from 'learn-card-base';

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

/** Default Firebase config — used as fallback if no TenantConfig is provided */
export const DEFAULT_FIREBASE_CONFIG: RawFirebaseConfig = {
    apiKey: 'AIzaSyDQJcEDxhxdxRAVdIDBzcE1x6D-KOj6N4o',
    authDomain: 'learncard.firebaseapp.com',
    projectId: 'learncard',
    storageBucket: 'learncard.appspot.com',
    messagingSenderId: '776298253175',
    appId: '1:776298253175:web:dd996767bf1a2a37a2ef72',
    measurementId: 'G-XPHGSD6Q59',
};

// Keep backward compat export name
export const firebaseConfig: RawFirebaseConfig = DEFAULT_FIREBASE_CONFIG;

let _firebaseInitialized = false;

/**
 * Initialize Firebase with the given config.
 *
 * Call this once at app boot with the TenantConfig's firebase settings.
 * If called without arguments (or with undefined), falls back to the default config.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export const initializeFirebaseFromTenant = (tenantFirebase?: TenantFirebaseConfig): void => {
    if (_firebaseInitialized || getApps().length > 0) return;

    const config: RawFirebaseConfig = tenantFirebase
        ? {
              apiKey: tenantFirebase.apiKey,
              authDomain: tenantFirebase.authDomain,
              projectId: tenantFirebase.projectId,
              storageBucket: tenantFirebase.storageBucket,
              messagingSenderId: tenantFirebase.messagingSenderId,
              appId: tenantFirebase.appId,
              measurementId: tenantFirebase.measurementId ?? '',
          }
        : DEFAULT_FIREBASE_CONFIG;

    initializeApp(config);

    try {
        getAnalytics(getApp());
    } catch {
        // Analytics may not be available in all environments
    }

    _firebaseInitialized = true;

    console.debug('learncard 🔥firebase init🔥');
};

const auth = () => {
    // Lazy fallback: if bootstrapTenantConfig hasn't called initializeFirebaseFromTenant
    // yet (e.g. legacy code that imports { auth } directly), initialize with defaults.
    // This preserves backward compatibility while letting the tenant config have first shot.
    if (!_firebaseInitialized && getApps().length === 0) {
        initializeFirebaseFromTenant();
    }

    let _auth;

    if (Capacitor.isNativePlatform()) {
        _auth = initializeAuth(getApp(), { persistence: indexedDBLocalPersistence });
    } else {
        _auth = getAuth();
    }

    return _auth;
};

export { auth, deleteUser };

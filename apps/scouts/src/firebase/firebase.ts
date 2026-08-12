import { Capacitor } from '@capacitor/core';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth, deleteUser, initializeAuth, indexedDBLocalPersistence } from 'firebase/auth';

import type { TenantFirebaseConfig } from 'learn-card-base';
import { getLogger } from 'learn-card-base';

const log = getLogger('firebase');

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

/** Default Firebase config — used as fallback if no TenantConfig is provided. */
export const DEFAULT_FIREBASE_CONFIG: RawFirebaseConfig = {
    apiKey: 'AIzaSyCdh1fKaZgk3lKbMkzmiQ26k8aKRQQemjM',
    authDomain: 'scoutpass-9a67e.firebaseapp.com',
    projectId: 'scoutpass-9a67e',
    storageBucket: 'scoutpass-9a67e.appspot.com',
    messagingSenderId: '792471921493',
    appId: '1:792471921493:web:93ef24f3287ef63faec5dc',
    measurementId: 'G-BJR327CKF8',
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

    log.debug('scouts 🔥firebase init🔥');
};

const auth = () => {
    // Lazy fallback: if bootstrapTenantConfig hasn't called initializeFirebaseFromTenant
    // yet, initialize with defaults. This preserves backward compatibility while
    // still letting tenant config have first shot.
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

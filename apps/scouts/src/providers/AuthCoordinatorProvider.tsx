/**
 * AuthCoordinatorProvider (Scouts App wrapper)
 * 
 * Enriched wrapper around the shared AuthCoordinatorProvider from learn-card-base.
 * Provides a single source of truth for the layered auth model:
 * 
 *   Layer 0 (Core):     Private Key → DID → Wallet    [required for anything]
 *   Layer 1 (Optional): Auth Provider (Firebase)       [needed for SSS server ops]
 *   Layer 2 (Optional): LCN Profile                    [needed for network interactions]
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Web3Auth } from '@web3auth/single-factor-auth';
import { CHAIN_NAMESPACES } from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';

import type { LCNProfile } from '@learncard/types';

import {
    AuthCoordinatorProvider as BaseAuthCoordinatorProvider,
    useAuthCoordinator as useBaseAuthCoordinator,
    useAuthCoordinatorAutoSetup,
    createFirebaseAuthProvider,
    createWeb3AuthStrategy,
    registerKeyDerivationFactory,
    resolveKeyDerivation,
    Overlay,
    ErrorOverlay,
    StalledMigrationOverlay,
    QrLoginApprover,
    firebaseAuthStore,
    authStore,
    getAuthConfig,
    type AuthCoordinatorContextValue,
    type DebugEventLevel,
    type KeyDerivationStrategy,
} from 'learn-card-base';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import { walletStore } from 'learn-card-base/stores/walletStore';
import { pushUtilities } from 'learn-card-base/utils/pushUtilities';
import { getRandomBaseColor } from 'learn-card-base/helpers/colorHelpers';
import { getCurrentUserPrivateKey } from 'learn-card-base/helpers/privateKeyHelpers';
import { setPlatformPrivateKey, clearPlatformPrivateKey } from 'learn-card-base/security/platformPrivateKeyStorage';
import { clearAll as clearWebSecureAll } from 'learn-card-base/security/webSecureStorage';
import { unsetAuthToken, clearAuthServiceProvider } from 'learn-card-base/helpers/authHelpers';
import { clearAllIndexedDB } from 'learn-card-base/helpers/indexedDBHelpers';
import web3AuthStore from 'learn-card-base/stores/web3AuthStore';
import redirectStore from 'learn-card-base/stores/redirectStore';
import { chapiStore } from 'learn-card-base/stores/chapiStore';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import { useQueryClient } from '@tanstack/react-query';

import { createSSSStrategy, generateEd25519PrivateKey } from '@learncard/sss-key-manager';
import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';
import { createNativeSSSStorage } from 'learn-card-base/security/nativeSSSStorage';

import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';

import { auth } from '../firebase/firebase';

// ---------------------------------------------------------------------------
// DeviceLinkOverlay — fetches device share then renders the approver modal
// ---------------------------------------------------------------------------

const ScoutsDeviceLinkOverlay: React.FC<{
    did: string;
    keyDerivation: KeyDerivationStrategy;
    accountHint?: string;
    onClose: () => void;
}> = ({ did, keyDerivation, accountHint, onClose }) => {
    const [deviceShare, setDeviceShare] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const authConfig = getAuthConfig();

    useEffect(() => {
        let cancelled = false;

        const fetchShare = async () => {
            try {
                const share = await keyDerivation.getLocalKey();

                if (cancelled) return;

                if (!share) {
                    setError('No device key found.');
                    setLoading(false);
                    return;
                }

                setDeviceShare(share);
                setLoading(false);
            } catch (e) {
                if (cancelled) return;

                setError(e instanceof Error ? e.message : 'Failed to retrieve device key');
                setLoading(false);
            }
        };

        fetchShare();

        return () => { cancelled = true; };
    }, [keyDerivation]);

    if (loading) {
        return (
            <Overlay>
                <div className="p-6 flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin mb-3" />
                    <p className="text-sm text-gray-500">Preparing secure link...</p>
                </div>
            </Overlay>
        );
    }

    if (error || !deviceShare) {
        return (
            <Overlay>
                <div className="p-6 text-center">
                    <p className="text-sm text-red-600 mb-4">{error ?? 'No device key available'}</p>

                    <button
                        onClick={onClose}
                        className="py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm"
                    >
                        Close
                    </button>
                </div>
            </Overlay>
        );
    }

    const handleScanQr = async (): Promise<string | null> => {
        try {
            // Check and request camera permission before scanning
            const { camera } = await BarcodeScanner.checkPermissions();

            if (camera !== 'granted') {
                const requested = await BarcodeScanner.requestPermissions();

                if (requested.camera !== 'granted') {
                    console.warn('[ScoutPass] Camera permission denied');
                    return null;
                }
            }

            return new Promise(async (resolve) => {
                const listener = await BarcodeScanner.addListener('barcodeScanned', async (result) => {
                    await listener.remove();
                    await BarcodeScanner.stopScan();
                    resolve(result.barcode?.rawValue ?? null);
                });

                await BarcodeScanner.startScan({
                    formats: [BarcodeFormat.QrCode],
                    lensFacing: LensFacing.Back,
                });
            });
        } catch (e) {
            console.warn('[ScoutPass] QR scan failed:', e);
            await BarcodeScanner.removeAllListeners();
            await BarcodeScanner.stopScan();
            return null;
        }
    };

    return (
        <Overlay>
            <QrLoginApprover
                serverUrl={authConfig.serverUrl}
                deviceShare={deviceShare}
                approverDid={did}
                accountHint={accountHint}
                onDone={onClose}
                onCancel={onClose}
                onScanQr={Capacitor.isNativePlatform() ? handleScanQr : undefined}
            />
        </Overlay>
    );
};

// ---------------------------------------------------------------------------
// Provider factory registrations (module-level, runs once on import)
// ---------------------------------------------------------------------------

registerKeyDerivationFactory('sss', (config) =>
    createSSSStrategy({
        serverUrl: config.serverUrl,
        // On native Capacitor (iOS/Android), use encrypted SQLite instead of
        // IndexedDB to avoid iOS WKWebView IndexedDB eviction issues.
        storage: Capacitor.isNativePlatform() ? createNativeSSSStorage() : undefined,
        enableEmailBackupShare: config.enableEmailBackupShare,
    })
);

registerKeyDerivationFactory('web3auth', () => {
    const { web3AuthClientId, web3AuthNetwork, web3AuthVerifierId } = getAuthConfig();

    return createWeb3AuthStrategy({
        clientId: web3AuthClientId,
        web3AuthNetwork,
        verifier: web3AuthVerifierId,
    });
});

// ---------------------------------------------------------------------------
// Enriched App Auth Context
// ---------------------------------------------------------------------------

export interface AppAuthContextValue extends AuthCoordinatorContextValue {
    wallet: BespokeLearnCard | null;
    walletReady: boolean;
    isLoggedIn: boolean;
    lcnProfile: LCNProfile | null;
    lcnProfileLoading: boolean;
    hasLCNAccount: boolean;
    refetchLCNProfile: () => Promise<void>;
    showDeviceLinkModal: () => void;
    deviceLinkModalVisible: boolean;
}

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

export const useAppAuth = (): AppAuthContextValue => {
    const context = useContext(AppAuthContext);

    if (!context) {
        throw new Error('useAppAuth must be used within AuthCoordinatorProvider');
    }

    return context;
};

// Backward-compatible aliases
export const useAuthCoordinator = useAppAuth;
export const useAuthCoordinatorContext = useAppAuth;

interface ScoutsAuthCoordinatorProviderProps {
    children: React.ReactNode;
}

/**
 * AuthSessionManager
 *
 * Inner component that wires up:
 * 1. Auto-setup for needs_setup & needs_migration
 * 2. Wallet initialization when coordinator reaches 'ready'
 * 3. LCN profile fetching when wallet is available
 * 4. Store bridging (currentUserStore, walletStore, secure PK storage)
 *
 * Provides the enriched AppAuthContext to all children.
 */
const AuthSessionManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const coordinator = useBaseAuthCoordinator();
    const firebaseUser = firebaseAuthStore.use.currentUser();

    // --- Enriched state ---
    const [wallet, setWallet] = useState<BespokeLearnCard | null>(null);
    const [lcnProfile, setLcnProfile] = useState<LCNProfile | null>(null);
    const [lcnProfileLoading, setLcnProfileLoading] = useState(false);

    const walletInitRef = useRef(false);

    // Delay showing the stalled-migration overlay so the async Web3Auth
    // extraction has time to complete before we flash the "stalled" UI.
    const [migrationStallVisible, setMigrationStallVisible] = useState(false);

    useEffect(() => {
        if (coordinator.state.status !== 'needs_migration') {
            setMigrationStallVisible(false);
            return;
        }

        const timer = setTimeout(() => setMigrationStallVisible(true), 8000);

        return () => clearTimeout(timer);
    }, [coordinator.state.status]);

    // --- Device link modal ---
    const [deviceLinkVisible, setDeviceLinkVisible] = useState(false);

    const { keyDerivation } = coordinator;

    // --- Auto-open approver from push notification ---
    useEffect(() => {
        if (coordinator.state.status !== 'ready') return;

        const pushSessionId = window.sessionStorage.getItem('device_link_session_id');

        if (pushSessionId) {
            window.sessionStorage.removeItem('device_link_session_id');
            window.sessionStorage.removeItem('device_link_short_code');
            setDeviceLinkVisible(true);
        }
    }, [coordinator.state.status]);

    // --- QR login device share pickup from sessionStorage ---
    const qrPickupAttemptedRef = useRef(false);

    useEffect(() => {
        if (coordinator.state.status !== 'needs_recovery' || qrPickupAttemptedRef.current) return;

        const qrShare = window.sessionStorage.getItem('qr_login_device_share');

        if (!qrShare) return;

        qrPickupAttemptedRef.current = true;
        window.sessionStorage.removeItem('qr_login_device_share');

        const applyQrShare = async () => {
            try {
                await keyDerivation.storeLocalKey(qrShare);
                await coordinator.initialize();
            } catch (e) {
                console.warn('[ScoutPass] QR login device share pickup failed', e);
            }
        };

        applyQrShare();
    }, [coordinator.state.status, coordinator, keyDerivation]);

    useEffect(() => {
        if (coordinator.state.status !== 'needs_recovery') {
            qrPickupAttemptedRef.current = false;
        }
    }, [coordinator.state.status]);

    const didFromPrivateKey = useCallback(async (privateKey: string): Promise<string> => {
        const lc = await getBespokeLearnCard(privateKey);
        return lc?.id.did() || '';
    }, []);

    // --- Web3Auth key extraction for migration ---
    const migrationKeyFetchedRef = useRef(false);

    useEffect(() => {
        if (coordinator.state.status !== 'needs_migration' || migrationKeyFetchedRef.current) return;
        if (!firebaseUser) return;

        migrationKeyFetchedRef.current = true;

        const extractAndInject = async () => {
            try {
                const privateKeyProvider = new EthereumPrivateKeyProvider({
                    config: {
                        chainConfig: {
                            chainNamespace: CHAIN_NAMESPACES.EIP155,
                            chainId: '0x1',
                            rpcTarget: authConfig.web3AuthRpcTarget,
                            displayName: 'Ethereum Mainnet',
                            blockExplorerUrl: 'https://etherscan.io/',
                            ticker: 'ETH',
                            tickerName: 'Ethereum',
                        },
                    },
                });

                const web3auth = new Web3Auth({
                    clientId: authConfig.web3AuthClientId,
                    web3AuthNetwork: authConfig.web3AuthNetwork as 'sapphire_mainnet' | 'sapphire_devnet',
                    privateKeyProvider,
                    usePnPKey: true,
                });

                await web3auth.init();

                const firebaseAuth = auth();
                const liveUser = firebaseAuth.currentUser;

                if (!liveUser) return;

                const token = await liveUser.getIdToken(false);

                if (!token) return;

                await web3auth.connect({
                    verifier: authConfig.web3AuthVerifierId,
                    verifierId: liveUser.uid,
                    idToken: token,
                });

                const provider = web3auth.provider;

                if (!provider) return;

                const privateKey = await provider.request({ method: 'eth_private_key' }) as string;

                if (privateKey) {
                    coordinator.setMigrationData({ web3AuthKey: privateKey });
                }
            } catch (e) {
                console.error('[ScoutPass] Failed to extract Web3Auth key for migration:', e);
            }
        };

        extractAndInject();
    }, [coordinator.state.status, firebaseUser, coordinator]);

    useEffect(() => {
        if (coordinator.state.status !== 'needs_migration') {
            migrationKeyFetchedRef.current = false;
        }
    }, [coordinator.state.status]);

    useAuthCoordinatorAutoSetup(coordinator, {
        generatePrivateKey: generateEd25519PrivateKey,
        didFromPrivateKey,

        onReady: (_privateKey, did) => {
            console.log(`[ScoutPass] AuthCoordinator ready — DID: ${did.slice(0, 30)}...`);
        },

        onError: (error) => {
            console.error(`[ScoutPass] AuthCoordinator auto-setup failed: ${error}`);
        },
    });

    // --- Wallet initialization when coordinator reaches 'ready' ---
    useEffect(() => {
        if (coordinator.state.status !== 'ready' || walletInitRef.current) return;

        const { privateKey, did } = coordinator.state;

        walletInitRef.current = true;

        const initializeWallet = async () => {
            try {
                const newWallet = await getBespokeLearnCard(privateKey);

                if (!newWallet) {
                    console.error('[ScoutPass] Failed to initialize wallet from private key');
                    return;
                }

                walletStore.set.wallet(newWallet);

                try {
                    await setPlatformPrivateKey(privateKey);
                } catch (e) {
                    console.warn('[ScoutPass] Failed to persist private key to secure storage', e);
                }

                const authUser = coordinator.state.status === 'ready' ? coordinator.state.authUser : undefined;

                currentUserStore.set.currentUser({
                    uid: authUser?.id ?? '',
                    email: authUser?.email ?? '',
                    phoneNumber: authUser?.phone ?? '',
                    name: '',
                    profileImage: '',
                    privateKey,
                    baseColor: getRandomBaseColor(),
                });

                try {
                    await pushUtilities.syncPushToken();
                } catch (e) {
                    console.warn('[ScoutPass] Push token sync failed', e);
                }

                setWallet(newWallet);

                console.log(`[ScoutPass] Wallet initialized — DID: ${did.slice(0, 30)}...`);
            } catch (e) {
                console.error('[ScoutPass] Wallet initialization failed', e);
                walletInitRef.current = false;
            }
        };

        initializeWallet();
    }, [coordinator.state]);

    // --- Reset wallet when coordinator leaves 'ready' ---
    useEffect(() => {
        if (coordinator.state.status !== 'ready' && wallet) {
            setWallet(null);
            setLcnProfile(null);
            walletInitRef.current = false;
        }
    }, [coordinator.state.status, wallet]);

    // --- LCN profile fetching when wallet is available ---
    const fetchLCNProfile = useCallback(async () => {
        if (!wallet) return;

        setLcnProfileLoading(true);

        try {
            const cachedProfile = await wallet.invoke.getProfile();

            if (cachedProfile?.profileId) {
                const freshProfile = await wallet.invoke.getProfile(cachedProfile.profileId);
                setLcnProfile(freshProfile ?? cachedProfile ?? null);
            } else {
                setLcnProfile(cachedProfile ?? null);
            }
        } catch (e) {
            console.warn('[ScoutPass] LCN profile fetch failed', e);
            setLcnProfile(null);
        } finally {
            setLcnProfileLoading(false);
        }
    }, [wallet]);

    useEffect(() => {
        if (wallet) {
            fetchLCNProfile();
        }
    }, [wallet, fetchLCNProfile]);

    // --- Shared actions ---
    const handleLogout = useCallback(async () => {
        await coordinator.logout();
    }, [coordinator]);

    const handleRetry = useCallback(async () => {
        await coordinator.retry();
    }, [coordinator]);

    const handleReinitialize = useCallback(async () => {
        await coordinator.initialize();
    }, [coordinator]);

    // --- Determine which overlay (if any) to show ---
    const { status } = coordinator.state;

    const showStalledMigration =
        migrationStallVisible &&
        status === 'needs_migration' &&
        !(coordinator.state.status === 'needs_migration' && coordinator.state.migrationData?.web3AuthKey);

    const showError = status === 'error';

    // --- Build enriched context value ---
    const walletReady = !!wallet;
    const isLoggedIn = walletReady;
    const hasLCNAccount = !!lcnProfile;

    const showDeviceLinkModal = useCallback(() => {
        setDeviceLinkVisible(true);
    }, []);

    const enrichedValue: AppAuthContextValue = useMemo(() => ({
        ...coordinator,
        wallet,
        walletReady,
        isLoggedIn,
        lcnProfile,
        lcnProfileLoading,
        hasLCNAccount,
        refetchLCNProfile: fetchLCNProfile,
        showDeviceLinkModal,
        deviceLinkModalVisible: deviceLinkVisible,
    }), [
        coordinator,
        wallet,
        walletReady,
        isLoggedIn,
        lcnProfile,
        lcnProfileLoading,
        hasLCNAccount,
        fetchLCNProfile,
        showDeviceLinkModal,
        deviceLinkVisible,
    ]);

    return (
        <AppAuthContext.Provider value={enrichedValue}>
            {children}

            {/* ── Stalled migration overlay ────────────────────── */}
            {showStalledMigration && (
                <StalledMigrationOverlay
                    onRetry={handleReinitialize}
                    onLogout={handleLogout}
                />
            )}

            {/* ── Error overlay ────────────────────────────────── */}
            {showError && coordinator.state.status === 'error' && (
                <ErrorOverlay
                    error={coordinator.state.error}
                    canRetry={coordinator.state.canRetry}
                    onRetry={handleRetry}
                    onLogout={handleLogout}
                />
            )}

            {/* ── Device link overlay (approver) ────────────── */}
            {deviceLinkVisible && coordinator.state.status === 'ready' && (
                <ScoutsDeviceLinkOverlay
                    did={coordinator.state.did}
                    keyDerivation={keyDerivation}
                    accountHint={coordinator.state.authUser?.email || coordinator.state.authUser?.phone}
                    onClose={() => setDeviceLinkVisible(false)}
                />
            )}
        </AppAuthContext.Provider>
    );
};

// --- Cached private key retrieval for private-key-first init ---
const getCachedPrivateKey = async (): Promise<string | null> => {
    try {
        return await getCurrentUserPrivateKey();
    } catch (e) {
        console.warn('[ScoutPass] getCachedPrivateKey failed', e);
        return null;
    }
};

export const AuthCoordinatorProvider: React.FC<ScoutsAuthCoordinatorProviderProps> = ({ children }) => {
    const firebaseUser = firebaseAuthStore.use.currentUser();
    const authConfig = getAuthConfig();
    const serverUrl = authConfig.serverUrl;
    const queryClient = useQueryClient();
    const { clearDB } = useSQLiteStorage();

    // Create Firebase auth provider
    const authProvider = useMemo(() => {
        return createFirebaseAuthProvider({
            getAuth: () => auth(),
            user: firebaseUser,
            onSignOut: async () => {
                // Sign out the web Firebase layer
                const firebaseAuth = auth();
                await firebaseAuth.signOut();

                // Also sign out the native Capacitor Firebase plugin (iOS/Android)
                if (Capacitor.isNativePlatform()) {
                    try {
                        await FirebaseAuthentication.signOut();
                    } catch (e) {
                        console.warn('[ScoutPass] Native FirebaseAuthentication.signOut failed', e);
                    }
                }

                firebaseAuthStore.set.firebaseAuth(null);
                firebaseAuthStore.set.setFirebaseCurrentUser(null);
            },
        });
    }, [firebaseUser]);

    // DID derivation helper
    const didFromPrivateKey = useCallback(async (privateKey: string): Promise<string> => {
        const lc = await getBespokeLearnCard(privateKey);
        return lc?.id.did() || '';
    }, []);

    // Resolve key derivation strategy from the provider registry (env-var driven)
    const keyDerivation = useMemo(
        () => resolveKeyDerivation(authConfig),
        [authConfig.keyDerivation, authConfig.serverUrl]
    );

    // Debug event handler
    const handleDebugEvent = useCallback((
        type: string,
        message: string,
        level: DebugEventLevel,
        _data?: Record<string, unknown>
    ) => {
        const prefix = `[ScoutPass][${level}]`;
        if (level === 'error') {
            console.error(`${prefix} ${type}: ${message}`);
        } else if (level === 'warning') {
            console.warn(`${prefix} ${type}: ${message}`);
        } else {
            console.log(`${prefix} ${type}: ${message}`);
        }
    }, []);

    // Unified logout cleanup — called by the coordinator after its own signOut + clearLocalKeys.
    const handleAppLogout = useCallback(async () => {
        try { await queryClient.clear(); } catch (e) { console.warn('[ScoutPass] Failed to clear query cache', e); }

        walletStore.set.wallet(null);
        web3AuthStore.set.web3Auth(null);
        web3AuthStore.set.provider(null);
        redirectStore.set.lcnRedirect(null);
        firebaseAuthStore.set.firebaseAuth(null);
        authStore.set.typeOfLogin(null);
        chapiStore.set.isChapiInteraction(null);

        clearAuthServiceProvider();
        unsetAuthToken();

        try { await clearDB(); } catch (e) { console.warn('[ScoutPass] Failed to clear SQLite DB', e); }

        currentUserStore.set.currentUser(null);
        currentUserStore.set.currentUserPK(null);
        currentUserStore.set.currentUserIsLoggedIn(false);

        window.localStorage.clear();
        window.sessionStorage.clear();

        firstStartupStore.set.introSlidesCompleted(true);
        firstStartupStore.set.firstStart(false);

        try { await clearPlatformPrivateKey(); } catch (e) { console.warn('[ScoutPass] Failed to clear platform private key', e); }

        try { await clearWebSecureAll(); } catch (e) { console.warn('[ScoutPass] Failed to clear secure storage', e); }

        try { await clearAllIndexedDB(keyDerivation); } catch (e) { console.warn('[ScoutPass] Failed to clear IndexedDB', e); }
    }, [queryClient, clearDB, keyDerivation]);

    return (
        <BaseAuthCoordinatorProvider
            keyDerivation={keyDerivation}
            authProvider={authProvider}
            didFromPrivateKey={didFromPrivateKey}
            getCachedPrivateKey={getCachedPrivateKey}
            onLogout={handleAppLogout}
            onDebugEvent={handleDebugEvent}
            legacyAccountThresholdMs={5 * 60 * 1000}
            // Always enabled — switch backends via VITE_KEY_DERIVATION env var.
            enabled={true}
        >
            <AuthSessionManager>
                {children}
            </AuthSessionManager>
        </BaseAuthCoordinatorProvider>
    );
};

export default AuthCoordinatorProvider;

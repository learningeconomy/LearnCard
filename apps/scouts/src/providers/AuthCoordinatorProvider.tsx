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
    type AuthProvider,
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

import { createSSSStrategy, generateEd25519PrivateKey, createAdaptiveStorage, isPublicComputerMode } from '@learncard/sss-key-manager';
import type { RecoverySetupInput } from '@learncard/sss-key-manager';
import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';
import { createNativeSSSStorage } from 'learn-card-base/security/nativeSSSStorage';

import { getBespokeLearnCard, getSigningLearnCard } from 'learn-card-base/helpers/walletHelpers';

import { auth } from '../firebase/firebase';

import {
    emitAuthDebugEvent,
    emitAuthSuccess,
    emitAuthError,
    type AuthDebugEventType,
} from '../components/debug/authDebugEvents';

import { RecoveryFlowModal } from '../components/recovery/RecoveryFlowModal';
import { RecoverySetupModal } from '../components/recovery/RecoverySetupModal';
import ReAuthOverlay from '../components/auth/ReAuthOverlay';

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
    const [shareVersion, setShareVersion] = useState<number | undefined>(undefined);
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

                // Fetch the share version if the strategy supports it
                const version = await keyDerivation.getLocalShareVersion?.();

                if (!cancelled && version != null) {
                    setShareVersion(version);
                }

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
                shareVersion={shareVersion}
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
        // On web, use adaptive storage that routes to sessionStorage when the
        // user has enabled "public computer" mode.
        storage: Capacitor.isNativePlatform()
            ? createNativeSSSStorage()
            : createAdaptiveStorage(),
        enableEmailBackupShare: config.enableEmailBackupShare,
    })
);

registerKeyDerivationFactory('web3auth', () => {
    const { web3AuthClientId, web3AuthNetwork, web3AuthVerifierId, web3AuthRpcTarget } = getAuthConfig();

    return createWeb3AuthStrategy({
        clientId: web3AuthClientId,
        web3AuthNetwork,
        verifier: web3AuthVerifierId,
        chainConfig: web3AuthRpcTarget ? { rpcTarget: web3AuthRpcTarget } : undefined,
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
    recoveryMethodCount: number | null;
    openRecoverySetup: () => void;
    authProvider: AuthProvider | null;
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
    const authConfig = getAuthConfig();

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

    // --- Public computer mode: warn before tab close ---
    useEffect(() => {
        if (!isPublicComputerMode()) return;

        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };

        window.addEventListener('beforeunload', handler);

        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    // --- Recovery setup prompt (shown after first-time setup with no recovery methods) ---
    const [showRecoverySetup, setShowRecoverySetup] = useState(false);
    const wasNewUserRef = useRef(false);

    // --- Proactive auth session check state (effect is below, after recoveryAuthProvider) ---
    const [recoverySessionValid, setRecoverySessionValid] = useState<boolean | null>(null);

    // --- Recovery method count (null = not yet checked) ---
    const [recoveryMethodCount, setRecoveryMethodCount] = useState<number | null>(null);

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

    // Track whether the user went through needs_setup (new user flow)
    useEffect(() => {
        if (coordinator.state.status === 'needs_setup') {
            wasNewUserRef.current = true;
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

        const qrVersionStr = window.sessionStorage.getItem('qr_login_share_version');
        window.sessionStorage.removeItem('qr_login_share_version');

        const applyQrShare = async () => {
            try {
                await keyDerivation.storeLocalKey(qrShare);

                // Store the share version if it was included in the QR transfer
                if (qrVersionStr != null) {
                    const version = parseInt(qrVersionStr, 10);

                    if (!isNaN(version)) {
                        await keyDerivation.storeLocalShareVersion?.(version);
                    }
                }

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

    // --- Auth provider for recovery methods ---
    const recoveryAuthProvider = useMemo(() => {
        if (!firebaseUser) return null;

        return createFirebaseAuthProvider({
            getAuth: () => auth(),
            user: firebaseUser,
        });
    }, [firebaseUser]);

    // --- Proactive auth session check for recovery setup ---
    useEffect(() => {
        if (!showRecoverySetup || !recoveryAuthProvider) {
            setRecoverySessionValid(null);
            return;
        }

        let cancelled = false;

        const check = async () => {
            const refreshed = await coordinator.refreshAuthSession();

            if (cancelled) return;

            if (refreshed) {
                setRecoverySessionValid(true);
            } else {
                try {
                    await recoveryAuthProvider.getIdToken();

                    if (!cancelled) setRecoverySessionValid(true);
                } catch {
                    if (!cancelled) setRecoverySessionValid(false);
                }
            }
        };

        check();

        return () => { cancelled = true; };
    }, [showRecoverySetup, recoveryAuthProvider, coordinator]);

    const didFromPrivateKey = useCallback(async (privateKey: string): Promise<string> => {
        const lc = await getSigningLearnCard(privateKey);
        return lc?.id.did() || '';
    }, []);

    // --- DID-Auth VP signing (for recovery setup write ops) ---
    const signDidAuthVp = useCallback(async (privateKey: string): Promise<string> => {
        try {
            const lc = await getSigningLearnCard(privateKey);

            const vpJwt = await lc.invoke.getDidAuthVp({ proofFormat: 'jwt' });

            if (!vpJwt || typeof vpJwt !== 'string') {
                console.error('[ScoutPass][signDidAuthVp] getDidAuthVp returned non-string:', typeof vpJwt, vpJwt);
                throw new Error('Failed to sign DID-Auth VP JWT');
            }

            return vpJwt;
        } catch (e) {
            console.error('[ScoutPass][signDidAuthVp] error:', e);
            throw e instanceof Error ? e : new Error(String(e));
        }
    }, []);

    // --- Web3Auth key extraction for migration ---
    const migrationKeyFetchedRef = useRef(false);

    useEffect(() => {
        if (coordinator.state.status !== 'needs_migration' || migrationKeyFetchedRef.current) return;
        if (!firebaseUser) return;

        migrationKeyFetchedRef.current = true;

        const extractAndInject = async () => {
            try {
                emitAuthDebugEvent('web3auth:migration_key', 'Extracting Web3Auth key for migration', {
                    data: {
                        clientId: authConfig.web3AuthClientId ? `${authConfig.web3AuthClientId.slice(0, 8)}...` : '(empty)',
                        network: authConfig.web3AuthNetwork || '(empty)',
                        verifier: authConfig.web3AuthVerifierId || '(empty)',
                    },
                });

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

                emitAuthDebugEvent('web3auth:migration_key', 'Web3Auth SFA: calling init()...');
                await web3auth.init();
                emitAuthDebugEvent('web3auth:migration_key', 'Web3Auth SFA: init() complete');

                const firebaseAuth = auth();
                const liveUser = firebaseAuth.currentUser;

                if (!liveUser) {
                    emitAuthError('web3auth:migration_key', 'No live Firebase user available — aborting extraction');
                    return;
                }

                const token = await liveUser.getIdToken(false);

                if (!token) {
                    emitAuthError('web3auth:migration_key', 'No Firebase ID token available — aborting extraction');
                    return;
                }

                emitAuthDebugEvent('web3auth:migration_key', 'Web3Auth SFA: calling connect()...', {
                    data: {
                        verifier: authConfig.web3AuthVerifierId,
                        verifierId: liveUser.uid,
                        tokenLength: token.length,
                    },
                });
                await web3auth.connect({
                    verifier: authConfig.web3AuthVerifierId,
                    verifierId: liveUser.uid,
                    idToken: token,
                });
                emitAuthDebugEvent('web3auth:migration_key', 'Web3Auth SFA: connect() complete');

                const provider = web3auth.provider;

                if (!provider) {
                    emitAuthError('web3auth:migration_key', 'Web3Auth provider is null after connect — no key extracted');
                    return;
                }

                emitAuthDebugEvent('web3auth:migration_key', 'Requesting private key from Web3Auth provider...');
                const privateKey = await provider.request({ method: 'eth_private_key' }) as string;

                if (privateKey) {
                    emitAuthSuccess('web3auth:migration_key', 'Web3Auth key extracted for migration');
                    coordinator.setMigrationData({ web3AuthKey: privateKey });
                } else {
                    emitAuthError('web3auth:migration_key', 'Web3Auth provider returned empty private key');
                }
            } catch (e) {
                const msg = e instanceof Error ? e.message : 'Unknown error';
                emitAuthError('web3auth:migration_key', `Failed to extract Web3Auth key: ${msg}`, e);
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
            emitAuthSuccess('auth:coordinator_ready', `Coordinator ready — DID: ${did.slice(0, 30)}...`);
        },

        onError: (error) => {
            emitAuthError('auth:coordinator_error', `Auto-setup failed: ${error}`);
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

                // Persist the private key in secure storage (skip in public
                // computer mode — key stays in memory only so nothing
                // survives tab close).
                if (!isPublicComputerMode()) {
                    try {
                        await setPlatformPrivateKey(privateKey);
                    } catch (e) {
                        console.warn('[ScoutPass] Failed to persist private key to secure storage', e);
                    }
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

                emitAuthSuccess('auth:wallet_ready', `Wallet initialized — DID: ${did.slice(0, 30)}...`);

                // Check recovery methods for all users; prompt new users to set up
                // (only relevant for strategies that support recovery)
                if (keyDerivation.capabilities.recovery && recoveryAuthProvider && keyDerivation.getAvailableRecoveryMethods) {
                    const isNewUser = wasNewUserRef.current;
                    wasNewUserRef.current = false;

                    try {
                        const token = await recoveryAuthProvider.getIdToken();
                        const providerType = recoveryAuthProvider.getProviderType();
                        const methods = await keyDerivation.getAvailableRecoveryMethods(token, providerType);

                        // Only count user-configured methods (password, passkey, phrase, backup).
                        // The silently-sent email share is injected by the strategy and isn't
                        // something the user explicitly set up, so exclude it from the count.
                        const userConfiguredCount = methods.filter(m => m.type !== 'email').length;

                        setRecoveryMethodCount(userConfiguredCount);

                        // Show recovery setup for new users, or always in public
                        // computer mode when no recovery methods exist.
                        if (userConfiguredCount === 0 && (isNewUser || isPublicComputerMode())) {
                            setShowRecoverySetup(true);
                        }
                    } catch {
                        // Non-critical — don't block the user
                    }
                }
            } catch (e) {
                console.error('[ScoutPass] Wallet initialization failed', e);
                walletInitRef.current = false;
            }
        };

        initializeWallet();
    }, [coordinator.state, recoveryAuthProvider, keyDerivation]);

    // --- Reset wallet when coordinator leaves 'ready' ---
    useEffect(() => {
        if (coordinator.state.status !== 'ready' && wallet) {
            setWallet(null);
            setLcnProfile(null);
            setRecoveryMethodCount(null);
            walletInitRef.current = false;
        }
    }, [coordinator.state.status, wallet]);

    // --- Clear stale legacy stores when coordinator is idle ---
    // After a public-computer session, the tab close destroys the Firebase
    // session (browserSessionPersistence) and sessionStorage, but zustand
    // stores may still have cached user data from localStorage. Detect and
    // clean up this inconsistent state so the UI shows the login page.
    useEffect(() => {
        if (coordinator.state.status !== 'idle') return;
        if (!firebaseUser?.uid) return;

        const timer = setTimeout(() => {
            const firebaseAuth = auth();

            if (!firebaseAuth.currentUser) {
                firebaseAuthStore.set.firebaseAuth(null);
                firebaseAuthStore.set.setFirebaseCurrentUser(null);
                authStore.set.typeOfLogin(null);
                currentUserStore.set.currentUser(null);
                currentUserStore.set.currentUserPK(null);
                currentUserStore.set.currentUserIsLoggedIn(false);
                walletStore.set.wallet(null);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [coordinator.state.status, firebaseUser]);

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

    // --- Derived values for the recovery modal ---
    const availableMethods = useMemo(() => {
        if (coordinator.state.status !== 'needs_recovery') return [];

        return coordinator.state.recoveryMethods.map(m => ({
            type: m.type,
            credentialId: m.credentialId,
            createdAt: m.createdAt instanceof Date
                ? m.createdAt.toISOString()
                : String(m.createdAt),
        }));
    }, [coordinator.state]);

    // --- Determine which overlay (if any) to show ---
    const { status } = coordinator.state;

    const showRecovery = status === 'needs_recovery' && !!recoveryAuthProvider;

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
        recoveryMethodCount,
        openRecoverySetup: () => setShowRecoverySetup(true),
        authProvider: recoveryAuthProvider,
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
        recoveryMethodCount,
        recoveryAuthProvider,
    ]);

    return (
        <AppAuthContext.Provider value={enrichedValue}>
            {children}

            {/* ── Recovery overlay ─────────────────────────────── */}
            {showRecovery && recoveryAuthProvider && (
                <Overlay>
                    <RecoveryFlowModal
                        availableMethods={availableMethods}
                        recoveryReason={coordinator.state.status === 'needs_recovery' ? coordinator.state.recoveryReason : undefined}
                        maskedRecoveryEmail={coordinator.state.status === 'needs_recovery' ? coordinator.state.maskedRecoveryEmail : null}
                        onRecoverWithPasskey={async (credentialId: string) => {
                            await coordinator.recover({ method: 'passkey', credentialId });
                        }}
                        onRecoverWithPhrase={async (phrase: string) => {
                            await coordinator.recover({ method: 'phrase', phrase });
                        }}
                        onRecoverWithBackup={async (fileContents: string, password: string) => {
                            await coordinator.recover({ method: 'backup', fileContents, password });
                        }}
                        onRecoverWithEmail={async (emailShare: string) => {
                            await coordinator.recover({ method: 'email', emailShare });
                        }}
                        onRecoverWithDevice={async (deviceShare: string, shareVersion?: number) => {
                            await keyDerivation.storeLocalKey(deviceShare);

                            if (shareVersion != null) {
                                console.debug('[ScoutPass][Recovery via Device] storing shareVersion:', shareVersion);
                                await keyDerivation.storeLocalShareVersion?.(shareVersion);
                            } else {
                                console.warn('[ScoutPass][Recovery via Device] no shareVersion received from approver device');
                            }

                            await coordinator.initialize();
                        }}
                        onCancel={handleLogout}
                    />
                </Overlay>
            )}

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

            {/* ── Recovery setup prompt (new users) ───────────── */}
            {showRecoverySetup && recoveryAuthProvider && coordinator.state.status === 'ready' && keyDerivation.setupRecoveryMethod && (() => {
                // Session check still in progress — show loading
                if (recoverySessionValid === null) {
                    return (
                        <Overlay>
                            <div className="p-8 flex flex-col items-center">
                                <div className="w-8 h-8 border-2 border-grayscale-200 border-t-emerald-600 rounded-full animate-spin mb-3" />
                                <p className="text-sm text-grayscale-500">Verifying session...</p>
                            </div>
                        </Overlay>
                    );
                }

                // Session expired — show in-place re-auth overlay
                if (recoverySessionValid === false) {
                    return (
                        <Overlay>
                            <ReAuthOverlay
                                onSuccess={() => setRecoverySessionValid(true)}
                                onCancel={() => setShowRecoverySetup(false)}
                            />
                        </Overlay>
                    );
                }

                // Session valid — show the recovery setup modal
                const { serverUrl } = getAuthConfig();
                const currentPrivateKey = coordinator.state.status === 'ready' ? coordinator.state.privateKey : '';

                const setupMethod = async (input: RecoverySetupInput, authUser?: { id: string; email?: string; phone?: string; providerType: string } | null) => {
                    console.debug('[ScoutPass][setupMethod] starting, privateKey length:', currentPrivateKey?.length, 'method:', input.method);

                    let token: string;

                    try {
                        token = await recoveryAuthProvider.getIdToken();
                    } catch {
                        throw new Error('Your session has expired. Please close this dialog and sign in again.');
                    }

                    const providerType = recoveryAuthProvider.getProviderType();

                    console.debug('[ScoutPass][setupMethod] got token, providerType:', providerType, 'calling setupRecoveryMethod');

                    return keyDerivation.setupRecoveryMethod!({
                        token,
                        providerType,
                        privateKey: currentPrivateKey,
                        input,
                        authUser: authUser ?? undefined,
                        signDidAuthVp,
                    });
                };

                const getTokenAndProvider = async () => {
                    const token = await recoveryAuthProvider.getIdToken();
                    const providerType = recoveryAuthProvider.getProviderType();
                    return { token, providerType };
                };

                const getDidAuthHeaders = async (): Promise<Record<string, string>> => {
                    const vpJwt = await signDidAuthVp(currentPrivateKey);

                    return {
                        'Content-Type': 'application/json',
                        ...(vpJwt ? { Authorization: `Bearer ${vpJwt}` } : {}),
                    };
                };

                return (
                    <Overlay>
                        <RecoverySetupModal
                            existingMethods={[]}
                            maskedRecoveryEmail={null}
                            onSetupPasskey={async () => {
                                const authUser = await recoveryAuthProvider.getCurrentUser();
                                const result = await setupMethod({ method: 'passkey' }, authUser);

                                setRecoveryMethodCount(prev => (prev ?? 0) + 1);
                                setShowRecoverySetup(false);
                                return result.method === 'passkey' ? result.credentialId : '';
                            }}
                            onGeneratePhrase={async () => {
                                const authUser = await recoveryAuthProvider.getCurrentUser();
                                const result = await setupMethod({ method: 'phrase' }, authUser);
                                return result.method === 'phrase' ? result.phrase : '';
                            }}
                            onSetupBackup={async (backupPw: string) => {
                                const authUser = await recoveryAuthProvider.getCurrentUser();
                                const did = coordinator.state.status === 'ready' ? coordinator.state.did : '';
                                const result = await setupMethod({ method: 'backup', password: backupPw, did }, authUser);

                                setRecoveryMethodCount(prev => (prev ?? 0) + 1);
                                return result.method === 'backup' ? JSON.stringify(result.backupFile, null, 2) : '';
                            }}
                            onAddRecoveryEmail={async (email: string) => {
                                const { token, providerType } = await getTokenAndProvider();
                                const headers = await getDidAuthHeaders();

                                const res = await fetch(`${serverUrl}/keys/recovery-email/add`, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify({ authToken: token, providerType, email }),
                                });

                                if (!res.ok) {
                                    const data = await res.json().catch(() => ({}));
                                    throw new Error(data?.message || 'Failed to send verification code.');
                                }
                            }}
                            onVerifyRecoveryEmail={async (code: string) => {
                                const { token, providerType } = await getTokenAndProvider();
                                const headers = await getDidAuthHeaders();

                                const res = await fetch(`${serverUrl}/keys/recovery-email/verify`, {
                                    method: 'POST',
                                    headers,
                                    body: JSON.stringify({ authToken: token, providerType, code }),
                                });

                                if (!res.ok) {
                                    const data = await res.json().catch(() => ({}));
                                    throw new Error(data?.message || 'Incorrect code.');
                                }

                                return res.json();
                            }}
                            onSetupEmailRecovery={async () => {
                                const authUser = await recoveryAuthProvider.getCurrentUser();
                                await setupMethod({ method: 'email' }, authUser);
                                setRecoveryMethodCount(prev => (prev ?? 0) + 1);
                            }}
                            onClose={() => setShowRecoverySetup(false)}
                        />
                    </Overlay>
                );
            })()}
        </AppAuthContext.Provider>
    );
};

// --- Cached private key retrieval for private-key-first init ---
// In public computer mode, skip the persistent cache so the coordinator
// always re-derives the key from shares (which live in sessionStorage).
const getCachedPrivateKey = async (): Promise<string | null> => {
    if (isPublicComputerMode()) return null;

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

    // Ref for clearDB — useSQLiteStorage() returns a new function identity
    // on every render (not memoized), which would cascade through
    // handleAppLogout → onLogout → base coordinator useEffect, causing an
    // infinite re-init loop. Using a ref keeps handleAppLogout stable.
    const clearDBRef = useRef(clearDB);
    clearDBRef.current = clearDB;

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

    // DID derivation helper — uses getSigningLearnCard (no network) for deterministic did:key
    const didFromPrivateKey = useCallback(async (privateKey: string): Promise<string> => {
        const lc = await getSigningLearnCard(privateKey);
        return lc?.id.did() || '';
    }, []);

    // DID-Auth VP signing — proves private key ownership to the server on write ops.
    // Uses getSigningLearnCard (no network) so did:key is used deterministically.
    const signDidAuthVp = useCallback(async (privateKey: string): Promise<string> => {
        const lc = await getSigningLearnCard(privateKey);

        const vpJwt = await lc.invoke.getDidAuthVp({ proofFormat: 'jwt' });

        if (!vpJwt || typeof vpJwt !== 'string') throw new Error('Failed to sign DID-Auth VP JWT');

        return vpJwt;
    }, []);

    // Resolve key derivation strategy from the provider registry (env-var driven)
    const keyDerivation = useMemo(
        () => resolveKeyDerivation(authConfig),
        [authConfig.keyDerivation, authConfig.serverUrl]
    );

    // Debug event handler — forward to the in-memory event system so
    // AuthKeyDebugWidget can display events in its timeline.
    const handleDebugEvent = useCallback((
        type: string,
        message: string,
        level: DebugEventLevel,
        data?: Record<string, unknown>
    ) => {
        emitAuthDebugEvent(type as AuthDebugEventType, message, { level, data });
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

        try { await clearDBRef.current(); } catch (e) { console.warn('[ScoutPass] Failed to clear SQLite DB', e); }

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
    }, [queryClient, keyDerivation]);

    return (
        <BaseAuthCoordinatorProvider
            keyDerivation={keyDerivation}
            authProvider={authProvider}
            didFromPrivateKey={didFromPrivateKey}
            signDidAuthVp={signDidAuthVp}
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

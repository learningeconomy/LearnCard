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

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
} from 'react';
import { Capacitor } from '@capacitor/core';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';

import type { LCNVisibleProfile } from '@learncard/types';

import {
    AuthCoordinatorProvider as BaseAuthCoordinatorProvider,
    useAuthCoordinator as useBaseAuthCoordinator,
    useAuthCoordinatorAutoSetup,
    useIdleAuthCleanup,
    createWeb3AuthStrategy,
    deriveWeb3AuthKey,
    registerKeyDerivationFactory,
    resolveKeyDerivation,
    resolveAuthProvider,
    useAuthSessionProvider,
    SignInAdapterProvider,
    Overlay,
    ErrorOverlay,
    StalledMigrationOverlay,
    EmailLinkOverlay,
    QrLoginApprover,
    useSignInAdapter,
    authUserStore,
    authStore,
    SocialLoginTypes,
    getAuthConfig,
    getSSSConfig,
    getTenantEscrowStrategyConfig,
    getEscrowEmailSender,
    type EscrowEmailSenderNote,
    getLogger,
    useToast,
    ToastTypeEnum,
    type AuthCoordinatorContextValue,
    type AuthProvider,
    type AuthUser,
    type DebugEventLevel,
    type KeyDerivationStrategy,
    isEmailRelayConfigured,
} from 'learn-card-base';
import currentUserStore from 'learn-card-base/stores/currentUserStore';
import { walletStore } from 'learn-card-base/stores/walletStore';
import { walletModeStore } from 'learn-card-base/stores/walletModeStore';
import { pushUtilities } from 'learn-card-base/utils/pushUtilities';
import { getRandomBaseColor } from 'learn-card-base/helpers/colorHelpers';
import { getCurrentUserPrivateKey } from 'learn-card-base/helpers/privateKeyHelpers';
import {
    setPlatformPrivateKey,
    clearPlatformPrivateKey,
} from 'learn-card-base/security/platformPrivateKeyStorage';
import { clearAll as clearWebSecureAll } from 'learn-card-base/security/webSecureStorage';
import { unsetAuthToken, clearAuthServiceProvider } from 'learn-card-base/helpers/authHelpers';
import { clearAllIndexedDB } from 'learn-card-base/helpers/indexedDBHelpers';
import web3AuthStore from 'learn-card-base/stores/web3AuthStore';
import redirectStore from 'learn-card-base/stores/redirectStore';
import { chapiStore } from 'learn-card-base/stores/chapiStore';
import firstStartupStore from 'learn-card-base/stores/firstStartupStore';
import type { BespokeLearnCard } from 'learn-card-base/types/learn-card';

import { useQueryClient } from '@tanstack/react-query';

import {
    createSSSStrategy,
    generateEd25519PrivateKey,
    createAdaptiveStorage,
    isPublicComputerMode,
    isWebAuthnSupported,
} from '@learncard/sss-key-manager';
import type { RecoverySetupInput, RecoverySetupResult } from '@learncard/sss-key-manager';
import useSQLiteStorage from 'learn-card-base/hooks/useSQLiteStorage';
import { createNativeSSSStorage } from 'learn-card-base/security/nativeSSSStorage';

import { getBespokeLearnCard, getSigningLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { deriveDidKeyFromPrivateKey } from './didFromPrivateKey';
import { resolveMigrationKey } from './resolveMigrationKey';

// Firebase-specific auth provider / sign-in adapter registration lives in
// this seam so provider-agnostic code (this file) never imports the Firebase
// SDK directly. See `../auth/firebaseProviderInit` for what it registers.
import '../auth/firebaseProviderInit';

import {
    emitAuthDebugEvent,
    emitAuthSuccess,
    emitAuthError,
    type AuthDebugEventType,
} from '../components/debug/authDebugEvents';

import { RecoveryFlowModal } from '../components/recovery/RecoveryFlowModal';
import { clearAllPendingEscrowRecovery } from '../components/recovery/escrowRecoveryStorage';
import { useLocale } from '../i18n';
import { createPreAuthEmailPayload } from '../i18n/preAuthEmail';
import { clearStoragePreservingLocale } from '../i18n/storage';
import * as m from '../paraglide/messages.js';
import { RecoverySetupModal } from '../components/recovery/RecoverySetupModal';
import { peekResolvedTenantConfig } from '../config/bootstrapTenantConfig';
import { countConfiguredRecoveryMethods } from 'learn-card-base';
import ReAuthOverlay from '../components/auth/ReAuthOverlay';
import { EscrowRecoveryHoldBanner } from '../components/recovery/EscrowRecoveryHoldBanner';
import { RecoveryPinResetBanner } from '../components/recovery/RecoveryPinResetBanner';
import { PinSignInReviewSheet } from '../components/recovery/PinSignInReviewSheet';
import {
    RecoveryPinSetupOverlay,
    type RecoveryPinSetupReason,
} from '../components/recovery/RecoveryPinSetupOverlay';
import {
    SecureAccountFlow,
    SecureAccountSessionError,
} from '../components/recovery/SecureAccountFlow';
import {
    readRecoveryPinPromptFlag,
    writeRecoveryPinPromptFlag,
} from '../components/recovery/recoveryPinPromptFlag';
import {
    decidePinPromptAfterReady,
    settleEscrowRecoveryMarker,
    secureFlowOffersPin,
    pinChangePromptOpens,
    type EscrowRecoveryKind,
} from './authCoordinator.helpers';
import { createRecoveryPinActions } from './recoveryPinActions';

const log = getLogger('scouts/auth-coordinator');

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
                    setError(m['auth.noDeviceKey']());
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

                setError(e instanceof Error ? e.message : m['auth.keyFail']());
                setLoading(false);
            }
        };

        fetchShare();

        return () => {
            cancelled = true;
        };
    }, [keyDerivation]);

    if (loading) {
        return (
            <Overlay aria-label={m['auth.prepLink']()} onDismiss={onClose}>
                <div className="p-6 flex flex-col items-center">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-purple-600 rounded-full animate-spin mb-3" />
                    <p className="text-sm text-gray-500">{m['auth.prepLink']()}</p>
                </div>
            </Overlay>
        );
    }

    if (error || !deviceShare) {
        return (
            <Overlay aria-label={m['auth.noDeviceKey']()} onDismiss={onClose}>
                <div className="p-6 text-center">
                    <p className="text-sm text-red-600 mb-4">{error ?? m['auth.noDeviceKey']()}</p>

                    <button
                        onClick={onClose}
                        className="py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium text-sm"
                    >
                        {m['common.close']()}
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
                    log.warn('Camera permission denied');
                    return null;
                }
            }

            let resolveScan: (value: string | null) => void = () => undefined;
            const scanResult = new Promise<string | null>(resolve => {
                resolveScan = resolve;
            });
            const listener = await BarcodeScanner.addListener('barcodesScanned', async result => {
                await listener.remove();
                await BarcodeScanner.stopScan();
                resolveScan(result.barcodes[0]?.rawValue ?? null);
            });

            await BarcodeScanner.startScan({
                formats: [BarcodeFormat.QrCode],
                lensFacing: LensFacing.Back,
            });

            return scanResult;
        } catch (e) {
            log.warn('QR scan failed', e);
            await BarcodeScanner.removeAllListeners();
            await BarcodeScanner.stopScan();
            return null;
        }
    };

    return (
        <Overlay onDismiss={onClose}>
            <QrLoginApprover
                serverUrl={getSSSConfig().serverUrl}
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
//
// Firebase's auth provider factory and sign-in adapter factory are
// registered by the `../auth/firebaseProviderInit` side-effect import above,
// so this provider-agnostic file never imports the Firebase SDK directly.
// ---------------------------------------------------------------------------

registerKeyDerivationFactory('sss', () => {
    const sss = getSSSConfig();
    // Resolve the active tenant so the lca-api brands recovery / OTP emails for
    // ScoutPass (sent as `X-Tenant-Id`). The factory runs after
    // bootstrapTenantConfig() resolves; if it somehow hasn't, fall back to the
    // server's default tenant. Deliberately not a catch-all: a bare `catch {}`
    // here once hid a missing import and silently dropped the tenant.
    const tenant = peekResolvedTenantConfig() ?? undefined;

    return createSSSStrategy({
        serverUrl: sss.serverUrl,
        tenantId: tenant?.tenantId,
        escrowRelayPublicKey: sss.escrowRelayPublicKey,
        escrowRelayKeyId: sss.escrowRelayKeyId,
        // D21: seals `branding.name` as the enclave email brand if the tenant ever turns on
        // `auth.sss.escrowSealEmailBrand` (same wiring as learn-card-app).
        escrow: getTenantEscrowStrategyConfig(sss, tenant),
        onEscrowError: err => log.warn('escrow.enrollment.failed', err),
        onEscrowPinAutoCleared: event => log.warn('escrow.pin.auto_cleared', event),
        emailBranding: tenant?.email,
        // On native Capacitor (iOS/Android), use encrypted SQLite instead of
        // IndexedDB to avoid iOS WKWebView IndexedDB eviction issues.
        // On web, use adaptive storage that routes to sessionStorage when the
        // user has enabled "public computer" mode.
        storage: Capacitor.isNativePlatform() ? createNativeSSSStorage() : createAdaptiveStorage(),
        enableEmailBackupShare: sss.enableEmailBackupShare,
    });
});

/**
 * Escrow (7-day hold / PIN) recovery is configured for this tenant. OFF by default for
 * ScoutPass: with no escrow strategy config the recovery modal keeps its legacy picker.
 */
export const isEscrowRecoveryConfigured = (): boolean => {
    try {
        return !!getTenantEscrowStrategyConfig(
            getSSSConfig(),
            peekResolvedTenantConfig() ?? undefined
        );
    } catch {
        return false;
    }
};

/**
 * When the escrow enclave brands its emails as another app, tell the user who they will
 * hear from. `undefined` when the brands match (same as learn-card-app).
 */
const resolveEscrowEmailSender = (): EscrowEmailSenderNote | undefined => {
    try {
        return getEscrowEmailSender(peekResolvedTenantConfig() ?? {}, getSSSConfig());
    } catch {
        return undefined;
    }
};

registerKeyDerivationFactory('web3auth', () => {
    const { providerConfig } = getAuthConfig();
    const w3a = providerConfig.web3Auth ?? {};

    return createWeb3AuthStrategy({
        clientId: (w3a.clientId as string) ?? '',
        web3AuthNetwork: (w3a.network as string) ?? '',
        verifier: (w3a.verifierId as string) ?? '',
        chainConfig: w3a.rpcTarget ? { rpcTarget: w3a.rpcTarget as string } : undefined,
        isSessionCurrent: async uid => {
            const provider = resolveAuthProvider(getAuthConfig());
            if (!provider) return false;
            return (await provider.getCurrentUser())?.id === uid;
        },
    });
});

// ---------------------------------------------------------------------------
// Enriched App Auth Context
// ---------------------------------------------------------------------------

export interface AppAuthContextValue extends AuthCoordinatorContextValue {
    wallet: BespokeLearnCard | null;
    walletReady: boolean;
    isLoggedIn: boolean;
    lcnProfile: LCNVisibleProfile | null;
    lcnProfileLoading: boolean;
    hasLCNAccount: boolean;
    refetchLCNProfile: () => Promise<void>;
    showDeviceLinkModal: () => void;
    deviceLinkModalVisible: boolean;
    recoveryMethodCount: number | null;
    openRecoverySetup: () => void;
    /** Open "Secure my account": signs out every other device. Only shown while ready. */
    openSecureAccount: () => void;
    canUseAutomaticRecovery: boolean;
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
const AuthSessionManager: React.FC<{
    children: React.ReactNode;
    authProvider: AuthProvider | null;
}> = ({ children, authProvider }) => {
    const coordinator = useBaseAuthCoordinator();
    const { keyDerivation } = coordinator;
    const { presentToast } = useToast();
    const signInAdapter = useSignInAdapter();
    const queryClient = useQueryClient();
    const authConfig = getAuthConfig();
    const locale = useLocale();

    // --- Enriched state ---
    const [wallet, setWallet] = useState<BespokeLearnCard | null>(null);
    const [lcnProfile, setLcnProfile] = useState<LCNVisibleProfile | null>(null);
    const [lcnProfileLoading, setLcnProfileLoading] = useState(false);

    const walletInitRef = useRef(false);
    const walletInitGenerationRef = useRef(0);
    const walletInitIdentityRef = useRef<string | null>(null);

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
    }, [coordinator.state.status, signInAdapter]);

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
    // The open setup modal registers its guarded close so the backdrop can't skip a check.
    const recoveryRequestCloseRef = useRef<(() => void) | null>(null);
    const wasNewUserRef = useRef(false);

    // --- Proactive auth session check state (effect is below, after authProvider) ---
    const [recoverySessionValid, setRecoverySessionValid] = useState<boolean | null>(null);

    // --- Recovery method count (null = not yet checked) ---
    const [recoveryMethodCount, setRecoveryMethodCount] = useState<number | null>(null);
    const recoveryMethodReadRef = useRef(0);

    // Refresh from confirmed methods, including setups launched from the profile menu.
    // Reconfirming/replacing an existing type must not inflate the banner count.
    useEffect(() => {
        if (
            !coordinator.recoverySetupRevision ||
            coordinator.state.status !== 'ready' ||
            !authProvider
        )
            return;
        const strategy = coordinator.keyDerivation;
        if (!strategy.getAvailableRecoveryMethods) return;
        let cancelled = false;
        const readId = ++recoveryMethodReadRef.current;
        void (async () => {
            try {
                const token = await authProvider.getIdToken();
                const providerType = authProvider.getProviderType();
                const methods = await strategy.getAvailableRecoveryMethods!(token, providerType);
                const status = await strategy.fetchServerKeyStatus?.(token, providerType);
                if (!cancelled && readId === recoveryMethodReadRef.current) {
                    setRecoveryMethodCount(
                        countConfiguredRecoveryMethods(methods, status?.maskedRecoveryEmail)
                    );
                }
            } catch (error) {
                log.warn('Could not refresh recovery methods', error);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [
        coordinator.recoverySetupRevision,
        coordinator.state.status,
        coordinator.keyDerivation,
        authProvider,
    ]);

    // --- Phone→email upgrade gate ---
    // Phone-only users must link an email before proceeding, but only when:
    //   - The config flag requireEmailForPhoneUsers is true
    //   - Key derivation is SSS (Web3Auth doesn't need email for recovery)
    //   - Email backup share is enabled (the reason email is needed)
    //   - The coordinator has reached 'ready' (don't interfere with setup/migration)
    const [showEmailLinkGate, setShowEmailLinkGate] = useState(false);
    const emailLinkPhoneRef = useRef<string | null>(null);
    const emailUpgradeCompletedRef = useRef(false);
    const emailUpgradeCustomTokenRef = useRef<string | null>(null);

    useEffect(() => {
        if (emailUpgradeCompletedRef.current) return;

        if (coordinator.state.status !== 'ready') {
            setShowEmailLinkGate(false);
            return;
        }

        const sssConfig = getSSSConfig();

        if (
            !sssConfig.requireEmailForPhoneUsers ||
            !sssConfig.enableEmailBackupShare ||
            !keyDerivation.capabilities.contactMethodUpgrade
        ) {
            setShowEmailLinkGate(false);
            return;
        }

        const authUser = coordinator.state.authUser;

        if (authUser?.phone && !authUser?.email) {
            emailLinkPhoneRef.current = authUser.phone;
            setShowEmailLinkGate(true);
        } else {
            setShowEmailLinkGate(false);
        }
    }, [coordinator.state, authConfig, keyDerivation.capabilities.contactMethodUpgrade]);

    // --- Device link modal ---
    const [deviceLinkVisible, setDeviceLinkVisible] = useState(false);

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

    // --- Escrow / PIN (mirrors learn-card-app). Inert unless the tenant enables escrow
    // (`auth.sss.escrowEnclaveMode`) and the server reports it: the coordinator then
    // never publishes `escrowPin`, `escrowEnrollment`, `pinSignIn` or `pendingEscrowHold`.
    // Unlike wasNewUserRef (cleared after wallet setup), stays set for the whole
    // session so a new account is never also offered the returning-user prompt.
    const sawNeedsSetupRef = useRef(false);
    // Set when a PIN-based recovery just succeeded, proving the user had a PIN
    // even on a new/forgotten device where the local prompt flag is absent.
    const recoveredViaEscrowRef = useRef<EscrowRecoveryKind | null>(null);

    // "Secure my account" (post-PIN-sign-in review, settings, emailed link)
    const [secureAccountOpen, setSecureAccountOpen] = useState(false);
    const [secureAfterPinSignIn, setSecureAfterPinSignIn] = useState(false);
    const [secureNeedsNewPin, setSecureNeedsNewPin] = useState(false);
    const [secureSessionValid, setSecureSessionValid] = useState<boolean | null>(null);

    // PIN writes temporarily clear enrollment while refreshing server state. Retain
    // the last confirmed availability for this account so the settings card keeps
    // its pending/error state. A PIN sign-in itself also proves availability.
    const escrowAvailabilityRef = useRef<{ did: string; available: boolean } | null>(null);
    if (!isEscrowRecoveryConfigured() || coordinator.state.status !== 'ready') {
        escrowAvailabilityRef.current = null;
    } else {
        const { did, escrowEnrollment, pinSignIn } = coordinator.state;
        if (escrowEnrollment !== undefined) {
            escrowAvailabilityRef.current = { did, available: escrowEnrollment !== 'disabled' };
        } else if (pinSignIn) {
            escrowAvailabilityRef.current = { did, available: true };
        } else if (escrowAvailabilityRef.current?.did !== did) {
            escrowAvailabilityRef.current = null;
        }
    }
    const canUseAutomaticRecovery = escrowAvailabilityRef.current?.available === true;
    const openSecureAccount = useCallback(() => {
        if (canUseAutomaticRecovery) setSecureAccountOpen(true);
    }, [canUseAutomaticRecovery]);

    useEffect(() => {
        if (!secureAccountOpen) {
            setSecureAfterPinSignIn(false);
            setSecureNeedsNewPin(false);
        }
    }, [secureAccountOpen]);

    const [recoveryPinSetupReason, setRecoveryPinSetupReason] =
        useState<RecoveryPinSetupReason | null>(null);
    const [showRecoveryPinReset, setShowRecoveryPinReset] = useState(false);
    const readyDid = coordinator.state.status === 'ready' ? coordinator.state.did : undefined;
    const readyPinEnabled =
        coordinator.state.status === 'ready' ? coordinator.state.escrowPin?.enabled : undefined;
    const readyEnrollment =
        coordinator.state.status === 'ready' ? coordinator.state.escrowEnrollment : undefined;
    const readyPinResetRequired =
        coordinator.state.status === 'ready' && coordinator.state.escrowPinResetRequired === true;
    const readyPinSignIn =
        coordinator.state.status === 'ready' ? coordinator.state.pinSignIn : undefined;
    const readyPinChangeRequired =
        coordinator.state.status === 'ready' && coordinator.state.escrowPinChangeRequired === true;
    // "Choose a new PIN": latched so the prompt can show its own success step after
    // the coordinator clears `escrowPinChangeRequired`.
    const [pinChangeOpen, setPinChangeOpen] = useState(false);
    useEffect(() => {
        setPinChangeOpen(false);
    }, [readyDid]);
    useEffect(() => {
        if (
            pinChangePromptOpens({
                did: readyDid,
                changeRequired: readyPinChangeRequired,
                pinSignInPending: !!readyPinSignIn,
            })
        ) {
            setPinChangeOpen(true);
        }
    }, [readyDid, readyPinChangeRequired, readyPinSignIn]);
    useEffect(() => {
        if (secureAccountOpen) setPinChangeOpen(false);
    }, [secureAccountOpen]);
    // Once per DID per app start: a dismissal must not re-prompt on every refresh.
    const pinResetPromptedRef = useRef<string | null>(null);

    // Track whether the user went through needs_setup (new user flow)
    useEffect(() => {
        if (coordinator.state.status === 'needs_setup') {
            wasNewUserRef.current = true;
            sawNeedsSetupRef.current = true;
        }
    }, [coordinator.state.status]);

    useEffect(() => {
        const did = readyDid;
        if (!did) return;
        const flag = readRecoveryPinPromptFlag(did);

        // Never prompt a first-time setup for an account that already has a PIN.
        if (
            wasNewUserRef.current &&
            !flag &&
            readyEnrollment === 'enrolled' &&
            readyPinEnabled !== true
        ) {
            setRecoveryPinSetupReason('first-time');
        }

        const prompt = decidePinPromptAfterReady({
            recoveredVia: recoveredViaEscrowRef.current,
            pinEnabled: readyPinEnabled,
            enrollment: readyEnrollment,
            promptFlag: flag,
            pinResetRequired: readyPinResetRequired && pinResetPromptedRef.current !== did,
            newUserThisSession: sawNeedsSetupRef.current,
            pinSignInReview: !!readyPinSignIn,
        });
        // The review sheet renders from state; keep the marker until it is answered.
        if (prompt.kind === 'pin-sign-in-review') return;
        if (prompt.kind === 'pin-reset-required') {
            pinResetPromptedRef.current = did;
            setRecoveryPinSetupReason('pin-reset-required');
            recoveredViaEscrowRef.current = null;
        } else if (prompt.kind === 'after-recovery') {
            writeRecoveryPinPromptFlag(did, 'set');
            setRecoveryPinSetupReason('after-recovery');
            recoveredViaEscrowRef.current = null;
        } else if (prompt.kind === 'after-hold-recovery') {
            setRecoveryPinSetupReason('after-hold-recovery');
            recoveredViaEscrowRef.current = null;
        } else if (prompt.kind === 'first-time') {
            setRecoveryPinSetupReason(current => current ?? 'first-time');
        } else if (prompt.kind === 'reset-banner') {
            setShowRecoveryPinReset(true);
        }

        recoveredViaEscrowRef.current = settleEscrowRecoveryMarker(
            recoveredViaEscrowRef.current,
            readyPinEnabled
        );
    }, [
        coordinator.state.status,
        readyDid,
        readyPinEnabled,
        readyEnrollment,
        readyPinResetRequired,
        readyPinSignIn,
    ]);

    // --- Auth session check for "Secure my account" ---
    useEffect(() => {
        if (!secureAccountOpen || !authProvider) {
            setSecureSessionValid(null);
            return;
        }

        let cancelled = false;

        const check = async () => {
            if (await coordinator.refreshAuthSession()) {
                if (!cancelled) setSecureSessionValid(true);
                return;
            }
            try {
                await authProvider.getIdToken();
                if (!cancelled) setSecureSessionValid(true);
            } catch {
                if (!cancelled) setSecureSessionValid(false);
            }
        };

        check();

        return () => {
            cancelled = true;
        };
    }, [secureAccountOpen, authProvider, coordinator]);

    useEffect(() => {
        if (coordinator.state.status !== 'ready') setSecureAccountOpen(false);
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
                log.warn('QR login device share pickup failed', e);
            }
        };

        applyQrShare();
    }, [coordinator.state.status, coordinator, keyDerivation]);

    useEffect(() => {
        if (coordinator.state.status !== 'needs_recovery') {
            qrPickupAttemptedRef.current = false;
        }
    }, [coordinator.state.status]);

    // --- Proactive auth session check for recovery setup ---
    useEffect(() => {
        if (!showRecoverySetup || !authProvider) {
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
                    await authProvider.getIdToken();

                    if (!cancelled) setRecoverySessionValid(true);
                } catch {
                    if (!cancelled) setRecoverySessionValid(false);
                }
            }
        };

        check();

        return () => {
            cancelled = true;
        };
    }, [showRecoverySetup, authProvider, coordinator]);

    const didFromPrivateKey = useCallback(deriveDidKeyFromPrivateKey, []);

    // --- DID-Auth VP signing (for recovery setup write ops) ---
    const signDidAuthVp = useCallback(
        async (privateKey: string, challenge?: string): Promise<string> => {
            try {
                const lc = await getSigningLearnCard(privateKey);

                const vpJwt = await lc.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });

                if (!vpJwt || typeof vpJwt !== 'string') {
                    log.error('[signDidAuthVp] getDidAuthVp returned non-string', {
                        type: typeof vpJwt,
                    });
                    throw new Error('Failed to sign DID-Auth VP JWT');
                }

                return vpJwt;
            } catch (e) {
                log.error('[signDidAuthVp] error', e);
                throw e instanceof Error ? e : new Error(String(e));
            }
        },
        []
    );

    // --- Web3Auth key extraction for migration ---
    const migrationKeyFetchedRef = useRef(false);
    const migrationAttemptRef = useRef(0);
    const migrationCoordinatorRef = useRef(coordinator);
    migrationCoordinatorRef.current = coordinator;

    useEffect(() => {
        if (coordinator.state.status !== 'needs_migration' || migrationKeyFetchedRef.current)
            return;
        if (!authProvider) return;

        const migrationData = coordinator.state.migrationData ?? {};
        if (migrationData.web3AuthKey) return;

        migrationKeyFetchedRef.current = true;
        const migrationAttempt = migrationAttemptRef.current;
        const migrationUserId = coordinator.state.authUser?.id;
        const isCurrentAttempt = (): boolean => {
            const latestState = migrationCoordinatorRef.current.state;
            return (
                migrationAttemptRef.current === migrationAttempt &&
                latestState.status === 'needs_migration' &&
                latestState.authUser?.id === migrationUserId
            );
        };
        const canFallBack = migrationData.provisionalRederive === true;

        if (canFallBack && window.sessionStorage.getItem('qr_login_device_share')) {
            coordinator.fallBackToRecovery();
            return;
        }

        const fallBack = (): void => {
            if (canFallBack && isCurrentAttempt()) {
                migrationCoordinatorRef.current.fallBackToRecovery();
            }
        };

        const deriveLegacyKey = async (): Promise<string | null> => {
            const w3a = authConfig.providerConfig.web3Auth ?? {};
            // Preserve each app's existing token refresh policy, including
            // native token retrieval through the provider abstraction.
            const token = await authProvider.getIdToken(false);
            if (!token) return null;

            return deriveWeb3AuthKey(
                {
                    clientId: (w3a.clientId as string) ?? '',
                    web3AuthNetwork: (w3a.network as string) ?? '',
                    verifier: (w3a.verifierId as string) ?? '',
                    usePnPKey: true,
                    chainConfig: {
                        rpcTarget: (w3a.rpcTarget as string) ?? 'https://rpc.ankr.com/eth',
                    },
                    isSessionCurrent: async uid => {
                        const provider = resolveAuthProvider(getAuthConfig());
                        if (!provider) return false;
                        return (await provider.getCurrentUser())?.id === uid;
                    },
                },
                token
            );
        };

        const extractAndInject = async (): Promise<void> => {
            try {
                emitAuthDebugEvent('web3auth:migration_key', 'Extracting account upgrade key');
                const resolved = await resolveMigrationKey({
                    fetchArchivedKey: async () => {
                        if (!coordinator.keyDerivation.fetchArchivedKey) return null;
                        const token = await authProvider.getIdToken(true);
                        return coordinator.keyDerivation.fetchArchivedKey(
                            token,
                            authProvider.getProviderType()
                        );
                    },
                    deriveLegacyKey,
                    getExistingExpectedDid: () => {
                        const latestState = migrationCoordinatorRef.current.state;
                        const expectedDid =
                            latestState.status === 'needs_migration'
                                ? latestState.migrationData?.expectedDid
                                : undefined;
                        return typeof expectedDid === 'string' ? expectedDid : undefined;
                    },
                    isCurrentAttempt,
                });
                if (!resolved) {
                    if (!isCurrentAttempt()) return;
                    emitAuthError('web3auth:migration_key', 'No sign-in session available');
                    fallBack();
                    return;
                }

                // A sign-out or completed upgrade may occur while this tab waits.
                const latestCoordinator = migrationCoordinatorRef.current;
                if (!isCurrentAttempt()) return;
                if (resolved.source === 'archive') {
                    emitAuthSuccess('web3auth:migration_key', 'Account upgrade key restored');
                    latestCoordinator.setMigrationData({
                        web3AuthKey: resolved.privateKey,
                        source: 'archive',
                        expectedDid: resolved.expectedDid,
                    });
                    return;
                }
                emitAuthSuccess('web3auth:migration_key', 'Account upgrade key extracted');
                latestCoordinator.setMigrationData({
                    web3AuthKey: resolved.privateKey,
                    source: 'derived',
                });
            } catch (error) {
                // Provider and Torus errors can embed credentials. Shared strategy
                // diagnostics retain safe outcome metadata; never forward raw errors.
                emitAuthError('web3auth:migration_key', 'Could not prepare account upgrade');
                if (isCurrentAttempt()) {
                    migrationCoordinatorRef.current.handleMigrationKeyError(error);
                }
            }
        };

        extractAndInject();
    }, [coordinator.state.status, authProvider, authConfig, coordinator]);

    useEffect(() => {
        if (coordinator.state.status !== 'needs_migration') {
            migrationKeyFetchedRef.current = false;
            migrationAttemptRef.current += 1;
        }
    }, [coordinator.state.status]);

    useAuthCoordinatorAutoSetup(coordinator, {
        generatePrivateKey: generateEd25519PrivateKey,
        didFromPrivateKey,

        onReady: (_privateKey, did) => {
            emitAuthSuccess(
                'auth:coordinator_ready',
                `Coordinator ready — DID: ${did.slice(0, 30)}...`
            );
        },

        onError: error => {
            emitAuthError('auth:coordinator_error', `Auto-setup failed: ${error}`);
        },
    });

    // --- Wallet initialization when coordinator reaches 'ready' ---
    const walletAuthStateRef = useRef(coordinator.state);
    useEffect(() => {
        walletAuthStateRef.current = coordinator.state;
        const identity = coordinator.state.status === 'ready' ? coordinator.state.privateKey : null;
        if (walletInitIdentityRef.current !== identity) {
            walletInitIdentityRef.current = identity;
            // Invalidate pending work even if it has not published a wallet yet.
            // Generation ownership also prevents an old failure resetting a new init.
            walletInitGenerationRef.current += 1;
            walletInitRef.current = false;
        }
    }, [coordinator.state]);
    useEffect(
        () => () => {
            walletInitGenerationRef.current += 1;
            walletInitRef.current = false;
            walletInitIdentityRef.current = null;
        },
        []
    );

    useEffect(() => {
        if (coordinator.state.status !== 'ready' || walletInitRef.current) return;

        // Block wallet init until phone-only user has linked an email
        if (showEmailLinkGate) return;

        const { privateKey, did } = coordinator.state;
        const generation = ++walletInitGenerationRef.current;
        const isStale = (): boolean => {
            const latest = walletAuthStateRef.current;
            return (
                walletInitGenerationRef.current !== generation ||
                latest.status !== 'ready' ||
                latest.privateKey !== privateKey
            );
        };

        walletInitRef.current = true;

        const initializeWallet = async () => {
            try {
                const newWallet = await getBespokeLearnCard(privateKey);
                if (isStale()) return;

                if (!newWallet) {
                    log.error('Failed to initialize wallet from private key');
                    walletInitRef.current = false;
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
                        log.warn('Failed to persist private key to secure storage', e);
                    }
                }

                if (isStale()) return;
                const authUser =
                    coordinator.state.status === 'ready' ? coordinator.state.authUser : undefined;

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
                    log.warn('Push token sync failed', e);
                }
                if (isStale()) return;

                setWallet(newWallet);
                walletModeStore.set.mode('full');

                emitAuthSuccess(
                    'auth:wallet_ready',
                    `Wallet initialized — DID: ${did.slice(0, 30)}...`
                );

                // Check recovery methods for all users
                // (only relevant for strategies that support recovery)
                if (
                    keyDerivation.capabilities.recovery &&
                    authProvider &&
                    keyDerivation.getAvailableRecoveryMethods
                ) {
                    wasNewUserRef.current = false;
                    const readId = ++recoveryMethodReadRef.current;

                    try {
                        const token = await authProvider.getIdToken();
                        const providerType = authProvider.getProviderType();
                        const methods = await keyDerivation.getAvailableRecoveryMethods(
                            token,
                            providerType
                        );

                        const status = await keyDerivation.fetchServerKeyStatus?.(
                            token,
                            providerType
                        );
                        const userConfiguredCount = countConfiguredRecoveryMethods(
                            methods,
                            status?.maskedRecoveryEmail
                        );

                        if (isStale() || readId !== recoveryMethodReadRef.current) return;
                        setRecoveryMethodCount(userConfiguredCount);

                        // Show recovery setup modal only on public computers
                        // where no recovery methods exist. For new users on
                        // personal devices, the RecoveryBanner on the LaunchPad
                        // provides a non-blocking nudge instead.
                        if (userConfiguredCount === 0 && isPublicComputerMode()) {
                            setShowRecoverySetup(true);
                        }
                    } catch {
                        // Non-critical — don't block the user
                    }
                }
            } catch (e) {
                log.error('Wallet initialization failed', e);
                if (!isStale()) walletInitRef.current = false;
            }
        };

        initializeWallet();
    }, [coordinator.state, authProvider, keyDerivation, showEmailLinkGate]);

    // --- Reset wallet when coordinator leaves 'ready' ---
    useEffect(() => {
        if (coordinator.state.status !== 'ready' && wallet) {
            setWallet(null);
            setLcnProfile(null);
            setRecoveryMethodCount(null);
            recoveryMethodReadRef.current += 1;
            walletModeStore.set.mode(null);
        }
    }, [coordinator.state.status, wallet]);

    // A confirmed session loss clears account state in every open tab. Keep
    // ordinary anonymous/seeded startup separate from that logout transition.
    const hasLiveAuthUser = useCallback(
        () => Boolean(signInAdapter.getCurrentUser()),
        [signInAdapter]
    );
    const clearCachedAccount = useCallback(() => {
        authUserStore.set.setUser(null);
        authStore.set.typeOfLogin(null);
        currentUserStore.set.currentUser(null);
        currentUserStore.set.currentUserPK(null);
        currentUserStore.set.currentUserIsLoggedIn(false);
        walletStore.set.wallet(null);
        walletModeStore.set.mode(null);
        web3AuthStore.set.web3Auth(null);
        web3AuthStore.set.provider(null);
        unsetAuthToken();
    }, []);
    const clearAccountQueries = useCallback(() => queryClient.clear(), [queryClient]);
    useIdleAuthCleanup({
        status: coordinator.state.status,
        hasEndedAuthSession: coordinator.hasEndedAuthSession ?? false,
        hasStoredAuthUser: Boolean(authUserStore.get.currentUser()?.id),
        hasLiveAuthUser,
        clearCachedAccount,
        clearAccountQueries,
    });

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
            log.warn('LCN profile fetch failed', e);
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

        return coordinator.state.recoveryMethods.map(method => ({
            type: method.type,
            credentialId: method.credentialId,
            createdAt:
                method.createdAt instanceof Date
                    ? method.createdAt.toISOString()
                    : String(method.createdAt),
        }));
    }, [coordinator.state]);

    // --- Determine which overlay (if any) to show ---
    const { status } = coordinator.state;

    const showRecovery = status === 'needs_recovery' && !!authProvider;

    // Tenant config is fixed after bootstrap: resolve once per open recovery overlay so the
    // modal is not handed a new object every render.
    const escrowRecoveryEnabled = useMemo(
        () => (showRecovery ? isEscrowRecoveryConfigured() : false),
        [showRecovery]
    );
    const escrowEmailSender = useMemo(
        () => (showRecovery && escrowRecoveryEnabled ? resolveEscrowEmailSender() : undefined),
        [showRecovery, escrowRecoveryEnabled]
    );

    const showMigrationLoading = status === 'needs_migration' && !migrationStallVisible;

    const showStalledMigration =
        migrationStallVisible &&
        status === 'needs_migration' &&
        !(
            coordinator.state.status === 'needs_migration' &&
            coordinator.state.migrationData?.web3AuthKey
        );

    const showError = status === 'error';

    // --- Build enriched context value ---
    const walletReady = !!wallet;
    const isLoggedIn = walletReady;
    const hasLCNAccount = !!lcnProfile;

    const showDeviceLinkModal = useCallback(() => {
        setDeviceLinkVisible(true);
    }, []);

    const { setEscrowPin, clearEscrowPin } = useMemo(
        () =>
            createRecoveryPinActions(
                {
                    runRecoverySetup: coordinator.runRecoverySetup,
                    resetRecoverySetup: coordinator.resetRecoverySetup,
                    setEscrowPin: coordinator.setEscrowPin,
                    clearEscrowPin: coordinator.clearEscrowPin,
                },
                readyDid,
                () => {
                    recoveredViaEscrowRef.current = null;
                }
            ),
        [
            coordinator.runRecoverySetup,
            coordinator.resetRecoverySetup,
            coordinator.setEscrowPin,
            coordinator.clearEscrowPin,
            readyDid,
        ]
    );

    const enrichedValue: AppAuthContextValue = useMemo(
        () => ({
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
            openSecureAccount,
            canUseAutomaticRecovery,
            setEscrowPin,
            clearEscrowPin,
            authProvider: authProvider,
        }),
        [
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
            openSecureAccount,
            canUseAutomaticRecovery,
            setEscrowPin,
            clearEscrowPin,
            authProvider,
        ]
    );

    return (
        <AppAuthContext.Provider value={enrichedValue}>
            {children}
            {coordinator.state.status === 'ready' &&
                (coordinator.state.pendingEscrowHold || showRecoveryPinReset) && (
                    <div
                        className="fixed inset-x-4 z-[10000] max-w-md mx-auto space-y-v3-2"
                        style={{
                            top: 'calc(1.5rem + var(--lc-overlay-inset-top, var(--ion-safe-area-top, 0px)))',
                        }}
                    >
                        {coordinator.state.pendingEscrowHold && (
                            <EscrowRecoveryHoldBanner
                                key={coordinator.state.pendingEscrowHold.holdId}
                                requestedAt={coordinator.state.pendingEscrowHold.requestedAt}
                                releaseAfter={coordinator.state.pendingEscrowHold.releaseAfter}
                                onCancel={coordinator.cancelEscrowRecovery}
                            />
                        )}
                        {showRecoveryPinReset && (
                            <RecoveryPinResetBanner
                                onSetAgain={() => {
                                    setShowRecoveryPinReset(false);
                                    setRecoveryPinSetupReason('after-recovery');
                                }}
                                onDismiss={() => {
                                    if (!readyDid) return;
                                    writeRecoveryPinPromptFlag(readyDid, 'skipped');
                                    setShowRecoveryPinReset(false);
                                }}
                            />
                        )}
                    </div>
                )}

            {/* ── Post-PIN-sign-in review (once; before any PIN prompt) ── */}
            {coordinator.state.status === 'ready' &&
                coordinator.state.pinSignIn &&
                !secureAccountOpen && (
                    <PinSignInReviewSheet
                        priorWrongAttempts={coordinator.state.pinSignIn.priorWrongAttempts}
                        newPinRequired={coordinator.state.pinSignIn.newPinRequired}
                        onFine={coordinator.acknowledgePinSignIn}
                        onChooseNewPin={() => {
                            coordinator.acknowledgePinSignIn();
                            setPinChangeOpen(true);
                        }}
                        onSecure={() => {
                            const needsNewPin =
                                coordinator.state.status === 'ready' &&
                                coordinator.state.pinSignIn?.newPinRequired === true;
                            coordinator.acknowledgePinSignIn();
                            setSecureAfterPinSignIn(true);
                            setSecureNeedsNewPin(needsNewPin);
                            openSecureAccount();
                        }}
                    />
                )}

            {/* ── Secure my account / sign out of all other devices ── */}
            {secureAccountOpen &&
                authProvider &&
                coordinator.state.status === 'ready' &&
                (secureSessionValid === null ? (
                    <Overlay
                        aria-label={m['recovery.verifyingSession']()}
                        onDismiss={() => setSecureAccountOpen(false)}
                    >
                        <div className="p-8 flex flex-col items-center">
                            <div className="w-8 h-8 border-2 border-grayscale-200 border-t-emerald-600 rounded-full animate-spin mb-3" />
                            <p className="text-sm text-grayscale-500">
                                {m['recovery.verifyingSession']()}
                            </p>
                        </div>
                    </Overlay>
                ) : secureSessionValid === false ? (
                    <Overlay onDismiss={() => setSecureAccountOpen(false)}>
                        <ReAuthOverlay
                            onSuccess={() => setSecureSessionValid(true)}
                            onCancel={() => setSecureAccountOpen(false)}
                        />
                    </Overlay>
                ) : (
                    <SecureAccountFlow
                        hasPin={secureFlowOffersPin({
                            afterPinSignIn: secureAfterPinSignIn,
                            pinEnabled: coordinator.state.escrowPin?.enabled,
                            escrowEnrollment: coordinator.state.escrowEnrollment,
                        })}
                        newPinRequired={
                            secureNeedsNewPin || coordinator.state.escrowPinChangeRequired === true
                        }
                        passkeyAvailable={!Capacitor.isNativePlatform() && isWebAuthnSupported()}
                        onSecure={async pin => {
                            if (
                                !coordinator.authSessionValid &&
                                !(await coordinator.refreshAuthSession())
                            ) {
                                throw new SecureAccountSessionError();
                            }
                            // A deliberate revoke supersedes any post-recovery PIN prompt.
                            recoveredViaEscrowRef.current = null;
                            const result = await coordinator.secureAccount({ pin });
                            if (readyDid) {
                                writeRecoveryPinPromptFlag(
                                    readyDid,
                                    pin !== null && result.pinKept ? 'set' : 'skipped'
                                );
                            }
                            return result;
                        }}
                        onSetUpRecovery={() => {
                            setSecureAccountOpen(false);
                            setShowRecoverySetup(true);
                        }}
                        onClose={() => setSecureAccountOpen(false)}
                    />
                ))}

            {/* ── Choose a new PIN (wrong entries recorded against the current PIN) ── */}
            {pinChangeOpen &&
                !recoveryPinSetupReason &&
                coordinator.state.status === 'ready' &&
                !coordinator.state.pinSignIn &&
                !secureAccountOpen && (
                    <RecoveryPinSetupOverlay
                        setPin={setEscrowPin}
                        reason="new-pin-required"
                        onComplete={() => setPinChangeOpen(false)}
                        onSkip={() => {
                            coordinator.dismissEscrowPinChange();
                            setPinChangeOpen(false);
                        }}
                    />
                )}

            {recoveryPinSetupReason &&
                coordinator.state.status === 'ready' &&
                !coordinator.state.pinSignIn &&
                !secureAccountOpen && (
                    <RecoveryPinSetupOverlay
                        setPin={setEscrowPin}
                        reason={recoveryPinSetupReason}
                        onComplete={() => {
                            if (!readyDid) return;
                            writeRecoveryPinPromptFlag(readyDid, 'set');
                            setRecoveryPinSetupReason(null);
                        }}
                        onSkip={() => {
                            if (!readyDid) return;
                            writeRecoveryPinPromptFlag(readyDid, 'skipped');
                            setRecoveryPinSetupReason(null);
                        }}
                    />
                )}

            {/* ── Recovery overlay ─────────────────────────────── */}
            {showRecovery && authProvider && (
                <RecoveryFlowModal
                    escrowRecovery={
                        escrowRecoveryEnabled
                            ? {
                                  pinAvailable:
                                      coordinator.state.status === 'needs_recovery' &&
                                      coordinator.state.escrowPin?.enabled === true,
                                  scope: JSON.stringify([
                                      getSSSConfig().serverUrl,
                                      coordinator.state.status === 'needs_recovery'
                                          ? coordinator.state.authUser.id
                                          : undefined,
                                  ]),
                                  emailSender: escrowEmailSender,
                                  // The shared coordinator type leaves `releasePolicy`
                                  // optional; a started recovery is always a 7-day hold.
                                  onStart: async options => {
                                      const started =
                                          await coordinator.startEscrowRecovery(options);
                                      return {
                                          ...started,
                                          releasePolicy: started.releasePolicy ?? 'hold',
                                      };
                                  },
                                  onStatus: coordinator.getEscrowRecoveryStatus,
                                  onConfirmCode: coordinator.confirmEscrowRecovery,
                                  onResendCode: coordinator.resendEscrowRecoveryCode,
                                  onRecover: async input => {
                                      // Mark before `ready` renders: the first published PIN
                                      // status consumes the marker, so it must not be set
                                      // after that ready render has run.
                                      const previous = recoveredViaEscrowRef.current;
                                      if (input.method === 'escrow-pin') {
                                          recoveredViaEscrowRef.current = 'pin';
                                      } else if (input.method === 'escrow') {
                                          recoveredViaEscrowRef.current = 'hold';
                                      }
                                      try {
                                          await coordinator.recover(input);
                                      } catch (error) {
                                          recoveredViaEscrowRef.current = previous;
                                          throw error;
                                      }
                                  },
                                  canResumeCompleted: () =>
                                      coordinator.keyDerivation.hasPendingIdentityRecovery?.() ??
                                      false,
                              }
                            : undefined
                    }
                    availableMethods={availableMethods}
                    recoveryReason={
                        coordinator.state.status === 'needs_recovery'
                            ? coordinator.state.recoveryReason
                            : undefined
                    }
                    maskedRecoveryEmail={
                        coordinator.state.status === 'needs_recovery'
                            ? coordinator.state.maskedRecoveryEmail
                            : null
                    }
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
                            log.debug('[Recovery via Device] storing shareVersion', {
                                shareVersion,
                            });
                            await keyDerivation.storeLocalShareVersion?.(shareVersion);
                        } else {
                            log.warn(
                                '[Recovery via Device] no shareVersion received from approver device'
                            );
                        }

                        await coordinator.initialize();
                    }}
                    onCancel={handleLogout}
                />
            )}

            {/* ── Phone→email upgrade gate ─────────────────────── */}
            {showEmailLinkGate && (
                <EmailLinkOverlay
                    onSendCode={async (email: string) => {
                        const { serverUrl } = getSSSConfig();

                        const res = await fetch(`${serverUrl}/send-login-verification-code`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(createPreAuthEmailPayload(email, locale)),
                        });

                        const data = await res.json().catch(() => ({}));

                        if (!data.success) {
                            throw new Error(
                                data.error || 'Failed to send verification code. Please try again.'
                            );
                        }
                    }}
                    onVerifyCode={async (email: string, code: string) => {
                        if (!keyDerivation.upgradeContactMethod) {
                            throw new Error(
                                'Contact method upgrade is not supported by the current key derivation strategy.'
                            );
                        }

                        if (!authProvider) {
                            throw new Error('No auth provider available.');
                        }

                        const token = await authProvider.getIdToken();

                        const result = await keyDerivation.upgradeContactMethod(
                            token,
                            authProvider.getProviderType(),
                            emailLinkPhoneRef.current ?? '',
                            email,
                            code
                        );

                        // Server returns a custom token because updateUser()
                        // invalidates the client session. Stash it so
                        // onComplete can re-authenticate before proceeding.
                        const customToken =
                            result && typeof result === 'object' ? result.customToken : undefined;

                        if (customToken) {
                            emailUpgradeCustomTokenRef.current = customToken;
                        }
                    }}
                    onComplete={async () => {
                        emailUpgradeCompletedRef.current = true;

                        // Re-authenticate with the custom token issued by the
                        // server after the account change. This restores the
                        // client session that was invalidated by the email update.
                        const customToken = emailUpgradeCustomTokenRef.current;
                        let freshUser = authProvider ? await authProvider.getCurrentUser() : null;

                        if (customToken && authProvider?.reauthenticateWithToken) {
                            freshUser = await authProvider.reauthenticateWithToken(customToken);

                            emailUpgradeCustomTokenRef.current = null;
                        }

                        // Update the generic auth store with the refreshed user.
                        if (freshUser) {
                            authUserStore.set.setUser(freshUser);
                        }

                        // Re-split the key so all three shares (device, auth,
                        // email) come from the same polynomial. Then store the
                        // new device + auth shares and send the email share.
                        const newEmail = freshUser?.email;

                        if (
                            newEmail &&
                            authProvider &&
                            coordinator.state.status === 'ready' &&
                            keyDerivation.sendEmailBackupShare
                        ) {
                            try {
                                const freshToken = await authProvider.getIdToken();
                                const pk = coordinator.state.privateKey;
                                const did = coordinator.state.did;
                                if (keyDerivation.atomicUpdateShares) {
                                    await keyDerivation.atomicUpdateShares({
                                        token: freshToken,
                                        providerType: authProvider.getProviderType(),
                                        privateKey: pk,
                                        did,
                                        signDidAuthVp,
                                    });
                                } else {
                                    const vpJwt = await signDidAuthVp(pk);
                                    const { localKey, remoteKey } =
                                        await keyDerivation.splitKey(pk);

                                    await keyDerivation.storeLocalKey(localKey);
                                    await keyDerivation.storeAuthShare(
                                        freshToken,
                                        authProvider.getProviderType(),
                                        remoteKey,
                                        did,
                                        vpJwt
                                    );
                                }

                                await keyDerivation.sendEmailBackupShare(
                                    freshToken,
                                    authProvider.getProviderType(),
                                    pk,
                                    newEmail
                                );
                            } catch (e) {
                                log.warn('Email backup share after upgrade failed (non-fatal)', e);
                                presentToast(m['error.generic'](), {
                                    type: ToastTypeEnum.Error,
                                    hasDismissButton: true,
                                });
                            }
                        }

                        setShowEmailLinkGate(false);
                    }}
                    onLogout={handleLogout}
                />
            )}

            {/* ── Migration in-progress overlay ──────────────────── */}
            {showMigrationLoading && (
                <Overlay>
                    <div className="p-8 text-center space-y-v3-5">
                        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-50 flex items-center justify-center">
                            <div className="w-7 h-7 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
                        </div>

                        <div className="space-y-v3-2">
                            <h2 className="text-xl font-semibold text-grayscale-900">
                                {m['auth.upgradeAcct']()}
                            </h2>

                            <p className="text-sm text-grayscale-600 leading-relaxed">
                                {m['auth.upgradeDesc']()}
                            </p>
                        </div>
                    </div>
                </Overlay>
            )}

            {/* ── Stalled migration overlay ────────────────────── */}
            {showStalledMigration && (
                <StalledMigrationOverlay onRetry={handleReinitialize} onLogout={handleLogout} />
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
                    accountHint={
                        coordinator.state.authUser?.email || coordinator.state.authUser?.phone
                    }
                    onClose={() => setDeviceLinkVisible(false)}
                />
            )}

            {/* ── Recovery setup prompt (new users) ───────────── */}
            {showRecoverySetup &&
                authProvider &&
                coordinator.state.status === 'ready' &&
                keyDerivation.setupRecoveryMethod &&
                (() => {
                    // Session check still in progress — show loading
                    if (recoverySessionValid === null) {
                        return (
                            <Overlay
                                aria-label={m['auth.verifySess']()}
                                onDismiss={() => setShowRecoverySetup(false)}
                            >
                                <div className="p-8 flex flex-col items-center">
                                    <div className="w-8 h-8 border-2 border-grayscale-200 border-t-emerald-600 rounded-full animate-spin mb-3" />
                                    <p className="text-sm text-grayscale-500">
                                        {m['auth.verifySess']()}
                                    </p>
                                </div>
                            </Overlay>
                        );
                    }

                    // Session expired — show in-place re-auth overlay
                    if (recoverySessionValid === false) {
                        return (
                            <Overlay onDismiss={() => setShowRecoverySetup(false)}>
                                <ReAuthOverlay
                                    onSuccess={() => setRecoverySessionValid(true)}
                                    onCancel={() => setShowRecoverySetup(false)}
                                />
                            </Overlay>
                        );
                    }

                    // Session valid — show the recovery setup modal
                    const { serverUrl } = getSSSConfig();
                    const currentPrivateKey =
                        coordinator.state.status === 'ready' ? coordinator.state.privateKey : '';

                    const setupMethod = async (
                        input: RecoverySetupInput,
                        authUser?: {
                            id: string;
                            email?: string;
                            phone?: string;
                            providerType: string;
                        } | null
                    ): Promise<RecoverySetupResult> => {
                        log.debug('[setupMethod] starting', {
                            privateKeyLength: currentPrivateKey?.length,
                            method: input.method,
                        });

                        let token: string;

                        try {
                            token = await authProvider.getIdToken();
                        } catch {
                            throw new Error(
                                'Your session has expired. Please close this dialog and sign in again.'
                            );
                        }

                        const providerType = authProvider.getProviderType();

                        log.debug('[setupMethod] got token, calling setupRecoveryMethod', {
                            providerType,
                        });

                        if (input.method !== 'passkey')
                            coordinator.resetRecoverySetup(input.method);

                        return keyDerivation.setupRecoveryMethod!({
                            token,
                            providerType,
                            privateKey: currentPrivateKey,
                            input,
                            authUser: authUser ?? undefined,
                            signDidAuthVp,
                        }) as Promise<RecoverySetupResult>;
                    };

                    const confirmMethod = async (
                        input: import('@learncard/sss-key-manager').RecoveryConfirmationInput
                    ) => {
                        if (!keyDerivation.confirmRecoveryMethod) {
                            throw new Error('Recovery confirmation is unavailable.');
                        }

                        const token = await authProvider.getIdToken();
                        const providerType = authProvider.getProviderType();

                        await coordinator.runRecoverySetup(input.method, () =>
                            keyDerivation.confirmRecoveryMethod!({
                                token,
                                providerType,
                                privateKey: currentPrivateKey,
                                input,
                                signDidAuthVp,
                            })
                        );
                    };

                    const getTokenAndProvider = async () => {
                        const token = await authProvider.getIdToken();
                        const providerType = authProvider.getProviderType();
                        return { token, providerType };
                    };

                    const getDidAuthHeaders = async (): Promise<Record<string, string>> => {
                        const did = await didFromPrivateKey(currentPrivateKey);
                        const vpJwt = keyDerivation.getFreshDidAuthVp
                            ? await keyDerivation.getFreshDidAuthVp(
                                  currentPrivateKey,
                                  did,
                                  signDidAuthVp
                              )
                            : await signDidAuthVp(currentPrivateKey);

                        return {
                            'Content-Type': 'application/json',
                            ...(vpJwt ? { Authorization: `Bearer ${vpJwt}` } : {}),
                        };
                    };

                    return (
                        <Overlay
                            onDismiss={() =>
                                recoveryRequestCloseRef.current
                                    ? recoveryRequestCloseRef.current()
                                    : setShowRecoverySetup(false)
                            }
                        >
                            <RecoverySetupModal
                                automaticRecovery={
                                    canUseAutomaticRecovery
                                        ? {
                                              onGetEscrowEnrollmentState:
                                                  coordinator.getEscrowEnrollmentState,
                                              onDisableEscrowRecovery:
                                                  coordinator.disableEscrowRecovery,
                                              onEnableEscrowRecovery:
                                                  coordinator.enableEscrowRecovery,
                                              onSetEscrowPin: setEscrowPin,
                                              onClearEscrowPin: clearEscrowPin,
                                          }
                                        : undefined
                                }
                                onSecureAccount={
                                    canUseAutomaticRecovery
                                        ? () => {
                                              setShowRecoverySetup(false);
                                              openSecureAccount();
                                          }
                                        : undefined
                                }
                                registerCloseRequest={fn => {
                                    recoveryRequestCloseRef.current = fn;
                                }}
                                emailAvailable={isEmailRelayConfigured()}
                                existingMethods={[]}
                                maskedRecoveryEmail={null}
                                isActivationPending={coordinator.needsActivation}
                                onCompleted={() => setShowRecoverySetup(false)}
                                onSetupPasskey={async () => {
                                    const authUser = await authProvider.getCurrentUser();
                                    const result = await coordinator.runRecoverySetup(
                                        'passkey',
                                        () => setupMethod({ method: 'passkey' }, authUser)
                                    );
                                    return result.method === 'passkey' ? result.credentialId : '';
                                }}
                                onGeneratePhrase={async () => {
                                    const authUser = await authProvider.getCurrentUser();
                                    const result = await setupMethod(
                                        { method: 'phrase' },
                                        authUser
                                    );
                                    if (result.method !== 'phrase') {
                                        throw new Error('Could not generate recovery words.');
                                    }

                                    return {
                                        phrase: result.phrase,
                                        challengeWordIndices: result.challengeWordIndices,
                                        challengeWordOptions: result.challengeWordOptions,
                                    };
                                }}
                                onConfirmPhrase={async challengeWords => {
                                    await confirmMethod({ method: 'phrase', challengeWords });
                                }}
                                onSetupBackup={async (backupPw: string) => {
                                    const authUser = await authProvider.getCurrentUser();
                                    const did =
                                        coordinator.state.status === 'ready'
                                            ? coordinator.state.did
                                            : '';
                                    const result = await setupMethod(
                                        { method: 'backup', password: backupPw, did },
                                        authUser
                                    );

                                    return result.method === 'backup'
                                        ? JSON.stringify(result.backupFile, null, 2)
                                        : '';
                                }}
                                onConfirmBackup={async (fileContents, password) => {
                                    await confirmMethod({
                                        method: 'backup',
                                        fileContents,
                                        password,
                                    });
                                }}
                                onAddRecoveryEmail={async (email: string) => {
                                    const { token, providerType } = await getTokenAndProvider();
                                    const headers = await getDidAuthHeaders();

                                    const res = await fetch(
                                        `${serverUrl}/keys/recovery-email/add`,
                                        {
                                            method: 'POST',
                                            headers,
                                            body: JSON.stringify({
                                                authToken: token,
                                                providerType,
                                                email,
                                            }),
                                        }
                                    );

                                    if (!res.ok) {
                                        const data = await res.json().catch(() => ({}));
                                        throw new Error(
                                            data?.message || 'Failed to send verification code.'
                                        );
                                    }
                                }}
                                onVerifyRecoveryEmail={async (code: string) => {
                                    const { token, providerType } = await getTokenAndProvider();
                                    const headers = await getDidAuthHeaders();

                                    const res = await fetch(
                                        `${serverUrl}/keys/recovery-email/verify`,
                                        {
                                            method: 'POST',
                                            headers,
                                            body: JSON.stringify({
                                                authToken: token,
                                                providerType,
                                                code,
                                            }),
                                        }
                                    );

                                    if (!res.ok) {
                                        const data = await res.json().catch(() => ({}));
                                        throw new Error(data?.message || 'Incorrect code.');
                                    }

                                    return res.json();
                                }}
                                onSetupEmailRecovery={async email => {
                                    const authUser = await authProvider.getCurrentUser();
                                    await setupMethod({ method: 'email', email }, authUser);
                                }}
                                onConfirmEmailRecovery={async code => {
                                    await confirmMethod({ method: 'email', code });
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
        log.warn('getCachedPrivateKey failed', e);
        return null;
    }
};

const AuthCoordinatorSessionProvider: React.FC<ScoutsAuthCoordinatorProviderProps> = ({
    children,
}) => {
    const [authConfig] = useState(getAuthConfig);
    const queryClient = useQueryClient();
    const { clearDB } = useSQLiteStorage();

    const authProvider = useAuthSessionProvider();

    // Ref for clearDB — useSQLiteStorage() returns a new function identity
    // on every render (not memoized), which would cascade through
    // handleAppLogout → onLogout → base coordinator useEffect, causing an
    // infinite re-init loop. Using a ref keeps handleAppLogout stable.
    const clearDBRef = useRef(clearDB);
    clearDBRef.current = clearDB;

    // DID derivation helper — plain-JS did:key from the private key (no DIDKit WASM, no wallet)
    const didFromPrivateKey = useCallback(deriveDidKeyFromPrivateKey, []);

    // DID-Auth VP signing — proves private key ownership to the server on write ops.
    // Uses getSigningLearnCard (no network) so did:key is used deterministically.
    const signDidAuthVp = useCallback(
        async (privateKey: string, challenge?: string): Promise<string> => {
            const lc = await getSigningLearnCard(privateKey);

            const vpJwt = await lc.invoke.getDidAuthVp({ proofFormat: 'jwt', challenge });

            if (!vpJwt || typeof vpJwt !== 'string')
                throw new Error('Failed to sign DID-Auth VP JWT');

            return vpJwt;
        },
        []
    );

    // Resolve key derivation strategy from the provider registry (env-var driven)
    const keyDerivation = useMemo(() => resolveKeyDerivation(authConfig), [authConfig]);

    // Debug event handler — forward to the in-memory event system so
    // AuthKeyDebugWidget can display events in its timeline.
    const handleDebugEvent = useCallback(
        (type: string, message: string, level: DebugEventLevel, data?: Record<string, unknown>) => {
            emitAuthDebugEvent(type as AuthDebugEventType, message, { level, data });
        },
        []
    );

    // Unified logout cleanup — called by the coordinator after its own signOut + clearLocalKeys.
    const handleAppLogout = useCallback(async () => {
        try {
            await queryClient.clear();
        } catch (e) {
            log.warn('Failed to clear query cache', e);
        }

        walletStore.set.wallet(null);
        web3AuthStore.set.web3Auth(null);
        web3AuthStore.set.provider(null);
        redirectStore.set.lcnRedirect(null);
        authUserStore.set.setUser(null);
        authStore.set.typeOfLogin(null);
        chapiStore.set.isChapiInteraction(null);

        clearAuthServiceProvider();
        unsetAuthToken();

        try {
            await clearDBRef.current();
        } catch (e) {
            log.warn('Failed to clear SQLite DB', e);
        }

        currentUserStore.set.currentUser(null);
        currentUserStore.set.currentUserPK(null);
        currentUserStore.set.currentUserIsLoggedIn(false);

        clearStoragePreservingLocale(window.localStorage);
        window.sessionStorage.clear();

        firstStartupStore.set.introSlidesCompleted(true);
        firstStartupStore.set.firstStart(false);

        try {
            await clearPlatformPrivateKey();
        } catch (e) {
            log.warn('Failed to clear platform private key', e);
        }

        try {
            await clearWebSecureAll();
        } catch (e) {
            log.warn('Failed to clear secure storage', e);
        }

        try {
            await clearAllIndexedDB(keyDerivation);
        } catch (e) {
            log.warn('Failed to clear IndexedDB', e);
        }
    }, [queryClient, keyDerivation]);

    return (
        <BaseAuthCoordinatorProvider
            keyDerivation={keyDerivation}
            authProvider={authProvider}
            didFromPrivateKey={didFromPrivateKey}
            signDidAuthVp={signDidAuthVp}
            getCachedPrivateKey={getCachedPrivateKey}
            onLogout={handleAppLogout}
            clearPendingEscrowRecovery={clearAllPendingEscrowRecovery}
            onDebugEvent={handleDebugEvent}
            legacyAccountThresholdMs={5 * 60 * 1000}
            // Always enabled — the tenant config selects the key derivation strategy.
            enabled={true}
        >
            <AuthSessionManager authProvider={authProvider}>{children}</AuthSessionManager>
        </BaseAuthCoordinatorProvider>
    );
};

export const AuthCoordinatorProvider: React.FC<ScoutsAuthCoordinatorProviderProps> = ({
    children,
}) => (
    <SignInAdapterProvider>
        <AuthCoordinatorSessionProvider>{children}</AuthCoordinatorSessionProvider>
    </SignInAdapterProvider>
);

export default AuthCoordinatorProvider;

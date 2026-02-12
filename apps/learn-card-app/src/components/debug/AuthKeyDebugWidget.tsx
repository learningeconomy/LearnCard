import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Bug,
    X,
    ChevronDown,
    ChevronRight,
    RefreshCw,
    Trash2,
    Copy,
    Check,
    ScrollText,
    ShieldCheck,
    Play,
    Settings,
    Layers,
    Key,
    Server,
    Download,
    Fingerprint,
    AlertTriangle,
} from 'lucide-react';

import {
    authStore,
    firebaseAuthStore,
    currentUserStore,
    getAuthConfig,
} from 'learn-card-base';

import { useAuthCoordinator } from '../../providers/AuthCoordinatorProvider';
import { getSigningLearnCard, getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';

import {
    hasDeviceShare,
    getDeviceShare,
    clearAllShares,
    listAllDeviceShares,
    deleteDeviceShare,
    getShareVersion,
    isPublicComputerMode,
} from '@learncard/sss-key-manager';
import type { DeviceShareEntry } from '@learncard/sss-key-manager';

import {
    type AuthDebugEvent,
    subscribeToAuthDebugEvents,
    getAuthDebugEvents,
    clearAuthDebugEvents,
} from './authDebugEvents';

// ---------------------------------------------------------------------------
// Status config — maps each coordinator status to display metadata
// ---------------------------------------------------------------------------

interface StatusMeta {
    label: string;
    color: string;
    bg: string;
    ring: string;
    dot: string;
    description: string;
}

const STATUS_META: Record<string, StatusMeta> = {
    idle:                { label: 'Idle',             color: 'text-gray-400',   bg: 'bg-gray-800',       ring: 'ring-gray-600',   dot: 'bg-gray-500',   description: 'No authenticated user' },
    authenticating:      { label: 'Authenticating',   color: 'text-sky-400',    bg: 'bg-sky-950/60',     ring: 'ring-sky-700',    dot: 'bg-sky-400',    description: 'Checking auth provider session...' },
    authenticated:       { label: 'Authenticated',    color: 'text-sky-400',    bg: 'bg-sky-950/60',     ring: 'ring-sky-700',    dot: 'bg-sky-400',    description: 'User verified, preparing key check' },
    checking_key_status: { label: 'Checking Keys',    color: 'text-sky-400',    bg: 'bg-sky-950/60',     ring: 'ring-sky-700',    dot: 'bg-sky-400',    description: 'Querying server for key shares...' },
    needs_setup:         { label: 'Needs Setup',      color: 'text-yellow-400', bg: 'bg-yellow-950/40',  ring: 'ring-yellow-700', dot: 'bg-yellow-400', description: 'New user — generating Ed25519 keypair' },
    needs_migration:     { label: 'Needs Migration',  color: 'text-orange-400', bg: 'bg-orange-950/40',  ring: 'ring-orange-700', dot: 'bg-orange-400', description: 'Legacy Web3Auth → SSS migration' },
    needs_recovery:      { label: 'Needs Recovery',   color: 'text-amber-400',  bg: 'bg-amber-950/40',   ring: 'ring-amber-700',  dot: 'bg-amber-400',  description: 'Device share missing — recovery required' },
    deriving_key:        { label: 'Deriving Key',     color: 'text-sky-400',    bg: 'bg-sky-950/60',     ring: 'ring-sky-700',    dot: 'bg-sky-400',    description: 'Reconstructing private key from shares...' },
    ready:               { label: 'Ready',            color: 'text-emerald-400',bg: 'bg-emerald-950/40', ring: 'ring-emerald-700',dot: 'bg-emerald-400',description: 'Fully operational' },
    error:               { label: 'Error',            color: 'text-red-400',    bg: 'bg-red-950/40',     ring: 'ring-red-700',    dot: 'bg-red-400',    description: 'Something went wrong' },
};

const PIPELINE_STEPS = [
    'idle',
    'authenticating',
    'authenticated',
    'checking_key_status',
    'needs_setup',
    'needs_migration',
    'needs_recovery',
    'deriving_key',
    'ready',
];

const getMeta = (status: string): StatusMeta =>
    STATUS_META[status] ?? STATUS_META.idle;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const WIDGET_ENABLED =
    import.meta.env.VITE_ENABLE_AUTH_DEBUG_WIDGET === 'true' || import.meta.env.DEV;

const truncate = (s: string, len: number): string =>
    s.length > len ? s.slice(0, len) + '...' : s;

const formatTime = (date: Date): string =>
    date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    '.' + date.getMilliseconds().toString().padStart(3, '0');

const levelDot: Record<string, string> = {
    success: 'bg-emerald-400',
    error: 'bg-red-400',
    warning: 'bg-yellow-400',
    info: 'bg-sky-400',
};

const levelText: Record<string, string> = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-sky-400',
};

/** Short fingerprint for a share/key: first4…last4 */
const fingerprint = (s: string | null | undefined): string => {
    if (!s || s.length < 12) return s ?? '—';
    return `${s.slice(0, 4)}…${s.slice(-4)}`;
};

interface ServerState {
    exists: boolean;
    needsMigration: boolean;
    primaryDid: string | null;
    recoveryMethods: Array<{ type: string; createdAt?: string; shareVersion?: number }>;
    authShareFingerprint: string | null;
    rawAuthShare: string | null;
    shareVersion: number | null;
}

// ---------------------------------------------------------------------------
// Reusable sub-components
// ---------------------------------------------------------------------------

const KVRow: React.FC<{
    label: string;
    value: unknown;
    mono?: boolean;
    copied: string | null;
    onCopy: (key: string, value: unknown) => void;
}> = ({ label, value, mono = true, copied, onCopy }) => {
    const display = typeof value === 'boolean'
        ? (value ? 'true' : 'false')
        : (value === null || value === undefined ? '—' : String(value));

    const color = typeof value === 'boolean'
        ? (value ? 'text-emerald-400' : 'text-red-400')
        : (display === '—' ? 'text-gray-600' : 'text-cyan-400');

    return (
        <div className="flex items-center justify-between text-[11px] py-[3px] border-t border-gray-700/40 group">
            <span className="text-gray-500 shrink-0">{label}</span>

            <div className="flex items-center gap-1 min-w-0 ml-2">
                <span className={`${color} ${mono ? 'font-mono' : ''} text-[10px] truncate max-w-[160px]`}>
                    {display}
                </span>

                <button
                    onClick={() => onCopy(label, value)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-600 transition-all shrink-0"
                    title="Copy"
                >
                    {copied === label
                        ? <Check className="w-2.5 h-2.5 text-emerald-400" />
                        : <Copy className="w-2.5 h-2.5 text-gray-500" />}
                </button>
            </div>
        </div>
    );
};

const Section: React.FC<{
    title: string;
    icon: React.ReactNode;
    defaultOpen?: boolean;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
    children: React.ReactNode;
}> = ({ title, icon, defaultOpen = false, badge, actions, children }) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="bg-gray-800/80 rounded-lg overflow-hidden">
            <button
                onClick={() => setOpen(!open)}
                className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-700/40 transition-colors text-left"
            >
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-[11px] font-semibold text-gray-200">{title}</span>
                    {badge}
                </div>

                <div className="flex items-center gap-1">
                    {actions && open && (
                        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1">
                            {actions}
                        </div>
                    )}
                    {open
                        ? <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        : <ChevronRight className="w-3.5 h-3.5 text-gray-500" />}
                </div>
            </button>

            {open && <div className="px-3 pb-2">{children}</div>}
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------------------

export const AuthKeyDebugWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [deviceShareExists, setDeviceShareExists] = useState<boolean | null>(null);
    const [deviceSharePreview, setDeviceSharePreview] = useState<string | null>(null);
    const [allShares, setAllShares] = useState<DeviceShareEntry[]>([]);
    const [events, setEvents] = useState<AuthDebugEvent[]>([]);
    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
    const [keyIntegrityResult, setKeyIntegrityResult] = useState<boolean | null>(null);
    const [serverState, setServerState] = useState<ServerState | null>(null);
    const [serverLoading, setServerLoading] = useState(false);
    const [didKeyDid, setDidKeyDid] = useState<string | null>(null);
    const [didWebDid, setDidWebDid] = useState<string | null>(null);
    const [localShareVersion, setLocalShareVersion] = useState<number | null>(null);

    // --- Coordinator (source of truth) ---
    const {
        state,
        isReady,
        did,
        authSessionValid,
        wallet,
        walletReady,
        isLoggedIn,
        lcnProfile,
        lcnProfileLoading,
        hasLCNAccount,
        verifyKeyIntegrity,
        initialize: reinitialize,
    } = useAuthCoordinator();

    const meta = getMeta(state.status);

    // --- Other stores (supplementary) ---
    const firebaseUser = firebaseAuthStore.use.currentUser();
    const currentUser = currentUserStore.use.currentUser();
    const typeOfLogin = authStore.use.typeOfLogin();

    const authConfig = useMemo(() => getAuthConfig(), []);

    // --- State-specific details ---
    const stateDetails = useMemo((): Array<{ label: string; value: unknown }> => {
        const rows: Array<{ label: string; value: unknown }> = [];

        if (state.status === 'ready') {
            rows.push({ label: 'DID', value: did ? truncate(did, 28) : '—' });
            rows.push({ label: 'Auth Session Valid', value: authSessionValid });
            rows.push({ label: 'Private Key', value: state.privateKey ? truncate(state.privateKey, 12) + '***' : '—' });
        }

        if (state.status === 'authenticated' || state.status === 'needs_setup' || state.status === 'needs_migration' || state.status === 'needs_recovery') {
            const authUser = 'authUser' in state ? state.authUser : null;

            if (authUser) {
                rows.push({ label: 'Auth UID', value: authUser.uid });
                rows.push({ label: 'Auth Email', value: authUser.email ?? '—' });
            }
        }

        if (state.status === 'needs_recovery' && 'recoveryMethods' in state) {
            const methods = state.recoveryMethods.map(m => m.type).join(', ');
            rows.push({ label: 'Recovery Methods', value: methods || 'none' });
        }

        if (state.status === 'needs_migration' && 'migrationData' in state && state.migrationData) {
            rows.push({ label: 'Migration Data', value: Object.keys(state.migrationData).join(', ') });
            rows.push({ label: 'Web3Auth Key', value: state.migrationData.web3AuthKey ? 'present' : 'missing' });
        }

        if (state.status === 'error') {
            rows.push({ label: 'Error', value: state.error });
            rows.push({ label: 'Can Retry', value: state.canRetry });

            if (state.previousState) {
                rows.push({ label: 'Previous State', value: state.previousState.status });
            }
        }

        return rows;
    }, [state, did, authSessionValid]);

    // Derive the expected active storage key from the Firebase UID
    const activeStorageId = firebaseUser?.uid
        ? `sss-device-share:${firebaseUser.uid}`
        : undefined;

    // --- Device share check ---
    const checkDeviceShare = useCallback(async () => {
        try {
            const exists = await hasDeviceShare();
            setDeviceShareExists(exists);

            if (exists) {
                const share = await getDeviceShare();

                if (share) {
                    setDeviceSharePreview(share.substring(0, 8) + '...' + share.substring(share.length - 8));
                }
            } else {
                setDeviceSharePreview(null);
            }

            const shares = await listAllDeviceShares();
            setAllShares(shares);

            // Fetch the share version for the active storage ID
            try {
                const version = await getShareVersion(activeStorageId);
                setLocalShareVersion(version);
            } catch {
                setLocalShareVersion(null);
            }
        } catch {
            setDeviceShareExists(false);
            setDeviceSharePreview(null);
            setAllShares([]);
            setLocalShareVersion(null);
        }
    }, [activeStorageId]);

    useEffect(() => {
        if (isOpen) {
            checkDeviceShare();
            setEvents(getAuthDebugEvents());
        }
    }, [isOpen, refreshKey, checkDeviceShare]);

    // --- Event subscription ---
    useEffect(() => {
        if (!isOpen) return;

        const unsubscribe = subscribeToAuthDebugEvents((event) => {
            if (event.id === 'clear') {
                setEvents([]);
            } else {
                setEvents(prev => [event, ...prev].slice(0, 200));
            }
        });

        return unsubscribe;
    }, [isOpen]);

    // --- Actions ---
    const copyToClipboard = useCallback(async (key: string, value: unknown) => {
        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(key);
            setTimeout(() => setCopied(null), 1500);
        } catch { /* ignore */ }
    }, []);

    const handleClearDeviceShare = useCallback(async () => {
        if (confirm('Clear ALL device shares? You will need to recover your key to login again.')) {
            try {
                await clearAllShares();
                await checkDeviceShare();
            } catch (e) {
                console.error('Failed to clear device share:', e);
            }
        }
    }, [checkDeviceShare]);

    const handleDeleteSingleShare = useCallback(async (id: string) => {
        if (confirm(`Delete device share "${id}"?`)) {
            try {
                await deleteDeviceShare(id);
                await checkDeviceShare();
            } catch (e) {
                console.error('Failed to delete device share:', e);
            }
        }
    }, [checkDeviceShare]);

    const handleVerifyKeys = useCallback(async () => {
        setKeyIntegrityResult(null);
        const result = await verifyKeyIntegrity();
        setKeyIntegrityResult(result);
        setTimeout(() => setKeyIntegrityResult(null), 5000);
    }, [verifyKeyIntegrity]);

    const handleReinit = useCallback(async () => {
        await reinitialize();
    }, [reinitialize]);

    const handleClearEvents = useCallback(() => {
        clearAuthDebugEvents();
        setEvents([]);
        setExpandedEvents(new Set());
    }, []);

    const toggleEventExpanded = useCallback((eventId: string) => {
        setExpandedEvents(prev => {
            const next = new Set(prev);

            if (next.has(eventId)) {
                next.delete(eventId);
            } else {
                next.add(eventId);
            }

            return next;
        });
    }, []);

    // --- Fetch server state ---
    const fetchServerState = useCallback(async () => {
        if (!firebaseUser || !authConfig.serverUrl) return;

        setServerLoading(true);

        try {
            const token = await firebaseUser.getIdToken();

            const response = await fetch(`${authConfig.serverUrl}/keys/auth-share`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ authToken: token, providerType: 'firebase' }),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    setServerState({ exists: false, needsMigration: false, primaryDid: null, recoveryMethods: [], authShareFingerprint: null, rawAuthShare: null });
                    return;
                }

                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const rawAuth = typeof data.authShare === 'object' ? data.authShare?.encryptedData : data.authShare;

            setServerState({
                exists: !!data.authShare || !!data.keyProvider || !!data.primaryDid,
                needsMigration: data.keyProvider === 'web3auth',
                primaryDid: data.primaryDid || null,
                recoveryMethods: data.recoveryMethods || [],
                authShareFingerprint: rawAuth ? fingerprint(rawAuth) : null,
                rawAuthShare: rawAuth || null,
                shareVersion: data.shareVersion ?? null,
            });
        } catch (e) {
            console.error('[DebugWidget] fetchServerState error:', e);
            setServerState(null);
        } finally {
            setServerLoading(false);
        }
    }, [firebaseUser, authConfig.serverUrl]);

    // --- Derive both DID formats for comparison ---
    useEffect(() => {
        if (state.status !== 'ready' || !('privateKey' in state) || !state.privateKey) {
            setDidKeyDid(null);
            setDidWebDid(null);
            return;
        }

        const pk = state.privateKey;

        (async () => {
            try {
                const signingLc = await getSigningLearnCard(pk);
                setDidKeyDid(signingLc.id.did());
            } catch { setDidKeyDid(null); }

            try {
                const bespokeLc = await getBespokeLearnCard(pk);
                setDidWebDid(bespokeLc?.id.did() || null);
            } catch { setDidWebDid(null); }
        })();
    }, [state]);

    // --- Export events as JSON ---
    const handleExportEvents = useCallback(async () => {
        const exportData = {
            exportedAt: new Date().toISOString(),
            coordinatorStatus: state.status,
            publicComputerMode: isPublicComputerMode(),
            storageBackend: isPublicComputerMode() ? 'sessionStorage' : 'IndexedDB',
            did,
            didKeyDid,
            didWebDid,
            serverState,
            localShareVersion,
            deviceShares: allShares.map(s => ({ id: s.id, preview: s.preview, shareVersion: s.shareVersion })),
            events: events.map(e => ({
                time: e.timestamp.toISOString(),
                type: e.type,
                level: e.level,
                message: e.message,
                data: e.data,
            })),
        };

        try {
            await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
            setCopied('export');
            setTimeout(() => setCopied(null), 2000);
        } catch { /* ignore */ }
    }, [state, did, didKeyDid, didWebDid, serverState, localShareVersion, allShares, events]);

    if (!WIDGET_ENABLED) return null;

    // --- Fab button color follows coordinator status ---
    const fabBg = isOpen
        ? 'bg-gray-700 hover:bg-gray-600'
        : isReady
            ? 'bg-emerald-600 hover:bg-emerald-500'
            : state.status === 'error'
                ? 'bg-red-600 hover:bg-red-500'
                : 'bg-sky-600 hover:bg-sky-500';

    return (
        <React.Fragment>
            {/* FAB */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-24 right-4 z-[2147483647] w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ${fabBg}`}
                title={`Auth Debug — ${meta.label}`}
            >
                {isOpen
                    ? <X className="w-4.5 h-4.5 text-white" />
                    : <Bug className="w-4.5 h-4.5 text-white" />}
            </button>

            {/* Panel */}
            {isOpen && (
                <div className="fixed bottom-40 right-4 z-[2147483646] w-[340px] max-h-[70vh] bg-gray-950 rounded-xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col">

                    {/* ── Header ── */}
                    <div className="px-3 py-2.5 bg-gray-900 flex items-center justify-between border-b border-gray-800">
                        <div className="flex items-center gap-2">
                            <Bug className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-[12px] font-bold text-gray-200 tracking-wide">Auth Coordinator</span>
                        </div>

                        <div className="flex items-center gap-0.5">
                            {isReady && (
                                <button onClick={handleVerifyKeys} className="p-1.5 rounded-md hover:bg-gray-800 transition-colors" title="Verify key integrity">
                                    <ShieldCheck className={`w-3.5 h-3.5 ${keyIntegrityResult === true ? 'text-emerald-400' : keyIntegrityResult === false ? 'text-red-400' : 'text-gray-500'}`} />
                                </button>
                            )}

                            <button onClick={handleReinit} className="p-1.5 rounded-md hover:bg-gray-800 transition-colors" title="Force re-initialize">
                                <Play className="w-3.5 h-3.5 text-gray-500" />
                            </button>

                            <button onClick={() => setRefreshKey(k => k + 1)} className="p-1.5 rounded-md hover:bg-gray-800 transition-colors" title="Refresh data">
                                <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                        </div>
                    </div>

                    {/* ── Scrollable body ── */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">

                        {/* ── Status headline ── */}
                        <div className={`rounded-lg p-3 ${meta.bg} ring-1 ${meta.ring}`}>
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${meta.dot} ${['authenticating', 'checking_key_status', 'deriving_key'].includes(state.status) ? 'animate-pulse' : ''}`} />
                                <span className={`text-sm font-bold ${meta.color}`}>{meta.label}</span>
                            </div>

                            <p className="text-[10px] text-gray-400 mb-2">{meta.description}</p>

                            {/* State-specific fields */}
                            {stateDetails.length > 0 && (
                                <div className="space-y-0">
                                    {stateDetails.map(({ label, value }) => (
                                        <KVRow key={label} label={label} value={value} copied={copied} onCopy={copyToClipboard} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Pipeline ── */}
                        <div className="bg-gray-800/80 rounded-lg px-3 py-2">
                            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">State Pipeline</p>

                            <div className="flex items-center gap-[3px] flex-wrap">
                                {PIPELINE_STEPS.map((step) => {
                                    const s = getMeta(step);
                                    const isCurrent = step === state.status;
                                    const isError = state.status === 'error';

                                    return (
                                        <div
                                            key={step}
                                            className={`px-1.5 py-0.5 rounded text-[8px] font-medium transition-all ${
                                                isCurrent
                                                    ? `${s.bg} ${s.color} ring-1 ${s.ring}`
                                                    : 'bg-gray-900/60 text-gray-600'
                                            }`}
                                            title={s.description}
                                        >
                                            {s.label}
                                        </div>
                                    );
                                })}

                                {/* Error chip — only shown when in error state */}
                                {state.status === 'error' && (
                                    <div className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-red-950/40 text-red-400 ring-1 ring-red-700">
                                        Error
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Environment Config ── */}
                        <Section
                            title="Environment"
                            icon={<Settings className="w-3 h-3 text-gray-500" />}
                        >
                            <KVRow label="Auth Provider" value={authConfig.authProvider} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Key Derivation" value={authConfig.keyDerivation} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="SSS Server URL" value={truncate(authConfig.serverUrl, 32)} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Migration Enabled" value={authConfig.enableMigration} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Public Computer Mode" value={isPublicComputerMode()} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Storage Backend" value={isPublicComputerMode() ? 'sessionStorage (ephemeral)' : 'IndexedDB (persistent)'} mono={false} copied={copied} onCopy={copyToClipboard} />

                            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-2.5 mb-0.5">Web3Auth</p>
                            <KVRow label="Client ID" value={authConfig.web3AuthClientId ? truncate(authConfig.web3AuthClientId, 20) : '—'} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Network" value={authConfig.web3AuthNetwork || '—'} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Verifier ID" value={authConfig.web3AuthVerifierId || '—'} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="RPC Target" value={authConfig.web3AuthRpcTarget ? truncate(authConfig.web3AuthRpcTarget, 30) : '—'} copied={copied} onCopy={copyToClipboard} />
                        </Section>

                        {/* ── Auth Layers ── */}
                        <Section
                            title="Auth Layers"
                            icon={<Layers className="w-3 h-3 text-gray-500" />}
                            defaultOpen
                            badge={
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                    isLoggedIn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'
                                }`}>
                                    {isLoggedIn ? 'L0+L1+L2' : firebaseUser ? 'L1' : '—'}
                                </span>
                            }
                        >
                            {/* Layer 1: Firebase */}
                            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-1 mb-0.5">Layer 1 — Auth Provider (Firebase)</p>
                            <KVRow label="UID" value={firebaseUser?.uid ?? '—'} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Email" value={firebaseUser?.email ?? '—'} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Phone" value={firebaseUser?.phoneNumber ?? '—'} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Login Type" value={typeOfLogin ?? '—'} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="JWT Present" value={!!authStore.get.jwt()} copied={copied} onCopy={copyToClipboard} />

                            {/* Layer 0: Wallet / DID */}
                            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-2.5 mb-0.5">Layer 0 — Private Key / Wallet</p>
                            <KVRow label="Wallet Ready" value={walletReady} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="DID" value={did ? truncate(did, 30) : '—'} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Auth Session Valid" value={authSessionValid} copied={copied} onCopy={copyToClipboard} />

                            {/* Layer 2: LCN */}
                            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-2.5 mb-0.5">Layer 2 — LCN Profile</p>
                            <KVRow label="Has Account" value={hasLCNAccount} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Profile Loading" value={lcnProfileLoading} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Profile ID" value={lcnProfile?.profileId ? truncate(lcnProfile.profileId, 20) : '—'} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Display Name" value={lcnProfile?.displayName ?? '—'} mono={false} copied={copied} onCopy={copyToClipboard} />

                            {/* Current User Store */}
                            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-2.5 mb-0.5">Current User Store</p>
                            <KVRow label="UID" value={currentUser?.uid ?? '—'} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Email" value={currentUser?.email ?? '—'} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Has Private Key" value={!!currentUser?.privateKey} copied={copied} onCopy={copyToClipboard} />

                            {/* DID comparison */}
                            {(didKeyDid || didWebDid) && (
                                <>
                                    <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-2.5 mb-0.5">DID Comparison</p>

                                    <KVRow label="did:key" value={didKeyDid ? truncate(didKeyDid, 30) : '—'} copied={copied} onCopy={copyToClipboard} />
                                    <KVRow label="did:web" value={didWebDid ? truncate(didWebDid, 30) : '—'} copied={copied} onCopy={copyToClipboard} />

                                    {didKeyDid && didWebDid && didKeyDid !== didWebDid && (
                                        <div className="flex items-center gap-1 mt-1 text-[9px]">
                                            <AlertTriangle className="w-2.5 h-2.5 text-yellow-400" />
                                            <span className="text-yellow-400">Different DID methods — ensure server uses did:key</span>
                                        </div>
                                    )}

                                    {serverState?.primaryDid && didKeyDid && serverState.primaryDid !== didKeyDid && (
                                        <div className="flex items-center gap-1 mt-1 text-[9px]">
                                            <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                                            <span className="text-red-400">Server primaryDid ≠ did:key — will trigger false recovery!</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </Section>

                        {/* ── Server & Share Health ── */}
                        <Section
                            title="Server & Share Health"
                            icon={<Server className="w-3 h-3 text-gray-500" />}
                            badge={serverState ? (
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                    serverState.exists ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'
                                }`}>
                                    {serverState.exists ? 'record found' : 'no record'}
                                </span>
                            ) : undefined}
                            actions={
                                <button
                                    onClick={fetchServerState}
                                    className="p-1 rounded hover:bg-gray-600 transition-colors"
                                    title="Fetch server state"
                                    disabled={serverLoading}
                                >
                                    <RefreshCw className={`w-3 h-3 text-gray-500 ${serverLoading ? 'animate-spin' : ''}`} />
                                </button>
                            }
                        >
                            {!serverState ? (
                                <div className="text-center py-2">
                                    <button
                                        onClick={fetchServerState}
                                        disabled={serverLoading || !firebaseUser}
                                        className="text-[10px] text-sky-400 hover:text-sky-300 disabled:text-gray-600"
                                    >
                                        {serverLoading ? 'Fetching...' : 'Click to fetch server state'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <KVRow label="Record Exists" value={serverState.exists} copied={copied} onCopy={copyToClipboard} />
                                    <KVRow label="Needs Migration" value={serverState.needsMigration} copied={copied} onCopy={copyToClipboard} />
                                    <KVRow label="Server primaryDid" value={serverState.primaryDid ? truncate(serverState.primaryDid, 28) : '—'} copied={copied} onCopy={copyToClipboard} />
                                    <KVRow label="Auth Share 🔑" value={serverState.authShareFingerprint ?? '—'} copied={copied} onCopy={copyToClipboard} />
                                    <KVRow label="Server Share Version" value={serverState.shareVersion ?? '—'} copied={copied} onCopy={copyToClipboard} />
                                    <KVRow label="Local Share Version" value={localShareVersion ?? '—'} copied={copied} onCopy={copyToClipboard} />

                                    {/* Version match indicator */}
                                    {serverState.shareVersion != null && localShareVersion != null && (
                                        <div className={`flex items-center gap-1 mt-1 text-[9px] ${
                                            serverState.shareVersion === localShareVersion
                                                ? 'text-emerald-400'
                                                : 'text-red-400'
                                        }`}>
                                            {serverState.shareVersion === localShareVersion
                                                ? <Check className="w-2.5 h-2.5" />
                                                : <AlertTriangle className="w-2.5 h-2.5" />}
                                            <span>
                                                {serverState.shareVersion === localShareVersion
                                                    ? `Versions match (v${localShareVersion})`
                                                    : `Version mismatch! Server v${serverState.shareVersion} ≠ Local v${localShareVersion}`}
                                            </span>
                                        </div>
                                    )}

                                    {serverState.shareVersion != null && localShareVersion == null && (
                                        <div className="flex items-center gap-1 mt-1 text-[9px] text-yellow-400">
                                            <AlertTriangle className="w-2.5 h-2.5" />
                                            <span>No local version stored (legacy share?)</span>
                                        </div>
                                    )}

                                    <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-2 mb-0.5">
                                        Recovery Methods ({serverState.recoveryMethods.length})
                                    </p>

                                    {serverState.recoveryMethods.length === 0 ? (
                                        <p className="text-[10px] text-gray-600">None configured</p>
                                    ) : (
                                        serverState.recoveryMethods.map((rm, i) => (
                                            <div key={i} className="flex items-center gap-1.5 text-[10px] py-0.5 border-t border-gray-700/40">
                                                <span className={`px-1 py-0.5 rounded text-[8px] font-medium ${
                                                    rm.type === 'password' ? 'bg-sky-500/20 text-sky-400' :
                                                    rm.type === 'passkey' ? 'bg-purple-500/20 text-purple-400' :
                                                    rm.type === 'phrase' ? 'bg-amber-500/20 text-amber-400' :
                                                    'bg-gray-700 text-gray-400'
                                                }`}>{rm.type}</span>

                                                {rm.createdAt && (
                                                    <span className="text-gray-600 text-[8px]">{new Date(rm.createdAt).toLocaleDateString()}</span>
                                                )}

                                                {rm.shareVersion != null && (
                                                    <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                                                        serverState.shareVersion != null && rm.shareVersion !== serverState.shareVersion
                                                            ? 'bg-yellow-500/20 text-yellow-400'
                                                            : 'bg-gray-700 text-gray-400'
                                                    }`}>
                                                        v{rm.shareVersion}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    )}

                                    {/* Share generation match check */}
                                    {serverState.rawAuthShare && allShares.length > 0 && (
                                        <>
                                            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mt-2 mb-0.5">Share Fingerprints</p>

                                            <KVRow label="Server Auth" value={fingerprint(serverState.rawAuthShare)} copied={copied} onCopy={copyToClipboard} />

                                            {allShares.filter(s => activeStorageId === s.id).map(s => (
                                                <KVRow key={s.id} label="Local Device" value={s.preview} copied={copied} onCopy={copyToClipboard} />
                                            ))}
                                        </>
                                    )}
                                </>
                            )}
                        </Section>

                        {/* ── Device Shares (SSS) ── */}
                        <Section
                            title="Device Shares"
                            icon={<Key className="w-3 h-3 text-gray-500" />}
                            badge={
                                <div className="flex items-center gap-1">
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                                        allShares.length > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-500'
                                    }`}>
                                        {allShares.length === 0 ? 'none' : `${allShares.length} share${allShares.length > 1 ? 's' : ''}`}
                                    </span>

                                    {isPublicComputerMode() && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-amber-500/20 text-amber-400">
                                            ephemeral
                                        </span>
                                    )}
                                </div>
                            }
                            actions={
                                allShares.length > 0 ? (
                                    <button
                                        onClick={handleClearDeviceShare}
                                        className="p-1 rounded hover:bg-red-900/50 transition-colors"
                                        title="Clear ALL device shares"
                                    >
                                        <Trash2 className="w-3 h-3 text-gray-500 hover:text-red-400" />
                                    </button>
                                ) : undefined
                            }
                        >
                            <KVRow label="Active Storage ID" value={activeStorageId ?? '(none — no user)'} copied={copied} onCopy={copyToClipboard} />
                            <KVRow label="Legacy Default Exists" value={deviceShareExists} copied={copied} onCopy={copyToClipboard} />

                            {allShares.length === 0 ? (
                                <p className="text-[10px] text-gray-600 text-center py-2">
                                    {isPublicComputerMode()
                                        ? 'No device shares in sessionStorage (public mode)'
                                        : 'No device shares in IndexedDB'}
                                </p>
                            ) : (
                                <div className="mt-1.5 space-y-1">
                                    {allShares.map((entry) => {
                                        const isActive = activeStorageId === entry.id;
                                        const isLegacy = entry.id === 'sss-device-share';
                                        const userSuffix = entry.id.startsWith('sss-device-share:')
                                            ? entry.id.replace('sss-device-share:', '')
                                            : null;

                                        return (
                                            <div
                                                key={entry.id}
                                                className={`rounded-md p-1.5 border ${
                                                    isActive
                                                        ? 'border-emerald-700/60 bg-emerald-950/30'
                                                        : 'border-gray-700/40 bg-gray-900/40'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between mb-0.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                            isActive ? 'bg-emerald-400' : 'bg-gray-600'
                                                        }`} />

                                                        <span className="text-[9px] font-mono text-gray-300 truncate">
                                                            {isLegacy ? '(legacy default)' : userSuffix ? `user: ${truncate(userSuffix, 16)}` : entry.id}
                                                        </span>

                                                        {isActive && (
                                                            <span className="text-[8px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium shrink-0">
                                                                active
                                                            </span>
                                                        )}

                                                        {isLegacy && (
                                                            <span className="text-[8px] px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-medium shrink-0">
                                                                legacy
                                                            </span>
                                                        )}
                                                    </div>

                                                    <button
                                                        onClick={() => handleDeleteSingleShare(entry.id)}
                                                        className="p-0.5 rounded hover:bg-red-900/50 transition-colors shrink-0"
                                                        title={`Delete share: ${entry.id}`}
                                                    >
                                                        <Trash2 className="w-2.5 h-2.5 text-gray-600 hover:text-red-400" />
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-1 ml-3">
                                                    <span className="text-[8px] text-gray-500">key:</span>
                                                    <span className="text-[8px] font-mono text-cyan-400/70 truncate">{entry.preview}</span>

                                                    {entry.shareVersion != null && (
                                                        <span className="text-[8px] font-mono px-1 py-0.5 rounded bg-gray-700 text-gray-400 shrink-0">
                                                            v{entry.shareVersion}
                                                        </span>
                                                    )}

                                                    <button
                                                        onClick={() => copyToClipboard(entry.id, entry.id)}
                                                        className="opacity-0 hover:opacity-100 p-0.5 rounded hover:bg-gray-600 transition-all shrink-0"
                                                        title="Copy storage ID"
                                                    >
                                                        {copied === entry.id
                                                            ? <Check className="w-2 h-2 text-emerald-400" />
                                                            : <Copy className="w-2 h-2 text-gray-600" />}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </Section>

                        {/* ── Event Timeline ── */}
                        <Section
                            title="Event Timeline"
                            icon={<ScrollText className="w-3 h-3 text-gray-500" />}
                            defaultOpen
                            badge={events.length > 0 ? (
                                <span className="text-[9px] bg-sky-500/20 text-sky-400 px-1.5 py-0.5 rounded-full font-medium">
                                    {events.length}
                                </span>
                            ) : undefined}
                            actions={events.length > 0 ? (
                                <div className="flex items-center gap-0.5">
                                    <button onClick={handleExportEvents} className="p-1 rounded hover:bg-gray-600 transition-colors" title={copied === 'export' ? 'Copied!' : 'Export full debug snapshot'}>
                                        {copied === 'export' ? <Check className="w-3 h-3 text-emerald-400" /> : <Download className="w-3 h-3 text-gray-500" />}
                                    </button>

                                    <button onClick={handleClearEvents} className="p-1 rounded hover:bg-gray-600 transition-colors" title="Clear events">
                                        <Trash2 className="w-3 h-3 text-gray-500" />
                                    </button>
                                </div>
                            ) : undefined}
                        >
                            <div className="max-h-48 overflow-y-auto -mx-1">
                                {events.length === 0 ? (
                                    <p className="text-[10px] text-gray-600 text-center py-3">
                                        Events appear as auth actions occur
                                    </p>
                                ) : (
                                    <div className="space-y-0.5">
                                        {events.map((event) => {
                                            const isExpanded = expandedEvents.has(event.id);

                                            return (
                                                <div key={event.id} className="rounded bg-gray-900/50 hover:bg-gray-900/80 transition-colors overflow-hidden">
                                                    <button
                                                        onClick={() => toggleEventExpanded(event.id)}
                                                        className="w-full flex items-start gap-1.5 py-1 px-2 text-left"
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${levelDot[event.level] ?? levelDot.info}`} />

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-[8px] text-gray-600 font-mono">{formatTime(event.timestamp)}</span>
                                                                <span className={`text-[8px] font-semibold ${levelText[event.level] ?? levelText.info}`}>{event.type}</span>
                                                            </div>

                                                            <p className={`text-[9px] text-gray-400 ${isExpanded ? 'whitespace-pre-wrap break-words' : 'truncate'}`}>
                                                                {event.message}
                                                            </p>
                                                        </div>

                                                        <ChevronRight className={`w-2.5 h-2.5 text-gray-600 shrink-0 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                    </button>

                                                    {isExpanded && event.data && (
                                                        <div className="px-2 pb-1.5 ml-4">
                                                            <pre className="text-[8px] text-gray-500 bg-gray-950 rounded p-1.5 overflow-x-auto whitespace-pre-wrap break-words">
                                                                {JSON.stringify(event.data, null, 2)}
                                                            </pre>

                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(event.id, JSON.stringify(event.data, null, 2)); }}
                                                                className="text-[8px] text-gray-600 hover:text-gray-400 mt-0.5"
                                                            >
                                                                {copied === event.id ? 'Copied!' : 'Copy data'}
                                                            </button>
                                                        </div>
                                                    )}

                                                    {isExpanded && !event.data && (
                                                        <p className="text-[8px] text-gray-600 italic px-2 pb-1.5 ml-4">No additional data</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </Section>
                    </div>

                    {/* ── Footer ── */}
                    <div className="px-3 py-1.5 border-t border-gray-800 bg-gray-900/50 flex items-center justify-between">
                        <p className="text-[9px] text-gray-600">
                            {import.meta.env.DEV ? 'dev mode' : 'debug widget'}
                        </p>

                        <p className="text-[9px] text-gray-600 font-mono">
                            {state.status}
                        </p>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default AuthKeyDebugWidget;

import React from 'react';

import { Wifi, WifiOff, Zap, Key } from 'lucide-react';

import {
    connectivityStore,
    useAuthStatus,
    isAuthSettled,
    isAuthResolving,
    hasNetworkProfile,
    shouldPromptProfileOnboarding,
    networkFaultStore,
} from 'learn-card-base';
import type { NetworkFaultMode } from 'learn-card-base';
import {
    getPlatformPrivateKey,
    setPlatformPrivateKey,
} from 'learn-card-base/security/platformPrivateKeyStorage';
import { sqliteStore } from 'learn-card-base/stores/sqliteStore';

import { useAuthCoordinator } from '../../providers/AuthCoordinatorProvider';

import { KVRow, Section, useCopyToClipboard } from './debugComponents';

export const OfflineDebugTab: React.FC = () => {
    const [copied, copyToClipboard] = useCopyToClipboard();

    const connectivity = connectivityStore.use.status();
    const authGate = useAuthStatus();
    const faultMode = networkFaultStore.use.mode();
    const faultDelay = networkFaultStore.use.delayMs();

    const { state } = useAuthCoordinator();
    const sqliteDb = sqliteStore.use.db();
    const [diskKey, setDiskKey] = React.useState<string>('(not checked)');
    const [persisting, setPersisting] = React.useState(false);

    const checkDiskKey = async () => {
        try {
            const k = await getPlatformPrivateKey();
            setDiskKey(k ? `found — ${k.length} chars` : 'null (not on disk)');
        } catch (e) {
            setDiskKey(`error: ${e instanceof Error ? e.message : String(e)}`);
        }
    };

    const rePersist = async () => {
        const pk = state.status === 'ready' ? state.privateKey : null;
        if (!pk) {
            setDiskKey('no in-memory key to persist (not ready)');
            return;
        }
        setPersisting(true);
        try {
            await setPlatformPrivateKey(pk);
            await checkDiskKey();
        } catch (e) {
            setDiskKey(`persist error: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setPersisting(false);
        }
    };

    const connectivityBadge = (
        <span
            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider ${
                connectivity === 'offline'
                    ? 'bg-amber-500/20 text-amber-400'
                    : connectivity === 'online'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-gray-700 text-gray-500'
            }`}
        >
            {connectivity}
        </span>
    );

    return (
        <div className="space-y-2">
            <Section
                title="Connectivity"
                icon={
                    connectivity === 'offline' ? (
                        <WifiOff className="w-3 h-3 text-amber-400" />
                    ) : (
                        <Wifi className="w-3 h-3 text-emerald-400" />
                    )
                }
                defaultOpen
                badge={connectivityBadge}
            >
                <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">
                    UI Preview (flag only)
                </p>
                <p className="text-[9px] text-gray-500 mb-2">
                    Flips the connectivity flag to preview the banner + boot gate. Does NOT stall
                    real calls — use the fault injector below (or real airplane mode) to test the
                    boot-hang timeouts.
                </p>

                <div className="flex gap-1.5">
                    <button
                        type="button"
                        onClick={() => connectivityStore.set.report(false)}
                        disabled={connectivity === 'offline'}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold bg-amber-950/40 text-amber-300 ring-1 ring-amber-800 hover:bg-amber-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <WifiOff className="w-3 h-3" />
                        Offline
                    </button>
                    <button
                        type="button"
                        onClick={() => connectivityStore.set.report(true)}
                        disabled={connectivity === 'online'}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-800 hover:bg-emerald-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <Wifi className="w-3 h-3" />
                        Online
                    </button>
                </div>
            </Section>

            <Section
                title="Fault Injector"
                icon={<Zap className="w-3 h-3 text-gray-500" />}
                defaultOpen
                badge={
                    faultMode !== 'off' ? (
                        <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider">
                            armed
                        </span>
                    ) : undefined
                }
            >
                <p className="text-[9px] text-gray-500 mb-2">
                    Stalls/fails the ACTUAL bounded boot calls so the deadlines fire, then reload
                    the app. Delay {faultDelay}ms &gt; every budget (2.5s / 4s / 15s), so all
                    timeouts trip.
                </p>

                <div className="flex gap-1.5">
                    {(['off', 'delay', 'fail'] as NetworkFaultMode[]).map(mode => (
                        <button
                            key={mode}
                            type="button"
                            onClick={() => networkFaultStore.set.mode(mode)}
                            className={`flex-1 py-1.5 rounded-md text-[10px] font-semibold capitalize transition-colors ${
                                faultMode === mode
                                    ? mode === 'off'
                                        ? 'bg-gray-700 text-gray-100 ring-1 ring-gray-500'
                                        : 'bg-red-950/50 text-red-300 ring-1 ring-red-700'
                                    : 'bg-gray-900/60 text-gray-500 hover:bg-gray-800'
                            }`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </Section>

            <Section
                title="Key Persistence"
                icon={<Key className="w-3 h-3 text-gray-500" />}
                defaultOpen
            >
                <div className="space-y-0">
                    <KVRow
                        label="SQLite db present"
                        value={!!sqliteDb}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="In-memory key"
                        value={state.status === 'ready' ? !!state.privateKey : false}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="On-disk key"
                        value={diskKey}
                        mono={false}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                </div>

                <div className="flex gap-1.5 mt-2">
                    <button
                        type="button"
                        onClick={checkDiskKey}
                        className="flex-1 py-1.5 rounded-md text-[10px] font-semibold bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
                    >
                        Check disk key
                    </button>
                    <button
                        type="button"
                        onClick={rePersist}
                        disabled={persisting || state.status !== 'ready'}
                        className="flex-1 py-1.5 rounded-md text-[10px] font-semibold bg-sky-950/50 text-sky-300 ring-1 ring-sky-800 hover:bg-sky-900/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        {persisting ? 'Persisting…' : 'Re-persist key'}
                    </button>
                </div>

                <p className="text-[9px] text-gray-500 mt-2">
                    While logged in + online, tap “Check disk key” — it should say “found”. If it
                    says “null”, the key never persisted (that’s the offline-boot bug). Reads
                    straight from native SQLite / web secure storage.
                </p>
            </Section>

            <Section
                title="Auth Gate"
                icon={<Wifi className="w-3 h-3 text-gray-500" />}
                defaultOpen
            >
                <div className="space-y-0">
                    <KVRow
                        label="Gate Tag"
                        value={authGate.tag}
                        mono={false}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="Profile"
                        value={authGate.tag === 'ready' ? authGate.profile.tag : '—'}
                        mono={false}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="isAuthSettled"
                        value={isAuthSettled(authGate)}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="isAuthResolving"
                        value={isAuthResolving(authGate)}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="hasNetworkProfile"
                        value={hasNetworkProfile(authGate)}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                    <KVRow
                        label="shouldPromptOnboarding"
                        value={shouldPromptProfileOnboarding(authGate)}
                        copied={copied}
                        onCopy={copyToClipboard}
                    />
                </div>
            </Section>
        </div>
    );
};

export default OfflineDebugTab;

import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { cloudOfflineOutline, warningOutline, wifiOutline, refreshOutline } from 'ionicons/icons';
import * as m from '../../paraglide/messages.js';
import { connectivityStore, walletModeStore } from 'learn-card-base';

import { requestConnectivityCheck } from './connectivity';

/**
 * Connectivity banners, in priority order:
 *
 *  1. "Back online" confirmation toast (brief, after a limited period ends).
 *  2. Verified OFFLINE — reconnect affordance. The tap goes through the
 *     singleton monitor check (never a bare `Network.getStatus`); the networked
 *     wallet rebuild is only requested on a verified-reachable result.
 *  3. Local-wallet fallback with an otherwise reachable network — "Some
 *     features are unavailable". This deliberately does NOT claim the internet
 *     is down when reachability is verified.
 *  4. Advisory slow/unstable warning (quality === 'poor', offline takes
 *     precedence). Accessible status, amber, never a modal, never gating.
 */
export const OfflineBanner: React.FC = () => {
    const status = connectivityStore.use.status();
    const quality = connectivityStore.use.quality();
    const walletMode = walletModeStore.use.mode();

    const [reconnecting, setReconnecting] = useState(false);
    const [showReconnected, setShowReconnected] = useState(false);
    const wasLimited = useRef(false);

    const isOffline = status === 'offline';
    // "Limited" whenever the device is verified offline OR the wallet is
    // running on the local fallback (network was unavailable when it was
    // built) — even though the network itself is reachable again.
    const isLimited = isOffline || walletMode === 'offline';
    // Advisory only — never used for gating, and never shown while offline
    // (offline display has priority).
    const showQualityWarning = !isLimited && quality === 'poor';

    useEffect(() => {
        if (isLimited) {
            wasLimited.current = true;
            setShowReconnected(false);
        } else if (wasLimited.current) {
            wasLimited.current = false;
            setShowReconnected(true);
            const timer = setTimeout(() => setShowReconnected(false), 2500);
            return () => clearTimeout(timer);
        }
    }, [isLimited]);

    const handleReconnect = async () => {
        if (reconnecting) return;
        setReconnecting(true);
        try {
            // Coalesced verification through the monitor — not Network.getStatus.
            const result = await requestConnectivityCheck();
            // Only a VERIFIED-reachable result may trigger the networked-wallet
            // rebuild; inconclusive results keep the fallback instead of
            // spinning doomed rebuilds.
            if (result === 'online') walletModeStore.set.requestUpgrade();
        } finally {
            setTimeout(() => setReconnecting(false), 800);
        }
    };

    if (isLimited) {
        return (
            <div
                className="fixed top-0 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
            >
                <button
                    type="button"
                    onClick={handleReconnect}
                    disabled={reconnecting}
                    aria-live="polite"
                    className="pointer-events-auto flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-full shadow-lg bg-amber-50 border border-amber-200 text-amber-800 font-poppins animate-fade-in-up transition-colors disabled:opacity-80"
                >
                    {reconnecting ? (
                        <>
                            <span className="w-3.5 h-3.5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin shrink-0" />
                            <span className="text-xs font-medium">
                                {m['connectivity.reconnecting']()}
                            </span>
                        </>
                    ) : (
                        <>
                            <IonIcon
                                icon={cloudOfflineOutline}
                                className="text-amber-500 text-lg shrink-0"
                            />
                            <span className="text-xs font-medium">
                                {isOffline
                                    ? m['connectivity.offlineTitle']()
                                    : m['connectivity.limitedTitle']()}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-semibold text-amber-900 border-l border-amber-200 pl-2.5 ml-0.5">
                                <IonIcon icon={refreshOutline} className="text-sm" />
                                {m['connectivity.reconnect']()}
                            </span>
                        </>
                    )}
                </button>
            </div>
        );
    }

    if (showReconnected) {
        return (
            <div
                className="fixed top-0 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
            >
                <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-poppins animate-fade-in-up">
                    <IonIcon icon={wifiOutline} className="text-emerald-500 text-lg shrink-0" />
                    <span className="text-xs font-medium">{m['connectivity.backOnline']()}</span>
                </div>
            </div>
        );
    }

    if (showQualityWarning) {
        return (
            <div
                className="fixed top-0 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
            >
                <div
                    role="status"
                    aria-live="polite"
                    className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg bg-amber-50 border border-amber-200 text-amber-800 font-poppins animate-fade-in-up"
                >
                    <IonIcon
                        icon={warningOutline}
                        className="text-amber-500 text-lg shrink-0"
                        aria-hidden="true"
                    />
                    <span className="text-xs font-medium">{m['connectivity.slowUnstable']()}</span>
                </div>
            </div>
        );
    }

    return null;
};

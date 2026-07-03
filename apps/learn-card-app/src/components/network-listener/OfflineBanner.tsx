import React, { useEffect, useRef, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { cloudOfflineOutline, wifiOutline, refreshOutline } from 'ionicons/icons';
import { Network } from '@capacitor/network';
import { connectivityStore, walletModeStore } from 'learn-card-base';

export const OfflineBanner: React.FC = () => {
    const connectivity = connectivityStore.use.status();
    const walletMode = walletModeStore.use.mode();

    const [reconnecting, setReconnecting] = useState(false);
    const [showReconnected, setShowReconnected] = useState(false);
    const wasLimited = useRef(false);

    // "Limited" whenever the device is offline OR the wallet is running on the
    // local fallback (network was unavailable when it was built).
    const isLimited = connectivity === 'offline' || walletMode === 'offline';

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
            const status = await Network.getStatus();
            connectivityStore.set.report(status.connected);
            // Force a networked-wallet rebuild attempt even if the device was
            // already "online" but the wallet is stuck on the local fallback.
            if (status.connected) walletModeStore.set.requestUpgrade();
        } finally {
            setTimeout(() => setReconnecting(false), 800);
        }
    };

    if (!isLimited && !showReconnected) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
        >
            {isLimited ? (
                <button
                    type="button"
                    onClick={handleReconnect}
                    disabled={reconnecting}
                    className="pointer-events-auto flex items-center gap-2.5 pl-4 pr-3 py-2.5 rounded-full shadow-lg bg-amber-50 border border-amber-200 text-amber-800 font-poppins animate-fade-in-up transition-colors disabled:opacity-80"
                >
                    {reconnecting ? (
                        <>
                            <span className="w-3.5 h-3.5 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin shrink-0" />
                            <span className="text-xs font-medium">Reconnecting…</span>
                        </>
                    ) : (
                        <>
                            <IonIcon
                                icon={cloudOfflineOutline}
                                className="text-amber-500 text-lg shrink-0"
                            />
                            <span className="text-xs font-medium">You're offline</span>
                            <span className="flex items-center gap-1 text-xs font-semibold text-amber-900 border-l border-amber-200 pl-2.5 ml-0.5">
                                <IonIcon icon={refreshOutline} className="text-sm" />
                                Reconnect
                            </span>
                        </>
                    )}
                </button>
            ) : (
                <div className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-poppins animate-fade-in-up">
                    <IonIcon icon={wifiOutline} className="text-emerald-500 text-lg shrink-0" />
                    <span className="text-xs font-medium">Back online</span>
                </div>
            )}
        </div>
    );
};

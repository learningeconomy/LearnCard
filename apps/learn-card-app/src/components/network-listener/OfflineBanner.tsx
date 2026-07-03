import React, { useEffect, useState, useRef } from 'react';
import { IonIcon } from '@ionic/react';
import { cloudOfflineOutline, wifiOutline } from 'ionicons/icons';
import { connectivityStore } from 'learn-card-base';

export const OfflineBanner: React.FC = () => {
    const status = connectivityStore.use.status();
    const [showReconnect, setShowReconnect] = useState(false);
    const wasOffline = useRef(false);

    useEffect(() => {
        if (status === 'offline') {
            wasOffline.current = true;
            setShowReconnect(false);
        } else if (status === 'online' && wasOffline.current) {
            wasOffline.current = false;
            setShowReconnect(true);

            const timer = setTimeout(() => {
                setShowReconnect(false);
            }, 2500);

            return () => clearTimeout(timer);
        }
    }, [status]);

    const isVisible = status === 'offline' || showReconnect;

    if (!isVisible) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999] flex justify-center px-4 pointer-events-none"
            style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
        >
            <div
                className={`
                    pointer-events-auto
                    flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg
                    animate-fade-in-up transition-colors duration-300
                    ${
                        status === 'offline'
                            ? 'bg-amber-50 border border-amber-200 text-amber-800'
                            : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    }
                `}
            >
                <IonIcon
                    icon={status === 'offline' ? cloudOfflineOutline : wifiOutline}
                    className={`text-lg shrink-0 ${
                        status === 'offline' ? 'text-amber-500' : 'text-emerald-500'
                    }`}
                />
                <span className="text-xs font-medium font-poppins">
                    {status === 'offline'
                        ? "You're offline. Showing saved items on this device."
                        : 'Back online — refreshing…'}
                </span>
            </div>
        </div>
    );
};

import React, { useState, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { shieldOutline, closeOutline } from 'ionicons/icons';

const DISMISS_KEY = 'lc_recovery_banner_dismissed';

interface RecoveryBannerProps {
    recoveryMethodCount: number | null;
    onSetup: () => void;
}

export const RecoveryBanner: React.FC<RecoveryBannerProps> = ({
    recoveryMethodCount,
    onSetup,
}) => {
    const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

    useEffect(() => {
        const wasDismissed = localStorage.getItem(DISMISS_KEY) === 'true';
        setDismissed(wasDismissed);
    }, []);

    // Don't render until we've checked, or if the user has recovery methods, or if dismissed
    if (recoveryMethodCount === null || recoveryMethodCount > 0 || dismissed) {
        return null;
    }

    const handleDismiss = () => {
        localStorage.setItem(DISMISS_KEY, 'true');
        setDismissed(true);
    };

    return (
        <button
            onClick={onSetup}
            className="w-full max-w-[600px] mt-4 flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-left transition-colors hover:bg-amber-100 group"
        >
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 group-hover:bg-amber-200 transition-colors">
                <IonIcon icon={shieldOutline} className="text-amber-600 text-lg" />
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-grayscale-900 leading-tight">
                    Protect your account
                </p>

                <p className="text-xs text-grayscale-600 leading-snug mt-0.5">
                    Set up recovery so you can get back in if you lose this device.
                </p>
            </div>

            <div
                role="button"
                tabIndex={0}
                onClick={e => {
                    e.stopPropagation();
                    handleDismiss();
                }}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        handleDismiss();
                    }
                }}
                className="p-1 rounded-full hover:bg-amber-200 transition-colors shrink-0"
                aria-label="Dismiss"
            >
                <IonIcon icon={closeOutline} className="text-grayscale-500 text-lg" />
            </div>
        </button>
    );
};

export default RecoveryBanner;

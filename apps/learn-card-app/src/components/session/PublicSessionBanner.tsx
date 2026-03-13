import React, { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { shieldCheckmarkOutline, closeOutline } from 'ionicons/icons';

import { isPublicComputerMode } from '@learncard/sss-key-manager';

interface PublicSessionBannerProps {
    isLoggedIn?: boolean;
    recoveryMethodCount: number | null;
    onSetupRecovery: () => void;
}

/**
 * Inline warning banner for public/shared computer sessions.
 *
 * - Clickable → opens recovery setup
 * - Auto-hides when recovery methods are configured
 * - Dismissible via × button
 * - Installs a `beforeunload` handler while in public mode
 */
const PublicSessionBanner: React.FC<PublicSessionBannerProps> = ({
    isLoggedIn = false,
    recoveryMethodCount,
    onSetupRecovery,
}) => {
    const isPublic = isPublicComputerMode();
    const [dismissed, setDismissed] = useState(false);

    const hasRecovery = recoveryMethodCount !== null && recoveryMethodCount > 0;
    const visible = isPublic && isLoggedIn && !hasRecovery && !dismissed;

    useEffect(() => {
        if (!isPublic) return;

        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };

        window.addEventListener('beforeunload', handler);

        return () => window.removeEventListener('beforeunload', handler);
    }, [isPublic]);

    if (!visible) return null;

    return (
        <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-center gap-3">
            <button
                onClick={onSetupRecovery}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
                <IonIcon icon={shieldCheckmarkOutline} className="text-amber-600 text-base shrink-0" />

                <span className="text-xs text-amber-800 font-medium">
                    Temporary session — <span className="underline">set up a recovery method</span> so you can sign back in later.
                </span>
            </button>

            <button
                onClick={() => setDismissed(true)}
                className="p-0.5 rounded hover:bg-amber-100 transition-colors shrink-0"
                title="Dismiss"
            >
                <IonIcon icon={closeOutline} className="text-amber-400 text-sm" />
            </button>
        </div>
    );
};

export default PublicSessionBanner;

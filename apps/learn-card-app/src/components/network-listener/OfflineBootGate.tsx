import React, { useState } from 'react';
import { Overlay } from 'learn-card-base';
import { IonIcon } from '@ionic/react';
import { cloudOfflineOutline } from 'ionicons/icons';
import { Network } from '@capacitor/network';
import { connectivityStore } from 'learn-card-base';

export const OfflineBootGate: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleTryAgain = async () => {
        setIsLoading(true);
        try {
            // Add a small delay so the user sees the spinner
            await new Promise(resolve => setTimeout(resolve, 600));
            const status = await Network.getStatus();
            connectivityStore.set.report(status.connected);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Overlay>
            <div className="p-8 text-center space-y-5">
                <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                    <IonIcon icon={cloudOfflineOutline} className="text-amber-500 text-3xl" />
                </div>

                <div className="space-y-1 mb-6">
                    <h2 className="text-xl font-semibold text-grayscale-900">You're offline</h2>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        Sign in works once you're back online.
                    </p>
                </div>

                <button
                    onClick={handleTryAgain}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Checking...
                        </span>
                    ) : (
                        'Try Again'
                    )}
                </button>
            </div>
        </Overlay>
    );
};

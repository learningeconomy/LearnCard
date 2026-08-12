import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { cloudOfflineOutline } from 'ionicons/icons';

interface AppEmbedOfflineStateProps {
    appName?: string;
    onRetry: () => void | Promise<void>;
    className?: string;
}

export const AppEmbedOfflineState: React.FC<AppEmbedOfflineStateProps> = ({
    appName,
    onRetry,
    className = '',
}) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleTryAgain = async () => {
        setIsLoading(true);
        try {
            await onRetry();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className={`flex flex-col items-center justify-center p-8 text-center h-full w-full font-poppins bg-white ${className}`}
        >
            <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <IonIcon icon={cloudOfflineOutline} className="text-amber-500 text-3xl" />
            </div>

            <div className="space-y-1 mb-6 max-w-xs">
                <h2 className="text-xl font-semibold text-grayscale-900">You're offline</h2>
                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {appName || 'This app'} needs an internet connection. Reconnect to open it.
                </p>
            </div>

            <button
                onClick={handleTryAgain}
                disabled={isLoading}
                className="w-full max-w-[200px] py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
    );
};

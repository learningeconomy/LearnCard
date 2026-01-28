import React, { useState, useEffect } from 'react';

import sdkActivityStore from '../../stores/sdkActivityStore';

const FRIENDLY_MESSAGES = [
    'One moment...',
    'Preparing...',
    'Opening...',
    'Almost ready...',
    'Getting things ready...',
];

/**
 * A subtle fixed-position loading indicator that appears at the top-center
 * when SDK/partner-connect operations are in progress.
 */
const SdkActivityIndicator: React.FC = () => {
    const isActive = sdkActivityStore.use.isActive();
    const [messageIndex, setMessageIndex] = useState(0);

    // Rotate through friendly messages
    useEffect(() => {
        if (!isActive) {
            setMessageIndex(0);
            return;
        }

        const interval = setInterval(() => {
            setMessageIndex(prev => (prev + 1) % FRIENDLY_MESSAGES.length);
        }, 2000);

        return () => clearInterval(interval);
    }, [isActive]);

    if (!isActive) return null;

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[999991] animate-fade-in">
            <div className="relative flex items-center justify-center">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 opacity-20 blur-md animate-pulse" />

                {/* Main pill */}
                <div className="relative flex items-center gap-2.5 bg-gradient-to-r from-slate-900 to-slate-800 rounded-full pl-3 pr-4 py-2 shadow-2xl border border-white/10">
                    {/* Animated spinner */}
                    <div className="relative h-4 w-4">
                        <div className="absolute inset-0 rounded-full border-2 border-violet-400/30" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-400 animate-spin" />
                    </div>

                    {/* Rotating friendly text */}
                    <span className="text-xs font-medium bg-gradient-to-r from-violet-200 to-indigo-200 bg-clip-text text-transparent min-w-[100px] transition-opacity duration-300">
                        {FRIENDLY_MESSAGES[messageIndex]}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SdkActivityIndicator;

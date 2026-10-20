/**
 * Error overlay — shown when the coordinator reaches the 'error' state.
 * Offers Retry (if canRetry) and Log Out.
 */

import React from 'react';

import { Overlay } from './Overlay';

// Never render raw service errors: some providers embed credentials in them.
const displayError = (error: string): string => {
    if (/token is used|duplicate token|sign-in is already completing in another tab/i.test(error)) {
        return 'Sign-in is already completing in another tab. Please wait a moment and try again.';
    }
    if (/network|offline|failed to fetch|connection/i.test(error)) {
        return 'Connection issue. Please check your internet and try again.';
    }
    return 'We couldn’t finish signing you in. Please try again.';
};

interface ErrorOverlayProps {
    error: string;
    canRetry: boolean;
    onRetry: () => void;
    onLogout: () => void;
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({
    error,
    canRetry,
    onRetry,
    onLogout,
}) => (
    <Overlay onDismiss={onLogout}>
        <div className="p-8 text-center space-y-v3-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-red-500 text-2xl font-semibold">!</span>
            </div>

            <div className="space-y-v3-2">
                <h2 className="text-xl font-semibold text-grayscale-900">Something went wrong</h2>

                <p className="text-sm text-grayscale-600 leading-relaxed">{displayError(error)}</p>
            </div>

            <div className="space-y-v3-3 pt-1">
                {canRetry && (
                    <button
                        onClick={onRetry}
                        className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        Try Again
                    </button>
                )}

                <button
                    onClick={onLogout}
                    className="w-full py-3 px-4 rounded-[20px] border border-grayscale-300 text-grayscale-700 font-medium hover:bg-grayscale-10 transition-colors"
                >
                    Log Out
                </button>
            </div>
        </div>
    </Overlay>
);

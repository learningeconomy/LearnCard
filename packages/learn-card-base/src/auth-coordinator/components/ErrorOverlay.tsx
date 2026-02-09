/**
 * Error overlay — shown when the coordinator reaches the 'error' state.
 * Offers Retry (if canRetry) and Log Out.
 */

import React from 'react';

import { Overlay } from './Overlay';

interface ErrorOverlayProps {
    error: string;
    canRetry: boolean;
    onRetry: () => void;
    onLogout: () => void;
}

export const ErrorOverlay: React.FC<ErrorOverlayProps> = ({ error, canRetry, onRetry, onLogout }) => (
    <Overlay>
        <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl">!</span>
            </div>

            <h2 className="text-xl font-bold">Something went wrong</h2>

            <p className="text-sm text-gray-600">{error}</p>

            <div className="space-y-2 pt-2">
                {canRetry && (
                    <button
                        onClick={onRetry}
                        className="w-full py-3 px-4 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
                    >
                        Try Again
                    </button>
                )}

                <button
                    onClick={onLogout}
                    className="w-full py-3 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                    Log Out
                </button>
            </div>
        </div>
    </Overlay>
);

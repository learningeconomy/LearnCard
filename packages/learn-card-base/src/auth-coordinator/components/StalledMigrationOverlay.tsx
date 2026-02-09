/**
 * Stalled-migration overlay — shown when the coordinator is stuck in
 * 'needs_migration' but has no migrationData (key extraction failed).
 * Offers Retry and Log Out.
 */

import React from 'react';

import { Overlay } from './Overlay';

interface StalledMigrationOverlayProps {
    onRetry: () => void;
    onLogout: () => void;
}

export const StalledMigrationOverlay: React.FC<StalledMigrationOverlayProps> = ({ onRetry, onLogout }) => (
    <Overlay>
        <div className="p-8 text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
                <span className="text-amber-500 text-2xl">⚠</span>
            </div>

            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-grayscale-900">Account Upgrade Needed</h2>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    We're upgrading your account security but couldn't finish
                    automatically. Please try again.
                </p>
            </div>

            <div className="space-y-3 pt-1">
                <button
                    onClick={onRetry}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium hover:opacity-90 transition-opacity"
                >
                    Try Again
                </button>

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

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
        <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-yellow-600 text-xl">⚠</span>
            </div>

            <h2 className="text-xl font-bold">Migration Required</h2>

            <p className="text-sm text-gray-600">
                We need to upgrade your account security, but couldn't complete it
                automatically. Please try again or log out and retry.
            </p>

            <div className="space-y-2 pt-2">
                <button
                    onClick={onRetry}
                    className="w-full py-3 px-4 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
                >
                    Retry Migration
                </button>

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

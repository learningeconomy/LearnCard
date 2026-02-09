/**
 * Fullscreen overlay backdrop used for recovery, error, and migration modals.
 */

import React from 'react';

export const Overlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-[480px] w-full mx-4 max-h-[90vh] overflow-y-auto">
            {children}
        </div>
    </div>
);

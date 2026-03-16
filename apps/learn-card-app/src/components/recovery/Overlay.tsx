/**
 * Fullscreen overlay backdrop used for recovery, error, and migration modals.
 */

import React from 'react';

export const Overlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto bg-black/50 backdrop-blur-sm animate-fade-in-up font-poppins p-4">
        <div className="bg-white rounded-[20px] shadow-2xl max-w-[480px] w-full mx-auto my-auto shrink-0">
            {children}
        </div>
    </div>
);

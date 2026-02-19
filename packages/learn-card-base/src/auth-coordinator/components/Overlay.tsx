/**
 * Fullscreen overlay backdrop used for recovery, error, and migration modals.
 */

import React from 'react';

export const Overlay: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto bg-black/50 backdrop-blur-sm animate-fade-in-up font-poppins sm:p-4">
        <div className="bg-white sm:rounded-[20px] shadow-2xl sm:max-w-[480px] w-full min-h-full sm:min-h-0 mx-auto sm:my-auto shrink-0">
            {children}
        </div>
    </div>
);

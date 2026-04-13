import React from 'react';

import { useWallet } from '../context/WalletContext';

interface BulkActionBarProps {
    selectedCount: number;
    onIssueAll: () => void;
    onSendAll: () => void;
    onClearSelection: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
    selectedCount,
    onIssueAll,
    onSendAll,
    onClearSelection,
}) => {
    const { status } = useWallet();
    const isConnected = status === 'connected';

    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl backdrop-blur-sm">
            <span className="text-sm text-gray-300 font-medium">
                {selectedCount} selected
            </span>

            <div className="w-px h-5 bg-gray-700" />

            <button
                onClick={onIssueAll}
                disabled={!isConnected}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                title={!isConnected ? 'Connect wallet first' : undefined}
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Issue All to Self
            </button>

            <button
                onClick={onSendAll}
                disabled={!isConnected}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
                title={!isConnected ? 'Connect wallet first' : undefined}
            >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send All
            </button>

            <div className="w-px h-5 bg-gray-700" />

            <button
                onClick={onClearSelection}
                className="px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
                Clear
            </button>
        </div>
    );
};

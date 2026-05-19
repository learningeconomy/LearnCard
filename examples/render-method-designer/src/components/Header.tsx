import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';

export const Header: React.FC = () => {
    const { did, seed, status, error, connect, disconnect, generateSeed } = useWallet();
    const [pendingSeed, setPendingSeed] = useState(seed ?? '');

    const connecting = status === 'connecting';
    const connected = status === 'connected';

    const handleGenerate = () => {
        const s = generateSeed();
        setPendingSeed(s);
    };

    const handleConnect = async () => {
        if (!pendingSeed.trim()) return;
        await connect(pendingSeed.trim());
    };

    return (
        <header className="flex-shrink-0 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm z-10">
            <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                        <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4 6h16M4 12h10M4 18h16"
                            />
                        </svg>
                    </div>
                    <h1 className="text-sm font-bold text-white">Render Method Designer</h1>
                </div>

                <div className="flex-1" />

                {!connected && (
                    <>
                        <input
                            type="text"
                            value={pendingSeed}
                            onChange={e => setPendingSeed(e.target.value)}
                            placeholder="Hex seed (64 chars) or any string..."
                            className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-72"
                        />
                        <button
                            type="button"
                            onClick={handleGenerate}
                            className="px-2.5 py-1.5 text-[11px] text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        >
                            Random
                        </button>
                        <button
                            type="button"
                            onClick={handleConnect}
                            disabled={connecting || !pendingSeed.trim()}
                            className="px-3 py-1.5 text-xs font-medium bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 rounded-lg cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {connecting ? 'Connecting…' : 'Connect Wallet'}
                        </button>
                    </>
                )}

                {connected && did && (
                    <>
                        <span className="text-[11px] text-gray-500 font-mono truncate max-w-[280px]">
                            {did}
                        </span>
                        <button
                            type="button"
                            onClick={disconnect}
                            className="px-2.5 py-1.5 text-[11px] text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors"
                        >
                            Disconnect
                        </button>
                    </>
                )}

                {error && (
                    <span className="px-2 py-1 bg-red-900/30 text-red-300 text-[11px] rounded">
                        {error}
                    </span>
                )}
            </div>
        </header>
    );
};

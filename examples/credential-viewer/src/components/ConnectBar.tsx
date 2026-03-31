import React, { useState } from 'react';

import {
    useWallet,
    NETWORK_PRESETS,
    type NetworkEnvKey,
} from '../context/WalletContext';

const ENV_KEYS: NetworkEnvKey[] = ['production', 'staging', 'local', 'custom'];

const ENV_COLORS: Record<NetworkEnvKey, string> = {
    production: 'text-green-400 bg-green-900/30 border-green-800/50',
    staging: 'text-yellow-400 bg-yellow-900/30 border-yellow-800/50',
    local: 'text-orange-400 bg-orange-900/30 border-orange-800/50',
    custom: 'text-purple-400 bg-purple-900/30 border-purple-800/50',
};

const EnvSelector: React.FC = () => {
    const { envKey, envConfig, setEnv, status } = useWallet();
    const [customNetwork, setCustomNetwork] = useState(envKey === 'custom' ? envConfig.network : '');
    const [customCloud, setCustomCloud] = useState(envKey === 'custom' ? envConfig.cloud : '');

    const isConnected = status === 'connected';

    const handleSelect = (key: NetworkEnvKey) => {
        if (isConnected) return;

        if (key !== 'custom') {
            setEnv(key);
        } else {
            setEnv('custom', {
                label: 'Custom',
                network: customNetwork || 'http://localhost:4000/trpc',
                cloud: customCloud || 'http://localhost:4100/trpc',
            });
        }
    };

    const handleCustomBlur = () => {
        if (envKey === 'custom' && customNetwork && customCloud) {
            setEnv('custom', { label: 'Custom', network: customNetwork, cloud: customCloud });
        }
    };

    return (
        <div className="flex items-center gap-1.5">
            {ENV_KEYS.map(key => {
                const label = key === 'custom' ? 'Custom' : NETWORK_PRESETS[key].label;
                const isActive = envKey === key;

                return (
                    <button
                        key={key}
                        onClick={() => handleSelect(key)}
                        disabled={isConnected}
                        className={`px-2 py-1 text-[11px] font-medium rounded-md border transition-colors ${
                            isActive
                                ? ENV_COLORS[key]
                                : 'text-gray-500 bg-transparent border-transparent hover:text-gray-300 hover:bg-gray-800'
                        } ${isConnected ? 'opacity-60 cursor-default' : 'cursor-pointer'}`}
                    >
                        {label}
                    </button>
                );
            })}

            {envKey === 'custom' && !isConnected && (
                <div className="flex items-center gap-1.5 ml-1">
                    <input
                        type="text"
                        value={customNetwork}
                        onChange={e => setCustomNetwork(e.target.value)}
                        onBlur={handleCustomBlur}
                        placeholder="Network URL"
                        className="w-44 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[11px] font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    />

                    <input
                        type="text"
                        value={customCloud}
                        onChange={e => setCustomCloud(e.target.value)}
                        onBlur={handleCustomBlur}
                        placeholder="Cloud URL"
                        className="w-44 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[11px] font-mono text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                </div>
            )}

            {envKey !== 'custom' && (
                <span className="text-[10px] text-gray-600 font-mono ml-1" title={`${envConfig.network} | ${envConfig.cloud}`}>
                    {envConfig.network.replace(/\/trpc$/, '')}
                </span>
            )}
        </div>
    );
};

export const ConnectBar: React.FC = () => {
    const { did, status, error, connect, disconnect, generateSeed, seed, envConfig } = useWallet();
    const [inputSeed, setInputSeed] = useState('');
    const [showSeedInput, setShowSeedInput] = useState(false);

    const handleGenerate = async () => {
        const newSeed = generateSeed();

        setInputSeed(newSeed);
        await connect(newSeed);
    };

    const handleConnect = async () => {
        if (!inputSeed.trim()) return;

        await connect(inputSeed.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleConnect();
    };

    if (status === 'connected' && did) {
        return (
            <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-900/30 border border-green-800/50 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />

                        <span className="text-xs text-green-400 font-medium">Connected</span>
                    </div>

                    <div className="text-xs text-gray-500 font-mono max-w-[200px] truncate" title={did}>
                        {did}
                    </div>

                    <button
                        onClick={disconnect}
                        className="px-2.5 py-1.5 text-xs text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-md transition-colors cursor-pointer"
                    >
                        Disconnect
                    </button>
                </div>

                <EnvSelector />
            </div>
        );
    }

    if (status === 'connecting') {
        return (
            <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-900/20 border border-blue-800/40 rounded-lg">
                    <svg className="w-4 h-4 animate-spin text-blue-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>

                    <span className="text-xs text-blue-400">Initializing wallet...</span>
                </div>

                <span className="text-[10px] text-gray-600 font-mono">
                    {envConfig.network.replace(/\/trpc$/, '')}
                </span>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-end gap-2">
            <EnvSelector />

            {!showSeedInput ? (
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleGenerate}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Wallet
                    </button>

                    <button
                        onClick={() => setShowSeedInput(true)}
                        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                    >
                        Enter Seed
                    </button>

                    {seed && status === 'disconnected' && (
                        <button
                            onClick={() => connect(seed)}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reconnect
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <input
                        type="password"
                        value={inputSeed}
                        onChange={e => setInputSeed(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="64-char hex seed..."
                        className="w-64 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                        autoFocus
                    />

                    <button
                        onClick={handleConnect}
                        disabled={!inputSeed.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                        Connect
                    </button>

                    <button
                        onClick={() => { setShowSeedInput(false); setInputSeed(''); }}
                        className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-300 cursor-pointer"
                    >
                        Cancel
                    </button>

                    {error && (
                        <span className="text-xs text-red-400 max-w-[200px] truncate" title={error}>
                            {error}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

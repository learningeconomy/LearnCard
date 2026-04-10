import React, { useState, useCallback } from 'react';

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

const ProfileSection: React.FC = () => {
    const { profile, profileLoading, profileError, createProfile } = useWallet();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [displayName, setDisplayName] = useState('');
    const [profileId, setProfileId] = useState('');
    const [creating, setCreating] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleCreate = useCallback(async () => {
        if (!displayName.trim() || !profileId.trim()) return;

        setCreating(true);
        setLocalError(null);

        try {
            await createProfile({
                displayName: displayName.trim(),
                profileId: profileId.trim(),
            });

            setShowCreateForm(false);
            setDisplayName('');
            setProfileId('');
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);

            setLocalError(msg);
        } finally {
            setCreating(false);
        }
    }, [displayName, profileId, createProfile]);

    if (profileLoading) {
        return (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-gray-800/50 rounded-lg">
                <svg className="w-3 h-3 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>

                <span className="text-[11px] text-gray-500">Loading profile...</span>
            </div>
        );
    }

    if (profile) {
        return (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-blue-900/20 border border-blue-800/40 rounded-lg">
                {profile.image ? (
                    <img
                        src={profile.image}
                        alt=""
                        className="w-4 h-4 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                        <span className="text-[8px] text-white font-bold">
                            {profile.displayName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                <span className="text-[11px] text-blue-300 font-medium" title={`Profile: ${profile.profileId}`}>
                    {profile.displayName}
                </span>

                <span className="text-[10px] text-gray-500 font-mono">
                    @{profile.profileId}
                </span>
            </div>
        );
    }

    // No profile — show create prompt or form
    if (!showCreateForm) {
        return (
            <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-amber-400 bg-amber-900/20 border border-amber-800/40 rounded-lg hover:bg-amber-900/30 transition-colors cursor-pointer"
            >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                No LCN Profile — Create One
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Display Name"
                className="w-32 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[11px] text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                autoFocus
            />

            <input
                type="text"
                value={profileId}
                onChange={e => setProfileId(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="profile-id"
                className="w-28 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-[11px] font-mono text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
            />

            <button
                onClick={handleCreate}
                disabled={!displayName.trim() || !profileId.trim() || creating}
                className="px-2.5 py-1 text-[11px] font-medium bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
            >
                {creating ? (
                    <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Creating...
                    </>
                ) : 'Create'}
            </button>

            <button
                onClick={() => { setShowCreateForm(false); setLocalError(null); }}
                className="px-1.5 py-1 text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer"
            >
                Cancel
            </button>

            {(localError || profileError) && (
                <span className="text-[10px] text-red-400 max-w-[180px] truncate" title={localError || profileError || ''}>
                    {localError || profileError}
                </span>
            )}
        </div>
    );
};

const SigningAuthoritySection: React.FC = () => {
    const { profile, signingAuthority, saLoading, saError, ensureSigningAuthority } = useWallet();

    const [setting, setSetting] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSetup = useCallback(async () => {
        setSetting(true);
        setLocalError(null);

        try {
            await ensureSigningAuthority();
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);

            setLocalError(msg);
        } finally {
            setSetting(false);
        }
    }, [ensureSigningAuthority]);

    // Only show if profile exists (SA requires a profile)
    if (!profile) return null;

    if (saLoading || setting) {
        return (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-800/50 rounded-lg">
                <svg className="w-3 h-3 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>

                <span className="text-[10px] text-gray-500">
                    {setting ? 'Setting up...' : 'Checking SA...'}
                </span>
            </div>
        );
    }

    if (signingAuthority) {
        return (
            <div
                className="flex items-center gap-1.5 px-2 py-1 bg-emerald-900/20 border border-emerald-800/40 rounded-lg"
                title={`SA: ${signingAuthority.name}\nEndpoint: ${signingAuthority.endpoint}\nDID: ${signingAuthority.did}`}
            >
                <svg className="w-3 h-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>

                <span className="text-[10px] text-emerald-400 font-medium">
                    SA: {signingAuthority.name}
                </span>
            </div>
        );
    }

    // No SA — show setup button
    return (
        <div className="flex items-center gap-1.5">
            <button
                onClick={handleSetup}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-amber-400 bg-amber-900/20 border border-amber-800/40 rounded-lg hover:bg-amber-900/30 transition-colors cursor-pointer"
            >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Set Up Signing Authority
            </button>

            {(localError || saError) && (
                <span className="text-[10px] text-red-400 max-w-[160px] truncate" title={localError || saError || ''}>
                    {localError || saError}
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

                    <ProfileSection />

                    <SigningAuthoritySection />

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

import React, { useState, useEffect } from 'react';
import { Loader2, Wifi, WifiOff, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLearnCardStore } from '../../stores/learncard';

export const ConnectPanel: React.FC = () => {
    const {
        learnCard,
        isInitializing,
        initError,
        isAdmin,
        profileId,
        initialize,
        disconnect,
    } = useLearnCardStore();

    const [seed, setSeed] = useState('');
    const [networkUrl, setNetworkUrl] = useState('http://localhost:4000/trpc');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Auto-initialize if env vars are set
    useEffect(() => {
        const envSeed = import.meta.env.PUBLIC_USER_SEED;
        const envNetwork = import.meta.env.PUBLIC_NETWORK_URL;

        if (envSeed && !learnCard) {
            setSeed(envSeed);
            if (envNetwork) setNetworkUrl(envNetwork);
            initialize(envSeed, envNetwork || networkUrl);
        }
    }, []);

    const handleConnect = () => {
        if (seed.trim()) {
            initialize(seed, networkUrl);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        setSeed('');
    };

    if (learnCard) {
        return (
            <div className="bg-white border border-apple-gray-200 rounded-apple-lg p-4 shadow-apple-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>

                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-apple-gray-600">Connected</span>

                                {isAdmin && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full flex items-center gap-1">
                                        <Shield className="w-3 h-3" />
                                        Admin
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-apple-gray-400 truncate max-w-[200px]">
                                {profileId || 'No profile'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleDisconnect}
                        className="px-3 py-1.5 text-sm text-apple-gray-500 hover:text-apple-gray-600 hover:bg-apple-gray-100 rounded-full transition-colors"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white border border-apple-gray-200 rounded-apple-lg p-6 shadow-apple-sm">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-apple-gray-100 rounded-full flex items-center justify-center">
                    <WifiOff className="w-5 h-5 text-apple-gray-400" />
                </div>

                <div>
                    <h3 className="font-medium text-apple-gray-600">Connect to LearnCard Network</h3>

                    <p className="text-sm text-apple-gray-400">
                        Enter your seed to connect
                    </p>
                </div>
            </div>

            {initError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-apple flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />

                    <p className="text-sm text-red-700">{initError}</p>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="label">Seed</label>

                    <input
                        type="password"
                        value={seed}
                        onChange={e => setSeed(e.target.value)}
                        placeholder="Enter your wallet seed..."
                        className="input"
                        disabled={isInitializing}
                    />
                </div>

                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-apple-blue hover:underline"
                >
                    {showAdvanced ? 'Hide' : 'Show'} advanced options
                </button>

                {showAdvanced && (
                    <div className="animate-fade-in">
                        <label className="label">Network URL</label>

                        <input
                            type="text"
                            value={networkUrl}
                            onChange={e => setNetworkUrl(e.target.value)}
                            placeholder="http://localhost:4000/trpc"
                            className="input"
                            disabled={isInitializing}
                        />
                    </div>
                )}

                <button
                    onClick={handleConnect}
                    disabled={!seed.trim() || isInitializing}
                    className="btn-primary w-full"
                >
                    {isInitializing ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            <Wifi className="w-4 h-4 mr-2" />
                            Connect
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

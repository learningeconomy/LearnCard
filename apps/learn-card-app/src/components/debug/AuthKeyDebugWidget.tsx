import React, { useState, useEffect, useCallback } from 'react';
import { Bug, X, ChevronDown, ChevronRight, RefreshCw, Trash2, Copy, Check } from 'lucide-react';

import {
    authStore,
    firebaseAuthStore,
    currentUserStore,
    walletStore,
    shouldUseSSSKeyManager,
} from 'learn-card-base';

import { hasDeviceShare, getDeviceShare, clearAllShares } from '@learncard/sss-key-manager';

interface DebugSection {
    title: string;
    isOpen: boolean;
    data: Record<string, unknown>;
}

const WIDGET_ENABLED = import.meta.env.VITE_ENABLE_AUTH_DEBUG_WIDGET === 'true' || 
                       import.meta.env.DEV;

export const AuthKeyDebugWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [sections, setSections] = useState<DebugSection[]>([]);
    const [deviceShareExists, setDeviceShareExists] = useState<boolean | null>(null);
    const [deviceSharePreview, setDeviceSharePreview] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const firebaseUser = firebaseAuthStore.use.currentUser();
    const currentUser = currentUserStore.use.currentUser();
    const wallet = walletStore.use.wallet();
    const typeOfLogin = authStore.use.typeOfLogin();
    const initLoading = authStore.use.initLoading();
    const useSSS = shouldUseSSSKeyManager();

    const checkDeviceShare = useCallback(async () => {
        try {
            const exists = await hasDeviceShare();
            setDeviceShareExists(exists);

            if (exists) {
                const share = await getDeviceShare();
                if (share) {
                    setDeviceSharePreview(share.substring(0, 8) + '...' + share.substring(share.length - 8));
                }
            } else {
                setDeviceSharePreview(null);
            }
        } catch (e) {
            setDeviceShareExists(false);
            setDeviceSharePreview(null);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            checkDeviceShare();
        }
    }, [isOpen, refreshKey, checkDeviceShare]);

    useEffect(() => {
        const walletDid = wallet?.id?.did?.() || null;

        const authSection: DebugSection = {
            title: 'Auth State',
            isOpen: true,
            data: {
                'Login Type': typeOfLogin || 'none',
                'Init Loading': initLoading,
                'Using SSS': useSSS,
                'JWT Present': !!authStore.get.jwt(),
            },
        };

        const firebaseSection: DebugSection = {
            title: 'Firebase',
            isOpen: true,
            data: {
                'UID': firebaseUser?.uid || 'none',
                'Email': firebaseUser?.email || 'none',
                'Phone': firebaseUser?.phoneNumber || 'none',
                'Display Name': firebaseUser?.displayName || 'none',
            },
        };

        const sssSection: DebugSection = {
            title: 'SSS Key Manager',
            isOpen: true,
            data: {
                'SSS Enabled': useSSS,
                'Device Share Exists': deviceShareExists === null ? 'checking...' : deviceShareExists,
                'Device Share': deviceSharePreview || 'none',
            },
        };

        const walletSection: DebugSection = {
            title: 'Wallet',
            isOpen: true,
            data: {
                'Initialized': !!wallet,
                'DID': walletDid ? walletDid.substring(0, 24) + '...' : 'none',
            },
        };

        const userSection: DebugSection = {
            title: 'Current User',
            isOpen: true,
            data: {
                'UID': currentUser?.uid || 'none',
                'Email': currentUser?.email || 'none',
                'Name': currentUser?.name || 'none',
                'Has Private Key': !!currentUser?.privateKey,
                'Base Color': currentUser?.baseColor || 'none',
            },
        };

        setSections([authSection, firebaseSection, sssSection, walletSection, userSection]);
    }, [firebaseUser, currentUser, wallet, typeOfLogin, initLoading, useSSS, deviceShareExists, deviceSharePreview]);

    const toggleSection = (index: number) => {
        setSections(prev => prev.map((section, i) => 
            i === index ? { ...section, isOpen: !section.isOpen } : section
        ));
    };

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleClearDeviceShare = async () => {
        if (confirm('Clear device share? You will need to recover your key to login again.')) {
            try {
                await clearAllShares();
                await checkDeviceShare();
            } catch (e) {
                console.error('Failed to clear device share:', e);
            }
        }
    };

    const copyToClipboard = async (key: string, value: unknown) => {
        try {
            await navigator.clipboard.writeText(String(value));
            setCopied(key);
            setTimeout(() => setCopied(null), 1500);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    const formatValue = (value: unknown): string => {
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (value === null || value === undefined) return 'none';
        return String(value);
    };

    const getValueColor = (value: unknown): string => {
        if (typeof value === 'boolean') {
            return value ? 'text-green-400' : 'text-red-400';
        }
        if (value === 'none' || value === null || value === undefined) {
            return 'text-gray-500';
        }
        return 'text-cyan-400';
    };

    if (!WIDGET_ENABLED) {
        return null;
    }

    return (
        <React.Fragment>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={
                    'fixed bottom-24 right-4 z-[99999] w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 ' +
                    (isOpen 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-gradient-to-br from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500')
                }
                title="Auth/Key Debug Widget"
            >
                {isOpen ? (
                    <X className="w-5 h-5 text-white" />
                ) : (
                    <Bug className="w-5 h-5 text-white" />
                )}
            </button>

            {isOpen && (
                <div className="fixed bottom-40 right-4 z-[99998] w-80 max-h-[60vh] bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col">
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-between border-b border-gray-700">
                        <div className="flex items-center gap-2">
                            <Bug className="w-4 h-4 text-white" />
                            <span className="text-white font-semibold text-sm">Auth/Key Debug</span>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleRefresh}
                                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                title="Refresh"
                            >
                                <RefreshCw className="w-4 h-4 text-white" />
                            </button>

                            <button
                                onClick={handleClearDeviceShare}
                                className="p-1.5 rounded-lg hover:bg-red-500/50 transition-colors"
                                title="Clear Device Share"
                            >
                                <Trash2 className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {sections.map((section, index) => (
                            <div 
                                key={section.title}
                                className="bg-gray-800 rounded-lg overflow-hidden"
                            >
                                <button
                                    onClick={() => toggleSection(index)}
                                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-700/50 transition-colors text-left"
                                >
                                    <span className="text-xs font-medium text-gray-200">
                                        {section.title}
                                    </span>
                                    {section.isOpen ? (
                                        <ChevronDown className="w-4 h-4 text-gray-400" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    )}
                                </button>

                                {section.isOpen && (
                                    <div className="px-3 pb-2 space-y-1">
                                        {Object.entries(section.data).map(([key, value]) => (
                                            <div 
                                                key={key}
                                                className="flex items-center justify-between text-xs py-1 border-t border-gray-700/50 group"
                                            >
                                                <span className="text-gray-400">{key}</span>

                                                <div className="flex items-center gap-1">
                                                    <span className={getValueColor(value) + ' font-mono text-[10px] max-w-[140px] truncate'}>
                                                        {formatValue(value)}
                                                    </span>

                                                    <button
                                                        onClick={() => copyToClipboard(key, value)}
                                                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-600 transition-all"
                                                        title="Copy value"
                                                    >
                                                        {copied === key ? (
                                                            <Check className="w-3 h-3 text-green-400" />
                                                        ) : (
                                                            <Copy className="w-3 h-3 text-gray-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="px-3 py-2 border-t border-gray-700 bg-gray-800/50">
                        <p className="text-[10px] text-gray-500 text-center">
                            Debug widget enabled in dev mode
                        </p>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};

export default AuthKeyDebugWidget;

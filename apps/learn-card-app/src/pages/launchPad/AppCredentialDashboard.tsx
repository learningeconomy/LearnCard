import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Award, X, Inbox } from 'lucide-react';

import { useWallet } from 'learn-card-base';

import { VC } from '@learncard/types';

import CredentialCard from './CredentialCard';

export interface AppCredentialDashboardProps {
    appId: string;
    appName: string;
    pendingCredential?: { credentialUri: string; boostUri?: string } | null;
}

export interface CredentialRecord {
    uri: string;
    credential?: VC;
    dateEarned: Date;
    status: 'pending' | 'claimed';
    isNew?: boolean;
    boostName?: string;
    boostCategory?: string;
}

export const AppCredentialDashboard: React.FC<AppCredentialDashboardProps> = ({
    appId,
    appName,
    pendingCredential,
}) => {
    const { initWallet } = useWallet();

    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [earnedCredentials, setEarnedCredentials] = useState<CredentialRecord[]>([]);
    const [badgeCount, setBadgeCount] = useState(0);
    const [isNewBadgeAnimating, setIsNewBadgeAnimating] = useState(false);
    const [sessionNewUris, setSessionNewUris] = useState<Set<string>>(new Set());

    const panelRef = useRef<HTMLDivElement>(null);
    const previousSignalRef = useRef<string | null>(null);

    // Fetch credentials from this app using the network API
    const fetchCredentials = useCallback(async () => {
        if (!appId) return;

        setIsLoading(true);
        try {
            const wallet = await initWallet();
            if (!wallet) return;

            // Use the new getMyCredentialsFromApp API to fetch credentials sent by this app
            console.log('wallet', wallet);
            const result = await wallet.invoke.getMyCredentialsFromApp(appId, { limit: 50 });
            console.log('result', result);
            const appCredentials: CredentialRecord[] = [];

            for (const record of result.records) {
                try {
                    // Resolve the credential to get the full VC
                    const vc = await wallet.read.get(record.credentialUri);
                    appCredentials.push({
                        uri: record.credentialUri,
                        credential: vc as VC | undefined,
                        dateEarned: new Date(record.date),
                        status: record.status,
                        isNew: sessionNewUris.has(record.credentialUri),
                        boostName: record.boostName,
                        boostCategory: record.boostCategory,
                    });
                } catch {
                    // Include record even if credential can't be resolved
                    appCredentials.push({
                        uri: record.credentialUri,
                        dateEarned: new Date(record.date),
                        status: record.status,
                        isNew: sessionNewUris.has(record.credentialUri),
                        boostName: record.boostName,
                        boostCategory: record.boostCategory,
                    });
                }
            }

            setEarnedCredentials(appCredentials);
            setBadgeCount(result.totalCount);
        } catch (error) {
            console.error('[AppCredentialDashboard] Error fetching credentials:', error);
        } finally {
            setIsLoading(false);
        }
    }, [appId, initWallet, sessionNewUris]);

    // Fetch on mount
    useEffect(() => {
        fetchCredentials();
    }, []);

    // Handle new credential signal
    useEffect(() => {
        if (
            pendingCredential?.credentialUri &&
            pendingCredential.credentialUri !== previousSignalRef.current
        ) {
            previousSignalRef.current = pendingCredential.credentialUri;

            // Add to session new URIs
            setSessionNewUris(prev => new Set(prev).add(pendingCredential.credentialUri));

            // Trigger badge animation
            setIsNewBadgeAnimating(true);
            setTimeout(() => setIsNewBadgeAnimating(false), 600);

            // Fetch immediately to get the actual credential with correct status
            fetchCredentials();
        }
    }, [pendingCredential, fetchCredentials]);

    // Handle ESC key to close panel
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    // Handle click outside to close panel
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false);
        }
    };

    const togglePanel = () => {
        setIsOpen(prev => !prev);
        if (!isOpen) {
            // Refresh credentials when opening
            fetchCredentials();
        }
    };

    return (
        <>
            {/* Trigger Button with Notification Badge */}
            <button
                onClick={togglePanel}
                className="relative p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors"
                title={`Credentials from ${appName}`}
                aria-label={`View credentials from ${appName}. ${badgeCount} credential${
                    badgeCount !== 1 ? 's' : ''
                } earned.`}
            >
                <Award className="w-5 h-5" />

                {/* Notification Badge */}
                {badgeCount > 0 && (
                    <span
                        className={`
                            absolute -top-1 -right-1 
                            min-w-[18px] h-[18px] 
                            flex items-center justify-center 
                            bg-red-500 text-white text-xs font-bold 
                            rounded-full px-1
                            transition-transform duration-200
                            ${isNewBadgeAnimating ? 'animate-pulse scale-125' : 'scale-100'}
                        `}
                    >
                        {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                )}
            </button>

            {/* Slide-Over Panel with Backdrop - Using portal to escape Ionic stacking context */}
            {isOpen &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[9999] flex justify-end"
                        onClick={handleBackdropClick}
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
                            aria-hidden="true"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <div
                            ref={panelRef}
                            className={`
                            relative 
                            w-full max-w-[400px] 
                            h-full 
                            bg-white 
                            shadow-2xl 
                            flex flex-col
                            transform transition-transform duration-300 ease-out
                            ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                        `}
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="credential-dashboard-title"
                        >
                            {/* Panel Header */}
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
                                <div>
                                    <h2
                                        id="credential-dashboard-title"
                                        className="text-lg font-semibold text-white"
                                    >
                                        Credentials from {appName}
                                    </h2>
                                    <p className="text-sm text-white/80">
                                        {badgeCount} credential{badgeCount !== 1 ? 's' : ''} earned
                                    </p>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                                    aria-label="Close panel"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                                {isLoading && earnedCredentials.length === 0 ? (
                                    // Loading State
                                    <div className="space-y-4">
                                        {[1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className="bg-white rounded-xl p-4 shadow-sm animate-pulse"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-16 h-16 bg-gray-200 rounded-lg" />
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : earnedCredentials.length === 0 ? (
                                    // Empty State
                                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                                            <Inbox className="w-12 h-12 text-indigo-400" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                            No credentials earned yet
                                        </h3>
                                        <p className="text-gray-500 text-sm">
                                            Keep exploring {appName}! Credentials you earn will
                                            appear here.
                                        </p>
                                    </div>
                                ) : (
                                    // Credential List
                                    <div className="space-y-4">
                                        {earnedCredentials.map((record, index) => (
                                            <CredentialCard
                                                key={record.uri}
                                                record={record}
                                                isNew={record.isNew}
                                                index={index}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
        </>
    );
};

export default AppCredentialDashboard;

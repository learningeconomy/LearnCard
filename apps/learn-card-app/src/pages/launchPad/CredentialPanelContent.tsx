import React, { useState, useEffect, useCallback } from 'react';
import { X, Inbox } from 'lucide-react';

import { useWallet } from 'learn-card-base';

import { VC } from '@learncard/types';

import CredentialCard from './CredentialCard';
import { CredentialRecord } from './AppCredentialDashboard';

export interface CredentialPanelContentProps {
    appId: string;
    appName: string;
    onClose: () => void;
    initialNewUris?: Set<string>;
}

const CredentialPanelContent: React.FC<CredentialPanelContentProps> = ({
    appId,
    appName,
    onClose,
    initialNewUris = new Set(),
}) => {
    const { initWallet } = useWallet();
    const [isLoading, setIsLoading] = useState(true);
    const [earnedCredentials, setEarnedCredentials] = useState<CredentialRecord[]>([]);
    const [badgeCount, setBadgeCount] = useState(0);
    const [sessionNewUris] = useState<Set<string>>(initialNewUris);

    const fetchCredentials = useCallback(async () => {
        if (!appId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const wallet = await initWallet();
            if (!wallet) return;

            const result = await wallet.invoke.getMyCredentialsFromApp(appId, { limit: 50 });

            const appCredentials: CredentialRecord[] = [];

            for (const record of result.records) {
                try {
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
            console.error('[CredentialPanelContent] Error fetching credentials:', error);
        } finally {
            setIsLoading(false);
        }
    }, [appId, sessionNewUris]);

    // Fetch on mount
    useEffect(() => {
        fetchCredentials();
    }, [fetchCredentials]);

    // Handle ESC key to close panel
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="flex flex-col h-full bg-white safe-area-top-margin">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-500 to-purple-600">
                <div>
                    <h2 className="text-lg font-semibold text-white">Credentials from {appName}</h2>
                    <p className="text-sm text-white/80">
                        {badgeCount} credential{badgeCount !== 1 ? 's' : ''} earned
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                    aria-label="Close panel"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                {isLoading && earnedCredentials.length === 0 ? (
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
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                            <Inbox className="w-12 h-12 text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">
                            No credentials earned yet
                        </h3>
                        <p className="text-gray-500 text-sm">
                            Keep exploring {appName}! Credentials you earn will appear here.
                        </p>
                    </div>
                ) : (
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
    );
};

export default CredentialPanelContent;

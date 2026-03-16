import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Award } from 'lucide-react';

import { useWallet, useModal, ModalTypes } from 'learn-card-base';

import { VC } from '@learncard/types';

import CredentialPanelContent from './CredentialPanelContent';

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
    const [badgeCount, setBadgeCount] = useState(0);
    const [isNewBadgeAnimating, setIsNewBadgeAnimating] = useState(false);
    const [sessionNewUris, setSessionNewUris] = useState<Set<string>>(new Set());

    const previousSignalRef = useRef<string | null>(null);

    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.Right,
        desktop: ModalTypes.Right,
    });

    const fetchBadgeCount = useCallback(async () => {
        if (!appId) return;
        try {
            const wallet = await initWallet();
            if (!wallet) return;
            const result = await wallet.invoke.getMyCredentialsFromApp(appId, { limit: 1 });
            setBadgeCount(result.totalCount);
        } catch (error) {
            console.error('[AppCredentialDashboard] Error fetching badge count:', error);
        }
    }, [appId, initWallet]);

    useEffect(() => {
        fetchBadgeCount();
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
            const timerId = setTimeout(() => setIsNewBadgeAnimating(false), 600);

            // Update badge count
            fetchBadgeCount();

            return () => clearTimeout(timerId);
        }
    }, [pendingCredential, fetchBadgeCount]);

    const handleClosePanel = () => {
        closeModal();
        setIsOpen(false);
        // Refresh badge count when panel closes
        fetchBadgeCount();
    };

    const openPanel = () => {
        setIsOpen(true);
        newModal(
            <CredentialPanelContent
                appId={appId}
                appName={appName}
                onClose={handleClosePanel}
                initialNewUris={sessionNewUris}
            />,
            {
                onClose: () => {
                    setIsOpen(false);
                    fetchBadgeCount();
                },
            }
        );
    };

    return (
        <>
            {badgeCount > 0 && (
                <button
                    onClick={openPanel}
                    className="relative p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors"
                    title={`Credentials from ${appName}`}
                    aria-label={`View credentials from ${appName}. ${badgeCount} credential${
                        badgeCount !== 1 ? 's' : ''
                    } earned.`}
                >
                    <Award className="w-5 h-5" />
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
                </button>
            )}
        </>
    );
};

export default AppCredentialDashboard;

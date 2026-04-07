import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Award, Bell } from 'lucide-react';

import { useWallet, useModal, ModalTypes } from 'learn-card-base';

import { VC } from '@learncard/types';

import { useQuery } from '@tanstack/react-query';

import CredentialPanelContent from './CredentialPanelContent';

export interface AppCredentialDashboardProps {
    appId: string;
    appName: string;
    pendingCredential?: { credentialUri: string; boostUri?: string } | null;
    onNavigateAction?: (actionPath: string) => void;
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
    onNavigateAction,
}) => {
    const { initWallet } = useWallet();

    // appId is typically the slug (not UUID), so try slug lookup first, then UUID fallback
    const { data: listingId } = useQuery({
        queryKey: ['appDashboard', 'resolveListingId', appId],
        queryFn: async (): Promise<string | null> => {
            const wallet = await initWallet();
            if (!wallet) return null;

            // Try by slug first (most common case)
            const bySlug = await wallet.invoke.getPublicAppStoreListingBySlug(appId);

            if (bySlug?.listing_id) return bySlug.listing_id;

            // Fallback: try by UUID in case appId is already a listing_id
            const byId = await wallet.invoke.getPublicAppStoreListing(appId);

            return byId?.listing_id ?? null;
        },
        enabled: !!appId,
    });

    const [isOpen, setIsOpen] = useState(false);
    const [credentialCount, setCredentialCount] = useState(0);
    const [notificationCount, setNotificationCount] = useState(0);
    const [isNewBadgeAnimating, setIsNewBadgeAnimating] = useState(false);
    const [sessionNewUris, setSessionNewUris] = useState<Set<string>>(new Set());

    const previousSignalRef = useRef<string | null>(null);

    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.Right,
        desktop: ModalTypes.Right,
    });

    const fetchCredentialCount = useCallback(async () => {
        if (!appId) return;
        try {
            const wallet = await initWallet();
            if (!wallet) return;
            const result = await wallet.invoke.getMyCredentialsFromApp(appId, { limit: 1 });
            setCredentialCount(result.totalCount);
        } catch (error) {
            console.error('[AppCredentialDashboard] Error fetching credential count:', error);
        }
    }, [appId, initWallet]);

    const fetchNotificationCount = useCallback(async () => {
        if (!listingId) return;
        try {
            const wallet = await initWallet();
            if (!wallet) return;

            const result = await wallet.invoke.queryNotifications(
                { 'data.metadata.listingId': listingId, read: false, archived: false },
                { limit: 100 }
            );
            console.log("Notifications", result)

            if (result) {
                setNotificationCount(result.notifications.length);
            }
        } catch (error) {
            console.error('[AppCredentialDashboard] Error fetching notification count:', error);
        }
    }, [listingId, initWallet]);

    const fetchBadgeCount = useCallback(async () => {
        await Promise.all([fetchCredentialCount(), fetchNotificationCount()]);
    }, [fetchCredentialCount, fetchNotificationCount]);

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

    const openPanel = (initialTab?: 'credentials' | 'notifications') => {
        setIsOpen(true);
        newModal(
            <CredentialPanelContent
                appId={appId}
                appName={appName}
                listingId={listingId ?? undefined}
                onClose={handleClosePanel}
                initialNewUris={sessionNewUris}
                initialTab={initialTab}
                onNavigateAction={onNavigateAction}
            />,
            {
                onClose: () => {
                    setIsOpen(false);
                    fetchBadgeCount();
                },
            }
        );
    };

    // Re-fetch notification count when listingId resolves (async from usePublicListing)
    useEffect(() => {
        console.log("Listing ID:", listingId);
        if (listingId) {
            fetchNotificationCount();
        }
    }, [listingId, fetchNotificationCount]);

    return (
        <div className="flex items-center gap-3">
            {credentialCount > 0 && (
                <button
                    onClick={() => openPanel('credentials')}
                    className="relative p-2 rounded-full bg-indigo-100 hover:bg-indigo-200 text-indigo-600 transition-colors"
                    title={`Credentials from ${appName}`}
                    aria-label={`View credentials from ${appName}. ${credentialCount} credential${
                        credentialCount !== 1 ? 's' : ''
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
                        {credentialCount > 99 ? '99+' : credentialCount}
                    </span>
                </button>
            )}

            {notificationCount > 0 && (
                <button
                    onClick={() => openPanel('notifications')}
                    className="relative p-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-600 transition-colors"
                    title={`Notifications from ${appName}`}
                    aria-label={`View notifications from ${appName}. ${notificationCount} unread.`}
                >
                    <Bell className="w-5 h-5" />
                    <span
                        className="
                            absolute -top-1 -right-1 
                            min-w-[18px] h-[18px] 
                            flex items-center justify-center 
                            bg-red-500 text-white text-xs font-bold 
                            rounded-full px-1
                        "
                    >
                        {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                </button>
            )}
        </div>
    );
};

export default AppCredentialDashboard;

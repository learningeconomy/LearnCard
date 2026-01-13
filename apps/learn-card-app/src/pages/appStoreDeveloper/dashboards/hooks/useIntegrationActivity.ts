import { useState, useEffect, useRef, useCallback } from 'react';

import { useWallet } from 'learn-card-base';

import type { CredentialTemplate } from '../types';

/**
 * Activity record from unified CredentialActivity API
 */
interface CredentialActivityRecord {
    id: string;
    activityId: string;
    eventType: 'CREATED' | 'DELIVERED' | 'CLAIMED' | 'EXPIRED' | 'FAILED';
    timestamp: string;
    actorProfileId: string;
    recipientType: 'profile' | 'email' | 'phone';
    recipientIdentifier: string;
    boostUri?: string;
    credentialUri?: string;
    inboxCredentialId?: string;
    integrationId?: string;
    source: string;
    metadata?: Record<string, unknown>;
    boost?: {
        id: string;
        name?: string;
        category?: string;
    };
    recipientProfile?: {
        profileId: string;
        displayName?: string;
    };
}

interface CredentialActivityStats {
    total: number;
    created: number;
    delivered: number;
    claimed: number;
    expired: number;
    failed: number;
    claimRate: number;
}

/**
 * Unified activity item for display
 */
export interface ActivityItem {
    id: string;
    type: 'boost' | 'inbox';
    templateName: string;
    templateId: string;
    boostUri?: string;

    // Recipient info
    recipientName: string;
    recipientId?: string;
    recipientEmail?: string;

    // Timestamps
    sentAt: string;
    claimedAt?: string;

    // Status
    status: 'sent' | 'claimed' | 'pending' | 'expired';

    // Original data reference
    credentialUri?: string;
}

export interface IntegrationActivityResult {
    activity: ActivityItem[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;

    // Stats from unified API
    stats: {
        totalSent: number;
        totalClaimed: number;
        pendingClaims: number;
        claimRate: number;
    };
}

/**
 * Hook to fetch unified activity using the new CredentialActivity API.
 * 
 * This replaces the previous complex implementation that combined boost recipients
 * and inbox credentials from separate sources. Now uses a single unified API.
 */
export function useIntegrationActivity(
    templates: CredentialTemplate[],
    options: { limit?: number } = {}
): IntegrationActivityResult {
    const { limit = 20 } = options;
    const { initWallet } = useWallet();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [stats, setStats] = useState<IntegrationActivityResult['stats']>({
        totalSent: 0,
        totalClaimed: 0,
        pendingClaims: 0,
        claimRate: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [fetchKey, setFetchKey] = useState(0);

    // Get boostUris from templates for filtering
    const boostUris = templates.map(t => t.boostUri).filter(Boolean) as string[];

    // Create a map of boostUri -> template for quick lookup
    const templateMap = new Map<string, CredentialTemplate>();

    templates.forEach(t => {
        if (t.boostUri) templateMap.set(t.boostUri, t);
    });

    // Fetch activity and stats
    useEffect(() => {
        let cancelled = false;

        const fetchActivity = async () => {
            try {
                setIsLoading(true);
                const wallet = await initWalletRef.current();

                // Fetch activity records using unified API
                const activityResult = await (wallet.invoke as any).getMyActivities?.({
                    limit,
                });

                // Fetch stats using unified API
                const statsResult = await (wallet.invoke as any).getActivityStats?.({
                    boostUris: boostUris.length > 0 ? boostUris : undefined,
                });


                if (cancelled) return;

                // Transform activity records to ActivityItem format
                const items: ActivityItem[] = [];

                if (activityResult?.records) {
                    for (const record of activityResult.records as CredentialActivityRecord[]) {
                        // Filter by templates if we have them
                        if (boostUris.length > 0 && record.boostUri && !boostUris.includes(record.boostUri)) {
                            continue;
                        }

                        const template = record.boostUri ? templateMap.get(record.boostUri) : undefined;
                        const isInbox = record.recipientType === 'email' || record.recipientType === 'phone';

                        // Determine status from eventType
                        let status: ActivityItem['status'] = 'sent';

                        if (record.eventType === 'CLAIMED') {
                            status = 'claimed';
                        } else if (record.eventType === 'EXPIRED') {
                            status = 'expired';
                        } else if (record.eventType === 'CREATED' && isInbox) {
                            status = 'pending';
                        } else if (record.eventType === 'DELIVERED') {
                            status = 'sent';
                        }

                        items.push({
                            id: record.id,
                            type: isInbox ? 'inbox' : 'boost',
                            templateName: record.boost?.name || template?.name || 'Credential',
                            templateId: template?.id || record.boostUri || record.id,
                            boostUri: record.boostUri,
                            recipientName: record.recipientProfile?.displayName 
                                || record.recipientIdentifier 
                                || 'Unknown',
                            recipientId: record.recipientType === 'profile' ? record.recipientIdentifier : undefined,
                            recipientEmail: record.recipientType === 'email' ? record.recipientIdentifier : undefined,
                            sentAt: record.timestamp,
                            claimedAt: record.eventType === 'CLAIMED' ? record.timestamp : undefined,
                            status,
                            credentialUri: record.credentialUri,
                        });
                    }
                }

                setActivity(items);

                // Set stats from unified API
                if (statsResult) {
                    const apiStats = statsResult as CredentialActivityStats;

                    setStats({
                        totalSent: apiStats.delivered + apiStats.created,
                        totalClaimed: apiStats.claimed,
                        pendingClaims: (apiStats.delivered + apiStats.created) - apiStats.claimed,
                        claimRate: apiStats.claimRate,
                    });
                }

                setError(null);
            } catch (err) {
                if (cancelled) return;
                console.error('[useIntegrationActivity] Failed to fetch activity:', err);
                setError(err instanceof Error ? err : new Error('Failed to fetch activity'));
                setActivity([]);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        };

        fetchActivity();

        return () => {
            cancelled = true;
        };
    }, [boostUris.join(','), limit, fetchKey]);

    // Refetch function
    const refetch = useCallback(() => {
        setFetchKey(k => k + 1);
    }, []);

    return { activity, isLoading, error, refetch, stats };
}

/**
 * Helper to format relative time
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

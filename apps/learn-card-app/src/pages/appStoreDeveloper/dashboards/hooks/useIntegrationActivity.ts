import { useState, useEffect, useRef, useCallback } from 'react';

import { useWallet } from 'learn-card-base';

import type { CredentialTemplate } from '../types';

/**
 * Activity record from unified CredentialActivity API
 * Exported for use in UI components
 */
export interface CredentialActivityRecord {
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

export type CredentialEventType = 'CREATED' | 'DELIVERED' | 'CLAIMED' | 'EXPIRED' | 'FAILED';

/**
 * Get display label for event type
 * CREATED and DELIVERED both display as "Sent" in the UI
 */
export function getEventTypeLabel(eventType: CredentialEventType): string {
    switch (eventType) {
        case 'CREATED': return 'Sent';
        case 'DELIVERED': return 'Sent';
        case 'CLAIMED': return 'Claimed';
        case 'EXPIRED': return 'Expired';
        case 'FAILED': return 'Failed';
    }
}

/**
 * Check if activity is inbox-based (email/phone)
 */
export function isInboxActivity(record: CredentialActivityRecord): boolean {
    return record.recipientType === 'email' || record.recipientType === 'phone';
}

/**
 * Get display name for recipient
 */
export function getRecipientDisplayName(record: CredentialActivityRecord): string {
    return record.recipientProfile?.displayName || record.recipientIdentifier || 'Unknown';
}

/**
 * Get template/credential name for display
 */
export function getActivityName(record: CredentialActivityRecord): string {
    return record.boost?.name || 'Credential';
}

/**
 * Get error message from failed activity metadata
 */
export function getActivityError(record: CredentialActivityRecord): string | undefined {
    if (record.eventType !== 'FAILED') return undefined;
    return record.metadata?.error ? String(record.metadata.error) : undefined;
}

/**
 * Format source for display
 */
export function formatActivitySource(source: string): string {
    if (source === 'claimLink') return 'Claim Link';
    if (source === 'send') return 'API Send';
    return source || 'Unknown';
}

export interface IntegrationActivityResult {
    activity: CredentialActivityRecord[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;

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
 * 
 * @param templates - Credential templates to filter by (optional)
 * @param options.limit - Maximum number of activities to fetch
 * @param options.integrationId - Filter activities by integration ID for accurate per-integration stats
 */
export function useIntegrationActivity(
    templates: CredentialTemplate[],
    options: { limit?: number; integrationId?: string } = {}
): IntegrationActivityResult {
    const { limit = 20, integrationId } = options;
    const { initWallet } = useWallet();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [activity, setActivity] = useState<CredentialActivityRecord[]>([]);
    const [stats, setStats] = useState<IntegrationActivityResult['stats']>({
        totalSent: 0,
        totalClaimed: 0,
        pendingClaims: 0,
        claimRate: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [fetchKey, setFetchKey] = useState(0);

    // Get boostUris from templates for client-side filtering
    const boostUris = templates.map(t => t.boostUri).filter(Boolean) as string[];

    // Fetch activity and stats
    useEffect(() => {
        let cancelled = false;

        const fetchActivity = async () => {
            try {
                setIsLoading(true);
                const wallet = await initWalletRef.current();

                // Fetch activity records using unified API
                // Use integrationId for server-side filtering when available
                const activityResult = await (wallet.invoke as any).getMyActivities?.({
                    limit,
                    integrationId,
                });

                // Fetch stats using unified API with integrationId for accurate per-integration stats
                const statsResult = await (wallet.invoke as any).getActivityStats?.({
                    boostUris: boostUris.length > 0 ? boostUris : undefined,
                    integrationId,
                });

                if (cancelled) return;

                // Pass through all records - server already filters by integrationId
                // Client-side filtering by boostUri is not needed since stats API handles it
                const records: CredentialActivityRecord[] = activityResult?.records || [];

                setActivity(records);

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
    }, [boostUris.join(','), limit, integrationId, fetchKey]);

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

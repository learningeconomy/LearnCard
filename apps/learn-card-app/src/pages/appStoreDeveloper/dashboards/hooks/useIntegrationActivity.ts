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
    totalEvents: number;
    total: number;
    created: number;
    delivered: number;
    claimed: number;
    expired: number;
    failed: number;
    claimRate: number;
}

export type CredentialEventType = 'CREATED' | 'DELIVERED' | 'CLAIMED' | 'EXPIRED' | 'FAILED';

/** Filter options for event type dropdown */
export const EVENT_TYPE_FILTER_OPTIONS: { value: CredentialEventType | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'All Events' },
    { value: 'CREATED', label: 'Sent' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CLAIMED', label: 'Claimed' },
    { value: 'FAILED', label: 'Failed' },
    { value: 'EXPIRED', label: 'Expired' },
];

/**
 * Get display label for event type
 */
export function getEventTypeLabel(eventType: CredentialEventType): string {
    switch (eventType) {
        case 'CREATED':
            return 'Sent';
        case 'DELIVERED':
            return 'Delivered';
        case 'CLAIMED':
            return 'Claimed';
        case 'EXPIRED':
            return 'Expired';
        case 'FAILED':
            return 'Failed';
    }
}

/**
 * Get detailed label for activity record, distinguishing auto-delivery
 * - CREATED: Initial send to inbox/email
 * - DELIVERED with recipientProfileId: Auto-delivered to verified user
 * - DELIVERED without recipientProfileId: Direct send to profile
 */
export function getActivityLabel(record: CredentialActivityRecord): string {
    if (record.eventType === 'DELIVERED' && record.recipientProfileId && isInboxActivity(record)) {
        return 'Auto-Delivered';
    }

    return getEventTypeLabel(record.eventType);
}

/**
 * Check if this is an auto-delivery event (DELIVERED to inbox with recipientProfileId)
 */
export function isAutoDelivery(record: CredentialActivityRecord): boolean {
    return (
        record.eventType === 'DELIVERED' && !!record.recipientProfileId && isInboxActivity(record)
    );
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
    switch (source) {
        case 'send':
            return 'API Send';
        case 'sendBoost':
            return 'Boost Send';
        case 'sendCredential':
            return 'Credential Send';
        case 'contract':
            return 'Contract';
        case 'claim':
            return 'Claim';
        case 'inbox':
            return 'Inbox';
        case 'claimLink':
            return 'Claim Link';
        case 'acceptCredential':
            return 'Accept Credential';
        case 'appEvent':
            return 'App Event';
        default:
            return source || 'Unknown';
    }
}

export interface IntegrationActivityResult {
    activity: CredentialActivityRecord[];
    isLoading: boolean;
    isLoadingMore: boolean;
    hasMore: boolean;
    error: Error | null;
    refetch: () => void;
    loadMore: () => Promise<void>;

    stats: {
        totalSent: number;
        totalClaimed: number;
        total: number;
        totalEvents: number;
        expired: number;
        failed: number;
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
 * @param options.listingId - Filter activities by app listing ID for per-app stats
 * @param options.eventType - Filter activities by event type (optional)
 */
export function useIntegrationActivity(
    templates: CredentialTemplate[],
    options: {
        limit?: number;
        integrationId?: string;
        listingId?: string;
        eventType?: CredentialEventType;
    } = {}
): IntegrationActivityResult {
    const { limit = 25, integrationId, listingId, eventType } = options;
    const { initWallet } = useWallet();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [activity, setActivity] = useState<CredentialActivityRecord[]>([]);
    const [stats, setStats] = useState<IntegrationActivityResult['stats']>({
        totalSent: 0,
        totalClaimed: 0,
        total: 0,
        totalEvents: 0,
        expired: 0,
        failed: 0,
        pendingClaims: 0,
        claimRate: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
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
                // Use integrationId/listingId for server-side filtering when available
                const activityResult = await (wallet.invoke as any).getMyActivities?.({
                    limit,
                    integrationId,
                    listingId,
                    eventType,
                });

                // Fetch stats using unified API with integrationId/listingId for accurate per-integration/app stats
                // When integrationId or listingId is provided, don't also filter by boostUris — it's redundant
                // and excludes activities without a FOR_BOOST relationship (e.g. embed claims)
                const statsResult = await (wallet.invoke as any).getActivityStats?.({
                    boostUris:
                        !integrationId && !listingId && boostUris.length > 0
                            ? boostUris
                            : undefined,
                    integrationId,
                    listingId,
                });

                if (cancelled) return;

                // Pass through all records - server already filters by integrationId
                // Client-side filtering by boostUri is not needed since stats API handles it
                const records: CredentialActivityRecord[] = activityResult?.records || [];
                const apiHasMore = activityResult?.hasMore ?? false;
                const nextCursor = activityResult?.cursor;

                setActivity(records);
                setHasMore(apiHasMore);
                setCursor(nextCursor);

                // Set stats from unified API
                if (statsResult) {
                    const apiStats = statsResult as CredentialActivityStats;

                    setStats({
                        totalSent: apiStats.delivered + apiStats.created + apiStats.claimed,
                        totalClaimed: apiStats.claimed,
                        total: apiStats.total,
                        totalEvents: apiStats.totalEvents,
                        expired: apiStats.expired,
                        failed: apiStats.failed,
                        pendingClaims: apiStats.delivered + apiStats.created,
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
    }, [boostUris.join(','), limit, integrationId, listingId, eventType, fetchKey]);

    const refetch = useCallback(() => {
        setCursor(undefined);
        setHasMore(false);
        setFetchKey(k => k + 1);
    }, []);

    // Fetches next page and appends to existing activity
    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore || !cursor) return;

        try {
            setIsLoadingMore(true);
            const wallet = await initWalletRef.current();

            const activityResult = await (wallet.invoke as any).getMyActivities?.({
                limit,
                cursor,
                integrationId,
                listingId,
                eventType,
            });

            const records: CredentialActivityRecord[] = activityResult?.records || [];
            const apiHasMore = activityResult?.hasMore ?? false;
            const nextCursor = activityResult?.cursor;

            setActivity(prev => [...prev, ...records]);
            setHasMore(apiHasMore);
            setCursor(nextCursor);
        } catch (err) {
            console.error('[useIntegrationActivity] Failed to load more activity:', err);
            setError(err instanceof Error ? err : new Error('Failed to load more activity'));
        } finally {
            setIsLoadingMore(false);
        }
    }, [isLoadingMore, hasMore, cursor, limit, integrationId, listingId, eventType]);

    return { activity, isLoading, isLoadingMore, hasMore, error, refetch, loadMore, stats };
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

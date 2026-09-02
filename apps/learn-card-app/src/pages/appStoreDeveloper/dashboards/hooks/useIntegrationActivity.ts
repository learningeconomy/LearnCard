import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { useWallet } from 'learn-card-base';
import * as m from '../../../../paraglide/messages.js';

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
    status?: 'active' | 'revoked' | 'suspended';
}

interface CredentialActivityStats {
    totalEvents: number;
    total: number;
    created: number;
    delivered: number;
    claimed: number;
    expired: number;
    failed: number;
    revoked?: number;
    suspended?: number;
    claimRate: number;
}

export type CredentialEventType = 'CREATED' | 'DELIVERED' | 'CLAIMED' | 'EXPIRED' | 'FAILED';

/** Get filter options for event type dropdown (resolved at render for i18n) */
export function getEventTypeFilterOptions(): {
    value: CredentialEventType | 'ALL';
    label: string;
}[] {
    return [
        { value: 'ALL', label: m['developerPortal.dashboards.activity.allEvents']() },
        { value: 'CREATED', label: m['developerPortal.dashboards.activity.sent']() },
        { value: 'DELIVERED', label: m['developerPortal.dashboards.activity.delivered']() },
        { value: 'CLAIMED', label: m['developerPortal.dashboards.activity.claimed']() },
        { value: 'FAILED', label: m['developerPortal.dashboards.activity.failed']() },
        { value: 'EXPIRED', label: m['developerPortal.dashboards.activity.expired']() },
    ];
}

/**
 * Get display label for event type
 */
export function getEventTypeLabel(eventType: CredentialEventType): string {
    switch (eventType) {
        case 'CREATED':
            return m['developerPortal.dashboards.activity.sent']();
        case 'DELIVERED':
            return m['developerPortal.dashboards.activity.delivered']();
        case 'CLAIMED':
            return m['developerPortal.dashboards.activity.claimed']();
        case 'EXPIRED':
            return m['developerPortal.dashboards.activity.expired']();
        case 'FAILED':
            return m['developerPortal.dashboards.activity.failed']();
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
        return m['developerPortal.dashboards.activity.autoDelivered']();
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
    return (
        record.recipientProfile?.displayName ||
        record.recipientIdentifier ||
        m['developerPortal.dashboards.activity.recipientUnknown']()
    );
}

/**
 * Get template/credential name for display
 */
export function getActivityName(record: CredentialActivityRecord): string {
    return record.boost?.name || m['developerPortal.dashboards.activity.credential']();
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
            return m['developerPortal.dashboards.activity.source.apiSend']();
        case 'sendBoost':
            return m['developerPortal.dashboards.activity.source.boostSend']();
        case 'sendCredential':
            return m['developerPortal.dashboards.activity.source.credentialSend']();
        case 'contract':
            return m['developerPortal.dashboards.activity.source.contract']();
        case 'claim':
            return m['developerPortal.dashboards.activity.source.claim']();
        case 'inbox':
            return m['developerPortal.dashboards.activity.source.inbox']();
        case 'claimLink':
            return m['developerPortal.dashboards.activity.source.claimLink']();
        case 'acceptCredential':
            return m['developerPortal.dashboards.activity.source.acceptCredential']();
        case 'appEvent':
            return m['developerPortal.dashboards.activity.source.appEvent']();
        default:
            return source || m['developerPortal.dashboards.activity.source.unknown']();
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
        revoked: number;
        suspended: number;
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
const EMPTY_STATS: IntegrationActivityResult['stats'] = {
    totalSent: 0,
    totalClaimed: 0,
    total: 0,
    totalEvents: 0,
    expired: 0,
    failed: 0,
    revoked: 0,
    suspended: 0,
    pendingClaims: 0,
    claimRate: 0,
};

export function useIntegrationActivity(
    templates: CredentialTemplate[],
    options: {
        limit?: number;
        integrationId?: string;
        listingId?: string;
        eventType?: CredentialEventType;
        boostUri?: string;
    } = {}
): IntegrationActivityResult {
    const { limit = 25, integrationId, listingId, eventType, boostUri } = options;
    const { initWallet } = useWallet();
    const boostUris = templates.map(t => t.boostUri).filter(Boolean) as string[];
    const boostUrisKey = boostUris.join(',');

    const activityQuery = useInfiniteQuery({
        queryKey: ['getMyActivities', { limit, integrationId, listingId, eventType, boostUri }],
        initialPageParam: undefined as string | undefined,
        queryFn: async ({ pageParam }) => {
            const wallet = await initWallet();
            const result = await (wallet.invoke as any).getMyActivities?.({
                limit,
                cursor: pageParam,
                integrationId,
                listingId,
                eventType,
                boostUri,
            });
            return {
                records: (result?.records ?? []) as CredentialActivityRecord[],
                cursor: result?.cursor as string | undefined,
                hasMore: (result?.hasMore ?? false) as boolean,
            };
        },
        getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.cursor : undefined),
    });

    const statsQuery = useQuery({
        queryKey: [
            'getActivityStats',
            { integrationId, listingId, boostUri, boostUris: boostUrisKey },
        ],
        queryFn: async () => {
            const wallet = await initWallet();
            const result = await (wallet.invoke as any).getActivityStats?.({
                boostUris: boostUri
                    ? [boostUri]
                    : !integrationId && !listingId && boostUris.length > 0
                    ? boostUris
                    : undefined,
                integrationId,
                listingId,
                boostUri,
            });
            return (result ?? undefined) as CredentialActivityStats | undefined;
        },
    });

    const activity = activityQuery.data?.pages.flatMap(p => p.records) ?? [];
    const apiStats = statsQuery.data;
    const stats: IntegrationActivityResult['stats'] = apiStats
        ? {
              totalSent: apiStats.delivered + apiStats.created + apiStats.claimed,
              totalClaimed: apiStats.claimed,
              total: apiStats.total,
              totalEvents: apiStats.totalEvents,
              expired: apiStats.expired,
              failed: apiStats.failed,
              revoked: apiStats.revoked ?? 0,
              suspended: apiStats.suspended ?? 0,
              pendingClaims: apiStats.delivered + apiStats.created,
              claimRate: apiStats.claimRate,
          }
        : EMPTY_STATS;

    const refetch = () => {
        activityQuery.refetch();
        statsQuery.refetch();
    };
    const loadMore = async () => {
        if (activityQuery.hasNextPage && !activityQuery.isFetchingNextPage) {
            await activityQuery.fetchNextPage();
        }
    };

    return {
        activity,
        isLoading: activityQuery.isLoading,
        isLoadingMore: activityQuery.isFetchingNextPage,
        hasMore: activityQuery.hasNextPage ?? false,
        error: (activityQuery.error ?? statsQuery.error ?? null) as Error | null,
        refetch,
        loadMore,
        stats,
    };
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

    if (diffMins < 1) return m['developerPortal.dashboards.activity.justNow']();
    if (diffMins < 60)
        return m['developerPortal.dashboards.activity.minutesAgo']({ count: diffMins });
    if (diffHours < 24)
        return m['developerPortal.dashboards.activity.hoursAgo']({ count: diffHours });
    if (diffDays < 7) return m['developerPortal.dashboards.activity.daysAgo']({ count: diffDays });

    return date.toLocaleDateString();
}

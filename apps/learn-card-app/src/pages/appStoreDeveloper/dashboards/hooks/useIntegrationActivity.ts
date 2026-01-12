import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { BoostRecipientInfo } from '@learncard/types';

import { useWallet } from 'learn-card-base';
import { useGetBoostRecipients } from 'learn-card-base';

import type { CredentialTemplate } from '../types';

// Inbox credential type (matches what getMyIssuedCredentials returns)
interface InboxCredential {
    id: string;
    credential: string;
    isSigned: boolean;
    currentStatus: 'PENDING' | 'ISSUED' | 'EXPIRED' | 'DELIVERED' | 'CLAIMED';
    isAccepted?: boolean;
    expiresAt: string;
    createdAt: string;
    issuerDid: string;
    webhookUrl?: string;
    boostUri?: string;
    signingAuthority?: {
        endpoint?: string;
        name?: string;
    };
}

/**
 * Unified activity item representing either:
 * - A boost sent to a profile ID/DID (from getBoostRecipients)
 * - A credential sent to an email via Universal Inbox (from getMyIssuedCredentials)
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

    // Stats derived from activity
    stats: {
        totalSent: number;
        totalClaimed: number;
        pendingClaims: number;
        claimRate: number;
    };
}

/**
 * Hook to fetch unified activity across both:
 * - Boost recipients (credentials sent to profile IDs/DIDs)
 * - Inbox credentials (credentials sent to emails)
 * 
 * Filters by the templates associated with an integration.
 */
export function useIntegrationActivity(
    templates: CredentialTemplate[],
    options: { limit?: number } = {}
): IntegrationActivityResult {
    const { limit = 20 } = options;
    const { initWallet } = useWallet();
    const initWalletRef = useRef(initWallet);
    initWalletRef.current = initWallet;

    const [inboxCredentials, setInboxCredentials] = useState<InboxCredential[]>([]);
    const [inboxLoading, setInboxLoading] = useState(true);
    const [inboxError, setInboxError] = useState<Error | null>(null);
    const [fetchKey, setFetchKey] = useState(0);

    // Get all templates with boostUri
    const templatesWithUri = useMemo(
        () => templates.filter(t => t.boostUri),
        [templates]
    );

    // Create a map of boostUri -> template for quick lookup
    const templateMap = useMemo(() => {
        const map = new Map<string, CredentialTemplate>();

        templatesWithUri.forEach(t => {
            if (t.boostUri) map.set(t.boostUri, t);
        });

        return map;
    }, [templatesWithUri]);

    // Fetch boost recipients for each template (up to 5 to avoid too many requests)
    const template0 = templatesWithUri[0];
    const template1 = templatesWithUri[1];
    const template2 = templatesWithUri[2];
    const template3 = templatesWithUri[3];
    const template4 = templatesWithUri[4];

    const { data: recipients0, isLoading: loading0 } = useGetBoostRecipients(template0?.boostUri ?? null);
    const { data: recipients1, isLoading: loading1 } = useGetBoostRecipients(template1?.boostUri ?? null);
    const { data: recipients2, isLoading: loading2 } = useGetBoostRecipients(template2?.boostUri ?? null);
    const { data: recipients3, isLoading: loading3 } = useGetBoostRecipients(template3?.boostUri ?? null);
    const { data: recipients4, isLoading: loading4 } = useGetBoostRecipients(template4?.boostUri ?? null);

    const boostRecipientsLoading = loading0 || loading1 || loading2 || loading3 || loading4;

    // Fetch inbox credentials
    useEffect(() => {
        let cancelled = false;

        const fetchInboxCredentials = async () => {
            // Don't return early if no templates - still fetch to see what's there
            try {
                setInboxLoading(true);
                const wallet = await initWalletRef.current();

                // Fetch inbox credentials issued by this profile
                // Note: getMySentInboxCredentials is the method exposed by the wallet
                const result = await (wallet.invoke as any).getMySentInboxCredentials?.({ limit: 100 });

                if (cancelled) return;

                if (result?.records) {
                    // Extract boostId from the credential JSON and attach to record
                    const enriched = result.records.map((cred: InboxCredential) => {
                        try {
                            const parsed = JSON.parse(cred.credential);
                            return { ...cred, boostUri: parsed.boostId || cred.boostUri };
                        } catch {
                            return cred;
                        }
                    });

                    // Filter to only credentials for our templates (if we have templates)
                    const boostUris = new Set(templatesWithUri.map(t => t.boostUri).filter(Boolean));

                    const filtered = boostUris.size > 0
                        ? enriched.filter((cred: InboxCredential) => cred.boostUri && boostUris.has(cred.boostUri))
                        : enriched;

                    setInboxCredentials(filtered);
                } else {
                    setInboxCredentials([]);
                }

                setInboxError(null);
            } catch (err) {
                if (cancelled) return;
                console.error('[useIntegrationActivity] Failed to fetch inbox credentials:', err);
                setInboxError(err instanceof Error ? err : new Error('Failed to fetch inbox credentials'));
                setInboxCredentials([]);
            } finally {
                if (!cancelled) {
                    setInboxLoading(false);
                }
            }
        };

        fetchInboxCredentials();

        return () => {
            cancelled = true;
        };
    }, [templatesWithUri, fetchKey]);

    // Refetch function
    const refetch = useCallback(() => {
        setFetchKey(k => k + 1);
    }, []);

    // Combine all activity
    const activity = useMemo(() => {
        const items: ActivityItem[] = [];

        // Add boost recipients
        const addBoostRecipients = (
            recipients: (BoostRecipientInfo & { sent?: string })[] | undefined,
            template: CredentialTemplate | undefined
        ) => {
            if (!recipients || !template) return;

            recipients.forEach((r, idx) => {
                const sentAt = (r as any).sent || new Date().toISOString();
                const isClaimed = Boolean(r.received);

                items.push({
                    id: `boost-${template.id}-${idx}-${sentAt}`,
                    type: 'boost',
                    templateName: template.name,
                    templateId: template.id,
                    boostUri: template.boostUri,
                    recipientName: r.to?.displayName || r.to?.profileId || 'Unknown',
                    recipientId: r.to?.profileId,
                    sentAt,
                    claimedAt: r.received,
                    status: isClaimed ? 'claimed' : 'sent',
                    credentialUri: r.uri,
                });
            });
        };

        addBoostRecipients(recipients0, template0);
        addBoostRecipients(recipients1, template1);
        addBoostRecipients(recipients2, template2);
        addBoostRecipients(recipients3, template3);
        addBoostRecipients(recipients4, template4);

        // Add inbox credentials
        inboxCredentials.forEach((cred) => {
            const template = cred.boostUri ? templateMap.get(cred.boostUri) : undefined;
            const templateName = template?.name || 'Credential';

            let status: ActivityItem['status'] = 'pending';

            if (cred.currentStatus === 'CLAIMED' || cred.isAccepted) {
                status = 'claimed';
            } else if (cred.currentStatus === 'EXPIRED') {
                status = 'expired';
            } else if (cred.currentStatus === 'PENDING' || cred.currentStatus === 'ISSUED' || cred.currentStatus === 'DELIVERED') {
                status = 'pending';
            }

            items.push({
                id: `inbox-${cred.id}`,
                type: 'inbox',
                templateName,
                templateId: template?.id || cred.boostUri || cred.id,
                boostUri: cred.boostUri,
                recipientName: 'Email recipient',
                recipientEmail: undefined,
                sentAt: cred.createdAt,
                claimedAt: status === 'claimed' ? cred.createdAt : undefined,
                status,
            });
        });

        // Sort by sent date descending (most recent first)
        items.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());

        // Return limited results
        return items.slice(0, limit);
    }, [
        recipients0, recipients1, recipients2, recipients3, recipients4,
        template0, template1, template2, template3, template4,
        inboxCredentials, templateMap, limit,
    ]);

    // Calculate stats from all activity (not just limited)
    const stats = useMemo(() => {
        // Count all boost recipients
        let boostSent = 0;
        let boostClaimed = 0;

        const countBoostRecipients = (recipients: (BoostRecipientInfo & { sent?: string })[] | undefined) => {
            if (!recipients) return;

            recipients.forEach(r => {
                boostSent++;

                if (r.received) boostClaimed++;
            });
        };

        countBoostRecipients(recipients0);
        countBoostRecipients(recipients1);
        countBoostRecipients(recipients2);
        countBoostRecipients(recipients3);
        countBoostRecipients(recipients4);

        // Count inbox credentials
        const inboxSent = inboxCredentials.length;
        const inboxClaimed = inboxCredentials.filter(
            c => c.currentStatus === 'CLAIMED' || c.isAccepted
        ).length;

        const totalSent = boostSent + inboxSent;
        const totalClaimed = boostClaimed + inboxClaimed;
        const pendingClaims = totalSent - totalClaimed;
        const claimRate = totalSent > 0 ? Math.round((totalClaimed / totalSent) * 100) : 0;

        return { totalSent, totalClaimed, pendingClaims, claimRate };
    }, [recipients0, recipients1, recipients2, recipients3, recipients4, inboxCredentials]);

    const isLoading = boostRecipientsLoading || inboxLoading;
    const error = inboxError;

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

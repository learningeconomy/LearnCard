import { CredentialRecord } from '@learncard/types';
import { CredentialCategory } from './credentials';

/**
 * A previously current URI retained as app-local refresh history (LC-2117, LC-2135,
 * LC-2136). Entries are stored on the encrypted LearnCloud index record; the old
 * encrypted payload is intentionally retained so holders can inspect prior versions.
 */
export type CredentialRefreshHistoryEntry = {
    uri: string;
    managedVersion?: number;
    effectiveAt?: string;
    capturedAt: string;
    updateSummary?: string;
};

/**
 * Refresh metadata carried on a refreshable LearnCloud index record. Used to discover
 * refresh candidates, correlate notifications, retain locally seen versions, and
 * enforce staleness. The record itself is encrypted by the LearnCloud index plane.
 */
export type CredentialRefreshMetadata = {
    serviceId: string;
    serviceType: string;
    credentialId: string;
    etag?: string;
    managedVersion?: number;
    lastCheckedAt?: string;
    lastUpdatedAt?: string;
    updateSummary?: string;
    unreadUpdate?: boolean;
    history: CredentialRefreshHistoryEntry[];
};

export type CredentialMetadata = {
    category: CredentialCategory;
    /**
     * All holder-driven category changes must set 'manual' so automatic backfills preserve them.
     * Unmarked historical categories are treated as automatic defaults.
     */
    categorySource?: 'manual';
    title?: string;
    imgUrl?: string;
    subcategory?: string;
    from?: string;
    date?: string;
    sharedUris?: Record<string, string[]>; // Full audience cache keys (legacy owner DID keys are retained for selection lookup)
    contractUri?: string;
    boostUri?: string;
    refresh?: CredentialRefreshMetadata;
    __v?: number;
};

export type LCR = CredentialRecord<CredentialMetadata>;

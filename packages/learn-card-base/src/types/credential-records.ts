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
    title?: string;
    imgUrl?: string;
    subcategory?: string;
    from?: string;
    date?: string;
    sharedUris?: Record<string, string[]>; // {'contractUri': ['boostUri1', 'boostUri2']}
    contractUri?: string;
    boostUri?: string;
    refresh?: CredentialRefreshMetadata;
    __v?: number;
};

export type LCR = CredentialRecord<CredentialMetadata>;

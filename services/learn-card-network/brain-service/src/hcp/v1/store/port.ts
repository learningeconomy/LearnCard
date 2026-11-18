/**
 * The persistence port for HCP v1. The service depends only on this interface;
 * `neo4j.ts` is the production adapter and `memory.ts` backs unit tests. Both
 * pass the shared contract in `store.contract.ts`.
 */
import type {
    AccessDetail,
    Assertion,
    Category,
    Content,
    EntryStatus,
    EvidenceItem,
    GrantSource,
    GrantStatus,
    AuditEventType,
    DisclosedEntry,
    InitiatorRole,
    Provenance,
} from '../schemas';

/** Mutable, unversioned state of an entry (Draft 3 §4.2.1: classification and record). */
export type EntryHeader = {
    id: string;
    subjectDid: string;
    status: EntryStatus;
    version: number;
    categories: Category[];
    dimension: string | null;
    /** `classification.permittedPurposes`; null means no limit. */
    permittedPurposes: string[] | null;
    createdAt: string;
    updatedAt: string;
};

/** One immutable version: content, assertion, evidence and its provenance. */
export type EntryVersion = {
    entryId: string;
    subjectDid: string;
    version: number;
    content: Content;
    assertion: Assertion;
    evidence: EvidenceItem[];
    provenance: Provenance;
};

export type EntryRecord = { header: EntryHeader; current: EntryVersion };

export type EntryFilter = {
    categories?: readonly Category[];
    statuses?: readonly EntryStatus[];
    limit: number;
};

export type StoredGrant = {
    grantId: string;
    subjectDid: string;
    client: { id: string; name: string };
    access: AccessDetail[];
    grantType: 'temporary' | 'persistent';
    issuedAt: string;
    expiresAt: string | null;
    status: GrantStatus;
    statusChangedAt: string | null;
    source: GrantSource;
    /** LC-2423: writes become active entries only when true. Grants stored before it read as false. */
    canWrite: boolean;
};

export type StoredEvent = {
    eventId: string;
    eventType: AuditEventType;
    timestamp: string;
    subjectDid: string;
    providerId: string;
    initiator: { role: InitiatorRole; id: string };
    entryId: string | null;
    categories: string[];
    purpose: string | null;
    grantId: string | null;
    data: Record<string, unknown>;
    /** Access-log members (Draft 3 §8.2); absent on lifecycle events. */
    purposeDescription?: string;
    retrievalId?: string;
    disclosed?: DisclosedEntry[];
};

export type EventFilter = {
    eventTypes?: readonly AuditEventType[];
    entryId?: string;
    grantId?: string;
    since?: string;
    until?: string;
};

/** Keyset position: events strictly older than this (timestamp, eventId) pair. */
export type EventPosition = { timestamp: string; eventId: string };

/**
 * Every lifecycle change takes the audit event that records it (Draft 3 §8.1). The
 * adapter writes change and event in one transaction: both commit or neither does,
 * and a change that does not happen (a `false` result) writes no event.
 */
export interface HcpV1Store {
    /** Inserts a new entry, its first version and `event`. */
    insertEntry(entry: EntryRecord, event: StoredEvent): Promise<void>;
    getEntry(subjectDid: string, entryId: string): Promise<EntryRecord | null>;
    getEntryVersion(entryId: string, version: number): Promise<EntryVersion | null>;
    /** Entries for one subject, newest `updatedAt` first, filtered before the limit. */
    listEntries(subjectDid: string, filter: EntryFilter): Promise<EntryRecord[]>;
    /** Every version of every entry the subject holds, oldest first per entry. */
    listVersions(subjectDid: string): Promise<EntryVersion[]>;
    /**
     * Appends `next` as the current version only when the entry's current version is
     * `expectedVersion`, and sets its status. Returns false, changing nothing, otherwise.
     */
    appendVersion(
        entryId: string,
        expectedVersion: number,
        next: EntryVersion,
        status: EntryStatus,
        at: string,
        event: StoredEvent
    ): Promise<boolean>;
    /** Sets status only when the current status is in `from`. Returns whether it changed. */
    transitionEntryStatus(
        entryId: string,
        from: readonly EntryStatus[],
        to: EntryStatus,
        at: string,
        event: StoredEvent
    ): Promise<boolean>;

    /** The grant-scoped ref for an entry: the existing one, or `candidate` stored as new. */
    refFor(grantId: string, entryId: string, candidate: string): Promise<string>;
    resolveRef(grantId: string, ref: string): Promise<string | null>;

    insertGrant(grant: StoredGrant, event: StoredEvent): Promise<void>;
    getGrant(grantId: string): Promise<StoredGrant | null>;
    /** Grants for one subject, newest first. */
    listGrants(subjectDid: string, status: GrantStatus): Promise<StoredGrant[]>;
    /** Moves an active grant to `to`. Returns false when it was not active. */
    transitionGrantStatus(
        grantId: string,
        to: Exclude<GrantStatus, 'active'>,
        at: string,
        event: StoredEvent
    ): Promise<boolean>;

    /** An event with no state change of its own (`context.exported`; LC-2422 reads). */
    appendEvent(event: StoredEvent): Promise<void>;
    /** Events for one subject, newest first, filtered before `limit` is applied. */
    listEvents(
        subjectDid: string,
        filter: EventFilter,
        page: { limit: number; after?: EventPosition }
    ): Promise<StoredEvent[]>;

    /**
     * Deletes everything v1 holds for a subject, in one transaction: entries, all
     * their versions, grants where they are the subject, refs under those grants or
     * to those entries, and their audit events. Idempotent. Used when the profile
     * is deleted; nothing of the subject remains, not even the audit log.
     */
    deleteSubjectData(subjectDid: string): Promise<void>;
}

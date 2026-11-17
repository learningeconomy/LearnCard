/** In-memory HcpV1Store for unit tests. Values are cloned in and out, like a database. */
import type {
    EntryFilter,
    EntryHeader,
    EntryRecord,
    EntryVersion,
    EventFilter,
    EventPosition,
    HcpV1Store,
    StoredEvent,
    StoredGrant,
} from './port';
import type { EntryStatus, GrantStatus } from '../schemas';

const clone = <T>(value: T): T => structuredClone(value);

const newestFirst = (a: { timestamp: string; eventId: string }, b: typeof a): number =>
    a.timestamp === b.timestamp
        ? b.eventId.localeCompare(a.eventId)
        : b.timestamp.localeCompare(a.timestamp);

const isBefore = (event: StoredEvent, position: EventPosition): boolean =>
    event.timestamp < position.timestamp ||
    (event.timestamp === position.timestamp && event.eventId < position.eventId);

export const createMemoryHcpV1Store = (): HcpV1Store => {
    const headers = new Map<string, EntryHeader>();
    const versions = new Map<string, EntryVersion[]>();
    const refs = new Map<string, string>();
    const grants = new Map<string, StoredGrant>();
    const events: StoredEvent[] = [];

    /**
     * Mirrors the Neo4j unique constraint on eventId. Every lifecycle method checks
     * its event before changing anything, so a failure leaves the store untouched.
     */
    const checkEvent = (event: StoredEvent): void => {
        if (events.some(e => e.eventId === event.eventId)) throw new Error('duplicate event id');
    };

    const refKey = (grantId: string, entryId: string): string => `${grantId}\u0000${entryId}`;

    const record = (header: EntryHeader): EntryRecord => {
        const current = versions.get(header.id)?.find(v => v.version === header.version);
        if (!current)
            throw new Error(`HCP v1 memory store: entry ${header.id} has no current version`);
        return clone({ header, current });
    };

    return {
        async insertEntry({ header, current }, event): Promise<void> {
            if (headers.has(header.id)) throw new Error('duplicate entry id');
            checkEvent(event);
            headers.set(header.id, clone(header));
            versions.set(header.id, [clone(current)]);
            events.push(clone(event));
        },

        async getEntry(subjectDid, entryId): Promise<EntryRecord | null> {
            const header = headers.get(entryId);
            return header && header.subjectDid === subjectDid ? record(header) : null;
        },

        async getEntryVersion(entryId, version): Promise<EntryVersion | null> {
            const found = versions.get(entryId)?.find(v => v.version === version);
            return found ? clone(found) : null;
        },

        async listEntries(subjectDid, filter: EntryFilter): Promise<EntryRecord[]> {
            return [...headers.values()]
                .filter(h => h.subjectDid === subjectDid)
                .filter(h => !filter.statuses || filter.statuses.includes(h.status))
                .filter(
                    h =>
                        !filter.categories || h.categories.some(c => filter.categories!.includes(c))
                )
                .sort((a, b) =>
                    a.updatedAt === b.updatedAt
                        ? b.id.localeCompare(a.id)
                        : b.updatedAt.localeCompare(a.updatedAt)
                )
                .slice(0, filter.limit)
                .map(record);
        },

        async listVersions(subjectDid): Promise<EntryVersion[]> {
            return [...versions.values()]
                .flat()
                .filter(v => v.subjectDid === subjectDid)
                .sort((a, b) =>
                    a.entryId === b.entryId
                        ? a.version - b.version
                        : a.entryId.localeCompare(b.entryId)
                )
                .map(clone);
        },

        async appendVersion(entryId, expectedVersion, next, status, at, event): Promise<boolean> {
            const header = headers.get(entryId);
            if (!header || header.version !== expectedVersion) return false;
            checkEvent(event);
            versions.get(entryId)!.push(clone(next));
            headers.set(entryId, { ...header, version: next.version, status, updatedAt: at });
            events.push(clone(event));
            return true;
        },

        async transitionEntryStatus(
            entryId,
            from: readonly EntryStatus[],
            to,
            at,
            event
        ): Promise<boolean> {
            const header = headers.get(entryId);
            if (!header || !from.includes(header.status)) return false;
            checkEvent(event);
            headers.set(entryId, { ...header, status: to, updatedAt: at });
            events.push(clone(event));
            return true;
        },

        async refFor(grantId, entryId, candidate): Promise<string> {
            const key = refKey(grantId, entryId);
            const existing = refs.get(key);
            if (existing) return existing;
            refs.set(key, candidate);
            return candidate;
        },

        async resolveRef(grantId, ref): Promise<string | null> {
            for (const [key, value] of refs) {
                const [keyGrant, entryId] = key.split('\u0000');
                if (keyGrant === grantId && value === ref) return entryId ?? null;
            }
            return null;
        },

        async insertGrant(grant, event): Promise<void> {
            if (grants.has(grant.grantId)) throw new Error('duplicate grant id');
            checkEvent(event);
            grants.set(grant.grantId, clone(grant));
            events.push(clone(event));
        },

        async getGrant(grantId): Promise<StoredGrant | null> {
            const grant = grants.get(grantId);
            return grant ? clone(grant) : null;
        },

        async listGrants(subjectDid, status: GrantStatus): Promise<StoredGrant[]> {
            return [...grants.values()]
                .filter(g => g.subjectDid === subjectDid && g.status === status)
                .sort((a, b) =>
                    a.issuedAt === b.issuedAt
                        ? b.grantId.localeCompare(a.grantId)
                        : b.issuedAt.localeCompare(a.issuedAt)
                )
                .map(clone);
        },

        async transitionGrantStatus(grantId, to, at, event): Promise<boolean> {
            const grant = grants.get(grantId);
            if (!grant || grant.status !== 'active') return false;
            checkEvent(event);
            grants.set(grantId, { ...grant, status: to, statusChangedAt: at });
            events.push(clone(event));
            return true;
        },

        async appendEvent(event): Promise<void> {
            checkEvent(event);
            events.push(clone(event));
        },

        async listEvents(subjectDid, filter: EventFilter, page): Promise<StoredEvent[]> {
            return events
                .filter(e => e.subjectDid === subjectDid)
                .filter(e => !filter.eventTypes || filter.eventTypes.includes(e.eventType))
                .filter(e => !filter.entryId || e.entryId === filter.entryId)
                .filter(e => !filter.grantId || e.grantId === filter.grantId)
                .filter(e => !filter.since || e.timestamp >= filter.since)
                .filter(e => !filter.until || e.timestamp < filter.until)
                .filter(e => !page.after || isBefore(e, page.after))
                .sort(newestFirst)
                .slice(0, page.limit)
                .map(clone);
        },
    };
};

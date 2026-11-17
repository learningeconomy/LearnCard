/**
 * Neo4j adapter for HcpV1Store.
 *
 * v1 owns every label it writes, all prefixed `HcpV1`, and draws no relationship
 * into the rest of the brain graph. Shedding v1 is: delete `src/hcp/v1`, its mount
 * line in `src/hcp/index.ts`, and `MATCH (n) WHERE any(l IN labels(n) WHERE l
 * STARTS WITH 'HcpV1') DETACH DELETE n`.
 *
 * Nested values (content, assertion, evidence, provenance, access, data) are JSON
 * strings: they are only ever read whole, never queried by member.
 */
import { int, type ManagedTransaction, type Node } from 'neo4j-driver';
import { neogma } from '@instance';

import type {
    EntryHeader,
    EntryRecord,
    EntryVersion,
    HcpV1Store,
    StoredEvent,
    StoredGrant,
} from './port';

export const HCP_V1_LABELS = [
    'HcpV1ContextEntry',
    'HcpV1EntryVersion',
    'HcpV1EntryRef',
    'HcpV1Grant',
    'HcpV1Event',
] as const;

const SCHEMA_QUERIES = [
    'CREATE CONSTRAINT hcp_v1_entry_id IF NOT EXISTS FOR (n:HcpV1ContextEntry) REQUIRE n.id IS UNIQUE',
    'CREATE CONSTRAINT hcp_v1_entry_version IF NOT EXISTS FOR (n:HcpV1EntryVersion) REQUIRE (n.entryId, n.version) IS UNIQUE',
    'CREATE CONSTRAINT hcp_v1_ref_entry IF NOT EXISTS FOR (n:HcpV1EntryRef) REQUIRE (n.grantId, n.entryId) IS UNIQUE',
    'CREATE CONSTRAINT hcp_v1_ref IF NOT EXISTS FOR (n:HcpV1EntryRef) REQUIRE (n.grantId, n.ref) IS UNIQUE',
    'CREATE CONSTRAINT hcp_v1_grant_id IF NOT EXISTS FOR (n:HcpV1Grant) REQUIRE n.grantId IS UNIQUE',
    'CREATE CONSTRAINT hcp_v1_event_id IF NOT EXISTS FOR (n:HcpV1Event) REQUIRE n.eventId IS UNIQUE',
    'CREATE INDEX hcp_v1_entry_subject IF NOT EXISTS FOR (n:HcpV1ContextEntry) ON (n.subjectDid, n.updatedAt)',
    'CREATE INDEX hcp_v1_version_subject IF NOT EXISTS FOR (n:HcpV1EntryVersion) ON (n.subjectDid)',
    'CREATE INDEX hcp_v1_grant_subject IF NOT EXISTS FOR (n:HcpV1Grant) ON (n.subjectDid, n.status)',
    'CREATE INDEX hcp_v1_event_subject IF NOT EXISTS FOR (n:HcpV1Event) ON (n.subjectDid, n.timestamp)',
];

let schemaReady: Promise<void> | undefined;

/** Idempotent; competing cold starts may race on DDL, which is tolerated. */
const ensureSchema = (): Promise<void> => {
    schemaReady ??= (async (): Promise<void> => {
        const session = neogma.driver.session();
        try {
            for (const query of SCHEMA_QUERIES) {
                try {
                    await session.executeWrite(tx => tx.run(query));
                } catch (error) {
                    if (
                        (error as { code?: string } | null)?.code !==
                        'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists'
                    )
                        throw error;
                }
            }
        } finally {
            await session.close();
        }
    })().catch((error: unknown) => {
        schemaReady = undefined;
        throw error;
    });
    return schemaReady;
};

const write = async <T>(fn: (tx: ManagedTransaction) => Promise<T>): Promise<T> => {
    await ensureSchema();
    const session = neogma.driver.session();
    try {
        return await session.executeWrite(fn);
    } finally {
        await session.close();
    }
};

const read = async <T>(fn: (tx: ManagedTransaction) => Promise<T>): Promise<T> => {
    await ensureSchema();
    const session = neogma.driver.session();
    try {
        return await session.executeRead(fn);
    } finally {
        await session.close();
    }
};

type Props = Record<string, unknown>;

const props = (node: unknown): Props => (node as Node).properties as Props;
const json = (value: unknown): string => JSON.stringify(value);
const parse = <T>(value: unknown): T => JSON.parse(value as string) as T;
const str = (value: unknown): string => value as string;
const strOrNull = (value: unknown): string | null => (value as string | undefined) ?? null;
const num = (value: unknown): number =>
    typeof value === 'number' ? value : (value as { toNumber(): number }).toNumber();

const headerProps = (h: EntryHeader): Props => ({
    id: h.id,
    subjectDid: h.subjectDid,
    status: h.status,
    version: int(h.version),
    categories: h.categories,
    dimension: h.dimension,
    permittedPurposes: h.permittedPurposes === null ? null : json(h.permittedPurposes),
    createdAt: h.createdAt,
    updatedAt: h.updatedAt,
});

const toHeader = (p: Props): EntryHeader => ({
    id: str(p.id),
    subjectDid: str(p.subjectDid),
    status: str(p.status) as EntryHeader['status'],
    version: num(p.version),
    categories: p.categories as EntryHeader['categories'],
    dimension: strOrNull(p.dimension),
    permittedPurposes: p.permittedPurposes == null ? null : parse<string[]>(p.permittedPurposes),
    createdAt: str(p.createdAt),
    updatedAt: str(p.updatedAt),
});

const versionProps = (v: EntryVersion): Props => ({
    entryId: v.entryId,
    subjectDid: v.subjectDid,
    version: int(v.version),
    content: json(v.content),
    assertion: json(v.assertion),
    evidence: json(v.evidence),
    provenance: json(v.provenance),
});

const toVersion = (p: Props): EntryVersion => ({
    entryId: str(p.entryId),
    subjectDid: str(p.subjectDid),
    version: num(p.version),
    content: parse(p.content),
    assertion: parse(p.assertion),
    evidence: parse(p.evidence),
    provenance: parse(p.provenance),
});

const grantProps = (g: StoredGrant): Props => ({
    grantId: g.grantId,
    subjectDid: g.subjectDid,
    clientId: g.client.id,
    clientName: g.client.name,
    access: json(g.access),
    grantType: g.grantType,
    issuedAt: g.issuedAt,
    expiresAt: g.expiresAt,
    status: g.status,
    statusChangedAt: g.statusChangedAt,
    source: json(g.source),
});

const toGrant = (p: Props): StoredGrant => ({
    grantId: str(p.grantId),
    subjectDid: str(p.subjectDid),
    client: { id: str(p.clientId), name: str(p.clientName) },
    access: parse(p.access),
    grantType: str(p.grantType) as StoredGrant['grantType'],
    issuedAt: str(p.issuedAt),
    expiresAt: strOrNull(p.expiresAt),
    status: str(p.status) as StoredGrant['status'],
    statusChangedAt: strOrNull(p.statusChangedAt),
    source: parse(p.source),
});

const eventProps = (e: StoredEvent): Props => ({
    eventId: e.eventId,
    eventType: e.eventType,
    timestamp: e.timestamp,
    subjectDid: e.subjectDid,
    providerId: e.providerId,
    initiatorRole: e.initiator.role,
    initiatorId: e.initiator.id,
    entryId: e.entryId,
    categories: e.categories,
    purpose: e.purpose,
    grantId: e.grantId,
    data: json(e.data),
});

const toEvent = (p: Props): StoredEvent => ({
    eventId: str(p.eventId),
    eventType: str(p.eventType) as StoredEvent['eventType'],
    timestamp: str(p.timestamp),
    subjectDid: str(p.subjectDid),
    providerId: str(p.providerId),
    initiator: {
        role: str(p.initiatorRole) as StoredEvent['initiator']['role'],
        id: str(p.initiatorId),
    },
    entryId: strOrNull(p.entryId),
    categories: (p.categories as string[] | undefined) ?? [],
    purpose: strOrNull(p.purpose),
    grantId: strOrNull(p.grantId),
    data: parse(p.data),
});

const toRecord = (row: { get(key: string): unknown }): EntryRecord => ({
    header: toHeader(props(row.get('e'))),
    current: toVersion(props(row.get('v'))),
});

const CREATE_EVENT = `CREATE (n:HcpV1Event) SET n = $event`;

/** Writes the change's audit event inside the change's transaction (port contract). */
const recordIn = async (tx: ManagedTransaction, event: StoredEvent): Promise<void> => {
    await tx.run(CREATE_EVENT, { event: eventProps(event) });
};

/** Takes the node's write lock before reading it, so a check-then-set is serialized. */
const LOCK_ENTRY = `MATCH (e:HcpV1ContextEntry {id: $entryId})
    SET e._lock = coalesce(e._lock, 0) + 1
    RETURN e`;

export const createNeo4jHcpV1Store = (): HcpV1Store => ({
    async insertEntry({ header, current }, event): Promise<void> {
        await write(async tx => {
            await tx.run(
                `CREATE (e:HcpV1ContextEntry) SET e = $header
                CREATE (v:HcpV1EntryVersion) SET v = $version`,
                { header: headerProps(header), version: versionProps(current) }
            );
            await recordIn(tx, event);
        });
    },

    async getEntry(subjectDid, entryId): Promise<EntryRecord | null> {
        const result = await read(tx =>
            tx.run(
                `MATCH (e:HcpV1ContextEntry {id: $entryId, subjectDid: $subjectDid})
                MATCH (v:HcpV1EntryVersion {entryId: e.id, version: e.version})
                RETURN e, v`,
                { entryId, subjectDid }
            )
        );
        const row = result.records[0];
        return row ? toRecord(row) : null;
    },

    async getEntryVersion(entryId, version): Promise<EntryVersion | null> {
        const result = await read(tx =>
            tx.run(`MATCH (v:HcpV1EntryVersion {entryId: $entryId, version: $version}) RETURN v`, {
                entryId,
                version: int(version),
            })
        );
        const row = result.records[0];
        return row ? toVersion(props(row.get('v'))) : null;
    },

    async listEntries(subjectDid, filter): Promise<EntryRecord[]> {
        const result = await read(tx =>
            tx.run(
                `MATCH (e:HcpV1ContextEntry {subjectDid: $subjectDid})
                WHERE ($statuses IS NULL OR e.status IN $statuses)
                  AND ($categories IS NULL OR any(c IN e.categories WHERE c IN $categories))
                WITH e ORDER BY e.updatedAt DESC, e.id DESC LIMIT $limit
                MATCH (v:HcpV1EntryVersion {entryId: e.id, version: e.version})
                RETURN e, v ORDER BY e.updatedAt DESC, e.id DESC`,
                {
                    subjectDid,
                    statuses: filter.statuses ?? null,
                    categories: filter.categories ?? null,
                    limit: int(filter.limit),
                }
            )
        );
        return result.records.map(toRecord);
    },

    async listVersions(subjectDid): Promise<EntryVersion[]> {
        const result = await read(tx =>
            tx.run(
                `MATCH (v:HcpV1EntryVersion {subjectDid: $subjectDid})
                RETURN v ORDER BY v.entryId, v.version`,
                { subjectDid }
            )
        );
        return result.records.map(row => toVersion(props(row.get('v'))));
    },

    async appendVersion(entryId, expectedVersion, next, status, at, event): Promise<boolean> {
        return write(async tx => {
            const locked = await tx.run(LOCK_ENTRY, { entryId });
            const row = locked.records[0];
            if (!row || num(props(row.get('e')).version) !== expectedVersion) return false;
            await tx.run(
                `MATCH (e:HcpV1ContextEntry {id: $entryId})
                CREATE (v:HcpV1EntryVersion) SET v = $version
                SET e.version = $nextVersion, e.status = $status, e.updatedAt = $at`,
                {
                    entryId,
                    version: versionProps(next),
                    nextVersion: int(next.version),
                    status,
                    at,
                }
            );
            await recordIn(tx, event);
            return true;
        });
    },

    async transitionEntryStatus(entryId, from, to, at, event): Promise<boolean> {
        return write(async tx => {
            const locked = await tx.run(LOCK_ENTRY, { entryId });
            const row = locked.records[0];
            if (!row || !from.includes(str(props(row.get('e')).status) as never)) return false;
            await tx.run(
                `MATCH (e:HcpV1ContextEntry {id: $entryId}) SET e.status = $to, e.updatedAt = $at`,
                { entryId, to, at }
            );
            await recordIn(tx, event);
            return true;
        });
    },

    async refFor(grantId, entryId, candidate): Promise<string> {
        const result = await write(tx =>
            tx.run(
                `MERGE (r:HcpV1EntryRef {grantId: $grantId, entryId: $entryId})
                ON CREATE SET r.ref = $candidate
                RETURN r.ref AS ref`,
                { grantId, entryId, candidate }
            )
        );
        return str(result.records[0]!.get('ref'));
    },

    async resolveRef(grantId, ref): Promise<string | null> {
        const result = await read(tx =>
            tx.run(
                `MATCH (r:HcpV1EntryRef {grantId: $grantId, ref: $ref}) RETURN r.entryId AS entryId`,
                { grantId, ref }
            )
        );
        return strOrNull(result.records[0]?.get('entryId'));
    },

    async insertGrant(grant, event): Promise<void> {
        await write(async tx => {
            await tx.run(`CREATE (g:HcpV1Grant) SET g = $grant`, { grant: grantProps(grant) });
            await recordIn(tx, event);
        });
    },

    async getGrant(grantId): Promise<StoredGrant | null> {
        const result = await read(tx =>
            tx.run(`MATCH (g:HcpV1Grant {grantId: $grantId}) RETURN g`, { grantId })
        );
        const row = result.records[0];
        return row ? toGrant(props(row.get('g'))) : null;
    },

    async listGrants(subjectDid, status): Promise<StoredGrant[]> {
        const result = await read(tx =>
            tx.run(
                `MATCH (g:HcpV1Grant {subjectDid: $subjectDid, status: $status})
                RETURN g ORDER BY g.issuedAt DESC, g.grantId DESC`,
                { subjectDid, status }
            )
        );
        return result.records.map(row => toGrant(props(row.get('g'))));
    },

    async transitionGrantStatus(grantId, to, at, event): Promise<boolean> {
        return write(async tx => {
            const locked = await tx.run(
                `MATCH (g:HcpV1Grant {grantId: $grantId})
                SET g._lock = coalesce(g._lock, 0) + 1
                RETURN g.status AS status`,
                { grantId }
            );
            if (locked.records[0]?.get('status') !== 'active') return false;
            await tx.run(
                `MATCH (g:HcpV1Grant {grantId: $grantId}) SET g.status = $to, g.statusChangedAt = $at`,
                { grantId, to, at }
            );
            await recordIn(tx, event);
            return true;
        });
    },

    async appendEvent(event): Promise<void> {
        await write(tx => recordIn(tx, event));
    },

    async listEvents(subjectDid, filter, page): Promise<StoredEvent[]> {
        const result = await read(tx =>
            tx.run(
                `MATCH (n:HcpV1Event {subjectDid: $subjectDid})
                WHERE ($eventTypes IS NULL OR n.eventType IN $eventTypes)
                  AND ($entryId IS NULL OR n.entryId = $entryId)
                  AND ($grantId IS NULL OR n.grantId = $grantId)
                  AND ($since IS NULL OR n.timestamp >= $since)
                  AND ($until IS NULL OR n.timestamp < $until)
                  AND ($afterTimestamp IS NULL
                       OR n.timestamp < $afterTimestamp
                       OR (n.timestamp = $afterTimestamp AND n.eventId < $afterEventId))
                RETURN n ORDER BY n.timestamp DESC, n.eventId DESC LIMIT $limit`,
                {
                    subjectDid,
                    eventTypes: filter.eventTypes ?? null,
                    entryId: filter.entryId ?? null,
                    grantId: filter.grantId ?? null,
                    since: filter.since ?? null,
                    until: filter.until ?? null,
                    afterTimestamp: page.after?.timestamp ?? null,
                    afterEventId: page.after?.eventId ?? null,
                    limit: int(page.limit),
                }
            )
        );
        return result.records.map(row => toEvent(props(row.get('n'))));
    },
});

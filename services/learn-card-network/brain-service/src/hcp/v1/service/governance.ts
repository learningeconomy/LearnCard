/**
 * Draft 3 §8.3 audit log read, §5.4.1 export, and the LearnCard entry list. All are
 * the Context Subject's alone.
 */
import { requireSubject } from '../auth';
import type { EventPosition, StoredEvent } from '../store/port';
import {
    HCP_EXPORT_SCHEMA,
    HCP_JSON_LD_CONTEXT,
    type AuditEvent,
    type ExportInput,
    type ExportResult,
    type ListAuditInput,
    type ListAuditResult,
    type ListEntriesInput,
    type ListEntriesResult,
} from '../schemas';
import { urn, type HcpV1Caller, type HcpV1Deps } from './deps';
import { malformed } from './errors';
import { toEntry } from './views';

const toAuditEvent = (event: StoredEvent): AuditEvent => ({
    eventId: event.eventId,
    eventType: event.eventType,
    timestamp: event.timestamp,
    participants: {
        initiator: event.initiator,
        authorizingPrincipal: { id: event.subjectDid },
        provider: { id: event.providerId },
        ...(event.retrievalId === undefined ? {} : { retrievalId: event.retrievalId }),
    },
    entryId: event.entryId,
    categories: event.categories,
    purpose: event.purpose,
    purposeDescription: event.purposeDescription ?? null,
    grantId: event.grantId,
    ...(event.disclosed === undefined ? {} : { disclosed: event.disclosed }),
    data: event.data,
});

/**
 * Opaque keyset cursor (Draft 3 §9.5): the position of the last event returned. It
 * carries no count or offset, so it reveals nothing about the size of the log.
 */
const encodeCursor = (position: EventPosition): string =>
    Buffer.from(JSON.stringify([position.timestamp, position.eventId])).toString('base64url');

const decodeCursor = (cursor: string): EventPosition => {
    try {
        const [timestamp, eventId] = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
        if (typeof timestamp === 'string' && typeof eventId === 'string')
            return { timestamp, eventId };
    } catch {
        // fall through
    }
    throw malformed('cursor is not valid.');
};

const isoOrUndefined = (value: string | undefined): string | undefined =>
    value === undefined ? undefined : new Date(value).toISOString();

export const listAudit = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    input: ListAuditInput
): Promise<ListAuditResult> => {
    const subjectDid = requireSubject(caller);
    const after = input.cursor === undefined ? undefined : decodeCursor(input.cursor);

    const page = await deps.store.listEvents(
        subjectDid,
        {
            eventTypes: input.eventTypes,
            entryId: input.entryId,
            grantId: input.grantId,
            since: isoOrUndefined(input.since),
            until: isoOrUndefined(input.until),
        },
        { limit: input.limit + 1, after }
    );

    const events = page.slice(0, input.limit);
    const last = events.at(-1);
    return {
        events: events.map(toAuditEvent),
        nextCursor: page.length > input.limit && last ? encodeCursor(last) : null,
    };
};

/**
 * Every entry the subject holds that was not hard-deleted, in every status, unless
 * `excludeDeleted`; superseded versions only on request (Draft 3 §5.4.1).
 */
export const exportContext = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    input: ExportInput
): Promise<ExportResult> => {
    const subjectDid = requireSubject(caller);
    const options = {
        excludeDeleted: input.excludeDeleted,
        includeVersions: input.includeVersions,
        includeAudit: false as const,
    };

    const records = await deps.store.listEntries(subjectDid, {
        statuses: options.excludeDeleted
            ? ['active', 'suggested', 'deprecated', 'conflicted', 'expired', 'revoked', 'suspended']
            : undefined,
        limit: Number.MAX_SAFE_INTEGER,
    });
    const headers = new Map(records.map(record => [record.header.id, record.header]));
    const versions = options.includeVersions
        ? (await deps.store.listVersions(subjectDid)).filter(version => {
              const header = headers.get(version.entryId);
              return header !== undefined && version.version < header.version;
          })
        : [];

    const exportedAt = deps.now().toISOString();
    await deps.activity.record({
        eventId: urn(deps.newId()),
        eventType: 'context.exported',
        timestamp: exportedAt,
        subjectDid,
        providerId: deps.providerId,
        initiator: { role: 'management-client', id: caller.did },
        entryId: null,
        categories: [],
        purpose: null,
        grantId: null,
        data: { options },
    });

    return {
        '@context': [HCP_JSON_LD_CONTEXT],
        type: 'ContextExport',
        schema: HCP_EXPORT_SCHEMA,
        subject: { id: subjectDid },
        exportedBy: deps.providerId,
        exportedAt,
        options,
        entries: records.map(record => toEntry(record.header, record.current)),
        versions: versions.map(version => toEntry(headers.get(version.entryId)!, version)),
        rules: [],
        directives: [],
        delegations: [],
        audit: [],
    };
};

/**
 * Most recently updated entries the list returns.
 * TODO(before real users): page with a cursor instead of capping (README).
 */
export const LIST_ENTRIES_LIMIT = 500;

/** Entries a Management Client shows. Not withdrawn unless `statuses` asks; no audit event. */
export const listOwnEntries = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    input: ListEntriesInput
): Promise<ListEntriesResult> => {
    const subjectDid = requireSubject(caller);
    const records = await deps.store.listEntries(subjectDid, {
        statuses: input.statuses ?? [
            'active',
            'suggested',
            'deprecated',
            'conflicted',
            'expired',
            'revoked',
            'suspended',
        ],
        limit: LIST_ENTRIES_LIMIT + 1,
    });
    return {
        subject: { id: subjectDid },
        entries: records
            .slice(0, LIST_ENTRIES_LIMIT)
            .map(record => toEntry(record.header, record.current)),
        truncated: records.length > LIST_ENTRIES_LIMIT,
    };
};

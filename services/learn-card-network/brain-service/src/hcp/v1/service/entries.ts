/** Draft 3 §5.2 context operations: create, query, get entry, revise, withdraw. */
import {
    disclosableCategories,
    queryCategories,
    requireWrite,
    resolveActor,
    type Actor,
} from '../auth';
import type { EntryRecord, EntryVersion, StoredEvent } from '../store/port';
import {
    orderCategories,
    REGISTERED_CATEGORY_IDS,
    type Assertion,
    type AuditEventType,
    type Category,
    type CreateEntryInput,
    type EntryStatus,
    type EntryView,
    type GetEntryInput,
    type GetEntryResult,
    type Provenance,
    type QueryInput,
    type QueryResult,
    type ReviseEntryInput,
    type WithdrawEntryInput,
    type WithdrawResult,
} from '../schemas';
import { urn, type HcpV1Caller, type HcpV1Deps } from './deps';
import { malformed, scopeDenied, versionConflict } from './errors';
import { rankLexically, toDisclosure, toEntry } from './views';

/** Draft 3 §5.2.1 default and §7.2 ceiling. */
export const DEFAULT_MAX_ENTRIES = 5;
export const MAX_ENTRIES_CEILING = 20;
/** Most recently updated entries considered for relevance ordering per query. */
export const QUERY_CANDIDATE_LIMIT = 500;

const NOT_DELETED: readonly EntryStatus[] = [
    'active',
    'deprecated',
    'conflicted',
    'expired',
    'revoked',
    'suspended',
];

type EntryName = { ref?: string; entryId?: string };

const initiator = (actor: Actor): StoredEvent['initiator'] => ({
    role: actor.kind === 'subject' ? 'management-client' : 'context-client',
    id: actor.did,
});

const entryEvent = (
    deps: HcpV1Deps,
    actor: Actor,
    eventType: AuditEventType,
    at: string,
    record: EntryRecord,
    data: Record<string, unknown>
): StoredEvent => ({
    eventId: urn(deps.newId()),
    eventType,
    timestamp: at,
    subjectDid: actor.subjectDid,
    providerId: deps.providerId,
    initiator: initiator(actor),
    entryId: record.header.id,
    categories: record.header.categories,
    purpose: null,
    grantId: actor.kind === 'client' ? actor.grant.grantId : null,
    data,
});

/**
 * Sets `expired` the first time a lapsed entry is touched (Draft 3 §4.2.4). Returns
 * the record with its settled status.
 */
const settleEntryExpiry = async (deps: HcpV1Deps, record: EntryRecord): Promise<EntryRecord> => {
    const { validUntil } = record.current.assertion;
    const now = deps.now();
    if (record.header.status !== 'active' || !validUntil || Date.parse(validUntil) > now.getTime())
        return record;

    const at = now.toISOString();
    await deps.store.transitionEntryStatus(record.header.id, ['active'], 'expired', at, {
        eventId: urn(deps.newId()),
        eventType: 'context.expired',
        timestamp: at,
        subjectDid: record.header.subjectDid,
        providerId: deps.providerId,
        initiator: { role: 'hcp-provider', id: deps.providerId },
        entryId: record.header.id,
        categories: record.header.categories,
        purpose: null,
        grantId: null,
        data: { version: record.header.version },
    });
    return { ...record, header: { ...record.header, status: 'expired', updatedAt: at } };
};

/** Clients name entries by grant-scoped `ref`; subjects by `entryId` (Draft 3 §5.2.2). */
const resolveEntry = async (
    deps: HcpV1Deps,
    actor: Actor,
    name: EntryName
): Promise<EntryRecord> => {
    let entryId: string | null;
    if (actor.kind === 'client') {
        if (name.ref === undefined) throw scopeDenied();
        entryId = await deps.store.resolveRef(actor.grant.grantId, name.ref);
    } else {
        if (name.entryId === undefined)
            throw malformed('The Context Subject names entries by entryId.');
        entryId = name.entryId;
    }
    const record = entryId ? await deps.store.getEntry(actor.subjectDid, entryId) : null;
    if (!record) throw scopeDenied();
    return settleEntryExpiry(deps, record);
};

/** Categories of the entry that any detail of the client's grant covers (Draft 3 §7.4). */
const coveredCategories = (
    actor: Actor & { kind: 'client' },
    categories: Category[]
): Category[] => {
    const covered = new Set(actor.grant.access.flatMap(detail => detail.categories));
    return categories.filter(category => covered.has(category));
};

const view = async (
    deps: HcpV1Deps,
    actor: Actor,
    record: EntryRecord,
    version: EntryVersion,
    visible: Category[]
): Promise<EntryView> => {
    if (actor.kind === 'subject') return toEntry(record.header, version);
    const ref = await deps.store.refFor(actor.grant.grantId, record.header.id, deps.newId());
    return toDisclosure(ref, record.header, version, visible, deps.now());
};

type AssertionInput = CreateEntryInput['assertion'];
type ProvenanceInput = CreateEntryInput['record']['provenance'];

/**
 * Builds a version's assertion and provenance (Draft 3 §3.5, §5.2.3). Who asserted
 * follows the declaration type; assurance is `authenticated` only where the asserter
 * is the DID that authenticated this request (or the subject writing for themself).
 */
const assertionAndProvenance = (
    deps: HcpV1Deps,
    actor: Actor,
    assertion: AssertionInput,
    provenance: ProvenanceInput,
    recordedAt: string
): { assertion: Assertion; provenance: Provenance } => {
    const { declarationType } = assertion;
    const confidence = assertion.confidence ?? null;
    if (declarationType === 'model-inferred' && confidence === null)
        throw malformed('model-inferred entries require assertion.confidence.');
    if (declarationType !== 'model-inferred' && confidence !== null)
        throw malformed('assertion.confidence is only for model-inferred entries.');

    const named = provenance.assertedBy?.id;
    let assertedBy: Provenance['assertedBy'];
    if (declarationType === 'person-declared') {
        if (named !== undefined && named !== actor.subjectDid)
            throw malformed('A person-declared entry is asserted by the Context Subject.');
        assertedBy = {
            id: actor.subjectDid,
            assurance: actor.kind === 'subject' ? 'authenticated' : 'unverified',
        };
    } else if (declarationType === 'issuer-attested') {
        // Accepted only from a client authenticated as the issuer (Draft 3 §5.2.3).
        if (named !== actor.did) throw scopeDenied();
        assertedBy = { id: named, assurance: 'authenticated' };
    } else {
        if (named === undefined)
            throw malformed(
                'record.provenance.assertedBy.id is required for model-inferred entries.'
            );
        assertedBy = { id: named, assurance: named === actor.did ? 'authenticated' : 'unverified' };
    }

    return {
        assertion: {
            declarationType,
            confidence,
            validUntil: assertion.validUntil ?? null,
            ...(assertion.basis ? { basis: assertion.basis } : {}),
            ...(assertion.permittedPurposes
                ? { permittedPurposes: assertion.permittedPurposes }
                : {}),
        },
        provenance: {
            assertedBy,
            assertedAt: provenance.assertedAt ?? recordedAt,
            source: provenance.source,
            submittedByClient: {
                id: actor.did,
                name: actor.kind === 'client' ? actor.grant.client.name : 'Context Subject',
            },
            authorizedUnder: actor.kind === 'client' ? actor.grant.grantId : null,
            recordedByProvider: deps.providerId,
            recordedAt,
        },
    };
};

export const createEntry = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    input: CreateEntryInput
): Promise<EntryView> => {
    const actor = await resolveActor(deps, caller, input.grantId);
    if (input.subject.id !== actor.subjectDid) throw scopeDenied();
    const categories = input.classification.categories;
    requireWrite(actor, categories);

    const at = deps.now().toISOString();
    const { assertion, provenance } = assertionAndProvenance(
        deps,
        actor,
        input.assertion,
        input.record.provenance,
        at
    );
    await deps.writePolicy({
        operation: 'create',
        subjectDid: actor.subjectDid,
        actorDid: actor.did,
        grantId: actor.kind === 'client' ? actor.grant.grantId : null,
        categories,
    });

    const id = urn(deps.newId());
    const record: EntryRecord = {
        header: {
            id,
            subjectDid: actor.subjectDid,
            status: 'active',
            version: 1,
            categories: orderCategories(categories),
            dimension: input.classification.dimension ?? null,
            permittedPurposes: null,
            createdAt: at,
            updatedAt: at,
        },
        current: {
            entryId: id,
            subjectDid: actor.subjectDid,
            version: 1,
            content: input.content,
            assertion,
            evidence: input.evidence ?? [],
            provenance,
        },
    };

    await deps.store.insertEntry(
        record,
        entryEvent(deps, actor, 'context.created', at, record, { version: 1 })
    );

    const visible =
        actor.kind === 'client' ? coveredCategories(actor, record.header.categories) : [];
    return view(deps, actor, record, record.current, visible);
};

export const queryEntries = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    input: QueryInput
): Promise<QueryResult> => {
    const actor = await resolveActor(deps, caller, input.grantId);
    const limitedTo = queryCategories(actor, input.categories, input.purpose);

    const candidates = await deps.store.listEntries(actor.subjectDid, {
        categories: limitedTo ?? undefined,
        statuses: ['active'],
        limit: QUERY_CANDIDATE_LIMIT,
    });
    // Unfiltered (the subject named none): every registered category, plus the
    // custom categories the candidates hold.
    const categoriesSearched =
        limitedTo ??
        orderCategories([
            ...REGISTERED_CATEGORY_IDS,
            ...candidates.flatMap(record => record.header.categories),
        ]);
    const settled = await Promise.all(candidates.map(record => settleEntryExpiry(deps, record)));

    const reachable: { record: EntryRecord; visible: Category[] }[] = [];
    for (const record of settled) {
        if (record.header.status !== 'active') continue;
        if (actor.kind === 'subject') {
            reachable.push({ record, visible: [] });
            continue;
        }
        const visible = disclosableCategories(
            actor,
            {
                categories: record.header.categories,
                purposeLimits: [
                    record.header.permittedPurposes,
                    record.current.assertion.permittedPurposes,
                ],
            },
            input.purpose
        );
        if (visible) reachable.push({ record, visible });
    }

    const visibleById = new Map(
        reachable.map(({ record, visible }) => [record.header.id, visible])
    );
    const limit = Math.min(input.maxEntries ?? DEFAULT_MAX_ENTRIES, MAX_ENTRIES_CEILING);
    const ranked = rankLexically(
        input.query,
        reachable.map(({ record }) => record)
    ).slice(0, limit);

    // TODO(LC-2422): record `context.read` with `disclosed` through deps.activity.
    const entries = await Promise.all(
        ranked.map(record =>
            view(deps, actor, record, record.current, visibleById.get(record.header.id)!)
        )
    );

    return {
        entries,
        retrievalId: urn(deps.newId()),
        minimization: { method: 'lexical' },
        categoriesSearched,
        directives: [],
        timestamp: deps.now().toISOString(),
    };
};

export const getEntry = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    input: GetEntryInput
): Promise<GetEntryResult> => {
    const actor = await resolveActor(deps, caller, input.grantId);
    const record = await resolveEntry(deps, actor, input);

    const version =
        input.version === undefined || input.version === record.header.version
            ? record.current
            : await deps.store.getEntryVersion(record.header.id, input.version);
    if (!version) throw scopeDenied();

    let visible: Category[] = [];
    if (actor.kind === 'client') {
        if (record.header.status !== 'active') throw scopeDenied();
        const disclosable = disclosableCategories(
            actor,
            {
                categories: record.header.categories,
                purposeLimits: [
                    record.header.permittedPurposes,
                    version.assertion.permittedPurposes,
                ],
            },
            input.purpose
        );
        if (!disclosable) throw scopeDenied();
        visible = disclosable;
    }

    // TODO(LC-2422): record `context.read` with `disclosed` through deps.activity.
    return {
        entry: await view(deps, actor, record, version, visible),
        retrievalId: urn(deps.newId()),
        minimization: { method: 'none' },
        directives: [],
        timestamp: deps.now().toISOString(),
    };
};

export const reviseEntry = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    input: ReviseEntryInput
): Promise<EntryView> => {
    const actor = await resolveActor(deps, caller, input.grantId);
    const record = await resolveEntry(deps, actor, input);

    if (actor.kind === 'client' && record.header.status !== 'active') throw scopeDenied();
    requireWrite(actor, record.header.categories);
    if (record.header.status === 'deleted') throw malformed('A withdrawn entry cannot be revised.');
    if (input.expectedVersion !== record.header.version) throw versionConflict();

    const at = deps.now().toISOString();
    const { assertion, provenance } = assertionAndProvenance(
        deps,
        actor,
        {
            ...input.assertion,
            declarationType:
                input.assertion?.declarationType ?? record.current.assertion.declarationType,
        },
        input.record.provenance,
        at
    );
    await deps.writePolicy({
        operation: 'revise',
        subjectDid: actor.subjectDid,
        actorDid: actor.did,
        grantId: actor.kind === 'client' ? actor.grant.grantId : null,
        categories: record.header.categories,
    });

    const next: EntryVersion = {
        entryId: record.header.id,
        subjectDid: actor.subjectDid,
        version: record.header.version + 1,
        content: input.content,
        assertion,
        evidence: input.evidence ?? [],
        provenance,
    };
    // A revision returns the entry to active (Draft 3 §4.2.4: deprecated, conflicted
    // and expired are each left by a revision).
    if (
        !(await deps.store.appendVersion(
            record.header.id,
            input.expectedVersion,
            next,
            'active',
            at,
            entryEvent(deps, actor, 'context.revised', at, record, {
                version: next.version,
                reason: input.reason,
            })
        ))
    )
        throw versionConflict();

    const revised: EntryRecord = {
        header: { ...record.header, version: next.version, status: 'active', updatedAt: at },
        current: next,
    };
    const visible =
        actor.kind === 'client' ? coveredCategories(actor, revised.header.categories) : [];
    return view(deps, actor, revised, next, visible);
};

/** Idempotent: withdrawing a withdrawn entry succeeds and records nothing new. */
export const withdrawEntry = async (
    deps: HcpV1Deps,
    caller: HcpV1Caller,
    input: WithdrawEntryInput
): Promise<WithdrawResult> => {
    const actor = await resolveActor(deps, caller, input.grantId);
    const record = await resolveEntry(deps, actor, input);

    if (
        actor.kind === 'client' &&
        record.header.status !== 'active' &&
        record.header.status !== 'deleted'
    )
        throw scopeDenied();
    requireWrite(actor, record.header.categories);

    const at = deps.now().toISOString();
    await deps.store.transitionEntryStatus(
        record.header.id,
        NOT_DELETED,
        'deleted',
        at,
        entryEvent(deps, actor, 'context.withdrawn', at, record, { reason: input.reason })
    );

    return {
        ...(actor.kind === 'client' ? { ref: input.ref } : { entryId: record.header.id }),
        status: 'deleted',
        timestamp: at,
    };
};

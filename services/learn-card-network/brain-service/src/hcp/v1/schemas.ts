/**
 * HCP v1 wire types. v1 owns these: nothing outside `src/hcp/v1` may import them,
 * so a future v2 can change any shape without touching v1 callers.
 *
 * Field names follow HCP 2.0 Draft 3 (see README.md for the pinned commit).
 * Where Draft 3 names a field we use its name; LearnCard additions are marked.
 */
import { z } from 'zod';

export const HCP_JSON_LD_CONTEXT = 'https://hcp.example/contexts/v2';
export const HCP_ENTRY_SCHEMA = 'https://hcp.example/spec/entry/2.0';
export const HCP_EXPORT_SCHEMA = 'https://hcp.example/spec/export/2.0';
export const GENERAL_CONTEXT_PROFILE = 'https://hcp.example/spec/profiles/general-context/2.0';
export const CONTEXT_ACCESS_DETAIL_TYPE = 'https://hcp.example/spec/authorization/context-access';

/** Draft 3 §4.5 registered categories and their default sensitivity. */
export const REGISTERED_CATEGORIES = {
    general_preferences: {
        name: 'General preferences',
        description: 'Communication style, formatting, language preferences',
        sensitivity: 'low',
    },
    goals_and_constraints: {
        name: 'Goals and constraints',
        description: 'Long-term goals, time constraints, stated priorities',
        sensitivity: 'low',
    },
    health_context: {
        name: 'Health context',
        description: 'Medical conditions, accessibility needs, medications',
        sensitivity: 'high',
    },
    education_learner_profile: {
        name: 'Education learner profile',
        description: 'Mastery state, learning preferences, pacing',
        sensitivity: 'medium',
    },
    work_context: {
        name: 'Work context',
        description: 'Role, tools, professional preferences',
        sensitivity: 'medium',
    },
    purchase_history_preferences: {
        name: 'Purchase history preferences',
        description: 'Shopping preferences, brand affinities',
        sensitivity: 'low',
    },
    values_and_ethics: {
        name: 'Values and ethics',
        description: 'Stated ethical commitments, content boundaries',
        sensitivity: 'medium',
    },
    location_context: {
        name: 'Location context',
        description: 'Geographic preferences and constraints',
        sensitivity: 'medium',
    },
    coordination_context: {
        name: 'Coordination context',
        description: 'Scheduling rules, availability, relationship constraints',
        sensitivity: 'medium',
    },
} as const;

export type RegisteredCategory = keyof typeof REGISTERED_CATEGORIES;

/** Registered category slugs, in registry order. Not the set of valid categories. */
export const REGISTERED_CATEGORY_IDS = Object.keys(REGISTERED_CATEGORIES) as [
    RegisteredCategory,
    ...RegisteredCategory[],
];

export const isRegisteredCategory = (id: string): id is RegisteredCategory =>
    Object.hasOwn(REGISTERED_CATEGORIES, id);

/**
 * Draft 3 §4.5: custom categories have the sensitivity their provider declares,
 * never `low`. v1 cannot know what an arbitrary custom category holds, so it
 * declares every one `high`.
 */
export const CUSTOM_CATEGORY_SENSITIVITY = 'high' as const;

const MAX_CATEGORY_LENGTH = 2048;
const MAX_CATEGORIES_PER_LIST = 20;
const DNS_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
/** Draft 3 §1.7: the spec's own placeholder namespace, not a definer's domain. */
const SPEC_NAMESPACE = 'hcp.example';

/**
 * Draft 3 §4.5: a custom category is an absolute URI under a domain its definer
 * controls. v1 accepts `https:` and `http:` URIs whose host is a DNS name (not an
 * IP, not a single label, not the spec namespace), with no userinfo, written in
 * canonical form (WHATWG URL serialization) so that one category has one spelling
 * and grant matching stays exact-string.
 */
export const isCustomCategory = (id: string): boolean => {
    if (id.length > MAX_CATEGORY_LENGTH || !URL.canParse(id)) return false;
    const url = new URL(id);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return false;
    if (url.href !== id || url.username !== '' || url.password !== '') return false;
    const labels = url.hostname.split('.');
    if (labels.length < 2 || !labels.every(label => DNS_LABEL.test(label))) return false;
    if (/^\d+$/.test(labels.at(-1)!)) return false;
    return url.hostname !== SPEC_NAMESPACE && !url.hostname.endsWith(`.${SPEC_NAMESPACE}`);
};

/**
 * A registered category slug, or a custom category URI (Draft 3 §4.5). Anything
 * else, including an unregistered slug, is an invalid request.
 */
export const CategorySchema = z
    .string()
    .min(1)
    .max(MAX_CATEGORY_LENGTH)
    .refine(id => isRegisteredCategory(id) || isCustomCategory(id), {
        message:
            'must be a registered category slug or a custom category URI under a domain you control (Draft 3 §4.5)',
    });
export type Category = z.infer<typeof CategorySchema>;

/** Registered categories in registry order, then custom categories sorted; no repeats. */
export const orderCategories = (ids: Iterable<Category>): Category[] => {
    const all = new Set(ids);
    return [
        ...REGISTERED_CATEGORY_IDS.filter(id => all.has(id)),
        ...[...all].filter(id => !isRegisteredCategory(id)).sort(),
    ];
};

const uniqueCategories = () =>
    z
        .array(CategorySchema)
        .min(1)
        .max(MAX_CATEGORIES_PER_LIST)
        .refine(list => new Set(list).size === list.length, 'categories must not repeat');

const Did = z
    .string()
    .min(8)
    .max(2048)
    .regex(/^did:[a-z0-9]+:\S+$/, 'must be a DID');

const Id = z.string().min(1).max(256);
const IsoDateTime = z.iso.datetime({ offset: true });
const PurposeCode = z.url().max(2048);

export const DeclarationTypeSchema = z.enum([
    'person-declared',
    'model-inferred',
    'issuer-attested',
]);
export const ConfidenceSchema = z.enum(['high', 'medium', 'low']);
export const EntryStatusSchema = z.enum([
    'active',
    'deprecated',
    'conflicted',
    'expired',
    'revoked',
    'suspended',
    'deleted',
]);
export type EntryStatus = z.infer<typeof EntryStatusSchema>;

export const AssuranceSchema = z.enum([
    'unverified',
    'authenticated',
    'cryptographically-verified',
]);
export type Assurance = z.infer<typeof AssuranceSchema>;

/** Draft 3 §11.2 General Context Profile. The only content profile v1 accepts. */
export const ContentSchema = z.object({
    profile: z.literal(GENERAL_CONTEXT_PROFILE),
    value: z.union([z.string().min(1).max(20_000), z.record(z.string(), z.unknown())]),
    language: z.string().min(2).max(35).nullish(),
});
export type Content = z.infer<typeof ContentSchema>;

/** Evidence items are held whole and never interpreted by v1 (Draft 3 §4.2.2). */
export const EvidenceItemSchema = z.record(z.string(), z.unknown());
export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;

export const BasisSchema = z.object({
    drawnFrom: z
        .array(z.enum(['conversation', 'document', 'observation', 'assessment', 'entries']))
        .optional(),
    task: z.string().max(2000).optional(),
    setting: z.string().max(2000).optional(),
    rationale: z.string().max(4000).optional(),
});

const AssertionFields = {
    confidence: ConfidenceSchema.nullish(),
    validUntil: IsoDateTime.nullish(),
    basis: BasisSchema.optional(),
    permittedPurposes: z.array(PurposeCode).min(1).max(50).optional(),
};

export const ProvenanceInputSchema = z.object({
    assertedBy: z.object({ id: Id }).optional(),
    assertedAt: IsoDateTime.optional(),
    source: z.string().min(1).max(512),
});

/**
 * LearnCard addition: `grantId` names the grant a Context Client acts under. Draft 3
 * carries it in the bearer token; LearnCard authenticates the client by DID, so the
 * grant is named in the request. Omit it to act as the Context Subject.
 */
const GrantRef = { grantId: Id.optional() };

const EntryName = {
    ref: Id.optional(),
    entryId: Id.optional(),
};

const namesExactlyOneEntry = (value: { ref?: string; entryId?: string }): boolean =>
    (value.ref === undefined) !== (value.entryId === undefined);
const EXACTLY_ONE_ENTRY = { message: 'name the entry by exactly one of ref or entryId' };

export const CreateEntryInputSchema = z.object({
    ...GrantRef,
    schema: z.literal(HCP_ENTRY_SCHEMA),
    subject: z.object({ id: Id }),
    content: ContentSchema,
    evidence: z.array(EvidenceItemSchema).max(20).optional(),
    classification: z.object({
        categories: uniqueCategories(),
        dimension: z.string().min(1).max(512).nullish(),
    }),
    assertion: z.object({ declarationType: DeclarationTypeSchema, ...AssertionFields }),
    record: z.object({ provenance: ProvenanceInputSchema }),
});
export type CreateEntryInput = z.infer<typeof CreateEntryInputSchema>;

export const QueryInputSchema = z.object({
    ...GrantRef,
    query: z.string().min(1).max(2000),
    categories: uniqueCategories().optional(),
    purpose: PurposeCode,
    purposeDescription: z.string().max(2000).optional(),
    maxEntries: z.number().int().min(1).optional(),
});
export type QueryInput = z.infer<typeof QueryInputSchema>;

export const GetEntryInputSchema = z
    .object({
        ...GrantRef,
        ...EntryName,
        purpose: PurposeCode,
        purposeDescription: z.string().max(2000).optional(),
        version: z.number().int().min(1).optional(),
    })
    .refine(namesExactlyOneEntry, EXACTLY_ONE_ENTRY);
export type GetEntryInput = z.infer<typeof GetEntryInputSchema>;

export const ReviseEntryInputSchema = z
    .object({
        ...GrantRef,
        ...EntryName,
        expectedVersion: z.number().int().min(1),
        content: ContentSchema,
        evidence: z.array(EvidenceItemSchema).max(20).optional(),
        reason: z.string().min(1).max(2000),
        assertion: z
            .object({ declarationType: DeclarationTypeSchema.optional(), ...AssertionFields })
            .optional(),
        record: z.object({ provenance: ProvenanceInputSchema }),
    })
    .refine(namesExactlyOneEntry, EXACTLY_ONE_ENTRY);
export type ReviseEntryInput = z.infer<typeof ReviseEntryInputSchema>;

export const WithdrawEntryInputSchema = z
    .object({ ...GrantRef, ...EntryName, reason: z.string().min(1).max(2000) })
    .refine(namesExactlyOneEntry, EXACTLY_ONE_ENTRY);
export type WithdrawEntryInput = z.infer<typeof WithdrawEntryInputSchema>;

export const AssertionSchema = z.object({
    declarationType: DeclarationTypeSchema,
    confidence: ConfidenceSchema.nullable(),
    validUntil: z.string().nullable(),
    basis: BasisSchema.optional(),
    permittedPurposes: z.array(z.string()).optional(),
});
export type Assertion = z.infer<typeof AssertionSchema>;

export const ProvenanceSchema = z.object({
    assertedBy: z.object({ id: z.string(), assurance: AssuranceSchema }),
    assertedAt: z.string(),
    source: z.string(),
    submittedByClient: z.object({ id: z.string(), name: z.string() }),
    /** Null when the Context Subject wrote the version without a grant. */
    authorizedUnder: z.string().nullable(),
    recordedByProvider: z.string(),
    recordedAt: z.string(),
});
export type Provenance = z.infer<typeof ProvenanceSchema>;

const ClassificationOutput = z.object({
    categories: z.array(CategorySchema),
    dimension: z.string().nullable(),
    permittedPurposes: z.array(z.string()).optional(),
});

/** Draft 3 §4.2: the whole entry, as the Context Subject sees it. */
export const EntrySchema = z.object({
    '@context': z.array(z.string()),
    schema: z.string(),
    id: z.string(),
    type: z.array(z.string()),
    subject: z.object({ id: z.string(), relationship: z.null() }),
    content: ContentSchema,
    assertion: AssertionSchema,
    classification: ClassificationOutput,
    evidence: z.array(EvidenceItemSchema),
    record: z.object({
        status: EntryStatusSchema,
        version: z.number().int(),
        provenance: ProvenanceSchema,
    }),
});
export type Entry = z.infer<typeof EntrySchema>;

/** Draft 3 §7.4: what a Context Client receives instead of the stored entry. */
export const DisclosureSchema = z.object({
    ref: z.string(),
    version: z.number().int(),
    content: ContentSchema,
    evidence: z.array(EvidenceItemSchema),
    assertion: AssertionSchema,
    classification: ClassificationOutput,
    standing: z.object({ assurance: AssuranceSchema, confirmed: z.boolean() }),
    useUntil: z.string(),
});
export type Disclosure = z.infer<typeof DisclosureSchema>;

/** Subjects receive whole entries; Context Clients receive disclosures. */
export const EntryViewSchema = z.union([DisclosureSchema, EntrySchema]);
export type EntryView = z.infer<typeof EntryViewSchema>;

const Minimization = z.object({ method: z.enum(['lexical', 'none']) });

export const QueryResultSchema = z.object({
    entries: z.array(EntryViewSchema),
    retrievalId: z.string(),
    minimization: Minimization,
    categoriesSearched: z.array(CategorySchema),
    /** Directives (Draft 3 §6.4) are not implemented in v1; always empty. */
    directives: z.array(z.never()),
    timestamp: z.string(),
});
export type QueryResult = z.infer<typeof QueryResultSchema>;

export const GetEntryResultSchema = z.object({
    entry: EntryViewSchema,
    retrievalId: z.string(),
    minimization: Minimization,
    directives: z.array(z.never()),
    timestamp: z.string(),
});
export type GetEntryResult = z.infer<typeof GetEntryResultSchema>;

export const WithdrawResultSchema = z.object({
    ref: z.string().optional(),
    entryId: z.string().optional(),
    status: z.literal('deleted'),
    timestamp: z.string(),
});
export type WithdrawResult = z.infer<typeof WithdrawResultSchema>;

/**
 * LearnCard addition: the Context Subject's own entries, for a Management Client to
 * show. Draft 3 has no list operation (export is the closest); this one records no
 * audit event, because a person reading their own context is not an access (§6.1.6
 * makes the same call for grant lists).
 */
export const ListEntriesInputSchema = z
    .object({ statuses: z.array(EntryStatusSchema).min(1).optional() })
    .default({});
export type ListEntriesInput = z.infer<typeof ListEntriesInputSchema>;

export const ListEntriesResultSchema = z.object({
    /**
     * The Context Subject id to name in `entries.create`: the profile's stored DID
     * (normally its did:key), which can differ from the did:web the profile routes show.
     */
    subject: z.object({ id: z.string() }),
    entries: z.array(EntrySchema),
    /** True when more entries exist than `LIST_ENTRIES_LIMIT`; the rest are not returned. */
    truncated: z.boolean(),
});
export type ListEntriesResult = z.infer<typeof ListEntriesResultSchema>;

// ---------------------------------------------------------------------------
// Grants (Draft 3 §6.1.5)
// ---------------------------------------------------------------------------

export const GrantActionSchema = z.enum(['read', 'write']);
export type GrantAction = z.infer<typeof GrantActionSchema>;

export const PurposeSchema = z.object({
    code: PurposeCode,
    description: z.string().min(1).max(1000),
});

export const AccessDetailSchema = z.object({
    type: z.literal(CONTEXT_ACCESS_DETAIL_TYPE).default(CONTEXT_ACCESS_DETAIL_TYPE),
    actions: z
        .array(GrantActionSchema)
        .min(1)
        .refine(list => new Set(list).size === list.length, 'actions must not repeat'),
    categories: uniqueCategories(),
    purposes: z.array(PurposeSchema).min(1).max(50),
});
export type AccessDetail = z.infer<typeof AccessDetailSchema>;

/**
 * LearnCard addition: where a grant came from. Only `direct` is accepted today.
 * TODO(LC-2421): accept `consentflow` once consent-flow versioning lands.
 */
export const GrantSourceSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('direct') }),
    z.object({
        type: z.literal('consentflow'),
        contractUri: z.string().min(1).max(2048),
        termsUri: z.string().min(1).max(2048),
        contractVersion: z.string().min(1).max(256).optional(),
    }),
]);
export type GrantSource = z.infer<typeof GrantSourceSchema>;

export const GrantTypeSchema = z.enum(['temporary', 'persistent']);
export const GrantStatusSchema = z.enum(['active', 'revoked', 'expired']);
export type GrantStatus = z.infer<typeof GrantStatusSchema>;

export const CreateGrantInputSchema = z.object({
    client: z.object({ id: Did, name: z.string().min(1).max(200) }),
    access: z.array(AccessDetailSchema).min(1).max(20),
    grantType: GrantTypeSchema.default('temporary'),
    /** Temporary grants only. Defaults to 4 hours; at most 24 hours (Draft 3 §6.1.3). */
    expiresAt: IsoDateTime.optional(),
    source: GrantSourceSchema.default({ type: 'direct' }),
});
export type CreateGrantInput = z.infer<typeof CreateGrantInputSchema>;

export const GrantIdInputSchema = z.object({ grantId: Id });
export const ListGrantsInputSchema = z
    .object({ status: GrantStatusSchema.default('active') })
    .default({ status: 'active' });

export const GrantSchema = z.object({
    grantId: z.string(),
    subject: z.object({ id: z.string() }),
    authorizingPrincipal: z.object({ id: z.string() }),
    client: z.object({ id: z.string(), name: z.string() }),
    access: z.array(AccessDetailSchema),
    scopes: z.array(z.string()),
    grantType: GrantTypeSchema,
    issuedAt: z.string(),
    expiresAt: z.string().nullable(),
    status: GrantStatusSchema,
    source: GrantSourceSchema,
});
export type Grant = z.infer<typeof GrantSchema>;

// ---------------------------------------------------------------------------
// Audit (Draft 3 §8)
// ---------------------------------------------------------------------------

/**
 * LearnCard extension event type: a Context Client's read refused for its grant
 * (expired or revoked, a category or purpose it does not cover, or an entry out of
 * reach). Draft 3 §8.1 names no denial event, so the type is an absolute URI under
 * a LearnCard domain, as §A.3 asks of custom values. Records nothing about what
 * the request would have returned.
 */
export const READ_DENIED_EVENT = 'https://learncard.com/hcp/v1/events/read-denied';

/**
 * Event types v1 records (Draft 3 §8.1). State changes commit with their event;
 * `context.read`, `context.exported` and read denials go through the ActivitySink.
 */
export const AuditEventTypeSchema = z.enum([
    'context.created',
    'context.read',
    'context.revised',
    'context.withdrawn',
    'context.expired',
    'context.exported',
    'grant.issued',
    'grant.revoked',
    'grant.expired',
    READ_DENIED_EVENT,
]);
export type AuditEventType = z.infer<typeof AuditEventTypeSchema>;

export const InitiatorRoleSchema = z.enum(['management-client', 'context-client', 'hcp-provider']);
export type InitiatorRole = z.infer<typeof InitiatorRoleSchema>;

/**
 * One entry a retrieval disclosed (Draft 3 §8.2 `disclosed`), named by its stable
 * id, never the client's ref. `useUntil` is present only on disclosures to a
 * Context Client; the subject reading their own entry receives no copy limit.
 */
export const DisclosedEntrySchema = z.object({
    entryId: z.string(),
    version: z.number().int(),
    useUntil: z.string().optional(),
});
export type DisclosedEntry = z.infer<typeof DisclosedEntrySchema>;

export const AuditEventSchema = z.object({
    eventId: z.string(),
    eventType: AuditEventTypeSchema,
    timestamp: z.string(),
    participants: z.object({
        initiator: z.object({ role: InitiatorRoleSchema, id: z.string() }),
        authorizingPrincipal: z.object({ id: z.string() }),
        provider: z.object({ id: z.string() }),
        /** Present on `context.read` (Draft 3 §3.9): the result's retrievalId. */
        retrievalId: z.string().optional(),
    }),
    entryId: z.string().nullable(),
    categories: z.array(z.string()),
    purpose: z.string().nullable(),
    purposeDescription: z.string().nullable(),
    grantId: z.string().nullable(),
    /** Present on `context.read` only (Draft 3 §8.2). */
    disclosed: z.array(DisclosedEntrySchema).optional(),
    data: z.record(z.string(), z.unknown()),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export const ListAuditInputSchema = z
    .object({
        eventTypes: z.array(AuditEventTypeSchema).min(1).optional(),
        entryId: Id.optional(),
        grantId: Id.optional(),
        since: IsoDateTime.optional(),
        until: IsoDateTime.optional(),
        limit: z.number().int().min(1).max(100).default(50),
        cursor: z.string().min(1).max(512).optional(),
    })
    .default({ limit: 50 });
export type ListAuditInput = z.infer<typeof ListAuditInputSchema>;

export const ListAuditResultSchema = z.object({
    events: z.array(AuditEventSchema),
    nextCursor: z.string().nullable(),
});
export type ListAuditResult = z.infer<typeof ListAuditResultSchema>;

// ---------------------------------------------------------------------------
// Export (Draft 3 §5.4.1)
// ---------------------------------------------------------------------------

export const ExportInputSchema = z
    .object({
        excludeDeleted: z.boolean().default(false),
        includeVersions: z.boolean().default(false),
    })
    .default({ excludeDeleted: false, includeVersions: false });
export type ExportInput = z.infer<typeof ExportInputSchema>;

export const ExportResultSchema = z.object({
    '@context': z.array(z.string()),
    type: z.literal('ContextExport'),
    schema: z.literal(HCP_EXPORT_SCHEMA),
    subject: z.object({ id: z.string() }),
    exportedBy: z.string(),
    exportedAt: z.string(),
    options: z.object({
        excludeDeleted: z.boolean(),
        includeVersions: z.boolean(),
        includeAudit: z.literal(false),
    }),
    entries: z.array(EntrySchema),
    versions: z.array(EntrySchema),
    /** Standing rules, directives and delegations are not implemented in v1. */
    rules: z.array(z.never()),
    directives: z.array(z.never()),
    delegations: z.array(z.never()),
    audit: z.array(z.never()),
});
export type ExportResult = z.infer<typeof ExportResultSchema>;

// ---------------------------------------------------------------------------
// Discovery (Draft 3 §19, adapted: see README "Discovery")
// ---------------------------------------------------------------------------

export const MetaSchema = z.object({
    hcp_version: z.string(),
    api_version: z.literal('v1'),
    spec: z.object({ repository: z.string(), path: z.string(), commit: z.string() }),
    operations: z.array(z.string()),
    supported_categories: z.array(
        z.object({
            id: z.string(),
            name: z.string(),
            description: z.string(),
            sensitivity: z.enum(['low', 'medium', 'high']),
            registry: z.string(),
        })
    ),
    category_registry: z.string(),
    /** LearnCard addition: how v1 accepts custom categories (Draft 3 §4.5). */
    custom_categories: z.object({
        accepted: z.literal('uri'),
        schemes: z.array(z.string()),
        sensitivity: z.literal(CUSTOM_CATEGORY_SENSITIVITY),
    }),
    accepts_entry_schemas: z.array(z.string()),
    content_profiles: z.array(z.string()),
    minimization_method: z.literal('lexical'),
    audit_durability: z.object({ default: z.literal('synchronous') }),
    audit_integrity: z.literal('append-only'),
    storage_encryption: z.literal('server'),
    pagination: z.object({ audit: z.literal('cursor') }),
});
export type Meta = z.infer<typeof MetaSchema>;

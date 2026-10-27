import { withAiInsightStage } from '../diagnostics/ai-insight';
import { bindAiConsentRevision } from '../ai/privacy';
import { createHmac } from 'node:crypto';

import { getPrivacyKeyMaterial } from '../ai/privacy-keys';
import { contractId, contractUri } from './constants';
import {
    boundLearnCardCall,
    prefetchConsentSnapshot,
    reuseRequestConsentRead,
} from './requestScope';

export const AI_CONSENT_PURPOSES = [
    'credential-ingestion',
    'model-inference',
    'embedding',
] as const;

export type AiConsentPurpose = (typeof AI_CONSENT_PURPOSES)[number];

export type ActiveAiConsentReceipt = {
    contractUri: string;
    receiptId: string;
    status: 'live';
    grantedAt?: string;
    updatedAt: string;
    contractUpdatedAt: string;
    expiresAt?: string;
    contractExpiresAt?: string;
    categories: string[];
    credentialUris: string[];
    personalFields: string[];
    purpose: AiConsentPurpose;
    revision: string;
    guardian: { required: boolean; approved: boolean };
};

export type ActiveAiConsentRecord = Record<string, unknown> & {
    credentials?: unknown;
    date?: string;
};

type ConsentFlowClient = {
    invoke: {
        getConsentFlowDataForDid: (
            did: string,
            options: {
                query: { id: string | undefined };
                cursor?: string;
            }
        ) => Promise<unknown>;
    };
};

type ConsentFlowCredential = { category: string; uri: string };
type CredentialPermission = {
    sharing?: boolean;
    shareAll?: boolean;
    shared?: string[];
    shareUntil?: unknown;
};
type CredentialPermissions = {
    shareAll?: boolean;
    sharing?: boolean;
    categories: Record<string, CredentialPermission>;
};

export class AiConsentError extends Error {
    readonly code = 'active_ai_consent_required';

    constructor(
        message = 'Active LearnCard AI consent is required',
        readonly reason?: 'missing' | 'revoked' | 'expired' | 'guardian_required' | 'unavailable'
    ) {
        super(message);
        this.name = 'AiConsentError';
    }
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined;

const asNonEmptyString = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    return value.trim() || undefined;
};

const asIsoDate = (value: unknown): string | undefined => {
    const normalized = asNonEmptyString(value);
    if (!normalized) return undefined;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const isUnexpired = (value: unknown, now: Date): boolean => {
    if (value === undefined || (typeof value === 'string' && !value.trim())) return true;
    const expiration = asIsoDate(value);
    return expiration !== undefined && Date.parse(expiration) > now.getTime();
};

const normalizeCredentials = (value: unknown): ConsentFlowCredential[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const credentials = new Map<string, ConsentFlowCredential>();
    for (const item of value) {
        const record = asRecord(item);
        const uri = asNonEmptyString(record?.uri);
        const category = asNonEmptyString(record?.category);
        if (!uri || !category) return undefined;
        const previous = credentials.get(uri);
        if (previous && previous.category !== category) return undefined;
        credentials.set(uri, { uri, category });
    }
    return [...credentials.values()];
};

const normalizeCredentialPermissions = (value: unknown): CredentialPermissions | undefined => {
    const terms = asRecord(value);
    if (!terms) return undefined;
    const read = asRecord(terms.read);
    const credentials = asRecord(read?.credentials);
    if (!credentials) return { categories: {} };
    if (
        (credentials.sharing !== undefined && typeof credentials.sharing !== 'boolean') ||
        (credentials.shareAll !== undefined && typeof credentials.shareAll !== 'boolean')
    )
        return undefined;
    const categoryRecords = asRecord(credentials.categories);
    if (!categoryRecords) return undefined;
    const categories: Record<string, CredentialPermission> = Object.create(null);
    for (const category of Object.keys(categoryRecords).sort()) {
        const record = asRecord(categoryRecords[category]);
        if (!record) return undefined;
        if (
            (record.sharing !== undefined && typeof record.sharing !== 'boolean') ||
            (record.shareAll !== undefined && typeof record.shareAll !== 'boolean') ||
            (record.shared !== undefined &&
                (!Array.isArray(record.shared) ||
                    !record.shared.every(uri => typeof uri === 'string' && uri.trim())))
        )
            return undefined;
        categories[category] = {
            sharing: record.sharing === true,
            shareAll: record.shareAll === true,
            shared: Array.isArray(record.shared)
                ? [...new Set(record.shared as string[])].sort()
                : [],
            shareUntil: record.shareUntil,
        };
    }
    return {
        sharing: credentials.sharing as boolean | undefined,
        shareAll: credentials.shareAll as boolean | undefined,
        categories,
    };
};

const isCredentialPermitted = (
    credential: ConsentFlowCredential,
    permissions: CredentialPermissions,
    now: Date
): boolean => {
    if (permissions.sharing === false) return false;
    const permission = permissions.categories[credential.category];
    if (!permission?.sharing || !isUnexpired(permission.shareUntil, now)) return false;
    return (
        permissions.shareAll === true ||
        permission.shareAll === true ||
        permission.shared?.includes(credential.uri) === true
    );
};

export const getActiveAiConsentReceipt = (
    record: ActiveAiConsentRecord,
    purpose: AiConsentPurpose,
    now = new Date()
): ActiveAiConsentReceipt | undefined => {
    if (record.contractUri !== contractUri || record.status !== 'live') return undefined;
    const receiptId = asNonEmptyString(record.termsUri);
    const updatedAt = asIsoDate(record.date);
    const contractUpdatedAt = asNonEmptyString(record.contractUpdatedAt);
    const grantedAt = asIsoDate(record.createdAt);
    if (!receiptId || !updatedAt || !contractUpdatedAt) return undefined;
    if (record.createdAt !== undefined && !grantedAt) return undefined;
    if (!isUnexpired(record.expiresAt, now) || !isUnexpired(record.contractExpiresAt, now))
        return undefined;

    // Older producers cannot establish whether this is an adult or managed grant.
    // Existing adult grants remain valid once the producer supplies current evidence.
    const guardian = asRecord(record.guardian);
    if (typeof guardian?.required !== 'boolean' || typeof guardian.approved !== 'boolean')
        return undefined;
    const approval = asRecord(guardian.approval);
    if (guardian.required) {
        const approvedAt = asIsoDate(approval?.approvedAt);
        if (
            !guardian.approved ||
            !asNonEmptyString(approval?.guardianProfileId) ||
            !asNonEmptyString(approval?.guardianDid) ||
            !approvedAt ||
            Date.parse(approvedAt) > now.getTime() ||
            approval?.contractUpdatedAt !== contractUpdatedAt
        )
            return undefined;
    } else if (guardian.approved || guardian.approval !== undefined) {
        return undefined;
    }

    const credentials = normalizeCredentials(record.credentials);
    const permissions = normalizeCredentialPermissions(record.terms);
    if (
        !credentials ||
        !permissions ||
        !credentials.every(credential => isCredentialPermitted(credential, permissions, now))
    )
        return undefined;

    const terms = asRecord(record.terms);
    const personalPermissions = asRecord(asRecord(terms?.read)?.personal) ?? {};
    const personal = record.personal === undefined ? {} : asRecord(record.personal);
    if (!personal) return undefined;
    const personalFields = Object.keys(personal).sort();
    if (
        !personalFields.every(
            field =>
                typeof personal[field] === 'string' &&
                Object.hasOwn(personalPermissions, field) &&
                personalPermissions[field] === personal[field]
        )
    )
        return undefined;

    const expiresAt = asIsoDate(record.expiresAt);
    const contractExpiresAt = asIsoDate(record.contractExpiresAt);
    const credentialUris = credentials.map(credential => credential.uri).sort();
    const categories = [...new Set(credentials.map(credential => credential.category))].sort();
    const guardianState = {
        required: guardian.required,
        approved: guardian.approved,
    };
    // This is an authorization-state fingerprint, not a fabricated privacy notice
    // version. Key it because personal permission values can themselves be PII.
    const revision = createHmac('sha256', getPrivacyKeyMaterial().reference)
        .update(
            JSON.stringify({
                contractUri,
                receiptId,
                updatedAt,
                contractUpdatedAt,
                expiresAt,
                contractExpiresAt,
                guardian: { ...guardianState, approval },
                permissions,
                credentialUris,
                personal: personalFields.map(field => [field, personal[field]]),
            })
        )
        .digest('hex');
    return {
        contractUri,
        receiptId,
        status: 'live',
        ...(grantedAt ? { grantedAt } : {}),
        updatedAt,
        contractUpdatedAt,
        ...(expiresAt ? { expiresAt } : {}),
        ...(contractExpiresAt ? { contractExpiresAt } : {}),
        categories,
        credentialUris,
        personalFields,
        purpose,
        revision,
        guardian: guardianState,
    };
};

export type ConsentReadOptions = {
    /** Stop waiting when this aborts. Defaults to the request scope's signal. */
    signal?: AbortSignal;
    /** Per-page bound. Defaults to LEARNCARD_CALL_TIMEOUT_MS. */
    timeoutMs?: number;
    /** Skip the request's shared read and read the contract again. */
    fresh?: boolean;
    /** With `fresh`, read at most once per AI call (see runInAiCallConsentScope). */
    oncePerAiCall?: boolean;
    /**
     * The revision the caller already holds. A plain read never takes it from
     * the consent snapshot when the snapshot shows another revision.
     */
    expectedRevision?: string;
};

// The env module is not imported here: consent is loaded by modules whose tests
// replace it. Read the knob directly with the same parsing.
const defaultConsentPageTimeoutMs = (): number => {
    const parsed = Number(process.env.LEARNCARD_CALL_TIMEOUT_MS);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 5_000;
};

const readConsentRecords = async (
    learnCard: ConsentFlowClient,
    did: string,
    options: ConsentReadOptions & {
        /** Bound pages by timeoutMs only, never by a caller's or scope's signal. */
        detached?: boolean;
    }
): Promise<ActiveAiConsentRecord[]> => {
    const records: ActiveAiConsentRecord[] = [];
    const cursors = new Set<string>();
    let cursor: string | undefined;
    let hasMore = false;
    const timeoutMs = options.timeoutMs ?? defaultConsentPageTimeoutMs();
    for (let pageNumber = 0; pageNumber < 100; pageNumber += 1) {
        const page = asRecord(
            await boundLearnCardCall(
                learnCard.invoke.getConsentFlowDataForDid(did, {
                    query: { id: contractId },
                    ...(cursor ? { cursor } : {}),
                }),
                { signal: options.signal, timeoutMs, detached: options.detached }
            )
        );
        if (
            !page ||
            !Array.isArray(page.records) ||
            (page.hasMore !== undefined && typeof page.hasMore !== 'boolean')
        )
            throw new AiConsentError('Consent service returned an invalid page');
        for (const value of page.records) {
            const record = asRecord(value);
            if (!record) throw new AiConsentError('Consent service returned an invalid record');
            if (record.contractUri === contractUri) records.push(record);
        }
        hasMore = page.hasMore === true;
        if (!hasMore) break;
        const nextCursor = asNonEmptyString(page.cursor);
        if (!nextCursor || cursors.has(nextCursor))
            throw new AiConsentError('Consent pagination did not advance');
        cursors.add(nextCursor);
        cursor = nextCursor;
    }
    if (hasMore) throw new AiConsentError('Consent pagination exceeded the 100-page limit');
    return records;
};

const loadConsentData = async (
    learnCard: ConsentFlowClient,
    did: string,
    purpose: AiConsentPurpose,
    options: ConsentReadOptions = {}
): Promise<{
    records: ActiveAiConsentRecord[];
    receipt: ActiveAiConsentReceipt;
}> => {
    // Inside a request scope every caller shares one contract read unless it asks
    // for a fresh one, and plain reads share the per-learner consent snapshot
    // across requests. The receipt is still rebuilt per purpose and re-bound to
    // the operation's revision below.
    const { expectedRevision } = options;
    const records = await reuseRequestConsentRead(
        did,
        () => readConsentRecords(learnCard, did, options),
        {
            fresh: options.fresh,
            oncePerAiCall: options.oncePerAiCall,
            snapshot: {
                contract: contractUri,
                signal: options.signal,
                read: () => readConsentRecords(learnCard, did, { ...options, detached: true }),
                accept:
                    expectedRevision === undefined
                        ? undefined
                        : value => consentRecordsRevision(value, purpose) === expectedRevision,
            },
        }
    );
    // One current grant per subject and dedicated contract. Never combine evidence
    // from separate or ambiguous historical receipts into a broader authorization.
    if (records.length !== 1)
        throw new AiConsentError(undefined, records.length === 0 ? 'missing' : 'unavailable');
    const receipt = getActiveAiConsentReceipt(records[0], purpose);
    if (!receipt) {
        const record = records[0];
        const expired = [record.expiresAt, record.contractExpiresAt].some(
            value =>
                typeof value === 'string' &&
                Number.isFinite(Date.parse(value)) &&
                Date.parse(value) <= Date.now()
        );
        const guardian = asRecord(record.guardian),
            approval = asRecord(guardian?.approval);
        const guardianBlocked =
            guardian?.required === true &&
            (!guardian.approved ||
                !asNonEmptyString(approval?.guardianProfileId) ||
                !asNonEmptyString(approval?.guardianDid) ||
                !asIsoDate(approval?.approvedAt) ||
                Date.parse(String(approval?.approvedAt)) > Date.now() ||
                approval?.contractUpdatedAt !== record.contractUpdatedAt);
        throw new AiConsentError(
            undefined,
            record.status === 'revoked' || record.status === 'withdrawn'
                ? 'revoked'
                : expired
                  ? 'expired'
                  : guardianBlocked
                    ? 'guardian_required'
                    : 'unavailable'
        );
    }
    if (
        !bindAiConsentRevision(
            did,
            receipt.revision,
            (records[0]?.personal ?? {}) as Record<string, string>,
            receipt.credentialUris
        )
    )
        throw new AiConsentError('Consent changed during this operation');
    return { records, receipt };
};

const consentRecordsRevision = (value: unknown, purpose: AiConsentPurpose): string | undefined => {
    if (!Array.isArray(value) || value.length !== 1) return undefined;
    return getActiveAiConsentReceipt(value[0] as ActiveAiConsentRecord, purpose)?.revision;
};

/**
 * Start the learner's consent snapshot read (socket open), so the opening and
 * the preload find it in flight or settled. Best effort: a failure is dropped
 * and never cached; the next plain read reads again.
 */
export const prefetchAiConsentSnapshot = (
    learnCard: ConsentFlowClient,
    did: string
): Promise<void> =>
    prefetchConsentSnapshot(did, contractUri, () =>
        readConsentRecords(learnCard, did, { detached: true })
    );

export const loadActiveAiConsentData = (
    ...args: Parameters<typeof loadConsentData>
): ReturnType<typeof loadConsentData> =>
    withAiInsightStage('consent', () => loadConsentData(...args));

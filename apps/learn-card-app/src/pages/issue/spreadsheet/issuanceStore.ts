import { z } from 'zod';
import { IssueInboxCredentialBatchValidator, InboxBatchStatusValidator } from '@learncard/types';
import {
    issuanceScopeKey,
    IssuanceRecoveryError,
    type IssuanceRun,
    type IssuanceScope,
} from './issuanceTypes';

const DB_NAME = 'learncard-issue-recovery';
const STORE = 'runs';
const outcome = z.object({
    state: z.enum(['ready', 'queued', 'sent', 'failed', 'confirming']),
    error: z
        .object({ code: z.string(), message: z.string(), reason: z.string().optional() })
        .optional(),
    issuanceId: z.string().optional(),
    templateData: z.record(z.string(), z.unknown()).optional(),
});
const cell = z.custom<import('./types').SpreadsheetCell>(value => {
    if (!value || typeof value !== 'object') return false;
    const item = value as Record<string, unknown>;
    return (
        typeof item.text === 'string' &&
        (item.value === undefined ||
            typeof item.value === 'string' ||
            typeof item.value === 'boolean' ||
            (typeof item.value === 'number' && Number.isFinite(item.value))) &&
        (item.date === undefined || typeof item.date === 'string') &&
        (item.percent === undefined || typeof item.percent === 'boolean') &&
        (item.problem === undefined || item.problem === 'formula')
    );
});
const parsedSource = z.object({
    source: z.object({ name: z.string(), sheets: z.record(z.string(), z.unknown()) }),
    sheetName: z.string(),
    columns: z.array(
        z.object({ id: z.string(), label: z.string(), index: z.number().int().nonnegative() })
    ),
    rows: z.array(
        z.object({
            rowId: z.string(),
            sourceRow: z.number().int().positive(),
            email: z.string(),
            displayName: z.string(),
            cells: z.record(z.string(), cell),
            exportedRunId: z.string().optional(),
            exportedRowId: z.string().optional(),
            example: z.boolean().optional(),
        })
    ),
    emailColumn: z.number().int().nonnegative().optional(),
    emailCandidates: z.array(z.number().int().nonnegative()),
    rowEvidenceColumn: z.string().optional(),
    exportHeaders: z.record(z.string(), z.string()).optional(),
    headerRow: z.number().int().min(-1).optional(),
    skipped: z.number().int().nonnegative(),
});
const mappings = z.array(
    z.object({
        columnId: z.string(),
        label: z.string(),
        variable: z.string(),
        target: z.enum([
            'description',
            'Percent',
            'RawScore',
            'LetterGrade',
            'GradePointAverage',
            'credits',
            'evidence',
            'awardedDate',
        ]),
        dateFormat: z.enum(['iso', 'dmy', 'mdy']),
        numericFormat: z.enum(['dot', 'comma']),
        creditUnit: z.string().optional(),
    })
);
const runValidator = z
    .object({
        version: z.literal(1),
        id: z.string(),
        scope: z.object({ issuer: z.string(), domain: z.string(), tenant: z.string() }),
        createdAt: z.number(),
        updatedAt: z.number(),
        dismissedAt: z.number().optional(),
        draft: z
            .object({
                id: z.string(),
                recipients: z.array(
                    z.discriminatedUnion('kind', [
                        z.object({
                            rowId: z.string().min(1),
                            kind: z.literal('email'),
                            email: z.string(),
                            displayName: z.string().optional(),
                        }),
                        z.object({
                            rowId: z.string().min(1),
                            kind: z.literal('profile'),
                            profileId: z.string().min(1),
                            displayName: z.string(),
                            image: z.string().optional(),
                            did: z.string().optional(),
                        }),
                    ])
                ),
                values: z.record(z.string(), z.record(z.string(), z.string())),
                evidence: z.record(z.string(), z.string()),
                source: parsedSource.optional(),
                sourceName: z.string().optional(),
                mappings: mappings.optional(),
                reservedVariables: z.array(z.string()).optional(),
                formulaCells: z.record(z.string(), z.record(z.string(), z.string())).optional(),
                attachments: z
                    .record(
                        z.string(),
                        z.array(
                            z.object({
                                id: z.string(),
                                type: z.enum(['photo', 'document', 'video', 'link']),
                                url: z.string(),
                                title: z.string(),
                                fileName: z.string().optional(),
                                fileType: z.string().optional(),
                            })
                        )
                    )
                    .optional(),
            })
            .passthrough(),
        template: z
            .object({
                name: z.object({ value: z.string(), isDynamic: z.boolean() }).passthrough(),
                credentialSubject: z
                    .object({ achievement: z.object({}).passthrough() })
                    .passthrough(),
            })
            .passthrough(),
        templateSelected: z.boolean().optional(),
        templateUri: z.string().optional(),
        scopes: z.record(z.string(), z.enum(['shared', 'perRecipient'])),
        shared: z.record(z.string(), z.string()),
        outcomes: z.record(z.string(), outcome),
        attempts: z.array(
            z.object({
                id: z.string(),
                createdAt: z.number(),
                submissionStartedAt: z.number().nullable().optional(),
                rowIds: z.array(z.string()),
                body: IssueInboxCredentialBatchValidator,
                batchId: z.string().optional(),
                admittedAt: z.number().optional(),
                done: z.boolean().optional(),
                status: InboxBatchStatusValidator.optional(),
            })
        ),
    })
    .superRefine((run, context) => {
        const rows = new Set(run.draft.recipients.map(row => row.rowId));
        const invalid =
            run.id !== run.draft.id ||
            rows.size !== run.draft.recipients.length ||
            run.attempts.some(
                attempt =>
                    !run.templateUri ||
                    attempt.rowIds.length !== attempt.body.items.length ||
                    new Set(attempt.rowIds).size !== attempt.rowIds.length ||
                    attempt.body.requestId !== `${run.id}:${attempt.id}` ||
                    attempt.body.items.some(
                        (item, index) =>
                            !rows.has(attempt.rowIds[index]!) ||
                            item.templateUri !== run.templateUri ||
                            item.idempotencyKey !== `${run.templateUri}:${attempt.rowIds[index]}`
                    )
            );
        if (invalid)
            context.addIssue({ code: 'custom', message: 'Inconsistent recovery identities' });
    });

const openDatabase = (): Promise<IDBDatabase> =>
    new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new IssuanceRecoveryError('storage'));
            return;
        }
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = () => {
            const store = request.result.createObjectStore(STORE, { keyPath: 'id' });
            store.createIndex('scope', 'scopeKey');
        };
        let blocked = false;
        request.onblocked = () => {
            blocked = true;
            reject(new IssuanceRecoveryError('storage'));
        };
        request.onerror = () => reject(new IssuanceRecoveryError('storage'));
        request.onsuccess = () => {
            if (blocked) request.result.close();
            else resolve(request.result);
        };
    });

const withStore = async <T>(
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
    let database: IDBDatabase | undefined;
    try {
        database = await openDatabase();
        const db = database;
        return await new Promise<T>((resolve, reject) => {
            const transaction = db.transaction(STORE, mode);
            const request = operation(transaction.objectStore(STORE));
            transaction.oncomplete = () => resolve(request.result);
            transaction.onabort = transaction.onerror = () =>
                reject(new IssuanceRecoveryError('storage'));
        });
    } catch (error) {
        if (error instanceof IssuanceRecoveryError) throw error;
        throw new IssuanceRecoveryError('storage');
    } finally {
        database?.close();
    }
};

export const saveIssuanceRun = async (run: IssuanceRun): Promise<void> => {
    if (!runValidator.safeParse(run).success) throw new IssuanceRecoveryError('corrupt');
    await withStore('readwrite', store =>
        store.put({ ...run, scopeKey: issuanceScopeKey(run.scope) })
    );
};

export const readIssuanceRun = async (
    id: string,
    scope: IssuanceScope
): Promise<IssuanceRun | undefined> => {
    const raw: unknown = await withStore('readonly', store => store.get(id));
    if (raw === undefined) return undefined;
    const result = runValidator.safeParse(raw);
    if (!result.success) throw new IssuanceRecoveryError('corrupt');
    if (issuanceScopeKey(result.data.scope) !== issuanceScopeKey(scope)) return undefined;
    return result.data as unknown as IssuanceRun;
};

export const listIssuanceRuns = async (scope: IssuanceScope): Promise<IssuanceRun[]> => {
    const raw = await withStore('readonly', store =>
        store.index('scope').getAll(issuanceScopeKey(scope))
    );
    return raw
        .map(item => {
            const parsed = runValidator.safeParse(item);
            if (!parsed.success || issuanceScopeKey(parsed.data.scope) !== issuanceScopeKey(scope))
                throw new IssuanceRecoveryError('corrupt');
            return parsed.data as unknown as IssuanceRun;
        })
        .sort((a, b) => b.updatedAt - a.updatedAt);
};

/** Keep uncertain attempts as tombstones; removing them could enable accidental reissuance. */
export const pruneIssuanceRuns = async (scope: IssuanceScope, now = Date.now()): Promise<void> => {
    // Read eligibility and delete within one transaction: a stale list from
    // another tab must never authorize removing a newly updated recovery ledger.
    await withStore('readwrite', store => {
        const request = store.index('scope').getAll(issuanceScopeKey(scope));
        request.onsuccess = () => {
            for (const raw of request.result) {
                const parsed = runValidator.safeParse(raw);
                if (!parsed.success) continue; // Never discard unreadable recovery data.
                const run = parsed.data;
                if (issuanceScopeKey(run.scope) !== issuanceScopeKey(scope)) continue;
                const uncertain =
                    run.attempts.some(attempt => !attempt.done) ||
                    Object.values(run.outcomes).some(
                        value => value.state === 'confirming' || value.state === 'queued'
                    );
                if (!uncertain && run.updatedAt < now - 30 * 86_400_000) store.delete(run.id);
            }
        };
        return request;
    });
};

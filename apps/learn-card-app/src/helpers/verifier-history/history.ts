import { z } from 'zod/v4';
import type { JWE } from '@learncard/types';

// Opaque lookup namespace: never place verifier metadata in indexed top-level fields.
export const HISTORY_SCOPE = 'fdd78d07-5bb6-4c08-911e-85fdbb3d59e4';
export const HISTORY_LIMIT = 500;
export const HISTORY_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const MAX_SCAN_PAGES = 100;
const uuid = z.string().uuid();
const settingsSchema = z
    .object({
        kind: z.literal('settings'),
        version: z.literal(1),
        enabled: z.boolean(),
        revision: uuid,
        generation: uuid,
    })
    .strict();
const receiptSchema = z
    .object({
        kind: z.literal('receipt'),
        version: z.literal(1),
        eventId: uuid,
        generation: uuid,
        protocol: z.enum(['oid4vp', 'vc-api', 'chapi']),
        outcome: z.enum(['sent', 'handed-off']),
        sentAt: z.string().datetime(),
        label: z.string().max(160).optional(),
        origin: z.string().max(256).optional(),
        purpose: z.string().max(512).optional(),
        titles: z.array(z.string().max(160)).min(1).max(50),
    })
    .strict();
const payloadSchema = z.discriminatedUnion('kind', [settingsSchema, receiptSchema]);
type Settings = z.infer<typeof settingsSchema>;
export type VerifierReceipt = z.infer<typeof receiptSchema>;
type Payload = z.infer<typeof payloadSchema>;
type Stored = { _id: string; payload: Payload; encrypted: JWE };
type Scan = { records: Stored[]; unreadable: { _id: string }[]; unknownConsent: boolean };
// Only a holder-encrypted settings snapshot persists locally. No receipt metadata is cached here.
const consentCache = new Map<string, Settings | undefined>();
const consentKey = (context: HistoryContext) =>
    `lc.verifier-history-consent.v1:${context.wallet.id.did()}`;
const rememberConsent = (context: HistoryContext, record?: Stored): void => {
    if (!active(context)) return;
    const settings = record?.payload.kind === 'settings' ? record.payload : undefined;
    consentCache.set(context.wallet.id.did(), settings);
    try {
        if (settings && record)
            localStorage.setItem(consentKey(context), JSON.stringify(record.encrypted));
        else localStorage.removeItem(consentKey(context));
    } catch {
        /* Local storage is optional; unknown consent never enables recording. */
    }
};
const cachedConsent = async (context: HistoryContext): Promise<Settings | undefined> => {
    const did = context.wallet.id.did();
    if (consentCache.has(did)) return consentCache.get(did);
    try {
        const encrypted = localStorage.getItem(consentKey(context));
        if (!encrypted) return undefined;
        const value = await context.wallet.invoke.decryptDagJwe<unknown>(JSON.parse(encrypted));
        assertCurrent(context);
        const parsed = settingsSchema.safeParse(value);
        if (parsed.success) {
            consentCache.set(did, parsed.data);
            return parsed.data;
        }
    } catch {
        /* A cold/unreadable snapshot is skipped, without Cloud I/O or a failure toast. */
    }
    return undefined;
};
export type HistoryWallet = {
    id: { did(): string };
    invoke: {
        createDagJwe(value: unknown, recipients?: string[]): Promise<JWE>;
        decryptDagJwe<T>(value: JWE): Promise<T>;
        learnCloudCreate(value: Record<string, unknown>): Promise<boolean>;
        learnCloudReadPage(
            query: Record<string, unknown>,
            pagination: { limit: number; cursor?: string },
            includeAssociatedDids: boolean
        ): Promise<{ records: Record<string, unknown>[]; hasMore: boolean; cursor?: string }>;
        learnCloudDelete(
            query: Record<string, unknown>,
            includeAssociatedDids: boolean
        ): Promise<number | false>;
    };
};
export type HistoryContext = {
    wallet: HistoryWallet;
    // Must also become false on logout, switch-away-and-back, or managed-account selection.
    isCurrent(): boolean;
    eligible: boolean;
};
export type ReceiptDraft = Pick<
    VerifierReceipt,
    'protocol' | 'titles' | 'label' | 'origin' | 'purpose'
>;
export type RecordingResult = 'saved' | 'skipped' | 'unavailable';
export type DisclosureAttempt = {
    isCurrent(): boolean;
    finish(outcome: VerifierReceipt['outcome']): Promise<RecordingResult>;
};

const text = (value: unknown, limit: number): string | undefined =>
    typeof value === 'string'
        ? value
              .split('')
              .map(character =>
                  character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 ? ' ' : character
              )
              .join('')
              .trim()
              .slice(0, limit)
              .replace(/[\uD800-\uDBFF]$/, '') || undefined
        : undefined;
export const historyOrigin = (value: unknown): string | undefined => {
    try {
        const url = new URL(typeof value === 'string' ? value : '');
        return ['https:', 'http:'].includes(url.protocol) && url.origin.length <= 256
            ? url.origin
            : undefined;
    } catch {
        return undefined;
    }
};
/** Extract titles only. Never decode compact credentials or copy claims into a receipt. */
export const visibleCredentialTitles = (credentials: unknown[]): string[] =>
    credentials.slice(0, 50).map(value => {
        if (!value || typeof value !== 'object') return 'Credential';
        const vc = value as {
            name?: unknown;
            boostCredential?: { name?: unknown };
            credentialSubject?: { achievement?: { name?: unknown } };
        };
        return (
            text(
                vc.name ?? vc.boostCredential?.name ?? vc.credentialSubject?.achievement?.name,
                160
            ) ?? 'Credential'
        );
    });
const active = (context: HistoryContext) => context.eligible && context.isCurrent();
const assertCurrent = (context: HistoryContext) => {
    if (!active(context)) throw new Error('History unavailable for this account');
};
const settingsRecord = (records: Stored[]) =>
    records.filter(record => record.payload.kind === 'settings').at(-1);
const latestSettings = (records: Stored[]): Settings | undefined =>
    settingsRecord(records)?.payload as Settings | undefined;
const requireReadableConsent = (context: HistoryContext, scan: Scan): void => {
    // Cloud currently maps some storage failures to an empty result. Do not reset known consent.
    if (
        scan.unknownConsent ||
        (!latestSettings(scan.records) && consentCache.get(context.wallet.id.did()))
    )
        throw new Error('History settings could not be read');
};
const sameConsent = (a: Settings | undefined, b: Settings | undefined) =>
    a?.enabled === true &&
    b?.enabled === true &&
    a.revision === b.revision &&
    a.generation === b.generation;

/** Explicit cursor pagination; the generic Cloud read helper does not advance its cursor. */
const readAll = async (context: HistoryContext): Promise<Scan> => {
    const records: Stored[] = [];
    const unreadable: { _id: string }[] = [];
    let unknownConsent = false;
    const cursors = new Set<string>();
    let cursor: string | undefined;
    for (let pageNumber = 0; pageNumber < MAX_SCAN_PAGES; pageNumber++) {
        assertCurrent(context);
        const page = await context.wallet.invoke.learnCloudReadPage(
            { scope: HISTORY_SCOPE },
            { limit: 100, cursor },
            false
        );
        assertCurrent(context);
        for (const record of page.records) {
            if (
                record.scope !== HISTORY_SCOPE ||
                typeof record._id !== 'string' ||
                !/^[a-f0-9]{24}$/i.test(record._id)
            )
                continue;
            // Quarantine unreadable documents: routine reads/maintenance never delete them.
            try {
                const decrypted = await context.wallet.invoke.decryptDagJwe<unknown>(
                    record.payload as JWE
                );
                assertCurrent(context);
                const parsed = payloadSchema.safeParse(decrypted);
                if (parsed.success)
                    records.push({
                        _id: record._id,
                        payload: parsed.data,
                        encrypted: record.payload as JWE,
                    });
                else {
                    unreadable.push({ _id: record._id });
                    // An unsupported receipt cannot enable recording; unknown settings fail closed.
                    if (
                        !decrypted ||
                        typeof decrypted !== 'object' ||
                        (decrypted as { kind?: unknown }).kind !== 'receipt'
                    )
                        unknownConsent = true;
                }
            } catch {
                assertCurrent(context);
                unreadable.push({ _id: record._id });
                unknownConsent = true;
            }
        }
        if (!page.hasMore) return { records, unreadable, unknownConsent };
        if (!page.cursor || cursors.has(page.cursor)) throw new Error('History pagination failed');
        cursors.add(page.cursor);
        cursor = page.cursor;
    }
    throw new Error('History storage limit reached');
};
const append = async (context: HistoryContext, payload: Payload): Promise<void> => {
    assertCurrent(context);
    const encrypted = await context.wallet.invoke.createDagJwe(payload, [context.wallet.id.did()]);
    assertCurrent(context);
    const created = await context.wallet.invoke.learnCloudCreate({
        scope: HISTORY_SCOPE,
        payload: encrypted,
    });
    if (!created) throw new Error('History could not be saved');
    if (payload.kind === 'settings') rememberConsent(context, { _id: '', payload, encrypted });
};
const deleteExact = async (
    context: HistoryContext,
    records: { _id: string }[]
): Promise<boolean> => {
    for (const record of records) {
        assertCurrent(context);
        try {
            const deleted = await context.wallet.invoke.learnCloudDelete(
                { _id: record._id },
                false
            );
            if (deleted === false) return false;
        } catch {
            return false;
        }
    }
    return true;
};
const retained = (records: Stored[], settings: Settings | undefined, now: number): Stored[] => {
    const seen = new Set<string>();
    return records
        .filter(
            record =>
                record.payload.kind === 'receipt' &&
                record.payload.generation === settings?.generation &&
                Date.parse(record.payload.sentAt) >= now - HISTORY_RETENTION_MS &&
                Date.parse(record.payload.sentAt) <= now
        )
        .sort(
            (a, b) =>
                Date.parse((b.payload as VerifierReceipt).sentAt) -
                Date.parse((a.payload as VerifierReceipt).sentAt)
        )
        .filter(record => {
            const id = (record.payload as VerifierReceipt).eventId;
            if (seen.has(id)) return false;
            seen.add(id);
            return true;
        })
        .slice(0, HISTORY_LIMIT);
};
const maintain = async (
    context: HistoryContext,
    records: Stored[],
    settings: Settings | undefined,
    now: number
): Promise<boolean> => {
    const keep = new Set(retained(records, settings, now).map(record => record._id));
    // Retain recent settings so concurrent readers never need a mutable shared array or broad delete.
    records
        .filter(record => record.payload.kind === 'settings')
        .slice(-10)
        .forEach(record => keep.add(record._id));
    const deletable = records.filter(record => {
        if (keep.has(record._id)) return false;
        if (record.payload.kind === 'settings') return true;
        // Never infer a clear from missing settings/new generation, or delete a future-dated receipt.
        const sentAt = Date.parse(record.payload.sentAt);
        return (
            sentAt < now - HISTORY_RETENTION_MS ||
            (record.payload.generation === settings?.generation && sentAt <= now)
        );
    });
    const deleted = await deleteExact(context, deletable);
    return (
        deleted &&
        !records.some(
            record =>
                record.payload.kind === 'receipt' &&
                record.payload.generation !== settings?.generation &&
                Date.parse(record.payload.sentAt) >= now - HISTORY_RETENTION_MS
        )
    );
};
export const loadVerifierHistory = async (context: HistoryContext, now = Date.now()) => {
    await cachedConsent(context);
    const scan = await readAll(context);
    const settings = latestSettings(scan.records);
    if (!scan.unknownConsent) requireReadableConsent(context, scan);
    if (scan.unknownConsent || settings)
        rememberConsent(context, scan.unknownConsent ? undefined : settingsRecord(scan.records));
    const cleanupComplete = await maintain(context, scan.records, settings, now);
    assertCurrent(context);
    return {
        enabled: !scan.unknownConsent && (settings?.enabled ?? false),
        receipts: retained(scan.records, settings, now).map(
            record => record.payload as VerifierReceipt
        ),
        cleanupComplete: cleanupComplete && scan.unreadable.length === 0,
    };
};
export const setVerifierHistoryEnabled = async (
    context: HistoryContext,
    enabled: boolean
): Promise<void> => {
    await cachedConsent(context);
    const scan = await readAll(context);
    requireReadableConsent(context, scan);
    await append(context, {
        kind: 'settings',
        version: 1,
        enabled,
        revision: crypto.randomUUID(),
        generation: latestSettings(scan.records)?.generation ?? crypto.randomUUID(),
    });
};
export const clearVerifierHistory = async (context: HistoryContext): Promise<boolean> => {
    await cachedConsent(context);
    const scan = await readAll(context);
    // Clear is an explicit recovery action even when Cloud lost the cached settings.
    await append(context, {
        kind: 'settings',
        version: 1,
        enabled: scan.unknownConsent ? false : (latestSettings(scan.records)?.enabled ?? false),
        revision: crypto.randomUUID(),
        generation: crypto.randomUUID(),
    });
    // Explicit recovery: exact IDs in this holder's opaque history scope, including unreadable data.
    // Unknown consent remains disabled; no associated DID or broad query is ever deleted.
    return deleteExact(context, [
        ...scan.records.filter(record => record.payload.kind === 'receipt'),
        ...scan.unreadable,
    ]);
};
export const deleteVerifierReceipt = async (
    context: HistoryContext,
    eventId: string
): Promise<boolean> => {
    const { records } = await readAll(context);
    return deleteExact(
        context,
        records.filter(
            record => record.payload.kind === 'receipt' && record.payload.eventId === eventId
        )
    );
};

/** Capture consent before transport. Persistence never throws into, retries, or resends a disclosure. */
export const beginVerifierDisclosure = async (
    context: HistoryContext,
    draft: ReceiptDraft
): Promise<DisclosureAttempt> => {
    if (!active(context) || draft.titles.length === 0)
        return { isCurrent: context.isCurrent, finish: async () => 'skipped' };
    // Capture only local consent before transport. Never correlate a Cloud read with a send.
    const settings = await cachedConsent(context);
    const eventId = crypto.randomUUID();
    const captured = {
        protocol: draft.protocol,
        titles: draft.titles.slice(0, 50).map(title => text(title, 160) ?? 'Credential'),
        label: text(draft.label, 160),
        origin: historyOrigin(draft.origin),
        purpose: text(draft.purpose, 512),
    };
    let result: Promise<RecordingResult> | undefined;
    return {
        isCurrent: context.isCurrent,
        finish: outcome => {
            // Pin the transport timestamp and one persistence attempt, including uncertain writes.
            if (result) return result;
            const sentAt = new Date().toISOString();
            result = (async (): Promise<RecordingResult> => {
                if (!active(context) || !settings?.enabled) return 'skipped';
                try {
                    const before = await readAll(context);
                    if (
                        before.unknownConsent ||
                        !sameConsent(settings, latestSettings(before.records))
                    ) {
                        if (before.unknownConsent || latestSettings(before.records))
                            rememberConsent(
                                context,
                                before.unknownConsent ? undefined : settingsRecord(before.records)
                            );
                        return 'skipped';
                    }
                    const payload = receiptSchema.parse({
                        kind: 'receipt',
                        version: 1,
                        eventId,
                        generation: settings!.generation,
                        ...captured,
                        outcome,
                        sentAt,
                    });
                    // Never retry an uncertain create. Reconcile by event ID below instead.
                    try {
                        await append(context, payload);
                    } catch {
                        /* Reconcile a committed write whose acknowledgement was lost. */
                    }
                    const after = await readAll(context);
                    if (
                        after.unknownConsent ||
                        !sameConsent(settings, latestSettings(after.records))
                    ) {
                        if (after.unknownConsent || latestSettings(after.records))
                            rememberConsent(
                                context,
                                after.unknownConsent ? undefined : settingsRecord(after.records)
                            );
                        await deleteExact(
                            context,
                            after.records.filter(
                                record =>
                                    record.payload.kind === 'receipt' &&
                                    record.payload.eventId === eventId
                            )
                        );
                        return 'skipped';
                    }
                    if (
                        !after.records.some(
                            record =>
                                record.payload.kind === 'receipt' &&
                                record.payload.eventId === eventId
                        )
                    )
                        return 'unavailable';
                    // Cleanup failures belong to the settings notice, not a save-failed toast.
                    try {
                        await maintain(
                            context,
                            after.records,
                            latestSettings(after.records),
                            Date.now()
                        );
                    } catch {
                        /* Maintenance never changes a confirmed save. */
                    }
                    return 'saved';
                } catch {
                    return 'unavailable';
                }
            })();
            return result;
        },
    };
};

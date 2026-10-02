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
type Stored = { _id: string; payload: Payload };
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
              .slice(0, limit) || undefined
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
const latestSettings = (records: Stored[]): Settings | undefined =>
    records.filter(record => record.payload.kind === 'settings').at(-1)?.payload as
        Settings | undefined;
const sameConsent = (a: Settings | undefined, b: Settings | undefined) =>
    a?.enabled === true &&
    b?.enabled === true &&
    a.revision === b.revision &&
    a.generation === b.generation;

/** Explicit cursor pagination; the generic Cloud read helper does not advance its cursor. */
const readAll = async (context: HistoryContext): Promise<Stored[]> => {
    const records: Stored[] = [];
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
            // Fail closed on corruption; never delete a document whose payload we cannot validate.
            const decrypted = await context.wallet.invoke.decryptDagJwe<unknown>(
                record.payload as JWE
            );
            assertCurrent(context);
            const parsed = payloadSchema.safeParse(decrypted);
            if (!parsed.success) throw new Error('History data could not be read');
            records.push({ _id: record._id, payload: parsed.data });
        }
        if (!page.hasMore) return records;
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
};
const deleteExact = async (context: HistoryContext, records: Stored[]): Promise<boolean> => {
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
    return deleteExact(
        context,
        records.filter(record => !keep.has(record._id))
    );
};
export const loadVerifierHistory = async (context: HistoryContext, now = Date.now()) => {
    const records = await readAll(context);
    const settings = latestSettings(records);
    const cleanupComplete = await maintain(context, records, settings, now);
    assertCurrent(context);
    return {
        enabled: settings?.enabled ?? false,
        receipts: retained(records, settings, now).map(record => record.payload as VerifierReceipt),
        cleanupComplete,
    };
};
export const setVerifierHistoryEnabled = async (
    context: HistoryContext,
    enabled: boolean
): Promise<void> => {
    const records = await readAll(context);
    await append(context, {
        kind: 'settings',
        version: 1,
        enabled,
        revision: crypto.randomUUID(),
        generation: latestSettings(records)?.generation ?? crypto.randomUUID(),
    });
};
export const clearVerifierHistory = async (context: HistoryContext): Promise<boolean> => {
    const records = await readAll(context);
    await append(context, {
        kind: 'settings',
        version: 1,
        enabled: latestSettings(records)?.enabled ?? false,
        revision: crypto.randomUUID(),
        generation: crypto.randomUUID(),
    });
    // Only validated receipts captured before the clear; keep the newly appended preference.
    return deleteExact(
        context,
        records.filter(record => record.payload.kind === 'receipt')
    );
};
export const deleteVerifierReceipt = async (
    context: HistoryContext,
    eventId: string
): Promise<boolean> => {
    const records = await readAll(context);
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
    let settings: Settings | undefined;
    let ready = true;
    try {
        if (!active(context) || draft.titles.length === 0)
            return { isCurrent: context.isCurrent, finish: async () => 'skipped' };
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            settings = latestSettings(
                await Promise.race([
                    readAll(context),
                    new Promise<never>((_, reject) => {
                        timer = setTimeout(
                            () => reject(new Error('History lookup timed out')),
                            3000
                        );
                    }),
                ])
            );
        } finally {
            clearTimeout(timer);
        }
    } catch {
        ready = false;
    }
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
                if (!active(context) || (ready && !settings?.enabled)) return 'skipped';
                if (!ready) return 'unavailable';
                try {
                    const before = await readAll(context);
                    if (!sameConsent(settings, latestSettings(before))) return 'skipped';
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
                    if (!sameConsent(settings, latestSettings(after))) {
                        await deleteExact(
                            context,
                            after.filter(
                                record =>
                                    record.payload.kind === 'receipt' &&
                                    record.payload.eventId === eventId
                            )
                        );
                        return 'skipped';
                    }
                    if (
                        !after.some(
                            record =>
                                record.payload.kind === 'receipt' &&
                                record.payload.eventId === eventId
                        )
                    )
                        return 'unavailable';
                    return (await maintain(context, after, latestSettings(after), Date.now()))
                        ? 'saved'
                        : 'unavailable';
                } catch {
                    return 'unavailable';
                }
            })();
            return result;
        },
    };
};

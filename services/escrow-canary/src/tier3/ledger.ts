import { ConditionalCheckFailedException, DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
    BatchGetCommand,
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    QueryCommand,
    ScanCommand,
    TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { z } from 'zod';

/**
 * Tier-3 run ledger. It holds NO secrets: no resume tokens, ephemeral keys,
 * codes, emails, DIDs or configured account ids. Every write is a whole-item
 * compare-and-swap on `version` (or a create-if-absent), so two invocations can
 * never both own a transition.
 */
const millis = z.number().int().nonnegative();
const label = z.string().regex(/^hold-\d{2}$/);
const common = {
    pk: z.string(),
    sk: z.string(),
    env: z.string(),
    version: z.number().int(),
    updatedAt: millis,
};

export const metaSchema = z
    .object({
        ...common,
        type: z.literal('meta'),
        enabledAt: millis,
        paused: z.boolean(),
        pausedAt: millis.optional(),
    })
    .strict();
export const poolStates = ['idle', 'busy', 'orphaned', 'cooling', 'quarantined'] as const;
export const poolSchema = z
    .object({
        ...common,
        type: z.literal('pool'),
        label,
        state: z.enum(poolStates),
        runId: z.string().optional(),
        stateSince: millis,
        lastReturnedAt: millis,
        availableAt: millis.optional(),
        quarantineReason: z.string().optional(),
        orphanCleanupAttempted: z.boolean(),
    })
    .strict();
export const slotSchema = z
    .object({ ...common, type: z.literal('slot'), runId: z.string() })
    .strict();
export const runStates = [
    'starting',
    'awaiting_code',
    'confirming',
    'waiting',
    'warned',
    'releasing',
    'cancelling',
    'closed',
] as const;
export const runSchema = z
    .object({
        ...common,
        type: z.literal('run'),
        runId: z.string(),
        kind: z.enum(['daily', 'cancel']),
        label,
        state: z.enum(runStates),
        startRequestedAt: millis,
        startCallAt: millis.optional(),
        startedAt: millis.optional(),
        /** S3 key of the code email whose code was submitted (never the code). */
        codeObjectKey: z.string().optional(),
        codeObservedAt: millis.optional(),
        confirmCallStartedAt: millis.optional(),
        confirmRetried: z.boolean().optional(),
        confirmedAt: millis.optional(),
        warningObservedAt: millis.optional(),
        releaseAfter: millis.optional(),
        earlyRefusalCheckedAt: millis.optional(),
        releaseClaimedAt: millis.optional(),
        releasedAt: millis.optional(),
        reenrolledAt: millis.optional(),
        cancelRequestedAt: millis.optional(),
        cancelledAt: millis.optional(),
        closedAt: millis.optional(),
        closeReason: z.string().optional(),
        expiresAt: z.number().int().optional(),
    })
    .strict();
export const stepNames = [
    'CodeEmail',
    'Confirmed',
    'Warning',
    'Released',
    'Reenrolled',
    'Cancelled',
] as const;
export const stepSchema = z
    .object({
        ...common,
        type: z.literal('step'),
        runId: z.string(),
        name: z.enum(stepNames),
        dueAt: millis,
        observedAt: millis.optional(),
        outcome: z.enum(['1', '0', 'abandoned', 'operator_closed']).optional(),
        reason: z.string().optional(),
        expiresAt: z.number().int().optional(),
    })
    .strict();
export const itemSchema = z.discriminatedUnion('type', [
    metaSchema,
    poolSchema,
    slotSchema,
    runSchema,
    stepSchema,
]);
export type MetaItem = z.infer<typeof metaSchema>;
export type PoolItem = z.infer<typeof poolSchema>;
export type SlotItem = z.infer<typeof slotSchema>;
export type RunItem = z.infer<typeof runSchema>;
export type StepItem = z.infer<typeof stepSchema>;
export type StepName = (typeof stepNames)[number];
export type LedgerItem = z.infer<typeof itemSchema>;

export const keys = {
    meta: { pk: 'META', sk: 'META' },
    pool: (holdLabel: string) => ({ pk: `POOL#${holdLabel}`, sk: 'POOL' }),
    slot: (kind: 'daily' | 'cancel', slot: string) => ({ pk: `SLOT#${kind}#${slot}`, sk: 'SLOT' }),
    run: (runId: string) => ({ pk: `RUN#${runId}`, sk: 'RUN' }),
    step: (runId: string, name: StepName) => ({ pk: `RUN#${runId}`, sk: `STEP#${name}` }),
};

/** Throws (never coerces) on an unknown or malformed item. */
export const parseItem = (value: unknown): LedgerItem => {
    const parsed = itemSchema.safeParse(value);
    if (!parsed.success) throw new LedgerCorruptError();
    return parsed.data;
};

export class LedgerCorruptError extends Error {
    readonly reason = 'ledger';
    constructor() {
        super('Malformed tier 3 ledger item');
    }
}
/** Another invocation (or an earlier attempt) owns this transition. */
export class LedgerConflictError extends Error {
    readonly reason = 'ledger';
    constructor() {
        super('Tier 3 ledger condition failed');
    }
}

/** `create`: item must not exist. `replace`: stored version must equal `expectedVersion`. */
export type LedgerWrite =
    | { kind: 'create'; item: LedgerItem }
    | { kind: 'replace'; item: LedgerItem; expectedVersion: number };

export interface Ledger {
    get(key: { pk: string; sk: string }): Promise<LedgerItem | undefined>;
    getMany(keyList: { pk: string; sk: string }[]): Promise<LedgerItem[]>;
    /** All items under one run partition (header and steps). */
    run(runId: string): Promise<LedgerItem[]>;
    /** Whole-table, strongly consistent, fully paginated. Evaluator/admin only. */
    scanAll(): Promise<LedgerItem[]>;
    /** Atomic: all writes succeed or none do. Throws LedgerConflictError. */
    write(writes: LedgerWrite[]): Promise<void>;
}

/** Bump version/updatedAt for a replace. Returns a write; never mutates input. */
export const replace = <T extends LedgerItem>(
    item: T,
    changes: Partial<T>,
    now: number
): LedgerWrite => ({
    kind: 'replace',
    expectedVersion: item.version,
    item: { ...item, ...changes, version: item.version + 1, updatedAt: now } as LedgerItem,
});
export const create = (item: LedgerItem): LedgerWrite => ({ kind: 'create', item });

const strip = (item: LedgerItem): Record<string, unknown> =>
    Object.fromEntries(Object.entries(item).filter(([, value]) => value !== undefined));

export const createDynamoLedger = (
    table: string,
    client: DynamoDBDocumentClient = DynamoDBDocumentClient.from(
        new DynamoDBClient({ maxAttempts: 3 })
    )
): Ledger => {
    const condition = (write: LedgerWrite) =>
        write.kind === 'create'
            ? { ConditionExpression: 'attribute_not_exists(pk)' }
            : {
                  ConditionExpression: '#v = :v',
                  ExpressionAttributeNames: { '#v': 'version' },
                  ExpressionAttributeValues: { ':v': write.expectedVersion },
              };
    return {
        async get(key) {
            const response = await client.send(
                new GetCommand({ TableName: table, Key: key, ConsistentRead: true })
            );
            return response.Item ? parseItem(response.Item) : undefined;
        },
        async getMany(keyList) {
            if (keyList.length === 0) return [];
            if (keyList.length > 100) throw new Error('Too many ledger keys');
            const items: LedgerItem[] = [];
            let pending: { pk: string; sk: string }[] = keyList;
            for (let attempt = 0; pending.length > 0; attempt += 1) {
                if (attempt >= 5) throw new Error('Ledger batch read incomplete');
                const response = await client.send(
                    new BatchGetCommand({
                        RequestItems: { [table]: { Keys: pending, ConsistentRead: true } },
                    })
                );
                for (const item of response.Responses?.[table] ?? []) items.push(parseItem(item));
                pending = (response.UnprocessedKeys?.[table]?.Keys ?? []) as typeof pending;
            }
            return items;
        },
        async run(runId) {
            const items: LedgerItem[] = [];
            let start: Record<string, unknown> | undefined;
            do {
                const response = await client.send(
                    new QueryCommand({
                        TableName: table,
                        KeyConditionExpression: 'pk = :pk',
                        ExpressionAttributeValues: { ':pk': `RUN#${runId}` },
                        ConsistentRead: true,
                        ExclusiveStartKey: start,
                    })
                );
                for (const item of response.Items ?? []) items.push(parseItem(item));
                start = response.LastEvaluatedKey;
            } while (start);
            return items;
        },
        async scanAll() {
            const items: LedgerItem[] = [];
            let start: Record<string, unknown> | undefined;
            do {
                const response = await client.send(
                    new ScanCommand({
                        TableName: table,
                        ConsistentRead: true,
                        ExclusiveStartKey: start,
                    })
                );
                for (const item of response.Items ?? []) items.push(parseItem(item));
                start = response.LastEvaluatedKey;
            } while (start);
            return items;
        },
        async write(writes) {
            if (writes.length === 0) return;
            for (const write of writes) parseItem(write.item);
            try {
                if (writes.length === 1) {
                    await client.send(
                        new PutCommand({
                            TableName: table,
                            Item: strip(writes[0].item),
                            ...condition(writes[0]),
                        })
                    );
                    return;
                }
                await client.send(
                    new TransactWriteCommand({
                        TransactItems: writes.map(write => ({
                            Put: { TableName: table, Item: strip(write.item), ...condition(write) },
                        })),
                    })
                );
            } catch (error) {
                if (
                    error instanceof ConditionalCheckFailedException ||
                    (error instanceof Error && error.name === 'TransactionCanceledException')
                )
                    throw new LedgerConflictError();
                throw error;
            }
        },
    };
};

/** In-memory ledger with identical conditional semantics: tests and offline replay. */
export const createMemoryLedger = (
    initial: LedgerItem[] = []
): Ledger & { items: () => LedgerItem[] } => {
    const store = new Map<string, LedgerItem>();
    const id = (key: { pk: string; sk: string }) => `${key.pk}\u0000${key.sk}`;
    for (const item of initial) store.set(id(item), structuredClone(item));
    return {
        items: () => [...store.values()].map(item => structuredClone(item)),
        async get(key) {
            const item = store.get(id(key));
            return item ? parseItem(structuredClone(item)) : undefined;
        },
        async getMany(keyList) {
            return keyList.flatMap(key => {
                const item = store.get(id(key));
                return item ? [parseItem(structuredClone(item))] : [];
            });
        },
        async run(runId) {
            return [...store.values()]
                .filter(item => item.pk === `RUN#${runId}`)
                .map(item => parseItem(structuredClone(item)));
        },
        async scanAll() {
            return [...store.values()].map(item => parseItem(structuredClone(item)));
        },
        async write(writes) {
            const seen = new Set<string>();
            for (const write of writes) {
                parseItem(write.item);
                const key = id(write.item);
                if (seen.has(key)) throw new Error('Duplicate key in ledger transaction');
                seen.add(key);
                const existing = store.get(key);
                if (
                    write.kind === 'create' ? existing : existing?.version !== write.expectedVersion
                )
                    throw new LedgerConflictError();
            }
            for (const write of writes) store.set(id(write.item), structuredClone(write.item));
        },
    };
};

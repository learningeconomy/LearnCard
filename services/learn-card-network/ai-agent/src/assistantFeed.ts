import { createHash, randomUUID } from 'node:crypto';

import type { Db, Filter, ObjectId } from 'mongodb';
import { z } from 'zod';

import type { AgentToolDefinition } from './agent/types';
import type { MongoRuntime } from './mongo';
import {
    createFieldAad,
    isEncryptedEnvelope,
    type EncryptedJsonEnvelopeV1,
    type EncryptionService,
} from './security/encryption';

export const LEARNCARD_ASSISTANT_FEED_COLLECTION = 'learnCardAssistantFeedItems';

export const LEARNCARD_ASSISTANT_CARD_TYPES = [
    'message',
    'job-suggestion',
    'pathway-update',
    'action-item',
] as const;

export const LEARNCARD_ASSISTANT_CARD_PRIORITIES = ['normal', 'high'] as const;

export interface LearnCardAssistantCardCta {
    label: string;
    href: string;
}

export interface LearnCardAssistantCardFeedback {
    type: 'thumbs-down';
    createdAt: Date;
}

export interface LearnCardAssistantCard {
    _id?: ObjectId;
    id: string;
    ownerDid: string;
    dedupeKey?: string;
    type: (typeof LEARNCARD_ASSISTANT_CARD_TYPES)[number];
    title: string;
    description: string;
    detail?: string;
    priority: (typeof LEARNCARD_ASSISTANT_CARD_PRIORITIES)[number];
    cta?: LearnCardAssistantCardCta;
    sourceRunId?: string;
    readAt?: Date;
    feedback?: LearnCardAssistantCardFeedback;
    createdAt: Date;
    updatedAt: Date;
}

export interface RecordLearnCardAssistantCardInput {
    ownerDid: string;
    dedupeKey?: string;
    type: LearnCardAssistantCard['type'];
    title: string;
    description: string;
    detail?: string;
    priority?: LearnCardAssistantCard['priority'];
    cta?: LearnCardAssistantCardCta;
    sourceRunId?: string;
}

export interface LearnCardAssistantCardResponse
    extends Omit<
        LearnCardAssistantCard,
        '_id' | 'createdAt' | 'updatedAt' | 'readAt' | 'feedback'
    > {
    readAt?: string;
    feedback?: {
        type: 'thumbs-down';
        createdAt: string;
    };
    createdAt: string;
    updatedAt: string;
}

export interface LearnCardAssistantFeedRepository {
    findByDedupeKey: (
        ownerDid: string,
        dedupeKey: string
    ) => Promise<LearnCardAssistantCard | undefined>;
    findById: (ownerDid: string, id: string) => Promise<LearnCardAssistantCard | undefined>;
    insert: (item: LearnCardAssistantCard) => Promise<void>;
    replace: (item: LearnCardAssistantCard) => Promise<void>;
    listLatest: (ownerDid: string, limit: number) => Promise<LearnCardAssistantCard[]>;
}

export interface LearnCardAssistantFeedService {
    listLatest: (ownerDid: string, limit?: number) => Promise<LearnCardAssistantCard[]>;
    recordItem: (input: RecordLearnCardAssistantCardInput) => Promise<LearnCardAssistantCard>;
    markItemRead: (ownerDid: string, id: string) => Promise<LearnCardAssistantCard>;
    recordFeedback: (
        ownerDid: string,
        id: string,
        input: { type: 'thumbs-down' }
    ) => Promise<LearnCardAssistantCard>;
}

export interface LearnCardAssistantFeedRuntime {
    listLatest(ownerDid: string, limit?: number): Promise<LearnCardAssistantCard[]>;
    recordItem(input: RecordLearnCardAssistantCardInput): Promise<LearnCardAssistantCard>;
    markItemRead(ownerDid: string, id: string): Promise<LearnCardAssistantCard>;
    recordFeedback(
        ownerDid: string,
        id: string,
        input: { type: 'thumbs-down' }
    ): Promise<LearnCardAssistantCard>;
    loadRequestTools(ownerDid?: string): Promise<AgentToolDefinition[]>;
    getStatus(): Promise<{ configured: boolean; connected: boolean }>;
}

export interface LearnCardAssistantFeedRuntimeOptions {
    mongoRuntime: MongoRuntime;
    service?: LearnCardAssistantFeedService;
    getEncryption?: () => EncryptionService;
}

type StoredLearnCardAssistantCard = Omit<
    LearnCardAssistantCard,
    'dedupeKey' | 'title' | 'description' | 'detail' | 'cta' | 'feedback'
> & {
    dedupeKey?: string | EncryptedJsonEnvelopeV1;
    dedupeKeyHash?: string;
    title: string | EncryptedJsonEnvelopeV1;
    description: string | EncryptedJsonEnvelopeV1;
    detail?: string | EncryptedJsonEnvelopeV1;
    cta?: LearnCardAssistantCardCta | EncryptedJsonEnvelopeV1;
    feedback?: LearnCardAssistantCardFeedback | EncryptedJsonEnvelopeV1;
};

const getDedupeKeyHash = (ownerDid: string, dedupeKey: string): string =>
    createHash('sha256').update(`${ownerDid}\0${dedupeKey}`).digest('hex');

const AssistantCardCtaValidator = z
    .object({
        label: z.string().trim().min(1).max(32),
        href: z.string().trim().min(1).max(500),
    })
    .strict();

export const RecordLearnCardAssistantCardValidator = z
    .object({
        ownerDid: z.string().trim().min(1),
        dedupeKey: z.string().trim().min(1).max(120).optional(),
        type: z.enum(LEARNCARD_ASSISTANT_CARD_TYPES),
        title: z.string().trim().min(1).max(90),
        description: z.string().trim().min(1).max(220),
        detail: z.string().trim().min(1).max(2000).optional(),
        priority: z.enum(LEARNCARD_ASSISTANT_CARD_PRIORITIES).default('normal'),
        cta: AssistantCardCtaValidator.optional(),
        sourceRunId: z.string().trim().min(1).optional(),
    })
    .strict();

export const LearnCardAssistantCardToolInputValidator = RecordLearnCardAssistantCardValidator.omit({
    ownerDid: true,
    sourceRunId: true,
});

const FeedbackValidator = z.object({ type: z.literal('thumbs-down') }).strict();

const clampLimit = (limit = 10): number => {
    const parsed = Math.trunc(limit);

    return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 50) : 10;
};

const sortLatest = (items: LearnCardAssistantCard[]): LearnCardAssistantCard[] =>
    [...items].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

const cloneItem = (item: LearnCardAssistantCard): LearnCardAssistantCard => ({
    ...item,
    ...(item.cta ? { cta: { ...item.cta } } : {}),
    ...(item.readAt ? { readAt: new Date(item.readAt) } : {}),
    ...(item.feedback
        ? { feedback: { ...item.feedback, createdAt: new Date(item.feedback.createdAt) } }
        : {}),
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
});

export const toLearnCardAssistantCardResponse = (
    item: LearnCardAssistantCard
): LearnCardAssistantCardResponse => ({
    id: item.id,
    ownerDid: item.ownerDid,
    ...(item.dedupeKey ? { dedupeKey: item.dedupeKey } : {}),
    type: item.type,
    title: item.title,
    description: item.description,
    ...(item.detail ? { detail: item.detail } : {}),
    priority: item.priority,
    ...(item.cta ? { cta: { ...item.cta } } : {}),
    ...(item.sourceRunId ? { sourceRunId: item.sourceRunId } : {}),
    ...(item.readAt ? { readAt: item.readAt.toISOString() } : {}),
    ...(item.feedback
        ? {
              feedback: {
                  type: item.feedback.type,
                  createdAt: item.feedback.createdAt.toISOString(),
              },
          }
        : {}),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
});

export const createMongoLearnCardAssistantFeedRepository = (
    db: Db,
    encryption: EncryptionService
): LearnCardAssistantFeedRepository => {
    const collection = db.collection<StoredLearnCardAssistantCard>(
        LEARNCARD_ASSISTANT_FEED_COLLECTION
    );
    let indexesReady: Promise<void> | undefined;
    let migrationReady: Promise<void> | undefined;

    const aad = (
        item: Pick<LearnCardAssistantCard, 'ownerDid' | 'id'>,
        fieldPath: string
    ): string =>
        createFieldAad({
            collectionName: LEARNCARD_ASSISTANT_FEED_COLLECTION,
            ownerDid: item.ownerDid,
            stableRecordId: item.id,
            fieldPath,
        });

    const encryptItem = async (
        item: LearnCardAssistantCard
    ): Promise<StoredLearnCardAssistantCard> => ({
        ...item,
        ...(item.dedupeKey
            ? {
                  dedupeKey: await encryption.encryptJson(item.dedupeKey, aad(item, 'dedupeKey')),
                  dedupeKeyHash: getDedupeKeyHash(item.ownerDid, item.dedupeKey),
              }
            : {}),
        title: await encryption.encryptJson(item.title, aad(item, 'title')),
        description: await encryption.encryptJson(item.description, aad(item, 'description')),
        ...(item.detail
            ? { detail: await encryption.encryptJson(item.detail, aad(item, 'detail')) }
            : {}),
        ...(item.cta ? { cta: await encryption.encryptJson(item.cta, aad(item, 'cta')) } : {}),
        ...(item.feedback
            ? { feedback: await encryption.encryptJson(item.feedback, aad(item, 'feedback')) }
            : {}),
    });

    const decryptOptional = async <T>(
        item: Pick<LearnCardAssistantCard, 'ownerDid' | 'id'>,
        value: T | EncryptedJsonEnvelopeV1 | undefined,
        fieldPath: string
    ): Promise<{ value?: T; legacyPlaintext: boolean }> => {
        if (value === undefined) return { legacyPlaintext: false };

        return encryption.decryptLegacyOrEnvelope<T>(value, aad(item, fieldPath));
    };

    const decryptItem = async (
        item: StoredLearnCardAssistantCard
    ): Promise<{ item: LearnCardAssistantCard; legacyPlaintext: boolean }> => {
        const dedupeKey = await decryptOptional<string>(item, item.dedupeKey, 'dedupeKey');
        const title = await encryption.decryptLegacyOrEnvelope<string>(
            item.title,
            aad(item, 'title')
        );
        const description = await encryption.decryptLegacyOrEnvelope<string>(
            item.description,
            aad(item, 'description')
        );
        const detail = await decryptOptional<string>(item, item.detail, 'detail');
        const cta = await decryptOptional<LearnCardAssistantCardCta>(item, item.cta, 'cta');
        const feedback = await decryptOptional<LearnCardAssistantCardFeedback>(
            item,
            item.feedback,
            'feedback'
        );

        return {
            item: {
                ...(item._id ? { _id: item._id } : {}),
                id: item.id,
                ownerDid: item.ownerDid,
                type: item.type,
                priority: item.priority,
                ...(item.sourceRunId ? { sourceRunId: item.sourceRunId } : {}),
                ...(item.readAt ? { readAt: item.readAt } : {}),
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                ...(dedupeKey.value ? { dedupeKey: dedupeKey.value } : {}),
                title: title.value,
                description: description.value,
                ...(detail.value ? { detail: detail.value } : {}),
                ...(cta.value ? { cta: cta.value } : {}),
                ...(feedback.value ? { feedback: feedback.value } : {}),
            },
            legacyPlaintext:
                dedupeKey.legacyPlaintext ||
                title.legacyPlaintext ||
                description.legacyPlaintext ||
                detail.legacyPlaintext ||
                cta.legacyPlaintext ||
                feedback.legacyPlaintext ||
                Boolean(dedupeKey.value && !item.dedupeKeyHash),
        };
    };

    const needsMigration = (item: StoredLearnCardAssistantCard): boolean =>
        !isEncryptedEnvelope(item.title) ||
        !isEncryptedEnvelope(item.description) ||
        Boolean(item.dedupeKey && !isEncryptedEnvelope(item.dedupeKey)) ||
        Boolean(item.dedupeKey && !item.dedupeKeyHash) ||
        Boolean(item.detail && !isEncryptedEnvelope(item.detail)) ||
        Boolean(item.cta && !isEncryptedEnvelope(item.cta)) ||
        Boolean(item.feedback && !isEncryptedEnvelope(item.feedback));

    const migrateExisting = async (): Promise<void> => {
        const items = await collection.find({}).toArray();

        await Promise.all(
            items.filter(needsMigration).map(async item => {
                const decrypted = await decryptItem(item);
                await collection.replaceOne(
                    {
                        ownerDid: item.ownerDid,
                        id: item.id,
                    } as Filter<StoredLearnCardAssistantCard>,
                    await encryptItem(decrypted.item),
                    { upsert: false }
                );
            })
        );
    };

    const ensureIndexes = async (): Promise<void> => {
        indexesReady ??= Promise.all([
            collection.createIndex({ ownerDid: 1, id: 1 }, { unique: true }),
            collection.createIndex(
                { ownerDid: 1, dedupeKeyHash: 1 },
                { unique: true, sparse: true }
            ),
            collection.createIndex({ ownerDid: 1, createdAt: -1 }),
        ]).then(() => undefined);

        await indexesReady;

        migrationReady ??= migrateExisting();

        await migrationReady;
    };

    return {
        findByDedupeKey: async (ownerDid, dedupeKey) => {
            await ensureIndexes();

            const stored =
                (await collection.findOne({
                    ownerDid,
                    dedupeKeyHash: getDedupeKeyHash(ownerDid, dedupeKey),
                } as Filter<StoredLearnCardAssistantCard>)) ?? undefined;

            return stored ? (await decryptItem(stored)).item : undefined;
        },
        findById: async (ownerDid, id) => {
            await ensureIndexes();

            const stored =
                (await collection.findOne({
                    ownerDid,
                    id,
                } as Filter<StoredLearnCardAssistantCard>)) ?? undefined;

            return stored ? (await decryptItem(stored)).item : undefined;
        },
        insert: async item => {
            await ensureIndexes();
            await collection.insertOne(await encryptItem(item));
        },
        replace: async item => {
            await ensureIndexes();
            await collection.replaceOne(
                { ownerDid: item.ownerDid, id: item.id } as Filter<StoredLearnCardAssistantCard>,
                await encryptItem(item),
                { upsert: false }
            );
        },
        listLatest: async (ownerDid, limit) => {
            await ensureIndexes();

            const items = await collection
                .find({ ownerDid } as Filter<StoredLearnCardAssistantCard>)
                .sort({ createdAt: -1 })
                .limit(limit)
                .toArray();

            return Promise.all(items.map(async item => (await decryptItem(item)).item));
        },
    };
};

export const createInMemoryLearnCardAssistantFeedRepository = (
    initialItems: LearnCardAssistantCard[] = []
): LearnCardAssistantFeedRepository => {
    const items = new Map<string, LearnCardAssistantCard>();
    const keyFor = (ownerDid: string, id: string): string => `${ownerDid}\u0000${id}`;

    for (const item of initialItems) items.set(keyFor(item.ownerDid, item.id), cloneItem(item));

    return {
        findByDedupeKey: async (ownerDid, dedupeKey) => {
            const item = [...items.values()].find(
                item => item.ownerDid === ownerDid && item.dedupeKey === dedupeKey
            );

            return item ? cloneItem(item) : undefined;
        },
        findById: async (ownerDid, id) => {
            const item = items.get(keyFor(ownerDid, id));

            return item ? cloneItem(item) : undefined;
        },
        insert: async item => {
            const key = keyFor(item.ownerDid, item.id);

            if (items.has(key)) throw new Error(`Assistant card already exists: ${item.id}`);
            if (
                item.dedupeKey &&
                [...items.values()].some(
                    existing =>
                        existing.ownerDid === item.ownerDid && existing.dedupeKey === item.dedupeKey
                )
            ) {
                throw new Error(`Assistant card already exists: ${item.dedupeKey}`);
            }

            items.set(key, cloneItem(item));
        },
        replace: async item => {
            items.set(keyFor(item.ownerDid, item.id), cloneItem(item));
        },
        listLatest: async (ownerDid, limit) =>
            sortLatest([...items.values()].filter(item => item.ownerDid === ownerDid))
                .slice(0, limit)
                .map(cloneItem),
    };
};

export const createLearnCardAssistantFeedService = (
    repository: LearnCardAssistantFeedRepository
): LearnCardAssistantFeedService => ({
    listLatest: async (ownerDid, limit) =>
        repository
            .listLatest(ownerDid.trim(), clampLimit(limit))
            .then(items => items.map(cloneItem)),
    recordItem: async input => {
        const parsed = RecordLearnCardAssistantCardValidator.parse(input);
        const now = new Date();
        const existing = parsed.dedupeKey
            ? await repository.findByDedupeKey(parsed.ownerDid, parsed.dedupeKey)
            : undefined;
        const item: LearnCardAssistantCard = existing
            ? {
                  ...existing,
                  type: parsed.type,
                  title: parsed.title,
                  description: parsed.description,
                  detail: parsed.detail,
                  priority: parsed.priority,
                  cta: parsed.cta,
                  sourceRunId: parsed.sourceRunId,
                  updatedAt: now,
              }
            : {
                  id: randomUUID(),
                  ownerDid: parsed.ownerDid,
                  dedupeKey: parsed.dedupeKey,
                  type: parsed.type,
                  title: parsed.title,
                  description: parsed.description,
                  detail: parsed.detail,
                  priority: parsed.priority,
                  cta: parsed.cta,
                  sourceRunId: parsed.sourceRunId,
                  createdAt: now,
                  updatedAt: now,
              };

        if (existing) await repository.replace(item);
        else await repository.insert(item);

        return cloneItem(item);
    },
    markItemRead: async (ownerDid, id) => {
        const item = await repository.findById(ownerDid.trim(), id.trim());
        if (!item) throw new Error('Assistant card not found.');

        const updated = { ...item, readAt: new Date(), updatedAt: new Date() };

        await repository.replace(updated);

        return cloneItem(updated);
    },
    recordFeedback: async (ownerDid, id, input) => {
        const parsed = FeedbackValidator.parse(input);
        const item = await repository.findById(ownerDid.trim(), id.trim());
        if (!item) throw new Error('Assistant card not found.');

        const now = new Date();
        const updated: LearnCardAssistantCard = {
            ...item,
            feedback: { type: parsed.type, createdAt: now },
            updatedAt: now,
        };

        await repository.replace(updated);

        return cloneItem(updated);
    },
});

export const createMongoLearnCardAssistantFeedService = (
    db: Db,
    encryption: EncryptionService
): LearnCardAssistantFeedService =>
    createLearnCardAssistantFeedService(
        createMongoLearnCardAssistantFeedRepository(db, encryption)
    );

const toolParameters = {
    type: 'object',
    properties: {
        dedupeKey: {
            type: 'string',
            description:
                'Optional stable key for refreshing the same recommendation across agent runs.',
        },
        type: {
            type: 'string',
            enum: LEARNCARD_ASSISTANT_CARD_TYPES,
            description: 'Assistant inbox card type.',
        },
        title: {
            type: 'string',
            description: 'Short learner-facing title.',
        },
        description: {
            type: 'string',
            description: 'One concise learner-facing sentence.',
        },
        detail: {
            type: 'string',
            description: 'Optional supporting detail.',
        },
        priority: {
            type: 'string',
            enum: LEARNCARD_ASSISTANT_CARD_PRIORITIES,
            description: 'Use high only when the learner should see the card immediately.',
        },
        cta: {
            type: 'object',
            properties: {
                label: { type: 'string', description: 'Short button label.' },
                href: { type: 'string', description: 'Internal route or external URL.' },
            },
            required: ['label', 'href'],
            additionalProperties: false,
        },
    },
    required: ['type', 'title', 'description'],
    additionalProperties: false,
};

export const createLearnCardAssistantFeedTools = ({
    ownerDid,
    feedService,
}: {
    ownerDid: string;
    feedService: LearnCardAssistantFeedService;
}): AgentToolDefinition[] => [
    {
        name: 'recordLearnCardAssistantCard',
        description:
            'Create or update one LearnCard Assistant inbox card for the current learner. Use a stable dedupeKey when refreshing the same recommendation across runs.',
        parameters: toolParameters,
        execute: async (args, context) => {
            const parsed = LearnCardAssistantCardToolInputValidator.parse(args);
            const item = await feedService.recordItem({
                ...parsed,
                ownerDid,
                sourceRunId: context.runId,
            });

            return toLearnCardAssistantCardResponse(item);
        },
    },
];

export const createLearnCardAssistantFeedRuntime = ({
    mongoRuntime,
    service,
    getEncryption,
}: LearnCardAssistantFeedRuntimeOptions): LearnCardAssistantFeedRuntime => {
    let servicePromise: Promise<LearnCardAssistantFeedService | undefined> | undefined;

    const getService = async (): Promise<LearnCardAssistantFeedService | undefined> => {
        if (service) return service;

        servicePromise ??= (async () => {
            const status = await mongoRuntime.getStatus();
            if (!status.connected) {
                if (!status.configured) return undefined;
                throw new Error('LearnCard Assistant feed storage is not available.');
            }
            if (!getEncryption) {
                throw new Error('Encrypted LearnCard Assistant feed storage is not configured.');
            }

            return createMongoLearnCardAssistantFeedService(
                await mongoRuntime.getDb(),
                getEncryption()
            );
        })();

        return servicePromise;
    };

    const requireService = async (): Promise<LearnCardAssistantFeedService> => {
        const service = await getService();
        if (!service) throw new Error('LearnCard Assistant feed storage is not available.');

        return service;
    };

    return {
        listLatest: async (ownerDid, limit) => {
            const service = await getService();
            if (!service) return [];

            return service.listLatest(ownerDid, limit);
        },
        recordItem: async input => (await requireService()).recordItem(input),
        markItemRead: async (ownerDid, id) => (await requireService()).markItemRead(ownerDid, id),
        recordFeedback: async (ownerDid, id, input) =>
            (await requireService()).recordFeedback(ownerDid, id, input),
        loadRequestTools: async ownerDid => {
            const trimmedDid = ownerDid?.trim();
            if (!trimmedDid) return [];

            const service = await getService();
            if (!service) return [];

            return createLearnCardAssistantFeedTools({
                ownerDid: trimmedDid,
                feedService: service,
            });
        },
        getStatus: async () => {
            if (service) return { configured: true, connected: true };

            const status = await mongoRuntime.getStatus();

            return {
                configured: status.configured,
                connected: status.connected,
            };
        },
    };
};

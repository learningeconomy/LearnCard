import { randomUUID } from 'node:crypto';

import type { Db, Filter, ObjectId } from 'mongodb';
import { z } from 'zod';

import type { AgentToolDefinition } from './agent/types';
import type { MongoRuntime } from './mongo';

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
}

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
    db: Db
): LearnCardAssistantFeedRepository => {
    const collection = db.collection<LearnCardAssistantCard>(LEARNCARD_ASSISTANT_FEED_COLLECTION);
    let indexesReady: Promise<void> | undefined;

    const ensureIndexes = async (): Promise<void> => {
        indexesReady ??= Promise.all([
            collection.createIndex({ ownerDid: 1, id: 1 }, { unique: true }),
            collection.createIndex({ ownerDid: 1, dedupeKey: 1 }, { unique: true, sparse: true }),
            collection.createIndex({ ownerDid: 1, createdAt: -1 }),
        ]).then(() => undefined);

        await indexesReady;
    };

    return {
        findByDedupeKey: async (ownerDid, dedupeKey) => {
            await ensureIndexes();

            return (
                (await collection.findOne({
                    ownerDid,
                    dedupeKey,
                } as Filter<LearnCardAssistantCard>)) ?? undefined
            );
        },
        findById: async (ownerDid, id) => {
            await ensureIndexes();

            return (
                (await collection.findOne({ ownerDid, id } as Filter<LearnCardAssistantCard>)) ??
                undefined
            );
        },
        insert: async item => {
            await ensureIndexes();
            await collection.insertOne(item);
        },
        replace: async item => {
            await ensureIndexes();
            await collection.replaceOne(
                { ownerDid: item.ownerDid, id: item.id } as Filter<LearnCardAssistantCard>,
                item,
                { upsert: false }
            );
        },
        listLatest: async (ownerDid, limit) => {
            await ensureIndexes();

            return collection
                .find({ ownerDid } as Filter<LearnCardAssistantCard>)
                .sort({ createdAt: -1 })
                .limit(limit)
                .toArray();
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

export const createMongoLearnCardAssistantFeedService = (db: Db): LearnCardAssistantFeedService =>
    createLearnCardAssistantFeedService(createMongoLearnCardAssistantFeedRepository(db));

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
}: LearnCardAssistantFeedRuntimeOptions): LearnCardAssistantFeedRuntime => {
    let servicePromise: Promise<LearnCardAssistantFeedService | undefined> | undefined;

    const getService = async (): Promise<LearnCardAssistantFeedService | undefined> => {
        if (service) return service;

        servicePromise ??= (async () => {
            const status = await mongoRuntime.getStatus();
            if (!status.connected) return undefined;

            return createMongoLearnCardAssistantFeedService(await mongoRuntime.getDb());
        })().catch(() => {
            servicePromise = undefined;

            return undefined;
        });

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

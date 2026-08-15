import { randomUUID } from 'node:crypto';

import { Cron } from 'croner';
import type { Db, Filter, ObjectId } from 'mongodb';
import { z } from 'zod';

import type { MongoRuntime } from '../mongo';
import {
    createFieldAad,
    type EncryptedJsonEnvelopeV1,
    type EncryptionService,
} from '../security/encryption';

export const AGENT_AUTONOMY_SCHEDULES_COLLECTION = 'agentAutonomySchedules';
export const MAX_AGENT_AUTONOMY_SCHEDULES_PER_OWNER = 10;

export type AutonomyDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface AgentAutonomySchedule {
    id: string;
    ownerDid: string;
    name: string;
    prompt: string;
    enabled: boolean;
    timeOfDay: string;
    daysOfWeek: AutonomyDayOfWeek[];
    timezone: string;
    cron: string;
    nextRunAt: Date;
    triggerScheduleId?: string;
    triggerSyncedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface DueAgentAutonomySchedule {
    id: string;
    ownerDid: string;
    nextRunAt: Date;
}

export interface CreateAgentAutonomyScheduleInput {
    ownerDid: string;
    name: string;
    prompt: string;
    enabled?: boolean;
    timeOfDay: string;
    daysOfWeek: AutonomyDayOfWeek[];
    timezone: string;
}

export interface UpdateAgentAutonomyScheduleInput {
    ownerDid: string;
    id: string;
    name?: string;
    prompt?: string;
    enabled?: boolean;
    timeOfDay?: string;
    daysOfWeek?: AutonomyDayOfWeek[];
    timezone?: string;
}

export interface AgentAutonomyScheduleResponse {
    id: string;
    ownerDid: string;
    name: string;
    prompt: string;
    enabled: boolean;
    timeOfDay: string;
    daysOfWeek: AutonomyDayOfWeek[];
    timezone: string;
    cron: string;
    nextRunAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface AgentAutonomyScheduleRepository {
    listByOwner(ownerDid: string): Promise<AgentAutonomySchedule[]>;
    findById(ownerDid: string, id: string): Promise<AgentAutonomySchedule | undefined>;
    countByOwner(ownerDid: string): Promise<number>;
    create(schedule: AgentAutonomySchedule): Promise<void>;
    replace(schedule: AgentAutonomySchedule): Promise<boolean>;
    remove(ownerDid: string, id: string): Promise<boolean>;
    findByTriggerScheduleId(
        ownerDid: string,
        triggerScheduleId: string
    ): Promise<AgentAutonomySchedule | undefined>;
    setTriggerScheduleSync(
        ownerDid: string,
        id: string,
        triggerScheduleId: string,
        syncedAt: Date
    ): Promise<boolean>;
    clearTriggerScheduleSync(ownerDid: string, id: string): Promise<boolean>;
    listDue(ownerDids: string[], at: Date): Promise<DueAgentAutonomySchedule[]>;
    advanceNextRun(
        ownerDid: string,
        id: string,
        scheduledFor: Date,
        nextRunAt: Date,
        updatedAt: Date
    ): Promise<boolean>;
}

export interface AgentAutonomyScheduleService {
    list(ownerDid: string): Promise<AgentAutonomySchedule[]>;
    get(ownerDid: string, id: string): Promise<AgentAutonomySchedule | undefined>;
    create(input: CreateAgentAutonomyScheduleInput): Promise<AgentAutonomySchedule>;
    update(input: UpdateAgentAutonomyScheduleInput): Promise<AgentAutonomySchedule>;
    remove(ownerDid: string, id: string): Promise<boolean>;
    getByTriggerScheduleId(
        ownerDid: string,
        triggerScheduleId: string
    ): Promise<AgentAutonomySchedule | undefined>;
    setTriggerScheduleSync(
        ownerDid: string,
        id: string,
        triggerScheduleId: string,
        syncedAt?: Date
    ): Promise<boolean>;
    clearTriggerScheduleSync(ownerDid: string, id: string): Promise<boolean>;
    listDue(ownerDids: string[], at?: Date): Promise<DueAgentAutonomySchedule[]>;
    advanceNextRun(ownerDid: string, id: string, scheduledFor: Date, now?: Date): Promise<boolean>;
}

export interface LearnCardAssistantSchedulesRuntime extends AgentAutonomyScheduleService {
    getStatus(): Promise<{ configured: boolean; connected: boolean }>;
}

export interface LearnCardAssistantSchedulesRuntimeOptions {
    mongoRuntime: MongoRuntime;
    service?: AgentAutonomyScheduleService;
    getEncryption?: () => EncryptionService;
    now?: () => Date;
    createId?: () => string;
}

type StoredAgentAutonomySchedule = Omit<AgentAutonomySchedule, 'name' | 'prompt'> & {
    _id?: ObjectId;
    name: EncryptedJsonEnvelopeV1;
    prompt: EncryptedJsonEnvelopeV1;
};

const TimeOfDayValidator = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);

const DaysOfWeekValidator = z
    .array(z.number().int().min(0).max(6))
    .min(1)
    .max(7)
    .refine(days => new Set(days).size === days.length, 'Days of week must be unique.')
    .transform(days => [...days].sort((a, b) => a - b) as AutonomyDayOfWeek[]);

const TimezoneValidator = z
    .string()
    .trim()
    .min(1)
    .refine(timezone => {
        try {
            new Intl.DateTimeFormat('en-US', { timeZone: timezone });

            return true;
        } catch {
            return false;
        }
    }, 'Timezone must be a valid IANA timezone identifier.');

export const CreateAgentAutonomyScheduleBodyValidator = z
    .object({
        name: z.string().trim().min(1).max(60),
        prompt: z.string().trim().min(1).max(4_000),
        enabled: z.boolean().optional().default(true),
        timeOfDay: TimeOfDayValidator,
        daysOfWeek: DaysOfWeekValidator,
        timezone: TimezoneValidator,
    })
    .strict();

export const CreateAgentAutonomyScheduleValidator = CreateAgentAutonomyScheduleBodyValidator.extend(
    {
        ownerDid: z.string().trim().min(1),
    }
).strict();

export const UpdateAgentAutonomyScheduleBodyValidator = z
    .object({
        name: z.string().trim().min(1).max(60).optional(),
        prompt: z.string().trim().min(1).max(4_000).optional(),
        enabled: z.boolean().optional(),
        timeOfDay: TimeOfDayValidator.optional(),
        daysOfWeek: DaysOfWeekValidator.optional(),
        timezone: TimezoneValidator.optional(),
    })
    .strict()
    .refine(
        input =>
            input.name !== undefined ||
            input.prompt !== undefined ||
            input.enabled !== undefined ||
            input.timeOfDay !== undefined ||
            input.daysOfWeek !== undefined ||
            input.timezone !== undefined,
        'At least one schedule field must be updated.'
    );

export const UpdateAgentAutonomyScheduleValidator =
    UpdateAgentAutonomyScheduleBodyValidator.safeExtend({
        ownerDid: z.string().trim().min(1),
        id: z.string().trim().min(1),
    });

export class AgentAutonomyScheduleLimitError extends Error {
    public constructor() {
        super(`You can create up to ${MAX_AGENT_AUTONOMY_SCHEDULES_PER_OWNER} schedules.`);
        this.name = 'AgentAutonomyScheduleLimitError';
    }
}

export class AgentAutonomyScheduleNotFoundError extends Error {
    public constructor() {
        super('Assistant schedule not found.');
        this.name = 'AgentAutonomyScheduleNotFoundError';
    }
}

export const getCanonicalScheduleCron = (
    timeOfDay: string,
    daysOfWeek: AutonomyDayOfWeek[]
): string => {
    const parsedTime = TimeOfDayValidator.parse(timeOfDay);
    const parsedDays = DaysOfWeekValidator.parse(daysOfWeek);
    const [hour, minute] = parsedTime.split(':').map(Number);

    return `${minute} ${hour} * * ${parsedDays.join(',')}`;
};

export const getNextScheduleRun = (cron: string, timezone: string, after: Date): Date => {
    TimezoneValidator.parse(timezone);

    const nextRun = new Cron(cron, { timezone, paused: true }).nextRun(after);

    if (!nextRun || nextRun.getTime() <= after.getTime()) {
        throw new Error('Schedule does not produce a future run date.');
    }

    return nextRun;
};

const cloneSchedule = (schedule: AgentAutonomySchedule): AgentAutonomySchedule => ({
    ...schedule,
    daysOfWeek: [...schedule.daysOfWeek],
    nextRunAt: new Date(schedule.nextRunAt),
    createdAt: new Date(schedule.createdAt),
    updatedAt: new Date(schedule.updatedAt),
    ...(schedule.triggerSyncedAt ? { triggerSyncedAt: new Date(schedule.triggerSyncedAt) } : {}),
});

const cloneDueSchedule = (schedule: DueAgentAutonomySchedule): DueAgentAutonomySchedule => ({
    ...schedule,
    nextRunAt: new Date(schedule.nextRunAt),
});

const sortSchedules = (schedules: AgentAutonomySchedule[]): AgentAutonomySchedule[] =>
    [...schedules].sort(
        (a, b) =>
            Number(b.enabled) - Number(a.enabled) ||
            a.nextRunAt.getTime() - b.nextRunAt.getTime() ||
            a.name.localeCompare(b.name)
    );

const sortDueSchedules = (schedules: DueAgentAutonomySchedule[]): DueAgentAutonomySchedule[] =>
    [...schedules].sort(
        (a, b) =>
            a.nextRunAt.getTime() - b.nextRunAt.getTime() ||
            a.ownerDid.localeCompare(b.ownerDid) ||
            a.id.localeCompare(b.id)
    );

export const toAgentAutonomyScheduleResponse = (
    schedule: AgentAutonomySchedule
): AgentAutonomyScheduleResponse => ({
    id: schedule.id,
    ownerDid: schedule.ownerDid,
    name: schedule.name,
    prompt: schedule.prompt,
    enabled: schedule.enabled,
    timeOfDay: schedule.timeOfDay,
    daysOfWeek: [...schedule.daysOfWeek],
    timezone: schedule.timezone,
    cron: schedule.cron,
    nextRunAt: schedule.nextRunAt.toISOString(),
    createdAt: schedule.createdAt.toISOString(),
    updatedAt: schedule.updatedAt.toISOString(),
});

export const createMongoAgentAutonomyScheduleRepository = (
    db: Db,
    encryption: EncryptionService
): AgentAutonomyScheduleRepository => {
    const collection = db.collection<StoredAgentAutonomySchedule>(
        AGENT_AUTONOMY_SCHEDULES_COLLECTION
    );
    let indexesReady: Promise<void> | undefined;

    const aad = (schedule: Pick<AgentAutonomySchedule, 'ownerDid' | 'id'>, fieldPath: string) =>
        createFieldAad({
            collectionName: AGENT_AUTONOMY_SCHEDULES_COLLECTION,
            ownerDid: schedule.ownerDid,
            stableRecordId: schedule.id,
            fieldPath,
        });

    const encryptSchedule = async (
        schedule: AgentAutonomySchedule
    ): Promise<StoredAgentAutonomySchedule> => ({
        ...schedule,
        name: await encryption.encryptJson(schedule.name, aad(schedule, 'name')),
        prompt: await encryption.encryptJson(schedule.prompt, aad(schedule, 'prompt')),
    });

    const decryptSchedule = async (
        schedule: StoredAgentAutonomySchedule
    ): Promise<AgentAutonomySchedule> => ({
        ...schedule,
        name: await encryption.decryptJson<string>(schedule.name, aad(schedule, 'name')),
        prompt: await encryption.decryptJson<string>(schedule.prompt, aad(schedule, 'prompt')),
    });

    const ensureIndexes = async (): Promise<void> => {
        indexesReady ??= Promise.all([
            collection.createIndex({ ownerDid: 1, id: 1 }, { unique: true }),
            collection.createIndex({ ownerDid: 1, enabled: 1, nextRunAt: 1 }),
            collection.createIndex({ triggerScheduleId: 1 }, { unique: true, sparse: true }),
        ]).then(() => undefined);

        await indexesReady;
    };

    return {
        listByOwner: async ownerDid => {
            await ensureIndexes();

            const schedules = await collection
                .find({ ownerDid } as Filter<StoredAgentAutonomySchedule>)
                .toArray();

            return sortSchedules(await Promise.all(schedules.map(decryptSchedule)));
        },
        findById: async (ownerDid, id) => {
            await ensureIndexes();

            const schedule = await collection.findOne({
                ownerDid,
                id,
            } as Filter<StoredAgentAutonomySchedule>);

            return schedule ? decryptSchedule(schedule) : undefined;
        },
        countByOwner: async ownerDid => {
            await ensureIndexes();

            return collection.countDocuments({ ownerDid } as Filter<StoredAgentAutonomySchedule>);
        },
        create: async schedule => {
            await ensureIndexes();
            await collection.insertOne(await encryptSchedule(schedule));
        },
        replace: async schedule => {
            await ensureIndexes();

            const result = await collection.replaceOne(
                {
                    ownerDid: schedule.ownerDid,
                    id: schedule.id,
                } as Filter<StoredAgentAutonomySchedule>,
                await encryptSchedule(schedule)
            );

            return result.matchedCount === 1;
        },
        remove: async (ownerDid, id) => {
            await ensureIndexes();

            const result = await collection.deleteOne({
                ownerDid,
                id,
            } as Filter<StoredAgentAutonomySchedule>);

            return result.deletedCount === 1;
        },
        findByTriggerScheduleId: async (ownerDid, triggerScheduleId) => {
            await ensureIndexes();

            const schedule = await collection.findOne({
                ownerDid,
                triggerScheduleId,
            } as Filter<StoredAgentAutonomySchedule>);

            return schedule ? decryptSchedule(schedule) : undefined;
        },
        setTriggerScheduleSync: async (ownerDid, id, triggerScheduleId, syncedAt) => {
            await ensureIndexes();

            const result = await collection.updateOne(
                { ownerDid, id } as Filter<StoredAgentAutonomySchedule>,
                { $set: { triggerScheduleId, triggerSyncedAt: syncedAt } }
            );

            return result.matchedCount === 1;
        },
        clearTriggerScheduleSync: async (ownerDid, id) => {
            await ensureIndexes();

            const result = await collection.updateOne(
                { ownerDid, id } as Filter<StoredAgentAutonomySchedule>,
                { $unset: { triggerSyncedAt: '' } }
            );

            return result.matchedCount === 1;
        },
        listDue: async (ownerDids, at) => {
            if (ownerDids.length === 0) return [];

            await ensureIndexes();

            const schedules = await collection
                .find(
                    {
                        ownerDid: { $in: ownerDids },
                        enabled: true,
                        nextRunAt: { $lte: at },
                    } as Filter<StoredAgentAutonomySchedule>,
                    { projection: { _id: 0, id: 1, ownerDid: 1, nextRunAt: 1 } }
                )
                .sort({ nextRunAt: 1, ownerDid: 1, id: 1 })
                .toArray();

            return schedules.map(schedule => ({
                id: schedule.id,
                ownerDid: schedule.ownerDid,
                nextRunAt: new Date(schedule.nextRunAt),
            }));
        },
        advanceNextRun: async (ownerDid, id, scheduledFor, nextRunAt, updatedAt) => {
            await ensureIndexes();

            const result = await collection.updateOne(
                { ownerDid, id, nextRunAt: scheduledFor } as Filter<StoredAgentAutonomySchedule>,
                { $set: { nextRunAt, updatedAt } }
            );

            return result.matchedCount === 1;
        },
    };
};

export const createInMemoryAgentAutonomyScheduleRepository = (
    initialSchedules: AgentAutonomySchedule[] = []
): AgentAutonomyScheduleRepository => {
    const schedules = new Map<string, AgentAutonomySchedule>();
    const key = (ownerDid: string, id: string): string => `${ownerDid}\0${id}`;

    for (const schedule of initialSchedules) {
        schedules.set(key(schedule.ownerDid, schedule.id), cloneSchedule(schedule));
    }

    return {
        listByOwner: async ownerDid =>
            sortSchedules(
                [...schedules.values()]
                    .filter(schedule => schedule.ownerDid === ownerDid)
                    .map(cloneSchedule)
            ),
        findById: async (ownerDid, id) => {
            const schedule = schedules.get(key(ownerDid, id));

            return schedule ? cloneSchedule(schedule) : undefined;
        },
        countByOwner: async ownerDid =>
            [...schedules.values()].filter(schedule => schedule.ownerDid === ownerDid).length,
        create: async schedule => {
            const scheduleKey = key(schedule.ownerDid, schedule.id);
            if (schedules.has(scheduleKey)) throw new Error('Assistant schedule already exists.');

            schedules.set(scheduleKey, cloneSchedule(schedule));
        },
        replace: async schedule => {
            const scheduleKey = key(schedule.ownerDid, schedule.id);
            if (!schedules.has(scheduleKey)) return false;

            schedules.set(scheduleKey, cloneSchedule(schedule));

            return true;
        },
        remove: async (ownerDid, id) => schedules.delete(key(ownerDid, id)),
        findByTriggerScheduleId: async (ownerDid, triggerScheduleId) => {
            const schedule = [...schedules.values()].find(
                candidate =>
                    candidate.ownerDid === ownerDid &&
                    candidate.triggerScheduleId === triggerScheduleId
            );

            return schedule ? cloneSchedule(schedule) : undefined;
        },
        setTriggerScheduleSync: async (ownerDid, id, triggerScheduleId, syncedAt) => {
            const scheduleKey = key(ownerDid, id);
            const schedule = schedules.get(scheduleKey);
            if (!schedule) return false;

            schedules.set(scheduleKey, {
                ...schedule,
                triggerScheduleId,
                triggerSyncedAt: new Date(syncedAt),
            });

            return true;
        },
        clearTriggerScheduleSync: async (ownerDid, id) => {
            const scheduleKey = key(ownerDid, id);
            const schedule = schedules.get(scheduleKey);
            if (!schedule) return false;

            const updated = cloneSchedule(schedule);
            delete updated.triggerSyncedAt;
            schedules.set(scheduleKey, updated);

            return true;
        },
        listDue: async (ownerDids, at) => {
            const allowedOwners = new Set(ownerDids);

            return sortDueSchedules(
                [...schedules.values()]
                    .filter(
                        schedule =>
                            allowedOwners.has(schedule.ownerDid) &&
                            schedule.enabled &&
                            schedule.nextRunAt.getTime() <= at.getTime()
                    )
                    .map(schedule => ({
                        id: schedule.id,
                        ownerDid: schedule.ownerDid,
                        nextRunAt: new Date(schedule.nextRunAt),
                    }))
            );
        },
        advanceNextRun: async (ownerDid, id, scheduledFor, nextRunAt, updatedAt) => {
            const scheduleKey = key(ownerDid, id);
            const schedule = schedules.get(scheduleKey);

            if (!schedule || schedule.nextRunAt.getTime() !== scheduledFor.getTime()) return false;

            schedules.set(scheduleKey, {
                ...schedule,
                nextRunAt: new Date(nextRunAt),
                updatedAt: new Date(updatedAt),
            });

            return true;
        },
    };
};

export const createAgentAutonomyScheduleService = (
    repository: AgentAutonomyScheduleRepository,
    {
        now = () => new Date(),
        createId = randomUUID,
    }: { now?: () => Date; createId?: () => string } = {}
): AgentAutonomyScheduleService => ({
    list: async ownerDid => repository.listByOwner(z.string().trim().min(1).parse(ownerDid)),
    get: async (ownerDid, id) =>
        repository.findById(
            z.string().trim().min(1).parse(ownerDid),
            z.string().trim().min(1).parse(id)
        ),
    getByTriggerScheduleId: async (ownerDid, triggerScheduleId) =>
        repository.findByTriggerScheduleId(
            z.string().trim().min(1).parse(ownerDid),
            z.string().trim().min(1).parse(triggerScheduleId)
        ),
    create: async input => {
        const parsed = CreateAgentAutonomyScheduleValidator.parse(input);

        if (
            (await repository.countByOwner(parsed.ownerDid)) >=
            MAX_AGENT_AUTONOMY_SCHEDULES_PER_OWNER
        ) {
            throw new AgentAutonomyScheduleLimitError();
        }

        const currentTime = now();
        const cron = getCanonicalScheduleCron(parsed.timeOfDay, parsed.daysOfWeek);
        const schedule: AgentAutonomySchedule = {
            ...parsed,
            id: createId(),
            cron,
            nextRunAt: getNextScheduleRun(cron, parsed.timezone, currentTime),
            createdAt: currentTime,
            updatedAt: currentTime,
        };

        await repository.create(schedule);

        return cloneSchedule(schedule);
    },
    update: async input => {
        const parsed = UpdateAgentAutonomyScheduleValidator.parse(input);
        const existing = await repository.findById(parsed.ownerDid, parsed.id);
        if (!existing) throw new AgentAutonomyScheduleNotFoundError();

        const currentTime = now();
        const cadenceChanged =
            parsed.enabled !== undefined ||
            parsed.timeOfDay !== undefined ||
            parsed.daysOfWeek !== undefined ||
            parsed.timezone !== undefined;
        const timeOfDay = parsed.timeOfDay ?? existing.timeOfDay;
        const daysOfWeek = parsed.daysOfWeek ?? existing.daysOfWeek;
        const timezone = parsed.timezone ?? existing.timezone;
        const cron = getCanonicalScheduleCron(timeOfDay, daysOfWeek);
        const schedule: AgentAutonomySchedule = {
            ...existing,
            ...parsed,
            timeOfDay,
            daysOfWeek,
            timezone,
            cron,
            nextRunAt: cadenceChanged
                ? getNextScheduleRun(cron, timezone, currentTime)
                : existing.nextRunAt,
            updatedAt: currentTime,
        };

        if (!(await repository.replace(schedule))) throw new AgentAutonomyScheduleNotFoundError();

        return cloneSchedule(schedule);
    },
    remove: async (ownerDid, id) =>
        repository.remove(
            z.string().trim().min(1).parse(ownerDid),
            z.string().trim().min(1).parse(id)
        ),
    listDue: async (ownerDids, at = now()) => {
        const parsedOwnerDids = z.array(z.string().trim().min(1)).parse(ownerDids);

        return (await repository.listDue([...new Set(parsedOwnerDids)], at)).map(cloneDueSchedule);
    },
    advanceNextRun: async (ownerDid, id, scheduledFor, currentTime = now()) => {
        const schedule = await repository.findById(ownerDid, id);
        if (!schedule || schedule.nextRunAt.getTime() !== scheduledFor.getTime()) return false;

        const after = new Date(Math.max(currentTime.getTime(), scheduledFor.getTime()));
        const nextRunAt = getNextScheduleRun(schedule.cron, schedule.timezone, after);

        return repository.advanceNextRun(ownerDid, id, scheduledFor, nextRunAt, currentTime);
    },
    setTriggerScheduleSync: async (ownerDid, id, triggerScheduleId, syncedAt = now()) =>
        repository.setTriggerScheduleSync(
            z.string().trim().min(1).parse(ownerDid),
            z.string().trim().min(1).parse(id),
            z.string().trim().min(1).parse(triggerScheduleId),
            syncedAt
        ),
    clearTriggerScheduleSync: async (ownerDid, id) =>
        repository.clearTriggerScheduleSync(
            z.string().trim().min(1).parse(ownerDid),
            z.string().trim().min(1).parse(id)
        ),
});

export const createMongoAgentAutonomyScheduleService = (
    db: Db,
    encryption: EncryptionService,
    options?: { now?: () => Date; createId?: () => string }
): AgentAutonomyScheduleService =>
    createAgentAutonomyScheduleService(
        createMongoAgentAutonomyScheduleRepository(db, encryption),
        options
    );

export const createLearnCardAssistantSchedulesRuntime = ({
    mongoRuntime,
    service,
    getEncryption,
    now,
    createId,
}: LearnCardAssistantSchedulesRuntimeOptions): LearnCardAssistantSchedulesRuntime => {
    let servicePromise: Promise<AgentAutonomyScheduleService | undefined> | undefined;

    const getService = async (): Promise<AgentAutonomyScheduleService | undefined> => {
        if (service) return service;

        servicePromise ??= (async () => {
            const status = await mongoRuntime.getStatus();
            if (!status.connected) {
                if (!status.configured) return undefined;
                throw new Error('LearnCard Assistant schedule storage is not available.');
            }
            if (!getEncryption) {
                throw new Error(
                    'Encrypted LearnCard Assistant schedule storage is not configured.'
                );
            }

            return createMongoAgentAutonomyScheduleService(
                await mongoRuntime.getDb(),
                getEncryption(),
                { now, createId }
            );
        })();

        return servicePromise;
    };

    const requireService = async (): Promise<AgentAutonomyScheduleService> => {
        const resolvedService = await getService();
        if (!resolvedService) {
            throw new Error('LearnCard Assistant schedule storage is not available.');
        }

        return resolvedService;
    };

    return {
        list: async ownerDid => (await getService())?.list(ownerDid) ?? [],
        get: async (ownerDid, id) => (await requireService()).get(ownerDid, id),
        getByTriggerScheduleId: async (ownerDid, triggerScheduleId) =>
            (await requireService()).getByTriggerScheduleId(ownerDid, triggerScheduleId),
        create: async input => (await requireService()).create(input),
        update: async input => (await requireService()).update(input),
        remove: async (ownerDid, id) => (await requireService()).remove(ownerDid, id),
        setTriggerScheduleSync: async (ownerDid, id, triggerScheduleId, syncedAt) =>
            (await requireService()).setTriggerScheduleSync(
                ownerDid,
                id,
                triggerScheduleId,
                syncedAt
            ),
        clearTriggerScheduleSync: async (ownerDid, id) =>
            (await requireService()).clearTriggerScheduleSync(ownerDid, id),
        listDue: async (ownerDids, at) => (await requireService()).listDue(ownerDids, at),
        advanceNextRun: async (ownerDid, id, scheduledFor, currentTime) =>
            (await requireService()).advanceNextRun(ownerDid, id, scheduledFor, currentTime),
        getStatus: async () => {
            if (service) return { configured: true, connected: true };

            const status = await mongoRuntime.getStatus();

            return { configured: status.configured, connected: status.connected };
        },
    };
};

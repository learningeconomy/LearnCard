import { NotFoundError, schedules } from '@trigger.dev/sdk';

import type { AgentAutonomySchedule, LearnCardAssistantSchedulesRuntime } from './schedules';

export const TRIGGER_AUTONOMOUS_SCHEDULE_TASK_ID = 'learncard-autonomous-schedule-dispatch';

export interface AgentAutonomyScheduleProvider {
    upsert(schedule: AgentAutonomySchedule): Promise<string>;
    remove(triggerScheduleId: string): Promise<void>;
}

export interface TriggerScheduleClient {
    create(input: {
        task: string;
        cron: string;
        timezone: string;
        externalId: string;
        deduplicationKey: string;
    }): Promise<{ id: string }>;
    activate(scheduleId: string): Promise<unknown>;
    deactivate(scheduleId: string): Promise<unknown>;
    del(scheduleId: string): Promise<unknown>;
}

export interface CreateTriggerAgentAutonomyScheduleProviderOptions {
    environment: string;
    client?: TriggerScheduleClient;
}

export const getTriggerScheduleDeduplicationKey = (
    environment: string,
    schedule: Pick<AgentAutonomySchedule, 'ownerDid' | 'id'>
): string => `${environment}:${schedule.ownerDid}:${schedule.id}`;

export const createTriggerAgentAutonomyScheduleProvider = ({
    environment,
    client = schedules,
}: CreateTriggerAgentAutonomyScheduleProviderOptions): AgentAutonomyScheduleProvider => {
    const environmentKey = environment.trim();
    if (!environmentKey) throw new Error('A Trigger.dev environment key is required.');

    return {
        upsert: async schedule => {
            const triggerSchedule = await client.create({
                task: TRIGGER_AUTONOMOUS_SCHEDULE_TASK_ID,
                cron: schedule.cron,
                timezone: schedule.timezone,
                externalId: schedule.ownerDid,
                deduplicationKey: getTriggerScheduleDeduplicationKey(environmentKey, schedule),
            });

            if (schedule.enabled) await client.activate(triggerSchedule.id);
            else await client.deactivate(triggerSchedule.id);

            return triggerSchedule.id;
        },
        remove: async triggerScheduleId => {
            try {
                await client.del(triggerScheduleId);
            } catch (error) {
                if (!(error instanceof NotFoundError)) throw error;
            }
        },
    };
};

export const createProviderSyncedAssistantSchedulesRuntime = (
    runtime: LearnCardAssistantSchedulesRuntime,
    provider: AgentAutonomyScheduleProvider,
    now: () => Date = () => new Date()
): LearnCardAssistantSchedulesRuntime => ({
    list: ownerDid => runtime.list(ownerDid),
    get: (ownerDid, id) => runtime.get(ownerDid, id),
    getByTriggerScheduleId: (ownerDid, triggerScheduleId) =>
        runtime.getByTriggerScheduleId(ownerDid, triggerScheduleId),
    create: async input => {
        const schedule = await runtime.create(input);
        let triggerScheduleId: string | undefined;

        try {
            triggerScheduleId = await provider.upsert(schedule);
            const triggerSyncedAt = now();
            const synced = await runtime.setTriggerScheduleSync(
                schedule.ownerDid,
                schedule.id,
                triggerScheduleId,
                triggerSyncedAt
            );
            if (!synced) throw new Error('Assistant schedule disappeared during Trigger.dev sync.');

            return { ...schedule, triggerScheduleId, triggerSyncedAt };
        } catch (error) {
            if (triggerScheduleId) await provider.remove(triggerScheduleId).catch(() => undefined);
            await runtime.remove(schedule.ownerDid, schedule.id).catch(() => false);

            throw error;
        }
    },
    update: async input => {
        const schedule = await runtime.update(input);

        try {
            const triggerScheduleId = await provider.upsert(schedule);
            const triggerSyncedAt = now();
            const synced = await runtime.setTriggerScheduleSync(
                schedule.ownerDid,
                schedule.id,
                triggerScheduleId,
                triggerSyncedAt
            );
            if (!synced) throw new Error('Assistant schedule disappeared during Trigger.dev sync.');

            return { ...schedule, triggerScheduleId, triggerSyncedAt };
        } catch (error) {
            await runtime
                .clearTriggerScheduleSync(schedule.ownerDid, schedule.id)
                .catch(() => false);

            throw error;
        }
    },
    remove: async (ownerDid, id) => {
        const schedule = await runtime.get(ownerDid, id);
        if (!schedule) return false;

        if (schedule.triggerScheduleId) {
            if (schedule.enabled) await runtime.update({ ownerDid, id, enabled: false });

            try {
                await provider.remove(schedule.triggerScheduleId);
            } catch (error) {
                await runtime.clearTriggerScheduleSync(ownerDid, id).catch(() => false);

                throw error;
            }
        }

        return runtime.remove(ownerDid, id);
    },
    setTriggerScheduleSync: (ownerDid, id, triggerScheduleId, syncedAt) =>
        runtime.setTriggerScheduleSync(ownerDid, id, triggerScheduleId, syncedAt),
    clearTriggerScheduleSync: (ownerDid, id) => runtime.clearTriggerScheduleSync(ownerDid, id),
    listDue: (ownerDids, at) => runtime.listDue(ownerDids, at),
    advanceNextRun: (ownerDid, id, scheduledFor, currentTime) =>
        runtime.advanceNextRun(ownerDid, id, scheduledFor, currentTime),
    getStatus: () => runtime.getStatus(),
});

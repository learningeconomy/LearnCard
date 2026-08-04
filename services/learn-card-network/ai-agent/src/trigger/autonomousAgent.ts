import { AbortTaskRunError, idempotencyKeys, logger, schedules, task } from '@trigger.dev/sdk';

import {
    createMongoAutonomousLeaseRepository,
    createMongoAutonomousRunRepository,
} from '../autonomy/runs';
import { createAutonomousScheduler, type AutonomyCycleResult } from '../autonomy/scheduler';
import { TRIGGER_AUTONOMOUS_SCHEDULE_TASK_ID } from '../autonomy/triggerScheduleProvider';
import { assertTriggerConfig, getConfig } from '../config';
import { createAgentServiceRuntime } from '../runtime';

export const TRIGGER_AUTONOMOUS_EXECUTION_TASK_ID = 'learncard-autonomous-agent-execution';

export interface TriggerAutonomousAgentExecutionPayload {
    ownerDid: string;
    triggerScheduleId: string;
    scheduledFor: string;
}

const parseExecutionPayload = (
    payload: TriggerAutonomousAgentExecutionPayload
): TriggerAutonomousAgentExecutionPayload & { scheduledForDate: Date } => {
    const ownerDid = payload.ownerDid.trim();
    const triggerScheduleId = payload.triggerScheduleId.trim();
    const scheduledForDate = new Date(payload.scheduledFor);

    if (!ownerDid) throw new AbortTaskRunError('A schedule owner DID is required.');
    if (!triggerScheduleId) throw new AbortTaskRunError('A Trigger.dev schedule ID is required.');
    if (Number.isNaN(scheduledForDate.getTime())) {
        throw new AbortTaskRunError('The scheduled occurrence timestamp is invalid.');
    }

    return { ownerDid, triggerScheduleId, scheduledFor: payload.scheduledFor, scheduledForDate };
};

export const requireNonFailedAutonomyResult = (
    result: AutonomyCycleResult
): AutonomyCycleResult => {
    if (result.status === 'failed') {
        throw new Error(
            `Autonomous execution ${
                result.runId ?? 'run'
            } failed; inspect the encrypted Mongo run record.`
        );
    }

    return result;
};

export const autonomousAgentExecution = task({
    id: TRIGGER_AUTONOMOUS_EXECUTION_TASK_ID,
    queue: { concurrencyLimit: 1 },
    machine: 'medium-1x',
    maxDuration: 3600,
    retry: { maxAttempts: 1 },
    run: async (payload: TriggerAutonomousAgentExecutionPayload, { signal }) => {
        const parsed = parseExecutionPayload(payload);
        const config = getConfig();
        assertTriggerConfig(config);
        const runtime = createAgentServiceRuntime({ config });

        try {
            const mongoStatus = await runtime.mongoRuntime.getStatus();
            if (!mongoStatus.connected) {
                throw new Error(
                    mongoStatus.error
                        ? `Trigger.dev autonomy MongoDB is unavailable: ${mongoStatus.error}`
                        : 'Trigger.dev autonomy MongoDB is unavailable.'
                );
            }
            if (!runtime.providerConfigured) {
                throw new Error(
                    'The configured AI provider is not available for autonomous execution.'
                );
            }

            const schedule = await runtime.assistantSchedulesRuntime.getByTriggerScheduleId(
                parsed.ownerDid,
                parsed.triggerScheduleId
            );
            if (!schedule) {
                logger.warn(
                    'Skipping a Trigger.dev occurrence with no matching LearnCard schedule.',
                    {
                        ownerDid: parsed.ownerDid,
                        triggerScheduleId: parsed.triggerScheduleId,
                    }
                );

                return { status: 'skipped' as const };
            }
            if (!schedule.enabled) {
                logger.info('Skipping a queued occurrence for a disabled LearnCard schedule.', {
                    ownerDid: parsed.ownerDid,
                    scheduleId: schedule.id,
                });

                return { status: 'skipped' as const };
            }

            const db = await runtime.mongoRuntime.getDb();
            const encryption = runtime.getEncryption();
            const runRepository = createMongoAutonomousRunRepository(db, encryption);
            const scheduler = createAutonomousScheduler({
                runtime,
                runRepository,
                leaseRepository: createMongoAutonomousLeaseRepository(db),
                ownerDids: [],
                pollIntervalMs: 30_000,
                maxRunsPerCycle: 1,
                leaseMs: config.autonomyDevLeaseMs,
            });

            await runRepository.recoverExpired(new Date());

            const result = await scheduler.runOccurrence(
                {
                    id: schedule.id,
                    ownerDid: schedule.ownerDid,
                    nextRunAt: parsed.scheduledForDate,
                },
                'trigger',
                signal
            );

            return requireNonFailedAutonomyResult(result);
        } finally {
            await runtime.mongoRuntime.close();
        }
    },
});

export const autonomousScheduleDispatch = schedules.task({
    id: TRIGGER_AUTONOMOUS_SCHEDULE_TASK_ID,
    maxDuration: 60,
    retry: {
        maxAttempts: 3,
        factor: 2,
        minTimeoutInMs: 1_000,
        maxTimeoutInMs: 10_000,
        randomize: true,
    },
    run: async (payload, { ctx }) => {
        if (!payload.externalId) {
            throw new AbortTaskRunError('The autonomous schedule is missing its owner DID.');
        }

        const ownerDid = payload.externalId.trim();
        if (!ownerDid) throw new AbortTaskRunError('The autonomous schedule owner DID is empty.');

        const scheduledFor = payload.timestamp.toISOString();
        const idempotencyKey = await idempotencyKeys.create(
            `${ctx.environment.slug}:${ownerDid}:${payload.scheduleId}:${scheduledFor}`,
            { scope: 'global' }
        );
        const handle = await autonomousAgentExecution.trigger(
            {
                ownerDid,
                triggerScheduleId: payload.scheduleId,
                scheduledFor,
            },
            {
                concurrencyKey: ownerDid,
                idempotencyKey,
                idempotencyKeyTTL: '30d',
                tags: [`owner:${ownerDid}`, `schedule:${payload.scheduleId}`],
            }
        );

        return { executionRunId: handle.id };
    },
});

import { randomUUID } from 'node:crypto';

import type { AgentServiceRuntime } from '../runtime';
import type { RunChatResult } from '../server';
import { runScheduledAgentRequest } from './runner';
import type { DueAgentAutonomySchedule } from './schedules';
import type {
    AutonomousLeaseRepository,
    AutonomousRun,
    AutonomousRunRepository,
    AutonomousTriggerSource,
} from './runs';

export interface AutonomyCycleResult {
    ownerDid: string;
    scheduleId: string;
    scheduledFor: string;
    status: 'succeeded' | 'failed' | 'contended' | 'skipped';
    runId?: string;
}

export interface AutonomyCycleSummary {
    triggerSource: AutonomousTriggerSource;
    startedAt: string;
    completedAt: string;
    dueCount: number;
    results: AutonomyCycleResult[];
}

export interface AutonomousScheduler {
    runOccurrence(
        candidate: DueAgentAutonomySchedule,
        triggerSource: AutonomousTriggerSource,
        signal?: AbortSignal
    ): Promise<AutonomyCycleResult>;
    runOnce(triggerSource: AutonomousTriggerSource): Promise<AutonomyCycleSummary>;
    start(): Promise<void>;
    stop(): Promise<void>;
}

export interface CreateAutonomousSchedulerOptions {
    runtime: AgentServiceRuntime;
    runRepository: AutonomousRunRepository;
    leaseRepository: AutonomousLeaseRepository;
    ownerDids: string[];
    pollIntervalMs: number;
    maxRunsPerCycle: number;
    leaseMs: number;
    now?: () => Date;
    createId?: () => string;
    runScheduledRequest?: typeof runScheduledAgentRequest;
    onCycleError?: (error: unknown) => void;
    onCycleComplete?: (summary: AutonomyCycleSummary) => void;
}

const sortDueSchedules = (schedules: DueAgentAutonomySchedule[]): DueAgentAutonomySchedule[] =>
    [...schedules].sort(
        (a, b) =>
            a.nextRunAt.getTime() - b.nextRunAt.getTime() ||
            a.ownerDid.localeCompare(b.ownerDid) ||
            a.id.localeCompare(b.id)
    );

export const createAutonomousScheduler = ({
    runtime,
    runRepository,
    leaseRepository,
    ownerDids,
    pollIntervalMs,
    maxRunsPerCycle,
    leaseMs,
    now = () => new Date(),
    createId = randomUUID,
    runScheduledRequest = runScheduledAgentRequest,
    onCycleError = () => undefined,
    onCycleComplete = () => undefined,
}: CreateAutonomousSchedulerOptions): AutonomousScheduler => {
    const fixtureDids = [...new Set(ownerDids.map(did => did.trim()).filter(Boolean))];
    let timer: NodeJS.Timeout | undefined;
    let activeCycle: Promise<AutonomyCycleSummary> | undefined;
    let stopped = true;

    const runCandidate = async (
        candidate: DueAgentAutonomySchedule,
        triggerSource: AutonomousTriggerSource,
        signal?: AbortSignal
    ): Promise<AutonomyCycleResult> => {
        signal?.throwIfAborted();
        const scheduledFor = candidate.nextRunAt;
        const runId = createId();
        const acquiredAt = now();
        const leaseId = await leaseRepository.acquire(
            candidate.ownerDid,
            candidate.id,
            runId,
            acquiredAt,
            new Date(acquiredAt.getTime() + leaseMs)
        );
        const baseResult = {
            ownerDid: candidate.ownerDid,
            scheduleId: candidate.id,
            scheduledFor: scheduledFor.toISOString(),
        };

        if (!leaseId) return { ...baseResult, status: 'contended' };

        let runCreated = false;
        let heartbeatTimer: NodeJS.Timeout | undefined;
        let heartbeatPromise = Promise.resolve();
        const abortController = new AbortController();
        const abortFromSignal = (): void => abortController.abort(signal?.reason);
        if (signal?.aborted) abortFromSignal();
        else signal?.addEventListener('abort', abortFromSignal, { once: true });
        let heartbeatError: Error | undefined;

        const handleHeartbeatError = (error: unknown): void => {
            if (heartbeatError) return;

            heartbeatError =
                error instanceof Error ? error : new Error('Autonomous lease renewal failed.');
            abortController.abort(heartbeatError);
        };

        const renewLease = async (): Promise<void> => {
            const renewedAt = now();
            const expiresAt = new Date(renewedAt.getTime() + leaseMs);
            const leaseRenewed = await leaseRepository.renew(
                candidate.ownerDid,
                leaseId,
                renewedAt,
                expiresAt
            );
            if (!leaseRenewed) throw new Error('Autonomous owner lease was lost during execution.');

            const runRenewed = await runRepository.renewLease(runId, leaseId, renewedAt, expiresAt);
            if (!runRenewed) throw new Error('Autonomous run lease was lost during execution.');

            abortController.signal.throwIfAborted();
        };

        try {
            const schedule = await runtime.assistantSchedulesRuntime.get(
                candidate.ownerDid,
                candidate.id
            );
            if (
                !schedule ||
                !schedule.enabled ||
                schedule.nextRunAt.getTime() !== scheduledFor.getTime()
            ) {
                return { ...baseResult, status: 'skipped' };
            }

            const leaseExpiresAt = new Date(acquiredAt.getTime() + leaseMs);
            const run: AutonomousRun = {
                runId,
                ownerDid: candidate.ownerDid,
                scheduleId: candidate.id,
                scheduledFor,
                triggerType: 'user-schedule',
                triggerSource,
                status: 'running',
                createdAt: acquiredAt,
                startedAt: acquiredAt,
                leaseId,
                leaseExpiresAt,
            };

            runCreated = await runRepository.create(run);

            if (!runCreated) {
                await runtime.assistantSchedulesRuntime.advanceNextRun(
                    candidate.ownerDid,
                    candidate.id,
                    scheduledFor,
                    now()
                );

                return { ...baseResult, status: 'skipped' };
            }

            const advanced = await runtime.assistantSchedulesRuntime.advanceNextRun(
                candidate.ownerDid,
                candidate.id,
                scheduledFor,
                now()
            );

            if (!advanced) {
                await runRepository.markAbandoned(runId, now());

                return { ...baseResult, status: 'skipped', runId };
            }
            heartbeatTimer = setInterval(() => {
                heartbeatPromise = heartbeatPromise.then(renewLease).catch(handleHeartbeatError);
            }, Math.max(1_000, Math.floor(leaseMs / 3)));

            let result: RunChatResult;

            try {
                result = await runScheduledRequest({
                    schedule,
                    scheduledFor,
                    runtime,
                    signal: abortController.signal,
                });
            } finally {
                clearInterval(heartbeatTimer);
                heartbeatTimer = undefined;
                await heartbeatPromise;
                if (heartbeatError) throw heartbeatError;
            }

            await renewLease();

            if (result.status !== 200 || !('message' in result.payload)) {
                throw new Error(
                    'error' in result.payload
                        ? result.payload.error
                        : 'Scheduled agent request failed.'
                );
            }
            const payload = result.payload;

            const cards = await runtime.assistantFeedRuntime.listLatest(candidate.ownerDid, 50);
            const completedAt = now();
            const markedSucceeded = await runRepository.markSucceeded(runId, leaseId, completedAt, {
                agentRunId: payload.runId,
                responsePreview: payload.message.replace(/\s+/g, ' ').trim().slice(0, 500),
                toolNames: [
                    ...new Set(
                        payload.toolRuns
                            .filter(toolRun => !toolRun.error)
                            .map(toolRun => toolRun.name)
                    ),
                ],
                cardIds: cards
                    .filter(card => card.sourceRunId === payload.runId)
                    .map(card => card.id),
                retroCompleted: true,
            });

            return {
                ...baseResult,
                status: markedSucceeded ? 'succeeded' : 'failed',
                runId,
            };
        } catch (error) {
            if (runCreated) {
                await runRepository.markFailed(
                    runId,
                    leaseId,
                    now(),
                    error instanceof Error ? `${error.name}: ${error.message}` : String(error)
                );
            }

            return { ...baseResult, status: 'failed', runId };
        } finally {
            signal?.removeEventListener('abort', abortFromSignal);
            clearInterval(heartbeatTimer);
            await leaseRepository.release(candidate.ownerDid, leaseId);
        }
    };

    const runOnce = async (
        triggerSource: AutonomousTriggerSource
    ): Promise<AutonomyCycleSummary> => {
        const startedAt = now();

        await runRepository.recoverExpired(startedAt);

        const due = sortDueSchedules(
            await runtime.assistantSchedulesRuntime.listDue(fixtureDids, startedAt)
        );
        const results: AutonomyCycleResult[] = [];

        for (const candidate of due.slice(0, maxRunsPerCycle)) {
            results.push(await runCandidate(candidate, triggerSource));
        }

        return {
            triggerSource,
            startedAt: startedAt.toISOString(),
            completedAt: now().toISOString(),
            dueCount: due.length,
            results,
        };
    };

    const runAndReportCycle = async (
        triggerSource: AutonomousTriggerSource
    ): Promise<AutonomyCycleSummary> => {
        const summary = await runOnce(triggerSource);
        onCycleComplete(summary);

        return summary;
    };

    const scheduleNextCycle = (): void => {
        if (stopped) return;

        timer = setTimeout(() => {
            activeCycle = runAndReportCycle('interval');
            activeCycle.catch(onCycleError).finally(() => {
                activeCycle = undefined;
                scheduleNextCycle();
            });
        }, pollIntervalMs);
    };

    return {
        runOccurrence: runCandidate,
        runOnce,
        start: async () => {
            if (!stopped) return;

            stopped = false;
            activeCycle = runAndReportCycle('startup');

            try {
                await activeCycle;
            } catch (error) {
                onCycleError(error);
            } finally {
                activeCycle = undefined;
                scheduleNextCycle();
            }
        },
        stop: async () => {
            stopped = true;
            if (timer) clearTimeout(timer);
            timer = undefined;

            await activeCycle;
        },
    };
};

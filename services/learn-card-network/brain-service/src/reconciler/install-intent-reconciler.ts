import cache from '@cache';
import { TRPCError } from '@trpc/server';
import { traceInternal } from '@tracing';

import { createInstallIntentAuditEvent } from '@accesslayer/install-intent/audit';
import { readInstallIntentById } from '@accesslayer/install-intent/intent-read';
import { writeInstallIntentStatus } from '@accesslayer/install-intent/intent-status';
import {
    deleteInstallTargetInternal,
    ensureInstallTargetInternal,
    listInstallTargetsByIntentId,
} from '@accesslayer/install-target/internal';
import { listBindingsByEcosystem } from '@accesslayer/binding/read';
import { revokeBinding as revokeBindingRecord } from '@accesslayer/binding/write';
import type { InstallIntentRecordType } from 'types/install-intent';

import { getIntentTargetId } from '@helpers/install-intent.helpers';

type ReconcileOperation = 'apply' | 'remove' | 'health';

type ReconcileOptions = {
    operation?: ReconcileOperation;
    actorProfileId?: string;
    actorDid?: string;
    now?: Date;
    expectedStatusRevision?: number;
};

type InstallIntentTargetSpec = NonNullable<InstallIntentRecordType['spec']>['targets'][number];

type RetryableReconcileErrorCause = 'HEALTH' | 'DEPENDENCY' | 'AUTH' | 'OPERATOR';

class RetryableReconcileError extends Error {
    causeCode: RetryableReconcileErrorCause;

    constructor(message: string, causeCode: RetryableReconcileErrorCause = 'DEPENDENCY') {
        super(message);
        this.causeCode = causeCode;
    }
}

export type ReconcilerMetricsSnapshot = {
    reconcileLatencyMs: number;
    reconcileCount: number;
    retries: number;
    failures: number;
    drift: number;
    stuck: number;
};

export type InstallIntentReconcilerAlertThresholds = {
    maxStuckIntents: number;
    maxDegradedIntents: number;
    maxFailedIntents: number;
};

export type InstallIntentReconcilerAlertCounts = {
    stuck: number;
    degraded: number;
    failed: number;
};

export type InstallIntentReconcilerAlertBreach = {
    alert: 'STUCK_INTENTS' | 'DEGRADED_INTENTS' | 'FAILED_INTENTS';
    threshold: number;
    observedValue: number;
    severity: 'warning' | 'critical';
    firing: true;
};

export type InstallIntentReconcilerOperatorControls = {
    globalKillSwitchEnabled: boolean;
    ecosystemKillSwitchEnabled: boolean;
    effectiveKillSwitchEnabled: boolean;
    tenantConcurrencyLimit: number;
};

const metrics: ReconcilerMetricsSnapshot = {
    reconcileLatencyMs: 0,
    reconcileCount: 0,
    retries: 0,
    failures: 0,
    drift: 0,
    stuck: 0,
};

const RECONCILER_LOCK_TTL_SECS = 30;
const DEFAULT_CONCURRENCY_LIMIT = 2;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BACKOFF_MS = 1_000;
const DEFAULT_MAX_STUCK_INTENTS_ALERT_THRESHOLD = 0;
const DEFAULT_MAX_DEGRADED_INTENTS_ALERT_THRESHOLD = 0;
const DEFAULT_MAX_FAILED_INTENTS_ALERT_THRESHOLD = 0;
const KILL_SWITCH_KEY = 'install-intent-reconciler:kill-switch';
const TENANT_KILL_SWITCH_KEY_PREFIX = 'install-intent-reconciler:kill-switch:ecosystem:';
const DEFAULT_STUCK_THRESHOLD_MS = 5 * 60 * 1000;

const intentQueues = new Map<string, Promise<InstallIntentRecordType>>();

const getRedisClient = () => cache.redis ?? cache.node;

const getIntentLockKey = (intentId: string): string => `install-intent-reconciler:lock:${intentId}`;
const getTenantCounterKey = (ecosystemId: string): string =>
    `install-intent-reconciler:tenant:${ecosystemId}:active`;
const getTenantLimitKey = (ecosystemId: string): string =>
    `install-intent-reconciler:tenant:${ecosystemId}:limit`;
const getTenantKillSwitchKey = (ecosystemId: string): string =>
    `${TENANT_KILL_SWITCH_KEY_PREFIX}${ecosystemId}`;
const getInjectedFailureKey = (intentId: string, pass: string): string =>
    `install-intent-reconciler:inject-failure:${intentId}:${pass}`;

const getMaxRetries = (): number => {
    const parsed = Number.parseInt(process.env.INSTALL_INTENT_RECONCILER_MAX_RETRIES ?? '', 10);
    return Number.isFinite(parsed) ? parsed : DEFAULT_MAX_RETRIES;
};

const getBackoffMs = (): number => {
    const parsed = Number.parseInt(process.env.INSTALL_INTENT_RECONCILER_BACKOFF_MS ?? '', 10);
    return Number.isFinite(parsed) ? parsed : DEFAULT_BACKOFF_MS;
};

const recordMetric = (
    metric: Exclude<keyof ReconcilerMetricsSnapshot, 'reconcileLatencyMs' | 'reconcileCount'>
): void => {
    metrics[metric] += 1;
};

const recordLatency = (durationMs: number): void => {
    metrics.reconcileLatencyMs += durationMs;
    metrics.reconcileCount += 1;
};

const iso = (date: Date): string => date.toISOString();

const isGlobalKillSwitchEnabled = async (): Promise<boolean> => {
    if (process.env.INSTALL_INTENT_RECONCILER_DISABLED === 'true') return true;

    const flag = await cache.get(KILL_SWITCH_KEY);
    return flag === '1' || flag === 'true';
};

const isTenantKillSwitchEnabled = async (ecosystemId: string): Promise<boolean> => {
    const perTenantEnv = process.env.INSTALL_INTENT_RECONCILER_DISABLED_ECOSYSTEM_IDS?.split(',')
        .map(value => value.trim())
        .filter(Boolean);
    if (perTenantEnv?.includes(ecosystemId)) return true;

    const tenantFlag = await cache.get(getTenantKillSwitchKey(ecosystemId));
    return tenantFlag === '1' || tenantFlag === 'true';
};

const isKillSwitchEnabled = async (ecosystemId?: string): Promise<boolean> => {
    if (await isGlobalKillSwitchEnabled()) return true;
    if (!ecosystemId) return false;
    return isTenantKillSwitchEnabled(ecosystemId);
};

export const getStuckThresholdMs = (): number => {
    const parsed = Number.parseInt(
        process.env.INSTALL_INTENT_RECONCILER_STUCK_THRESHOLD_MS ?? '',
        10
    );
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_STUCK_THRESHOLD_MS;
};

const getMaxStuckIntentsAlertThreshold = (): number => {
    const parsed = Number.parseInt(
        process.env.INSTALL_INTENT_RECONCILER_ALERT_MAX_STUCK_INTENTS ?? '',
        10
    );
    return Number.isFinite(parsed) && parsed >= 0
        ? parsed
        : DEFAULT_MAX_STUCK_INTENTS_ALERT_THRESHOLD;
};

const getMaxDegradedIntentsAlertThreshold = (): number => {
    const parsed = Number.parseInt(
        process.env.INSTALL_INTENT_RECONCILER_ALERT_MAX_DEGRADED_INTENTS ?? '',
        10
    );
    return Number.isFinite(parsed) && parsed >= 0
        ? parsed
        : DEFAULT_MAX_DEGRADED_INTENTS_ALERT_THRESHOLD;
};

const getMaxFailedIntentsAlertThreshold = (): number => {
    const parsed = Number.parseInt(
        process.env.INSTALL_INTENT_RECONCILER_ALERT_MAX_FAILED_INTENTS ?? '',
        10
    );
    return Number.isFinite(parsed) && parsed >= 0
        ? parsed
        : DEFAULT_MAX_FAILED_INTENTS_ALERT_THRESHOLD;
};

const getTenantConcurrencyLimit = async (ecosystemId: string): Promise<number> => {
    const configured = await cache.get(getTenantLimitKey(ecosystemId));
    const parsedConfigured = Number.parseInt(configured ?? '', 10);
    if (Number.isFinite(parsedConfigured) && parsedConfigured > 0) return parsedConfigured;

    const parsedEnv = Number.parseInt(
        process.env.INSTALL_INTENT_RECONCILER_TENANT_CONCURRENCY ?? '',
        10
    );
    if (Number.isFinite(parsedEnv) && parsedEnv > 0) return parsedEnv;

    return DEFAULT_CONCURRENCY_LIMIT;
};

const acquireIntentLock = async (intentId: string): Promise<string | null> => {
    const token = `${intentId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
    const result = await getRedisClient().set(
        getIntentLockKey(intentId),
        token,
        'EX',
        RECONCILER_LOCK_TTL_SECS,
        'NX'
    );

    return result === 'OK' ? token : null;
};

const releaseIntentLock = async (intentId: string, token: string): Promise<void> => {
    const client = getRedisClient();
    const key = getIntentLockKey(intentId);
    const current = await client.get(key);

    if (current === token) {
        await client.del(key);
    }
};

const acquireTenantSlot = async (ecosystemId: string): Promise<boolean> => {
    const key = getTenantCounterKey(ecosystemId);
    const limit = await getTenantConcurrencyLimit(ecosystemId);
    const next = await getRedisClient().incr(key);

    if (next === 1) {
        await getRedisClient().expire(key, RECONCILER_LOCK_TTL_SECS);
    }

    if (next > limit) {
        await getRedisClient().decr(key);
        return false;
    }

    return true;
};

const releaseTenantSlot = async (ecosystemId: string): Promise<void> => {
    const key = getTenantCounterKey(ecosystemId);
    const remaining = await getRedisClient().decr(key);

    if (remaining <= 0) {
        await getRedisClient().del(key);
    }
};

const maybeConsumeInjectedFailure = async (intentId: string, pass: string): Promise<void> => {
    const key = getInjectedFailureKey(intentId, pass);
    const remaining = await cache.get(key);
    const parsed = Number.parseInt(remaining ?? '', 10);

    if (!Number.isFinite(parsed) || parsed <= 0) return;

    if (parsed === 1) {
        await getRedisClient().del(key);
    } else {
        await cache.set(key, String(parsed - 1), false);
    }

    throw new RetryableReconcileError(`Injected ${pass} failure for ${intentId}.`);
};

const assertExpectedStatusRevision = (
    intent: InstallIntentRecordType,
    expectedStatusRevision?: number
): void => {
    if (expectedStatusRevision === undefined) return;
    if (intent.statusRevision !== expectedStatusRevision) {
        throw new TRPCError({
            code: 'CONFLICT',
            message: 'Install intent status revision is stale.',
        });
    }
};

const shouldDetectStuck = (intent: InstallIntentRecordType, now: Date): boolean => {
    const phase = intent.status?.phase;
    if (phase !== 'APPLYING' && phase !== 'REMOVING') return false;
    const observedAt = intent.status?.observedAt;
    if (!observedAt) return false;

    return now.getTime() - new Date(observedAt).getTime() > getStuckThresholdMs();
};

export const isInstallIntentReconcilerIntentStuck = (
    intent: InstallIntentRecordType,
    now = new Date()
): boolean => shouldDetectStuck(intent, now);

const maybeMarkStuckMetric = (intent: InstallIntentRecordType, now: Date): void => {
    if (shouldDetectStuck(intent, now)) recordMetric('stuck');
};

const assertKillSwitchNotEnabled = async (ecosystemId: string): Promise<void> => {
    if (await isKillSwitchEnabled(ecosystemId)) {
        recordMetric('stuck');
        throw new TRPCError({
            code: 'PRECONDITION_FAILED',
            message: `Reconciler halted by kill switch for ecosystem ${ecosystemId}.`,
        });
    }
};

const getTargetDeclarationId = (target: InstallIntentTargetSpec): string => {
    return typeof target.config.declarationId === 'string'
        ? target.config.declarationId
        : `${target.targetType}_${target.listingId}`;
};

const expectedTargetDescriptors = (intent: InstallIntentRecordType) => {
    return (intent.spec?.targets ?? []).map(target => ({
        ...target,
        id: getIntentTargetId(intent.intentId, getTargetDeclarationId(target)),
    }));
};

const writeStatusWithAudit = async (
    intent: InstallIntentRecordType,
    input: Parameters<typeof writeInstallIntentStatus>[0],
    actor?: Pick<ReconcileOptions, 'actorDid' | 'actorProfileId'>
): Promise<InstallIntentRecordType> => {
    const updated = await writeInstallIntentStatus(input);

    if (
        intent.status?.phase !== updated.status?.phase ||
        intent.status?.message !== updated.status?.message ||
        intent.status?.cause !== updated.status?.cause
    ) {
        await createInstallIntentAuditEvent({
            action: `STATUS_${updated.status?.phase ?? 'UNKNOWN'}`,
            actorProfileId: actor?.actorProfileId,
            actorDid: actor?.actorDid,
            ecosystemId: updated.ecosystemId,
            intentId: updated.intentId,
            authorityChangesSummary: updated.status?.message,
            beforeSummary: {
                phase: intent.status?.phase ?? null,
                retryCount: intent.status?.retryCount ?? 0,
                nextAttemptAt: intent.status?.nextAttemptAt ?? null,
            },
            afterSummary: {
                phase: updated.status?.phase ?? null,
                retryCount: updated.status?.retryCount ?? 0,
                nextAttemptAt: updated.status?.nextAttemptAt ?? null,
            },
        });
    }

    return updated;
};

const markReady = async (
    intent: InstallIntentRecordType,
    actor?: Pick<ReconcileOptions, 'actorDid' | 'actorProfileId'>,
    now = new Date()
): Promise<InstallIntentRecordType> => {
    if (
        intent.status?.phase === 'READY' &&
        (intent.status.retryCount ?? 0) === 0 &&
        !intent.status.nextAttemptAt
    ) {
        return intent;
    }

    return writeStatusWithAudit(
        intent,
        {
            intentId: intent.intentId,
            expectedStatusRevision: intent.statusRevision,
            phase: 'READY',
            observedAt: iso(now),
            retryCount: 0,
        },
        actor
    );
};

const markDrift = async (
    intent: InstallIntentRecordType,
    message: string,
    actor?: Pick<ReconcileOptions, 'actorDid' | 'actorProfileId'>,
    now = new Date()
): Promise<InstallIntentRecordType> => {
    recordMetric('drift');
    return writeStatusWithAudit(
        intent,
        {
            intentId: intent.intentId,
            expectedStatusRevision: intent.statusRevision,
            phase: 'DEGRADED',
            cause: 'HEALTH',
            message,
            observedAt: iso(now),
            retryCount: intent.status?.retryCount ?? 0,
            nextAttemptAt: intent.status?.nextAttemptAt,
        },
        actor
    );
};

const observeDrift = async (
    intent: InstallIntentRecordType,
    actor?: Pick<ReconcileOptions, 'actorDid' | 'actorProfileId'>,
    now = new Date()
): Promise<InstallIntentRecordType> => {
    const observedTargets = await listInstallTargetsByIntentId(intent.intentId);
    const expectedTargets = expectedTargetDescriptors(intent);

    for (const expectedTarget of expectedTargets) {
        const observedTarget = observedTargets.find(target => target.id === expectedTarget.id);

        if (!observedTarget) {
            return markDrift(
                intent,
                `Drift detected: missing target ${expectedTarget.id}.`,
                actor,
                now
            );
        }

        if (observedTarget.status !== 'READY') {
            return markDrift(
                intent,
                `Drift detected: target ${expectedTarget.id} observed status ${observedTarget.status}.`,
                actor,
                now
            );
        }
    }

    if (intent.status?.phase === 'DEGRADED') {
        return markReady(intent, actor, now);
    }

    return intent;
};

const runInstallPass = async (
    intent: InstallIntentRecordType,
    actor?: Pick<ReconcileOptions, 'actorDid' | 'actorProfileId'>
): Promise<InstallIntentRecordType> => {
    let current = intent;

    if (current.status?.phase === 'PLANNED') {
        current = await writeStatusWithAudit(
            current,
            {
                intentId: current.intentId,
                expectedStatusRevision: current.statusRevision,
                phase: 'APPLYING',
                observedAt: iso(new Date()),
                retryCount: current.status?.retryCount ?? 0,
                nextAttemptAt: current.status?.nextAttemptAt,
            },
            actor
        );
    }

    await maybeConsumeInjectedFailure(current.intentId, 'install');

    for (const target of expectedTargetDescriptors(current)) {
        await assertKillSwitchNotEnabled(current.ecosystemId);
        await ensureInstallTargetInternal({
            apiVersion: 'lc.install-target/v1',
            id: target.id,
            intentId: current.intentId,
            ecosystemId: current.ecosystemId,
            targetType: target.targetType,
            status: 'READY',
            createdAt: new Date().toISOString(),
        });
    }

    return current;
};

const runAuthPass = async (
    intent: InstallIntentRecordType,
    actor?: Pick<ReconcileOptions, 'actorDid' | 'actorProfileId'>,
    now = new Date()
): Promise<InstallIntentRecordType> => {
    await assertKillSwitchNotEnabled(intent.ecosystemId);
    await maybeConsumeInjectedFailure(intent.intentId, 'auth');

    const observedTargets = await listInstallTargetsByIntentId(intent.intentId);
    const expectedTargets = expectedTargetDescriptors(intent);

    for (const expectedTarget of expectedTargets) {
        const observedTarget = observedTargets.find(target => target.id === expectedTarget.id);

        if (!observedTarget) {
            throw new RetryableReconcileError(
                `Target ${expectedTarget.id} has not been materialized yet.`
            );
        }
    }

    return markReady(intent, actor, now);
};

const cascadeIntentBindingRevocations = async (intent: InstallIntentRecordType): Promise<void> => {
    const targetIds = new Set(expectedTargetDescriptors(intent).map(target => target.id));
    const bindings = await listBindingsByEcosystem(intent.ecosystemId);

    for (const binding of bindings) {
        if (
            binding.status !== 'REVOKED' &&
            (targetIds.has(binding.provider.resourceId) ||
                targetIds.has(binding.consumer.resourceId))
        ) {
            await revokeBindingRecord(binding.bindingId, binding.revision);
        }
    }
};

const runRemovePass = async (
    intent: InstallIntentRecordType,
    actor?: Pick<ReconcileOptions, 'actorDid' | 'actorProfileId'>,
    now = new Date()
): Promise<InstallIntentRecordType> => {
    let current = intent;

    if (current.status?.phase !== 'REMOVING') {
        current = await writeStatusWithAudit(
            current,
            {
                intentId: current.intentId,
                expectedStatusRevision: current.statusRevision,
                phase: 'REMOVING',
                cause: 'OPERATOR',
                observedAt: iso(now),
                retryCount: current.status?.retryCount ?? 0,
                nextAttemptAt: current.status?.nextAttemptAt,
            },
            actor
        );
    }

    await maybeConsumeInjectedFailure(current.intentId, 'remove');

    for (const target of expectedTargetDescriptors(current)) {
        await assertKillSwitchNotEnabled(current.ecosystemId);
        await deleteInstallTargetInternal({ id: target.id, targetType: target.targetType });
    }

    await cascadeIntentBindingRevocations(current);

    return writeStatusWithAudit(
        current,
        {
            intentId: current.intentId,
            expectedStatusRevision: current.statusRevision,
            phase: 'REMOVED',
            cause: 'OPERATOR',
            message:
                current.approval.state === 'APPROVED'
                    ? current.approval.artifact.dispositionPolicy.mode
                    : undefined,
            observedAt: iso(now),
            retryCount: 0,
        },
        actor
    );
};

const scheduleRetry = async (
    intent: InstallIntentRecordType,
    error: RetryableReconcileError,
    actor?: Pick<ReconcileOptions, 'actorDid' | 'actorProfileId'>,
    now = new Date()
): Promise<InstallIntentRecordType> => {
    const retryCount = (intent.status?.retryCount ?? 0) + 1;
    const maxRetries = getMaxRetries();

    if (retryCount > maxRetries) {
        recordMetric('failures');
        return writeStatusWithAudit(
            intent,
            {
                intentId: intent.intentId,
                expectedStatusRevision: intent.statusRevision,
                phase: 'FAILED',
                cause: error.causeCode,
                message: error.message,
                observedAt: iso(now),
                retryCount,
            },
            actor
        );
    }

    recordMetric('retries');
    const nextAttemptAt = new Date(now.getTime() + retryCount * getBackoffMs());
    return writeStatusWithAudit(
        intent,
        {
            intentId: intent.intentId,
            expectedStatusRevision: intent.statusRevision,
            phase: intent.status?.phase === 'REMOVING' ? 'REMOVING' : 'APPLYING',
            cause: error.causeCode,
            message: error.message,
            observedAt: iso(now),
            retryCount,
            nextAttemptAt: iso(nextAttemptAt),
        },
        actor
    );
};

export const reconcileInstallIntent = async (
    intentId: string,
    options: ReconcileOptions = {}
): Promise<InstallIntentRecordType> => {
    const previous =
        intentQueues.get(intentId) ?? Promise.resolve<InstallIntentRecordType | null>(null);
    const queued = previous
        .catch(() => null)
        .then(async () =>
            traceInternal(
                'install-intent.reconcile',
                async () => {
                    const startedAt = Date.now();
                    const current = await readInstallIntentById(intentId);
                    if (!current)
                        throw new TRPCError({
                            code: 'NOT_FOUND',
                            message: 'Install intent not found.',
                        });

                    assertExpectedStatusRevision(current, options.expectedStatusRevision);

                    if (await isKillSwitchEnabled(current.ecosystemId)) {
                        maybeMarkStuckMetric(current, options.now ?? new Date());
                        return current;
                    }

                    const tenantSlot = await acquireTenantSlot(current.ecosystemId);
                    if (!tenantSlot) {
                        recordMetric('stuck');
                        return current;
                    }

                    const lockToken = await acquireIntentLock(intentId);
                    if (!lockToken) {
                        await releaseTenantSlot(current.ecosystemId);
                        recordMetric('stuck');
                        return current;
                    }

                    const now = options.now ?? new Date();

                    try {
                        let intent = await readInstallIntentById(intentId);
                        if (!intent)
                            throw new TRPCError({
                                code: 'NOT_FOUND',
                                message: 'Install intent not found.',
                            });

                        assertExpectedStatusRevision(intent, options.expectedStatusRevision);

                        if (
                            !intent.spec ||
                            intent.approval.state !== 'APPROVED' ||
                            !intent.status
                        ) {
                            return intent;
                        }

                        if (
                            intent.status.phase === 'SUSPENDED' &&
                            intent.status.cause === 'POLICY'
                        ) {
                            return intent;
                        }

                        if (
                            intent.status.nextAttemptAt &&
                            new Date(intent.status.nextAttemptAt) > now
                        ) {
                            maybeMarkStuckMetric(intent, now);
                            return intent;
                        }

                        try {
                            if (
                                options.operation === 'remove' ||
                                intent.status.phase === 'REMOVING'
                            ) {
                                intent = await runRemovePass(intent, options, now);
                            } else if (
                                options.operation === 'health' ||
                                intent.status.phase === 'READY' ||
                                intent.status.phase === 'DEGRADED'
                            ) {
                                intent = await observeDrift(intent, options, now);
                            } else {
                                intent = await runInstallPass(intent, options);
                                intent = await runAuthPass(intent, options, now);
                                intent = await observeDrift(intent, options, now);
                            }

                            recordLatency(Date.now() - startedAt);
                            return intent;
                        } catch (error) {
                            if (error instanceof RetryableReconcileError) {
                                const latest = await readInstallIntentById(intentId);
                                if (!latest?.status) throw error;
                                return scheduleRetry(latest, error, options, now);
                            }

                            if (
                                error instanceof TRPCError &&
                                error.code === 'PRECONDITION_FAILED'
                            ) {
                                return intent;
                            }

                            throw error;
                        }
                    } finally {
                        await releaseIntentLock(intentId, lockToken);
                        await releaseTenantSlot(current.ecosystemId);
                    }
                },
                { intentId, operation: options.operation ?? 'apply' }
            )
        );

    intentQueues.set(intentId, queued);

    try {
        return await queued;
    } finally {
        if (intentQueues.get(intentId) === queued) {
            intentQueues.delete(intentId);
        }
    }
};

export const setInstallIntentReconcilerKillSwitch = async (
    enabled: boolean,
    ecosystemId?: string
): Promise<void> => {
    if (ecosystemId) {
        const key = getTenantKillSwitchKey(ecosystemId);
        if (enabled) {
            await cache.set(key, '1', false);
            return;
        }

        await getRedisClient().del(key);
        return;
    }

    if (enabled) {
        await cache.set(KILL_SWITCH_KEY, '1', false);
        return;
    }

    await getRedisClient().del(KILL_SWITCH_KEY);
};

export const setInstallIntentTenantConcurrencyLimit = async (
    ecosystemId: string,
    limit: number
): Promise<void> => {
    await cache.set(getTenantLimitKey(ecosystemId), String(limit), false);
};

export const getInstallIntentReconcilerOperatorControls = async (
    ecosystemId: string
): Promise<InstallIntentReconcilerOperatorControls> => {
    const [globalKillSwitchEnabled, ecosystemKillSwitchEnabled, tenantConcurrencyLimit] =
        await Promise.all([
            isGlobalKillSwitchEnabled(),
            isTenantKillSwitchEnabled(ecosystemId),
            getTenantConcurrencyLimit(ecosystemId),
        ]);

    return {
        globalKillSwitchEnabled,
        ecosystemKillSwitchEnabled,
        effectiveKillSwitchEnabled: globalKillSwitchEnabled || ecosystemKillSwitchEnabled,
        tenantConcurrencyLimit,
    };
};

export const getInstallIntentReconcilerAlertThresholds =
    (): InstallIntentReconcilerAlertThresholds => ({
        maxStuckIntents: getMaxStuckIntentsAlertThreshold(),
        maxDegradedIntents: getMaxDegradedIntentsAlertThreshold(),
        maxFailedIntents: getMaxFailedIntentsAlertThreshold(),
    });

export const evaluateInstallIntentReconcilerAlertBreaches = (
    counts: InstallIntentReconcilerAlertCounts,
    thresholds: InstallIntentReconcilerAlertThresholds
): InstallIntentReconcilerAlertBreach[] => {
    const breaches: InstallIntentReconcilerAlertBreach[] = [];

    if (counts.stuck > thresholds.maxStuckIntents) {
        breaches.push({
            alert: 'STUCK_INTENTS',
            threshold: thresholds.maxStuckIntents,
            observedValue: counts.stuck,
            severity: 'critical',
            firing: true,
        });
    }

    if (counts.degraded > thresholds.maxDegradedIntents) {
        breaches.push({
            alert: 'DEGRADED_INTENTS',
            threshold: thresholds.maxDegradedIntents,
            observedValue: counts.degraded,
            severity: 'warning',
            firing: true,
        });
    }

    if (counts.failed > thresholds.maxFailedIntents) {
        breaches.push({
            alert: 'FAILED_INTENTS',
            threshold: thresholds.maxFailedIntents,
            observedValue: counts.failed,
            severity: 'critical',
            firing: true,
        });
    }

    return breaches;
};

export const injectInstallIntentReconcilerFailure = async (
    intentId: string,
    pass: 'install' | 'auth' | 'remove',
    count = 1
): Promise<void> => {
    await cache.set(getInjectedFailureKey(intentId, pass), String(count), false);
};

export const resetInstallIntentReconcilerTestState = async (): Promise<void> => {
    const keys = (await cache.keys('install-intent-reconciler:*')) ?? [];
    if (keys.length > 0) {
        await cache.delete(keys);
    }

    metrics.reconcileLatencyMs = 0;
    metrics.reconcileCount = 0;
    metrics.retries = 0;
    metrics.failures = 0;
    metrics.drift = 0;
    metrics.stuck = 0;
    intentQueues.clear();
};

export const getInstallIntentReconcilerMetricsSnapshot = (): ReconcilerMetricsSnapshot => ({
    ...metrics,
});

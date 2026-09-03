import { environment } from '@environment';
import { listInstallIntentsForReconciliation } from '@accesslayer/install-intent/intent-read';
import type { InstallIntentRecordType } from 'types/install-intent';

import {
    assertInstallIntentCoordinationAvailable,
    getInstallIntentReconcilerOperatorControls,
    reconcileInstallIntent,
} from './install-intent-reconciler';

const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_HEALTH_INTERVAL_MS = 5 * 60 * 1000;

export type ReconcileWork = 'resume' | 'health';

export type InstallIntentReconcilerPassSummary = {
    considered: number;
    resumed: number;
    healthChecked: number;
    halted: number;
    failed: number;
};

const positiveIntFromEnv = (raw: string | undefined, fallback: number): number => {
    const parsed = Number.parseInt(raw ?? '', 10);

    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const getInstallIntentReconcilerIntervalMs = (): number =>
    positiveIntFromEnv(environment.INSTALL_INTENT_RECONCILER_INTERVAL_MS, DEFAULT_INTERVAL_MS);

export const getInstallIntentReconcilerHealthIntervalMs = (): number =>
    positiveIntFromEnv(
        environment.INSTALL_INTENT_RECONCILER_HEALTH_INTERVAL_MS,
        DEFAULT_HEALTH_INTERVAL_MS
    );

/**
 * `PLANNED` is deliberately excluded: approval materializes the spec, but applying it
 * is the operator's explicit act. Auto-advancing it would let the scheduler grant
 * authority nobody pressed a button for, defeating the approval gate.
 *
 * `FAILED`, `SUSPENDED` and `REMOVED` are terminal until an operator intervenes —
 * retry-budget exhaustion and policy suspension are decisions, not transients.
 */
export const classifyReconcileWork = (
    intent: InstallIntentRecordType,
    now = new Date()
): ReconcileWork | null => {
    const status = intent.status;

    if (!status) return null;

    if (status.phase === 'APPLYING' || status.phase === 'REMOVING') {
        const dueAt = status.nextAttemptAt ? new Date(status.nextAttemptAt).getTime() : 0;

        return dueAt <= now.getTime() ? 'resume' : null;
    }

    if (status.phase === 'READY' || status.phase === 'DEGRADED') {
        const observedAt = status.observedAt ? new Date(status.observedAt).getTime() : 0;

        return now.getTime() - observedAt >= getInstallIntentReconcilerHealthIntervalMs()
            ? 'health'
            : null;
    }

    return null;
};

export const runInstallIntentReconcilerPass = async (
    options: { now?: Date; limit?: number } = {}
): Promise<InstallIntentReconcilerPassSummary> => {
    assertInstallIntentCoordinationAvailable();

    const now = options.now ?? new Date();
    const summary: InstallIntentReconcilerPassSummary = {
        considered: 0,
        resumed: 0,
        healthChecked: 0,
        halted: 0,
        failed: 0,
    };

    const intents = await listInstallIntentsForReconciliation(options.limit);

    for (const intent of intents) {
        const work = classifyReconcileWork(intent, now);

        if (!work) continue;

        summary.considered += 1;

        const controls = await getInstallIntentReconcilerOperatorControls(intent.ecosystemId);

        if (controls.effectiveKillSwitchEnabled) {
            summary.halted += 1;
            continue;
        }

        try {
            await reconcileInstallIntent(intent.intentId, {
                operation: work === 'health' ? 'health' : undefined,
                now,
            });

            if (work === 'health') summary.healthChecked += 1;
            else summary.resumed += 1;
        } catch (error) {
            // A single wedged intent must not stop the pass for every other tenant.
            summary.failed += 1;
            console.warn(
                `[install-intent-reconciler] pass could not reconcile ${intent.intentId}`,
                error
            );
        }
    }

    return summary;
};

export const startInstallIntentReconciler = (
    options: { intervalMs?: number } = {}
): (() => void) => {
    const intervalMs = options.intervalMs ?? getInstallIntentReconcilerIntervalMs();

    let inFlight = false;

    const timer = setInterval(() => {
        // Skip rather than queue: a slow pass must not stack up behind itself.
        if (inFlight) return;

        inFlight = true;

        void runInstallIntentReconcilerPass()
            .catch(error => {
                console.error('[install-intent-reconciler] scheduled pass failed', error);
            })
            .finally(() => {
                inFlight = false;
            });
    }, intervalMs);

    timer.unref?.();

    return () => clearInterval(timer);
};

import { logSafeEvent } from '../logging';
import { reconcileInterruptedAiAudits } from './audit';
import { getPrivacyKeyMaterial } from './privacy-keys';

// Leave ample room for in-flight SDK calls, including another live service
// process sharing this database. Old pending attempts become indeterminate;
// reconciliation never replays a provider request.
const ABANDONED_AFTER_MS = 24 * 60 * 60 * 1_000;
const RECONCILE_INTERVAL_MS = 5 * 60 * 1_000;
let startup: Promise<void> | undefined;

export const startAiAuditReconciliation = (): Promise<void> => {
    if (startup) return startup;
    getPrivacyKeyMaterial();

    const reconcile = async (): Promise<void> => {
        try {
            const count = await reconcileInterruptedAiAudits(
                new Date(Date.now() - ABANDONED_AFTER_MS)
            );
            logSafeEvent('info', 'ai_audit_reconciled', { count });
        } catch {
            logSafeEvent('error', 'ai_audit_reconciliation_failed');
            throw new Error('AI audit reconciliation unavailable');
        }
    };

    const schedule = (): void => {
        const timer = setTimeout(async () => {
            try {
                await reconcile();
            } catch {
                // Failure is reported without payloads above. Pending records remain
                // durable, and the next scheduled sweep can recover them.
            } finally {
                // Schedule after completion: a slow database cannot overlap sweeps or
                // accumulate work, and idle maintenance does not keep shutdown alive.
                schedule();
            }
        }, RECONCILE_INTERVAL_MS);
        timer.unref();
    };

    startup = reconcile()
        .then(schedule)
        .catch(() => {
            startup = undefined;
            // Do not start serving requests/workers if startup recovery cannot run.
            throw new Error('AI audit reconciliation unavailable');
        });
    return startup;
};

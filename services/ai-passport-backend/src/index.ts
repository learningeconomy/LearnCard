import { validateBackendEnvironment } from './constants/env';
import { configureProductionLogging, logSafeEvent } from './logging';

export const startApiServer = async () => {
    configureProductionLogging();

    validateBackendEnvironment();
    // Start the shared LearnCard init now, alongside the dependency checks below,
    // so the first session after a cold start doesn't wait for it. Best effort:
    // it never fails or delays startup, and a failure isn't cached.
    void import('./learncard')
        .then(async ({ getLearnCard }) => {
            const startedAt = performance.now();
            const outcome = await getLearnCard.warm();
            if (outcome === 'skipped') return;
            logSafeEvent(
                outcome === 'ready' ? 'info' : 'warn',
                outcome === 'ready' ? 'learncard_warm_ready' : 'learncard_warm_failed',
                { durationMs: Math.round(performance.now() - startedAt) }
            );
        })
        .catch(() => undefined);
    const { assertPrivacyRuntimeReady } = await import('./services/dataErasure');
    await assertPrivacyRuntimeReady();
    const { assertMongoPrivacyCapabilities } = await import('./db');
    await assertMongoPrivacyCapabilities();
    const { assertQdrantPrivacyCapabilities } = await import('./db/qdrant');
    await assertQdrantPrivacyCapabilities();

    // Load database/application dependencies only after the logging policy is active.
    const { startAiAuditReconciliation } = await import('./ai/audit-reconciliation');
    await startAiAuditReconciliation();
    const { startDataErasureReconciliation } = await import('./services/dataErasureReconciliation');
    startDataErasureReconciliation();

    const { startHttpServer } = await import('./http/server');

    return startHttpServer();
};

if (import.meta.main) {
    try {
        await startApiServer();
    } catch {
        logSafeEvent('error', 'service_start_failed');
        process.exit(1);
    }
}

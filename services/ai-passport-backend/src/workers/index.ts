import { validateBackendEnvironment } from '../constants/env';
import { configureProductionLogging, logSafeEvent } from '../logging';

export const startWorkers = async () => {
    configureProductionLogging();

    validateBackendEnvironment();
    const { assertPrivacyRuntimeReady } = await import('../services/dataErasure');
    await assertPrivacyRuntimeReady();
    const { assertMongoPrivacyCapabilities } = await import('../db');
    await assertMongoPrivacyCapabilities();
    const { assertQdrantPrivacyCapabilities } = await import('../db/qdrant');
    await assertQdrantPrivacyCapabilities();

    // Load database/worker dependencies only after the logging policy is active.
    const { startAiAuditReconciliation } = await import('../ai/audit-reconciliation');
    await startAiAuditReconciliation();
    const { startDataErasureReconciliation } =
        await import('../services/dataErasureReconciliation');
    startDataErasureReconciliation();

    const [credentialIngestion, conversationSummary] = await Promise.all([
        import('./credentialIngestion'),
        import('./conversationSummary'),
    ]);

    return {
        credentialIngestion: credentialIngestion.startCredentialIngestionWorker(),
        conversationSummary: conversationSummary.startConversationSummaryWorker(),
    };
};

if (import.meta.main) {
    try {
        await startWorkers();
    } catch {
        logSafeEvent('error', 'service_start_failed');
        process.exit(1);
    }
}

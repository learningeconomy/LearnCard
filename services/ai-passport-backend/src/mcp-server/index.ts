import { validateBackendEnvironment } from '../constants/env';
import { configureProductionLogging, logSafeEvent } from '../logging';

export const startMcpServer = async () => {
    configureProductionLogging();

    validateBackendEnvironment();
    // Start the shared LearnCard init now, alongside the dependency checks below,
    // so the first MCP tool call after a cold start doesn't wait for it. Best
    // effort: it never fails or delays startup, and a failure isn't cached.
    void import('../learncard')
        .then(({ getLearnCard }) => getLearnCard.warm())
        .catch(() => undefined);
    // SDK and database imports must not run before logging has been restricted.
    const { initializeInstrumentation } = await import('./instrument');
    initializeInstrumentation();
    const { assertPrivacyRuntimeReady } = await import('../services/dataErasure');
    await assertPrivacyRuntimeReady();
    const { assertMongoPrivacyCapabilities } = await import('../db');
    await assertMongoPrivacyCapabilities();
    const { assertQdrantPrivacyCapabilities } = await import('../db/qdrant');
    await assertQdrantPrivacyCapabilities();
    const { startAiAuditReconciliation } = await import('../ai/audit-reconciliation');
    await startAiAuditReconciliation();
    const { startDataErasureReconciliation } =
        await import('../services/dataErasureReconciliation');
    startDataErasureReconciliation();

    // Loading after instrumentation is required so Sentry can instrument app dependencies.
    const { startMcpServer: startApp } = await import('./app');

    return startApp();
};

if (import.meta.main) {
    try {
        await startMcpServer();
    } catch {
        logSafeEvent('error', 'service_start_failed');
        process.exit(1);
    }
}

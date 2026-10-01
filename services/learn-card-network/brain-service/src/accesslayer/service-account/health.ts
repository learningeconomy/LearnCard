import { IntegrationManifestValidator } from '@learncard/types';
import { neogma } from '@instance';
import { ServiceAccount, ServiceAccountGrant } from '@models';
import { getInstallIntentReconcilerRuntimeEnvironment } from '@environment';
import { readListingVersionById } from '@accesslayer/listing-version/read';
import {
    integrationConfigValid,
    probeIntegrationHealth,
} from '@helpers/service-account-health.helpers';
import type { InstallTargetSpec } from '@learncard/types';
import type { InstallIntentRecordType } from 'types/install-intent';
import { SERVICE_ACCOUNT_AGGREGATE_VALID } from './invariants';

/** One probe per pass, persistent failure counter, compare-and-set on generation.
 * An emergency revoke or removal racing a probe can never be undone by its result.
 */
export const reconcileServiceAccountHealth = async (
    intent: InstallIntentRecordType,
    target: InstallTargetSpec & { id: string }
): Promise<string | undefined> => {
    const account = await ServiceAccount.findOne({
        where: { activeInstallId: target.id },
        plain: true,
    });
    if (!account || account.status === 'REVOKED') return 'ServiceAccount unavailable';
    // Intent READY describes materialization, not authority. Never auto-recover
    // operator/invariant disablement even after its graph drift is repaired.
    if (account.status === 'DISABLED' && account.disabledCause !== 'HEALTH') return undefined;
    const version = await readListingVersionById(target.versionId);
    let cause: string | undefined;
    let healthUrl: string | undefined;
    try {
        const manifest = IntegrationManifestValidator.parse(
            JSON.parse(version?.manifest_json ?? 'null')
        );
        healthUrl = manifest.endpoints.healthUrl;
        const config = Object.fromEntries(
            Object.entries(target.config).filter(([key]) => key !== 'declarationId')
        );
        if (!integrationConfigValid(manifest.configSchema, config))
            cause = 'CONFIG: integration configuration is invalid';
    } catch {
        cause = 'CONFIG: pinned integration manifest is invalid';
    }
    const grants = await ServiceAccountGrant.findMany({
        where: { serviceAccountId: account.id },
        plain: true,
    });
    if (
        !cause &&
        (!account.credentialVerifier ||
            !account.credentialExpiresAt ||
            Date.parse(account.credentialExpiresAt) <= Date.now())
    )
        cause = 'AUTH: issue an unexpired integration credential';
    if (!cause && grants.length && !healthUrl)
        cause = 'HEALTH: a scoped integration requires manifest endpoints.healthUrl';
    if (!cause && healthUrl && !(await probeIntegrationHealth(account, healthUrl)))
        cause = 'HEALTH: authenticated health probe failed';

    if (account.status === 'PROVISIONED' && cause) {
        await neogma.queryRunner.run(
            `MATCH (sa:ServiceAccount {id: $id}) WHERE sa.status = 'PROVISIONED' AND sa.credentialGeneration = $gen SET sa.enableCause = $cause`,
            { id: account.id, gen: account.credentialGeneration, cause }
        );
        // Intent READY means materialized in ADR-008, not operational. The account
        // remains PROVISIONED with a durable, inspectable enable-gate cause.
        return undefined;
    }
    if (
        cause?.startsWith('AUTH:') &&
        (account.status === 'ENABLED' || account.disabledCause === 'HEALTH')
    ) {
        // Renewal expiry is not a probe failure. Return to the non-operational
        // issuance state, so the operator can rotate and rerun the enable gate.
        await neogma.queryRunner.run(
            `MATCH (sa:ServiceAccount {id: $id})
            SET sa.healthRevision = coalesce(sa.healthRevision, 0) + 1
            WITH sa WHERE (sa.status = 'ENABLED' OR (sa.status = 'DISABLED' AND sa.disabledCause = 'HEALTH')) AND sa.credentialGeneration = $gen
            SET sa.status = 'PROVISIONED', sa.credentialGeneration = sa.credentialGeneration + 1.0, sa.enableCause = $cause, sa.disabledCause = null`,
            { id: account.id, gen: account.credentialGeneration, cause }
        );
        return undefined;
    }
    const rawThreshold = Number(
        getInstallIntentReconcilerRuntimeEnvironment()
            .INSTALL_INTENT_RECONCILER_HEALTH_FAILURE_THRESHOLD ?? 3
    );
    const threshold = Number.isSafeInteger(rawThreshold) && rawThreshold > 0 ? rawThreshold : 3;
    const result = await neogma.queryRunner.run(
        `MATCH (sa:ServiceAccount {id: $id})
         SET sa.healthRevision = coalesce(sa.healthRevision, 0) + 1
         WITH sa WHERE sa.credentialGeneration = $gen AND sa.status = $previous
           AND (sa.status <> 'DISABLED' OR sa.disabledCause = 'HEALTH')
           AND (${SERVICE_ACCOUNT_AGGREGATE_VALID})
         SET sa.healthFailures = CASE WHEN $failed THEN coalesce(sa.healthFailures, 0.0) + 1.0 ELSE 0.0 END
         WITH sa, CASE WHEN $failed THEN
             CASE WHEN sa.healthFailures >= $threshold OR sa.status = 'DISABLED' THEN 'DISABLED' ELSE sa.status END
             ELSE 'ENABLED' END AS nextStatus
         SET sa.credentialGeneration = CASE WHEN nextStatus = 'DISABLED' AND sa.status <> 'DISABLED' THEN sa.credentialGeneration + 1.0 ELSE sa.credentialGeneration END,
             sa.status = nextStatus, sa.enableCause = $cause,
             sa.disabledCause = CASE WHEN nextStatus = 'DISABLED' THEN 'HEALTH' ELSE null END
         FOREACH (_ IN CASE WHEN $previous <> nextStatus THEN [1] ELSE [] END |
             CREATE (:InstallIntentAuditEvent {id: randomUUID(), action: 'SERVICE_ACCOUNT_HEALTH_TRANSITION',
                 intentId: $intentId, ecosystemId: $ecosystemId, timestamp: $now,
                 authorityChangesSummary: $cause, afterSummary: $summary}))
         RETURN sa.status AS status`,
        {
            id: account.id,
            gen: account.credentialGeneration,
            previous: account.status,
            failed: Boolean(cause),
            threshold,
            cause: cause ?? null,
            intentId: intent.intentId,
            ecosystemId: intent.ecosystemId,
            now: new Date().toISOString(),
            summary: JSON.stringify({ serviceAccountId: account.id, healthy: !cause }),
        }
    );
    return result.records[0]?.get('status') === 'DISABLED'
        ? (cause ?? 'HEALTH: ServiceAccount disabled')
        : undefined;
};

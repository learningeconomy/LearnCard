import { randomUUID } from 'node:crypto';
import { neogma } from '@instance';
import { FlatBindingValidator } from 'types/binding';
import { inflateBinding, serializeBindingRecord } from './shared';

/** Idempotent rollout: old subject-data approvals are not governance evidence. */
export const suspendLegacySubjectBindings = async (): Promise<number> => {
    const session = neogma.driver.session();
    try {
        return await session.executeWrite(async (tx): Promise<number> => {
            const result = await tx.run(
                `MATCH (b:Binding) WHERE b.capability <> 'registry-adapter'
                 SET b.consentPreflightLock = coalesce(b.consentPreflightLock, 0) + 1
                 WITH b WHERE b.status IN ['ACTIVE', 'APPROVED']
                     AND NOT EXISTS { MATCH (b)-[:APPROVED_WITH]->(:BindingConsentPreflight) }
                 RETURN properties(b) AS binding ORDER BY b.bindingId`
            );
            const now = new Date().toISOString();
            for (const row of result.records) {
                const binding = inflateBinding(FlatBindingValidator.parse(row.get('binding')));
                await tx.run(
                    `MATCH (b:Binding {bindingId: $bindingId}) SET b += $patch,
                         b.suspensionReason = 'LEGACY_CALLER_ASSERTED_CONSENT'
                     CREATE (:InstallIntentAuditEvent {id: $id, action: 'BINDING_SUSPENDED',
                         bindingId: b.bindingId, ecosystemId: b.ecosystemId, timestamp: $now,
                         beforeSummary: $beforeSummary, afterSummary: $afterSummary})`,
                    {
                        bindingId: binding.bindingId,
                        id: `install_intent_audit_${randomUUID()}`,
                        now,
                        patch: serializeBindingRecord({
                            ...binding,
                            status: 'SUSPENDED',
                            updatedAt: now,
                            revision: binding.revision + 1,
                            revisions: {
                                ...binding.revisions,
                                bindingRevision: binding.revisions.bindingRevision + 1,
                            },
                        }),
                        beforeSummary: JSON.stringify({
                            status: binding.status,
                            revision: binding.revision,
                        }),
                        afterSummary: JSON.stringify({
                            status: 'SUSPENDED',
                            reason: 'LEGACY_CALLER_ASSERTED_CONSENT',
                        }),
                    }
                );
            }
            return result.records.length;
        });
    } finally {
        await session.close();
    }
};

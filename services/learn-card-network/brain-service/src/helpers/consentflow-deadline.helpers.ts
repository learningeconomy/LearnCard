import { neogma } from '@instance';

export type ConsentFlowDeadlineSummary = { suspended: number };

/** Move expired pending re-consents to suspended; safe to run repeatedly. */
export const suspendExpiredConsentFlowTerms = async (
    now = new Date().toISOString()
): Promise<ConsentFlowDeadlineSummary> => {
    const result = await neogma.queryRunner.run(
        `MATCH (terms:ConsentFlowTerms)
         WHERE terms.status = 'needs_reconsent'
           AND terms.reconsentDeadline IS NOT NULL
           AND terms.reconsentDeadline <= $now
         SET terms.status = 'suspended', terms.updatedAt = $now
         RETURN count(terms) AS suspended`,
        { now }
    );
    const value = result.records[0]?.get('suspended');
    return {
        suspended: typeof value?.toNumber === 'function' ? value.toNumber() : Number(value ?? 0),
    };
};

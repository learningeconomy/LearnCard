import { v4 as uuid } from 'uuid';

import { neogma } from '@instance';
import {
    DelegateGrantAuditValidator,
    type DelegateGrantAuditOutcome,
    type DelegateGrantAuditRecord,
} from '@models';

/** What a caller says about a delegated request; the id and the timestamp are set here. */
export type NewDelegateGrantAudit = Omit<DelegateGrantAuditRecord, 'id' | 'timestamp'>;

const CREATE_DELEGATE_GRANT_AUDIT = `
CREATE (audit:DelegateGrantAudit)
SET audit = $properties
RETURN audit.id AS id
`;

// One statement, so two completions cannot both win. A record is completed once, and a denial
// is never rewritten into a success: only an allowed record without an outcome matches.
const COMPLETE_DELEGATE_GRANT_AUDIT = `
MATCH (audit:DelegateGrantAudit { id: $id })
WHERE audit.decision = 'allowed' AND audit.outcome IS NULL
SET audit.outcome = $outcome,
    audit.resultRef = $resultRef,
    audit.completedAt = $completedAt
RETURN audit.id AS id
`;

/**
 * Stores the record of one delegated request and returns its id. Throws when the record does
 * not parse or when nothing was created: a caller that must not go on without a record relies
 * on that.
 */
export const createDelegateGrantAudit = async (record: NewDelegateGrantAudit): Promise<string> => {
    const parsed = DelegateGrantAuditValidator.parse({
        ...record,
        id: uuid(),
        timestamp: new Date().toISOString(),
    });

    // The parsed record holds only schema fields; an absent optional one must not be sent.
    const properties = Object.fromEntries(
        Object.entries(parsed).filter(([, value]) => value !== undefined)
    );

    const result = await neogma.queryRunner.run(CREATE_DELEGATE_GRANT_AUDIT, { properties });

    const id: unknown = result.records[0]?.get('id');

    if (typeof id !== 'string') throw new Error('The delegated request was not recorded');

    return id;
};

/**
 * Sets the outcome of an allowed request, once. Returns whether a record changed: `false` for
 * an unknown id, a denial, or a record that already has its outcome.
 */
export const completeDelegateGrantAudit = async (
    id: string,
    outcome: DelegateGrantAuditOutcome,
    resultRef?: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(COMPLETE_DELEGATE_GRANT_AUDIT, {
        id,
        outcome,
        // Setting a property to null leaves it absent.
        resultRef: resultRef ?? null,
        completedAt: new Date().toISOString(),
    });

    return result.records.length > 0;
};

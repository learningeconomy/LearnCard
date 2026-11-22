import { ACCEPTED_VERSION_PREDICATE } from './consent-expiry.helpers';

/**
 * Shared by the locked send and the invite lookup. Callers separately exclude live consent.
 * Keep the LC-2372 exception for a sender replacing their own email-addressed request.
 */
export const contractRequestReplacementWhere = (sender: string, isEmailSend: string): string => `
    coalesce(existing.status IN ['denied', 'cancelled', 'accepted'] OR
        (existing.addressedByEmail = true AND existing.requestedBy = ${sender} AND
            (existing.status = 'expired' OR
             (existing.status = 'pending' AND (NOT (${isEmailSend}) OR existing.expiresAt <= $now)))), false)
`;

/** The profile attachment event keeps the invite ID. The email send event has an :invited suffix. */
export const inviteHasNeverAttached = `
    NOT EXISTS {
        MATCH (:ConsentFlowEvent {id: invite.id, kind: 'request_sent'})
    }
`;

/** An expired accepted version ends the grant. Preserve the legacy fallback when no version exists. */
export const activeRequestTermsWhere = (now: string): string => `
    (terms.status = 'live' OR (terms.status = 'consumed' AND terms.oneTime = true))
    AND CASE WHEN terms.expiresAt IS NULL OR trim(terms.expiresAt) = '' THEN true
             ELSE datetime(terms.expiresAt) > ${now} END
    AND NOT EXISTS {
        MATCH (contract)-[:HAS_VERSION]->(accepted:ConsentFlowContractVersion)
        WHERE ${ACCEPTED_VERSION_PREDICATE} AND CASE
            WHEN accepted.expiresAt IS NULL OR trim(accepted.expiresAt) = '' THEN false
            ELSE datetime(accepted.expiresAt) <= ${now} END
    }
`;

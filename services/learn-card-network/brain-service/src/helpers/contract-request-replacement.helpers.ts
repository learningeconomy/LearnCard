/**
 * Shared by the locked sends and the invite lookup after checking the sender and active terms.
 * An invitation bound to a prior consent cannot block a fresh request.
 */
export const contractRequestReplacementWhere = (
    sender: string,
    isEmailSend: string,
    consentId: string
): string => `
    coalesce(existing.status IN ['denied', 'cancelled', 'accepted'] OR
        (existing.status = 'pending' AND existing.liveReferral = true AND
            (${consentId} IS NULL OR existing.referralConsentId IS NULL OR existing.referralConsentId <> ${consentId})) OR
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

/** Active grants block new consent requests, including consumed one-time snapshots. */
export const activeRequestTermsWhere = (now: string): string => `
    (terms.status = 'live' OR (terms.status = 'consumed' AND terms.oneTime = true))
    AND CASE WHEN terms.expiresAt IS NULL OR trim(terms.expiresAt) = '' THEN true
             ELSE datetime(terms.expiresAt) > ${now} END
`;

/** Call after checking active consent and the sender's current contract role. */
export const liveReferralSenderWhere = (sender: string): string => `
    terms.status = 'live' AND coalesce(terms.oneTime, false) = false
    AND terms.smartResumeFingerprint IS NULL
    AND coalesce(terms.consentedVersion, 1) = coalesce(contract.currentVersion, 1)
    AND (terms.\`referral.requestId\` IS NULL OR terms.\`referral.requestedBy\` = ${sender}
        OR EXISTS { MATCH (contract)-[:CREATED_BY]->(:Profile {profileId: ${sender}}) })
`;

export const newLiveReferralReferenceWhere = (reference: string): string => `
    ${reference} IS NOT NULL AND ${reference} <> coalesce(terms.\`referral.externalReferenceId\`, '')
`;

/** Replaced email IDs retain their redacted terminal status or remain pending until expiry. */
export const detachReplacedRequestInviteCypher = `
    OPTIONAL MATCH (contract)-[:HAS_REQUEST_INVITE]->(replaced:ContractRequestInvite)
        WHERE NOT retry AND replaced.id = replacedId
    FOREACH (_ IN CASE WHEN replaced IS NOT NULL AND replacedStatus <> 'accepted' THEN [1] ELSE [] END |
        SET replaced.attachedProfileId = null, replaced.attachedAt = null,
            replaced.status = replacedStatus)
    FOREACH (_ IN CASE WHEN replaced IS NOT NULL AND replacedStatus = 'accepted' THEN [1] ELSE [] END |
        SET replaced.status = 'closed')
`;

/**
 * Preserve the last externally visible request while an email attachment remains private.
 * Keep the snapshot fields in step with requestFields and the public request status and ID reads.
 */
export const preservePreviousRequestCypher = `
    OPTIONAL MATCH (contract)-[previous:PREVIOUS_VISIBLE_REQUEST]->(target)
    MERGE (contract)-[request:REQUESTED_FOR]->(target)
    FOREACH (_ IN CASE WHEN NOT retry AND invite IS NOT NULL AND request.status IS NOT NULL
        AND (NOT coalesce(request.addressedByEmail, false) OR request.status = 'accepted')
        THEN [1] ELSE [] END |
        MERGE (contract)-[snapshot:PREVIOUS_VISIBLE_REQUEST]->(target)
        SET snapshot = request{.status, .requestId, .requestedBy, .externalReferenceId,
            .message, .requestedAt, .readStatus, .addressedByEmail, .expiresAt, .liveReferral})
    FOREACH (_ IN CASE WHEN NOT retry AND invite IS NULL AND previous IS NOT NULL
        THEN [1] ELSE [] END | DELETE previous)
`;

/**
 * Park a pending email by request ID under the audience lock. Older decided or expired edges can
 * coexist until invite maintenance folds them back into their invite records.
 */
export const parkEmailRequestCypher = (request: string, target: string, park: string): string => `
    FOREACH (_ IN CASE WHEN ${park} THEN [1] ELSE [] END |
        MERGE (contract)-[parked:PENDING_EMAIL_REQUEST {requestId: ${request}.requestId}]->(${target})
        ON CREATE SET parked = ${request}{.requestId, .status, .requestedBy, .externalReferenceId, .message,
            .requestedAt, .readStatus, .addressedByEmail, .expiresAt, .liveReferral, .referralConsentId})
`;

/** Keep one actionable attached email per contract and learner across both storage locations. */
export const noParkedEmailRequest = `NOT EXISTS {
    MATCH (contract)-[parked:PENDING_EMAIL_REQUEST]->(target)
    WHERE parked.status = 'pending' AND parked.expiresAt > $now
}`;

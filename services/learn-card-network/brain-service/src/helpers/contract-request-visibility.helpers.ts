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
            .message, .requestedAt, .readStatus, .addressedByEmail, .expiresAt})
    FOREACH (_ IN CASE WHEN NOT retry AND invite IS NULL AND previous IS NOT NULL
        THEN [1] ELSE [] END | DELETE previous)
`;

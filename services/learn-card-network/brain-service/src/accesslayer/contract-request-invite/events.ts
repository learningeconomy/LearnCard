/**
 * Cypher that records an integration-only request event for `invite`, in the same statement as
 * the invite change so the event cannot be lost. Integrations get it through the ordered
 * per-contract fan-out; no profile is notified. It never names a subject, so the feed looks the
 * same whether or not the email has an account. Expects `contract` and `invite` in scope and the
 * parameters `$eventDomain` and `$now`. The event ID is `<inviteId>:<suffix>`, so a repeat is a
 * no-op.
 */
export const inviteIntegrationEventCypher = (
    kind: 'request_sent' | 'request_cancelled' | 'request_expired',
    suffix: 'invited' | 'cancelled' | 'expired'
): string => `
    MERGE (event:ConsentFlowEvent {id: invite.id + ':${suffix}'})
    ON CREATE SET event += {kind: '${kind}', contractId: contract.id, requestId: invite.id,
        requestedBy: invite.requestedBy, externalReferenceId: invite.externalReferenceId,
        domain: $eventDomain, createdAt: $now, subjectHidden: true, integrationFanoutPending: true}
`;

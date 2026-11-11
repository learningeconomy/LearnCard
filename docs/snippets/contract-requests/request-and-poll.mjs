export const sendReferral = async (referrer, { contractUri, learnerProfileId, reference }) =>
    referrer.invoke.sendContractRequest({
        contractUri,
        targetProfileId: learnerProfileId,
        externalReferenceId: reference,
        message: 'Career support is available through this partner.',
    });

// Reconcile current state when a webhook is delayed or unavailable.
// The caller sees only requests and data its role and current consent allow.
export const pollReferral = async (client, { contractUri, learnerDid }) => {
    const requests = await client.invoke.getContractSentRequests(contractUri);
    const records = [];
    let cursor;
    let hasMore;
    do {
        // SDK name for the brain route getConsentedDataForDid.
        const page = await client.invoke.getConsentFlowDataForDid(learnerDid, {
            limit: 25,
            ...(cursor ? { cursor } : {}),
        });
        records.push(...page.records.filter(record => record.contractUri === contractUri));
        cursor = page.cursor;
        hasMore = page.hasMore;
    } while (hasMore);
    return { requests, records };
};

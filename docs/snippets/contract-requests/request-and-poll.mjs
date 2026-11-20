export const sendReferral = async (referrer, { contractUri, learnerProfileId, reference }) =>
    referrer.invoke.sendContractRequest({
        contractUri,
        targetProfileId: learnerProfileId,
        externalReferenceId: reference,
        message: 'Career support is available through this partner.',
    });

// Invite a person by email when you do not know their profile. The answer is always
// { requestId, status: 'pending' }, whether or not the email has an account.
export const sendReferralByEmail = async (referrer, { contractUri, email, reference }) =>
    referrer.invoke.sendContractRequest({
        contractUri,
        targetEmail: email,
        externalReferenceId: reference,
        message: 'Career support is available through this partner.',
    });

// Read one request by the ID that sendContractRequest returned. An email-addressed
// request shows target.email, and no profile or DID, until the person accepts.
export const trackReferral = async (referrer, { contractUri, requestId }) =>
    referrer.invoke.getContractRequest(contractUri, requestId);

export const cancelReferral = async (referrer, { contractUri, requestId }) =>
    referrer.invoke.cancelContractRequest(contractUri, { requestId });

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

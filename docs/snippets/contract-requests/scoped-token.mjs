// Run with the account's seed-backed client on your trusted server.
// Never log the returned token or include it in a browser bundle.
export const createReferralToken = async (
    account,
    scope = 'contracts:write contracts-data:read contracts-data:write'
) => {
    const grantId = await account.invoke.addAuthGrant({ name: 'Referral integration', scope });
    const token = await account.invoke.getAPITokenForAuthGrant(grantId);
    return { grantId, token };
};

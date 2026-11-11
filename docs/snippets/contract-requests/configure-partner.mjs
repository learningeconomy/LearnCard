// partner must have a network profile and the LCA API plugin installed.
// boostUri is an existing Achievement template owned by this partner.
export const configureReferralPartner = async (
    partner,
    { recipientProfileId, boostUri, authorityName = 'career-issuer' }
) => {
    const authority = await partner.invoke.createSigningAuthority(authorityName);
    if (!authority) throw new Error('Could not create signing authority');
    await partner.invoke.registerSigningAuthority(
        authority.endpoint,
        authority.name,
        authority.did
    );
    await partner.invoke.clearDidWebCache();
    const signingAuthority = { endpoint: authority.endpoint, name: authority.name };
    const contractUri = await partner.invoke.createContract({
        name: 'Career support',
        reasonForAccessing: 'To provide career support and return approved outcomes.',
        recipients: [recipientProfileId],
        contract: {
            read: {
                personal: {},
                credentials: { categories: { Achievement: { required: false } } },
            },
            write: {
                personal: {},
                credentials: { categories: { Achievement: { required: false } } },
            },
        },
        autoboosts: [{ boostUri, signingAuthority }],
    });
    return { contractUri, signingAuthority };
};

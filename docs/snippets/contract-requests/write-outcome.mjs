export const writeReferralOutcome = async ({
    brainApiUrl,
    writerApiToken,
    contractUri,
    learnerDid,
    boostUri,
    signingAuthority,
}) => {
    const response = await fetch(
        `${brainApiUrl}/consent-flow-contract/write/via-signing-authority`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${writerApiToken}`,
            },
            body: JSON.stringify({
                contractUri,
                did: learnerDid,
                boostUri,
                signingAuthority,
            }),
        }
    );
    if (!response.ok) throw new Error(`Outcome issuance failed (${response.status})`);
    return response.json();
};

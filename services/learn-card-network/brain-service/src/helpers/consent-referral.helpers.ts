/** Internal aliases only: capture durable attribution on issuance/maintenance transactions. */
export const termsReferralSnapshotCypher = (transactionAlias = 'transaction'): string => `
    SET ${transactionAlias}.\`referral.requestId\` = terms.\`referral.requestId\`,
        ${transactionAlias}.\`referral.requestedBy\` = terms.\`referral.requestedBy\`,
        ${transactionAlias}.\`referral.externalReferenceId\` = terms.\`referral.externalReferenceId\`
`;

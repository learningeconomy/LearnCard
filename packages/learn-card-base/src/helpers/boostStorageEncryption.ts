export const shouldEncryptForBoost = (boostTemplate: Record<string, unknown>): boolean =>
    boostTemplate.storage === 'encrypted-only';

export const encryptCredentialForBoost = async (
    credential: Record<string, unknown>,
    recipientDids: string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    learnCard: any
): Promise<Record<string, unknown>> => {
    if (recipientDids.length === 0) return credential;
    return learnCard.invoke.createDagJwe(credential, recipientDids);
};

export const prepareCredentialForStorage = async (
    credential: Record<string, unknown>,
    boostTemplate: Record<string, unknown>,
    recipientDids: string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    learnCard: any
): Promise<Record<string, unknown>> => {
    if (!shouldEncryptForBoost(boostTemplate)) return credential;
    return encryptCredentialForBoost(credential, recipientDids, learnCard);
};

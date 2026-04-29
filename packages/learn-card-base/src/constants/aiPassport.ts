export const LEARNCARD_AI_PASSPORT_CONTRACT_URI =
    'lc:network:network.learncard.com/trpc:contract:2ed7b889-c06e-47c4-835b-d924c17e9891';

export const isLearnCardAiPassportContractUri = (contractUri?: string | null): boolean => {
    return contractUri === LEARNCARD_AI_PASSPORT_CONTRACT_URI;
};

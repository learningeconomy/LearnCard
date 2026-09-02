export const LEARNCARD_AI_PASSPORT_CONTRACT_URI =
    'lc:network:network.learncard.com/trpc:contract:fd6649c7-52c9-4d02-b5ab-fade649d5a0b';

export const isLearnCardAiPassportContractUri = (contractUri?: string | null): boolean => {
    return contractUri === LEARNCARD_AI_PASSPORT_CONTRACT_URI;
};

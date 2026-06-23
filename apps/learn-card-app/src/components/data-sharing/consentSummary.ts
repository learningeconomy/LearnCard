import type { PaginatedConsentFlowTerms } from '@learncard/types';

export type ConsentedContract = PaginatedConsentFlowTerms['records'][number];

/** Counts accepted read/write categories for one contract. Shared by the modal rows and the dashboard summary. */
export const summarizeContractPermissions = (
    contract: ConsentedContract
): { read: number; write: number } => {
    // A category is "accepted" unless its sharing flag is explicitly false.
    const read = contract.terms?.read?.credentials?.categories
        ? Object.entries(contract.terms.read.credentials.categories).filter(([, config]) => {
              const cfg = config as { sharing?: boolean };
              return cfg.sharing !== false;
          }).length
        : 0;

    const write = contract.terms?.write?.credentials?.categories
        ? Object.entries(contract.terms.write.credentials.categories).filter(([, config]) => {
              if (typeof config === 'boolean') return config;
              const cfg = config as { sharing?: boolean };
              return cfg.sharing !== false;
          }).length
        : 0;

    return { read, write };
};

export const buildPermissionText = (contract: ConsentedContract): string => {
    const { read, write } = summarizeContractPermissions(contract);

    let text = '';
    if (read > 0) text += `${read} read`;
    if (write > 0) {
        text += text ? ', ' : '';
        text += `${write} write`;
    }

    return text || 'No permissions';
};

export type ConsentProofItem = {
    uri: string;
    name: string;
    image?: string;
};

export type ConsentSummary = {
    places: number;
    canRead: number;
    canWrite: number;
    proof: ConsentProofItem[];
};

export const summarizeConsent = (contracts: ConsentedContract[]): ConsentSummary => {
    let canRead = 0;
    let canWrite = 0;
    const proof: ConsentProofItem[] = [];

    for (const contract of contracts) {
        const { read, write } = summarizeContractPermissions(contract);
        if (read > 0) canRead += 1;
        if (write > 0) canWrite += 1;

        proof.push({
            uri: contract.uri,
            name: contract.contract?.name ?? 'Unknown App',
            image: contract.contract?.image,
        });
    }

    return { places: contracts.length, canRead, canWrite, proof };
};

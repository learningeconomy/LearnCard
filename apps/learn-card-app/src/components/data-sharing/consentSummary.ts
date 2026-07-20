import type { PaginatedConsentFlowTerms } from '@learncard/types';

import * as m from '../../paraglide/messages.js';

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

/**
 * Builds the localized "N read, M write" summary shown on each consented
 * contract row. Called during render, so calling the Paraglide message
 * functions here resolves against the active locale.
 */
export const buildPermissionText = (contract: ConsentedContract): string => {
    const { read, write } = summarizeContractPermissions(contract);

    const parts: string[] = [];
    if (read > 0) parts.push(m['dataSharing.readCount']({ count: read }));
    if (write > 0) parts.push(m['dataSharing.writeCount']({ count: write }));

    return parts.length ? parts.join(', ') : m['dataSharing.noPermissions']();
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

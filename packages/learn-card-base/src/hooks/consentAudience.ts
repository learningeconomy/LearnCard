import type { ConsentFlowContractDetails } from '@learncard/types';
import type { BespokeLearnCard } from '../types/learn-card';

/** Effective contract audience, before the existing SmartResume server recipients. */
export const getContractAudienceDids = (contract: ConsentFlowContractDetails): string[] =>
    [
        ...new Set([
            contract.owner.did,
            ...(contract.recipients ?? []).map(profile => profile.did),
        ]),
    ].sort();

/** Background sync may acknowledge fresh metadata because the server freezes additions
 * after first consent; subsequent audience changes can only remove recipients. */
export const loadContractAudience = async (wallet: BespokeLearnCard, contractUri: string) => {
    const contract = await wallet.invoke.getContract(contractUri);
    return {
        contract,
        recipients: getContractAudienceDids(contract),
        audienceVersion: contract.audienceVersion ?? 0,
    };
};

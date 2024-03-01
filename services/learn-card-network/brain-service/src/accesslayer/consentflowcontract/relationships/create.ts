import { LCNProfile } from '@learncard/types';
import { ConsentFlowContract } from '@models';
import { ConsentFlowType } from 'types/consentflowcontract';

export const setCreatorForContract = async (contract: ConsentFlowType, profile: LCNProfile) => {
    return ConsentFlowContract.relateTo({
        alias: 'createdBy',
        where: {
            source: { id: contract.id },
            target: { profileId: profile.profileId },
        },
    });
};

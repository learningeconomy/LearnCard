import { QueryBuilder } from 'neogma';

import { ConsentFlowTerms, Profile, ConsentFlowContract } from '@models';

export const deleteTermsById = async (id: string): Promise<number> => {
    return ConsentFlowTerms.delete({ where: { id }, detach: true });
};

export const removeRequestedForRelationship = async (
    id: string,
    profileId: string
): Promise<{ success: boolean; existed: boolean }> => {
    const result = await new QueryBuilder()
        .match({
            model: ConsentFlowContract,
            where: { id },
            identifier: 'contract',
        })
        .match({
            model: Profile,
            where: { profileId },
            identifier: 'profile',
        })
        .match({ optional: true, literal: '(contract)-[r:REQUESTED_FOR]->(profile)' })
        .with('r')
        .delete('r')
        .return('r')
        .run();

    const record = result.records?.[0];
    const existed = !!record?.toObject().r;

    return { success: true, existed };
};

import { BindParam, QueryBuilder } from 'neogma';
import { ConsentFlowTerms } from '@models';
import { lockContractAudience, runAudienceMutation } from './recipients';

export const deleteTermsById = async (id: string): Promise<number> => {
    return ConsentFlowTerms.delete({ where: { id }, detach: true });
};

/** The audience lock also serializes legacy deletion with email attachment and snapshot writes. */
export const removeRequestedForRelationship = async (
    id: string,
    profileId: string
): Promise<{ success: boolean; existed: boolean }> => {
    const result = await runAudienceMutation(
        lockContractAudience(new QueryBuilder(new BindParam({ profileId })), id).raw(`
            MATCH (contract)-[request:REQUESTED_FOR|PREVIOUS_VISIBLE_REQUEST]->(:Profile {profileId: $profileId})
            WHERE request.requestId IS NULL
            DELETE request
            RETURN count(*) AS deleted
        `)
    );
    return { success: true, existed: Number(result.records[0]?.get('deleted') ?? 0) > 0 };
};

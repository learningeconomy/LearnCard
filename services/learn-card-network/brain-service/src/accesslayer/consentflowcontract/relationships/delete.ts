import { BindParam, QueryBuilder } from 'neogma';
import { ConsentFlowTerms } from '@models';
import { lockContractAudience, runAudienceMutation } from './recipients';

export const deleteTermsById = async (id: string): Promise<number> => {
    return ConsentFlowTerms.delete({ where: { id }, detach: true });
};

/** Legacy deletion keeps stored timestamps so removing a request cannot reset either allowance. */
export const removeRequestedForRelationship = async (
    id: string,
    profileId: string
): Promise<{ success: boolean; existed: boolean }> => {
    const result = await runAudienceMutation(
        lockContractAudience(new QueryBuilder(new BindParam({ profileId })), id).raw(`
            MATCH (contract)-[request:REQUESTED_FOR|PREVIOUS_VISIBLE_REQUEST]->(:Profile {profileId: $profileId})
            WHERE request.requestId IS NULL AND NOT coalesce(request.requestHistoryOnly, false)
            WITH request, size(coalesce(request.profileRequestTimes, [])) +
                size(coalesce(request.emailRequestTimes, [])) > 0 AS hasHistory
            FOREACH (_ IN CASE WHEN hasHistory THEN [1] ELSE [] END |
                SET request = request{.profileRequestTimes, .emailRequestTimes, requestHistoryOnly: true})
            FOREACH (_ IN CASE WHEN hasHistory THEN [] ELSE [1] END | DELETE request)
            RETURN count(*) AS deleted
        `)
    );
    return { success: true, existed: Number(result.records[0]?.get('deleted') ?? 0) > 0 };
};

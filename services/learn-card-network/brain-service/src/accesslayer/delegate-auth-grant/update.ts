import { AuthGrantStatusValidator } from '@learncard/types';

import { neogma } from '@instance';

/**
 * Revocation is the only change a delegate grant ever sees, and only through its owner link.
 * There is deliberately no general update and no delete: every other field is a binding the
 * request path relies on, and a revoked grant must stay readable to explain a refusal.
 */
export const revokeDelegateAuthGrant = async (
    id: string,
    ownerProfileId: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Profile { profileId: $ownerProfileId })-[:AUTHORIZES_DELEGATE_GRANT]->(grant:DelegateAuthGrant { id: $id })
         SET grant.status = $revoked
         RETURN grant.id AS id`,
        { id, ownerProfileId, revoked: AuthGrantStatusValidator.enum.revoked }
    );

    return result.records.length > 0;
};

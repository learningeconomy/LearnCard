import { int } from 'neo4j-driver';

import { neogma } from '@instance';
import type { DelegateAuthGrant } from '@helpers/delegate-auth-grant.schema';
import { inflateObject } from '@helpers/objects.helpers';
import { ProfileType } from 'types/profile';

/**
 * The authoritative read of the request path. It deliberately has no filter on status or
 * expiry and no cache: the policy decides, and a refused request must still be attributable
 * to its grant. Matched through the owner link, so a node without one is never returned.
 */
export const getDelegateAuthGrantByChallenge = async (
    challenge: string
): Promise<{ grant: DelegateAuthGrant; ownerProfile: ProfileType } | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (owner:Profile)-[:AUTHORIZES_DELEGATE_GRANT]->(grant:DelegateAuthGrant { challenge: $challenge })
         RETURN grant, owner
         LIMIT 2`,
        { challenge }
    );

    // More than one row means two owners or two nodes for one challenge: authorise nobody.
    const record = result.records.length === 1 ? result.records[0] : undefined;
    if (!record) return null;

    const grant: DelegateAuthGrant = record.get('grant').properties;
    const ownerProfile: ProfileType = inflateObject(record.get('owner').properties);

    return { grant, ownerProfile };
};

export const getDelegateAuthGrantForOwner = async (
    id: string,
    ownerProfileId: string
): Promise<DelegateAuthGrant | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Profile { profileId: $ownerProfileId })-[:AUTHORIZES_DELEGATE_GRANT]->(grant:DelegateAuthGrant { id: $id })
         RETURN grant
         LIMIT 1`,
        { id, ownerProfileId }
    );

    const grant: DelegateAuthGrant | undefined = result.records[0]?.get('grant').properties;

    return grant ?? null;
};

/** Newest first. */
export const getDelegateAuthGrantsForOwner = async (
    ownerProfileId: string,
    limit: number
): Promise<DelegateAuthGrant[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Profile { profileId: $ownerProfileId })-[:AUTHORIZES_DELEGATE_GRANT]->(grant:DelegateAuthGrant)
         RETURN DISTINCT grant
         ORDER BY grant.createdAt DESC, grant.id
         LIMIT $limit`,
        { ownerProfileId, limit: int(limit) }
    );

    return result.records.map(record => record.get('grant').properties);
};

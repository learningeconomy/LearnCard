import { neogma } from '@instance';
import {
    DelegateAuthGrantValidator,
    type DelegateAuthGrant,
} from '@helpers/delegate-auth-grant.schema';

// One statement, so a grant never exists without its owner link: no owner profile, no node.
// A challenge or id already in use creates nothing either; the uniqueness constraints on the
// label (see models/index.ts) only back this up when two creations race.
const CREATE_DELEGATE_AUTH_GRANT = `
MATCH (owner:Profile { profileId: $ownerProfileId })
WHERE NOT EXISTS { MATCH (:DelegateAuthGrant { challenge: $challenge }) }
  AND NOT EXISTS { MATCH (:DelegateAuthGrant { id: $id }) }
WITH owner LIMIT 1
CREATE (owner)-[:AUTHORIZES_DELEGATE_GRANT]->(grant:DelegateAuthGrant)
SET grant = $properties
RETURN grant
`;

/**
 * Stores a delegate grant together with its owner link. Returns `null` when nothing was
 * created: the owner profile does not exist, or the challenge or id is already taken.
 */
export const createDelegateAuthGrant = async (
    grant: DelegateAuthGrant
): Promise<DelegateAuthGrant | null> => {
    // A record that does not parse is a programming error, not a request error: throw.
    const parsed = DelegateAuthGrantValidator.parse(grant);

    // The parsed record holds only schema fields; an absent optional one must not be sent.
    const properties = Object.fromEntries(
        Object.entries(parsed).filter(([, value]) => value !== undefined)
    );

    const result = await neogma.queryRunner.run(CREATE_DELEGATE_AUTH_GRANT, {
        ownerProfileId: parsed.ownerProfileId,
        challenge: parsed.challenge,
        id: parsed.id,
        properties,
    });

    const stored = result.records[0]?.get('grant').properties;

    return stored ? (stored as DelegateAuthGrant) : null;
};

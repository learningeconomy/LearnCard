import { SigningAuthorityInstance } from '@models';
import { neogma } from '@instance';
import { ProfileType } from 'types/profile';

export const createUseSigningAuthorityRelationship = async (
    user: ProfileType,
    signingAuthority: SigningAuthorityInstance,
    name: string,
    did: string,
    isPrimary: boolean = false
): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (profile:Profile { profileId: $profileId })
         MATCH (signingAuthority:SigningAuthority { endpoint: $endpoint })
         MERGE (profile)-[rel:USES_SIGNING_AUTHORITY { name: $name, did: $did }]->(signingAuthority)
         SET rel.isPrimary = $isPrimary`,
        { profileId: user.profileId, endpoint: signingAuthority.endpoint, name, did, isPrimary }
    );
};

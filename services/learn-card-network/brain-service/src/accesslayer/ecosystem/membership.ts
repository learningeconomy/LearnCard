import { neogma } from '@instance';
import { EcosystemRole } from '@learncard/types';

export const grantEcosystemMembership = async (input: {
    profileId: string;
    ecosystemId: string;
    role: EcosystemRole;
}): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (p:Profile { profileId: $profileId })
         MATCH (e:Ecosystem { id: $ecosystemId })
         MERGE (p)-[r:MEMBER_OF]->(e)
         SET r.role = $role`,
        input
    );
};

export const getEcosystemMembershipRole = async (
    profileId: string,
    ecosystemId: string
): Promise<EcosystemRole | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Profile { profileId: $profileId })-[r:MEMBER_OF]->(:Ecosystem { id: $ecosystemId })
         RETURN r.role AS role LIMIT 1`,
        { profileId, ecosystemId }
    );

    const record = result.records[0];

    return record ? (record.get('role') as EcosystemRole) : null;
};

export const revokeEcosystemMembership = async (
    profileId: string,
    ecosystemId: string
): Promise<void> => {
    await neogma.queryRunner.run(
        `MATCH (:Profile { profileId: $profileId })-[r:MEMBER_OF]->(:Ecosystem { id: $ecosystemId })
         DELETE r`,
        { profileId, ecosystemId }
    );
};

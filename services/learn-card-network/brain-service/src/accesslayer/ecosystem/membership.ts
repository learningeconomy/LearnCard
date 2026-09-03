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

export const listEcosystemMembershipsForProfile = async (
    profileId: string
): Promise<{ ecosystemId: string; role: EcosystemRole }[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Profile { profileId: $profileId })-[r:MEMBER_OF]->(e:Ecosystem)
         RETURN e.id AS ecosystemId, r.role AS role
         ORDER BY e.id`,
        { profileId }
    );

    return result.records.map(record => ({
        ecosystemId: record.get('ecosystemId') as string,
        role: record.get('role') as EcosystemRole,
    }));
};

export type EcosystemMember = {
    profileId: string;
    displayName: string;
    role: EcosystemRole;
    /** The Profile's own persona role (`Profile.role`), distinct from the MEMBER_OF ecosystem role. */
    profileRole: string | null;
    email: string | null;
};

export const getEcosystemMembers = async (ecosystemId: string): Promise<EcosystemMember[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile)-[r:MEMBER_OF]->(:Ecosystem { id: $ecosystemId })
         RETURN p.profileId AS profileId, p.displayName AS displayName, r.role AS role,
                p.role AS profileRole, p.email AS email
         ORDER BY r.role, p.profileId`,
        { ecosystemId }
    );

    return result.records.map(record => ({
        profileId: record.get('profileId') as string,
        displayName: (record.get('displayName') as string | null) ?? '',
        role: record.get('role') as EcosystemRole,
        profileRole: (record.get('profileRole') as string | null) ?? null,
        email: (record.get('email') as string | null) ?? null,
    }));
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

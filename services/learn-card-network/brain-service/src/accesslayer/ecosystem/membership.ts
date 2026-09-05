import { neogma } from '@instance';
import { EcosystemRole, LCNOrganizationDetails } from '@learncard/types';
import { organizationDetailsFromSummary } from '@helpers/organization.helpers';

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
    type?: string;
    organization?: LCNOrganizationDetails;
    /** The Profile's own persona role (`Profile.role`), distinct from the MEMBER_OF ecosystem role. */
    profileRole: string | null;
    email: string | null;
};

export const getEcosystemMembers = async (ecosystemId: string): Promise<EcosystemMember[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile)-[r:MEMBER_OF]->(:Ecosystem { id: $ecosystemId })
         RETURN p.profileId AS profileId, p.displayName AS displayName, r.role AS role,
                p.type AS type, p.role AS profileRole, p.email AS email,
                p.\`organization.institutionType\` AS institutionType,
                p.\`organization.address.addressLocality\` AS addressLocality,
                p.\`organization.address.addressRegion\` AS addressRegion,
                p.\`organization.address.addressCountry\` AS addressCountry
         ORDER BY r.role, p.profileId`,
        { ecosystemId }
    );

    return result.records.map(record => {
        const organization = organizationDetailsFromSummary({
            institutionType: record.get('institutionType'),
            addressLocality: record.get('addressLocality'),
            addressRegion: record.get('addressRegion'),
            addressCountry: record.get('addressCountry'),
        });

        return {
            profileId: record.get('profileId') as string,
            displayName: (record.get('displayName') as string | null) ?? '',
            role: record.get('role') as EcosystemRole,
            type: (record.get('type') as string | null) ?? undefined,
            ...(organization ? { organization } : {}),
            profileRole: (record.get('profileRole') as string | null) ?? null,
            email: (record.get('email') as string | null) ?? null,
        };
    });
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

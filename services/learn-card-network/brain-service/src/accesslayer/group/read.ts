import { neogma } from '@instance';
import { Group } from '@models';
import {
    Group as GroupType,
    GroupReference,
    GroupReferenceMode,
    GroupReferenceView,
    LCNOrganizationDetails,
} from '@learncard/types';
import { FlatGroupType } from 'types/group';
import { toJsNumber } from '@accesslayer/ecosystem/read';
import { organizationDetailsFromSummary } from '@helpers/organization.helpers';

export const inflateGroup = (flat: FlatGroupType): GroupType => {
    const { computedCriteria, parentGroupId, ...rest } = flat;

    let parsedCriteria: unknown = undefined;

    if (computedCriteria) {
        try {
            parsedCriteria = JSON.parse(computedCriteria);
        } catch {
            console.warn(
                `Failed to parse computedCriteria for group ${flat.id}; defaulting to undefined`
            );
            parsedCriteria = undefined;
        }
    }

    return {
        ...rest,
        depth: toJsNumber(rest.depth),
        parentGroupId: parentGroupId ?? null,
        computedCriteria: parsedCriteria,
        identityIssuanceEnabled: rest.identityIssuanceEnabled ?? Boolean(rest.identityProfileId),
    };
};

export type GroupMemberProfile = {
    profileId: string;
    displayName: string;
    type?: string;
    organization?: LCNOrganizationDetails;
};

export const getGroupMemberProfiles = async (groupId: string): Promise<GroupMemberProfile[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile)-[:MEMBER_OF]->(:Group { id: $groupId })
         RETURN p.profileId AS profileId, p.displayName AS displayName, p.type AS type,
                p.\`organization.institutionType\` AS institutionType,
                p.\`organization.address.addressLocality\` AS addressLocality,
                p.\`organization.address.addressRegion\` AS addressRegion,
                p.\`organization.address.addressCountry\` AS addressCountry
         ORDER BY p.profileId ASC`,
        { groupId }
    );

    return result.records.map(record => {
        const organization = organizationDetailsFromSummary({
            institutionType: record.get('institutionType'),
            addressLocality: record.get('addressLocality'),
            addressRegion: record.get('addressRegion'),
            addressCountry: record.get('addressCountry'),
        });

        return {
            profileId: String(record.get('profileId')),
            displayName: (record.get('displayName') as string | null) ?? '',
            type: (record.get('type') as string | null) ?? undefined,
            ...(organization ? { organization } : {}),
        };
    });
};

export const getGroupById = async (id: string): Promise<GroupType | null> => {
    const flat = await Group.findOne({ where: { id }, plain: true });

    return flat ? inflateGroup(flat as FlatGroupType) : null;
};

export const getGroupsOwnedByEcosystem = async (ownerEcosystemId: string): Promise<GroupType[]> => {
    const results = await Group.findMany({ where: { ownerEcosystemId } });

    return results.map(result => inflateGroup(result.dataValues as FlatGroupType));
};

export const getChildGroups = async (parentGroupId: string): Promise<GroupType[]> => {
    const results = await Group.findMany({ where: { parentGroupId } });

    return results.map(result => inflateGroup(result.dataValues as FlatGroupType));
};

export const getGroupMemberProfileIds = async (groupId: string): Promise<string[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile)-[:MEMBER_OF]->(:Group { id: $groupId })
         RETURN p.profileId AS profileId
         ORDER BY p.profileId ASC`,
        { groupId }
    );

    return result.records.map(record => String(record.get('profileId')));
};

export const getGroupMemberships = async (
    groupId: string
): Promise<{ profileId: string; provenance: string; joinedAt: string }[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile)-[r:MEMBER_OF]->(:Group { id: $groupId })
         RETURN p.profileId AS profileId, r.provenance AS provenance, r.joinedAt AS joinedAt
         ORDER BY p.profileId ASC`,
        { groupId }
    );

    return result.records.map(record => ({
        profileId: String(record.get('profileId')),
        provenance: String(record.get('provenance')),
        joinedAt: String(record.get('joinedAt')),
    }));
};

export const getGroupReferences = async (groupId: string): Promise<GroupReference[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (e:Ecosystem)-[r:REFERENCES]->(:Group { id: $groupId })
         RETURN e.id AS consumerEcosystemId,
                r.mode AS mode,
                r.grantedAt AS grantedAt,
                r.grantedByProfileId AS grantedByProfileId,
                r.expiresAt AS expiresAt
         ORDER BY consumerEcosystemId ASC`,
        { groupId }
    );

    return result.records.map(record => ({
        groupId,
        consumerEcosystemId: String(record.get('consumerEcosystemId')),
        mode: record.get('mode') as GroupReferenceMode,
        grantedAt: String(record.get('grantedAt')),
        grantedByProfileId: String(record.get('grantedByProfileId')),
        expiresAt: (record.get('expiresAt') as string | null | undefined) ?? null,
    }));
};

export const getGroupReferenceView = async (
    groupId: string,
    consumerEcosystemId: string
): Promise<GroupReferenceView | null> => {
    const group = await getGroupById(groupId);

    if (!group) return null;

    const result = await neogma.queryRunner.run(
        `MATCH (:Ecosystem { id: $consumerEcosystemId })-[r:REFERENCES]->(:Group { id: $groupId })
         RETURN r.mode AS mode
         LIMIT 1`,
        { groupId, consumerEcosystemId }
    );

    const mode = result.records[0]?.get('mode') as GroupReferenceMode | undefined;

    if (!mode) return null;

    const view: GroupReferenceView = {
        group: {
            id: group.id,
            name: group.name,
            slug: group.slug,
            type: group.type,
            description: group.description,
            status: group.status,
            ownerEcosystemId: group.ownerEcosystemId,
        },
    };

    if (mode === 'ROSTER') {
        view.memberProfileIds = await getGroupMemberProfileIds(groupId);
    }

    return view;
};

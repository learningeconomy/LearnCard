import sift from 'sift';
import { BindParam, QueryBuilder } from 'neogma';
import { int } from 'neo4j-driver';
import {
    convertObjectRegExpToNeo4j,
    convertQueryResultToPropertiesObjectArray,
    buildWhereClause,
    buildWhereForQueryBuilder,
} from '@helpers/neo4j.helpers';
import type { SkillQuery } from '@learncard/types';
import { BoostRecipientInfo, BoostPermissions, LCNProfileQuery } from '@learncard/types';
import {
    Boost,
    BoostInstance,
    Profile,
    Credential,
    CredentialInstance,
    CredentialRelationships,
    ProfileRelationships,
    Role,
    SkillFrameworkInstance,
    SkillInstance,
} from '@models';
import { FlatSkillFrameworkType } from 'types/skill-framework';
import { FlatSkillType } from 'types/skill';
import { neogma } from '@instance';
import { getProfilesByProfileIds } from '@accesslayer/profile/read';
import { FlatProfileType, ProfileType } from 'types/profile';
import { BoostType, BoostWithClaimPermissionsType } from 'types/boost';
import { ADMIN_ROLE_ID, CREATOR_ROLE_ID } from 'src/constants/roles';
import {
    CHILD_TO_NON_CHILD_PERMISSION,
    EMPTY_PERMISSIONS,
    QUERYABLE_PERMISSIONS,
} from 'src/constants/permissions';
import { getIdFromUri } from '@helpers/uri.helpers';
import { Role as RoleType } from 'types/role';
import { inflateObject } from '@helpers/objects.helpers';
import { getCredentialUri } from '@helpers/credential.helpers';
import { giveProfileEmptyPermissions } from './create';
import { getBoostUri } from '@helpers/boost.helpers';

export const getBoostOwner = async (boost: BoostInstance): Promise<ProfileType | undefined> => {
    const profile = (await boost.findRelationships({ alias: 'createdBy' }))[0]?.target;

    if (!profile) return undefined;

    return inflateObject<ProfileType>(profile.dataValues as any);
};

/**
 * Returns the `SkillFramework` used by a given boost via the `USES_FRAMEWORK` relationship.
 */
export const getFrameworkUsedByBoost = async (
    boost: BoostInstance
): Promise<SkillFrameworkInstance | undefined> => {
    const rel = (await boost.findRelationships({ alias: 'usesFramework' }))[0];
    return rel?.target;
};

export const getFrameworksForBoost = async (
    boost: BoostInstance
): Promise<SkillFrameworkInstance[]> => {
    const rels = await boost.findRelationships({ alias: 'usesFramework' });
    return rels.map(rel => rel.target).filter(Boolean) as SkillFrameworkInstance[];
};

export const getFrameworksForBoostPaged = async (
    boost: BoostInstance,
    searchQuery: Record<string, any> | null,
    limit: number,
    cursor?: string | null
): Promise<{
    records: FlatSkillFrameworkType[];
    hasMore: boolean;
    cursor: string | null;
}> => {
    const convertedQuery = convertObjectRegExpToNeo4j(searchQuery ?? {});
    const { whereClause, params: queryParams } = buildWhereClause('f', convertedQuery as any);

    let cursorName: string | null = null;
    let cursorCreated: string | null = null;
    let cursorId: string | null = null;

    if (cursor) {
        try {
            const decoded = JSON.parse(cursor);
            if (decoded && typeof decoded === 'object') {
                cursorName = (decoded.n as string) ?? null;
                cursorCreated = (decoded.c as string) ?? null;
                cursorId = (decoded.i as string) ?? null;
            }
        } catch {
            cursorId = cursor;
        }
    }

    const result = await neogma.queryRunner.run(
        `MATCH (b:Boost { id: $boostId })-[:USES_FRAMEWORK]->(f:SkillFramework)
         WHERE ${whereClause}
         AND (
            $cursorName IS NULL OR
            toLower(f.name) > $cursorName OR
            (toLower(f.name) = $cursorName AND (
                COALESCE(f.createdAt, "") > COALESCE($cursorCreated, "") OR
                (COALESCE(f.createdAt, "") = COALESCE($cursorCreated, "") AND f.id > COALESCE($cursorId, ""))
            ))
         )
         RETURN f AS f
         ORDER BY toLower(f.name) ASC, COALESCE(f.createdAt, "") ASC, f.id ASC
         LIMIT $limitPlusOne`,
        {
            boostId: boost.id,
            ...queryParams,
            cursorName,
            cursorCreated,
            cursorId,
            limitPlusOne: int(limit + 1),
        }
    );

    const all = result.records.map(r => {
        const props = ((r.get('f') as any)?.properties ?? {}) as Record<string, any>;
        return {
            ...props,
            status: props.status ?? 'active',
        } as FlatSkillFrameworkType;
    });

    const hasMore = all.length > limit;
    const page = all.slice(0, limit);
    const last = page[page.length - 1];
    const nextCursor = hasMore && last
        ? JSON.stringify({ n: (last.name || '').toLowerCase(), c: (last as any).createdAt || '', i: last.id })
        : null;

    return { records: page, hasMore, cursor: nextCursor };
};

/**
 * Returns the list of `Skill` nodes aligned to a given boost via the `ALIGNED_TO` relationship.
 */
export const getAlignedSkillsForBoost = async (boost: BoostInstance): Promise<SkillInstance[]> => {
    const rels = await boost.findRelationships({ alias: 'alignedTo' });
    return rels.map(r => r.target);
};

export const getFrameworkSkillsAvailableForBoost = async (
    boost: BoostInstance
): Promise<{ framework: FlatSkillFrameworkType; skills: FlatSkillType[] }[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (target:Boost { id: $boostId })
         OPTIONAL MATCH (ancestor:Boost)-[:PARENT_OF*0..]->(target)
         OPTIONAL MATCH (ancestor)-[:USES_FRAMEWORK]->(framework:SkillFramework)
         OPTIONAL MATCH (framework)-[:CONTAINS]->(skill:Skill)
         RETURN framework, collect(DISTINCT skill) AS skills`,
        { boostId: boost.id }
    );

    return result.records
        .map(record => {
            const frameworkNode = record.get('framework') as { properties?: Record<string, any> } | null;
            if (!frameworkNode?.properties) return null;

            const frameworkProps = frameworkNode.properties as FlatSkillFrameworkType;
            const skillNodes = (record.get('skills') as any[]) || [];
            const skills = skillNodes
                .map(node => (node?.properties ?? null) as Record<string, any> | null)
                .filter(Boolean)
                .map(props => ({
                    ...props,
                    type: props!.type ?? 'skill',
                })) as FlatSkillType[];

            return {
                framework: frameworkProps,
                skills,
            };
        })
        .filter(Boolean) as { framework: FlatSkillFrameworkType; skills: FlatSkillType[] }[];
};

/**
 * Search skills available for a boost using mongo-style query with $regex and $in operators.
 * Returns a flattened, paginated list of skills from frameworks attached to the boost or any of its ancestors.
 */
export const searchSkillsAvailableForBoost = async (
    boost: BoostInstance,
    searchQuery: SkillQuery,
    limit: number,
    cursorId?: string | null
): Promise<{
    records: FlatSkillType[];
    hasMore: boolean;
    cursor: string | null;
}> => {
    const convertedQuery = convertObjectRegExpToNeo4j(searchQuery);
    const { whereClause, params: queryParams } = buildWhereClause('skill', convertedQuery as any);

    const result = await neogma.queryRunner.run(
        `MATCH (target:Boost { id: $boostId })
         MATCH (ancestor:Boost)-[:PARENT_OF*0..]->(target)
         MATCH (ancestor)-[:USES_FRAMEWORK]->(framework:SkillFramework)
         MATCH (framework)-[:CONTAINS]->(skill:Skill)
         WHERE ${whereClause}
         AND ($cursorId IS NULL OR skill.id > $cursorId)
         WITH DISTINCT skill, collect(DISTINCT framework.id)[0] AS frameworkId
         ORDER BY skill.id
         LIMIT $limitPlusOne
         RETURN skill, frameworkId`,
        {
            boostId: boost.id,
            ...queryParams,
            cursorId: cursorId ?? null,
            limitPlusOne: int(limit + 1),
        }
    );

    const all = result.records.map(r => {
        const props = ((r.get('skill') as any)?.properties ?? {}) as Record<string, any>;
        const frameworkId = r.get('frameworkId');
        return {
            ...props,
            type: props.type ?? 'skill',
            frameworkId,
        } as FlatSkillType;
    });

    const hasMore = all.length > limit;
    const page = all.slice(0, limit);
    const nextCursor = hasMore ? page[page.length - 1]!.id : null;

    return { records: page, hasMore, cursor: nextCursor };
};

export const getCredentialInstancesOfBoost = async (
    boost: BoostInstance
): Promise<CredentialInstance[] | undefined> => {
    return (
        await Credential.findRelationships({
            alias: 'instanceOf',
            where: { target: { id: boost.id } },
        })
    ).map(relationship => relationship.source);
};

export const getBoostByUriWithDefaultClaimPermissions = async (
    uri: string
): Promise<BoostWithClaimPermissionsType | null> => {
    const id = getIdFromUri(uri);

    const rawResults = await new QueryBuilder()
        .match({ identifier: 'boost', model: Boost, where: { id } })
        .match({
            optional: true,
            related: [
                { identifier: 'boost' },
                Boost.getRelationshipByAlias('claimRole'),
                { model: Role, identifier: 'role' },
            ],
        })
        .return('boost, role')
        .limit(1)
        .run();

    const results = convertQueryResultToPropertiesObjectArray<{ boost: BoostType; role: RoleType }>(
        rawResults
    );

    if (results.length === 0) return null;

    const [result] = results;

    return {
        ...(inflateObject as any)(result!.boost as any),
        claimPermissions: result!.role,
    };
};

/**
 * Query to get the recipients of a boost. Cipher Code is:
 * MATCH (source:`Boost` { id: $id })<-[instanceOf:INSTANCE_OF]-(credential:`Credential`)-[received:CREDENTIAL_RECEIVED]->(recipient:`Profile`)
 */
export const getBoostRecipients = async (
    boost: BoostInstance,
    {
        limit,
        cursor,
        includeUnacceptedBoosts = true,
        query: matchQuery = {},
        domain,
    }: {
        limit: number;
        cursor?: string;
        includeUnacceptedBoosts?: boolean;
        query?: LCNProfileQuery;
        domain: string;
    }
): Promise<Array<BoostRecipientInfo & { sent: string }>> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause, params: queryParams } = buildWhereForQueryBuilder('recipient', convertedQuery as any);
    
    const _query = new QueryBuilder(new BindParam({ cursor, ...queryParams }))
        .match({
            related: [
                { identifier: 'source', model: Boost, where: { id: boost.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'in',
                },
                { identifier: 'credential', model: Credential },
                {
                    ...Profile.getRelationshipByAlias('credentialSent'),
                    identifier: 'sent',
                    direction: 'in',
                },
                { identifier: 'sender', model: Profile },
            ],
        })
        .match({ model: Profile, identifier: 'recipient' })
        .where('recipient.profileId = sent.to')
        .match({
            optional: includeUnacceptedBoosts,
            related: [
                { identifier: 'credential', model: Credential },
                {
                    ...Credential.getRelationshipByAlias('credentialReceived'),
                    identifier: 'received',
                },
                { identifier: 'recipient' },
            ],
        })
        .with('sender, sent, received, recipient, credential')
        // Filter out revoked credentials using WITH barrier pattern
        .where(`(received IS NULL OR coalesce(received.status, '') <> 'revoked')${whereClause ? ' AND ' + whereClause : ''}`);

    const query = cursor ? _query.raw('AND sent.date > $cursor') : _query;


    const results = convertQueryResultToPropertiesObjectArray<{
        sender: FlatProfileType;
        sent: ProfileRelationships['credentialSent']['RelationshipProperties'];
        recipient?: FlatProfileType;
        received?: CredentialRelationships['credentialReceived']['RelationshipProperties'];
        credential?: CredentialInstance;
    }>(
        await query
            .return('sender, sent, received, recipient, credential')
            .orderBy('sent.date')
            .limit(limit)
            .run()
    );

    const resultsWithIds = results.map(({ sender, sent, received, credential }) => ({
        sent: sent.date,
        to: sent.to,
        from: sender.profileId,
        received: received?.date,
        ...(credential && { uri: getCredentialUri(credential.id, domain) }),
    }));

    const recipients = await getProfilesByProfileIds(resultsWithIds.map(result => result.to));

    return resultsWithIds
        .map(result => ({
            ...result,
            to: recipients.find(recipient => recipient.profileId === result.to),
        }))
        .filter(result => Boolean(result.to)) as Array<BoostRecipientInfo & { sent: string }>;
};

/** @deprecated */
export const getBoostRecipientsSkipLimit = async (
    boost: BoostInstance,
    {
        limit,
        skip,
        includeUnacceptedBoosts = true,
        domain,
    }: {
        limit: number;
        skip?: number;
        includeUnacceptedBoosts?: boolean;
        domain: string;
    }
): Promise<BoostRecipientInfo[]> => {
    const query = new QueryBuilder()
        .match({
            related: [
                { identifier: 'source', model: Boost, where: { id: boost.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'in',
                },
                { identifier: 'credential', model: Credential },
                {
                    ...Profile.getRelationshipByAlias('credentialSent'),
                    identifier: 'sent',
                    direction: 'in',
                },
                { identifier: 'sender', model: Profile },
            ],
        })
        .match({
            optional: includeUnacceptedBoosts,
            related: [
                { identifier: 'credential', model: Credential },
                {
                    ...Credential.getRelationshipByAlias('credentialReceived'),
                    identifier: 'received',
                },
                { identifier: 'recipient', model: Profile },
            ],
        })
        // Use WITH barrier pattern to properly filter revoked credentials
        .with('sender, sent, received, credential')
        .where(`received IS NULL OR coalesce(received.status, '') <> 'revoked'`);

    const results = convertQueryResultToPropertiesObjectArray<{
        sender: FlatProfileType;
        sent: ProfileRelationships['credentialSent']['RelationshipProperties'];
        recipient?: FlatProfileType;
        received?: CredentialRelationships['credentialReceived']['RelationshipProperties'];
        credential?: CredentialInstance;
    }>(
        await query
            .return('sender, sent, received, credential')
            .limit(limit)
            .skip(skip ?? 0)
            .run()
    );

    const resultsWithIds = results.map(({ sender, sent, received, credential }) => ({
        to: sent.to,
        from: sender.profileId,
        received: received?.date,
        ...(credential && { uri: getCredentialUri(credential.id, domain) }),
    }));

    const recipients = await getProfilesByProfileIds(resultsWithIds.map(result => result.to));

    return resultsWithIds
        .map(result => ({
            ...result,
            to: recipients.find(recipient => recipient.profileId === result.to),
        }))
        .filter(result => Boolean(result.to)) as BoostRecipientInfo[];
};

export const countBoostRecipients = async (
    boost: BoostInstance,
    { includeUnacceptedBoosts = true }: { includeUnacceptedBoosts?: boolean }
): Promise<number> => {
    // Use raw Cypher to bypass potential QueryBuilder issues with OPTIONAL MATCH + WHERE
    const cypher = includeUnacceptedBoosts
        ? `
            MATCH (boost:Boost {id: $boostId})<-[:INSTANCE_OF]-(credential:Credential)
            MATCH (credential)<-[sent:CREDENTIAL_SENT]-(sender:Profile)
            OPTIONAL MATCH (credential)-[received:CREDENTIAL_RECEIVED]->(recipient:Profile)
            WITH DISTINCT sent.to AS recipientId, received
            WHERE received IS NULL OR coalesce(received.status, '') <> 'revoked'
            RETURN COUNT(DISTINCT recipientId) AS count
          `
        : `
            MATCH (boost:Boost {id: $boostId})<-[:INSTANCE_OF]-(credential:Credential)
            MATCH (credential)<-[sent:CREDENTIAL_SENT]-(sender:Profile)
            MATCH (credential)-[received:CREDENTIAL_RECEIVED]->(recipient:Profile)
            WHERE coalesce(received.status, '') <> 'revoked'
            RETURN COUNT(DISTINCT sent.to) AS count
          `;

    const result = await neogma.queryRunner.run(cypher, { boostId: boost.id });
    return Number(result.records[0]?.get('count') ?? 0);
};

export const getBoostAdmins = async (
    boost: BoostInstance,
    { limit, cursor, blacklist = [] }: { limit: number; cursor?: string; blacklist?: string[] }
): Promise<ProfileType[]> => {
    const _query = new QueryBuilder(new BindParam({ blacklist, cursor }))
        .match({
            related: [
                { identifier: 'source', model: Boost, where: { id: boost.id } },
                { ...Boost.getRelationshipByAlias('hasRole'), identifier: 'hasRole' },
                { identifier: 'admin', model: Profile },
            ],
        })
        .where(
            `(hasRole.roleId = "${ADMIN_ROLE_ID}" OR hasRole.roleId = "${CREATOR_ROLE_ID}") AND NOT admin.profileId IN $blacklist`
        );

    const query = cursor ? _query.raw('AND admin.profileId > $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        admin: ProfileType;
    }>(await query.return('admin').orderBy('admin.profileId').limit(limit).run());

    return results.map(({ admin }) => admin);
};

export const isProfileBoostAdmin = async (profile: ProfileType, boost: BoostInstance) => {
    const query = new QueryBuilder()
        .match({
            related: [
                { model: Boost, where: { id: boost.id } },
                { ...Boost.getRelationshipByAlias('hasRole'), identifier: 'hasRole' },
                { identifier: 'profile', model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .where(`hasRole.roleId = "${ADMIN_ROLE_ID}" OR hasRole.roleId = "${CREATOR_ROLE_ID}"`);

    const result = await query.return('count(profile) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0) > 0;
};

export const doesProfileHaveRoleForBoost = async (profile: ProfileType, boost: BoostInstance) => {
    const query = new QueryBuilder().match({
        related: [
            { model: Boost, where: { id: boost.id } },
            Boost.getRelationshipByAlias('hasRole'),
            { identifier: 'profile', model: Profile, where: { profileId: profile.profileId } },
        ],
    });

    const result = await query.return('count(profile) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0) > 0;
};

export const canProfileViewBoost = async (
    profile: ProfileType,
    boost: BoostInstance | BoostType
) => {
    const query = new QueryBuilder()
        .match({ model: Boost, identifier: 'target', where: { id: boost.id } })
        .with('target')
        .match({
            optional: true,
            related: [
                { identifier: 'parents', model: Boost },
                { ...Boost.getRelationshipByAlias('parentOf'), maxHops: Infinity },
                { identifier: 'target' },
            ],
        })
        .with('COLLECT(parents) + COLLECT(target) AS boosts')
        .match({ identifier: 'profile', model: Profile, where: { profileId: profile.profileId } })
        .where(
            `ANY(boost IN boosts WHERE EXISTS((profile)-[:${
                Boost.getRelationshipByAlias('hasRole').name
            }]-(boost)))`
        );
    const result = await query.return('count(profile) AS count, boosts').run();

    return Number(result.records[0]?.get('count') ?? 0) > 0;
};

export const canProfileCreateChildBoost = async (
    profile: ProfileType,
    parentBoost: BoostInstance,
    childBoost: Omit<BoostType, 'boost' | 'id'>
) => {
    // If the parent boost explicitly allows anyone to create children, bypass further checks
    if (parentBoost.allowAnyoneToCreateChildren) return true;

    const query = new QueryBuilder()
        .match({ model: Boost, where: { id: parentBoost.id }, identifier: 'targetBoost' })
        .match({ model: Profile, where: { profileId: profile.profileId }, identifier: 'profile' })
        .match({
            optional: true,
            related: [
                { identifier: 'targetBoost' },
                { ...Boost.getRelationshipByAlias('hasRole'), identifier: 'hasRole' },
                { identifier: 'profile' },
            ],
        })
        .match({ optional: true, literal: '(role:Role {id: hasRole.roleId})' })
        .match({
            optional: true,
            related: [
                { identifier: 'profile' },
                {
                    ...Boost.getRelationshipByAlias('hasRole'),
                    identifier: 'parentHasRole',
                    direction: 'none',
                },
                { identifier: 'parentBoost', model: Boost },
                {
                    ...Boost.getRelationshipByAlias('parentOf'),
                    direction: 'out',
                    maxHops: Infinity,
                },
                { identifier: 'targetBoost' },
            ],
        })
        .match({ optional: true, literal: '(parentRole:Role {id: parentHasRole.roleId})' });

    const result = await query
        .return(
            `
            COALESCE(hasRole.canCreateChildren, role.canCreateChildren) AS canCreateChildren,
            COALESCE(parentHasRole.canCreateChildren, parentRole.canCreateChildren) AS parentCanCreateChildren
`
        )
        .run();

    return result.records.some(record => {
        if (!record) return false;

        const canCreateChildren = record.get('canCreateChildren');
        const parentCanCreateChildren = record.get('parentCanCreateChildren');

        if (parentCanCreateChildren === '*' || canCreateChildren === '*') return true;

        if (
            canCreateChildren &&
            canCreateChildren !== '{}' &&
            sift(JSON.parse(canCreateChildren))(childBoost)
        ) {
            return true;
        }

        try {
            if (!parentCanCreateChildren || parentCanCreateChildren === '{}') return false;

            if (parentCanCreateChildren && typeof parentCanCreateChildren === 'string') {
                return sift(JSON.parse(parentCanCreateChildren))(childBoost);
            }
        } catch (error) {
            console.error('Error trying to parse canCreateChildren query!', error);
        }

        return false;
    });
};

export const canProfileEditBoost = async (profile: ProfileType, boost: BoostInstance) => {
    const permissions = await getBoostPermissions(boost, profile);

    return Boolean(permissions.canEdit);
};

export const canProfileIssueBoost = async (profile: ProfileType, boost: BoostInstance) => {
    const permissions = await getBoostPermissions(boost, profile);

    return Boolean(permissions.canIssue);
};

export const getBoostPermissions = async (
    boost: BoostInstance,
    profile: ProfileType,
    ensure = false
) => {
    const query = new QueryBuilder()
        .match({ model: Boost, where: { id: boost.id }, identifier: 'targetBoost' })
        .match({ model: Profile, where: { profileId: profile.profileId }, identifier: 'profile' })
        .match({
            optional: true,
            related: [
                { identifier: 'targetBoost' },
                { ...Boost.getRelationshipByAlias('hasRole'), identifier: 'hasRole' },
                { identifier: 'profile', where: { profileId: profile.profileId } },
            ],
        })
        .match({ optional: true, literal: '(role:Role {id: hasRole.roleId})' })
        .match({
            optional: true,
            related: [
                { identifier: 'profile' },
                {
                    ...Boost.getRelationshipByAlias('hasRole'),
                    identifier: 'parentHasRole',
                    direction: 'none',
                },
                { identifier: 'parentBoost', model: Boost },
                {
                    ...Boost.getRelationshipByAlias('parentOf'),
                    direction: 'out',
                    maxHops: Infinity,
                },
                { identifier: 'targetBoost' },
            ],
        })
        .match({ optional: true, literal: '(parentRole:Role {id: parentHasRole.roleId})' })
        // Match defaultRole for boost-level default permissions
        .match({
            optional: true,
            related: [
                { identifier: 'targetBoost' },
                Boost.getRelationshipByAlias('defaultRole'),
                { model: Role, identifier: 'defaultRole' },
            ],
        });

    const result = convertQueryResultToPropertiesObjectArray<{
        role: BoostPermissions;
        hasRole: BoostPermissions & { roleId: string };
        parentRole: BoostPermissions;
        parentHasRole: BoostPermissions & { roleId: string };
        defaultRole: BoostPermissions;
    }>(await query.return('role, hasRole, parentRole, parentHasRole, defaultRole').run());

    if (
        ensure &&
        (result.length === 0 ||
            (result.length === 1 &&
                !result[0]?.role &&
                !result[0]?.hasRole &&
                !result[0]?.parentRole &&
                !result[0]?.parentHasRole))
    )
        await giveProfileEmptyPermissions(profile, boost);

    // Get defaultRole permissions as the base (if any)
    const defaultRolePermissions = result[0]?.defaultRole ?? EMPTY_PERMISSIONS;
    const basePermissions = { ...EMPTY_PERMISSIONS, ...defaultRolePermissions };

    const directPermissions = result.reduce(
        (permissions, { role, hasRole }) => {
            const computedPermissions = { ...role, ...hasRole };

            Object.entries(computedPermissions).forEach(([permission, value]) => {
                if (permission === 'role') {
                    if (typeof value === 'string' && value !== 'empty') permissions.role = value;

                    return;
                }

                if (QUERYABLE_PERMISSIONS.includes(permission)) {
                    const currentPermission = (permissions as any)[permission];

                    if (currentPermission === '*') return;

                    if (value === '*') (permissions as any)[permission] = '*';
                    else if (!currentPermission || currentPermission === '{}') {
                        (permissions as any)[permission] = value;
                    } else {
                        const parsedPermission = JSON.parse(currentPermission);

                        if (
                            Object.keys(parsedPermission).length === 1 &&
                            '$or' in parsedPermission
                        ) {
                            (permissions as any)[permission] = JSON.stringify({
                                $or: [...parsedPermission['$or'], value],
                            });
                        } else {
                            (permissions as any)[permission] = JSON.stringify({
                                $or: [parsedPermission, value],
                            });
                        }
                    }
                } else {
                    (permissions as any)[permission] ||= value;
                }
            });

            return permissions;
        },
        { ...basePermissions }
    );

    return result.reduce((permissions, { parentRole, parentHasRole }) => {
        const computedParentPermissions = { ...parentRole, ...parentHasRole };

        Object.entries(computedParentPermissions).forEach(([permission, value]) => {
            if (permission === 'role') return;

            if (QUERYABLE_PERMISSIONS.includes(permission)) {
                const nonChildPermission = CHILD_TO_NON_CHILD_PERMISSION[permission];

                const currentPermission = (permissions as any)[permission];

                if (value === '*' && nonChildPermission) {
                    (permissions as any)[nonChildPermission] = true;
                }

                if (currentPermission === '*' || !value || value === '{}') return;

                if (
                    value !== '*' &&
                    nonChildPermission &&
                    !(permissions as any)[nonChildPermission]
                ) {
                    (permissions as any)[nonChildPermission] = sift(JSON.parse(value as any))(
                        boost
                    );
                }

                if (value === '*') (permissions as any)[permission] = '*';
                else if (!currentPermission || currentPermission === '{}') {
                    (permissions as any)[permission] = value;
                } else {
                    const parsedPermission = JSON.parse(currentPermission);

                    if (Object.keys(parsedPermission).length === 1 && '$or' in parsedPermission) {
                        (permissions as any)[permission] = JSON.stringify({
                            $or: [...parsedPermission['$or'], value],
                        });
                    } else {
                        (permissions as any)[permission] = JSON.stringify({
                            $or: [parsedPermission, value],
                        });
                    }
                }

                return;
            }
        });

        return permissions;
    }, directPermissions);
};

export const canManageBoostPermissions = async (
    boost: BoostInstance,
    profile: ProfileType
): Promise<boolean> => {
    const query = new QueryBuilder()
        .match({
            related: [
                { model: Boost, where: { id: boost.id } },
                { ...Boost.getRelationshipByAlias('hasRole'), identifier: 'hasRole' },
                { identifier: 'profile', model: Profile, where: { profileId: profile.profileId } },
            ],
        })
        .match('(role:Role {id: hasRole.roleId})');

    const result = await query
        .return(
            'COALESCE(hasRole.canManagePermissions, role.canManagePermissions) AS canManagePermissions'
        )
        .run();

    return result.records.some(record => Boolean(record?.get('canManagePermissions')));
};

export const isBoostParent = async (
    parentBoost: BoostInstance,
    childBoost: BoostInstance,
    {
        numberOfGenerations = 1,
        direction = 'out',
    }: { numberOfGenerations?: number; direction?: 'out' | 'in' | 'none' } = {}
): Promise<boolean> => {
    const query = new QueryBuilder().match({
        related: [
            { model: Boost, where: { id: parentBoost.id }, identifier: 'parent' },
            {
                ...Boost.getRelationshipByAlias('parentOf'),
                maxHops: numberOfGenerations,
                direction,
            },
            { model: Boost, where: { id: childBoost.id } },
        ],
    });

    const result = await query.return('count(parent) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0) > 0;
};

/**
 * Get boost recipients that are connected with the requesting profile
 */
export const getConnectedBoostRecipients = async (
    requestingProfile: ProfileType,
    boost: BoostInstance,
    {
        limit,
        cursor,
        includeUnacceptedBoosts = true,
        query: matchQuery = {},
        domain,
    }: {
        limit: number;
        cursor?: string;
        includeUnacceptedBoosts?: boolean;
        query?: LCNProfileQuery;
        domain: string;
    }
): Promise<Array<BoostRecipientInfo & { sent: string }>> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause: recipientWhereClause, params: queryParams } = buildWhereForQueryBuilder('recipient', convertedQuery as any);
    
    const _query = new QueryBuilder(new BindParam({ cursor, ...queryParams }))
        // Build connection list
        .match({
            model: Profile,
            where: { profileId: requestingProfile.profileId },
            identifier: 'requester',
        })
        // Direct connections
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Profile.getRelationshipByAlias('connectedWith'), direction: 'none' },
                { identifier: 'directTarget', model: Profile },
            ],
        })
        .with('requester, COLLECT(DISTINCT directTarget) AS directlyConnected')
        // Auto-connect via received boost
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('instanceOf') },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'in' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { model: Profile, identifier: 'receivedBoostTarget' },
            ],
        })
        .with(
            'requester, directlyConnected, COLLECT(DISTINCT receivedBoostTarget) AS receivedBoostTargets'
        )
        // Auto-connect via owned boost
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Boost.getRelationshipByAlias('createdBy'), direction: 'in' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'in' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { model: Profile, identifier: 'ownedBoostTarget' },
            ],
        })
        .with(
            'requester, directlyConnected, receivedBoostTargets, COLLECT(DISTINCT ownedBoostTarget) AS ownedBoostTargets'
        )
        .match({
            optional: true,
            related: [
                { model: Profile, identifier: 'otherOwnedBoostTarget' },
                { ...Boost.getRelationshipByAlias('createdBy'), direction: 'in' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'in' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { identifier: 'requester' },
            ],
        })
        .where(`otherOwnedBoostTarget.profileId <> "${requestingProfile.profileId}"`)
        .with(
            'requester, directlyConnected, receivedBoostTargets, ownedBoostTargets, COLLECT(DISTINCT otherOwnedBoostTarget) AS otherOwnedBoostTargets'
        )
        // Explicit auto-connect relationships: recipients of boosts owned by requester
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Boost.getRelationshipByAlias('createdBy'), direction: 'in' },
                { model: Boost, identifier: 'explicitOwnedBoost' },
                { ...Boost.getRelationshipByAlias('autoConnectRecipient'), direction: 'out' },
                { model: Profile, identifier: 'explicitOwnedTarget' },
            ],
        })
        .with(
            'requester, directlyConnected, receivedBoostTargets, ownedBoostTargets, otherOwnedBoostTargets, COLLECT(DISTINCT explicitOwnedTarget) AS explicitOwnedTargets'
        )
        // Explicit auto-connect relationships: creator of a received explicit auto-connect boost
        .match({
            optional: true,
            related: [
                { model: Profile, identifier: 'explicitOtherOwnedTarget' },
                { ...Boost.getRelationshipByAlias('createdBy'), direction: 'in' },
                { model: Boost, identifier: 'explicitOtherOwnedBoost' },
                { ...Boost.getRelationshipByAlias('autoConnectRecipient'), direction: 'out' },
                { identifier: 'requester' },
            ],
        })
        .where(`explicitOtherOwnedTarget.profileId <> "${requestingProfile.profileId}"`)
        .with(
            'requester, directlyConnected, receivedBoostTargets, ownedBoostTargets, otherOwnedBoostTargets, explicitOwnedTargets, COLLECT(DISTINCT explicitOtherOwnedTarget) AS explicitOtherOwnedBoostTargets'
        )
        // Explicit co-recipients for the same boost when requester is a credential recipient
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Credential.getRelationshipByAlias('credentialReceived'), direction: 'none' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'none' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Boost.getRelationshipByAlias('autoConnectRecipient'), direction: 'out' },
                { model: Profile, identifier: 'explicitCoRecipientFromCred' },
            ],
        })
        .where(`explicitCoRecipientFromCred.profileId <> "${requestingProfile.profileId}"`)
        .with(
            'requester, directlyConnected, receivedBoostTargets, ownedBoostTargets, otherOwnedBoostTargets, explicitOwnedTargets, explicitOtherOwnedBoostTargets, COLLECT(DISTINCT explicitCoRecipientFromCred) AS explicitCoRecipientsFromCred'
        )
        // Credential co-recipients for the same boost when requester is an explicit recipient
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Boost.getRelationshipByAlias('autoConnectRecipient'), direction: 'in' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'in' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { model: Profile, identifier: 'credentialCoRecipientFromExplicit' },
            ],
        })
        .where(`credentialCoRecipientFromExplicit.profileId <> "${requestingProfile.profileId}"`)
        .with(
            'requester, directlyConnected, receivedBoostTargets, ownedBoostTargets, otherOwnedBoostTargets, explicitOwnedTargets, explicitOtherOwnedBoostTargets, explicitCoRecipientsFromCred, COLLECT(DISTINCT credentialCoRecipientFromExplicit) AS credentialCoRecipientsFromExplicit'
        )
        // Explicit co-recipients for the same boost when requester is an explicit recipient
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Boost.getRelationshipByAlias('autoConnectRecipient'), direction: 'in' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Boost.getRelationshipByAlias('autoConnectRecipient'), direction: 'out' },
                { model: Profile, identifier: 'explicitCoRecipientFromExplicit' },
            ],
        })
        .where(`explicitCoRecipientFromExplicit.profileId <> "${requestingProfile.profileId}"`)
        .with(
            'requester, directlyConnected, receivedBoostTargets, ownedBoostTargets, otherOwnedBoostTargets, explicitOwnedTargets, explicitOtherOwnedBoostTargets, explicitCoRecipientsFromCred, credentialCoRecipientsFromExplicit, COLLECT(DISTINCT explicitCoRecipientFromExplicit) AS explicitCoRecipientsFromExplicit'
        )
        .with(
            'directlyConnected + receivedBoostTargets + ownedBoostTargets + otherOwnedBoostTargets + explicitOwnedTargets + explicitOtherOwnedBoostTargets + explicitCoRecipientsFromCred + credentialCoRecipientsFromExplicit + explicitCoRecipientsFromExplicit AS allConnectedProfiles'
        )
        .unwind('allConnectedProfiles AS conn')
        .with('COLLECT(DISTINCT conn.profileId) AS connectionIds')
        // --- Boost recipient matching ---
        .match({
            related: [
                { identifier: 'source', model: Boost, where: { id: boost.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'in',
                },
                { identifier: 'credential', model: Credential },
                {
                    ...Profile.getRelationshipByAlias('credentialSent'),
                    identifier: 'sent',
                    direction: 'in',
                },
                { identifier: 'sender', model: Profile },
            ],
        })
        .match({ model: Profile, identifier: 'recipient' })
        .where('recipient.profileId = sent.to')
        .match({
            optional: includeUnacceptedBoosts,
            related: [
                { identifier: 'credential', model: Credential },
                {
                    ...Credential.getRelationshipByAlias('credentialReceived'),
                    identifier: 'received',
                },
                { identifier: 'recipient' },
            ],
        })
        .with('sender, sent, received, recipient, credential, connectionIds')
        .where(`sent.to IN connectionIds AND ${recipientWhereClause}`);

    const query = cursor ? _query.raw('AND sent.date > $cursor') : _query;

    const results = convertQueryResultToPropertiesObjectArray<{
        sender: FlatProfileType;
        sent: ProfileRelationships['credentialSent']['RelationshipProperties'];
        recipient?: FlatProfileType;
        received?: CredentialRelationships['credentialReceived']['RelationshipProperties'];
        credential?: CredentialInstance;
    }>(
        await query
            .return('sender, sent, received, recipient, credential')
            .orderBy('sent.date')
            .limit(limit)
            .run()
    );

    const resultsWithIds = results.map(({ sender, sent, received, credential }) => ({
        sent: sent.date,
        to: sent.to,
        from: sender.profileId,
        received: received?.date,
        ...(credential && { uri: getCredentialUri(credential.id, domain) }),
    }));

    const recipients = await getProfilesByProfileIds(resultsWithIds.map(result => result.to));

    return resultsWithIds
        .map(result => ({
            ...result,
            to: recipients.find(recipient => recipient.profileId === result.to),
        }))
        .filter(result => Boolean(result.to)) as Array<BoostRecipientInfo & { sent: string }>;
};

/**
 * Count boost recipients that are connected with the requesting profile
 */
export const countConnectedBoostRecipients = async (
    requestingProfile: ProfileType,
    boost: BoostInstance,
    {
        includeUnacceptedBoosts = true,
        query: matchQuery = {},
    }: { includeUnacceptedBoosts?: boolean; query?: LCNProfileQuery }
): Promise<number> => {
    const convertedQuery = convertObjectRegExpToNeo4j(matchQuery);
    const { whereClause: countRecipientWhereClause, params: countQueryParams } = buildWhereForQueryBuilder('recipient', convertedQuery as any);
    
    const countQuery = new QueryBuilder(new BindParam({ ...countQueryParams }))
        // Build connection list
        .match({
            model: Profile,
            where: { profileId: requestingProfile.profileId },
            identifier: 'requester',
        })
        // Direct connections
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Profile.getRelationshipByAlias('connectedWith'), direction: 'none' },
                { identifier: 'directTarget', model: Profile },
            ],
        })
        .with('requester, COLLECT(DISTINCT directTarget) AS directlyConnected')
        // Auto-connect via received boost
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('instanceOf') },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'in' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { model: Profile, identifier: 'receivedBoostTarget' },
            ],
        })
        .with(
            'requester, directlyConnected, COLLECT(DISTINCT receivedBoostTarget) AS receivedBoostTargets'
        )
        // Auto-connect via owned boost
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Boost.getRelationshipByAlias('createdBy'), direction: 'in' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'in' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { model: Profile, identifier: 'ownedBoostTarget' },
            ],
        })
        .with(
            'requester, directlyConnected, receivedBoostTargets, COLLECT(DISTINCT ownedBoostTarget) AS ownedBoostTargets'
        )
        .match({
            optional: true,
            related: [
                { model: Profile, identifier: 'otherOwnedBoostTarget' },
                { ...Boost.getRelationshipByAlias('createdBy'), direction: 'in' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'in' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { identifier: 'requester' },
            ],
        })
        .where(`otherOwnedBoostTarget.profileId <> "${requestingProfile.profileId}"`)
        .with(
            'requester, directlyConnected, receivedBoostTargets, ownedBoostTargets, COLLECT(DISTINCT otherOwnedBoostTarget) AS otherOwnedBoostTargets'
        )
        // Explicit auto-connect relationships: recipients of boosts owned by requester
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Boost.getRelationshipByAlias('createdBy'), direction: 'in' },
                { model: Boost, identifier: 'explicitOwnedBoost' },
                { ...Boost.getRelationshipByAlias('autoConnectRecipient'), direction: 'out' },
                { model: Profile, identifier: 'explicitOwnedTarget' },
            ],
        })
        .with(
            'requester, directlyConnected, receivedBoostTargets, ownedBoostTargets, otherOwnedBoostTargets, COLLECT(DISTINCT explicitOwnedTarget) AS explicitOwnedTargets'
        )
        // Explicit auto-connect relationships: creator of a received explicit auto-connect boost
        .match({
            optional: true,
            related: [
                { model: Profile, identifier: 'explicitOtherOwnedTarget' },
                { ...Boost.getRelationshipByAlias('createdBy'), direction: 'in' },
                { model: Boost, identifier: 'explicitOtherOwnedBoost' },
                { ...Boost.getRelationshipByAlias('autoConnectRecipient'), direction: 'out' },
                { identifier: 'requester' },
            ],
        })
        .where(`explicitOtherOwnedTarget.profileId <> "${requestingProfile.profileId}"`)
        .with(
            'directlyConnected, receivedBoostTargets, ownedBoostTargets, otherOwnedBoostTargets, explicitOwnedTargets, COLLECT(DISTINCT explicitOtherOwnedTarget) AS explicitOtherOwnedBoostTargets'
        )
        // Explicit co-recipients for the same boost when requester is a credential recipient
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Credential.getRelationshipByAlias('credentialReceived'), direction: 'none' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'none' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Boost.getRelationshipByAlias('autoConnectRecipient'), direction: 'out' },
                { model: Profile, identifier: 'explicitCoRecipientFromCred' },
            ],
        })
        .where(`explicitCoRecipientFromCred.profileId <> "${requestingProfile.profileId}"`)
        .with(
            'directlyConnected, receivedBoostTargets, ownedBoostTargets, otherOwnedBoostTargets, explicitOwnedTargets, explicitOtherOwnedBoostTargets, COLLECT(DISTINCT explicitCoRecipientFromCred) AS explicitCoRecipientsFromCred'
        )
        // Credential co-recipients for the same boost when requester is an explicit recipient
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Boost.getRelationshipByAlias('autoConnectRecipient'), direction: 'in' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Credential.getRelationshipByAlias('instanceOf'), direction: 'in' },
                { model: Credential },
                { ...Credential.getRelationshipByAlias('credentialReceived') },
                { model: Profile, identifier: 'credentialCoRecipientFromExplicit' },
            ],
        })
        .where(`credentialCoRecipientFromExplicit.profileId <> "${requestingProfile.profileId}"`)
        .with(
            'directlyConnected, receivedBoostTargets, ownedBoostTargets, otherOwnedBoostTargets, explicitOwnedTargets, explicitOtherOwnedBoostTargets, explicitCoRecipientsFromCred, COLLECT(DISTINCT credentialCoRecipientFromExplicit) AS credentialCoRecipientsFromExplicit'
        )
        // Explicit co-recipients for the same boost when requester is an explicit recipient
        .match({
            optional: true,
            related: [
                { identifier: 'requester' },
                { ...Boost.getRelationshipByAlias('autoConnectRecipient'), direction: 'in' },
                { model: Boost, where: { autoConnectRecipients: true } },
                { ...Boost.getRelationshipByAlias('autoConnectRecipient'), direction: 'out' },
                { model: Profile, identifier: 'explicitCoRecipientFromExplicit' },
            ],
        })
        .where(`explicitCoRecipientFromExplicit.profileId <> "${requestingProfile.profileId}"`)
        .with(
            'directlyConnected, receivedBoostTargets, ownedBoostTargets, otherOwnedBoostTargets, explicitOwnedTargets, explicitOtherOwnedBoostTargets, explicitCoRecipientsFromCred, credentialCoRecipientsFromExplicit, COLLECT(DISTINCT explicitCoRecipientFromExplicit) AS explicitCoRecipientsFromExplicit'
        )
        .with(
            'directlyConnected + receivedBoostTargets + ownedBoostTargets + otherOwnedBoostTargets + explicitOwnedTargets + explicitOtherOwnedBoostTargets + explicitCoRecipientsFromCred + credentialCoRecipientsFromExplicit + explicitCoRecipientsFromExplicit AS allConnectedProfiles'
        )
        .unwind('allConnectedProfiles AS conn')
        .with('COLLECT(DISTINCT conn.profileId) AS connectionIds')
        // --- Boost recipient matching ---
        .match({
            related: [
                { identifier: 'source', model: Boost, where: { id: boost.id } },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'in',
                },
                { identifier: 'credential', model: Credential },
                {
                    ...Profile.getRelationshipByAlias('credentialSent'),
                    identifier: 'sent',
                    direction: 'in',
                },
                { identifier: 'sender', model: Profile },
            ],
        })
        .match({ model: Profile, identifier: 'recipient' })
        .where('recipient.profileId = sent.to')
        .match({
            optional: includeUnacceptedBoosts,
            related: [
                { identifier: 'credential', model: Credential },
                {
                    ...Credential.getRelationshipByAlias('credentialReceived'),
                    identifier: 'received',
                },
                { identifier: 'recipient' },
            ],
        })
        .with('sender, sent, received, recipient, credential, connectionIds')
        .where(`sent.to IN connectionIds AND ${countRecipientWhereClause}`);

    const result = await countQuery.return('COUNT(DISTINCT sent.to) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0);
};

/**
 * Combined function to get recipients of a boost and all its children boosts.
 * Results are grouped by profile (each profile appears once) with an array of boost URIs.
 * Results are sorted by profileId and pagination is handled in Neo4j for performance.
 */
export const getBoostRecipientsWithChildren = async (
    boost: BoostInstance,
    {
        limit,
        cursor,
        includeUnacceptedBoosts = true,
        numberOfGenerations = 1,
        boostQuery = {},
        profileQuery = {},
        domain,
    }: {
        limit: number;
        cursor?: string;
        includeUnacceptedBoosts?: boolean;
        numberOfGenerations?: number;
        boostQuery?: any;
        profileQuery?: LCNProfileQuery;
        domain: string;
    }
): Promise<Array<Omit<BoostRecipientInfo, 'uri'> & { boostUris: string[] }>> => {
    console.log('[AccessLayer] getBoostRecipientsWithChildren called');
    console.log('[AccessLayer] boostQuery:', JSON.stringify(boostQuery, null, 2));
    
    // Convert queries for Neo4j compatibility
    const boostQuery_neo4j = convertObjectRegExpToNeo4j(boostQuery);
    const profileQuery_neo4j = convertObjectRegExpToNeo4j(profileQuery);
    const { whereClause: boostWhereClause, params: boostQueryParams } = buildWhereForQueryBuilder('relevantBoost', boostQuery_neo4j as any);
    const { whereClause: profileWhereClause, params: profileQueryParams } = buildWhereForQueryBuilder('recipient', profileQuery_neo4j as any);

    // Build the complete query that does everything in Neo4j
    const _query = new QueryBuilder(
        new BindParam({
            cursor,
            ...boostQueryParams,
            ...profileQueryParams,
        })
    )
        // Get parent boost and its children
        .match({ model: Boost, where: { id: boost.id }, identifier: 'parentBoost' })
        .match({
            optional: true,
            related: [
                { identifier: 'parentBoost' },
                {
                    ...Boost.getRelationshipByAlias('parentOf'),
                    maxHops: numberOfGenerations,
                },
                { identifier: 'childBoost', model: Boost },
            ],
        })
        .with('COLLECT(DISTINCT parentBoost) + COLLECT(DISTINCT childBoost) AS allBoosts')
        .unwind('allBoosts AS relevantBoost')
        .match({ identifier: 'relevantBoost', model: Boost })
        .where(`relevantBoost IS NOT NULL AND ${boostWhereClause}`)
        // Get recipients for each boost
        .match({
            related: [
                { identifier: 'relevantBoost' },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'in',
                },
                { identifier: 'credential', model: Credential },
                {
                    ...Profile.getRelationshipByAlias('credentialSent'),
                    identifier: 'sent',
                    direction: 'in',
                },
                { identifier: 'sender', model: Profile },
            ],
        })
        .match({ model: Profile, identifier: 'recipient' })
        .where('recipient.profileId = sent.to')
        // Optional match for received credentials
        .match({
            optional: includeUnacceptedBoosts,
            related: [
                { identifier: 'credential', model: Credential },
                {
                    ...Credential.getRelationshipByAlias('credentialReceived'),
                    identifier: 'received',
                },
                { identifier: 'recipient' },
            ],
        })
        // Group by recipient and collect boost data first
        .with(
            `recipient, 
               COLLECT(DISTINCT {relevantBoost: relevantBoost, sender: sender, sent: sent, received: received, credential: credential}) AS boostData`
        )
        // Apply profile query filtering after grouping
        .where(profileWhereClause)
        // Add cursor filtering if provided
        .raw(cursor ? 'AND recipient.profileId > $cursor' : '')
        // Order by profileId and limit profiles (not individual boost relationships)
        .orderBy('recipient.profileId ASC')
        .limit(limit)
        .unwind('boostData AS data')
        .return(
            'data.relevantBoost AS relevantBoost, data.sender AS sender, data.sent AS sent, data.received AS received, recipient, data.credential AS credential'
        );

    // Execute the query
    const results = convertQueryResultToPropertiesObjectArray<{
        relevantBoost: any;
        sender: FlatProfileType;
        sent: ProfileRelationships['credentialSent']['RelationshipProperties'];
        recipient?: FlatProfileType;
        received?: CredentialRelationships['credentialReceived']['RelationshipProperties'];
        credential?: CredentialInstance;
    }>(await _query.run());

    // Process results and group by profile, filtering out revoked credentials
    // Debug: log results with status info
    console.log('[getBoostRecipientsWithChildren] Total results before filter:', results.length);
    const revokedResults = results.filter(({ received }) => received?.status === 'revoked');
    console.log('[getBoostRecipientsWithChildren] Revoked results:', revokedResults.map(r => ({ 
        to: r.sent?.to, 
        status: r.received?.status,
        boostId: r.relevantBoost?.id 
    })));
    
    const resultsWithIds = results
        .filter(({ received }) => received?.status !== 'revoked')
        .map(({ relevantBoost, sender, sent, received, credential }) => {
            const boostId = relevantBoost.id;
            return {
                sent: sent.date,
                to: sent.to,
                from: sender.profileId,
                received: received?.date,
                boostUri: getBoostUri(boostId, domain),
                ...(credential && { uri: getCredentialUri(credential.id, domain) }),
            };
        });

    // Get profile data for recipients (this should be a small set thanks to the limit)
    const recipientIds = [...new Set(resultsWithIds.map(result => result.to))];
    const recipients = await getProfilesByProfileIds(recipientIds);

    // Group by profile and aggregate boost URIs
    const profileMap = new Map<
        string,
        {
            to: any;
            from: string;
            received?: string;
            boostUris: string[];
            credentialUris: string[];
        }
    >();

    for (const result of resultsWithIds) {
        const profile = recipients.find(recipient => recipient.profileId === result.to);
        if (!profile) continue;

        const key = result.to;
        if (!profileMap.has(key)) {
            profileMap.set(key, {
                to: profile,
                from: result.from,
                received: result.received,
                boostUris: [],
                credentialUris: [],
            });
        }

        const entry = profileMap.get(key)!;
        entry.boostUris.push(result.boostUri);
        if (result.uri) {
            entry.credentialUris.push(result.uri);
        }
        // Keep the most recent received date
        if (result.received && (!entry.received || result.received > entry.received)) {
            entry.received = result.received;
        }
    }

    // Convert map to array and maintain profileId sorting
    return Array.from(profileMap.values()).sort((a, b) =>
        a.to.profileId.localeCompare(b.to.profileId)
    );
};

/**
 * Count distinct recipients of a boost and all its children boosts, with optional filters.
 */
export const countBoostRecipientsWithChildren = async (
    boost: BoostInstance,
    {
        includeUnacceptedBoosts = true,
        numberOfGenerations = 1,
        boostQuery = {},
        profileQuery = {},
    }: {
        includeUnacceptedBoosts?: boolean;
        numberOfGenerations?: number;
        boostQuery?: any;
        profileQuery?: LCNProfileQuery;
    }
): Promise<number> => {
    const boostQuery_neo4j = convertObjectRegExpToNeo4j(boostQuery);
    const profileQuery_neo4j = convertObjectRegExpToNeo4j(profileQuery);
    const { whereClause: countBoostWhereClause, params: countBoostQueryParams } = buildWhereForQueryBuilder('relevantBoost', boostQuery_neo4j as any);
    const { whereClause: countProfileWhereClause, params: countProfileQueryParams } = buildWhereForQueryBuilder('recipient', profileQuery_neo4j as any);

    const _query = new QueryBuilder(
        new BindParam({ ...countBoostQueryParams, ...countProfileQueryParams })
    )
        // Get parent boost and its children
        .match({ model: Boost, where: { id: boost.id }, identifier: 'parentBoost' })
        .match({
            optional: true,
            related: [
                { identifier: 'parentBoost' },
                { ...Boost.getRelationshipByAlias('parentOf'), maxHops: numberOfGenerations },
                { identifier: 'childBoost', model: Boost },
            ],
        })
        .with('COLLECT(DISTINCT parentBoost) + COLLECT(DISTINCT childBoost) AS allBoosts')
        .unwind('allBoosts AS relevantBoost')
        .match({ identifier: 'relevantBoost', model: Boost })
        .where(`relevantBoost IS NOT NULL AND ${countBoostWhereClause}`)
        // Get recipients for each boost
        .match({
            related: [
                { identifier: 'relevantBoost' },
                {
                    ...Credential.getRelationshipByAlias('instanceOf'),
                    identifier: 'instanceOf',
                    direction: 'in',
                },
                { identifier: 'credential', model: Credential },
                {
                    ...Profile.getRelationshipByAlias('credentialSent'),
                    identifier: 'sent',
                    direction: 'in',
                },
                { identifier: 'sender', model: Profile },
            ],
        })
        .match({ model: Profile, identifier: 'recipient' })
        .where('recipient.profileId = sent.to')
        // Optional match for received credentials
        .match({
            optional: includeUnacceptedBoosts,
            related: [
                { identifier: 'credential', model: Credential },
                {
                    ...Credential.getRelationshipByAlias('credentialReceived'),
                    identifier: 'received',
                },
                { identifier: 'recipient' },
            ],
        })
        // Reduce to recipient before applying filter to ensure it doesn't attach to OPTIONAL MATCH
        .with('recipient')
        // Apply profile query filtering after WITH so it filters rows, not optional pattern
        .where(countProfileWhereClause);

    const result = await _query.return('COUNT(DISTINCT recipient.profileId) AS count').run();

    return Number(result.records[0]?.get('count') ?? 0);
};

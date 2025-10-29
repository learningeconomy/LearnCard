import { neogma } from '@instance';
import { int } from 'neo4j-driver';
import { FlatSkillFrameworkType } from 'types/skill-framework';
import { SkillTreeNode } from 'types/skill-tree';
import type { BoostValidator as _BoostValidator, BoostQuery } from '@learncard/types';
import type { z } from 'zod';
import { getBoostUri } from '@helpers/boost.helpers';
import { buildWhereClause, convertObjectRegExpToNeo4j } from '@helpers/neo4j.helpers';

export const getSkillFrameworkById = async (id: string): Promise<FlatSkillFrameworkType | null> => {
    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $id}) RETURN f AS f`,
        { id }
    );

    const node = result.records[0]?.get('f') as { properties?: Record<string, any> } | undefined;
    const props = node?.properties;
    return (props as FlatSkillFrameworkType) ?? null;
};

export const listSkillFrameworksManagedByProfile = async (
    profileId: string
): Promise<FlatSkillFrameworkType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[:MANAGES]->(f:SkillFramework)
         RETURN f AS f`,
        { profileId }
    );

    return result.records
        .map(r => (r.get('f') as any)?.properties as FlatSkillFrameworkType)
        .filter(Boolean);
};

export const doesProfileManageFramework = async (
    profileId: string,
    frameworkId: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[:MANAGES]->(f:SkillFramework {id: $frameworkId})
         RETURN count(f) AS c`,
        { profileId, frameworkId }
    );

    const count = Number(result.records[0]?.get('c') ?? 0);
    return count > 0;
};

export type SkillNode = {
    id: string;
    statement: string;
    description?: string;
    code?: string;
    type: string;
    status: 'active' | 'archived';
    parentId?: string;
};

export type FrameworkWithSkills = {
    framework: FlatSkillFrameworkType;
    skills: SkillTreeNode[];
};

export const buildSkillTree = (skills: SkillNode[]): SkillTreeNode[] => {
    if (skills.length === 0) return [];

    const nodeMap = new Map<string, SkillTreeNode & { _parentId?: string | null }>();

    skills.forEach(skill => {
        const node: SkillTreeNode & { _parentId?: string | null } = {
            id: skill.id,
            statement: skill.statement,
            description: skill.description,
            code: skill.code,
            type: skill.type,
            status: skill.status,
            children: [],
            hasChildren: false,
            childrenCursor: null,
            _parentId: skill.parentId ?? null,
        };

        nodeMap.set(skill.id, node);
    });

    const roots: SkillTreeNode[] = [];

    nodeMap.forEach(node => {
        const parentIdentifier = node._parentId ?? undefined;

        if (parentIdentifier && nodeMap.has(parentIdentifier)) {
            const parent = nodeMap.get(parentIdentifier)!;
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    });

    nodeMap.forEach(node => {
        node.hasChildren = node.children.length > 0;
        node.childrenCursor = null;
        delete (node as any)._parentId;
    });

    return roots;
};

export const getFrameworkWithSkills = async (id: string): Promise<FrameworkWithSkills | null> => {
    const framework = await getSkillFrameworkById(id);
    if (!framework) return null;

    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $id})-[:CONTAINS]->(s:Skill)
         OPTIONAL MATCH (s)-[:IS_CHILD_OF]->(p:Skill)
         RETURN s AS s, p.id AS parentId`,
        { id }
    );

    const flatSkills: SkillNode[] = result.records.map(r => {
        const s = r.get('s') as any;
        const parentId = r.get('parentId');
        const props = s?.properties ?? {};
        return {
            id: props.id,
            statement: props.statement,
            description: props.description,
            code: props.code,
            type: props.type ?? 'skill',
            status: props.status === 'archived' || props.status === 'inactive' ? 'archived' : 'active',
            ...(parentId && { parentId }),
        } as SkillNode;
    });

    const skills = buildSkillTree(flatSkills);

    return { framework, skills };
};

/**
 * Get paginated boosts that use a specific skill framework via the USES_FRAMEWORK relationship.
 * Paginates first by relationship createdAt, then by boost createdAt, then by boost id.
 * Supports mongo-style query with $regex, $in, and $or operators.
 */
export const getBoostsThatUseFramework = async (
    frameworkId: string,
    { limit, cursor, query }: { limit: number; cursor?: string | null; query?: BoostQuery | null },
    domain: string
): Promise<{
    records: Array<z.infer<typeof _BoostValidator>>;
    hasMore: boolean;
    cursor?: string;
}> => {
    // Build WHERE clause from query if provided
    let queryWhereClause = 'true';
    let queryParams = {};
    
    if (query) {
        const convertedQuery = convertObjectRegExpToNeo4j(query);
        const { whereClause, params } = buildWhereClause('b', convertedQuery as any);
        queryWhereClause = whereClause;
        queryParams = params;
    }
    
    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})<-[r:USES_FRAMEWORK]-(b:Boost)
         WHERE ($cursor IS NULL OR 
               (coalesce(r.createdAt, '1970-01-01T00:00:00.000Z') > $cursorCreatedAt OR 
                (coalesce(r.createdAt, '1970-01-01T00:00:00.000Z') = $cursorCreatedAt AND (coalesce(b.createdAt, '1970-01-01T00:00:00.000Z') > $cursorBoostCreatedAt OR 
                 (coalesce(b.createdAt, '1970-01-01T00:00:00.000Z') = $cursorBoostCreatedAt AND b.id > $cursorId)))))
         AND (${queryWhereClause})
         WITH b, coalesce(r.createdAt, '1970-01-01T00:00:00.000Z') AS relCreatedAt, coalesce(b.createdAt, '1970-01-01T00:00:00.000Z') AS boostCreatedAt
         ORDER BY relCreatedAt, boostCreatedAt, b.id
         LIMIT $limitPlusOne
         RETURN b, relCreatedAt, boostCreatedAt`,
        {
            frameworkId,
            cursor: cursor ?? null,
            ...queryParams,
            cursorCreatedAt: cursor ? cursor.split('|')[0] : null,
            cursorBoostCreatedAt: cursor ? cursor.split('|')[1] : null,
            cursorId: cursor ? cursor.split('|')[2] : null,
            limitPlusOne: int(limit + 1),
        }
    );

    const all = result.records.map(r => {
        const props = ((r.get('b') as any)?.properties ?? {}) as Record<string, any>;
        // Convert from database format to API format using getBoostUri helper
        const uri = getBoostUri(props.id, domain);
        const { id, boost, ...rest } = props;
        return { uri, ...rest } as z.infer<typeof _BoostValidator>;
    });

    const hasMore = all.length > limit;
    const page = all.slice(0, limit);
    
    // Create composite cursor: relationshipCreatedAt|boostCreatedAt|boostId
    const nextCursor = hasMore && page.length > 0 ? (() => {
        const lastRecord = page[page.length - 1]!;
        const lastResultRecord = result.records[page.length - 1];
        const relCreatedAt = lastResultRecord?.get('relCreatedAt');
        const boostCreatedAt = lastResultRecord?.get('boostCreatedAt');
        const boostId = lastRecord.uri.split(':').pop();
        return `${relCreatedAt}|${boostCreatedAt}|${boostId}`;
    })() : undefined;

    return { records: page, hasMore, cursor: nextCursor };
};

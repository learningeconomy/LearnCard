import { neogma } from '@instance';
import { int } from 'neo4j-driver';
import { convertObjectRegExpToNeo4j, getMatchQueryWhere } from '@helpers/neo4j.helpers';
import type { FlatSkillType, SkillType } from 'types/skill';
import type { SkillQuery } from '@learncard/types';

export const doesProfileManageSkill = async (
    profileId: string,
    skillId: string
): Promise<boolean> => {
    const result = await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId})-[:MANAGES]->(:SkillFramework)-[:CONTAINS]->(s:Skill {id: $skillId})
         RETURN count(s) AS c`,
        { profileId, skillId }
    );

    const count = Number(result.records[0]?.get('c') ?? 0);

    return count > 0;
};

export const getFrameworkIdsForSkill = async (skillId: string): Promise<string[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework)-[:CONTAINS]->(s:Skill {id: $skillId})
         RETURN f.id AS id`,
        { skillId }
    );

    return result.records.map(r => String(r.get('id')));
};

export type Paginated<T> = {
    records: T[];
    hasMore: boolean;
    cursor: string | null;
};

// Returns framework-scoped root skills (no parent within the same framework), keyset-paginated by id
export const getFrameworkRootSkillsPaged = async (
    frameworkId: string,
    limit: number,
    cursorId?: string | null
): Promise<Paginated<FlatSkillType>> => {
    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill)
         WHERE NOT EXISTS {
             MATCH (f)-[:CONTAINS]->(:Skill)<-[:IS_CHILD_OF]-(s)
         }
         AND ($cursorId IS NULL OR s.id > $cursorId)
         RETURN s AS s
         ORDER BY s.id
         LIMIT $limitPlusOne`,
        { frameworkId, cursorId: cursorId ?? null, limitPlusOne: int(limit + 1) }
    );

    const all = result.records.map(r => {
        const props = ((r.get('s') as any)?.properties ?? {}) as Record<string, any>;
        return {
            ...props,
            type: props.type ?? 'skill',
        } as FlatSkillType;
    });

    const hasMore = all.length > limit;
    const page = all.slice(0, limit);
    const nextCursor = hasMore ? page[page.length - 1]!.id : null;

    return { records: page, hasMore, cursor: nextCursor };
};

// Returns children of a parent within a framework, keyset-paginated by child id
// Also marks each child with hasChildren boolean by checking existence of grandchildren within the same framework
export const getChildrenForSkillInFrameworkPaged = async (
    frameworkId: string,
    parentId: string,
    limit: number,
    cursorId?: string | null
): Promise<{
    records: (SkillType & { hasChildren: boolean })[];
    hasMore: boolean;
    cursor: string | null;
}> => {
    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})
         MATCH (f)-[:CONTAINS]->(parent:Skill {id: $parentId})
         MATCH (f)-[:CONTAINS]->(c:Skill)-[:IS_CHILD_OF]->(parent)
         WHERE ($cursorId IS NULL OR c.id > $cursorId)
         WITH f, c
         ORDER BY c.id
         LIMIT $limitPlusOne
         WITH f, collect(c) AS children
         UNWIND children[0..$limit] AS c
         OPTIONAL MATCH (f)-[:CONTAINS]->(:Skill)-[:IS_CHILD_OF]->(c)
         WITH c, COUNT(*) > 0 AS hasChildren, children
         RETURN c AS node, hasChildren, size(children) > $limit AS _hasMore,
                CASE WHEN size(children) > $limit THEN children[$limit - 1].id ELSE NULL END AS _cursor`,
        {
            frameworkId,
            parentId,
            cursorId: cursorId ?? null,
            limit: int(limit),
            limitPlusOne: int(limit + 1),
        }
    );

    const records = result.records.map(r => {
        const rawProps = ((r.get('node') as any)?.properties ?? {}) as Record<string, any>;
        const node = {
            ...rawProps,
            type: rawProps.type ?? 'skill',
        } as FlatSkillType;
        const hasChildren = Boolean(r.get('hasChildren'));
        return { ...node, hasChildren } as FlatSkillType & { hasChildren: boolean };
    });

    // If we returned any row, _hasMore and _cursor are the same across rows; if none, derive from count 0
    const first = result.records[0];
    const hasMore: boolean = first ? Boolean(first.get('_hasMore')) : false;
    const cursor: string | null = first ? (first.get('_cursor') as string | null) : null;

    return { records, hasMore, cursor };
};

/**
 * Search skills in a framework using mongo-style query with $regex and $in operators.
 * Returns a flattened, paginated list of skills.
 */
export const searchSkillsInFramework = async (
    frameworkId: string,
    searchQuery: SkillQuery,
    limit: number,
    cursorId?: string | null
): Promise<Paginated<FlatSkillType>> => {
    const matchQuery = convertObjectRegExpToNeo4j(searchQuery);
    const whereClause = getMatchQueryWhere('s');

    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill)
         WHERE ${whereClause}
         AND ($cursorId IS NULL OR s.id > $cursorId)
         RETURN s AS s
         ORDER BY s.id
         LIMIT $limitPlusOne`,
        {
            frameworkId,
            matchQuery,
            cursorId: cursorId ?? null,
            limitPlusOne: int(limit + 1),
        }
    );

    const all = result.records.map(r => {
        const props = ((r.get('s') as any)?.properties ?? {}) as Record<string, any>;
        return {
            ...props,
            type: props.type ?? 'skill',
        } as FlatSkillType;
    });

    const hasMore = all.length > limit;
    const page = all.slice(0, limit);
    const nextCursor = hasMore ? page[page.length - 1]!.id : null;

    return { records: page, hasMore, cursor: nextCursor };
};

/**
 * Get all skills for a given framework (unpaginated).
 * Used by the skills provider to fetch skill data.
 */
export const getSkillsByFramework = async (frameworkId: string): Promise<FlatSkillType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill)
         OPTIONAL MATCH (s)-[:IS_CHILD_OF]->(parent:Skill)
         RETURN s AS s, parent.id AS parentId
         ORDER BY s.id`,
        { frameworkId }
    );

    return result.records.map(r => {
        const props = ((r.get('s') as any)?.properties ?? {}) as Record<string, any>;
        const parentId = r.get('parentId') as string | null;
        return {
            ...props,
            type: props.type ?? 'skill',
            ...(parentId ? { parentId } : {}),
        } as FlatSkillType;
    });
};

/**
 * Count skills in a framework.
 * - If skillId is not provided, counts all skills in the framework.
 * - If skillId is provided and recursive is false, counts direct children only.
 * - If skillId is provided and recursive is true, counts all descendants recursively.
 */
export const countSkillsInFramework = async (
    frameworkId: string,
    skillId?: string,
    recursive: boolean = false
): Promise<number> => {
    if (!skillId) {
        // Count all skills in the framework
        const result = await neogma.queryRunner.run(
            `MATCH (:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill)
             RETURN count(s) AS count`,
            { frameworkId }
        );
        return Number(result.records[0]?.get('count') ?? 0);
    }

    if (recursive) {
        // Count all descendants recursively
        const result = await neogma.queryRunner.run(
            `MATCH (f:SkillFramework {id: $frameworkId})
             MATCH (f)-[:CONTAINS]->(parent:Skill {id: $skillId})
             MATCH (f)-[:CONTAINS]->(descendant:Skill)
             WHERE (descendant)-[:IS_CHILD_OF*1..]->(parent)
             RETURN count(descendant) AS count`,
            { frameworkId, skillId }
        );
        return Number(result.records[0]?.get('count') ?? 0);
    } else {
        // Count direct children only
        const result = await neogma.queryRunner.run(
            `MATCH (f:SkillFramework {id: $frameworkId})
             MATCH (f)-[:CONTAINS]->(parent:Skill {id: $skillId})
             MATCH (f)-[:CONTAINS]->(child:Skill)-[:IS_CHILD_OF]->(parent)
             RETURN count(child) AS count`,
            { frameworkId, skillId }
        );
        return Number(result.records[0]?.get('count') ?? 0);
    }
};

/**
 * Get skills by their IDs (unpaginated).
 * Used by the skills provider to fetch specific skills.
 */
export const getSkillsByIds = async (skillIds: string[]): Promise<FlatSkillType[]> => {
    if (skillIds.length === 0) return [];

    const result = await neogma.queryRunner.run(
        `MATCH (s:Skill)
         WHERE s.id IN $skillIds
         OPTIONAL MATCH (s)-[:IS_CHILD_OF]->(parent:Skill)
         RETURN s AS s, parent.id AS parentId
         ORDER BY s.id`,
        { skillIds }
    );

    return result.records.map(r => {
        const props = ((r.get('s') as any)?.properties ?? {}) as Record<string, any>;
        const parentId = r.get('parentId') as string | null;
        return {
            ...props,
            type: props.type ?? 'skill',
            ...(parentId ? { parentId } : {}),
        } as FlatSkillType;
    });
};

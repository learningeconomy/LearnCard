import { TRPCError } from '@trpc/server';

import { neogma } from '@instance';
import type { FlatSkillType } from 'types/skill';

export type UpdateSkillInput = Partial<
    Omit<FlatSkillType, 'id' | 'frameworkId' | 'createdAt' | 'updatedAt' | 'parentId'>
>;

const mapRecordToSkill = (record: any): FlatSkillType => {
    const node = record?.get('s');
    const rawProps = (node?.properties ?? {}) as Record<string, any>;
    const skill: FlatSkillType = {
        id: rawProps.id,
        statement: rawProps.statement,
        description: rawProps.description ?? undefined,
        code: rawProps.code ?? undefined,
        icon: rawProps.icon ?? undefined,
        type: rawProps.type ?? 'skill',
        status: rawProps.status ?? 'active',
        parentId: rawProps.parentId ?? undefined,
        frameworkId: rawProps.frameworkId ?? undefined,
        createdAt: rawProps.createdAt ?? undefined,
        updatedAt: rawProps.updatedAt ?? undefined,
    };

    const parentId = record?.get('parentId');
    if (parentId !== undefined && parentId !== null) {
        skill.parentId = parentId as string;
    } else if (skill.parentId === null) {
        skill.parentId = undefined;
    }

    return skill;
};

export const updateSkill = async (
    frameworkId: string,
    skillId: string,
    input: UpdateSkillInput
): Promise<FlatSkillType> => {
    const existingResult = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill {id: $skillId})
         RETURN s AS s`,
        { frameworkId, skillId }
    );

    if (existingResult.records.length === 0) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Skill not found in this framework',
        });
    }

    const updates: Record<string, any> = {};

    if (input.statement !== undefined) updates.statement = input.statement;
    if (input.description !== undefined) updates.description = input.description;
    if (input.code !== undefined) updates.code = input.code;
    if (input.icon !== undefined) updates.icon = input.icon;
    if (input.type !== undefined) updates.type = input.type;
    if (input.status !== undefined) updates.status = input.status;

    if (Object.keys(updates).length > 0) {
        const setClauses = Object.keys(updates)
            .map(key => `s.${key} = $${key}`)
            .join(', ');

        await neogma.queryRunner.run(
            `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill {id: $skillId})
             SET ${setClauses}`,
            { frameworkId, skillId, ...updates }
        );
    }

    const updatedResult = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill {id: $skillId})
         OPTIONAL MATCH (s)-[:IS_CHILD_OF]->(p:Skill)
         RETURN s AS s, p.id AS parentId`,
        { frameworkId, skillId }
    );

    return mapRecordToSkill(updatedResult.records[0]);
};

export const deleteSkill = async (
    frameworkId: string,
    skillId: string,
    strategy: 'recursive' | 'reparent' = 'reparent'
): Promise<{ success: boolean; deletedCount: number }> => {
    const matchResult = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill {id: $skillId})
         OPTIONAL MATCH (s)-[:IS_CHILD_OF]->(parent:Skill)
         RETURN s AS s, parent.id AS parentId`,
        { frameworkId, skillId }
    );

    if (matchResult.records.length === 0) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Skill not found in this framework',
        });
    }

    const parentId = matchResult.records[0]?.get('parentId') as string | null;

    if (strategy === 'recursive') {
        // Recursively delete the skill and all its descendants
        const deleteResult = await neogma.queryRunner.run(
            `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill {id: $skillId})
             OPTIONAL MATCH (s)<-[:IS_CHILD_OF*1..]-(descendant:Skill)
             WITH s, COLLECT(DISTINCT descendant) AS descendants
             WITH [s] + descendants AS nodesToDelete
             UNWIND nodesToDelete AS node
             DETACH DELETE node
             RETURN COUNT(node) AS deletedCount`,
            { frameworkId, skillId }
        );

        const deletedCount = deleteResult.records[0]?.get('deletedCount')?.toNumber() ?? 1;
        return { success: true, deletedCount };
    } else {
        // Reparent strategy: move children to the deleted skill's parent
        if (parentId) {
            // Skill has a parent - reparent children to grandparent within the same framework
            await neogma.queryRunner.run(
                `MATCH (f:SkillFramework {id: $frameworkId})
                 MATCH (f)-[:CONTAINS]->(s:Skill {id: $skillId})
                 MATCH (f)-[:CONTAINS]->(parent:Skill {id: $parentId})
                 MATCH (s)<-[oldRel:IS_CHILD_OF]-(child:Skill)
                 DELETE oldRel
                 CREATE (child)-[:IS_CHILD_OF]->(parent)`,
                { frameworkId, skillId, parentId }
            );
        } else {
            // Skill is a root node - make children root nodes by removing their parent relationships (framework-scoped)
            await neogma.queryRunner.run(
                `MATCH (f:SkillFramework {id: $frameworkId})
                 MATCH (f)-[:CONTAINS]->(s:Skill {id: $skillId})
                 MATCH (s)<-[rel:IS_CHILD_OF]-(child:Skill)
                 DELETE rel`,
                { frameworkId, skillId }
            );
        }

        // Now delete the skill itself
        await neogma.queryRunner.run(
            `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill {id: $skillId})
             DETACH DELETE s`,
            { frameworkId, skillId }
        );

        return { success: true, deletedCount: 1 };
    }
};

export const updateSkillEmbedding = async (
    skillId: string,
    embedding: number[],
    frameworkId?: string
): Promise<boolean> => {
    if (frameworkId) {
        const result = await neogma.queryRunner.run(
            `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill {id: $skillId})
             SET s.embedding = $embedding
             RETURN count(s) AS count`,
            { frameworkId, skillId, embedding }
        );

        return Number(result.records[0]?.get('count') ?? 0) > 0;
    }

    const result = await neogma.queryRunner.run(
        `MATCH (s:Skill {id: $skillId})
         SET s.embedding = $embedding
         RETURN count(s) AS count`,
        { skillId, embedding }
    );

    return Number(result.records[0]?.get('count') ?? 0) > 0;
};

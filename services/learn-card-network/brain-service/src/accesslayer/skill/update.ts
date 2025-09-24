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
    skillId: string
): Promise<{ success: boolean }> => {
    const matchResult = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill {id: $skillId})
         RETURN s AS s`,
        { frameworkId, skillId }
    );

    if (matchResult.records.length === 0) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Skill not found in this framework',
        });
    }

    await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill {id: $skillId})
         DETACH DELETE s`,
        { frameworkId, skillId }
    );

    return { success: true };
};

import { neogma } from '@instance';
import { Skill } from '@models';
import { FlatSkillType } from 'types/skill';
import { v4 as uuid } from 'uuid';

export type CreateSkillInput = Omit<
    FlatSkillType,
    'id' | 'status' | 'createdAt' | 'updatedAt'
> & { id?: string; status?: FlatSkillType['status'] };

export const createSkill = async (
    frameworkId: string,
    input: CreateSkillInput,
    parentId?: string
): Promise<FlatSkillType> => {
    const data: FlatSkillType = {
        id: input.id ?? uuid(),
        statement: input.statement,
        description: input.description,
        code: input.code,
        icon: input.icon,
        type: input.type ?? 'skill',
        status: input.status ?? 'active',
        frameworkId,
        ...(parentId ? { parentId } : {}),
    } as FlatSkillType;

    await Skill.createOne(data);

    await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId}), (s:Skill {id: $skillId})
         MERGE (f)-[:CONTAINS]->(s)`,
        { frameworkId, skillId: data.id }
    );

    if (parentId) {
        const parentCheck = await neogma.queryRunner.run(
            `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(p:Skill {id: $parentId})
             RETURN p.id AS id`,
            { frameworkId, parentId }
        );

        if (parentCheck.records.length === 0) {
            throw new Error('Parent skill not found in this framework');
        }

        await neogma.queryRunner.run(
            `MATCH (s:Skill {id: $skillId}), (p:Skill {id: $parentId})
             MERGE (s)-[:IS_CHILD_OF]->(p)`,
            { skillId: data.id, parentId }
        );
    }

    return data;
};

export type CreateSkillBatchItem = {
    input: CreateSkillInput;
    parentId?: string;
};

export const createSkillsBatch = async (
    frameworkId: string,
    items: CreateSkillBatchItem[]
): Promise<FlatSkillType[]> => {
    if (items.length === 0) return [];

    const created: FlatSkillType[] = [];

    for (const { input, parentId } of items) {
        const skill = await createSkill(frameworkId, input, parentId);
        created.push(skill);
    }

    return created;
};

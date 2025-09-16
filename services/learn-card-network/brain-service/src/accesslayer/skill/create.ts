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
        type: input.type ?? 'skill',
        status: input.status ?? 'active',
    } as FlatSkillType;

    await Skill.createOne(data);

    await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId}), (s:Skill {id: $skillId})
         MERGE (f)-[:CONTAINS]->(s)`,
        { frameworkId, skillId: data.id }
    );

    if (parentId) {
        await neogma.queryRunner.run(
            `MATCH (s:Skill {id: $skillId}), (p:Skill {id: $parentId})
             MERGE (s)-[:IS_CHILD_OF]->(p)`,
            { skillId: data.id, parentId }
        );
    }

    return data;
};

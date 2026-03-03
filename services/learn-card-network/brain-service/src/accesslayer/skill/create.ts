import { neogma } from '@instance';
import { Skill } from '@models';
import { FlatSkillType } from 'types/skill';
import { v4 as uuid } from 'uuid';
import { doesSkillExistInFramework } from './read';

export type CreateSkillInput = Omit<FlatSkillType, 'id' | 'status' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    status?: FlatSkillType['status'];
};

export const createSkill = async (
    frameworkId: string,
    input: CreateSkillInput,
    parentId?: string
): Promise<FlatSkillType> => {
    const skillId = input.id ?? uuid();

    // Check for duplicate skill ID within this framework
    const exists = await doesSkillExistInFramework(frameworkId, skillId);
    if (exists) {
        throw new Error(`Skill with ID "${skillId}" already exists in framework "${frameworkId}"`);
    }

    const data: FlatSkillType = {
        id: skillId,
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
        `MATCH (f:SkillFramework {id: $frameworkId}), (s:Skill {id: $skillId, frameworkId: $frameworkId})
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
            `MATCH (f:SkillFramework {id: $frameworkId})
             MATCH (f)-[:CONTAINS]->(s:Skill {id: $skillId})
             MATCH (f)-[:CONTAINS]->(p:Skill {id: $parentId})
             MERGE (s)-[:IS_CHILD_OF]->(p)`,
            { frameworkId, skillId: data.id, parentId }
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

    // Collect all skill IDs (generate UUIDs for those without IDs)
    const skillIds = items.map(item => item.input.id ?? uuid());

    // Check for duplicates within the batch itself
    const duplicatesWithinBatch = skillIds.filter((id, index) => skillIds.indexOf(id) !== index);
    if (duplicatesWithinBatch.length > 0) {
        throw new Error(`Duplicate skill IDs within batch: ${duplicatesWithinBatch.join(', ')}`);
    }

    // Check for duplicates against existing skills in the framework
    const existenceChecks = await Promise.all(
        skillIds.map(id => doesSkillExistInFramework(frameworkId, id))
    );

    const existingIds = skillIds.filter((_, index) => existenceChecks[index]);
    if (existingIds.length > 0) {
        throw new Error(
            `Skills with IDs already exist in framework "${frameworkId}": ${existingIds.join(', ')}`
        );
    }

    const created: FlatSkillType[] = [];

    for (let i = 0; i < items.length; i++) {
        const { input, parentId } = items[i]!;
        // Use the pre-generated ID
        const inputWithId = { ...input, id: skillIds[i] };
        const skill = await createSkill(frameworkId, inputWithId, parentId);
        created.push(skill);
    }

    return created;
};

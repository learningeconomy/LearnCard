import { TRPCError } from '@trpc/server';

import { neogma } from '@instance';
import type { FlatSkillFrameworkType } from 'types/skill-framework';
import { doesProfileManageFramework, getSkillFrameworkById } from './read';

export type UpdateSkillFrameworkInput = Partial<
    Omit<FlatSkillFrameworkType, 'id' | 'createdAt' | 'updatedAt'>
>;

export const updateSkillFramework = async (
    actorProfileId: string,
    frameworkId: string,
    input: UpdateSkillFrameworkInput
): Promise<FlatSkillFrameworkType> => {
    const existing = await getSkillFrameworkById(frameworkId);
    if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Framework not found' });
    }

    const manages = await doesProfileManageFramework(actorProfileId, frameworkId);
    if (!manages) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You do not manage this framework',
        });
    }

    const updates: Record<string, any> = {};

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.sourceURI !== undefined) updates.sourceURI = input.sourceURI;
    if (input.status !== undefined) updates.status = input.status;

    if (Object.keys(updates).length === 0) {
        return existing;
    }

    const setClauses = Object.keys(updates)
        .map(key => `f.${key} = $${key}`)
        .join(', ');

    await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})
         SET ${setClauses}`,
        { frameworkId, ...updates }
    );

    const updated = await getSkillFrameworkById(frameworkId);
    return updated ?? existing;
};

export const deleteSkillFramework = async (
    actorProfileId: string,
    frameworkId: string
): Promise<{ success: boolean }> => {
    const existing = await getSkillFrameworkById(frameworkId);
    if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Framework not found' });
    }

    const manages = await doesProfileManageFramework(actorProfileId, frameworkId);
    if (!manages) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You do not manage this framework',
        });
    }

    await neogma.queryRunner.run(
        `MATCH (f:SkillFramework {id: $frameworkId})
         OPTIONAL MATCH (f)-[:CONTAINS]->(s:Skill)
         DETACH DELETE f, s`,
        { frameworkId }
    );

    return { success: true };
};

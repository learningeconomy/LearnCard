import { neogma } from '@instance';
import { SkillFramework } from '@models';
import { FlatSkillFrameworkType } from 'types/skill-framework';
import { v4 as uuid } from 'uuid';
import type { Framework as ProviderFramework } from '@services/skills-provider/types';

export type CreateSkillFrameworkInput = Omit<
    FlatSkillFrameworkType,
    'id' | 'status' | 'createdAt' | 'updatedAt'
> & { id?: string; status?: FlatSkillFrameworkType['status'] };

export const createSkillFramework = async (
    actorProfileId: string,
    input: CreateSkillFrameworkInput
): Promise<FlatSkillFrameworkType> => {
    const data: FlatSkillFrameworkType = {
        id: input.id ?? uuid(),
        name: input.name,
        description: input.description,
        sourceURI: input.sourceURI,
        status: input.status ?? 'active',
    } as FlatSkillFrameworkType;

    await SkillFramework.createOne(data);

    // Set manager
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId}), (f:SkillFramework {id: $id})
         MERGE (p)-[:MANAGES]->(f)`,
        { profileId: actorProfileId, id: data.id }
    );

    return data;
};

// Upsert a SkillFramework node from provider metadata and link it to the actor profile
// Does NOT create anything on the provider; only mirrors minimal fields locally and sets MANAGES
export const upsertSkillFrameworkFromProvider = async (
    actorProfileId: string,
    framework: ProviderFramework
): Promise<FlatSkillFrameworkType> => {
    const data: FlatSkillFrameworkType = {
        id: framework.id,
        name: framework.name,
        description: framework.description,
        sourceURI: framework.sourceURI,
        status: 'active',
    } as FlatSkillFrameworkType;

    // Merge local representation
    await neogma.queryRunner.run(
        `MERGE (f:SkillFramework {id: $id})
         ON CREATE SET f.name = $name, f.description = $description, f.sourceURI = $sourceURI, f.status = $status
         ON MATCH SET  f.name = $name, f.description = $description, f.sourceURI = $sourceURI`,
        data as any
    );

    // Ensure MANAGES relationship
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $profileId}), (f:SkillFramework {id: $id})
         MERGE (p)-[:MANAGES]->(f)`,
        { profileId: actorProfileId, id: data.id }
    );

    return data;
};

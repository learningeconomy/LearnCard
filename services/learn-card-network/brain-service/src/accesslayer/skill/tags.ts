import { neogma } from '@instance';
import { createTagIfNotExists } from '@accesslayer/tag/create';
import { FlatTagType } from 'types/tag';

export const listTagsForSkill = async (skillId: string): Promise<FlatTagType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (:Skill { id: $skillId })-[:HAS_TAG]->(t:Tag)
         RETURN t AS t`,
        { skillId }
    );

    return result.records.map(r => (r.get('t') as any)?.properties as FlatTagType).filter(Boolean);
};

export const addTagToSkill = async (
    skillId: string,
    { slug, name }: { slug: string; name: string }
): Promise<FlatTagType> => {
    const tag = await createTagIfNotExists({ slug, name });

    await neogma.queryRunner.run(
        `MATCH (s:Skill { id: $skillId }), (t:Tag { slug: $slug })
         MERGE (s)-[:HAS_TAG]->(t)`,
        { skillId, slug }
    );

    return tag;
};

export const removeTagFromSkill = async (
    skillId: string,
    slug: string
): Promise<{ success: boolean }> => {
    await neogma.queryRunner.run(
        `MATCH (:Skill { id: $skillId })-[r:HAS_TAG]->(:Tag { slug: $slug })
         DELETE r`,
        { skillId, slug }
    );

    return { success: true };
};

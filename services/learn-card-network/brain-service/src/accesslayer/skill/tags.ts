import { neogma } from '@instance';
import { createTagIfNotExists } from '@accesslayer/tag/create';
import { FlatTagType } from 'types/tag';

export const listTagsForSkill = async (
    frameworkId: string,
    skillId: string
): Promise<FlatTagType[]> => {
    const result = await neogma.queryRunner.run(
        `MATCH (f:SkillFramework { id: $frameworkId })-[:CONTAINS]->(s:Skill { id: $skillId })
         MATCH (s)-[:HAS_TAG]->(t:Tag)
         RETURN t AS t`,
        { frameworkId, skillId }
    );

    return result.records.map(r => (r.get('t') as any)?.properties as FlatTagType).filter(Boolean);
};

export const addTagToSkill = async (
    frameworkId: string,
    skillId: string,
    { slug, name }: { slug: string; name: string }
): Promise<FlatTagType> => {
    const tag = await createTagIfNotExists({ slug, name });

    await neogma.queryRunner.run(
        `MATCH (f:SkillFramework { id: $frameworkId })-[:CONTAINS]->(s:Skill { id: $skillId })
         MATCH (t:Tag { slug: $slug })
         MERGE (s)-[:HAS_TAG]->(t)`,
        { frameworkId, skillId, slug }
    );

    return tag;
};

export const removeTagFromSkill = async (
    frameworkId: string,
    skillId: string,
    slug: string
): Promise<{ success: boolean }> => {
    await neogma.queryRunner.run(
        `MATCH (f:SkillFramework { id: $frameworkId })-[:CONTAINS]->(s:Skill { id: $skillId })
         MATCH (s)-[r:HAS_TAG]->(:Tag { slug: $slug })
         DELETE r`,
        { frameworkId, skillId, slug }
    );

    return { success: true };
};

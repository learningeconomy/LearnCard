import { neogma } from '@instance';
import type { Skill as ProviderSkill } from '@services/skills-provider/types';
import type { FlatSkillType } from 'types/skill';

/**
 * Upsert a batch of provider skills into the local graph and connect them to the framework.
 *
 * - Merges Skill nodes by id, updating minimal fields
 * - Ensures (framework)-[:CONTAINS]->(skill)
 * - Ensures (child)-[:IS_CHILD_OF]->(parent) when parentId present
 */
export const upsertSkillsIntoFramework = async (
    frameworkId: string,
    skills: ProviderSkill[]
): Promise<FlatSkillType[]> => {
    if (skills.length === 0) return [];

    const skillParams = skills.map(s => ({
        id: s.id,
        statement: s.statement,
        description: s.description ?? null,
        code: s.code ?? null,
        type: s.type ?? 'skill',
        status: s.status ?? 'active',
        parentId: s.parentId ?? null,
    }));

    // 0) Pre-check: ensure no skill is already contained by a different framework
    const conflictCheck = await neogma.queryRunner.run(
        `UNWIND $skills AS sk
         MATCH (s:Skill { id: sk.id })<-[:CONTAINS]-(otherF:SkillFramework)
         WHERE otherF.id <> $frameworkId
         RETURN collect(DISTINCT sk.id) AS conflicts`,
        { frameworkId, skills: skillParams }
    );

    const conflicts: string[] = (conflictCheck.records[0]?.get('conflicts') as string[]) || [];
    if (conflicts.length > 0) {
        throw new Error(
            `Cannot upsert skills because some are already assigned to another framework: ${conflicts.join(
                ', '
            )}`
        );
    }

    // 1) Merge/Update Skill nodes (recording frameworkId) and connect to this framework
    await neogma.queryRunner.run(
        `UNWIND $skills AS sk
         MERGE (s:Skill { id: sk.id })
         ON CREATE SET s.statement = sk.statement,
                       s.description = sk.description,
                       s.code = sk.code,
                       s.type = sk.type,
                       s.status = sk.status,
                       s.frameworkId = $frameworkId
         ON MATCH SET  s.statement = sk.statement,
                       s.description = sk.description,
                       s.code = sk.code,
                       s.type = sk.type,
                       s.status = sk.status,
                       s.frameworkId = CASE WHEN s.frameworkId IS NULL OR s.frameworkId = $frameworkId THEN $frameworkId ELSE s.frameworkId END
         WITH s
         MATCH (f:SkillFramework { id: $frameworkId })
         MERGE (f)-[:CONTAINS]->(s)`,
        { frameworkId, skills: skillParams }
    );

    // 2) Create parent relationships scoped to the same framework
    await neogma.queryRunner.run(
        `UNWIND $skills AS sk
         WITH sk WHERE sk.parentId IS NOT NULL
         MATCH (f:SkillFramework { id: $frameworkId })
         MATCH (child:Skill { id: sk.id, frameworkId: $frameworkId })<-[:CONTAINS]-(f)
         MATCH (parent:Skill { id: sk.parentId, frameworkId: $frameworkId })<-[:CONTAINS]-(f)
         MERGE (child)-[:IS_CHILD_OF]->(parent)`,
        { frameworkId, skills: skillParams }
    );

    // Return local snapshot of the skills for the framework
    const result = await neogma.queryRunner.run(
        `MATCH (:SkillFramework { id: $frameworkId })-[:CONTAINS]->(s:Skill)
         RETURN s AS s`,
        { frameworkId }
    );

    return result.records.map(r => {
        const props = ((r.get('s') as any)?.properties ?? {}) as Record<string, any>;
        return {
            ...props,
            type: props.type ?? 'skill',
        } as FlatSkillType;
    });
};

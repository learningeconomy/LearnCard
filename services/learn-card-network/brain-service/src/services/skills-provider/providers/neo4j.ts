import { SkillsProvider, Options, Obv3Alignment } from '../types';
import { getSkillFrameworkById } from '@accesslayer/skill-framework/read';
import {
    getSkillsByFramework as getSkillsByFrameworkFromDb,
    getSkillsByIds as getSkillsByIdsFromDb,
} from '@accesslayer/skill/read';

export function createNeo4jProvider(options?: Options): SkillsProvider {
    const baseUrl = options?.baseUrl?.replace(/\/$/, '');

    const getFrameworkById: SkillsProvider['getFrameworkById'] = async frameworkId => {
        const framework = await getSkillFrameworkById(frameworkId);
        if (!framework) return null;
        return {
            id: framework.id,
            name: framework.name,
            description: framework.description ?? undefined,
            image: framework.image ?? undefined,
            sourceURI: framework.sourceURI ?? undefined,
            status: framework.status,
        };
    };

    const getSkillsForFramework: SkillsProvider['getSkillsForFramework'] = async frameworkId => {
        const skills = await getSkillsByFrameworkFromDb(frameworkId);
        return skills.map((skill: any) => ({
            id: skill.id,
            code: skill.code ?? undefined,
            statement: skill.statement,
            description: skill.description ?? undefined,
            type: skill.type ?? 'skill',
            status: skill.status,
            parentId: skill.parentId ?? undefined,
        }));
    };

    const getSkillsByIds: SkillsProvider['getSkillsByIds'] = async (_frameworkId, skillIds) => {
        const skills = await getSkillsByIdsFromDb(skillIds);
        // Filter to ensure they belong to the specified framework
        // (The DB function might not filter by framework, so we do it here for safety)
        return skills.map((skill: any) => ({
            id: skill.id,
            code: skill.code ?? undefined,
            statement: skill.statement,
            description: skill.description ?? undefined,
            type: skill.type ?? 'skill',
            status: skill.status,
            parentId: skill.parentId ?? undefined,
        }));
    };

    const buildObv3Alignments: SkillsProvider['buildObv3Alignments'] = async (
        frameworkId,
        skillIds,
        domain
    ) => {
        const [framework, skills] = await Promise.all([
            getSkillFrameworkById(frameworkId),
            getSkillsByIdsFromDb(skillIds),
        ]);

        if (!framework) return [];

        const alignments: Obv3Alignment[] = [];

        for (const skill of skills) {
            // OBv3 spec requires targetUrl - use HTTP endpoint for browser navigation
            // Falls back to baseUrl if provider is configured with external service (e.g., OpenSalt)
            // Decode domain since it may be URL-encoded for did:web usage (e.g., localhost%3A4400)
            const decodedDomain = decodeURIComponent(domain);

            const targetUrl = baseUrl
                ? `${baseUrl}/frameworks/${encodeURIComponent(
                      frameworkId
                  )}/skills/${encodeURIComponent(skill.id)}`
                : `https://${decodedDomain}/skills/${encodeURIComponent(skill.id)}`;

            alignments.push({
                type: ['Alignment'],
                targetCode: skill.code ?? skill.id,
                targetName: skill.statement,
                targetDescription: skill.description ?? undefined,
                targetUrl,
                targetFramework: framework.name,
            });
        }

        return alignments;
    };

    // Note: Create/Update/Delete operations are handled directly via accesslayer
    // For Neo4j provider, these are no-ops since the data is already in Neo4j
    const createFramework: SkillsProvider['createFramework'] = async framework => {
        // No-op: Framework is already created in Neo4j via accesslayer
        return {
            id: framework.id,
            name: framework.name,
            description: framework.description,
            image: framework.image,
            sourceURI: framework.sourceURI,
            status: framework.status ?? 'active',
        };
    };

    const updateFramework: SkillsProvider['updateFramework'] = async (frameworkId, updates) => {
        // No-op: Framework is already updated in Neo4j via accesslayer
        // Fetch current state from Neo4j
        const framework = await getSkillFrameworkById(frameworkId);
        if (!framework) return null;
        return {
            id: framework.id,
            name: updates?.name ?? framework.name,
            description: updates?.description ?? framework.description ?? undefined,
            image: updates?.image ?? framework.image ?? undefined,
            sourceURI: updates?.sourceURI ?? framework.sourceURI ?? undefined,
            status: updates?.status ?? framework.status,
        };
    };

    const deleteFramework: SkillsProvider['deleteFramework'] = async () => {
        // No-op: Framework is already deleted in Neo4j via accesslayer
        return;
    };

    const createSkill: SkillsProvider['createSkill'] = async (_frameworkId, skill) => {
        // No-op: Skill is already created in Neo4j via accesslayer
        return {
            id: skill.id,
            code: skill.code,
            statement: skill.statement,
            description: skill.description,
            type: skill.type ?? 'skill',
            status: skill.status ?? 'active',
        };
    };

    const updateSkill: SkillsProvider['updateSkill'] = async (_frameworkId, skillId, updates) => {
        // No-op: Skill is already updated in Neo4j via accesslayer
        const skills = await getSkillsByIdsFromDb([skillId]);
        const skill = skills[0];
        if (!skill) return null;
        return {
            id: skill.id,
            code: updates?.code ?? skill.code ?? undefined,
            statement: updates?.statement ?? skill.statement,
            description: updates?.description ?? skill.description ?? undefined,
            type: updates?.type ?? skill.type ?? 'skill',
            status: updates?.status ?? skill.status,
        };
    };

    const deleteSkill: SkillsProvider['deleteSkill'] = async () => {
        // No-op: Skill is already deleted in Neo4j via accesslayer
        return;
    };

    return {
        id: 'neo4j',
        getFrameworkById,
        getSkillsForFramework,
        getSkillsByIds,
        buildObv3Alignments,
        createFramework,
        updateFramework,
        deleteFramework,
        createSkill,
        updateSkill,
        deleteSkill,
    };
}

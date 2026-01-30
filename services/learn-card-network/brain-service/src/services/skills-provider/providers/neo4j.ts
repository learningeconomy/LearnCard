import { neogma } from '@instance';
import { SkillsProvider, Options, Obv3Alignment } from '../types';
import { getSkillFrameworkById } from '@accesslayer/skill-framework/read';
import {
    getSkillsByFramework as getSkillsByFrameworkFromDb,
    getSkillsByIdsForFramework as getSkillsByIdsFromDb,
} from '@accesslayer/skill/read';

export function createNeo4jProvider(options?: Options): SkillsProvider {
    const baseUrl = options?.baseUrl?.replace(/\/$/, '');

    // const embeddingsBaseUrl = options?.embeddingsBaseUrl?.replace(/\/$/, '');
    const embeddingsApiKey = options?.embeddingsApiKey;
    const embeddingsVectorIndexName = 'TEST_VECTOR_INDEX';
    const embeddingsTopK = options?.embeddingsTopK;

    const getQueryEmbedding = async (query: string): Promise<number[] | null> => {
        if (!embeddingsBaseUrl) return null;

        const res = await fetch(`${embeddingsBaseUrl}/embed`, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                ...(embeddingsApiKey ? { 'x-api-key': embeddingsApiKey } : {}),
                ...(embeddingsApiKey ? { authorization: `Bearer ${embeddingsApiKey}` } : {}),
            },
            body: JSON.stringify({ texts: [query] }),
        });

        if (!res.ok) return null;

        const json = (await res.json()) as any;
        const embedding = json?.embeddings?.[0];

        if (!Array.isArray(embedding)) return null;
        if (embedding.length === 0) return null;
        if (embedding.some((n: any) => typeof n !== 'number')) return null;

        return embedding as number[];
    };

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
            icon: skill.icon ?? undefined,
            type: skill.type ?? 'skill',
            status: skill.status,
            parentId: skill.parentId ?? undefined,
        }));
    };

    const getSkillsByIds: SkillsProvider['getSkillsByIds'] = async (frameworkId, skillIds) => {
        const skills = await getSkillsByIdsFromDb(frameworkId, skillIds);
        return skills.map((skill: any) => ({
            id: skill.id,
            code: skill.code ?? undefined,
            statement: skill.statement,
            description: skill.description ?? undefined,
            icon: skill.icon ?? undefined,
            type: skill.type ?? 'skill',
            status: skill.status,
            parentId: skill.parentId ?? undefined,
        }));
    };

    const searchSkills: SkillsProvider['searchSkills'] = async (frameworkId, query) => {
        const normalizedQuery = query.trim();
        if (!normalizedQuery) return [];

        const topKRaw = embeddingsTopK ?? 25;
        const topK = Number.isFinite(topKRaw) ? Math.max(0, Math.floor(topKRaw)) : 25;

        if (embeddingsBaseUrl && embeddingsVectorIndexName) {
            try {
                const embedding = await getQueryEmbedding(normalizedQuery);
                if (embedding) {
                    const result = await neogma.queryRunner.run(
                        `CALL db.index.vector.queryNodes($indexName, toInteger($k), $embedding)
                         YIELD node, score
                         WITH node, score
                         WHERE node:Skill AND node.frameworkId = $frameworkId
                         RETURN node AS s
                         ORDER BY score DESC
                         LIMIT toInteger($k)`,
                        {
                            indexName: embeddingsVectorIndexName,
                            k: topK,
                            embedding,
                            frameworkId,
                        }
                    );

                    return result.records.map(r => {
                        const props = ((r.get('s') as any)?.properties ?? {}) as Record<
                            string,
                            any
                        >;
                        return {
                            id: props.id,
                            statement: props.statement,
                            description: props.description ?? undefined,
                            code: props.code ?? undefined,
                            icon: props.icon ?? undefined,
                            type: props.type ?? 'skill',
                            status: props.status ?? undefined,
                            parentId: props.parentId ?? undefined,
                        };
                    });
                }
            } catch {
                // Fall through to string search
            }
        }

        const fallback = await neogma.queryRunner.run(
            `MATCH (:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill)
             WHERE toLower(s.statement) CONTAINS toLower($query)
                OR toLower(coalesce(s.description, '')) CONTAINS toLower($query)
             RETURN s AS s
             ORDER BY s.statement
             LIMIT toInteger($limit)`,
            { frameworkId, query: normalizedQuery, limit: topK }
        );

        return fallback.records.map(r => {
            const props = ((r.get('s') as any)?.properties ?? {}) as Record<string, any>;
            return {
                id: props.id,
                statement: props.statement,
                description: props.description ?? undefined,
                code: props.code ?? undefined,
                icon: props.icon ?? undefined,
                type: props.type ?? 'skill',
                status: props.status ?? undefined,
                parentId: props.parentId ?? undefined,
            };
        });
    };

    const buildObv3Alignments: SkillsProvider['buildObv3Alignments'] = async (
        frameworkId,
        skillIds,
        domain
    ) => {
        const [framework, skills] = await Promise.all([
            getSkillFrameworkById(frameworkId),
            getSkillsByIdsFromDb(frameworkId, skillIds),
        ]);

        if (!framework) return [];
        if (!skills || skills.length === 0) return [];

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
                : `https://${decodedDomain}/frameworks/${encodeURIComponent(
                      frameworkId
                  )}/skills/${encodeURIComponent(skill.id)}`;

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
            icon: skill.icon,
            type: skill.type ?? 'skill',
            status: skill.status ?? 'active',
        };
    };

    const updateSkill: SkillsProvider['updateSkill'] = async (_frameworkId, skillId, updates) => {
        // No-op: Skill is already updated in Neo4j via accesslayer
        const skills = await getSkillsByIdsFromDb(_frameworkId, [skillId]);
        const skill = skills[0];
        if (!skill) return null;
        return {
            id: skill.id,
            code: updates?.code ?? skill.code ?? undefined,
            statement: updates?.statement ?? skill.statement,
            description: updates?.description ?? skill.description ?? undefined,
            icon: updates?.icon ?? skill.icon ?? undefined,
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
        searchSkills,
        buildObv3Alignments,
        createFramework,
        updateFramework,
        deleteFramework,
        createSkill,
        updateSkill,
        deleteSkill,
    };
}

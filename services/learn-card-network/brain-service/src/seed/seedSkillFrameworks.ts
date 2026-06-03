import {
    type SeedSkillFrameworkFixture,
    DEFAULT_SKILL_FRAMEWORKS,
    type SeedSkillNode,
} from './skill-frameworks.fixtures';
import {
    upsertSkillEmbeddings,
    type UpdateSkillEmbeddingFn,
} from '@helpers/skill-embedding.helpers';

type QueryRunnerLike = {
    run: (
        query: string,
        params?: Record<string, unknown>
    ) => Promise<{ records: Array<{ get: (key: string) => unknown }> }>;
};

type SeedLogger = {
    log: (...args: any[]) => void;
    warn?: (...args: any[]) => void;
};

type SeedSkillFrameworksOptions = {
    ownerProfileId?: string;
    adminProfileIds?: string[];
    force?: boolean;
    log?: SeedLogger;
};

const DEFAULT_OWNER_PROFILE_ID = 'network-seed';
const DEFAULT_OWNER_DISPLAY_NAME = 'Network Seed';
const DEFAULT_OWNER_SHORT_BIO = 'System profile for seeded skill frameworks';

const toBoolean = (value: string | undefined): boolean => {
    if (!value) return false;

    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const unique = (values: string[]): string[] =>
    Array.from(new Set(values.map(value => value.trim()).filter(Boolean)));

const buildSeedSkillEmbeddingUpdater = (run: QueryRunnerLike['run']): UpdateSkillEmbeddingFn => {
    return async (skillId, embedding, frameworkId) => {
        if (frameworkId) {
            const result = await run(
                `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill {id: $skillId})
                 SET s.embedding = $embedding
                 RETURN count(s) AS count`,
                { frameworkId, skillId, embedding }
            );

            return Number(result.records[0]?.get('count') ?? 0) > 0;
        }

        const result = await run(
            `MATCH (s:Skill {id: $skillId})
             SET s.embedding = $embedding
             RETURN count(s) AS count`,
            { skillId, embedding }
        );

        return Number(result.records[0]?.get('count') ?? 0) > 0;
    };
};

const getSeedSkillsMissingEmbedding = async (
    run: QueryRunnerLike['run'],
    frameworkId: string
): Promise<
    Array<{
        id: string;
        frameworkId: string;
        statement: string;
        description?: string;
        code?: string;
    }>
> => {
    const result = await run(
        `MATCH (f:SkillFramework {id: $frameworkId})-[:CONTAINS]->(s:Skill)
         WHERE s.embedding IS NULL
         OPTIONAL MATCH (s)-[:IS_CHILD_OF]->(parent:Skill)
         RETURN s AS s, parent.id AS parentId
         ORDER BY s.id`,
        { frameworkId }
    );

    return result.records.map(record => {
        const node = record.get('s') as { properties?: Record<string, unknown> } | undefined;
        const props = (node?.properties ?? {}) as Record<string, unknown>;

        return {
            id: String(props.id ?? ''),
            frameworkId,
            statement: String(props.statement ?? ''),
            description: props.description as string | undefined,
            code: props.code as string | undefined,
        };
    });
};

const describeEmbeddingBackfillFailure = (error: unknown): string => {
    const message = error instanceof Error ? error.message : String(error);
    const normalized = message.toLowerCase();

    if (normalized.includes('quota exceeded') || normalized.includes('resource_exhausted')) {
        return 'Embedding quota was reached. The frameworks were seeded, but semantic search will stay limited until the Google embedding quota resets or you switch to a paid key.';
    }

    if (normalized.includes('rate limits') || normalized.includes('too many requests')) {
        return 'Google embedding requests were rate-limited. The frameworks were seeded, but some semantic search embeddings were skipped for now.';
    }

    return message;
};

const normalizeProfileId = (profileId: string): string =>
    profileId.toLowerCase().replace(':', '%3A');

const upsertSkillNode = async (
    run: QueryRunnerLike['run'],
    framework: SeedSkillFrameworkFixture,
    node: SeedSkillNode,
    parentId?: string
): Promise<void> => {
    const now = new Date().toISOString();

    await run(
        `MERGE (s:Skill {id: $id, frameworkId: $frameworkId})
         ON CREATE SET s.statement = $statement,
                       s.description = $description,
                       s.code = $code,
                       s.icon = $icon,
                       s.type = $type,
                       s.status = $status,
                       s.createdAt = $createdAt,
                       s.updatedAt = $updatedAt,
                       s.parentId = $parentId
         ON MATCH SET  s.statement = $statement,
                       s.description = $description,
                       s.code = $code,
                       s.icon = $icon,
                       s.type = $type,
                       s.status = $status,
                       s.updatedAt = $updatedAt,
                       s.parentId = $parentId
         WITH s
         MATCH (f:SkillFramework {id: $frameworkId})
         MERGE (f)-[:CONTAINS]->(s)`,
        {
            frameworkId: framework.id,
            id: node.id,
            statement: node.statement,
            description: node.description ?? null,
            code: node.code ?? null,
            icon: node.icon ?? null,
            type: node.type ?? 'skill',
            status: node.status ?? 'active',
            parentId: parentId ?? null,
            createdAt: now,
            updatedAt: now,
        }
    );

    if (parentId) {
        await run(
            `MATCH (s:Skill {id: $id, frameworkId: $frameworkId})
             MATCH (p:Skill {id: $parentId, frameworkId: $frameworkId})
             MERGE (s)-[:IS_CHILD_OF]->(p)`,
            {
                frameworkId: framework.id,
                id: node.id,
                parentId,
            }
        );
    }

    if (node.children?.length) {
        for (const child of node.children) {
            await upsertSkillNode(run, framework, child, node.id);
        }
    }
};

export const countSkillFrameworks = async (run: QueryRunnerLike['run']): Promise<number> => {
    const result = await run(`MATCH (f:SkillFramework) RETURN count(f) AS c LIMIT 1`);
    return Number(result.records[0]?.get('c') ?? 0);
};

export const ensureSeedProfile = async (
    run: QueryRunnerLike['run'],
    profileId: string = DEFAULT_OWNER_PROFILE_ID
): Promise<void> => {
    const normalizedProfileId = normalizeProfileId(profileId);

    await run(
        `MERGE (p:Profile {profileId: $profileId})
         ON CREATE SET p.displayName = $displayName,
                       p.shortBio = $shortBio,
                       p.did = $did,
                       p.profileVisibility = $profileVisibility,
                       p.approved = $approved,
                       p.isServiceProfile = $isServiceProfile
         ON MATCH SET  p.displayName = coalesce(p.displayName, $displayName),
                       p.shortBio = coalesce(p.shortBio, $shortBio),
                       p.profileVisibility = coalesce(p.profileVisibility, $profileVisibility),
                       p.approved = coalesce(p.approved, $approved),
                       p.isServiceProfile = coalesce(p.isServiceProfile, $isServiceProfile)`,
        {
            profileId: normalizedProfileId,
            displayName: DEFAULT_OWNER_DISPLAY_NAME,
            shortBio: DEFAULT_OWNER_SHORT_BIO,
            did: `did:seed:${normalizedProfileId}`,
            profileVisibility: 'public',
            approved: true,
            isServiceProfile: true,
        }
    );
};

export const seedSkillFrameworkFixtures = async (
    run: QueryRunnerLike['run'],
    options: SeedSkillFrameworksOptions = {}
): Promise<{ seededFrameworkIds: string[] }> => {
    const ownerProfileId = options.ownerProfileId ?? DEFAULT_OWNER_PROFILE_ID;
    const normalizedOwnerProfileId = normalizeProfileId(ownerProfileId);
    const fixtures = DEFAULT_SKILL_FRAMEWORKS;
    const adminProfileIds = unique(options.adminProfileIds ?? []);

    await ensureSeedProfile(run, ownerProfileId);

    const seededFrameworkIds: string[] = [];
    let embeddingBackfillFailureSummary: string | null = null;

    for (const framework of fixtures) {
        const now = new Date().toISOString();

        await run(
            `MERGE (f:SkillFramework {id: $id})
             ON CREATE SET f.name = $name,
                           f.description = $description,
                           f.image = $image,
                           f.sourceURI = $sourceURI,
                           f.isPublic = $isPublic,
                           f.status = $status,
                           f.createdAt = $createdAt,
                           f.updatedAt = $updatedAt
             ON MATCH SET  f.name = $name,
                           f.description = $description,
                           f.image = $image,
                           f.sourceURI = $sourceURI,
                           f.isPublic = $isPublic,
                           f.status = $status,
                           f.updatedAt = $updatedAt`,
            {
                id: framework.id,
                name: framework.name,
                description: framework.description,
                image: framework.image ?? '',
                sourceURI: framework.sourceURI,
                isPublic: framework.isPublic,
                status: framework.status,
                createdAt: now,
                updatedAt: now,
            }
        );

        await run(
            `MATCH (p:Profile {profileId: $profileId}), (f:SkillFramework {id: $frameworkId})
             MERGE (p)-[:MANAGES]->(f)`,
            { profileId: normalizedOwnerProfileId, frameworkId: framework.id }
        );

        for (const rootSkill of framework.skills) {
            await upsertSkillNode(run, framework, rootSkill);
        }

        if (!embeddingBackfillFailureSummary) {
            const missingEmbeddingSkills = await getSeedSkillsMissingEmbedding(run, framework.id);

            if (missingEmbeddingSkills.length > 0) {
                try {
                    await upsertSkillEmbeddings(
                        missingEmbeddingSkills,
                        buildSeedSkillEmbeddingUpdater(run)
                    );
                } catch (error) {
                    embeddingBackfillFailureSummary = describeEmbeddingBackfillFailure(error);
                }
            }
        }

        seededFrameworkIds.push(framework.id);
    }

    if (embeddingBackfillFailureSummary) {
        options.log?.warn?.(
            `Embedding backfill was skipped after the first framework because Google rejected the request: ${embeddingBackfillFailureSummary}`
        );
        options.log?.warn?.(
            'The frameworks were still seeded and admin access was granted. Semantic search will keep using whichever embeddings already exist.'
        );
    }

    if (adminProfileIds.length > 0) {
        for (const profileId of adminProfileIds) {
            const normalizedAdminProfileId = normalizeProfileId(profileId);

            for (const frameworkId of seededFrameworkIds) {
                await run(
                    `MATCH (p:Profile {profileId: $profileId}), (f:SkillFramework {id: $frameworkId})
                     MERGE (p)-[:MANAGES]->(f)`,
                    { profileId: normalizedAdminProfileId, frameworkId }
                );
            }
        }
    }

    return { seededFrameworkIds };
};

export const maybeAutoSeedSkillFrameworks = async (
    run: QueryRunnerLike['run'],
    options: SeedSkillFrameworksOptions = {}
): Promise<{ seeded: boolean; seededFrameworkIds: string[] }> => {
    if (process.env.NODE_ENV === 'production') {
        return { seeded: false, seededFrameworkIds: [] };
    }

    if (toBoolean(process.env.SKIP_SKILL_FRAMEWORK_SEED)) {
        options.log?.log(
            'Skipping skill-framework auto-seed because SKIP_SKILL_FRAMEWORK_SEED is set'
        );
        return { seeded: false, seededFrameworkIds: [] };
    }

    const existingCount = await countSkillFrameworks(run);
    if (existingCount > 0 && !options.force) {
        options.log?.log('Global skill frameworks already exist!');
        return { seeded: false, seededFrameworkIds: [] };
    }

    const seeded = await seedSkillFrameworkFixtures(run, {
        ownerProfileId:
            options.ownerProfileId ??
            process.env.SKILL_FRAMEWORK_SEED_OWNER_PROFILE_ID ??
            undefined,
        adminProfileIds: unique([
            ...(options.adminProfileIds ?? []),
            ...(process.env.SKILL_FRAMEWORK_ADMIN_PROFILE_IDS ?? '')
                .split(',')
                .map(value => value.trim())
                .filter(Boolean),
        ]),
        log: options.log,
    });

    options.log?.log(`Seeded ${seeded.seededFrameworkIds.length} skill framework(s) for LearnCard`);

    return { seeded: true, seededFrameworkIds: seeded.seededFrameworkIds };
};

export const parseCommaSeparatedIds = (value?: string): string[] =>
    unique(
        (value ?? '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)
    );

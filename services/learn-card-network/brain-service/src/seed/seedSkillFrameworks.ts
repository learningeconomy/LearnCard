import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

import { parse as parseDotenv } from 'dotenv';
import { Neogma } from 'neogma';
import {
    type SeedSkillFrameworkFixture,
    DEFAULT_SKILL_FRAMEWORKS,
    type SeedSkillNode,
} from './skill-frameworks.fixtures';
import {
    upsertSkillEmbeddings,
    type UpdateSkillEmbeddingFn,
} from '@helpers/skill-embedding.helpers';
// Inlined from @helpers/profile.helpers to avoid importing the access/model layer
// (it transitively pulls in @models, which hits a circular-dependency TDZ under tsx).
const transformProfileId = (rawInput: string): string =>
    rawInput.toLowerCase().replaceAll(':', '%3A');

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

type Neo4jConnectionCandidate = {
    label: string;
    url: string;
    username?: string;
    password?: string;
    hint: string;
};

const DEFAULT_OWNER_PROFILE_ID = 'network-seed';
const DEFAULT_OWNER_DISPLAY_NAME = 'Network Seed';
const DEFAULT_OWNER_SHORT_BIO = 'System profile for seeded skill frameworks';
const SEEDED_SKILL_FRAMEWORK_IDS = DEFAULT_SKILL_FRAMEWORKS.map(({ id }) => id);
const LOCAL_NEO4J_FALLBACK = {
    url: 'bolt://localhost:7687',
    username: 'neo4j',
    password: 'this-is-the-password',
};

const DOCKER_NETWORK_NEO4J_FALLBACK = {
    url: 'bolt://neo4j:7687',
    username: 'neo4j',
    password: 'this-is-the-password',
};

const STAGING_NEO4J_ENV_PATHS = [
    resolve(process.cwd(), '../../../packages/learn-card-network/brain-client/.env'),
    resolve(process.cwd(), '../../../packages/learn-card-network/cloud-client/.env'),
    resolve(process.cwd(), '../../../services/learn-card-network/brain-service/.env.staging'),
];
const BRAIN_SERVICE_STAGING_ENV_PATH = resolve(
    process.cwd(),
    '../../../services/learn-card-network/brain-service/.env.staging'
);
const BRAIN_SERVICE_STAGING_ENV_DISPLAY_PATH =
    'services/learn-card-network/brain-service/.env.staging';

let hasWarnedMissingBrainServiceStagingEnv = false;

export const getStagingNeo4jSourceDescription = (): string =>
    existsSync(BRAIN_SERVICE_STAGING_ENV_PATH)
        ? BRAIN_SERVICE_STAGING_ENV_DISPLAY_PATH
        : 'your shell environment or package .env files';

const hasBrainServiceStagingEnv = (): boolean => existsSync(BRAIN_SERVICE_STAGING_ENV_PATH);

const normalizeNeo4jUriForStaging = (uri: string): string => {
    const trimmedUri = uri.trim();

    if (/^(neo4j|bolt)(\+ssc|\+s)?:\/\//i.test(trimmedUri)) {
        return trimmedUri;
    }

    return `neo4j+s://${trimmedUri.replace(/^\/+/, '')}`;
};

const normalizeNeo4jUriToBolt = (uri: string): string =>
    normalizeNeo4jUriForStaging(uri).replace(/^neo4j(\+ssc|\+s)?/i, 'bolt$1');

const loadEnvFile = (filePath: string): Record<string, string> => {
    if (!existsSync(filePath)) return {};

    return parseDotenv(readFileSync(filePath, 'utf8')) as Record<string, string>;
};

const loadStagingNeo4jEnv = (): Record<string, string> => {
    const loaded: Record<string, string> = {};

    if (!hasWarnedMissingBrainServiceStagingEnv && !existsSync(BRAIN_SERVICE_STAGING_ENV_PATH)) {
        hasWarnedMissingBrainServiceStagingEnv = true;

        console.warn(
            '\x1b[33mWARNING: services/learn-card-network/brain-service/.env.staging is missing. Run `pnpm env:pull --env=staging` from the repo root to generate it.\x1b[0m'
        );
    }

    for (const filePath of STAGING_NEO4J_ENV_PATHS) {
        const values = loadEnvFile(filePath);

        if (toBoolean(process.env.SKILL_FRAMEWORKS_DEBUG)) {
            const loadedKeys = ['NEO4J_URI', 'NEO4J_USERNAME', 'NEO4J_PASSWORD'].filter(
                key => values[key] !== undefined
            );

            if (loadedKeys.length > 0) {
                console.log(`[skill-frameworks] loaded ${loadedKeys.join(', ')} from ${filePath}`);
            }
        }

        Object.assign(loaded, values);
    }

    return loaded;
};

const readNeo4jEnvValue = (
    stage: 'local' | 'staging',
    stagingEnv: Record<string, string>,
    key: 'NEO4J_URI' | 'NEO4J_USERNAME' | 'NEO4J_PASSWORD'
): string | undefined => {
    const stagingValue = stagingEnv[key]?.trim();
    const processValue = process.env[key]?.trim();

    if (stage === 'staging') {
        return stagingValue ?? processValue;
    }

    return processValue ?? stagingValue;
};

const toBoolean = (value: string | undefined): boolean => {
    if (!value) return false;

    return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
};

const unique = (values: string[]): string[] =>
    Array.from(new Set(values.map(value => value.trim()).filter(Boolean)));

const buildNeo4jErrorSummary = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
};

const explainNeo4jConnectionError = (error: string, stage: 'local' | 'staging'): string => {
    const normalized = error.toLowerCase();

    if (normalized.includes('no routing servers available')) {
        return stage === 'staging'
            ? 'The database URI looks like a routing endpoint, but this command connects directly. Try the value from `services/learn-card-network/brain-service/.env.staging` or set `NEO4J_URI` to the current staging database URI.'
            : 'The database URI looks like a routing endpoint, but this command connects directly. Try the local Docker default or a direct `bolt://` URI.';
    }

    if (normalized.includes('failed to establish connection') || normalized.includes('timed out')) {
        return stage === 'staging'
            ? 'Neo4j could not be reached at that host. Double-check the URI in `services/learn-card-network/brain-service/.env.staging` and make sure the staging database is reachable from your machine.'
            : 'Neo4j could not be reached on that host and port. Make sure the local container is running and 7687 is published to your machine.';
    }

    if (normalized.includes('authentication') || normalized.includes('unauthorized')) {
        return 'The Neo4j username or password looks wrong for that database.';
    }

    return error;
};

const buildNeo4jConnectionCandidates = (
    stage: 'local' | 'staging' = 'local'
): Neo4jConnectionCandidate[] => {
    const stagingEnv = stage === 'staging' ? loadStagingNeo4jEnv() : {};
    const envUri = readNeo4jEnvValue(stage, stagingEnv, 'NEO4J_URI');
    const envUsername = readNeo4jEnvValue(stage, stagingEnv, 'NEO4J_USERNAME');
    const envPassword = readNeo4jEnvValue(stage, stagingEnv, 'NEO4J_PASSWORD');

    if (stage === 'staging' && toBoolean(process.env.SKILL_FRAMEWORKS_DEBUG)) {
        console.log(
            `[skill-frameworks] staging Neo4j values are sourced from ${getStagingNeo4jSourceDescription()}`
        );
        console.log(
            `[skill-frameworks] staging Neo4j env resolved to ${
                envUri ? normalizeNeo4jUriForStaging(envUri) : '<missing uri>'
            } (username=${envUsername ? 'set' : 'missing'}, password=${
                envPassword ? 'set' : 'missing'
            })`
        );
    }

    if (stage === 'staging' && envUri && envUsername && envPassword) {
        const normalizedBoltUri = normalizeNeo4jUriToBolt(envUri);
        const normalizedRoutingUri = normalizeNeo4jUriForStaging(envUri);
        const stagingSourceDescription = getStagingNeo4jSourceDescription();

        return [
            ...(normalizedBoltUri !== envUri
                ? [
                      {
                          label: 'staging env (direct connection)',
                          url: normalizedBoltUri,
                          username: envUsername,
                          password: envPassword,
                          hint: `Uses values from ${stagingSourceDescription}. This is the first connection we try.`,
                      },
                  ]
                : []),
            {
                label: 'staging env (configured URI)',
                url: normalizedRoutingUri,
                username: envUsername,
                password: envPassword,
                hint: `Uses the URI from ${stagingSourceDescription} as configured, normalizing a bare Aura host when needed.`,
            },
        ];
    }

    if (stage === 'staging') {
        throw new Error(
            'Staging skill-framework seeding requires NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD.'
        );
    }

    const candidates: Neo4jConnectionCandidate[] = [
        {
            label: 'local Docker default',
            ...LOCAL_NEO4J_FALLBACK,
            hint: 'Matches the local compose default used when Neo4j is published on localhost:7687.',
        },
        {
            label: 'Docker network hostname',
            ...DOCKER_NETWORK_NEO4J_FALLBACK,
            hint: 'Useful if you are running the script inside the same Docker network as Neo4j.',
        },
    ];

    return candidates.filter(
        (candidate, index, array) =>
            index ===
            array.findIndex(
                other =>
                    other.url === candidate.url &&
                    other.username === candidate.username &&
                    other.password === candidate.password
            )
    );
};

export const resolveSkillFrameworkNeo4jConnection = async (
    stage: 'local' | 'staging' = 'local'
): Promise<{
    neogma: Neogma;
    candidate: Neo4jConnectionCandidate;
}> => {
    const candidates = buildNeo4jConnectionCandidates(stage);
    const failures: Array<{ candidate: Neo4jConnectionCandidate; error: string }> = [];
    const stagingEnvFileExists = stage === 'staging' ? hasBrainServiceStagingEnv() : false;

    for (const candidate of candidates) {
        const connection = new Neogma({
            url: candidate.url,
            username: candidate.username ?? '',
            password: candidate.password ?? '',
        });

        try {
            await connection.queryRunner.run('RETURN 1 AS ok');
            return { neogma: connection, candidate };
        } catch (error) {
            failures.push({ candidate, error: buildNeo4jErrorSummary(error) });
            await connection.driver.close().catch(() => undefined);
        }
    }

    const failureLines = failures
        .map(
            ({ candidate, error }) =>
                `- ${candidate.label} (${candidate.url}) — ${
                    candidate.hint
                }\n  ${explainNeo4jConnectionError(error, stage)}`
        )
        .join('\n');

    const nextSteps =
        stage === 'staging'
            ? stagingEnvFileExists
                ? [
                      `- If you are overriding the database in your shell, export \`NEO4J_URI\`, \`NEO4J_USERNAME\`, and \`NEO4J_PASSWORD\` before running the command again.`,
                      `- Confirm the URI in ${BRAIN_SERVICE_STAGING_ENV_DISPLAY_PATH} points to the current staging Neo4j instance.`,
                  ]
                : [
                      `- Re-pull the staging env file from the repo root: \`pnpm env:pull --env=staging\`.`,
                      `- If you are overriding the database in your shell, export \`NEO4J_URI\`, \`NEO4J_USERNAME\`, and \`NEO4J_PASSWORD\` before running the command again.`,
                      `- After the file is generated, confirm the URI in ${BRAIN_SERVICE_STAGING_ENV_DISPLAY_PATH} points to the current staging Neo4j instance.`,
                  ]
            : [
                  '- If Neo4j is running in local Docker, make sure the container is up and port 7687 is published to localhost.',
                  '- If you are using a direct local database URI, verify the host, port, username, and password.',
                  '- If you are running the script inside Docker, the fallback hostname is usually bolt://neo4j:7687.',
              ];

    throw new Error(
        [
            'Unable to connect to Neo4j for skill-framework operations.',
            '',
            'Tried these connection settings:',
            failureLines,
            '',
            'What to do next:',
            ...nextSteps,
        ].join('\n')
    );
};

export const countSkillFrameworks = async (run: QueryRunnerLike['run']): Promise<number> => {
    const result = await run(`MATCH (f:SkillFramework) RETURN count(f) AS c LIMIT 1`);
    return Number(result.records[0]?.get('c') ?? 0);
};

export const frameworkExists = async (run: QueryRunnerLike['run']): Promise<boolean> => {
    return (await countSkillFrameworks(run)) > 0;
};

export const addSkillFrameworkAdmin = async (
    run: QueryRunnerLike['run'],
    profileId: string
): Promise<number> => {
    const normalizedProfileId = transformProfileId(profileId);
    const frameworksResult = await run(
        `MATCH (f:SkillFramework)
         WHERE f.id IN $frameworkIds
         RETURN collect(f.id) AS frameworkIds, count(f) AS count`,
        { frameworkIds: SEEDED_SKILL_FRAMEWORK_IDS }
    );

    const frameworkCount = Number(frameworksResult.records[0]?.get('count') ?? 0);
    if (frameworkCount === 0) {
        return 0;
    }

    const frameworkIds = (frameworksResult.records[0]?.get('frameworkIds') ?? []) as string[];
    for (const frameworkId of frameworkIds) {
        await run(
            `MATCH (p:Profile {profileId: $profileId}), (f:SkillFramework {id: $frameworkId})
             MERGE (p)-[:MANAGES]->(f)`,
            { profileId: normalizedProfileId, frameworkId }
        );
    }

    return frameworkCount;
};

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
        return '\nEmbedding quota was reached. \nThe frameworks were seeded, but semantic search will stay limited until the Google embedding quota resets or you switch to a paid key.\n';
    }

    if (normalized.includes('rate limits') || normalized.includes('too many requests')) {
        return 'Google embedding requests were rate-limited. The frameworks were seeded, but some semantic search embeddings were skipped for now.';
    }

    return `${message}\nUse \`pnpm skill-frameworks add-admin\` to add admins.`;
};

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

export const ensureSeedProfile = async (
    run: QueryRunnerLike['run'],
    profileId: string = DEFAULT_OWNER_PROFILE_ID
): Promise<void> => {
    const normalizedProfileId = transformProfileId(profileId);

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
    const normalizedOwnerProfileId = transformProfileId(ownerProfileId);
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
            'The frameworks were still seeded. Use `pnpm skill-frameworks add-admin` to add admins. Semantic search will keep using whichever embeddings already exist.'
        );
    }

    if (adminProfileIds.length > 0) {
        for (const profileId of adminProfileIds) {
            const normalizedAdminProfileId = transformProfileId(profileId);

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

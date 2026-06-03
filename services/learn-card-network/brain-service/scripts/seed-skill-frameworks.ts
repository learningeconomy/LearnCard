#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import { Neogma } from 'neogma';

import {
    parseCommaSeparatedIds,
    seedSkillFrameworkFixtures,
} from '../src/seed/seedSkillFrameworks';

dotenv.config();

type CliOptions = {
    ownerProfileId: string;
    adminProfileIds: string[];
    force: boolean;
};

type Neo4jConnectionCandidate = {
    label: string;
    url: string;
    username?: string;
    password?: string;
    hint: string;
};

const DEFAULT_OWNER_PROFILE_ID =
    process.env.SKILL_FRAMEWORK_SEED_OWNER_PROFILE_ID ?? 'network-seed';

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

const buildNeo4jConnectionCandidates = (): Neo4jConnectionCandidate[] => {
    const candidates: Neo4jConnectionCandidate[] = [];

    if (process.env.NEO4J_URI || process.env.NEO4J_USERNAME || process.env.NEO4J_PASSWORD) {
        candidates.push({
            label: 'environment variables',
            url: process.env.NEO4J_URI ?? LOCAL_NEO4J_FALLBACK.url,
            username: process.env.NEO4J_USERNAME ?? LOCAL_NEO4J_FALLBACK.username,
            password: process.env.NEO4J_PASSWORD ?? LOCAL_NEO4J_FALLBACK.password,
            hint: 'Uses the NEO4J_* values already set in your shell or .env file.',
        });
    }

    candidates.push(
        {
            label: 'local Docker default',
            ...LOCAL_NEO4J_FALLBACK,
            hint: 'Matches the local compose default used when Neo4j is published on localhost:7687.',
        },
        {
            label: 'Docker network hostname',
            ...DOCKER_NETWORK_NEO4J_FALLBACK,
            hint: 'Useful if you are running the script inside the same Docker network as Neo4j.',
        }
    );

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

const buildNeo4jErrorSummary = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    return String(error);
};

const explainNeo4jConnectionError = (error: string): string => {
    const normalized = error.toLowerCase();

    if (normalized.includes('no routing servers available')) {
        return 'This URI points at a routing database, but the local seed script needs a direct Bolt connection. Try the local Docker default first.';
    }

    if (normalized.includes('failed to establish connection') || normalized.includes('timed out')) {
        return 'Neo4j could not be reached on that host and port. Make sure the container is running and 7687 is published to your machine.';
    }

    if (normalized.includes('authentication') || normalized.includes('unauthorized')) {
        return 'The Neo4j username or password looks wrong for that database.';
    }

    return error;
};

const resolveNeo4jConnection = async (): Promise<{
    neogma: Neogma;
    candidate: Neo4jConnectionCandidate;
}> => {
    const candidates = buildNeo4jConnectionCandidates();
    const failures: Array<{ candidate: Neo4jConnectionCandidate; error: string }> = [];

    for (const candidate of candidates) {
        const connection = new Neogma({
            url: candidate.url,
            username: candidate.username,
            password: candidate.password,
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
                }\n  ${explainNeo4jConnectionError(error)}`
        )
        .join('\n');

    throw new Error(
        [
            'Unable to connect to Neo4j for skill-framework seeding.',
            '',
            'Tried these connection settings:',
            failureLines,
            '',
            'What to do next:',
            '- If Neo4j is running in local Docker, make sure the container is up and port 7687 is published to localhost.',
            '- If you are using a custom database URL, export NEO4J_URI, NEO4J_USERNAME, and NEO4J_PASSWORD before running the command again.',
            '- If you are running the seed script inside Docker, the fallback hostname is usually bolt://neo4j:7687.',
        ].join('\n')
    );
};

const parseCliOptions = (): CliOptions => {
    const args = process.argv.slice(2);

    const ownerFlagIndex = args.indexOf('--owner');
    const ownerProfileId =
        ownerFlagIndex >= 0 && args[ownerFlagIndex + 1]
            ? args[ownerFlagIndex + 1]!
            : DEFAULT_OWNER_PROFILE_ID;

    const adminProfileIds = parseCommaSeparatedIds(process.env.SKILL_FRAMEWORK_ADMIN_PROFILE_IDS);
    for (let index = 0; index < args.length; index += 1) {
        if (args[index] === '--add-admin' && args[index + 1]) {
            adminProfileIds.push(args[index + 1]!);
        }
    }

    return {
        ownerProfileId,
        adminProfileIds: Array.from(
            new Set(adminProfileIds.map(value => value.trim()).filter(Boolean))
        ),
        force: args.includes('--force'),
    };
};

const main = async (): Promise<void> => {
    const options = parseCliOptions();

    if (process.env.NODE_ENV === 'production' && !options.force) {
        throw new Error(
            'Refusing to seed skill frameworks in production. Re-run with --force only if you are sure.'
        );
    }

    const { neogma, candidate } = await resolveNeo4jConnection();

    try {
        console.log('Seeding default skill frameworks...');
        console.log(`Owner profile: ${options.ownerProfileId}`);
        console.log(`Neo4j connection: ${candidate.label} (${candidate.url})`);

        if (options.adminProfileIds.length > 0) {
            console.log(`Granting admin access to: ${options.adminProfileIds.join(', ')}`);
        }

        const result = await seedSkillFrameworkFixtures(
            neogma.queryRunner.run.bind(neogma.queryRunner),
            {
                ownerProfileId: options.ownerProfileId,
                adminProfileIds: options.adminProfileIds,
                log: console,
            }
        );

        console.log(`Seeded ${result.seededFrameworkIds.length} skill framework(s).`);
        console.log('Done.');
    } finally {
        await neogma.driver.close();
    }
};

main().catch(error => {
    console.error('Failed to seed skill frameworks:', error);
    process.exit(1);
});

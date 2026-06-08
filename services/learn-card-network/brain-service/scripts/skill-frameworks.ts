#!/usr/bin/env tsx

import { existsSync, readFileSync } from 'fs';
import { createInterface } from 'readline';
import { resolve } from 'path';

import { parse as parseDotenv } from 'dotenv';

import {
    addSkillFrameworkAdmin,
    frameworkExists,
    resolveSkillFrameworkNeo4jConnection,
    seedSkillFrameworkFixtures,
} from '../src/seed/seedSkillFrameworks';

type SkillFrameworkCommand = 'seed' | 'add-admin';

type Stage = 'local' | 'staging';

type CliOptions = {
    command: SkillFrameworkCommand;
    stage: Stage;
    usedDefaultStage: boolean;
    profileId?: string;
    usedInlineProfileId: boolean;
};

const VALID_COMMANDS: SkillFrameworkCommand[] = ['seed', 'add-admin'];
const VALID_STAGES: Stage[] = ['local', 'staging'];
const BRAIN_SERVICE_ENV_PATH = resolve(process.cwd(), '.env');
const STAGING_ENV_PATHS = [
    resolve(process.cwd(), '../../../packages/learn-card-network/brain-client/.env'),
    resolve(process.cwd(), '../../../packages/learn-card-network/cloud-client/.env'),
];

const ask = (question: string): Promise<string> => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });

    return new Promise(resolve => {
        rl.question(question, answer => {
            rl.close();
            resolve(answer.trim());
        });
    });
};

const loadEnvFile = (filePath: string): Record<string, string> => {
    if (!existsSync(filePath)) {
        return {};
    }

    return parseDotenv(readFileSync(filePath, 'utf8')) as Record<string, string>;
};

const loadEnvIntoProcess = (filePath: string): void => {
    const values = loadEnvFile(filePath);

    for (const [key, value] of Object.entries(values)) {
        if (process.env[key] === undefined) {
            process.env[key] = value;
        }
    }
};

const loadSkillFrameworkEnv = (stage: Stage): void => {
    if (stage === 'staging') {
        for (const filePath of STAGING_ENV_PATHS) {
            loadEnvIntoProcess(filePath);
        }

        return;
    }

    loadEnvIntoProcess(BRAIN_SERVICE_ENV_PATH);
};

const parseCliOptions = (): CliOptions => {
    const args = process.argv.slice(2);
    const command = args[0] as SkillFrameworkCommand | undefined;

    if (!command || !VALID_COMMANDS.includes(command)) {
        throw new Error('\nUsage: pnpm skill-frameworks <seed|add-admin> [local|staging]\n');
    }

    const secondArg = args[1];
    const thirdArg = args[2];

    if (args.length > 3) {
        throw new Error('\nUsage: pnpm skill-frameworks <seed|add-admin> [local|staging]\n');
    }

    if (!secondArg) {
        return {
            command,
            stage: 'local',
            usedDefaultStage: true,
            usedInlineProfileId: false,
        };
    }

    if (VALID_STAGES.includes(secondArg as Stage)) {
        if (command === 'add-admin' && thirdArg) {
            return {
                command,
                stage: secondArg as Stage,
                usedDefaultStage: false,
                profileId: thirdArg,
                usedInlineProfileId: true,
            };
        }

        if (thirdArg) {
            throw new Error('\nUsage: pnpm skill-frameworks <seed|add-admin> [local|staging]\n');
        }

        return {
            command,
            stage: secondArg as Stage,
            usedDefaultStage: false,
            usedInlineProfileId: false,
        };
    }

    if (command === 'add-admin') {
        if (thirdArg) {
            throw new Error('Usage: pnpm skill-frameworks add-admin [local|staging] [profileId]');
        }

        return {
            command,
            stage: 'local',
            usedDefaultStage: true,
            profileId: secondArg,
            usedInlineProfileId: true,
        };
    }

    throw new Error('Stage must be either local or staging.');
};

const normalizeProfileId = (profileId: string): string =>
    profileId.toLowerCase().replace(':', '%3A');

const ensureStageMessage = (stage: Stage, usedDefaultStage: boolean): void => {
    console.log('');

    if (usedDefaultStage) {
        console.log('No environment specified. Defaulting to local.');
    }

    console.log(`Using ${stage} environment.`);
};

const countProfileById = async (
    run: (
        query: string,
        params?: Record<string, unknown>
    ) => Promise<{ records: Array<{ get: (key: string) => unknown }> }>,
    profileId: string
): Promise<number> => {
    const result = await run(`MATCH (p:Profile {profileId: $profileId}) RETURN count(p) AS count`, {
        profileId,
    });

    return Number(result.records[0]?.get('count') ?? 0);
};

const runSeed = async (stage: Stage, usedDefaultStage: boolean): Promise<void> => {
    ensureStageMessage(stage, usedDefaultStage);

    const { neogma, candidate } = await resolveSkillFrameworkNeo4jConnection(stage);

    try {
        console.log(`Neo4j connection: ${candidate.label} (${candidate.url})`);
        console.log('Seeding default skill frameworks...');

        const result = await seedSkillFrameworkFixtures(
            neogma.queryRunner.run.bind(neogma.queryRunner),
            {
                log: console,
            }
        );

        console.log(`Seeded ${result.seededFrameworkIds.length} skill framework(s).`);
        console.log('Done.');
    } finally {
        await neogma.driver.close();
    }
};

const runAddAdmin = async (
    stage: Stage,
    usedDefaultStage: boolean,
    inlineProfileId?: string
): Promise<void> => {
    ensureStageMessage(stage, usedDefaultStage);

    const { neogma, candidate } = await resolveSkillFrameworkNeo4jConnection(stage);

    try {
        console.log(`Neo4j connection: ${candidate.label} (${candidate.url})`);

        const existingFrameworkCount = await frameworkExists(
            neogma.queryRunner.run.bind(neogma.queryRunner)
        );
        if (!existingFrameworkCount) {
            throw new Error(
                'No skill frameworks exist yet. Run `pnpm skill-frameworks seed` first.'
            );
        }

        const rawProfileId = inlineProfileId ?? (await ask('\nProfile id: '));
        if (!inlineProfileId) {
            console.log('');
        }
        const profileId = normalizeProfileId(rawProfileId);

        if (!profileId) {
            throw new Error('Profile id is required.');
        }

        const profileCount = await countProfileById(
            neogma.queryRunner.run.bind(neogma.queryRunner),
            profileId
        );

        if (profileCount === 0) {
            throw new Error(`No profile found for ${profileId}.`);
        }

        const linkedFrameworkCount = await addSkillFrameworkAdmin(
            neogma.queryRunner.run.bind(neogma.queryRunner),
            profileId
        );

        console.log(
            `Granted admin access for ${profileId} across ${linkedFrameworkCount} framework(s).`
        );
        console.log('Done.');
    } finally {
        await neogma.driver.close();
    }
};

const main = async (): Promise<void> => {
    const options = parseCliOptions();
    loadSkillFrameworkEnv(options.stage);

    if (options.command === 'seed') {
        await runSeed(options.stage, options.usedDefaultStage);
        return;
    }

    await runAddAdmin(options.stage, options.usedDefaultStage, options.profileId);
};

main().catch(error => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});

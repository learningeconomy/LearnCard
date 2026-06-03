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

const DEFAULT_OWNER_PROFILE_ID =
    process.env.SKILL_FRAMEWORK_SEED_OWNER_PROFILE_ID ?? 'network-seed';

const buildDefaultNeo4jConfig = (): { url: string; username: string; password: string } => ({
    url: process.env.NEO4J_URI ?? 'bolt://localhost:7687',
    username: process.env.NEO4J_USERNAME ?? 'neo4j',
    password: process.env.NEO4J_PASSWORD ?? 'this-is-the-password',
});

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

    const { url, username, password } = buildDefaultNeo4jConfig();
    const neogma = new Neogma({ url, username, password });

    try {
        console.log('Seeding default skill frameworks...');
        console.log(`Owner profile: ${options.ownerProfileId}`);

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

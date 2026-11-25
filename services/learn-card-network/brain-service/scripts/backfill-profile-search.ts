#!/usr/bin/env bun
/**
 * Backfills `Profile.displayNameLower`, the normalized copy of `displayName` (see
 * `normalizeProfileSearchText`) that case-insensitive profile search reads through the
 * `profile_displayname_lower_text_idx` TEXT index.
 *
 * New and updated profiles get the field on write. Run this once per environment after the
 * release that adds or changes it, and only once no instance of the previous build is still
 * writing profiles, so profiles written before then are findable by display name again.
 * It's idempotent and only touches profiles whose copy is missing or out of date.
 *
 * Usage (from services/learn-card-network/brain-service):
 *   NEO4J_URI=... NEO4J_USERNAME=... NEO4J_PASSWORD=... \
 *     bun run backfill:profile-search -- --yes [--batch-size 1000]
 *
 * Without --yes it only counts the profiles that need the field and changes nothing.
 */

import neo4j from 'neo4j-driver';

import {
    PROFILE_DISPLAY_NAME_LOWER_FIELD,
    backfillProfileDisplayNameLower,
    buildBackfillProfileDisplayNameLowerQuery,
    profileDisplayNameLowerIsStale,
} from '../src/accesslayer/profile/search-fields';

const getArg = (name: string): string | undefined => {
    const index = process.argv.indexOf(name);
    return index === -1 ? undefined : process.argv[index + 1];
};

const main = async (): Promise<void> => {
    const uri = process.env.NEO4J_URI;
    const username = process.env.NEO4J_USERNAME;
    const password = process.env.NEO4J_PASSWORD;

    if (!uri || !username || !password) {
        throw new Error('NEO4J_URI, NEO4J_USERNAME and NEO4J_PASSWORD must all be set explicitly.');
    }

    const write = process.argv.includes('--yes');
    const batchSize = Number(getArg('--batch-size') ?? 1000);

    console.log(`Target: ${uri} (${write ? 'write' : 'dry run, pass --yes to write'})`);

    const driver = neo4j.driver(uri, neo4j.auth.basic(username, password));
    const session = driver.session();

    try {
        if (!write) {
            const result = await session.run(
                `MATCH (profile:Profile)
                 WHERE ${profileDisplayNameLowerIsStale('profile')}
                 RETURN count(profile) AS pending`
            );
            console.log(
                `Profiles needing ${PROFILE_DISPLAY_NAME_LOWER_FIELD}:`,
                result.records[0]?.get('pending').toString()
            );
            console.log(`Would run:\n${buildBackfillProfileDisplayNameLowerQuery(batchSize)}`);
            return;
        }

        const updated = await backfillProfileDisplayNameLower(query => session.run(query), {
            batchSize,
        });

        console.log(`Set ${PROFILE_DISPLAY_NAME_LOWER_FIELD} on ${updated} profiles.`);
    } finally {
        await session.close();
        await driver.close();
    }
};

main().catch(error => {
    console.error(error);
    process.exit(1);
});

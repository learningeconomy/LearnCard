#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import { Neogma } from 'neogma';

dotenv.config();

export type ListingKindBackfillVerification = {
    totalListings: number;
    listingsMissingKind: number;
};

const createStandaloneNeogma = (): Neogma =>
    new Neogma({
        url: process.env.NEO4J_URI || 'bolt://localhost:7687',
        username: process.env.NEO4J_USERNAME || 'neo4j',
        password: process.env.NEO4J_PASSWORD || 'this-is-the-password',
    });

export const getListingKindBackfillVerification = async (
    db: Pick<Neogma, 'queryRunner'>
): Promise<ListingKindBackfillVerification> => {
    const result = await db.queryRunner.run(
        `MATCH (listing:AppStoreListing)
         RETURN COUNT(listing) AS totalListings,
                COUNT { (listing) WHERE listing.kind IS NULL } AS listingsMissingKind`
    );

    return {
        totalListings: Number(result.records[0]?.get('totalListings') ?? 0),
        listingsMissingKind: Number(result.records[0]?.get('listingsMissingKind') ?? 0),
    };
};

export const backfillListingKind = async (db: Pick<Neogma, 'queryRunner'>): Promise<number> => {
    const result = await db.queryRunner.run(
        `MATCH (listing:AppStoreListing)
         WHERE listing.kind IS NULL
         SET listing.kind = 'APP'
         RETURN COUNT(listing) AS updatedCount`
    );

    return Number(result.records[0]?.get('updatedCount') ?? 0);
};

const main = async (): Promise<void> => {
    const neogma = createStandaloneNeogma();

    try {
        const updatedCount = await backfillListingKind(neogma);
        const verification = await getListingKindBackfillVerification(neogma);

        console.log(`Updated listings: ${updatedCount}`);
        console.log(`Total listings: ${verification.totalListings}`);
        console.log(`Listings missing kind: ${verification.listingsMissingKind}`);

        if (verification.listingsMissingKind !== 0) {
            throw new Error('Listing kind backfill verification failed');
        }
    } finally {
        await neogma.driver.close();
    }
};

if (process.argv[1]?.endsWith('backfill-listing-kind.ts')) {
    main().catch(err => {
        console.error('\n❌ Backfill failed:', err);
        process.exit(1);
    });
}

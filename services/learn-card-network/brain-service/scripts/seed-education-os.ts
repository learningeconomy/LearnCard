#!/usr/bin/env bun
/**
 * Seed an EducationOS (ADR-008) scenario into the local brain-service database.
 *
 * Run with bun, not tsx: the access layer's circular imports only resolve under
 * bun's ESM loader, which is what lets this share fixture builders with the test
 * suite instead of reimplementing the write path in raw Cypher.
 *
 *   bun run seed:education-os
 *   bun run seed:education-os --operator-profile my-operator --role ADMIN
 *   bun run seed:education-os --ecosystem eco_dev_root --kind INTEGRATION
 *
 * To always grant authority to the profile you actually sign into the console as,
 * put its id in brain-service/.env instead of passing the flag every time:
 *
 *   DEV_OPERATOR_PROFILE_ID=eos-learncard-...
 *
 * Idempotent: re-running repairs the fixture rather than duplicating it.
 */

import * as dotenv from 'dotenv';

dotenv.config();

// src/instance.ts requires NEO4J_* with no defaults, but the sibling dev scripts
// (backfill-listing-kind, seed-dev-app) default to a local Neo4j. Match them so
// `bun run seed:education-os` works from a clean checkout without a .env.
const applyLocalDevDefaults = (): void => {
    process.env.NEO4J_URI ??= 'bolt://localhost:7687';
    process.env.NEO4J_USERNAME ??= 'neo4j';
    process.env.NEO4J_PASSWORD ??= 'this-is-the-password';
    process.env.DOMAIN_NAME ??= 'localhost%3A4000';
};

const arg = (name: string, fallback?: string): string | undefined => {
    const index = process.argv.indexOf(`--${name}`);

    return index >= 0 ? process.argv[index + 1] : fallback;
};

const main = async (): Promise<void> => {
    applyLocalDevDefaults();

    // Imported dynamically on purpose: the access layer reads NEO4J_* at module load,
    // and a static import would hoist above dotenv.config() and the defaults above.
    const { seedPlannableApp, DEV_PLANNABLE_APP_FIXTURE } = await import(
        '../test/helpers/education-os.helpers'
    );

    const operatorProfileId = arg(
        'operator-profile',
        process.env.DEV_OPERATOR_PROFILE_ID ?? 'eos-learncard-dev-operator'
    )!;
    const role = arg('role', 'OWNER') as 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
    const kind = arg('kind', 'APP') as 'APP' | 'INTEGRATION' | 'WALLET' | 'BUNDLE';

    const fixture = await seedPlannableApp({
        ecosystemId: arg('ecosystem', DEV_PLANNABLE_APP_FIXTURE.ecosystemId)!,
        ecosystemSlug: DEV_PLANNABLE_APP_FIXTURE.ecosystemSlug,
        ecosystemName: DEV_PLANNABLE_APP_FIXTURE.ecosystemName,
        operatorProfileId,
        operatorDid: arg('operator-did', `did:key:z6Mkdev${operatorProfileId}`)!,
        operatorRole: role,
        listingId: arg('listing', DEV_PLANNABLE_APP_FIXTURE.listingId)!,
        versionId: arg('version', DEV_PLANNABLE_APP_FIXTURE.versionId)!,
        listingKind: kind,
    });

    console.log(`
✅ EducationOS scenario seeded
──────────────────────────────────────────────────
  Ecosystem ID:   ${fixture.ecosystemId}
  Operator:       ${fixture.operatorProfileId} (${fixture.operatorRole})
  Listing ID:     ${fixture.listingId}
  Version ID:     ${fixture.versionId}
──────────────────────────────────────────────────

Paste the Listing ID and Version ID into the console's "Render a new plan" form.

${
    process.env.DEV_OPERATOR_PROFILE_ID
        ? 'Operator taken from DEV_OPERATOR_PROFILE_ID.'
        : `Note: the console signs in as its own stable dev DID, which is a DIFFERENT profile
from the one above. To grant authority to the profile you actually sign in as, add
its id (from the console Session card) to brain-service/.env:

  DEV_OPERATOR_PROFILE_ID=<profileId>`
}
`);
};

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Seed failed:', error);
        process.exit(1);
    });

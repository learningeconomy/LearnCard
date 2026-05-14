/**
 * Preset listing IDs — mirror of `services/learn-card-network/brain-service/
 * scripts/seed-dev-app.ts`'s `pathway-demo` preset.
 *
 * Why this file exists:
 *   The dev seed script derives each listing_id from its slug via
 *   `uuidv5(slug, NAMESPACE)` so the seed can be idempotent **and** the
 *   in-app dev seed (which doesn't talk to Neo4j) can reference those
 *   listings by id without a lookup round-trip. The NAMESPACE and slugs
 *   below must match the brain-service script exactly — if you change
 *   either side, change both.
 *
 * This module is intentionally tiny: no schema, no validation, no state.
 * It's a constants table + one helper, nothing more. The real source of
 * truth is the brain-service side; this is the pointer.
 */

import { v5 as uuidv5 } from 'uuid';

/**
 * Namespace UUID for preset listing IDs. Must match
 * `PRESET_LISTING_NAMESPACE` in `brain-service/scripts/seed-dev-app.ts`.
 * Treat as an API — changing it invalidates every seeded preset.
 */
export const PRESET_LISTING_NAMESPACE = '5b9f3a24-7c1e-4d6a-9f2b-8e4c3a1d5f6b';

/**
 * Deterministic listing_id for a preset entry. Given the same slug and
 * namespace, this always returns the same UUID — so the client can
 * address listings the seed script created without an RPC.
 */
export const presetListingId = (slug: string): string =>
    uuidv5(slug, PRESET_LISTING_NAMESPACE);

// ---------------------------------------------------------------------------
// AWS Cloud Practitioner demo bundle — keep slugs in sync with
// `PATHWAY_DEMO_PRESET` in the brain-service seed script.
// ---------------------------------------------------------------------------

export const AWS_DEMO_LISTING_SLUGS = {
    courseraEssentials: 'demo-coursera-aws-essentials',
    practiceStudio: 'demo-aws-practice-studio',
    cloudCoach: 'demo-aws-cloud-coach',
} as const;

export const AWS_DEMO_LISTING_IDS = {
    courseraEssentials: presetListingId(AWS_DEMO_LISTING_SLUGS.courseraEssentials),
    practiceStudio: presetListingId(AWS_DEMO_LISTING_SLUGS.practiceStudio),
    cloudCoach: presetListingId(AWS_DEMO_LISTING_SLUGS.cloudCoach),
} as const;

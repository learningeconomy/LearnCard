/**
 * Showcase registry — the ordered list of hand-authored demo bundles
 * the import modal exposes at the top of its browse view.
 *
 * Ordering: product-curated. The senior-year higher-ed pathway leads
 * because it demonstrates the widest feature surface (collections,
 * nested sub-pathways, real CE refs) in a narrative most reviewers
 * can evaluate at a glance. The Smart Start pathway follows as the
 * workforce-focused companion piece — same feature surface, different
 * destination shape (dual-track college + employment), different
 * provenance (Coursera / WEF rather than CE).
 *
 * Adding a new showcase:
 *   1. Author a `XxxShowcase.ts` module next to this index.
 *   2. Export a `ShowcaseDefinition` from it.
 *   3. Append the definition to `SHOWCASES` below.
 *   4. Add a preview / totals test mirroring the existing ones.
 */

import { SENIOR_YEAR_SHOWCASE } from './buildShowcase';
import { SMART_START_SHOWCASE } from './smartStartShowcase';
import { WHAT_IF_SHOWCASE } from './whatIfShowcase';
import type { ShowcaseDefinition } from './types';

export const SHOWCASES: readonly ShowcaseDefinition[] = [
    SENIOR_YEAR_SHOWCASE,
    SMART_START_SHOWCASE,
    WHAT_IF_SHOWCASE,
];

export type { ShowcaseBundle, ShowcaseDefinition, ShowcasePreview } from './types';

/**
 * catalog/catalog — the seed data for the pathway-browse view.
 *
 * Philosophy: this file is *hand-curated*. Every entry here is a real,
 * verified registry pathway we've decided is worth surfacing to a
 * learner who doesn't yet have a specific CTID in mind. The browse UI
 * renders these cards directly without fetching the full CTDL
 * document, so the summaries here are what a learner evaluates *before*
 * deciding to import.
 *
 * Adding an entry:
 *
 *   1. Verify the CTID resolves at
 *      `https://credentialengineregistry.org/resources/<ctid>` and
 *      returns `@type: "ceterms:Pathway"`.
 *   2. Copy `name` / `description` / `issuer` from the pathway's own
 *      `ceterms:name` / `ceterms:description` / publisher record —
 *      use the English variant of any language map.
 *   3. Pick 1–3 tags. Keep them Title-Cased and short ("AI", "Finance",
 *      "Healthcare"). The browse UI derives filter chips from the
 *      union of tags across the catalog.
 *   4. Add a representative hero `image` if the pathway or its
 *      destination credential has one (IMA uses Credly hosts).
 *   5. Count top-level components roughly if you have it; skip if not.
 *   6. Set `featured: true` for 1–5 entries at most — that's the "Start
 *      here" row on the landing view.
 *
 * This file is *not* user-editable at runtime. A later change will
 * swap `staticCatalogSource` for a live `ctdlCatalogSource` backed by
 * the registry's Graph Search API (once we have a server-side proxy
 * to hold the API key); at that point this seed acts as the "Featured"
 * row on top of the live results.
 */

import type { CatalogEntry } from './types';

export const CATALOG: ReadonlyArray<CatalogEntry> = [
    // -----------------------------------------------------------------
    // IMA · AI in Finance Micro-credential (verified, primary example)
    // -----------------------------------------------------------------
    //
    // This is the fan-in pathway that sparked the CTDL import work:
    // four badge-bearing components roll up into one Certificate. The
    // IMA records are well-formed and their proxy resolution exercises
    // the full importer path (subjectWebpage + image + description all
    // live on the proxied `ceterms:Badge`, not on the component).
    {
        ctid: 'ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf',
        name: 'AI in Finance Micro-credential',
        description:
            'Four foundational badges in AI, data literacy, analytics, and ethics build to a comprehensive AI-in-Finance micro-credential certificate from IMA.',
        issuer: 'Institute of Management Accountants (IMA)',
        issuerUrl: 'https://www.imanet.org/',
        credentialType: 'Micro-credential',
        tags: ['AI', 'Finance', 'Professional'],
        image:
            'https://images.credly.com/images/c7fe84a3-9a09-4ad8-81d8-0a0fc9b3ab2a/image.png',
        componentCount: 5,
        featured: true,
    },

    // -----------------------------------------------------------------
    // Add more verified entries here. Keep alphabetical within the
    // non-featured block so diffs read naturally; featured entries can
    // sit at the top in editorial order (most important first).
    // -----------------------------------------------------------------
];

/**
 * True when the catalog has at least one entry. A guard the browse UI
 * uses to decide whether to show the "empty catalog" copy and push
 * the direct-CTID input up front.
 */
export const CATALOG_HAS_ENTRIES = CATALOG.length > 0;

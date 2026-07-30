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

    // -----------------------------------------------------------------
    // Chaffey College · Critical Thinking
    // -----------------------------------------------------------------
    //
    // Higher-ed workforce-skill badge. Description is lifted straight
    // from the registry (it's a full sentence there, which is rare).
    // Single-node pathway in the registry — learners who import it
    // get a one-step pathway wrapping the skill attestation.
    {
        ctid: 'ce-0c42a2fe-3b36-40e3-b177-e1c5ceba257e',
        name: 'Critical Thinking',
        description:
            'Awarded to Chaffey College learners who understand and demonstrate the importance of being a problem solver in the workplace.',
        issuer: 'Chaffey College',
        issuerUrl: 'https://www.chaffey.edu/',
        credentialType: 'Workforce Skill',
        tags: ['Workforce Skills', 'Higher Education'],
        featured: false,
    },

    // -----------------------------------------------------------------
    // NYC Public Schools · Future Ready NYC (career pathways)
    // -----------------------------------------------------------------
    //
    // Three career pathways from NYC DOE's Future Ready NYC initiative
    // for high-school students. The registry records carry only the
    // pathway name in `ceterms:description`, so the copy below is
    // kept deliberately minimal and grounded in the pathway name +
    // owner — no fabricated program details.
    {
        ctid: 'ce-0209da38-3aa8-4e9d-8b51-93e16fc9cb9a',
        name: 'Future Ready NYC — Cybersecurity',
        description:
            'A NYC Public Schools high-school career pathway preparing students for Information Security Analyst roles through work-based learning.',
        issuer: 'New York City Public Schools',
        issuerUrl: 'https://www.schools.nyc.gov/',
        credentialType: 'Career Pathway',
        tags: ['Cybersecurity', 'K-12', 'Career Readiness'],
        featured: false,
    },
    {
        ctid: 'ce-5a76a624-21b3-4c7e-9495-0b8c913cad37',
        name: 'Future Ready NYC — Data Science',
        description:
            'A NYC Public Schools high-school career pathway introducing students to data-science roles and early-career credentials.',
        issuer: 'New York City Public Schools',
        issuerUrl: 'https://www.schools.nyc.gov/',
        credentialType: 'Career Pathway',
        tags: ['Data Science', 'K-12', 'Career Readiness'],
        featured: false,
    },
    {
        ctid: 'ce-0f0af1dd-35c7-43e2-9363-6bc079508747',
        name: 'Future Ready NYC — Software Development',
        description:
            'A NYC Public Schools high-school career pathway introducing students to software-development roles and early-career credentials.',
        issuer: 'New York City Public Schools',
        issuerUrl: 'https://www.schools.nyc.gov/',
        credentialType: 'Career Pathway',
        tags: ['Technology', 'K-12', 'Career Readiness'],
        featured: false,
    },
];

/**
 * True when the catalog has at least one entry. A guard the browse UI
 * uses to decide whether to show the "empty catalog" copy and push
 * the direct-CTID input up front.
 */
export const CATALOG_HAS_ENTRIES = CATALOG.length > 0;

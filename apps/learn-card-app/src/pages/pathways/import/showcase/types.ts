/**
 * Shared types for the showcase system.
 *
 * A "showcase" is a hand-authored multi-pathway bundle that
 * demonstrates a narrative end-to-end (skills → credentials → jobs
 * or the like) using the advanced pathway features (composites,
 * collections, routes, endorsements). Each showcase is presented as
 * a clickable card in the Import modal.
 *
 * This file exists so we can keep adding showcases without growing a
 * switch/case in the modal: every showcase module exports a
 * `ShowcaseDefinition` that bundles the card metadata with a pure
 * builder, and the modal iterates a central `SHOWCASES` array.
 */

import type { Pathway } from '../../types';

/**
 * Opaque metadata shown on the showcase card *before* the bundle is
 * instantiated. Hand-curated so the card renders instantly (no need
 * to call the builder just to show a card), and kept in-sync with
 * the bundle via a "preview totals match realized" test.
 */
export interface ShowcasePreview {
    /** Card title. Shown as the primary pathway title in the UI too. */
    title: string;
    /** One-sentence narrative summary shown in the card body. */
    description: string;
    /** Optional one-word context label — e.g. "Higher ed", "Workforce". */
    audience?: string;
    /** Total step count across primary + supporting pathways. */
    totalStepCount: number;
    /** Number of supporting (sub-) pathways the bundle ships. */
    subPathwayCount: number;
    /**
     * Short feature tags shown as pills at the bottom of the card —
     * e.g. "Composite pathways", "Nested sub-pathway". Kept
     * UI-friendly (Title Case, < 4 words each).
     */
    featureTags: readonly string[];
}

export interface ShowcaseBundle {
    /** The pathway the learner lands on after import. */
    primary: Pathway;
    /** Sub-pathways referenced (composite / nested). Upsert before primary. */
    supporting: Pathway[];
}

export interface BuildShowcaseOptions {
    ownerDid: string;
    /** ISO timestamp — stamped onto `createdAt` / `updatedAt`. */
    now?: string;
    /** UUID factory; defaults to `crypto.randomUUID`. Pass in tests. */
    generateId?: () => string;
}

/**
 * Full definition of a showcase — card metadata + pure builder
 * function. Each showcase module exports one of these.
 */
export interface ShowcaseDefinition {
    /** Stable id; becomes `templateRef` on every pathway in the bundle. */
    id: string;
    /** Card metadata (title, description, tags, totals). */
    preview: ShowcasePreview;
    /** Pure function that realizes the bundle with fresh UUIDs. */
    build: (opts: BuildShowcaseOptions) => ShowcaseBundle;
}

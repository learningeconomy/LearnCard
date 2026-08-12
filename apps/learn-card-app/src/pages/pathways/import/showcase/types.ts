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
     * Short feature tags — e.g. "Composite pathways", "Nested
     * sub-pathway". Historically shown as pills on the card; kept on
     * the shape so the Build > Import catalog can still surface them
     * to authors, but the front-door ShowcaseCard no longer renders
     * them (learner-facing jargon cleanup). UI-friendly
     * (Title Case, < 4 words each).
     */
    featureTags: readonly string[];
    /**
     * Ionicons name (e.g. `schoolOutline`, `briefcaseOutline`) used as
     * the card's left-hand icon. Lets each showcase feel distinct
     * at a glance rather than three identical layered-stack tiles.
     * Optional so older showcases still render with a sensible
     * default (layers icon) if not upgraded yet.
     */
    icon?: string;
    /**
     * Rough time estimate for the whole journey — e.g. "~6 weeks",
     * "≈ 4 hours". Shown alongside the step count so learners get a
     * commitment signal, not just a structural one. Intentionally a
     * free-text string (not a strict enum / minutes int) so authors
     * can phrase the estimate in whatever way reads honestly —
     * "4-6 weeks of evenings" vs "1 afternoon".
     */
    estimatedDuration?: string;
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

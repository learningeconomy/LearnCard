/**
 * Registry metadata for every `NodeRequirement` kind.
 *
 * Used by the `RequirementEditor` dropdown, the summariser, and any
 * future picker UI that needs a user-facing name/icon/blurb for a
 * kind. Mirrors the pattern in `policy/registry.ts` and
 * `termination/registry.ts`.
 *
 * Each entry carries:
 *   - `label`    — short, jargon-free name for the dropdown.
 *   - `icon`     — Ionicon name for any inline affordance.
 *   - `blurb`    — one-sentence explainer shown under the dropdown.
 *   - `category` — grouping for the `<optgroup>` layout. The four
 *                  categories line up with how authors think about
 *                  matching in practice:
 *                    * `identity`      — "which credential?"
 *                    * `standards`     — "what framework?"
 *                    * `skills-scores` — "what claim?"
 *                    * `combinator`    — "any/all of these?"
 *
 * `defaultRequirement` is the seed value used whenever the author
 * switches to a new kind. All leaf defaults carry Zod-invalid empty
 * strings so the author is dropped onto a blank form; composite
 * defaults carry exactly one child so the `of: z.array().min(1)`
 * invariant is satisfied the instant the kind is picked.
 */

import {
    analyticsOutline,
    checkmarkDoneOutline,
    fingerPrintOutline,
    gitCompareOutline,
    layersOutline,
    optionsOutline,
    pricetagOutline,
    ribbonOutline,
    sparklesOutline,
    trophyOutline,
} from 'ionicons/icons';

import type { NodeRequirement } from '../../types';

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export type RequirementCategoryId =
    | 'identity'
    | 'standards'
    | 'skills-scores'
    | 'combinator';

export interface RequirementCategoryMeta {
    id: RequirementCategoryId;
    label: string;
    /**
     * A one-liner describing what kinds live in this group, used as a
     * help hint under the dropdown when the selected kind belongs to
     * this group. Keeps the author grounded without adding clutter.
     */
    hint: string;
}

export const REQUIREMENT_CATEGORIES: readonly RequirementCategoryMeta[] = [
    {
        id: 'identity',
        label: 'Credential identity',
        hint: 'Pin a specific credential by type, boost URI, or issuer-scoped id.',
    },
    {
        id: 'standards',
        label: 'Standards',
        hint: 'Match against a registry identifier or standards alignment.',
    },
    {
        id: 'skills-scores',
        label: 'Skills & scores',
        hint: 'Match by skill tag or by a numeric score field on the VC.',
    },
    {
        id: 'combinator',
        label: 'Combine multiple',
        hint: 'AND/OR two or more requirements to express richer rules.',
    },
];

// ---------------------------------------------------------------------------
// Per-kind metadata
// ---------------------------------------------------------------------------

export interface RequirementKindMeta {
    kind: NodeRequirement['kind'];
    label: string;
    icon: string;
    blurb: string;
    category: RequirementCategoryId;
}

export const REQUIREMENT_KIND_META: Record<
    NodeRequirement['kind'],
    RequirementKindMeta
> = {
    'credential-type': {
        kind: 'credential-type',
        label: 'Credential type',
        icon: ribbonOutline,
        blurb: 'Match by the VC\u2019s `type` string, optionally pinned to an issuer.',
        category: 'identity',
    },
    'boost-uri': {
        kind: 'boost-uri',
        label: 'LearnCard boost URI',
        icon: sparklesOutline,
        blurb: 'Exact match on a canonical LearnCard boost wallet URI.',
        category: 'identity',
    },
    'issuer-credential-id': {
        kind: 'issuer-credential-id',
        label: 'Issuer + credential id',
        icon: fingerPrintOutline,
        blurb: 'Pin a credential by its W3C `id` scoped to an issuer DID.',
        category: 'identity',
    },
    'ctdl-ctid': {
        kind: 'ctdl-ctid',
        label: 'Credential Engine CTID',
        icon: layersOutline,
        blurb: 'Match against a Credential Engine Registry CTID.',
        category: 'standards',
    },
    'ob-achievement': {
        kind: 'ob-achievement',
        label: 'OpenBadges achievement',
        icon: trophyOutline,
        blurb: 'Match by OBv3 `achievement.id` across any issuer.',
        category: 'standards',
    },
    'ob-alignment': {
        kind: 'ob-alignment',
        label: 'OpenBadges alignment',
        icon: gitCompareOutline,
        blurb: 'Match any VC aligned to a framework target URL.',
        category: 'standards',
    },
    'skill-tag': {
        kind: 'skill-tag',
        label: 'Skill tag',
        icon: pricetagOutline,
        blurb: 'Match by a normalised skill tag URI or local tag name.',
        category: 'skills-scores',
    },
    'score-threshold': {
        kind: 'score-threshold',
        label: 'Score threshold',
        icon: analyticsOutline,
        blurb: 'A credential whose numeric field clears a threshold.',
        category: 'skills-scores',
    },
    'any-of': {
        kind: 'any-of',
        label: 'Any of \u2026 (OR)',
        icon: optionsOutline,
        blurb: 'Satisfied when at least one child requirement matches.',
        category: 'combinator',
    },
    'all-of': {
        kind: 'all-of',
        label: 'All of \u2026 (AND)',
        icon: checkmarkDoneOutline,
        blurb: 'Satisfied only when every child requirement matches.',
        category: 'combinator',
    },
};

/**
 * Ordered list, author-facing. Order inside each category is by
 * expected frequency; categories themselves are ordered by "most
 * concrete first" so the author starts with the simplest match
 * (type + issuer) before drilling into standards/skills/combinators.
 */
export const REQUIREMENT_KIND_LIST: readonly RequirementKindMeta[] = [
    // identity
    REQUIREMENT_KIND_META['credential-type'],
    REQUIREMENT_KIND_META['boost-uri'],
    REQUIREMENT_KIND_META['issuer-credential-id'],
    // standards
    REQUIREMENT_KIND_META['ctdl-ctid'],
    REQUIREMENT_KIND_META['ob-achievement'],
    REQUIREMENT_KIND_META['ob-alignment'],
    // skills-scores
    REQUIREMENT_KIND_META['skill-tag'],
    REQUIREMENT_KIND_META['score-threshold'],
    // combinators (last \u2014 power-user territory)
    REQUIREMENT_KIND_META['any-of'],
    REQUIREMENT_KIND_META['all-of'],
];

// ---------------------------------------------------------------------------
// Default seeds
// ---------------------------------------------------------------------------

/**
 * Seed value for a freshly-picked kind. Leaf defaults use Zod-invalid
 * empty strings so the author is dropped onto a blank form they must
 * fill in (publish-time validation catches the emptiness); composite
 * defaults seed exactly one child so `of.min(1)` is satisfied the
 * instant the kind is picked.
 */
export const defaultRequirement = (
    kind: NodeRequirement['kind'],
): NodeRequirement => {
    switch (kind) {
        case 'credential-type':
            return { kind: 'credential-type', type: '' };

        case 'boost-uri':
            return { kind: 'boost-uri', uri: '' };

        case 'ctdl-ctid':
            return { kind: 'ctdl-ctid', ctid: '' };

        case 'issuer-credential-id':
            return {
                kind: 'issuer-credential-id',
                issuerDid: '',
                credentialId: '',
            };

        case 'ob-achievement':
            return { kind: 'ob-achievement', achievementId: '' };

        case 'ob-alignment':
            return { kind: 'ob-alignment', targetUrl: '' };

        case 'skill-tag':
            return { kind: 'skill-tag', tag: '' };

        case 'score-threshold':
            return {
                kind: 'score-threshold',
                type: '',
                field: 'credentialSubject.score',
                op: '>=',
                value: 0,
            };

        case 'any-of':
            return {
                kind: 'any-of',
                of: [{ kind: 'credential-type', type: '' }],
            };

        case 'all-of':
            return {
                kind: 'all-of',
                of: [{ kind: 'credential-type', type: '' }],
            };
    }
};

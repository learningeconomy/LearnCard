/**
 * Requirement-satisfied termination — the node completes when a
 * wallet credential (or other evidence) satisfies a `NodeRequirement`
 * predicate.
 *
 * ## Authoring surface
 *
 * The full `NodeRequirement` DSL is authorable inline. Leaf kinds
 * (`credential-type`, `boost-uri`, `ctdl-ctid`, `issuer-credential-id`,
 * `ob-achievement`, `ob-alignment`, `skill-tag`, `score-threshold`)
 * plus the recursive composites (`any-of`, `all-of`) all have
 * dedicated editors in `../requirement/`. This spec is intentionally
 * thin — a trust-tier picker + a live summary preview wrapping the
 * reusable `RequirementEditor`.
 *
 * The separation matters: every surface that wants to let an author
 * build a `NodeRequirement` (not just terminations — future
 * OutcomeSignal editors, proposal pickers, etc.) can drop in the
 * same `RequirementEditor` without re-implementing the kind picker
 * or the composite recursion.
 *
 * ## Selectability
 *
 * Author-selectable from the termination dropdown: yes. Picking it
 * from a blank node seeds the default `credential-type` requirement
 * with an empty `type` string — the author fills in the specifics
 * in the editor below. `minTrustTier` defaults to `'trusted'`
 * (registered LearnCard partner), matching the same default used
 * by the outcome binder.
 */

import React from 'react';

import { ribbonOutline } from 'ionicons/icons';

import type { NodeRequirement, Termination } from '../../types';
import type { OutcomeTrustTier } from '../../types/outcome';

import { INPUT, LABEL } from '../shared/inputs';
import { RequirementEditor } from '../requirement/RequirementEditor';
import { summarizeRequirement } from '../requirement/summarize';

import type { TerminationKindSpec } from './types';

// ---------------------------------------------------------------------------
// Trust-tier picker — shared field alongside the NodeRequirement DSL.
//
// Lives on the *termination* (not the requirement), mirroring the
// outcome-binding model: the matcher's job is "does this evidence
// satisfy the predicate?", the binder's job is "given that it does,
// should we trust the issuer enough to record the completion?".
// Four tiers, same ordering used by `core/outcomeMatcher` — self <
// peer < trusted < institution.
// ---------------------------------------------------------------------------

const TRUST_TIER_OPTIONS: ReadonlyArray<{
    value: OutcomeTrustTier;
    label: string;
    hint: string;
}> = [
    { value: 'self', label: 'Self', hint: 'The learner says so' },
    { value: 'peer', label: 'Peer', hint: 'Another learner or endorser' },
    {
        value: 'trusted',
        label: 'Trusted',
        hint: 'Registered LearnCard partner',
    },
    {
        value: 'institution',
        label: 'Institution',
        hint: 'Accredited issuer',
    },
];

// ---------------------------------------------------------------------------
// Top-level editor
//
// Thin wrapper around the reusable `RequirementEditor`:
//
//   1. Live summary card at the top — renders the human-readable
//      one-liner from `summarizeRequirement`. Gives the author a
//      mental checkpoint ("am I building what I think I am?") at a
//      glance without having to re-derive it from deep composite
//      trees.
//
//   2. The `RequirementEditor` itself, at `depth: 0`. Authors get
//      the full DSL here — every leaf kind plus the recursive
//      any-of/all-of composites.
//
//   3. Trust-tier picker beneath the editor, shared by every
//      requirement kind (it lives on the termination, not the
//      requirement).
// ---------------------------------------------------------------------------

const RequirementSatisfiedEditor: React.FC<{
    value: Extract<Termination, { kind: 'requirement-satisfied' }>;
    onChange: (next: Termination) => void;
}> = ({ value, onChange }) => {
    const handleRequirementChange = (requirement: NodeRequirement) =>
        onChange({ ...value, requirement });

    const handleTrustTier = (minTrustTier: OutcomeTrustTier) =>
        onChange({ ...value, minTrustTier });

    return (
        <div className="space-y-4">
            <SummaryCard
                requirement={value.requirement}
                minTrustTier={value.minTrustTier}
            />

            <RequirementEditor
                value={value.requirement}
                onChange={handleRequirementChange}
            />

            <div className="space-y-1.5">
                <label className={LABEL} htmlFor="req-trust">
                    Minimum trust level
                </label>

                <select
                    id="req-trust"
                    className={INPUT}
                    value={value.minTrustTier}
                    onChange={e =>
                        handleTrustTier(e.target.value as OutcomeTrustTier)
                    }
                >
                    {TRUST_TIER_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label} — {opt.hint}
                        </option>
                    ))}
                </select>

                <p className="text-[11px] text-grayscale-500 leading-snug">
                    Only credentials from issuers at this tier or higher will
                    complete the step. Tiers stack: institution clears
                    trusted, trusted clears peer, and so on.
                </p>
            </div>
        </div>
    );
};

/**
 * Summary card — a compact emerald-tinted strip showing the
 * human-readable matching rule. Re-renders on every keystroke via
 * the shared `summarizeRequirement` helper, which handles composite
 * depth and bracketed grouping so deeply-nested rules still read as
 * sentences rather than as a wall of `any of: (all of: …)` noise.
 */
const SummaryCard: React.FC<{
    requirement: NodeRequirement;
    minTrustTier: OutcomeTrustTier;
}> = ({ requirement, minTrustTier }) => (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
        <div className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-600 text-white">
            <svg
                aria-hidden
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polyline points="20 6 9 17 4 12" />
            </svg>
        </div>

        <div className="min-w-0 flex-1 text-xs text-grayscale-800 leading-relaxed">
            <p>
                <span className="font-medium">Completes when</span> the
                learner's wallet receives{' '}
                <span className="font-medium">
                    {summarizeRequirement(requirement)}
                </span>
                .
            </p>
            <p className="mt-1 text-[11px] text-emerald-700">
                Issuer trust: <span className="font-medium">{minTrustTier}</span>{' '}
                or higher.
            </p>
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Spec registration
// ---------------------------------------------------------------------------

const requirementSatisfiedSpec: TerminationKindSpec<'requirement-satisfied'> = {
    kind: 'requirement-satisfied',
    label: 'Earn a credential',
    icon: ribbonOutline,
    blurb: 'Done when a qualifying credential lands in the wallet.',
    // Author-selectable: the full `NodeRequirement` DSL is authorable
    // inline via `RequirementEditor`. Picking this from the dropdown
    // seeds the default `credential-type` requirement with an empty
    // `type` string — the author fills in the specifics below, or
    // switches to one of the other 9 kinds via the grouped picker
    // inside the requirement editor.
    selectable: true,

    default: () => ({
        kind: 'requirement-satisfied',
        requirement: {
            kind: 'credential-type',
            type: '',
        },
        minTrustTier: 'trusted',
    }),

    Editor: ({ value, onChange }) => (
        <RequirementSatisfiedEditor value={value} onChange={onChange} />
    ),

    summarize: value => `Earn: ${summarizeRequirement(value.requirement)}`,
};

export default requirementSatisfiedSpec;

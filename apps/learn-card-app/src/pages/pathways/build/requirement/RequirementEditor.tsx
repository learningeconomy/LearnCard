/**
 * `RequirementEditor` — recursive authoring UI for the full
 * `NodeRequirement` DSL.
 *
 * ## Surface
 *
 * A single component that renders:
 *   1. A grouped kind picker (identity / standards / skills &
 *      scores / combinators) implemented as a native
 *      `<select><optgroup>`. Native = cheap, accessible, mobile-
 *      friendly, and matches every other dropdown in the Builder.
 *   2. The kind's variant body — either one of the 8 leaf editors
 *      from `leaves.tsx` or, for `any-of` / `all-of`, the inline
 *      `CompositeEditor` which recurses back into
 *      `RequirementEditor` for each child.
 *
 * ## Recursion
 *
 * There's no explicit depth cap in the schema (unlimited nesting
 * is a valid, if rare, authoring choice). The UI doesn't enforce
 * one either, but it carries a `depth` prop so nested composites
 * can tint their background and indent their left edge, making the
 * tree scannable at a glance. Kind selects and field help text also
 * stay unchanged at every depth — consistency over cleverness.
 *
 * Kind switch across a composite boundary **preserves the subtree
 * where possible**: switching `any-of` ↔ `all-of` keeps the same
 * `of` children; switching composite → leaf resets to the default
 * leaf shape (the children have no home to land in); switching leaf
 * → composite seeds a single child with the previous leaf's value,
 * so flipping "credential type match" to "any of" keeps the type
 * the author just typed. Small detail, big UX.
 *
 * ## Validation
 *
 * Per-field format warnings live inside each leaf component
 * (`leaves.tsx`). The editor shell here deliberately does NOT gate
 * the author's input — empty required fields are still allowed
 * in-flight, matching the rest of the Builder. Publish-time
 * validation (`validatePathway`) is the single place we refuse to
 * ship.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { addOutline, closeOutline } from 'ionicons/icons';

import type { NodeRequirement } from '../../types';

import { INPUT, LABEL } from '../shared/inputs';

import {
    REQUIREMENT_CATEGORIES,
    REQUIREMENT_KIND_LIST,
    REQUIREMENT_KIND_META,
    defaultRequirement,
    type RequirementCategoryMeta,
} from './registry';
import { summarizeRequirement } from './summarize';
import {
    BoostUriLeaf,
    CredentialTypeLeaf,
    CtdlCtidLeaf,
    IssuerCredentialIdLeaf,
    ObAchievementLeaf,
    ObAlignmentLeaf,
    ScoreThresholdLeaf,
    SkillTagLeaf,
} from './leaves';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RequirementEditorProps {
    value: NodeRequirement;
    onChange: (next: NodeRequirement) => void;
    /**
     * Nesting depth — 0 at the top level, +1 per composite layer.
     * Drives the visual indent/tint on nested composites. Omit at
     * the top level; the editor passes the correct value through
     * to its recursive children automatically.
     */
    depth?: number;
}

export const RequirementEditor: React.FC<RequirementEditorProps> = ({
    value,
    onChange,
    depth = 0,
}) => {
    const handleKindChange = (nextKind: NodeRequirement['kind']) => {
        if (nextKind === value.kind) return;
        onChange(switchKind(value, nextKind));
    };

    return (
        <div className="space-y-3">
            <KindPicker value={value.kind} onChange={handleKindChange} />

            <div>
                <VariantBody
                    value={value}
                    onChange={onChange}
                    depth={depth}
                />
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Kind switch — preserve subtree where sensible
// ---------------------------------------------------------------------------

/**
 * Switch `current` to `nextKind`, preserving fields where the switch
 * is semantically meaningful:
 *
 *   - `any-of` ↔ `all-of` — same children, just the combinator.
 *   - leaf → composite   — wrap the current leaf as the sole child
 *                          of the new composite (the `of.min(1)`
 *                          invariant is satisfied naturally).
 *
 * Otherwise seed the default (leaf → other leaf, composite → leaf,
 * etc.). We never attempt cross-leaf field carryover (type → CTID
 * for example) because the fields have no semantic relationship —
 * a `type` of "AwsCloudEssentialsCompletion" is not a valid CTID.
 */
const switchKind = (
    current: NodeRequirement,
    nextKind: NodeRequirement['kind'],
): NodeRequirement => {
    // Composite ↔ composite — keep children.
    if (
        (current.kind === 'any-of' && nextKind === 'all-of')
        || (current.kind === 'all-of' && nextKind === 'any-of')
    ) {
        return { kind: nextKind, of: current.of } as NodeRequirement;
    }

    // Leaf → composite — wrap the current leaf as the sole child.
    if (
        current.kind !== 'any-of'
        && current.kind !== 'all-of'
        && (nextKind === 'any-of' || nextKind === 'all-of')
    ) {
        return { kind: nextKind, of: [current] } as NodeRequirement;
    }

    return defaultRequirement(nextKind);
};

// ---------------------------------------------------------------------------
// Grouped kind picker
// ---------------------------------------------------------------------------

const KindPicker: React.FC<{
    value: NodeRequirement['kind'];
    onChange: (next: NodeRequirement['kind']) => void;
}> = ({ value, onChange }) => {
    const currentMeta = REQUIREMENT_KIND_META[value];
    const currentCategory = REQUIREMENT_CATEGORIES.find(
        c => c.id === currentMeta.category,
    );

    return (
        <div className="space-y-1.5">
            <label className={LABEL} htmlFor="requirement-kind">
                Match this credential by
            </label>

            <select
                id="requirement-kind"
                className={INPUT}
                value={value}
                onChange={e =>
                    onChange(e.target.value as NodeRequirement['kind'])
                }
            >
                {REQUIREMENT_CATEGORIES.map(category => (
                    <OptGroupForCategory
                        key={category.id}
                        category={category}
                    />
                ))}
            </select>

            {/*
                Under-select help line: a tight one-liner combining
                the current kind's blurb and its category hint. Keeps
                the author oriented without an info-overload help
                tooltip. The category hint is load-bearing when the
                kind is unfamiliar (e.g. "ob-alignment" means little
                until paired with "standards — match against a
                framework alignment").
            */}
            <p className="text-[11px] text-grayscale-500 leading-snug">
                {currentMeta.blurb}
                {currentCategory && (
                    <>
                        {' '}
                        <span className="text-grayscale-400">
                            · {currentCategory.hint}
                        </span>
                    </>
                )}
            </p>
        </div>
    );
};

const OptGroupForCategory: React.FC<{ category: RequirementCategoryMeta }> = ({
    category,
}) => {
    const kinds = REQUIREMENT_KIND_LIST.filter(
        meta => meta.category === category.id,
    );

    return (
        <optgroup label={category.label}>
            {kinds.map(meta => (
                <option key={meta.kind} value={meta.kind}>
                    {meta.label}
                </option>
            ))}
        </optgroup>
    );
};

// ---------------------------------------------------------------------------
// Variant body dispatch
// ---------------------------------------------------------------------------

const VariantBody: React.FC<RequirementEditorProps> = ({
    value,
    onChange,
    depth = 0,
}) => {
    switch (value.kind) {
        case 'credential-type':
            return <CredentialTypeLeaf value={value} onChange={onChange} />;

        case 'boost-uri':
            return <BoostUriLeaf value={value} onChange={onChange} />;

        case 'ctdl-ctid':
            return <CtdlCtidLeaf value={value} onChange={onChange} />;

        case 'issuer-credential-id':
            return (
                <IssuerCredentialIdLeaf value={value} onChange={onChange} />
            );

        case 'ob-achievement':
            return <ObAchievementLeaf value={value} onChange={onChange} />;

        case 'ob-alignment':
            return <ObAlignmentLeaf value={value} onChange={onChange} />;

        case 'skill-tag':
            return <SkillTagLeaf value={value} onChange={onChange} />;

        case 'score-threshold':
            return <ScoreThresholdLeaf value={value} onChange={onChange} />;

        case 'any-of':
        case 'all-of':
            return (
                <CompositeEditor
                    value={value}
                    onChange={onChange}
                    depth={depth}
                />
            );
    }
};

// ---------------------------------------------------------------------------
// Composite editor — any-of / all-of with add/remove children
// ---------------------------------------------------------------------------

interface CompositeEditorProps {
    value: Extract<NodeRequirement, { kind: 'any-of' | 'all-of' }>;
    onChange: (next: NodeRequirement) => void;
    depth: number;
}

const CompositeEditor: React.FC<CompositeEditorProps> = ({
    value,
    onChange,
    depth,
}) => {
    const label = value.kind === 'any-of' ? 'Any of' : 'All of';
    const opposite = value.kind === 'any-of' ? 'all-of' : 'any-of';

    const canRemove = value.of.length > 1; // `of` has z.array().min(1)

    const patchChild = (index: number, next: NodeRequirement) => {
        const updated = value.of.slice();
        updated[index] = next;

        onChange({ ...value, of: updated });
    };

    const addChild = () => {
        onChange({
            ...value,
            of: [...value.of, { kind: 'credential-type', type: '' }],
        });
    };

    const removeChild = (index: number) => {
        if (!canRemove) return;

        const updated = value.of.filter((_, i) => i !== index);

        // If the author removes down to a single child, the composite
        // becomes structurally redundant — the summariser already
        // flattens single-child composites. We deliberately DON'T
        // auto-unwrap here: the author might be mid-edit and add
        // another child next. The summary stays honest either way.
        onChange({ ...value, of: updated });
    };

    // Visual nesting — composites get a subtle left accent stripe
    // and a barely-there bg tint, cumulative with depth. Keeps the
    // tree readable without resorting to "Level 3 →" breadcrumbs.
    const containerBg =
        depth === 0
            ? 'bg-grayscale-10'
            : depth === 1
              ? 'bg-grayscale-100'
              : 'bg-grayscale-200/60';

    return (
        <div
            className={`
                rounded-xl border border-grayscale-200
                ${containerBg}
                p-3 space-y-3
                border-l-4 border-l-emerald-300
            `}
        >
            {/* Header — mode toggle (any ↔ all) */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-grayscale-800">
                    <span>{label}</span>
                    <span className="text-grayscale-400 font-normal">
                        ({value.of.length})
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() =>
                        onChange({
                            kind: opposite,
                            of: value.of,
                        } as NodeRequirement)
                    }
                    className="text-[11px] text-grayscale-600 hover:text-grayscale-900 transition-colors underline underline-offset-2"
                    title={
                        value.kind === 'any-of'
                            ? 'Switch to require all'
                            : 'Switch to require any'
                    }
                >
                    {value.kind === 'any-of'
                        ? 'Switch to all'
                        : 'Switch to any'}
                </button>
            </div>

            {/* Children */}
            <ul className="space-y-2">
                {value.of.map((child, index) => (
                    <li
                        key={index}
                        className="rounded-lg bg-white border border-grayscale-200 p-3 relative"
                    >
                        {/*
                            Remove button — positioned top-right so it
                            doesn't compete with field labels. Disabled
                            (greyed out) when this is the only child,
                            because `of` has a min(1) invariant.
                        */}
                        <button
                            type="button"
                            onClick={() => removeChild(index)}
                            disabled={!canRemove}
                            aria-label="Remove this requirement"
                            title={
                                canRemove
                                    ? 'Remove this requirement'
                                    : 'At least one requirement is required'
                            }
                            className={`
                                absolute top-2 right-2
                                inline-flex items-center justify-center
                                w-6 h-6 rounded-full
                                text-grayscale-400 hover:text-red-600 hover:bg-red-50
                                disabled:opacity-30 disabled:hover:text-grayscale-400 disabled:hover:bg-transparent
                                transition-colors
                            `}
                        >
                            <IonIcon
                                icon={closeOutline}
                                aria-hidden
                                className="text-base"
                            />
                        </button>

                        {/*
                            Recursive editor for the child. `pr-8`
                            reserves space so fields don't crash into
                            the remove button on narrow viewports.
                        */}
                        <div className="pr-8">
                            <RequirementEditor
                                value={child}
                                onChange={next => patchChild(index, next)}
                                depth={depth + 1}
                            />
                        </div>

                        {/*
                            Compact preview under each child so authors
                            scanning the composite can see what each
                            row will match without mentally re-deriving
                            it from the fields.
                        */}
                        <p className="mt-2 pr-8 text-[11px] text-grayscale-500 italic truncate">
                            Matches: {summarizeRequirement(child, 1)}
                        </p>
                    </li>
                ))}
            </ul>

            {/* Add button */}
            <button
                type="button"
                onClick={addChild}
                className="
                    inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full
                    text-xs font-medium
                    bg-white border border-emerald-200 text-emerald-700
                    hover:bg-emerald-50 hover:border-emerald-300
                    transition-colors
                "
            >
                <IonIcon icon={addOutline} aria-hidden className="text-sm" />
                Add requirement
            </button>
        </div>
    );
};

/**
 * Requirement-satisfied termination — the node completes when a
 * wallet credential satisfies a `NodeRequirement` predicate.
 *
 * Not author-selectable from the dropdown in v0.5: the full
 * `NodeRequirement` DSL is complex enough (boost URIs, CTIDs, OB
 * alignments, composite AND/OR trees) that it needs a dedicated
 * picker rather than an inline editor squeezed into the inspector.
 * For now, these terminations are seeded by CTDL imports,
 * `ai-session` actions, and author tooling that knows the full DSL.
 *
 * The spec exists so the registry stays total over `Termination['kind']`
 * and so existing surfaces (summarize, list builders) can still read
 * the kind uniformly. The Editor is an explanatory read-only state.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import { informationCircleOutline, ribbonOutline } from 'ionicons/icons';

import type { NodeRequirement, Termination } from '../../types';

import type { TerminationKindSpec } from './types';

// ---------------------------------------------------------------------------
// Requirement summariser — a tight one-liner for each requirement
// kind. Mirrors the author-facing surfaces' terseness (no JSON).
// ---------------------------------------------------------------------------

const summariseRequirement = (requirement: NodeRequirement): string => {
    switch (requirement.kind) {
        case 'credential-type':
            return requirement.issuer
                ? `${requirement.type} from ${requirement.issuer}`
                : requirement.type;

        case 'boost-uri':
            return `the boost at ${requirement.uri}`;

        case 'ctdl-ctid':
            return `CTDL credential ${requirement.ctid}`;

        case 'issuer-credential-id':
            return `credential ${requirement.credentialId} from ${requirement.issuerDid}`;

        case 'ob-achievement':
            return `the achievement ${requirement.achievementId}`;

        case 'ob-alignment':
            return `any credential aligned to ${requirement.targetUrl}`;

        case 'skill-tag':
            return `any credential tagged "${requirement.tag}"`;

        case 'score-threshold':
            return `${requirement.type} with ${requirement.field} ${requirement.op} ${requirement.value}`;

        case 'any-of':
            return `any of ${requirement.of.length} options`;

        case 'all-of':
            return `all of ${requirement.of.length} criteria`;
    }
};

// ---------------------------------------------------------------------------
// Editor — read-only explainer (authoring UI lands in a later phase).
// ---------------------------------------------------------------------------

const RequirementSatisfiedEditor: React.FC<{
    value: Extract<Termination, { kind: 'requirement-satisfied' }>;
    onChange: (next: Termination) => void;
}> = ({ value }) => (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-grayscale-10 border border-grayscale-200">
        <IonIcon
            icon={informationCircleOutline}
            aria-hidden
            className="text-grayscale-500 text-base mt-0.5 shrink-0"
        />

        <div className="min-w-0 flex-1 text-xs text-grayscale-600 leading-relaxed">
            <p>
                Completes automatically when a matching credential lands in your
                wallet.
            </p>
            <p className="mt-1 text-grayscale-800">
                <span className="font-medium">Looking for:</span>{' '}
                <span>{summariseRequirement(value.requirement)}</span>
            </p>
            <p className="mt-1 text-grayscale-500">
                Trust tier: <span className="font-medium">{value.minTrustTier}</span>
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
    // Not user-pickable yet — the authoring UI for the full
    // NodeRequirement DSL lands alongside the pathway builder work
    // that introduces composite requirements. Today this kind is
    // seeded by CTDL import tools and `ai-session` composites.
    selectable: false,

    // Zod-invalid placeholder: callers that programmatically create
    // one of these always have a real requirement in hand. The
    // `default` exists so the registry contract is satisfied.
    default: () => ({
        kind: 'requirement-satisfied',
        requirement: {
            kind: 'credential-type',
            type: 'VerifiableCredential',
        },
        minTrustTier: 'trusted',
    }),

    Editor: ({ value, onChange }) => (
        <RequirementSatisfiedEditor value={value} onChange={onChange} />
    ),

    summarize: value => `Earn: ${summariseRequirement(value.requirement)}`,
};

export default requirementSatisfiedSpec;

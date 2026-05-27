/**
 * Hand-authored CTDL fixtures used by the import/projection tests.
 *
 * Two representative topologies cover the cases we care about for v1:
 *
 *   - **Linear**: A → B → C → Destination. Each component's
 *     `hasChild` encodes the ordering; no implicit fan-in.
 *   - **Fan-in**: A/B/C/D are top-level children of the pathway,
 *     and the pathway has a separate destination component. No
 *     component-level `hasChild` — the connection from each child
 *     to the destination is *implicit* from their both appearing on
 *     the pathway root. Mirrors IMA's *AI in Finance* micro-credential
 *     pathway (CTID `ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf`).
 *
 * Language maps (`{ "en-US": "..." }`) are used on some fields and
 * plain strings on others so the localization helper is exercised.
 */

import type { CtdlGraph } from './ctdlTypes';

const registry = 'https://credentialengineregistry.org/resources';

// ---------------------------------------------------------------------------
// Linear: 4 components in a strict chain
// ---------------------------------------------------------------------------

export const linearFixture: CtdlGraph = {
    pathway: {
        '@id': `${registry}/ce-linear-0000-0000-0000-000000000000`,
        '@type': 'ceterms:Pathway',
        'ceterms:ctid': 'ce-linear-0000-0000-0000-000000000000',
        'ceterms:name': { 'en-US': 'Foundations of Project Delivery' },
        'ceterms:description':
            'A linear sequence of four steps leading to a Project Delivery certificate.',
        'ceterms:hasChild': [{ '@id': `${registry}/ce-step-a` }],
        'ceterms:hasDestinationComponent': [
            { '@id': `${registry}/ce-step-destination` },
        ],
    },
    components: {
        [`${registry}/ce-step-a`]: {
            '@id': `${registry}/ce-step-a`,
            '@type': 'ceterms:CourseComponent',
            'ceterms:ctid': 'ce-step-a',
            'ceterms:name': 'Intro to Scope Management',
            'ceterms:description': { 'en-US': 'Learn to define scope.' },
            'ceterms:hasChild': [{ '@id': `${registry}/ce-step-b` }],
        },
        [`${registry}/ce-step-b`]: {
            '@id': `${registry}/ce-step-b`,
            '@type': 'ceterms:AssessmentComponent',
            'ceterms:ctid': 'ce-step-b',
            'ceterms:name': { 'en-US': 'Scope Management Quiz' },
            'ceterms:hasChild': [{ '@id': `${registry}/ce-step-c` }],
        },
        [`${registry}/ce-step-c`]: {
            '@id': `${registry}/ce-step-c`,
            '@type': 'ceterms:CompetencyComponent',
            'ceterms:ctid': 'ce-step-c',
            'ceterms:name': { 'en-US': 'Demonstrate Scope Planning' },
            'ceterms:hasChild': [{ '@id': `${registry}/ce-step-destination` }],
        },
        [`${registry}/ce-step-destination`]: {
            '@id': `${registry}/ce-step-destination`,
            '@type': 'ceterms:CredentialComponent',
            'ceterms:ctid': 'ce-step-destination',
            'ceterms:name': { 'en-US': 'Project Delivery Certificate' },
            'ceterms:description':
                'Awarded to learners who complete the full sequence.',
            'ceterms:credentialType': 'ceterms:Certificate',
        },
    },
};

// ---------------------------------------------------------------------------
// Fan-in: 4 parallel children → 1 destination
// ---------------------------------------------------------------------------

export const fanInFixture: CtdlGraph = {
    pathway: {
        '@id': `${registry}/ce-fanin-0000-0000-0000-000000000000`,
        '@type': 'ceterms:Pathway',
        'ceterms:ctid': 'ce-fanin-0000-0000-0000-000000000000',
        'ceterms:name': { 'en-US': 'AI in Finance - Micro-credential' },
        'ceterms:description':
            'Earn four topic-specific badges to unlock the AI in Finance Micro-credential Certificate.',
        'ceterms:hasChild': [
            { '@id': `${registry}/ce-fund-ai` },
            { '@id': `${registry}/ce-data-lit` },
            { '@id': `${registry}/ce-ethics` },
            { '@id': `${registry}/ce-applied` },
        ],
        'ceterms:hasDestinationComponent': [
            { '@id': `${registry}/ce-ai-finance-cert` },
        ],
    },
    components: {
        [`${registry}/ce-fund-ai`]: {
            '@id': `${registry}/ce-fund-ai`,
            '@type': 'ceterms:CredentialComponent',
            'ceterms:ctid': 'ce-fund-ai',
            'ceterms:name': { 'en-US': 'Fundamentals of AI Pathway' },
            'ceterms:credentialType': 'ceterms:Badge',
        },
        [`${registry}/ce-data-lit`]: {
            '@id': `${registry}/ce-data-lit`,
            '@type': 'ceterms:CredentialComponent',
            'ceterms:ctid': 'ce-data-lit',
            'ceterms:name': { 'en-US': 'Data Literacy for Finance Professionals' },
            'ceterms:credentialType': 'ceterms:Badge',
        },
        [`${registry}/ce-ethics`]: {
            '@id': `${registry}/ce-ethics`,
            '@type': 'ceterms:CredentialComponent',
            'ceterms:ctid': 'ce-ethics',
            'ceterms:name': { 'en-US': 'Ethics, Governance, and Regulation' },
            'ceterms:credentialType': 'ceterms:Badge',
        },
        [`${registry}/ce-applied`]: {
            '@id': `${registry}/ce-applied`,
            '@type': 'ceterms:CredentialComponent',
            'ceterms:ctid': 'ce-applied',
            'ceterms:name': { 'en-US': 'Applied AI in Finance' },
            'ceterms:credentialType': 'ceterms:Badge',
        },
        [`${registry}/ce-ai-finance-cert`]: {
            '@id': `${registry}/ce-ai-finance-cert`,
            '@type': 'ceterms:CredentialComponent',
            'ceterms:ctid': 'ce-ai-finance-cert',
            'ceterms:name': { 'en-US': 'AI in Finance Micro-credential Certificate' },
            'ceterms:credentialType': 'ceterms:Certificate',
            'ceterms:componentCategory': 'Destination',
        },
    },
};

// ---------------------------------------------------------------------------
// Fixture with SelectionComponent + conditions, to exercise warnings
// ---------------------------------------------------------------------------

export const selectionFixture: CtdlGraph = {
    pathway: {
        '@id': `${registry}/ce-sel-0000-0000-0000-000000000000`,
        '@type': 'ceterms:Pathway',
        'ceterms:ctid': 'ce-sel-0000-0000-0000-000000000000',
        'ceterms:name': 'Select-N Example',
        'ceterms:hasChild': [{ '@id': `${registry}/ce-pick` }],
        'ceterms:hasDestinationComponent': [
            { '@id': `${registry}/ce-sel-dest` },
        ],
    },
    components: {
        [`${registry}/ce-pick`]: {
            '@id': `${registry}/ce-pick`,
            '@type': 'ceterms:SelectionComponent',
            'ceterms:ctid': 'ce-pick',
            'ceterms:name': 'Pick any 2 of 4 electives',
            'ceterms:hasChild': [{ '@id': `${registry}/ce-sel-dest` }],
            'ceterms:hasCondition': [{ '@id': `${registry}/ce-condition-1` }],
        },
        [`${registry}/ce-sel-dest`]: {
            '@id': `${registry}/ce-sel-dest`,
            '@type': 'ceterms:CredentialComponent',
            'ceterms:ctid': 'ce-sel-dest',
            'ceterms:name': 'Specialist Badge',
        },
    },
};

// ---------------------------------------------------------------------------
// IMA "AI in Finance" — real-shape fixture
//
// Matches the exact vocabulary emitted by the live Credential Engine
// Registry for `ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf`:
//
//   - Uses `ceterms:hasPart` (not `hasChild`) at the pathway root.
//   - Refs are **bare URI strings**, not `{'@id': uri}` objects.
//   - The destination URI appears in both `hasPart` AND
//     `hasDestinationComponent`.
//   - Components are not yet hydrated here (we only exercise the
//     root's shape). `fromCtdlPathway` tolerates missing components
//     by emitting a warning and skipping them, so this fixture's
//     role is to prove the *root shape* parses correctly.
//
// This fixture exists because an earlier version of the importer
// assumed object refs and the `hasChild` vocabulary, producing an
// empty pathway when fed real registry data. Leaving it here as a
// regression fence.
// ---------------------------------------------------------------------------

export const imaRealShapeFixture: CtdlGraph = {
    pathway: {
        '@id': `${registry}/ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf`,
        '@type': 'ceterms:Pathway',
        'ceterms:ctid': 'ce-3f9295b8-9c7d-4314-a06d-235ab8d0bfaf',
        'ceterms:name': { 'en-US': 'AI in Finance - Micro-credential' },
        'ceterms:description': {
            'en-US':
                'The AI in Finance pathway prepares accounting and finance professionals to apply artificial intelligence, machine learning, and data-driven techniques...',
        },
        'ceterms:hasPart': [
            `${registry}/ce-c606eb34-069d-4651-ac10-b6b9221c0bcd`,
            `${registry}/ce-f68dbe6b-ab7e-415a-9935-1e70f6f05d0e`,
            `${registry}/ce-ebeef825-b409-4edf-8d07-5f6c2a7f079c`,
            `${registry}/ce-345d3f0b-8ad6-4ea1-bf9b-0d6332cee131`,
            `${registry}/ce-b005c322-a40b-4e0b-8928-910e15b90e75`,
            `${registry}/ce-521c66ac-e1d2-4e67-86ff-94b2551babeb`,
            `${registry}/ce-e3a3a6a4-5c3b-4139-902d-7904227ee8c5`,
        ],
        'ceterms:hasDestinationComponent': [
            `${registry}/ce-e3a3a6a4-5c3b-4139-902d-7904227ee8c5`,
        ],
    },
    components: (() => {
        const uris = [
            'ce-c606eb34-069d-4651-ac10-b6b9221c0bcd',
            'ce-f68dbe6b-ab7e-415a-9935-1e70f6f05d0e',
            'ce-ebeef825-b409-4edf-8d07-5f6c2a7f079c',
            'ce-345d3f0b-8ad6-4ea1-bf9b-0d6332cee131',
            'ce-b005c322-a40b-4e0b-8928-910e15b90e75',
            'ce-521c66ac-e1d2-4e67-86ff-94b2551babeb',
            'ce-e3a3a6a4-5c3b-4139-902d-7904227ee8c5',
        ];

        // Synthesize plausible CredentialComponents for each URI —
        // the real registry would serve these via follow-up fetches,
        // but for a pure-import test we inline them here.
        const components: Record<string, CtdlGraph['components'][string]> = {};

        for (const [i, ctid] of uris.entries()) {
            const isDestination = i === uris.length - 1;
            components[`${registry}/${ctid}`] = {
                '@id': `${registry}/${ctid}`,
                '@type': 'ceterms:CredentialComponent',
                'ceterms:ctid': ctid,
                'ceterms:name': {
                    'en-US': isDestination
                        ? 'AI in Finance Micro-credential Certificate'
                        : `AI in Finance Badge ${i + 1}`,
                },
                'ceterms:credentialType': isDestination
                    ? 'ceterms:Certificate'
                    : 'ceterms:Badge',
            };
        }

        return components;
    })(),
};

/**
 * Deterministic UUID generator for tests. Produces UUID v4-shaped strings
 * where the "random" part is a zero-padded incrementing counter so they
 * pass `z.string().uuid()` validation AND stay readable across runs.
 */
export const makeDeterministicIds = (): (() => string) => {
    let counter = 0;

    return () => {
        counter += 1;
        const hex = counter.toString(16).padStart(12, '0');

        return `00000000-0000-4000-8000-${hex}`;
    };
};

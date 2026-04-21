import { describe, expect, it } from 'vitest';

import { extractRefIds } from '../import/ctdlTypes';
import {
    fanInFixture,
    linearFixture,
    makeDeterministicIds,
} from '../import/fixtures';
import { fromCtdlPathway } from '../import/fromCtdlPathway';
import type { Pathway } from '../types';

import { toCtdlPathway } from './toCtdlPathway';

const NOW = '2026-04-20T12:00:00.000Z';
const OWNER = 'did:key:z-test-owner';

// ---------------------------------------------------------------------------
// Basic projection
// ---------------------------------------------------------------------------

describe('toCtdlPathway', () => {
    const importFanIn = () =>
        fromCtdlPathway({
            graph: fanInFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        }).pathway;

    it('projects the root as a ceterms:Pathway with CTID preserved', () => {
        const { graph } = toCtdlPathway({ pathway: importFanIn() });

        expect(graph.pathway['@type']).toBe('ceterms:Pathway');
        expect(graph.pathway['ceterms:ctid']).toBe(
            'ce-fanin-0000-0000-0000-000000000000',
        );
    });

    it('lists every node under hasPart and the destination under hasDestinationComponent', () => {
        const pathway = importFanIn();
        const { graph } = toCtdlPathway({ pathway });

        // `hasPart` is the standard CTDL membership vocab — the
        // registry always emits it for pathway roots, and real data
        // treats the destination as a member of `hasPart` too (not
        // excluded from it). We mirror that here.
        const hasPart = graph.pathway['ceterms:hasPart'];
        const hasPartIds = Array.isArray(hasPart)
            ? hasPart
                  .map(c => (typeof c === 'string' ? c : c['@id']))
                  .filter((id): id is string => !!id)
            : [];

        expect(hasPartIds).toHaveLength(pathway.nodes.length);

        const dest = graph.pathway['ceterms:hasDestinationComponent'];

        expect(Array.isArray(dest)).toBe(true);
    });

    it('projects CredentialComponents with the right @type', () => {
        const { graph } = toCtdlPathway({ pathway: importFanIn() });
        const components = Object.values(graph.components);

        // Every node in the fan-in fixture was a Credential/Badge/Certificate,
        // so all should project back to CredentialComponent.
        expect(components.every(c => c['@type'] === 'ceterms:CredentialComponent')).toBe(
            true,
        );
    });

    it('re-uses sourceUri / sourceCtid on round-tripped nodes', () => {
        const pathway = importFanIn();
        const { graph } = toCtdlPathway({ pathway });

        for (const node of pathway.nodes) {
            // The projected component's @id should equal the node's sourceUri.
            const component = graph.components[node.sourceUri!];

            expect(component).toBeDefined();
            expect(component['ceterms:ctid']).toBe(node.sourceCtid);
        }
    });

    it('mints draft CTIDs for learner-authored nodes without provenance', () => {
        const pathway = importFanIn();

        // Strip provenance off one node to simulate a learner-authored node.
        const stripped = {
            ...pathway,
            nodes: pathway.nodes.map((n, i) =>
                i === 0 ? { ...n, sourceUri: undefined, sourceCtid: undefined } : n,
            ),
        };

        const { graph } = toCtdlPathway({ pathway: stripped });
        const components = Object.values(graph.components);
        const draft = components.find(c => c['ceterms:ctid']?.startsWith('ce-draft-'));

        expect(draft).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// Warnings on projection
// ---------------------------------------------------------------------------

describe('toCtdlPathway — warnings', () => {
    it('warns when the pathway has no destinationNodeId', () => {
        const pathway = fromCtdlPathway({
            graph: fanInFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        }).pathway;

        const noDest = { ...pathway, destinationNodeId: undefined };

        const { warnings, graph } = toCtdlPathway({ pathway: noDest });

        expect(warnings.some(w => /destination/i.test(w))).toBe(true);
        expect(graph.pathway['ceterms:hasDestinationComponent']).toBeUndefined();
    });

    it('warns when a non-prerequisite edge type is encountered', () => {
        const pathway = fromCtdlPathway({
            graph: linearFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        }).pathway;

        // Mutate one edge to a non-prerequisite type to exercise the warning.
        const withAlt = {
            ...pathway,
            edges: pathway.edges.map((e, i) =>
                i === 0 ? { ...e, type: 'alternative' as const } : e,
            ),
        };

        const { warnings } = toCtdlPathway({ pathway: withAlt });

        expect(warnings.some(w => /alternative/.test(w))).toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Round-trip: CTDL → Pathway → CTDL preserves structure
// ---------------------------------------------------------------------------

describe('toCtdlPathway — round-trip', () => {
    it('preserves the set of component CTIDs across a CTDL → Pathway → CTDL round trip', () => {
        const original = fanInFixture;
        const imported = fromCtdlPathway({
            graph: original,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

        const { graph: projected } = toCtdlPathway({ pathway: imported.pathway });

        const originalCtids = new Set(
            Object.values(original.components).map(c => c['ceterms:ctid']),
        );

        const projectedCtids = new Set(
            Object.values(projected.components).map(c => c['ceterms:ctid']),
        );

        expect(projectedCtids).toEqual(originalCtids);
    });

    it('preserves the pathway CTID across round-trip', () => {
        const imported = fromCtdlPathway({
            graph: fanInFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

        const { graph: projected } = toCtdlPathway({ pathway: imported.pathway });

        expect(projected.pathway['ceterms:ctid']).toBe(
            fanInFixture.pathway['ceterms:ctid'],
        );
    });

    it('preserves the destination across round-trip', () => {
        const imported = fromCtdlPathway({
            graph: fanInFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

        const { graph: projected } = toCtdlPathway({ pathway: imported.pathway });

        // Refs can be bare strings or {'@id': ...} objects — extractRefIds
        // normalizes both into a plain string[].
        const projectedDest = extractRefIds(
            projected.pathway['ceterms:hasDestinationComponent'],
        )[0];

        const originalDest = extractRefIds(
            fanInFixture.pathway['ceterms:hasDestinationComponent'],
        )[0];

        expect(projectedDest).toBe(originalDest);
    });

    it('preserves every component @type across round-trip (fan-in: all CredentialComponents)', () => {
        const imported = fromCtdlPathway({
            graph: fanInFixture,
            ownerDid: OWNER,
            now: NOW,
            generateId: makeDeterministicIds(),
        });

        const { graph: projected } = toCtdlPathway({ pathway: imported.pathway });

        for (const [uri, original] of Object.entries(fanInFixture.components)) {
            expect(projected.components[uri]?.['@type']).toBe(original['@type']);
        }
    });
});

// ---------------------------------------------------------------------------
// Composite projection (lossy — nested pathway export not yet supported)
// ---------------------------------------------------------------------------

describe('toCtdlPathway — composite nodes', () => {
    const OWNER = 'did:key:z-owner';
    const REF = '00000000-0000-4000-8000-00000000000a';

    const compositePathway = (): Pathway => ({
        id: '00000000-0000-4000-8000-000000000001',
        ownerDid: OWNER,
        title: 'Parent pathway',
        goal: 'Test composite export',
        nodes: [
            {
                id: '00000000-0000-4000-8000-000000000010',
                pathwayId: '00000000-0000-4000-8000-000000000001',
                title: 'Earn the nested credential',
                stage: {
                    initiation: [],
                    policy: {
                        kind: 'composite',
                        pathwayRef: REF,
                        renderStyle: 'inline-expandable',
                    },
                    termination: {
                        kind: 'pathway-completed',
                        pathwayRef: REF,
                    },
                },
                endorsements: [],
                progress: {
                    status: 'not-started',
                    artifacts: [],
                    reviewsDue: 0,
                    streak: { current: 0, longest: 0 },
                },
                createdBy: 'learner',
                createdAt: NOW,
                updatedAt: NOW,
            },
        ],
        edges: [],
        status: 'active',
        visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
        source: 'authored',
        createdAt: NOW,
        updatedAt: NOW,
    });

    it('emits composite nodes as BasicComponent (lossy fallback)', () => {
        const { graph } = toCtdlPathway({ pathway: compositePathway() });

        const component = Object.values(graph.components)[0];

        expect(component['@type']).toBe('ceterms:BasicComponent');
    });

    it('warns that the nested pathway reference is dropped', () => {
        const { warnings } = toCtdlPathway({ pathway: compositePathway() });

        // Warnings must name both the node and the referenced pathway
        // id so authors can trace exactly what was lost.
        expect(warnings.some(w => w.includes('composites pathway'))).toBe(true);
        expect(warnings.some(w => w.includes(REF))).toBe(true);
    });
});

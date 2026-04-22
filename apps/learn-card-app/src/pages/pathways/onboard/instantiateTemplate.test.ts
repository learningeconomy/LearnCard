import { describe, expect, it } from 'vitest';

import { CURATED_TEMPLATES, instantiateTemplate } from './templates';

const OWNER = 'did:test:learner';
const NOW = '2026-04-20T12:00:00.000Z';

const firstTemplate = () => CURATED_TEMPLATES[0];

describe('instantiateTemplate — learnerGoalText', () => {
    it("uses the learner's typed sentence as the pathway goal when provided", () => {
        const pathway = instantiateTemplate(firstTemplate(), {
            ownerDid: OWNER,
            now: NOW,
            learnerGoalText: 'I want to ship my first mobile game before June.',
        });

        expect(pathway.goal).toBe('I want to ship my first mobile game before June.');
        // Template stays recoverable for pattern-matching.
        expect(pathway.templateRef).toBe(firstTemplate().id);
    });

    it("falls back to the template's goal when learnerGoalText is blank or whitespace", () => {
        const blank = instantiateTemplate(firstTemplate(), {
            ownerDid: OWNER,
            now: NOW,
            learnerGoalText: '   ',
        });

        const omitted = instantiateTemplate(firstTemplate(), {
            ownerDid: OWNER,
            now: NOW,
        });

        expect(blank.goal).toBe(firstTemplate().goal);
        expect(omitted.goal).toBe(firstTemplate().goal);
    });

    it('trims surrounding whitespace from the learner goal', () => {
        const pathway = instantiateTemplate(firstTemplate(), {
            ownerDid: OWNER,
            now: NOW,
            learnerGoalText: '  Get a design job by fall.  \n',
        });

        expect(pathway.goal).toBe('Get a design job by fall.');
    });
});

describe('instantiateTemplate — destination + chosenRoute seeding', () => {
    it('resolves the template destinationSlug to a concrete destinationNodeId', () => {
        // Every curated template now names a destination; the instantiated
        // pathway should carry a concrete id that resolves to a real node.
        for (const template of CURATED_TEMPLATES) {
            const pathway = instantiateTemplate(template, {
                ownerDid: OWNER,
                now: NOW,
            });

            expect(template.destinationSlug).toBeDefined();
            expect(pathway.destinationNodeId).toBeDefined();

            const destNode = pathway.nodes.find(
                n => n.id === pathway.destinationNodeId,
            );

            expect(destNode).toBeDefined();
            // The destination slug convention points at the node bearing
            // the credentialProjection — the artifact that proves the
            // pathway. This assertion catches a future edit that points
            // destinationSlug at the wrong node.
            expect(destNode!.credentialProjection).toBeDefined();
        }
    });

    it('seeds chosenRoute ending at the destination for every curated template', () => {
        for (const template of CURATED_TEMPLATES) {
            const pathway = instantiateTemplate(template, {
                ownerDid: OWNER,
                now: NOW,
            });

            expect(pathway.chosenRoute).toBeDefined();
            expect(pathway.chosenRoute!.length).toBeGreaterThanOrEqual(2);
            expect(pathway.chosenRoute![pathway.chosenRoute!.length - 1]).toBe(
                pathway.destinationNodeId,
            );

            // Every id references a real node in the pathway.
            const nodeIds = new Set(pathway.nodes.map(n => n.id));
            for (const id of pathway.chosenRoute!) {
                expect(nodeIds.has(id)).toBe(true);
            }
        }
    });
});

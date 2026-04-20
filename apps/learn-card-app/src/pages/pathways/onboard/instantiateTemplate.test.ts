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

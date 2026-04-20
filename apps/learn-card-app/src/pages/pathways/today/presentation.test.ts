import { describe, expect, it } from 'vitest';

import type { Edge, Pathway, PathwayNode } from '../types';

import {
    buildJourney,
    getGreeting,
    identityPhrase,
    journeyLabel,
    policyCallToAction,
    policyLabel,
} from './presentation';

const NOW = '2026-04-20T12:00:00.000Z';

const node = (
    id: string,
    status: PathwayNode['progress']['status'] = 'not-started',
): PathwayNode => ({
    id,
    pathwayId: 'p1',
    title: id,
    stage: {
        initiation: [],
        policy: { kind: 'artifact', prompt: 'x', expectedArtifact: 'text' },
        termination: { kind: 'self-attest', prompt: 'done' },
    },
    endorsements: [],
    progress: {
        status,
        artifacts: [],
        reviewsDue: 0,
        streak: { current: 0, longest: 0 },
    },
    createdBy: 'learner',
    createdAt: NOW,
    updatedAt: NOW,
});

const pathway = (nodes: PathwayNode[], edges: Edge[] = []): Pathway => ({
    id: 'p1',
    ownerDid: 'did:test:learner',
    title: 'Test',
    goal: 'Test',
    nodes,
    edges,
    status: 'active',
    visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
    source: 'authored',
    createdAt: NOW,
    updatedAt: NOW,
});

// ---------------------------------------------------------------------------
// getGreeting
// ---------------------------------------------------------------------------

describe('getGreeting', () => {
    const atHour = (h: number) => {
        const d = new Date(NOW);
        d.setHours(h, 0, 0, 0);

        return d;
    };

    it('greets the morning from 5am through 11:59am', () => {
        expect(getGreeting(atHour(5))).toBe('Good morning');
        expect(getGreeting(atHour(9))).toBe('Good morning');
        expect(getGreeting(atHour(11))).toBe('Good morning');
    });

    it('greets the afternoon from noon through 4:59pm', () => {
        expect(getGreeting(atHour(12))).toBe('Good afternoon');
        expect(getGreeting(atHour(15))).toBe('Good afternoon');
        expect(getGreeting(atHour(16))).toBe('Good afternoon');
    });

    it('greets the evening from 5pm through 9:59pm', () => {
        expect(getGreeting(atHour(17))).toBe('Good evening');
        expect(getGreeting(atHour(20))).toBe('Good evening');
        expect(getGreeting(atHour(21))).toBe('Good evening');
    });

    it('uses the quiet late-night phrase from 10pm through 4:59am', () => {
        expect(getGreeting(atHour(22))).toBe('Still here');
        expect(getGreeting(atHour(23))).toBe('Still here');
        expect(getGreeting(atHour(0))).toBe('Still here');
        expect(getGreeting(atHour(3))).toBe('Still here');
        expect(getGreeting(atHour(4))).toBe('Still here');
    });
});

// ---------------------------------------------------------------------------
// buildJourney + journeyLabel
// ---------------------------------------------------------------------------

describe('buildJourney', () => {
    it('counts completed, remaining, and total across the pathway', () => {
        const p = pathway([
            node('a', 'completed'),
            node('b', 'completed'),
            node('c', 'in-progress'),
            node('d', 'not-started'),
            node('e', 'not-started'),
        ]);

        expect(buildJourney(p)).toEqual({ completed: 2, remaining: 3, total: 5 });
    });

    it('excludes skipped nodes from both completed and remaining, but keeps them in total', () => {
        const p = pathway([
            node('a', 'completed'),
            node('b', 'skipped'),
            node('c', 'not-started'),
        ]);

        expect(buildJourney(p)).toEqual({ completed: 1, remaining: 1, total: 3 });
    });

    it('returns zeros on an empty pathway', () => {
        expect(buildJourney(pathway([]))).toEqual({ completed: 0, remaining: 0, total: 0 });
    });
});

describe('journeyLabel', () => {
    it('says "First step" at the beginning of a pathway', () => {
        expect(journeyLabel({ completed: 0, remaining: 5, total: 5 })).toBe('First step');
    });

    it('says "Last one" when exactly one node remains', () => {
        expect(journeyLabel({ completed: 4, remaining: 1, total: 5 })).toBe('Last one');
    });

    it('gives a mid-pathway count when many nodes remain', () => {
        expect(journeyLabel({ completed: 2, remaining: 5, total: 7 })).toBe('2 done · 5 to go');
    });

    it('says "All done" once nothing remains and at least one node completed', () => {
        expect(journeyLabel({ completed: 5, remaining: 0, total: 5 })).toBe('All done');
    });
});

// ---------------------------------------------------------------------------
// policyLabel / policyCallToAction — sanity checks, not exhaustive
// ---------------------------------------------------------------------------

describe('policyLabel', () => {
    it('maps every policy kind to a one-word label', () => {
        expect(policyLabel('practice')).toBe('Practice');
        expect(policyLabel('review')).toBe('Recall');
        expect(policyLabel('assessment')).toBe('Check');
        expect(policyLabel('artifact')).toBe('Make');
        expect(policyLabel('external')).toBe('External');
    });
});

describe('policyCallToAction', () => {
    it('maps every policy kind to a verb-first CTA', () => {
        expect(policyCallToAction('practice')).toMatch(/^Log/);
        expect(policyCallToAction('review')).toMatch(/^Start/);
        expect(policyCallToAction('assessment')).toMatch(/^Start/);
        expect(policyCallToAction('artifact')).toMatch(/^Work/);
        expect(policyCallToAction('external')).toMatch(/^Open/);
    });
});

// ---------------------------------------------------------------------------
// identityPhrase — past-progressive framing for the "You are becoming __" line
// ---------------------------------------------------------------------------

describe('identityPhrase', () => {
    it('turns a verb-first goal into a "someone __ing __" phrase', () => {
        expect(identityPhrase('write a novel')).toBe('someone writing a novel');
        expect(identityPhrase('ship one public-facing artifact')).toBe(
            'someone shipping one public-facing artifact',
        );
        expect(identityPhrase('build a startup')).toBe('someone building a startup');
    });

    it('accepts a bare verb with no object', () => {
        expect(identityPhrase('write')).toBe('someone writing');
    });

    it('leaves goals already in identity form untouched', () => {
        expect(identityPhrase('a better writer')).toBe('a better writer');
        expect(identityPhrase('the next CEO')).toBe('the next CEO');
        expect(identityPhrase('someone who writes fiction')).toBe(
            'someone who writes fiction',
        );
        expect(identityPhrase('an effective manager')).toBe('an effective manager');
    });

    it('falls back to the raw goal when it cannot transform it grammatically', () => {
        // Not a verb in our map — we render it verbatim rather than butchering it.
        expect(identityPhrase('foo bar baz')).toBe('foo bar baz');
    });

    it('is case-insensitive on the leading verb', () => {
        expect(identityPhrase('Write a novel')).toBe('someone writing a novel');
        expect(identityPhrase('SHIP it')).toBe('someone shipping it');
    });

    it('trims whitespace and handles empty input', () => {
        expect(identityPhrase('  write a novel  ')).toBe('someone writing a novel');
        expect(identityPhrase('')).toBe('');
        expect(identityPhrase('   ')).toBe('');
    });
});

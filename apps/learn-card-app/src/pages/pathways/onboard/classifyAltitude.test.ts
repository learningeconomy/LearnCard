/**
 * Fixture-driven tests for `classifyAltitude`. The corpus is kept
 * intentionally small and pedagogical — each example maps to a
 * different altitude for a recognizable reason, so a regression in
 * the heuristic shows up immediately in the failing test name.
 *
 * When the heuristic evolves (new marker words, tighter patterns),
 * add cases here rather than tweaking production code without
 * coverage — the classifier drives *every* learner-facing altitude
 * decision downstream.
 */

import { describe, expect, it } from 'vitest';

import { classifyAltitude } from './classifyAltitude';

describe('classifyAltitude', () => {
    describe('aspiration', () => {
        const aspirationCases = [
            'I want to become an LPN',
            'prepare for technical interviews',
            'ship a portfolio piece',
            'pivot into product',
            'get hired as a data analyst',
            'become a novelist',
            'land a job in biotech',
        ];

        for (const input of aspirationCases) {
            it(`classifies "${input}" as aspiration`, () => {
                const result = classifyAltitude(input);

                expect(result.altitude).toBe('aspiration');
            });
        }

        it('treats empty input as aspiration with low confidence', () => {
            const result = classifyAltitude('');

            expect(result.altitude).toBe('aspiration');
            expect(result.confidence).toBe('low');
        });

        it('treats whitespace-only input as aspiration with low confidence', () => {
            const result = classifyAltitude('   \n\t  ');

            expect(result.altitude).toBe('aspiration');
            expect(result.confidence).toBe('low');
        });
    });

    describe('question', () => {
        const questionCases = [
            'How does neural network training work?',
            'What is conflict in fiction',
            'Why do novels have three acts?',
            'When should I start writing my thesis',
            'Is it possible to self-publish without an agent?',
            'Can you learn calculus in a month?',
            'How do I become a novelist',
        ];

        for (const input of questionCases) {
            it(`classifies "${input}" as question`, () => {
                const result = classifyAltitude(input);

                expect(result.altitude).toBe('question');
            });
        }

        it('reaches high confidence when both "?" and a WH-starter fire', () => {
            const result = classifyAltitude('What is conflict?');

            expect(result.altitude).toBe('question');
            expect(result.confidence).toBe('high');
            expect(result.signals).toEqual(
                expect.arrayContaining([
                    expect.stringContaining('?'),
                    expect.stringContaining('what'),
                ]),
            );
        });

        it('falls to medium confidence with only a WH-starter', () => {
            const result = classifyAltitude('How do I get started');

            expect(result.altitude).toBe('question');
            expect(result.confidence).toBe('medium');
        });

        it('honors a bare question mark even without a WH-starter', () => {
            const result = classifyAltitude('Neural networks?');

            expect(result.altitude).toBe('question');
            expect(result.confidence).toBe('medium');
        });
    });

    describe('action', () => {
        const actionCases = [
            'I want to write a scene today',
            'finish the draft tonight',
            'ship this feature this week',
            'review my notes tomorrow',
            'write three pages right now',
            'clean up the essay this afternoon',
            'publish the post this weekend',
        ];

        for (const input of actionCases) {
            it(`classifies "${input}" as action`, () => {
                const result = classifyAltitude(input);

                expect(result.altitude).toBe('action');
                expect(result.confidence).toBe('high');
            });
        }
    });

    describe('exploration', () => {
        const explorationCases = [
            'I\'m curious about neural networks',
            'been reading a lot of fiction lately',
            'wondering how conflict works in scenes',
            'interested in how quantum computing works',
            'exploring what makes a good essay',
            'noticing I keep coming back to the same themes',
            'been thinking about cognitive load',
        ];

        for (const input of explorationCases) {
            it(`classifies "${input}" as exploration`, () => {
                const result = classifyAltitude(input);

                expect(result.altitude).toBe('exploration');
                expect(result.confidence).toBe('high');
            });
        }
    });

    describe('precedence', () => {
        it('question beats action when both fire (question has highest precedence)', () => {
            // "Today" would trigger action, but the explicit question
            // framing ("How do I ...?") takes precedence.
            const result = classifyAltitude('How do I write a scene today?');

            expect(result.altitude).toBe('question');
        });

        it('action beats exploration when both fire', () => {
            // "curious" would trigger exploration, but the "tonight"
            // immediacy marker wins.
            const result = classifyAltitude(
                'I\'m curious about graph theory, but let me solve one problem tonight',
            );

            expect(result.altitude).toBe('action');
        });

        it('exploration beats aspiration when curiosity is the dominant signal', () => {
            // "become" is an aspiration-leaning verb, but "curious
            // about" / "lately" pull it into exploration.
            const result = classifyAltitude(
                'I\'m curious what it would take to become a novelist',
            );

            expect(result.altitude).toBe('exploration');
        });
    });

    describe('telemetry contract', () => {
        it('every classification includes at least one signal', () => {
            const inputs = [
                '',
                'become a novelist',
                'What is conflict?',
                'write a scene today',
                'curious about fiction',
            ];

            for (const input of inputs) {
                const result = classifyAltitude(input);

                expect(result.signals.length).toBeGreaterThan(0);
            }
        });

        it('is deterministic — identical input → identical output', () => {
            const input = 'How do I become a novelist?';
            const a = classifyAltitude(input);
            const b = classifyAltitude(input);

            expect(a).toEqual(b);
        });
    });
});

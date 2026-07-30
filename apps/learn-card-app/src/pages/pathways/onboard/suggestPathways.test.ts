import { describe, expect, it } from 'vitest';

import { suggestPathways } from './suggestPathways';
import { CURATED_TEMPLATES } from './templates';

describe('suggestPathways', () => {
    it('always returns at least one suggestion when templates exist (cold-start invariant)', () => {
        const suggestions = suggestPathways({ goalText: '' });

        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions[0].reasons.length).toBeGreaterThan(0);
    });

    it('respects the limit parameter', () => {
        expect(suggestPathways({ goalText: '', limit: 1 })).toHaveLength(1);
        expect(suggestPathways({ goalText: '', limit: 2 })).toHaveLength(2);
    });

    it('surfaces the interview template first for interview-shaped goals', () => {
        const suggestions = suggestPathways({
            goalText: 'I want to prepare for technical interviews',
        });

        expect(suggestions[0].template.id).toBe('tpl-interview-prep');
        expect(suggestions[0].reasons.some(r => r.includes('Matches what you wrote'))).toBe(true);
    });

    it('surfaces the portfolio template first for career-transition goals', () => {
        const suggestions = suggestPathways({
            goalText: 'help me document my transferable skills for a career change',
        });

        expect(suggestions[0].template.id).toBe('tpl-portfolio-transferable-skills');
    });

    it('surfaces the ship-artifact template first for publishing goals', () => {
        const suggestions = suggestPathways({
            goalText: 'I want to publish a side project',
        });

        expect(suggestions[0].template.id).toBe('tpl-ship-public-artifact');
    });

    it('gives a tag-overlap bonus to templates that match wallet tags', () => {
        const suggestions = suggestPathways({
            goalText: '',
            wallet: { tags: ['interview-prep'] },
        });

        expect(suggestions[0].template.id).toBe('tpl-interview-prep');
        expect(suggestions[0].reasons.some(r => r.includes('Builds on credentials'))).toBe(true);
    });

    it('is deterministic for identical inputs', () => {
        const a = suggestPathways({ goalText: 'I want to ship a portfolio piece' });
        const b = suggestPathways({ goalText: 'I want to ship a portfolio piece' });

        expect(a).toEqual(b);
    });

    it('is resilient to punctuation and case', () => {
        const a = suggestPathways({ goalText: 'Interview prep!!!' });
        const b = suggestPathways({ goalText: 'interview prep' });

        expect(a[0].template.id).toBe(b[0].template.id);
    });

    it('falls back to a plain-language baseline reason when no signals hit', () => {
        const suggestions = suggestPathways({ goalText: 'xyzzy' });

        expect(suggestions[0].reasons[0]).toContain('A good first pathway');
    });

    it('honors an injected template set (for testing)', () => {
        const sole = CURATED_TEMPLATES[0];

        const suggestions = suggestPathways({ goalText: '', templates: [sole] });

        expect(suggestions).toHaveLength(1);
        expect(suggestions[0].template.id).toBe(sole.id);
    });

    // -----------------------------------------------------------------
    // Altitude-aware ranking
    // -----------------------------------------------------------------

    describe('altitude-aware ranking', () => {
        it('surfaces the question template first when altitude is "question"', () => {
            const suggestions = suggestPathways({
                goalText: '',
                altitude: 'question',
            });

            expect(suggestions[0].template.id).toBe('tpl-follow-a-question');
            expect(suggestions[0].reasons.some(r => r.includes('following a question'))).toBe(
                true,
            );
        });

        it('surfaces the action template first when altitude is "action"', () => {
            const suggestions = suggestPathways({
                goalText: '',
                altitude: 'action',
            });

            expect(suggestions[0].template.id).toBe('tpl-capture-todays-work');
            expect(
                suggestions[0].reasons.some(r => r.includes('capturing the work')),
            ).toBe(true);
        });

        it('surfaces the exploration template first when altitude is "exploration"', () => {
            const suggestions = suggestPathways({
                goalText: '',
                altitude: 'exploration',
            });

            expect(suggestions[0].template.id).toBe('tpl-explore-and-notice');
            expect(suggestions[0].reasons.some(r => r.includes('wandering'))).toBe(true);
        });

        it('still prefers aspiration templates when altitude is "aspiration"', () => {
            const aspirationIds = new Set([
                'tpl-portfolio-transferable-skills',
                'tpl-interview-prep',
                'tpl-ship-public-artifact',
            ]);

            const suggestions = suggestPathways({
                goalText: '',
                altitude: 'aspiration',
            });

            expect(aspirationIds.has(suggestions[0].template.id)).toBe(true);
        });

        it('lets a strong keyword match override a cross-altitude default', () => {
            // Altitude is 'question' but the goal explicitly names interview
            // prep (aspiration-shaped). The explicit keyword should win so
            // we don't talk past the learner.
            const suggestions = suggestPathways({
                goalText: 'I want to prepare for technical interviews',
                altitude: 'question',
            });

            expect(suggestions[0].template.id).toBe('tpl-interview-prep');
        });

        it('omits altitude boost/penalty when altitude is undefined (backcompat)', () => {
            // Same input, once without and once with altitude. Without
            // altitude, ranking matches the legacy keyword-only behavior.
            const noAltitude = suggestPathways({
                goalText: 'I want to prepare for technical interviews',
            });

            expect(noAltitude[0].template.id).toBe('tpl-interview-prep');
            expect(
                noAltitude[0].reasons.some(r => r.startsWith('Shaped for')),
            ).toBe(false);
        });
    });
});

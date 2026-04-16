import { describe, it, expect, vi } from 'vitest';

/**
 * Mock learn-card-base so cborg (transitive dep) doesn't blow up in jsdom.
 * We only need CredentialCategoryEnum from it. The factory must be self-
 * contained because vi.mock is hoisted above all variable declarations.
 */
vi.mock('learn-card-base', () => ({
    CredentialCategoryEnum: {
        aiTopic: 'AI Topic',
        aiPathway: 'AI Pathway',
        aiInsight: 'AI Insight',
        skill: 'Skill',
        socialBadge: 'Social Badge',
        achievement: 'Achievement',
        learningHistory: 'Learning History',
        accomplishment: 'Accomplishment',
        accommodation: 'Accommodation',
        workHistory: 'Work History',
        resume: 'Resume',
        family: 'Family',
        id: 'ID',
    },
}));

import {
    ALL_CATEGORIES,
    CATEGORY_KEY_TO_VALUE,
    resolveCategoryKey,
    remapCategoryKeys,
    expandCategoryColors,
    expandPlaceholders,
} from './themeExpansion';

// ─── resolveCategoryKey ─────────────────────────────────────────────────

describe('resolveCategoryKey', () => {
    it('maps camelCase JSON key to spaced enum value', () => {
        expect(resolveCategoryKey('socialBadge')).toBe('Social Badge');
    });

    it('maps learningHistory to "Learning History"', () => {
        expect(resolveCategoryKey('learningHistory')).toBe('Learning History');
    });

    it('passes through unknown keys as-is', () => {
        expect(resolveCategoryKey('defaults')).toBe('defaults');
        expect(resolveCategoryKey('unknownKey')).toBe('unknownKey');
    });

    it('passes through keys that are already enum values', () => {
        expect(resolveCategoryKey('Social Badge')).toBe('Social Badge');
    });
});

// ─── CATEGORY_KEY_TO_VALUE ──────────────────────────────────────────────

describe('CATEGORY_KEY_TO_VALUE', () => {
    it('contains expected category keys', () => {
        const expectedKeys = [
            'aiTopic', 'aiPathway', 'aiInsight', 'skill', 'socialBadge',
            'achievement', 'learningHistory', 'accomplishment', 'accommodation',
            'workHistory', 'resume', 'family', 'id',
        ];

        for (const key of expectedKeys) {
            expect(CATEGORY_KEY_TO_VALUE).toHaveProperty(key);
        }
    });

    it('maps known keys correctly', () => {
        expect(CATEGORY_KEY_TO_VALUE['achievement']).toBe('Achievement');
        expect(CATEGORY_KEY_TO_VALUE['workHistory']).toBe('Work History');
        expect(CATEGORY_KEY_TO_VALUE['id']).toBe('ID');
    });
});

// ─── ALL_CATEGORIES ─────────────────────────────────────────────────────

describe('ALL_CATEGORIES', () => {
    it('contains all expected category values', () => {
        expect(ALL_CATEGORIES).toContain('Social Badge');
        expect(ALL_CATEGORIES).toContain('Achievement');
        expect(ALL_CATEGORIES).toContain('Work History');
        expect(ALL_CATEGORIES).toContain('ID');
        expect(ALL_CATEGORIES.length).toBe(13);
    });
});

// ─── remapCategoryKeys ──────────────────────────────────────────────────

describe('remapCategoryKeys', () => {
    it('remaps camelCase keys to enum values', () => {
        const input = {
            socialBadge: { spilledCup: { color: '#fff' } },
            achievement: { spilledCup: { color: '#000' } },
        };

        const result = remapCategoryKeys(input);

        expect(result['Social Badge']).toEqual({ spilledCup: { color: '#fff' } });
        expect(result['Achievement']).toEqual({ spilledCup: { color: '#000' } });
    });

    it('passes through non-category keys unchanged', () => {
        const input = { defaults: { spilledCup: { color: '#aaa' } } };

        const result = remapCategoryKeys(input);

        expect(result['defaults']).toEqual({ spilledCup: { color: '#aaa' } });
    });

    it('handles empty object', () => {
        expect(remapCategoryKeys({})).toEqual({});
    });
});

// ─── expandCategoryColors ───────────────────────────────────────────────

describe('expandCategoryColors', () => {
    it('applies categoryBase to all categories when no overrides', () => {
        const colors = {
            categoryBase: {
                primaryColor: 'blue-500',
                secondaryColor: 'blue-700',
            },
        };

        const result = expandCategoryColors(colors);

        for (const cat of ALL_CATEGORIES) {
            expect(result[cat]).toEqual({
                primaryColor: 'blue-500',
                secondaryColor: 'blue-700',
            });
        }
    });

    it('merges per-category overrides on top of categoryBase (camelCase key)', () => {
        const colors = {
            categoryBase: {
                primaryColor: 'blue-500',
                secondaryColor: 'blue-700',
            },
            categories: {
                socialBadge: {
                    primaryColor: 'pink-500',
                },
            },
        };

        const result = expandCategoryColors(colors);

        // Social Badge should have the override
        expect(result['Social Badge']).toEqual({
            primaryColor: 'pink-500',
            secondaryColor: 'blue-700',
        });

        // Other categories should have the base
        expect(result['Achievement']).toEqual({
            primaryColor: 'blue-500',
            secondaryColor: 'blue-700',
        });
    });

    it('merges per-category overrides using enum value as key', () => {
        const colors = {
            categoryBase: { primaryColor: 'gray-100' },
            categories: {
                'Social Badge': { primaryColor: 'red-500' },
            },
        };

        const result = expandCategoryColors(colors);

        expect(result['Social Badge']).toEqual({
            primaryColor: 'red-500',
        });
    });

    it('returns empty objects per category when no categoryBase and no overrides', () => {
        const result = expandCategoryColors({});

        for (const cat of ALL_CATEGORIES) {
            expect(result[cat]).toEqual({});
        }
    });

    it('handles overrides without a categoryBase', () => {
        const colors = {
            categories: {
                achievement: { primaryColor: 'pink-300' },
            },
        };

        const result = expandCategoryColors(colors);

        expect(result['Achievement']).toEqual({
            primaryColor: 'pink-300',
        });

        // Other categories should be empty (no base)
        expect(result['Social Badge']).toEqual({});
    });
});

// ─── expandPlaceholders ─────────────────────────────────────────────────

describe('expandPlaceholders', () => {
    it('expands placeholderBase to all categories + defaults', () => {
        const colors = {
            placeholderBase: {
                spilledCup: { backsplash: '#E2E3E9', spill: '#3B82F6', cupOutline: '#353E64' },
            },
        };

        const result = expandPlaceholders(colors);

        // Should have an entry for every category
        for (const cat of ALL_CATEGORIES) {
            expect(result[cat]).toEqual(colors.placeholderBase);
        }

        // Should also have a defaults entry
        expect(result['defaults']).toEqual(colors.placeholderBase);
    });

    it('remaps explicit placeholders keys from camelCase to enum values', () => {
        const colors = {
            placeholders: {
                socialBadge: { spilledCup: { backsplash: '#93C5FD' } },
                defaults: { spilledCup: { backsplash: '#FBCFE8' } },
            },
        };

        const result = expandPlaceholders(colors);

        expect(result['Social Badge']).toEqual({ spilledCup: { backsplash: '#93C5FD' } });
        expect(result['defaults']).toEqual({ spilledCup: { backsplash: '#FBCFE8' } });
    });

    it('prefers explicit placeholders over placeholderBase', () => {
        const colors = {
            placeholderBase: { spilledCup: { backsplash: '#AAA' } },
            placeholders: {
                socialBadge: { spilledCup: { backsplash: '#BBB' } },
            },
        };

        const result = expandPlaceholders(colors);

        // Should use explicit placeholders, not expanded base
        expect(result['Social Badge']).toEqual({ spilledCup: { backsplash: '#BBB' } });

        // Categories not in explicit placeholders should NOT be present
        // (explicit placeholders pass-through, not expanded)
        expect(result['Achievement']).toBeUndefined();
    });

    it('returns empty object when neither placeholderBase nor placeholders exist', () => {
        expect(expandPlaceholders({})).toEqual({});
    });
});

import { describe, expect, it } from 'vitest';

import { aiLocaleInstruction, aiTitleCharsetRule, resolveAiLanguage } from './aiLocale.helpers';

describe('resolveAiLanguage', () => {
    it('maps supported base languages', () => {
        expect(resolveAiLanguage('es')).toBe('Spanish');
        expect(resolveAiLanguage('fr')).toBe('French');
        expect(resolveAiLanguage('ar')).toBe('Arabic');
    });

    it('narrows a regional tag to its base language', () => {
        expect(resolveAiLanguage('es-MX')).toBe('Spanish');
        expect(resolveAiLanguage('AR-EG')).toBe('Arabic');
    });

    it('treats English, unsupported and absent locales as no-ops', () => {
        expect(resolveAiLanguage('en')).toBeNull();
        expect(resolveAiLanguage('en-US')).toBeNull();
        expect(resolveAiLanguage('de')).toBeNull();
        expect(resolveAiLanguage(undefined)).toBeNull();
        expect(resolveAiLanguage('')).toBeNull();
    });
});

describe('aiTitleCharsetRule', () => {
    // The bug this guards: asking for an A-Z title AND a Spanish/Arabic title
    // are contradictory instructions. `Álgebra` is not A-Z; Arabic has no A-Z.
    it('keeps the A-Z constraint for English and unsupported locales', () => {
        expect(aiTitleCharsetRule(undefined)).toBe('using only letters A-Z');
        expect(aiTitleCharsetRule('en')).toBe('using only letters A-Z');
        expect(aiTitleCharsetRule('de')).toBe('using only letters A-Z');
    });

    it('never asks for A-Z letters in a non-Latin or accented language', () => {
        for (const locale of ['es', 'fr', 'ar']) {
            expect(aiTitleCharsetRule(locale)).not.toContain('A-Z');
        }
    });

    it('keeps the no-digits/emoji intent when the script changes', () => {
        expect(aiTitleCharsetRule('ar')).toBe(
            'using only Arabic letters (no digits, emoji, or punctuation)'
        );
    });
});

describe('aiLocaleInstruction', () => {
    it('is empty for English and unsupported locales, leaving the prompt untouched', () => {
        expect(aiLocaleInstruction(undefined)).toBe('');
        expect(aiLocaleInstruction('en')).toBe('');
        expect(aiLocaleInstruction('de')).toBe('');
    });

    it('asks for prose in the target language', () => {
        const instruction = aiLocaleInstruction('es-419');

        expect(instruction).toContain('in Spanish');
        expect(instruction).toContain('"title"');
        expect(instruction).toContain('"description"');
        expect(instruction).toContain('"narrative"');
    });

    it('keeps validator-bound values English so strict parsing survives', () => {
        // category/type are Zod enums; translating them fails AIResponseValidator.
        const instruction = aiLocaleInstruction('ar');

        expect(instruction).toContain('do NOT translate or alter them');
        expect(instruction).toMatch(/"category".*"type"|"type".*"category"/);
    });

    it('does not contradict the title charset rule it ships alongside', () => {
        for (const locale of ['es', 'fr', 'ar']) {
            const prompt = `Generate a title ${aiTitleCharsetRule(locale)}.${aiLocaleInstruction(
                locale
            )}`;

            expect(prompt).not.toContain('A-Z');
        }
    });
});

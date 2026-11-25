import { describe, it, expect } from 'bun:test';
import { appendLocaleInstruction, getCurrentLocale, runWithLocale } from './locale';

describe('appendLocaleInstruction', () => {
    it('returns empty string for English / undefined / unknown (no behavior change)', () => {
        expect(appendLocaleInstruction(undefined)).toBe('');
        expect(appendLocaleInstruction(null)).toBe('');
        expect(appendLocaleInstruction('')).toBe('');
        expect(appendLocaleInstruction('en')).toBe('');
        expect(appendLocaleInstruction('en-US')).toBe('');
        expect(appendLocaleInstruction('zz')).toBe('');
        expect(appendLocaleInstruction('constructor')).toBe('');
        expect(appendLocaleInstruction('__proto__')).toBe('');
    });

    it('names the language for supported locales', () => {
        expect(appendLocaleInstruction('es')).toContain('Spanish');
        expect(appendLocaleInstruction('fr')).toContain('French');
        expect(appendLocaleInstruction('ar')).toContain('Arabic');
    });

    it('normalizes BCP-47 region tags (es-MX → Spanish)', () => {
        expect(appendLocaleInstruction('es-MX')).toContain('Spanish');
        expect(appendLocaleInstruction('AR')).toContain('Arabic');
    });

    it('instructs the model to keep JSON keys / enum values in English', () => {
        const instruction = appendLocaleInstruction('es');
        expect(instruction.toLowerCase()).toContain('json keys');
        expect(instruction.toLowerCase()).toContain('enum value');
    });
});

describe('locale AsyncLocalStorage context', () => {
    it('scopes the locale to the supplied callback', async () => {
        expect(getCurrentLocale()).toBeUndefined();

        const locale = await runWithLocale('fr', async () => getCurrentLocale());

        expect(locale).toBe('fr');
        expect(getCurrentLocale()).toBeUndefined();
    });

    it('isolates concurrent locale contexts', async () => {
        const [spanish, arabic] = await Promise.all([
            runWithLocale('es', async () => {
                await Bun.sleep(5);
                return getCurrentLocale();
            }),
            runWithLocale('ar', async () => {
                await Bun.sleep(1);
                return getCurrentLocale();
            }),
        ]);

        expect(spanish).toBe('es');
        expect(arabic).toBe('ar');
        expect(getCurrentLocale()).toBeUndefined();
    });

    it('normalizes empty/null to undefined', async () => {
        expect(await runWithLocale('', async () => getCurrentLocale())).toBeUndefined();
        expect(await runWithLocale(null, async () => getCurrentLocale())).toBeUndefined();
    });
});

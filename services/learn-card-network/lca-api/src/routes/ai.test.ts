import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const { generate } = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock('@environment', () => ({ environment: {} }));
vi.mock('filestack-js', () => ({ init: vi.fn() }));
vi.mock('@helpers/bedrockGeneration', () => ({
    createBedrockClient: vi.fn(() => ({})),
    generateStructuredOutput: generate,
}));
// Capture route resolvers without booting Mongo, Redis, Firebase or the HTTP server.
vi.mock('@routes', () => {
    const procedure = {
        meta: () => procedure,
        input: () => procedure,
        output: () => procedure,
        query: (resolver: unknown) => resolver,
    };
    return { t: { router: (routes: unknown) => routes }, didAndChallengeRoute: procedure };
});
import { aiRouter } from './ai';

const routes = aiRouter as unknown as Record<
    string,
    (params: { input: unknown; ctx?: unknown }) => Promise<unknown>
>;
describe('LCA generation route contracts', () => {
    it('uses Sol for boost generation and preserves locale and schema', async () => {
        const output = {
            title: 'Título',
            description: 'Descripción',
            category: 'Achievement',
            type: 'Badge',
            narrative: 'Narración',
        };
        generate.mockResolvedValueOnce(output);
        expect(
            await routes.generateBoostInfo!({ input: { description: 'Synthetic', locale: 'es' } })
        ).toEqual(output);
        const params = generate.mock.calls.at(-1)![1];
        expect(params.task).toBe('reasoning');
        expect(params.instructions).toContain('Spanish');
        expect(params.schema.parse(output)).toEqual(output);
        expect(() => params.schema.parse({ ...output, category: 'Invented' })).toThrow();
    });
    it('uses Sol for hierarchy reasoning and keeps the flattened API shape', async () => {
        generate.mockResolvedValueOnce({
            digital: [{ skill: 'cybersecurity', subskills: ['dataPrivacy'] }],
        });
        expect(await routes.generateBoostSkills!({ input: { description: 'Synthetic' } })).toEqual([
            { category: 'digital', skill: 'cybersecurity', subskills: ['dataPrivacy'] },
        ]);
        expect(generate.mock.calls.at(-1)![1].task).toBe('reasoning');
    });
    it('uses Luna for icon mapping and keeps missing-name fallback and requested-name filtering', async () => {
        generate.mockResolvedValueOnce({
            items: [
                { name: 'Typing', icon: '⌨️' },
                { name: 'Extra', icon: '🎯' },
            ],
        });
        expect(
            await routes.generateSkillIcons!({ input: { names: ['Typing', 'Planning'] } })
        ).toEqual({ Typing: '⌨️', Planning: '⭐' });
        const params = generate.mock.calls.at(-1)![1];
        expect(params.task).toBe('formatting');
        expect(() =>
            (params.schema as z.ZodType).parse({
                items: [{ name: 'Typing', icon: 'too long for icon' }],
            })
        ).toThrow();
    });
    it('propagates provider failures rather than manufacturing an icon success', async () => {
        const error = new Error('AI generation unavailable');
        generate.mockRejectedValueOnce(error);
        await expect(routes.generateSkillIcons!({ input: { names: ['Typing'] } })).rejects.toBe(
            error
        );
    });
});

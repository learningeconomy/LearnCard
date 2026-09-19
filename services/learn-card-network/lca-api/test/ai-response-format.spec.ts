import { describe, expect, it } from 'vitest';

import { boostSkillsResponseFormat } from '@helpers/aiResponseFormat.helpers';
import { BoostSkillHierarchyValidator } from 'types/skills';

const CATEGORIES = [
    'durable',
    'stem',
    'athletic',
    'creative',
    'business',
    'trade',
    'social',
    'digital',
    'medical',
];

describe('boostSkillsResponseFormat', () => {
    it('is a json_schema response format named "skills"', () => {
        expect(boostSkillsResponseFormat.type).toBe('json_schema');
        expect(boostSkillsResponseFormat.json_schema.name).toBe('skills');
        // Every category key is optional, which strict mode does not allow
        expect(boostSkillsResponseFormat.json_schema.strict).toBe(false);
    });

    // Regression: openai@4's zodResponseFormat does not understand zod 4 schemas and
    // emitted { type: 'string' }, which OpenAI rejects with a 400
    it('emits an object schema with all 9 skill categories', () => {
        const schema = boostSkillsResponseFormat.json_schema.schema as {
            type: string;
            properties: Record<string, unknown>;
        };

        expect(schema.type).toBe('object');
        expect(Object.keys(schema.properties).sort()).toEqual([...CATEGORIES].sort());
    });

    it('describes each category as an array of skill objects', () => {
        const { properties } = boostSkillsResponseFormat.json_schema.schema as {
            properties: Record<string, { type: string; items: { anyOf: unknown[] } }>;
        };

        for (const category of CATEGORIES) {
            expect(properties[category]?.type).toBe('array');
            expect(properties[category]?.items.anyOf.length).toBeGreaterThan(0);
        }
    });

    it('accepts output shaped like the schema', async () => {
        const sample = {
            stem: [{ skill: 'technology', subskills: ['coding', 'dataAnalysis'] }],
            digital: [{ skill: 'cybersecurity', subskills: ['dataPrivacy'] }],
        };

        await expect(BoostSkillHierarchyValidator.parseAsync(sample)).resolves.toEqual(sample);
    });
});

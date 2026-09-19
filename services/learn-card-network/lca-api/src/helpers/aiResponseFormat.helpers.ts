import { z } from 'zod';
import type { ResponseFormatJSONSchema } from 'openai/resources/shared';

import { BoostSkillHierarchyValidator } from 'types/skills';

/**
 * Builds an OpenAI `json_schema` response format from a zod 4 schema.
 *
 * Use this instead of `zodResponseFormat` from `openai/helpers/zod`: the openai@4 helper only
 * understands zod 3 and silently emits `{ type: 'string' }` for zod 4 schemas, which OpenAI
 * rejects with a 400.
 *
 * `strict` defaults to false because strict mode requires every property to be required, and
 * our schemas commonly use optional keys.
 */
export const zodJsonSchemaResponseFormat = (
    schema: z.ZodType,
    name: string,
    { strict = false }: { strict?: boolean } = {}
): ResponseFormatJSONSchema => ({
    type: 'json_schema',
    json_schema: {
        name,
        strict,
        schema: z.toJSONSchema(schema) as Record<string, unknown>,
    },
});

export const boostSkillsResponseFormat = zodJsonSchemaResponseFormat(
    BoostSkillHierarchyValidator,
    'skills'
);

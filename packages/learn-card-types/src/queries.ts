import { z } from 'zod';

// Helper to extract flags and pattern from regex string
const parseRegexString = (regexStr: string) => {
    const match = regexStr.match(/^\/(.*)\/([gimsuy]*)$/);
    if (!match) throw new Error('Invalid RegExp string format');
    return { pattern: match[1], flags: match[2] };
};

const withStringOverride = <T extends z.ZodTypeAny>(schema: T): T => {
    const metaSchema = schema as T & {
        meta?: (metadata: { override: { type: 'string' } }) => T;
    };

    if (typeof metaSchema.meta === 'function') {
        return metaSchema.meta({ override: { type: 'string' } });
    }

    return schema;
};

// TRPC validator that converts Regex strings into RegExps
const RegExpStringValidator = z
    .string()
    .refine(
        str => {
            try {
                parseRegexString(str);
                return true;
            } catch {
                return false;
            }
        },
        {
            message: "Invalid RegExp string format. Must be in format '/pattern/flags'",
        }
    )
    .transform(str => {
        const { pattern, flags } = parseRegexString(str);

        try {
            return new RegExp(pattern, flags);
        } catch (error) {
            throw new Error(`Invalid RegExp: ${(error as Error).message}`);
        }
    });

export const RegExpValidator = withStringOverride(z.instanceof(RegExp).or(RegExpStringValidator));

const BaseStringQuery = z
    .string()
    .or(z.object({ $in: z.string().array() }))
    .or(z.object({ $regex: RegExpValidator }));

export const StringQuery = z.union([
    BaseStringQuery,
    z.object({
        $or: BaseStringQuery.array(),
    }),
]);

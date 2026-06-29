import { z } from 'zod';

// Helper to extract flags and pattern from regex string
const parseRegexString = (regexStr: string) => {
    const match = regexStr.match(/^\/(.*)\/([gimsuy]*)$/);
    if (!match) throw new Error('Invalid RegExp string format');
    return { pattern: match[1], flags: match[2] };
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
    })
    .meta({ override: { type: 'string' } });

// Do not use z.instanceof(RegExp) here: it is a `custom` Zod type that crashes
// zod-openapi document generation at service boot, and `.meta({ override })` is
// not honored for custom types. Coercing a RegExp to its `/source/flags` string
// keeps the OpenAPI schema a plain string while still accepting RegExp inputs.
export const RegExpValidator = z.preprocess(
    value => (value instanceof RegExp ? `/${value.source}/${value.flags}` : value),
    RegExpStringValidator
);

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

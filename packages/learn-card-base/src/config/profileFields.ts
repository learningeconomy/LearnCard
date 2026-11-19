import { z } from 'zod';
const identifier = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,63}$/);
const fieldCategory =
    /^VerifiableData:([a-zA-Z][a-zA-Z0-9_-]{0,63}):([a-zA-Z][a-zA-Z0-9_-]{0,63}):([a-zA-Z][a-zA-Z0-9_-]{0,63})$/;

const common = z.object({
    label: z.string().trim().min(1),
    maxAgeDays: z.number().int().positive().optional(),
});
export const profileFieldSchema = z.discriminatedUnion('type', [
    common.extend({ type: z.literal('text') }),
    common.extend({ type: z.literal('date') }),
    common.extend({
        type: z.literal('select'),
        values: z
            .array(z.union([z.string().trim().min(1), z.object({ type: z.literal('custom') })]))
            .min(1)
            .refine(values => values.filter(value => typeof value !== 'string').length <= 1, {
                message: 'A field can have only one custom option.',
            }),
    }),
]);
export type ProfileField = z.infer<typeof profileFieldSchema>;
export const profileSchemasValidator = z.record(
    identifier,
    z.object({
        label: z.string().trim().min(1),
        fields: z.record(identifier, profileFieldSchema),
    })
);

/** Resolve only fields explicitly configured by the active tenant. */
export const resolveProfileField = (
    category: string,
    tenant: string,
    schemas: z.infer<typeof profileSchemasValidator>
) => {
    const match = fieldCategory.exec(category);
    if (!match || match[1] !== tenant || !Object.prototype.hasOwnProperty.call(schemas, match[2]!))
        return undefined;
    const schema = schemas[match[2]!]!;
    return Object.prototype.hasOwnProperty.call(schema.fields, match[3]!)
        ? schema.fields[match[3]!]
        : undefined;
};

export const validProfileAnswer = (field: ProfileField, value: unknown): value is string => {
    if (typeof value !== 'string' || !value.trim() || value.length > 512) return false;
    if (field.type === 'select')
        return field.values.some(option => typeof option !== 'string' || option === value);
    if (field.type === 'date') return z.iso.date().safeParse(value).success;
    return true;
};

/** Preserve index keys used by existing skill profiles when tenants omit an override. */
export const legacyProfileDataKeys: Readonly<Record<string, string>> = {
    Goals: 'skill-profile-goals',
    'Professional Title': 'skill-profile-professional-title',
    'Role Experience': 'skill-profile-role-experience',
    'Work Experience': 'skill-profile-work-history',
    'Pay Rate': 'skill-profile-salary',
    'Work Life Balance': 'skill-profile-work-life-balance',
    'Job Stability': 'skill-profile-job-stability',
};

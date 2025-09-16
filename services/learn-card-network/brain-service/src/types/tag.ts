import { z } from 'zod';

export const TagValidator = z.object({
    id: z.string(),
    name: z.string().min(1),
    slug: z.string().min(1),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export type TagType = z.infer<typeof TagValidator>;
export const FlatTagValidator = TagValidator;
export type FlatTagType = z.infer<typeof FlatTagValidator>;

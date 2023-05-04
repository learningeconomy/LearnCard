import { z } from 'zod';

export const PaginationOptionsValidator = z.object({
    limit: z.number(),
    cursor: z.string().optional(),
});
export type PaginationOptionsType = z.infer<typeof PaginationOptionsValidator>;

export const PaginationResponseValidator = z.object({
    cursor: z.string().optional(),
    hasMore: z.boolean(),
});
export type PaginationResponseType = z.infer<typeof PaginationResponseValidator>;

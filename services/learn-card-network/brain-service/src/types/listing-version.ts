import { z } from 'zod';

export const ListingVersionValidator = z.object({
    version_id: z.string(),
    version: z.string(),
    status: z.string(),
    manifest_json: z.string().optional(),
    publisher_did: z.string().optional(),
    signature: z.string().optional(),
    review_snapshot_json: z.string().optional(),
    created_at: z.string(),
});
export type ListingVersionType = z.infer<typeof ListingVersionValidator>;

export const ListingVersionCreateValidator = ListingVersionValidator.omit({
    version_id: true,
    created_at: true,
}).extend({
    version_id: z.string().optional(),
    created_at: z.string().optional(),
});
export type ListingVersionCreateType = z.infer<typeof ListingVersionCreateValidator>;

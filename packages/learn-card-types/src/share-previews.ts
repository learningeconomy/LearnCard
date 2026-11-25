import { z } from 'zod/v4';

/** Public metadata for an explicitly published credential share preview. */
const HttpsImageUrlValidator = z
    .string()
    .url()
    .max(2048)
    // No server-side fetch is performed; HTTPS is required to avoid mixed-content images.
    .refine(value => {
        try {
            return new URL(value).protocol === 'https:';
        } catch {
            return false;
        }
    }, 'image must be an HTTPS URL');

/** Public metadata for an explicitly published credential share preview. */
export const CredentialSharePreviewValidator = z
    .object({
        name: z.string().min(1).max(160),
        issuer: z.string().min(1).max(160),
        image: HttpsImageUrlValidator.optional(),
    })
    .strict();
export type CredentialSharePreview = z.infer<typeof CredentialSharePreviewValidator>;

/** Input for an authenticated publish/refresh; shareUri is opaque and never returned publicly. */
export const PublishCredentialSharePreviewValidator = CredentialSharePreviewValidator.extend({
    shareUri: z.string().min(1).max(4096),
    id: z.string().uuid().optional(),
}).strict();
export type PublishCredentialSharePreview = z.infer<typeof PublishCredentialSharePreviewValidator>;
export const CredentialSharePreviewIdValidator = z.string().uuid();

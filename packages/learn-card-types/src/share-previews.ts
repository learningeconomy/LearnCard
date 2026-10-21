import { z } from 'zod/v4';

/** Public metadata for an explicitly published credential share preview. */
export const CredentialSharePreviewValidator = z
    .object({
        name: z.string().min(1).max(160),
        issuer: z.string().min(1).max(160),
        image: z
            .string()
            .url()
            .max(2048)
            .refine(value => {
                try {
                    const url = new URL(value);
                    const host = url.hostname.toLowerCase();
                    return (
                        url.protocol === 'https:' &&
                        host !== 'localhost' &&
                        !host.endsWith('.localhost') &&
                        !host.endsWith('.local') &&
                        !/^127\./.test(host) &&
                        !/^10\./.test(host) &&
                        !/^192\.168\./.test(host) &&
                        !/^172\.(1[6-9]|2\d|3[01])\./.test(host)
                    );
                } catch {
                    return false;
                }
            }, 'image must be a public HTTPS URL')
            .optional(),
    })
    .strict();
export type CredentialSharePreview = z.infer<typeof CredentialSharePreviewValidator>;
export const CredentialSharePreviewIdValidator = z.string().uuid();

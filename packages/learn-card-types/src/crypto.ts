import { z } from 'zod';

export const JWKValidator = z.object({
    kty: z.string(),
    crv: z.string(),
    x: z.string(),
    y: z.string().optional(),
    d: z.string(),
});
export type JWK = z.infer<typeof JWKValidator>;

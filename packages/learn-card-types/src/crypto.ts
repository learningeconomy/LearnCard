import { z } from 'zod';

export const JWKValidator = z.object({
    kty: z.string(),
    crv: z.string(),
    x: z.string(),
    y: z.string().optional(),
    n: z.string().optional(),
    d: z.string().optional(),
});
export type JWK = z.infer<typeof JWKValidator>;

export const JWKWithPrivateKeyValidator = JWKValidator.omit({ d: true }).extend({ d: z.string() });
export type JWKWithPrivateKey = z.infer<typeof JWKWithPrivateKeyValidator>;

export const JWERecipientHeaderValidator = z.object({
    alg: z.string(),
    iv: z.string(),
    tag: z.string(),
    epk: JWKValidator.partial().optional(),
    kid: z.string().optional(),
    apv: z.string().optional(),
    apu: z.string().optional(),
});
export type JWERecipientHeader = z.infer<typeof JWERecipientHeaderValidator>;

export const JWERecipientValidator = z.object({
    header: JWERecipientHeaderValidator,
    encrypted_key: z.string(),
});
export type JWERecipient = z.infer<typeof JWERecipientValidator>;

export const JWEValidator = z.object({
    protected: z.string(),
    iv: z.string(),
    ciphertext: z.string(),
    tag: z.string(),
    aad: z.string().optional(),
    recipients: JWERecipientValidator.array().optional(),
});
export type JWE = z.infer<typeof JWEValidator>;

export const VC_V1_CONTEXT = 'https://www.w3.org/2018/credentials/v1';
export const VC_V2_CONTEXT = 'https://www.w3.org/ns/credentials/v2';

/**
 * Pick the VP envelope's base `@context` from the credentials it embeds.
 *
 * Both VC context versions mark their terms `@protected`, so embedding a
 * v2-context credential inside a v1-context presentation (or vice versa)
 * fails JSON-LD expansion with "Protected term redefinition" during
 * Linked-Data proof signing. Matching the envelope to the embedded
 * credentials avoids the clash: any v2 credential → v2 envelope
 * (v2 processors must accept v1 objects per VCDM 2.0 §B.2), else v1.
 */
export const vpBaseContextFor = (credentials: readonly unknown[]): string => {
    const usesV2 = credentials.some(credential => {
        if (!credential || typeof credential !== 'object') return false;

        const ctx = (credential as Record<string, unknown>)['@context'];
        const list = Array.isArray(ctx) ? ctx : [ctx];

        return list.some(c => typeof c === 'string' && c.includes('/ns/credentials/v2'));
    });

    return usesV2 ? VC_V2_CONTEXT : VC_V1_CONTEXT;
};

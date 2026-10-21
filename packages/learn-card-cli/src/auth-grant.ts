import type { AuthGrantType } from '@learncard/types';

/**
 * `actAs` on an auth grant: `'*'` = the token may act as any managed profile,
 * a comma-separated list of profileIds = only those profiles, absent = the
 * token may not act as anyone (deny-by-default).
 */
export type AuthGrantWithActAs = Partial<AuthGrantType>;

/** Coerces `null` / `''` from the wire to `undefined` so drift checks compare like with like. */
export const getGrantActAs = (grant: Partial<AuthGrantType>): string | undefined =>
    grant.actAs || undefined;

/** `'*'` -> "any managed profile"; `'a,b'` -> "a, b"; absent -> "no delegation". */
export const describeActAs = (actAs: string | undefined): string => {
    if (!actAs) return 'no delegation';
    if (actAs === '*') return 'any managed profile';
    return actAs.split(',').filter(Boolean).join(', ');
};

/** Order- and whitespace-insensitive form for drift checks: `'b, a'` and `'a,b'` are the same policy. */
export const normalizeActAs = (actAs: string | undefined): string | undefined => {
    if (!actAs) return undefined;
    if (actAs.trim() === '*') return '*';
    const ids = [
        ...new Set(
            actAs
                .split(',')
                .map(id => id.trim())
                .filter(Boolean)
        ),
    ].sort();
    return ids.length ? ids.join(',') : undefined;
};

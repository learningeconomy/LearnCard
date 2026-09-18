import type { AuthGrantType } from '@learncard/types';

/**
 * `actAs` on an auth grant: `'*'` = the token may act as any managed profile,
 * a comma-separated list of profileIds = only those profiles, absent = the
 * token may not act as anyone (deny-by-default).
 */
export type AuthGrantWithActAs = Partial<AuthGrantType>;

export const getGrantActAs = (grant: Partial<AuthGrantType>): string | undefined => grant.actAs;

/** `'*'` -> "any managed profile"; `'a,b'` -> "a, b"; absent -> "no delegation". */
export const describeActAs = (actAs: string | undefined): string => {
    if (!actAs) return 'no delegation';
    if (actAs === '*') return 'any managed profile';
    return actAs.split(',').filter(Boolean).join(', ');
};

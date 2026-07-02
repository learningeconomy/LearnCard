import { describe, expect, it } from 'vitest';

import { resolveEcosystemId } from '@helpers/ecosystem.helpers';

describe('resolveEcosystemId', () => {
    it('prefers the explicit ecosystemId when present', () => {
        expect(resolveEcosystemId('eco_explicit', { ecosystemId: 'eco_tenant' })).toBe(
            'eco_explicit'
        );
    });

    it('falls back to the tenant ecosystem binding when no explicit id is given', () => {
        expect(resolveEcosystemId(undefined, { ecosystemId: 'eco_tenant' })).toBe('eco_tenant');
    });

    it('returns undefined when neither source provides an id', () => {
        expect(resolveEcosystemId(undefined, undefined)).toBeUndefined();
        expect(resolveEcosystemId(undefined, {})).toBeUndefined();
    });
});

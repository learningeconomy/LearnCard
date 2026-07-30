import { describe, expect, it } from 'vitest';

import { EN_DEFAULTS } from './index';

describe('shared SDK lifecycle translations', () => {
    it('provides standalone English defaults for lifecycle labels', () => {
        expect(EN_DEFAULTS['credential.lifecycle.revoked']).toBe('Revoked');
        expect(EN_DEFAULTS['credential.lifecycle.suspended']).toBe('Suspended');
    });
});

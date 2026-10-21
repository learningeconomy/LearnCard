import { describe, expect, it } from 'vitest';

import { createPreAuthEmailPayload } from './preAuthEmail';

describe('createPreAuthEmailPayload', () => {
    it('includes the active locale with the recipient email', () => {
        expect(createPreAuthEmailPayload('scout@example.org', 'fr')).toEqual({
            email: 'scout@example.org',
            locale: 'fr',
        });
    });
});

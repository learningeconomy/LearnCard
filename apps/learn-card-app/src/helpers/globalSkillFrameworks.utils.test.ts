import { describe, expect, it } from 'vitest';

import { isProductionBrainService } from './globalSkillFrameworks.utils';

describe('isProductionBrainService', () => {
    it('returns true for a production brain-service host', () => {
        expect(isProductionBrainService('https://network.learncard.com/trpc')).toBe(true);
    });

    it('returns false for a staging brain-service host', () => {
        expect(isProductionBrainService('https://staging.network.learncard.com/trpc')).toBe(false);
    });

    it('returns false for localhost', () => {
        expect(isProductionBrainService('http://localhost:4000/trpc')).toBe(false);
    });

    it('returns false for malformed URLs', () => {
        expect(isProductionBrainService('not-a-valid-url')).toBe(false);
    });

    it('trims whitespace and matches hosts case-insensitively', () => {
        expect(isProductionBrainService('  https://NETWORK.LEARNCARD.COM/trpc  ')).toBe(true);
    });
});

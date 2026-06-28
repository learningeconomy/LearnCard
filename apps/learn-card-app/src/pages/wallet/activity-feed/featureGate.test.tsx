import { describe, it, expect } from 'vitest';

const shouldShowActivityFeed = (flags?: Record<string, unknown>) =>
    Boolean(flags?.enablePassportActivityFeed);

describe('Passport activity feed gate', () => {
    it('is hidden when the flag is absent or false', () => {
        expect(shouldShowActivityFeed(undefined)).toBe(false);
        expect(shouldShowActivityFeed({})).toBe(false);
        expect(shouldShowActivityFeed({ enablePassportActivityFeed: false })).toBe(false);
    });
    it('is shown when the flag is true', () => {
        expect(shouldShowActivityFeed({ enablePassportActivityFeed: true })).toBe(true);
    });
});

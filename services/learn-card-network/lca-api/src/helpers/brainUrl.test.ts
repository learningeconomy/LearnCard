import { describe, expect, it } from 'vitest';
import { getBrainOpenApiBase } from './brainUrl';

describe('getBrainOpenApiBase', () => {
    it.each(['', '/', '/api', '/api/', '/trpc', '/trpc/'])(
        'normalizes the endpoint suffix %j',
        suffix => {
            expect(getBrainOpenApiBase(`https://brain.test${suffix}`)).toBe(
                'https://brain.test/api'
            );
        }
    );
});

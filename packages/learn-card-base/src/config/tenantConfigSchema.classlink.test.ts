import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { tenantFeatureConfigSchema } from './tenantConfigSchema';

describe('ClassLink tenant feature flags', () => {
    it('defaults both flags to false', () => {
        const features = tenantFeatureConfigSchema.parse({});

        expect(features.classlinkSso).toBe(false);
        expect(features.classlinkTranscriptOptIn).toBe(false);
    });

    it('rejects non-boolean values', () => {
        expect(() => tenantFeatureConfigSchema.parse({ classlinkSso: 'yes' })).toThrow(ZodError);
        expect(() => tenantFeatureConfigSchema.parse({ classlinkTranscriptOptIn: 'yes' })).toThrow(
            ZodError
        );
    });

    it('accepts true for both flags', () => {
        const features = tenantFeatureConfigSchema.parse({
            classlinkSso: true,
            classlinkTranscriptOptIn: true,
        });

        expect(features.classlinkSso).toBe(true);
        expect(features.classlinkTranscriptOptIn).toBe(true);
    });
});

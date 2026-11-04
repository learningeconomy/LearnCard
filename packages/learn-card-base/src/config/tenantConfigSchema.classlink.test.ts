import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';
import { tenantFeatureConfigSchema, tenantLinksConfigSchema } from './tenantConfigSchema';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from './tenantDefaults';

describe('ClassLink tenant feature flags', () => {
    it('defaults both flags to false', () => {
        const features = tenantFeatureConfigSchema.parse({});

        expect(features.classlinkSso).toBe(false);
        expect(features.classlinkTranscriptOptIn).toBe(false);
        expect(features.schoolConnect).toBe(false);
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

describe('School Connect tenant settings', () => {
    it('accepts a support email and rejects anything else', () => {
        expect(tenantLinksConfigSchema.parse({ supportEmail: 'help@example.org' })).toMatchObject({
            supportEmail: 'help@example.org',
        });
        expect(() => tenantLinksConfigSchema.parse({ supportEmail: 'not-an-email' })).toThrow(
            ZodError
        );
    });

    it('defaults School Connect off with a support email to request schools', () => {
        expect(DEFAULT_LEARNCARD_TENANT_CONFIG.features.schoolConnect).toBe(false);
        expect(DEFAULT_LEARNCARD_TENANT_CONFIG.links.supportEmail).toBe(
            'support@learningeconomy.io'
        );
    });
});

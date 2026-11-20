import { describe, expect, it } from 'vitest';
import { isReferralOutcomeUri } from './referral-outcome-uri.helpers';

describe('referral outcome storage URI validation', () => {
    it.each([
        'lc:network:example.org/trpc:credential:abc_123-xyz',
        'lc:network:localhost:4000/brain/trpc:credential:abc',
        'lc:network:localhost%3A4000/trpc:credential:abc',
        'lc:cloud:cloud.example.org:credential:abc',
        'lc:cloud:localhost%3A4000:credential:abc',
    ])('accepts %s', uri => {
        expect(isReferralOutcomeUri(uri)).toBe(true);
    });

    it.each([
        'other:network:example.org/trpc:credential:abc',
        'lc:other:example.org/trpc:credential:abc',
        'lc:network:example.org/trpc:boost:abc',
        'lc:network:example.org:credential:abc',
        'lc:network:example.org/trpc:credential:abc:extra',
        'lc:cloud:example.org:credential:abc:extra',
        'lc:cloud:example.org:credential:abc\n',
        'lc:cloud:example.org:credential:abc ',
        'lc:cloud:example.org:credential:',
        `lc:cloud:example.org:credential:${'a'.repeat(129)}`,
        `lc:network:${'a'.repeat(2048)}/trpc:credential:abc`,
    ])('rejects %s', uri => {
        expect(isReferralOutcomeUri(uri)).toBe(false);
    });
});

import { describe, expect, it } from 'vitest';

import {
    assertPresentationMetadataRecipient,
    PresentationMetadataValidator,
} from '../src/helpers/presentation-metadata';

const metadata = {
    type: 'learncard.share-link.v1',
    shareId: 'A'.repeat(22),
    title: 'Career highlights',
    note: 'Selected credentials',
    sharer: { profileId: 'alex', displayName: 'Alex' },
};

describe('saved share presentation metadata', () => {
    it('accepts bounded self-save labels and preserves generic callers', () => {
        expect(PresentationMetadataValidator.safeParse(metadata).success).toBe(true);
        expect(() => assertPresentationMetadataRecipient(metadata, 'me', 'me')).not.toThrow();
        expect(PresentationMetadataValidator.safeParse({ category: 'course' }).success).toBe(true);
    });

    it('rejects spoofed labels sent to another recipient', () => {
        expect(() =>
            assertPresentationMetadataRecipient(metadata, 'attacker', 'recipient')
        ).toThrow();
    });

    it('rejects oversized, malformed or remote-avatar metadata', () => {
        expect(
            PresentationMetadataValidator.safeParse({ ...metadata, title: 'x'.repeat(121) }).success
        ).toBe(false);
        expect(
            PresentationMetadataValidator.safeParse({
                ...metadata,
                avatar: 'https://attacker/pixel.png',
            }).success
        ).toBe(false);
        expect(
            PresentationMetadataValidator.safeParse({
                ...metadata,
                sharer: { ...metadata.sharer, avatar: 'https://attacker/pixel.png' },
            }).success
        ).toBe(false);
        expect(PresentationMetadataValidator.safeParse({ other: 'x'.repeat(4097) }).success).toBe(
            false
        );
    });
});

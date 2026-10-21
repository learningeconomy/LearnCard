import { describe, expect, it } from 'vitest';
import { CredentialSharePreviewValidator } from './share-previews';

describe('credential share preview contract', () => {
    it('accepts bounded public metadata with optional HTTPS image', () => {
        expect(
            CredentialSharePreviewValidator.parse({
                name: 'Course certificate',
                issuer: 'Example',
                image: 'https://cdn.example/image.png',
            })
        ).toEqual({
            name: 'Course certificate',
            issuer: 'Example',
            image: 'https://cdn.example/image.png',
        });
        expect(
            CredentialSharePreviewValidator.parse({ name: 'Course certificate', issuer: 'Example' })
        ).toEqual({ name: 'Course certificate', issuer: 'Example' });
    });

    it('rejects additional credential fields, oversized text, and non-HTTPS images', () => {
        expect(
            CredentialSharePreviewValidator.safeParse({
                name: 'Badge',
                issuer: 'Issuer',
                credential: { id: 'private' },
            }).success
        ).toBe(false);
        expect(
            CredentialSharePreviewValidator.safeParse({ name: 'x'.repeat(161), issuer: 'Issuer' })
                .success
        ).toBe(false);
        expect(
            CredentialSharePreviewValidator.safeParse({
                name: 'Badge',
                issuer: 'Issuer',
                image: 'http://example.com/image.png',
            }).success
        ).toBe(false);
    });
});

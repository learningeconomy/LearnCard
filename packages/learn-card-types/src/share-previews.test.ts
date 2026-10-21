import { describe, expect, it } from 'vitest';

import {
    PublishCredentialSharePreviewValidator,
    CredentialSharePreviewValidator,
} from './share-previews';

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

    it('requires a bounded opaque URI only for publishing', () => {
        expect(
            PublishCredentialSharePreviewValidator.parse({
                name: 'Badge',
                issuer: 'Issuer',
                shareUri: 'urn:encrypted:opaque',
                id: '5b58ff0c-bb55-4f25-a2a5-b4de3778c649',
            })
        ).toEqual({
            name: 'Badge',
            issuer: 'Issuer',
            shareUri: 'urn:encrypted:opaque',
            id: '5b58ff0c-bb55-4f25-a2a5-b4de3778c649',
        });
        expect(
            CredentialSharePreviewValidator.safeParse({
                name: 'Badge',
                issuer: 'Issuer',
                shareUri: 'urn:encrypted:opaque',
            }).success
        ).toBe(false);
        expect(
            PublishCredentialSharePreviewValidator.safeParse({
                name: 'Badge',
                issuer: 'Issuer',
                shareUri: '',
            }).success
        ).toBe(false);
    });
});

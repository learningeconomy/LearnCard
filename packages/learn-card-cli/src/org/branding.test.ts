import { describe, expect, it } from 'vitest';
import { brandingDiff } from './apply';
import { brandingSchema } from './schema';

describe('brandingSchema', () => {
    it('accepts https images and hex colours', () => {
        expect(
            brandingSchema.safeParse({
                image: 'https://cdn.example.org/logo.png',
                display: { accentColor: '#2E7D32' },
                type: 'organization',
            }).success
        ).toBe(true);
    });

    it('rejects a local path with a hint about hosting the image', () => {
        const result = brandingSchema.safeParse({ image: './assets/logo.png' });
        expect(result.success).toBe(false);
        expect(JSON.stringify(result.error?.issues)).toContain('not uploaded yet');
    });

    it('rejects non-hex colours and unknown display keys', () => {
        expect(brandingSchema.safeParse({ display: { accentColor: 'green' } }).success).toBe(false);
        expect(brandingSchema.safeParse({ display: { borderColor: '#000000' } }).success).toBe(
            false
        );
    });
});

describe('brandingDiff', () => {
    const existing = {
        image: 'https://cdn.example.org/old.png',
        websiteLink: 'https://ed.example.gov',
        display: { backgroundColor: '#111111', fontColor: '#FFFFFF' },
    };

    it('reports nothing when every spec field already matches', () => {
        const { changed } = brandingDiff(
            { websiteLink: 'https://ed.example.gov', display: { fontColor: '#FFFFFF' } },
            existing
        );
        expect(changed).toEqual([]);
    });

    it('only sends changed scalars and merges display instead of replacing it', () => {
        const { update, changed } = brandingDiff(
            {
                image: 'https://cdn.example.org/new.png',
                websiteLink: 'https://ed.example.gov',
                display: { accentColor: '#2E7D32' },
            },
            existing
        );
        expect(changed).toEqual(['image', 'display.accentColor']);
        expect(update).toEqual({
            image: 'https://cdn.example.org/new.png',
            display: { backgroundColor: '#111111', fontColor: '#FFFFFF', accentColor: '#2E7D32' },
        });
    });
});

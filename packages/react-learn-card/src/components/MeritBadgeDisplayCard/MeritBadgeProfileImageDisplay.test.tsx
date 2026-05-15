// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import MeritBadgeProfileImageDisplay from './MeritBadgeProfileImageDisplay';

describe('MeritBadgeProfileImageDisplay', () => {
    test('uses a 43px silhouette for the issuee badge fallback', () => {
        const { container } = render(
            <MeritBadgeProfileImageDisplay size="big" userName="" imageUrl="" />
        );

        const silhouette = container.querySelector('svg');

        expect(silhouette).not.toBeNull();
        expect(silhouette?.classList.contains('h-[43px]')).toBe(true);
        expect(silhouette?.classList.contains('w-[43px]')).toBe(true);
    });

    test('uses a 28px silhouette for the issuer badge fallback', () => {
        const { container } = render(
            <MeritBadgeProfileImageDisplay size="small" showSeal userName="" imageUrl="" />
        );

        const silhouettes = container.querySelectorAll('svg');
        const silhouette = silhouettes[silhouettes.length - 1];

        expect(silhouette).not.toBeNull();
        expect(silhouette?.classList.contains('h-[28px]')).toBe(true);
        expect(silhouette?.classList.contains('w-[28px]')).toBe(true);
    });
});

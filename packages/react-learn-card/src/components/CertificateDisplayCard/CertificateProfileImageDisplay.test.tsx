// @vitest-environment jsdom

import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import CertificateProfileImageDisplay from './CertificateProfileImageDisplay';

describe('CertificateProfileImageDisplay', () => {
    test('uses a 38px silhouette for the issuee badge fallback', () => {
        const { container } = render(<CertificateProfileImageDisplay imageUrl="" userName="" />);

        const silhouette = container.querySelector('svg');

        expect(silhouette).not.toBeNull();
        expect(silhouette?.classList.contains('h-[38px]')).toBe(true);
        expect(silhouette?.classList.contains('w-[38px]')).toBe(true);
    });

    test('uses a 36px fingerprint for the issuee badge fallback', () => {
        const { container } = render(
            <CertificateProfileImageDisplay
                imageUrl=""
                userName=""
                avatarFallbackVariant="fingerprint"
            />
        );

        const fingerprint = container.querySelector('svg');

        expect(fingerprint).not.toBeNull();
        expect(fingerprint?.classList.contains('h-[36px]')).toBe(true);
        expect(fingerprint?.classList.contains('w-[36px]')).toBe(true);
    });

    test('uses a 38px silhouette for the issuer badge fallback', () => {
        const { container } = render(
            <CertificateProfileImageDisplay imageUrl="" isIssuer userName="" />
        );

        const silhouettes = container.querySelectorAll('svg');
        const silhouette = silhouettes[silhouettes.length - 1];

        expect(silhouette).not.toBeNull();
        expect(silhouette?.classList.contains('h-[38px]')).toBe(true);
        expect(silhouette?.classList.contains('w-[38px]')).toBe(true);
    });

    test('uses a 38px fingerprint for the issuer badge fallback', () => {
        const { container } = render(
            <CertificateProfileImageDisplay
                imageUrl=""
                isIssuer
                userName=""
                avatarFallbackVariant="fingerprint"
            />
        );

        const fingerprints = container.querySelectorAll('svg');
        const fingerprint = fingerprints[fingerprints.length - 1];

        expect(fingerprint).not.toBeNull();
        expect(fingerprint?.classList.contains('h-[38px]')).toBe(true);
        expect(fingerprint?.classList.contains('w-[38px]')).toBe(true);
    });
});

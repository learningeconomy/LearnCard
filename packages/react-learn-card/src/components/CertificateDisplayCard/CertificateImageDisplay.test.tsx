// @vitest-environment jsdom

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import CertificateImageDisplay from './CertificateImageDisplay';

// The broken-image placeholder is the only element with the text-grayscale-400 class.
const PLACEHOLDER_SELECTOR = '.text-grayscale-400';
const THUMBNAIL_SELECTOR = 'img[alt="certificate thumbnail"]';

describe('CertificateImageDisplay broken-image fallback', () => {
    test('renders the thumbnail when a valid src is provided', () => {
        const { container } = render(
            <CertificateImageDisplay imageUrl="https://example.com/badge.png" />
        );

        expect(container.querySelector(THUMBNAIL_SELECTOR)).not.toBeNull();
        expect(container.querySelector(PLACEHOLDER_SELECTOR)).toBeNull();
    });

    test('shows the placeholder glyph when the image fails to load (404)', () => {
        const { container } = render(
            <CertificateImageDisplay imageUrl="https://example.com/broken.png" />
        );

        const img = container.querySelector(THUMBNAIL_SELECTOR);
        expect(img).not.toBeNull();

        fireEvent.error(img!);

        expect(container.querySelector(THUMBNAIL_SELECTOR)).toBeNull();
        expect(container.querySelector(PLACEHOLDER_SELECTOR)).not.toBeNull();
    });

    test('shows the placeholder glyph immediately when imageUrl is empty', () => {
        const { container } = render(<CertificateImageDisplay imageUrl="" />);

        expect(container.querySelector(THUMBNAIL_SELECTOR)).toBeNull();
        expect(container.querySelector(PLACEHOLDER_SELECTOR)).not.toBeNull();
    });
});
